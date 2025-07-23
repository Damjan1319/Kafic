const {PrismaClient} = require('../generated/prisma');

const prisma = new PrismaClient();

class Order {
    // Get all orders with items
    static async getOrders(waiterId = null) {
        let whereClause = {};
        if (waiterId) {
            whereClause = {
                OR: [
                    {waiter_id: parseInt(waiterId)},
                    {status: 'pending'},
                ],
            };
        }

        const orders = await prisma.orders.findMany({
            where: whereClause,
            include: {
                tables: {
                    select: {table_number: true},
                },
                waiters: {
                    select: {name: true},
                },
                order_items: true,
            },
            orderBy: {created_at: 'desc'},
        });

        // Map to match original structure (e.g., waiter_name instead of waiters.name)
        return orders.map(order => ({
            ...order,
            table_number: order.tables?.table_number,
            waiter_name: order.waiters?.name,
            items: order.order_items,
            tables: undefined, // Clean up included objects
            waiters: undefined,
            order_items: undefined,
        }));
    }

    // Get order by ID
    static async getOrderById(id) {
        const order = await prisma.orders.findUnique({
            where: {id: parseInt(id)},
            include: {
                tables: {
                    select: {table_number: true},
                },
                waiters: {
                    select: {name: true},
                },
                order_items: true,
            },
        });

        if (!order) {
            return null;
        }

        // Map to match original structure
        return {
            ...order,
            table_number: order.tables?.table_number,
            waiter_name: order.waiters?.name,
            items: order.order_items,
            tables: undefined,
            waiters: undefined,
            order_items: undefined,
        };
    }

    /**
     * Creates a new order for a given table with the specified items and total price.
     * @param {string|number} tableId - The ID of the table.
     * @param {Array<{id: number, name: string, price: number, quantity: number}>} items - The items to include in the order.
     * @param {number} totalPrice - The total price of the order.
     * @returns {Promise<object>} The created order with transformed structure.
     * @throws {Error} If the table is not found or if the transaction fails.
     */
    static async createOrder(tableId, items, totalPrice) {
        return prisma.$transaction(async (tx) => {
            // Validate tableId
            const parsedTableId = parseInt(tableId);
            if (isNaN(parsedTableId) || parsedTableId <= 0) {
                throw new Error(`Invalid table ID: ${tableId}`);
            }

            // Get current order count for table
            const table = await tx.tables.findUnique({
                where: {id: parsedTableId},
                select: {current_order_count: true, table_number: true},
            });

            if (!table) {
                throw new Error(`Table with ID ${tableId} not found`);
            }

            const orderNumber = (table.current_order_count || 0) + 1;

            // Create order
            const order = await tx.orders.create({
                data: {
                    table_id: parsedTableId,
                    order_number: orderNumber,
                    total_price: Number(totalPrice),
                    status: 'pending',
                },
            });

            // Insert order items
            const createdItems = [];
            for (const item of items) {
                const createdItem = await tx.order_items.create({
                    data: {
                        order_id: order.id,
                        item_id: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: Number(item.quantity),
                    },
                });
                createdItems.push(createdItem);
            }

            // Update table order count
            await tx.tables.update({
                where: {id: parsedTableId},
                data: {current_order_count: orderNumber},
            });

            // Return the order with transformed structure
            return {
                id: order.id,
                table_id: order.table_id,
                order_number: order.order_number,
                total_price: order.total_price,
                status: order.status,
                table_number: table.table_number,
                waiter_name: null, // Set to null as waiter_id is not assigned in this method
                items: createdItems.map(item => ({
                    id: item.item_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
            };
        });
    }

    // Update order status
    static async updateOrderStatus(orderId, status, waiterId = null) {
        const updateData = {status};
        if (waiterId) {
            updateData.waiter_id = parseInt(waiterId);
        }

        await prisma.orders.update({
            where: {id: parseInt(orderId)},
            data: updateData,
        });

        return await Order.getOrderById(orderId);
    }

    // Delete order
    static async deleteOrder(orderId) {
        await prisma.$transaction(async (tx) => {
            // Delete dependent order_items first (since no cascade in schema)
            await tx.order_items.deleteMany({
                where: {order_id: parseInt(orderId)},
            });

            // Then delete the order
            await tx.orders.delete({
                where: {id: parseInt(orderId)},
            });
        });

        return {message: 'Order deleted successfully'};
    }
}

module.exports = Order;