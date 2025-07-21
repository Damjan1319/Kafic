const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class Stats {
    // Get statistics
    static async getStatistics() {
        // Product statistics
        const productStats = await prisma.order_items.groupBy({
            by: ['name'],
            _sum: {
                quantity: true,
                price: true, // We'll calculate revenue in code since it's price * quantity
            },
            _count: {
                order_id: true,
            },
            where: {
                orders: {
                    status: {not: null}, // Assuming we include all orders, adjust if needed
                },
            },
        });

        // Transform to match original: totalQuantity, totalRevenue, orders
        const transformedProductStats = productStats.map(stat => ({
            name: stat.name,
            totalQuantity: stat._sum.quantity || 0,
            totalRevenue: (stat._sum.quantity || 0) * (stat._sum.price || 0),
            orders: stat._count.order_id || 0,
        }));

        // Waiter statistics
        const waiterStats = await prisma.waiters.findMany({
            where: {role: 'waiter'},
            select: {
                id: true,
                name: true,
                orders: {
                    where: {status: {in: ['approved', 'completed']}},
                    select: {
                        id: true,
                        total_price: true,
                        order_items: {
                            select: {quantity: true},
                        },
                    },
                },
            },
            orderBy: {name: 'asc'},
        });

        // Transform to match original
        const transformedWaiterStats = waiterStats.map(waiter => ({
            id: waiter.id,
            name: waiter.name,
            ordersHandled: waiter.orders.length,
            totalRevenue: waiter.orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0),
            itemsSold: waiter.orders.reduce((orderSum, order) =>
                orderSum + order.order_items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0),
        }));

        // Overall statistics
        const overallStats = await prisma.orders.aggregate({
            _count: {id: true},
            _sum: {total_price: true},
            _avg: {total_price: true},
            where: {},
        });

        const pendingCount = await prisma.orders.count({where: {status: 'pending'}});
        const completedCount = await prisma.orders.count({where: {status: 'completed'}});

        const transformedOverallStats = {
            totalOrders: overallStats._count.id || 0,
            totalRevenue: parseFloat(overallStats._sum.total_price || 0),
            averageOrderValue: parseFloat(overallStats._avg.total_price || 0),
            pendingOrders: pendingCount,
            completedOrders: completedCount,
        };

        return {
            productStats: transformedProductStats,
            waiterStats: transformedWaiterStats,
            overallStats: transformedOverallStats,
        };
    }

    // Get waiter shift statistics
    static async getWaiterShiftStats(waiterId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Product statistics for today
        const productStats = await prisma.order_items.groupBy({
            by: ['name'],
            _sum: {
                quantity: true,
                price: true,
            },
            _count: {
                order_id: true,
            },
            where: {
                orders: {
                    waiter_id: parseInt(waiterId),
                    status: {in: ['approved', 'completed']},
                    created_at: {gte: startOfDay, lt: endOfDay},
                },
            },
            orderBy: {_sum: {quantity: 'desc'}},
        });

        const transformedProductStats = productStats.map(stat => ({
            name: stat.name,
            quantitySold: stat._sum.quantity || 0,
            totalRevenue: (stat._sum.quantity || 0) * (stat._sum.price || 0),
            orders: stat._count.order_id || 0,
        }));

        // Order stats
        const orderStats = await prisma.orders.aggregate({
            _count: {id: true},
            _sum: {total_price: true},
            _avg: {total_price: true},
            where: {
                waiter_id: parseInt(waiterId),
                status: {in: ['approved', 'completed']},
                created_at: {gte: startOfDay, lt: endOfDay},
            },
        });

        // Item stats
        const itemStats = await prisma.order_items.aggregate({
            _sum: {quantity: true},
            where: {
                orders: {
                    waiter_id: parseInt(waiterId),
                    status: {in: ['approved', 'completed']},
                    created_at: {gte: startOfDay, lt: endOfDay},
                },
            },
        });

        return {
            productStats: transformedProductStats,
            totalOrders: orderStats._count.id || 0,
            totalRevenue: parseFloat(orderStats._sum.total_price || 0),
            averageOrderValue: parseFloat(orderStats._avg.total_price || 0),
            totalItems: itemStats._sum.quantity || 0,
        };
    }

    // Get shift statistics (alias for getWaiterShiftStats)
    static async getShiftStats(waiterId) {
        return await Stats.getWaiterShiftStats(waiterId);
    }

    // Get or create today's statistics for waiter
    static async getOrCreateTodayStats(waiterId) {
        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const existingStats = await prisma.waiter_statistics.findUnique({
            where: {
                waiter_id_date: {
                    waiter_id: parseInt(waiterId),
                    date: todayDate,
                },
            },
        });

        if (existingStats) {
            return existingStats;
        }

        const now = new Date();

        const newStats = await prisma.waiter_statistics.create({
            data: {
                waiter_id: parseInt(waiterId),
                date: todayDate,
                shift_start: now,
                total_orders: 0,
                total_revenue: 0,
                items_sold: [],
            },
        });

        return newStats;
    }

    // Update waiter statistics when order is approved
    static async updateWaiterStats(waiterId, orderData) {
        const stats = await Stats.getOrCreateTodayStats(waiterId);

        // Merge items
        const existingItems = stats.items_sold || [];
        const newItems = orderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
        }));
        const mergedItems = [...existingItems, ...newItems];

        // Calculate totals
        const totalRevenue = parseFloat(stats.total_revenue) + parseFloat(orderData.total_price);
        const totalOrders = stats.total_orders + 1;

        // Update
        const updatedStats = await prisma.waiter_statistics.update({
            where: {id: stats.id},
            data: {
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                items_sold: mergedItems,
                updated_at: new Date(),
            },
        });

        return {
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            items_sold: mergedItems,
        };
    }

    // Get waiter statistics for today (current shift)
    static async getWaiterTodayStats(waiterId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Product stats
        const productStats = await prisma.order_items.groupBy({
            by: ['name'],
            _sum: {
                quantity: true,
                price: true,
            },
            _count: {
                order_id: true,
            },
            where: {
                orders: {
                    waiter_id: parseInt(waiterId),
                    status: {in: ['approved', 'completed']},
                    created_at: {gte: startOfDay, lt: endOfDay},
                },
            },
            orderBy: {_sum: {quantity: 'desc'}},
        });

        const transformedProductStats = productStats.map(stat => ({
            name: stat.name,
            quantitySold: stat._sum.quantity || 0,
            totalRevenue: (stat._sum.quantity || 0) * (stat._sum.price || 0),
            orders: stat._count.order_id || 0,
        }));

        // Order stats
        const orderStats = await prisma.orders.aggregate({
            _count: {id: true},
            _sum: {total_price: true},
            _avg: {total_price: true},
            where: {
                waiter_id: parseInt(waiterId),
                status: {in: ['approved', 'completed']},
                created_at: {gte: startOfDay, lt: endOfDay},
            },
        });

        // Item stats
        const itemStats = await prisma.order_items.aggregate({
            _sum: {quantity: true},
            where: {
                orders: {
                    waiter_id: parseInt(waiterId),
                    status: {in: ['approved', 'completed']},
                    created_at: {gte: startOfDay, lt: endOfDay},
                },
            },
        });

        // Get stats record
        const stats = await Stats.getOrCreateTodayStats(waiterId);

        return {
            total_orders: orderStats._count.id || 0,
            total_revenue: parseFloat(orderStats._sum.total_price || 0),
            average_order_value: parseFloat(orderStats._avg.total_price || 0),
            total_items: itemStats._sum.quantity || 0,
            product_stats: transformedProductStats,
            shift_start: stats.shift_start,
            date: stats.date,
        };
    }

    // Reset waiter statistics (end shift)
    static async resetWaiterStats(waiterId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        await prisma.$transaction(async (tx) => {
            // Delete order_items for today's orders by this waiter
            const todaysOrders = await tx.orders.findMany({
                where: {
                    waiter_id: parseInt(waiterId),
                    created_at: {gte: startOfDay, lt: endOfDay},
                },
                select: {id: true},
            });

            const orderIds = todaysOrders.map(o => o.id);

            if (orderIds.length > 0) {
                await tx.order_items.deleteMany({
                    where: {order_id: {in: orderIds}},
                });

                // Delete orders
                await tx.orders.deleteMany({
                    where: {id: {in: orderIds}},
                });
            }

            // Delete waiter statistics for today
            await tx.waiter_statistics.deleteMany({
                where: {
                    waiter_id: parseInt(waiterId),
                    date: startOfDay,
                },
            });
        });

        const now = new Date();
        return {success: true, reset_time: now};
    }

    // Get historical statistics for waiter
    static async getWaiterHistoricalStats(waiterId, days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const rows = await prisma.waiter_statistics.findMany({
            where: {
                waiter_id: parseInt(waiterId),
                date: {gte: cutoffDate},
            },
            orderBy: {date: 'desc'},
        });

        return rows;
    }
}

module.exports = Stats;