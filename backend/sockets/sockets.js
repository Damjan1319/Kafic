const socketIo = require('socket.io');
const logger = require('../utils/logger');

const initializeSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type'],
        },
    });

    // Socket.IO event handlers
    io.on('connection', (socket) => {
        logger.info('User connected to socket', {socketId: socket.id});

        // Join table-specific room
        socket.on('join-table', (tableId) => {
            if (typeof tableId === 'string' || typeof tableId === 'number') {
                socket.join(`table-${tableId}`);
                logger.info('User joined table room', {socketId: socket.id, tableId});
            } else {
                logger.warn('Invalid tableId for join-table', {socketId: socket.id, tableId});
            }
        });

        // Leave table-specific room
        socket.on('leave-table', (tableId) => {
            if (typeof tableId === 'string' || typeof tableId === 'number') {
                socket.leave(`table-${tableId}`);
                logger.info('User left table room', {socketId: socket.id, tableId});
            } else {
                logger.warn('Invalid tableId for leave-table', {socketId: socket.id, tableId});
            }
        });

        // Handle new order events (for CustomerMenu)
        socket.on('new-order', (order) => {
            console.log('rrr')
            if (!order || !order.orderId || !order.tableId) {
                logger.warn('Invalid newOrder event data', {socketId: socket.id, order});
                return;
            }
            logger.info('New order received', {socketId: socket.id, order});
            io.to('waiter').emit('newOrder', order); // Notify waiters
            io.to(`table-${order.tableId}`).emit('orderUpdate', order); // Notify table-specific clients
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected from socket', {socketId: socket.id});
        });
    });

    return io;
};

module.exports = {initializeSocket};