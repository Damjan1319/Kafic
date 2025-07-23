const {PrismaClient} = require('../generated/prisma');

const prisma = new PrismaClient();

class Waiter {
    // Get all waiters
    static async getWaiters() {
        return prisma.waiters.findMany();
    }

    // Get waiter by username
    static async getWaiterByUsername(username) {
        return prisma.waiters.findUnique({
            where: {username},
        });
    }

    // Get waiter by ID
    static async getWaiterById(id) {
        return prisma.waiters.findUnique({
            where: {id: parseInt(id)}, // Ensure ID is an integer
        });
    }
}

module.exports = Waiter;