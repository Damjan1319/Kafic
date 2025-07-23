require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const {PrismaClient} = require('./generated/prisma');
const {initializeSocket} = require("./sockets/sockets");
const routes = require("./routes/routes");

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
});

/* ---------- middleware ---------- */
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true}));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', true);

/* ---------- REST routes ---------- */
app.use('/api', routes(io));

/* ---------- Socket.IO initialization ---------- */
initializeSocket(io);

/* ---------- central error handler ---------- */
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
});

/* ---------- boot strap ---------- */
async function start() {
    console.log('Syncing database schema with Prisma...');
    const port = process.env.PORT || 3003;
    server.listen(port, () => console.log(`🚀 API + WS on ${port}`));
}

if (require.main === module) start();

// Graceful shutdown for Prisma
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await prisma.$disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = {app, io, prisma};