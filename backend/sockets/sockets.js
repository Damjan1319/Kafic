const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const initializeSocket = (io) => {
    // Socket.IO authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers.cookie?.match(/token=([^;]*)/)?.[1];
        if (!token) return next(new Error('unauthorized'));
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            socket.userId = payload.id;
            socket.role = payload.role;
            next();
        } catch {
            next(new Error('unauthorized'));
        }
    });

    // Socket.IO event handlers
    io.on('connection', (socket) => {
        console.log(`Socket ${socket.id} connected (user ${socket.userId})`);
        socket.join(`user-${socket.userId}`); // Personal room
        socket.join(socket.role); // e.g., "waiter", "kitchen", "admin"

        socket.on('join-table', (tableId) => socket.join(`table-${tableId}`));
        socket.on('leave-table', (tableId) => socket.leave(`table-${tableId}`));

        socket.on('disconnect', () => console.log(`Socket ${socket.id} disconnected`));
    });

    io.on('connection', (socket) => {
        logger.info('User connected to socket', {socketId: socket.id});

        socket.on('disconnect', () => {
            logger.info('User disconnected from socket', {socketId: socket.id});
        });
    });
};

module.exports = {initializeSocket};