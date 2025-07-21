const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

class MenuItem {
    static async findAvailable() {
        return prisma.menu_items.findMany({
            where: {
                available: true,
            }, orderBy: [{category: 'asc'}, {name: 'asc'},],
        });
    }

    // Get all menu items
    static async getMenuItems() {
        return prisma.menu_items.findMany({
            where: {available: true}, orderBy: [{category: 'asc'}, {name: 'asc'},],
        });
    }

    // Add new menu item
    static async addMenuItem(itemData) {
        const stock = itemData.initialStock || 0;
        return prisma.menu_items.create({
            data: {
                name: itemData.name,
                category: itemData.category,
                price: itemData.price,
                description: itemData.description,
                stock,
            },
        });
    }

    // Get inventory (menu items with stock)
    static async getInventory() {
        return prisma.menu_items.findMany({
            select: {
                id: true, name: true, category: true, price: true, description: true, stock: true,
            }, orderBy: [{category: 'asc'}, {name: 'asc'},],
        });
    }

    // Update inventory stock
    static async updateInventoryStock(itemId, newStock) {
        await prisma.menu_items.update({
            where: {id: parseInt(itemId)}, data: {stock: newStock},
        });
        return {success: true};
    }

    // Decrease inventory when order is approved
    static async decreaseInventory(orderItems) {
        for (const item of orderItems) {
            if (!item.item_id) {
                continue;
            }
            await prisma.menu_items.update({
                where: {id: item.item_id}, data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }
        return {success: true};
    }
}

module.exports = MenuItem;