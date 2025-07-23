const {PrismaClient} = require('../generated/prisma');

const prisma = new PrismaClient();

class Table {
    // Get all tables
    static async getTables() {
        return prisma.tables.findMany();
    }

    // Get table by QR code
    static async getTableByQRCode(qrCode) {
        return prisma.tables.findUnique({
            where: {qr_code: qrCode},
        });
    }

    // Get table by number
    static async getTableByNumber(tableNumber) {
        return prisma.tables.findUnique({
            where: {table_number: parseInt(tableNumber)},
        });
    }

    // Get tables with order details
    static async getTablesWithOrders() {
        try {
            const tables = await prisma.tables.findMany({
                orderBy: [
                    {location: 'asc'},
                    {table_number: 'asc'},
                ],
                include: {
                    orders: {
                        where: {
                            status: {in: ['pending', 'approved']},
                        },
                        include: {
                            waiters: {
                                select: {name: true},
                            },
                            order_items: true,
                        },
                        orderBy: {created_at: 'desc'},
                    },
                },
            });

            for (let table of tables) {
                table.pendingOrders = table?.orders.filter(o => o.status === 'pending');
                table.approvedOrders = table?.orders.filter(o => o.status === 'approved');
                table.totalOrders = table?.orders.length;
            }

            return tables;
        } catch (error) {
            console.error(error)
            return [];
        }
    }

    // Get tables positions view (for interactive map)
    static async getTablesPositionsView() {
        return prisma.tables.findMany({
            select: {
                id: true,
                table_number: true,
                x_position: true,
                y_position: true,
                location: true,
                current_order_count: true,
            },
            orderBy: {table_number: 'asc'},
        });
    }

    static async getTablesWithPositions() {
        return prisma.tables.findMany({
            orderBy: [
                {location: 'asc'},
                {table_number: 'asc'}
            ]
        });
    }

    // Update table position
    static async updateTablePosition(id, x, y) {
        return prisma.tables.update({
            where: {id: parseInt(id)},
            data: {
                x_position: parseInt(x),
                y_position: parseInt(y),
            },
        });
    }

    // Create new table
    static async createTable(tableNumber, xPosition, yPosition, location = 'indoor') {
        const qrCode = `table_${tableNumber}_${Date.now()}`;
        const newTable = await prisma.tables.create({
            data: {
                table_number: parseInt(tableNumber),
                qr_code: qrCode,
                x_position: parseInt(xPosition),
                y_position: parseInt(yPosition),
                location,
            },
        });
        return newTable.id;
    }

    // Set default table positions
    static async setDefaultTablePositions() {
        try {
            // Find all tables where x_position=0 and y_position=0
            const tables = await prisma.tables.findMany({
                where: {
                    x_position: 0,
                    y_position: 0,
                },
            });

            if (tables.length > 0) {
                console.log('Postavljam default pozicije za stolove...');
                let indoorIndex = 0;
                let outdoorIndex = 0;
                for (let i = 0; i < tables.length; i++) {
                    const table = tables[i];
                    let x, y;
                    if (table.location === 'indoor') {
                        // Unutrašnji stolovi - grid
                        const row = Math.floor(indoorIndex / 4);
                        const col = indoorIndex % 4;
                        x = 100 + (col * 120);
                        y = 100 + (row * 120);
                        indoorIndex++;
                    } else {
                        // Spoljašnji stolovi - krug
                        const angle = (outdoorIndex * 45) * (Math.PI / 180);
                        x = 400 + Math.cos(angle) * 150;
                        y = 300 + Math.sin(angle) * 150;
                        outdoorIndex++;
                    }
                    await prisma.tables.update({
                        where: {id: table.id},
                        data: {
                            x_position: Math.round(x),
                            y_position: Math.round(y),
                        },
                    });
                }
                console.log('Default pozicije stolova postavljene');
            }
        } catch (error) {
            console.error('Greška pri postavljanju default pozicija:', error);
        }
    }
}

module.exports = Table;