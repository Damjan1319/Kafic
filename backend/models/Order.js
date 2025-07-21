const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Order {
    // Get all orders with items
    static async getOrders(waiterId = null) {
        let whereClause = {};
        if (waiterId) {
            whereClause = {
                OR: [
                    { waiter_id: parseInt(waiterId) },
                    { status: 'pending' },
                ],
            };
        }

        const orders = await prisma.orders.findMany({
            where: whereClause,
            include: {
                tables: {
                    select: { table_number: true },
                },
                waiters: {
                    select: { name: true },
                },
                order_items: true,
            },
            orderBy: { created_at: 'desc' },
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
            where: { id: parseInt(id) },
            include: {
                tables: {
                    select: { table_number: true },
                },
                waiters: {
                    select: { name: true },
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

    // Create new order
    static async createOrder(tableId, items, totalPrice) {
        return await prisma.$transaction(async (tx) => {
            // Get current order count for table
            const table = await tx.tables.findUnique({
                where: { id: parseInt(tableId) },
                select: { current_order_count: true },
            });

            const orderNumber = (table.current_order_count || 0) + 1;

            // Create order
            const order = await tx.orders.create({
                data: {
                    table_id: parseInt(tableId),
                    order_number: orderNumber,
                    total_price: totalPrice,
                    status: 'pending',
                },
            });

            // Insert order items
            for (const item of items) {
                await tx.order_items.create({
                    data: {
                        order_id: order.id,
                        item_id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    },
                });
            }

            // Update table order count
            await tx.tables.update({
                where: { id: parseInt(tableId) },
                data: { current_order_count: orderNumber },
            });

            // Return the created order (fetched outside transaction for consistency)
            return await Order.getOrderById(order.id);
        });
    }

    // Update order status
    static async updateOrderStatus(orderId, status, waiterId = null) {
        const updateData = { status };
        if (waiterId) {
            updateData.waiter_id = parseInt(waiterId);
        }

        await prisma.orders.update({
            where: { id: parseInt(orderId) },
            data: updateData,
        });

        return await Order.getOrderById(orderId);
    }

    // Delete order
    static async deleteOrder(orderId) {
        await prisma.$transaction(async (tx) => {
            // Delete dependent order_items first (since no cascade in schema)
            await tx.order_items.deleteMany({
                where: { order_id: parseInt(orderId) },
            });

            // Then delete the order
            await tx.orders.delete({
                where: { id: parseInt(orderId) },
            });
        });

        return { message: 'Order deleted successfully' };
    }
}

module.exports = Order;