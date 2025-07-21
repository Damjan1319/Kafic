const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

class Waiter {
    // Get all waiters
    static async getWaiters() {
        return await prisma.waiters.findMany();
    }

    // Get waiter by username
    static async getWaiterByUsername(username) {
        return await prisma.waiters.findUnique({
            where: {username},
        });
    }

    // Get waiter by ID
    static async getWaiterById(id) {
        return await prisma.waiters.findUnique({
            where: {id: parseInt(id)}, // Ensure ID is an integer
        });
    }
}

module.exports = Waiter;