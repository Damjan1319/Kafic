/**
 * Cafe Ordering System - Backend Server
 * 
 * Ova aplikacija omogućava:
 * - Real-time porudžbine kroz Socket.IO
 * - JWT autentifikaciju sa HttpOnly cookie-ima
 * - MySQL bazu podataka za trajno čuvanje podataka
 * - Admin panel za upravljanje menijem i stolovima
 * - Konobar dashboard za upravljanje porudžbinama
 * - QR kod sistem za pristup meniju po stolovima
 * 
 * Tehnologije: Express.js, Socket.IO, MySQL, JWT, bcrypt
 * Autor: Damjan Programing
 * Verzija: 1.0.0
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database
const { pool, dbHelpers, initDatabase, createTable } = require('./database-mysql');

// Import validation
const { validateOrderData, validateLoginData, validateTableData } = require('./utils/validation');

// Import logger
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use(logger.logRequest.bind(logger));

// Waiters data (will be loaded from database)
let waiters = [];

// Load waiters from database on startup
const loadWaiters = async () => {
  try {
    waiters = await dbHelpers.getWaiters();
    console.log('Waiters loaded from database');
  } catch (error) {
    console.error('Error loading waiters:', error);
  }
};

// Initialize database and load waiters on startup
(async () => {
  try {
    await initDatabase();
    await loadWaiters();

    // Create waiter statistics table
    try {
      await dbHelpers.createWaiterStatsTable();
      console.log('Waiter statistics table initialized successfully');
    } catch (error) {
      console.error('Error creating waiter statistics table:', error);
    }



    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Error initializing server:', error);
    process.exit(1);
  }
})();

// Menu items will be loaded from database
let menuItems = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header as fallback
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Validate token endpoint
app.get('/api/validate-token', authenticateToken, async (req, res) => {
  try {
    // Get full user data from database
    const waiter = await dbHelpers.getWaiterById(req.user.id);
    if (!waiter) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: waiter.id,
        username: waiter.username,
        name: waiter.name,
        role: waiter.role
      }
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user endpoint (for frontend to check if user is logged in)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    // Get full user data from database
    const waiter = await dbHelpers.getWaiterById(req.user.id);
    if (!waiter) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: waiter.id,
        username: waiter.username,
        name: waiter.name,
        role: waiter.role
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Routes

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate login data
  const validationErrors = validateLoginData(req.body);
  if (validationErrors.length > 0) {
    logger.warn('Login validation failed', { username, errors: validationErrors });
    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
  }

  try {
    const waiter = await dbHelpers.getWaiterByUsername(username);
    if (!waiter || !bcrypt.compareSync(password, waiter.password)) {
      logger.warn('Login failed - invalid credentials', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: waiter.id, username: waiter.username, role: waiter.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Set HttpOnly cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Return user data without token
    res.json({
      user: {
        id: waiter.id,
        username: waiter.username,
        name: waiter.name,
        role: waiter.role
      }
    });

  } catch (error) {
    logger.error('Login error', { username, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
});

// Get menu items
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await dbHelpers.getMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get table info by QR code
app.get('/api/table/:qrCode', async (req, res) => {
  try {
    const table = await dbHelpers.getTableByQRCode(req.params.qrCode);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order (public endpoint for customers)
app.post('/api/orders', async (req, res) => {
  const { table_id, items, total_price } = req.body;

  // Validate order data
  const validationErrors = validateOrderData(req.body);
  if (validationErrors.length > 0) {
    logger.warn('Order validation failed', { table_id, errors: validationErrors });
    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
  }

  try {
    const newOrder = await dbHelpers.createOrder(table_id, items, total_price);

    // Log order creation
    logger.logOrder(newOrder, 'created');

    // Emit to waiters
    io.emit('new_order', newOrder);

    res.json(newOrder);
  } catch (error) {
    logger.error('Error creating order', { table_id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders for waiter
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    // If user is waiter, only show their orders or pending orders
    // If user is admin, show all orders
    const waiterId = req.user.role === 'waiter' ? req.user.id : null;
    const orders = await dbHelpers.getOrders(waiterId);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (public endpoint for testing)
app.get('/api/all-orders', async (req, res) => {
  try {
    const orders = await dbHelpers.getOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  const { status } = req.body;

  try {
    // Get current order to check if it's already approved
    const currentOrder = await dbHelpers.getOrderById(parseInt(req.params.id));
    if (!currentOrder) {
      logger.warn('Order not found for update', { orderId: req.params.id, userId: req.user.id });
      return res.status(404).json({ error: 'Order not found' });
    }

    const wasAlreadyApproved = currentOrder.status === 'approved';
    const wasAlreadyCompleted = currentOrder.status === 'completed';
    console.log(`Order ${currentOrder.id} current status: ${currentOrder.status}, new status: ${status}, wasAlreadyApproved: ${wasAlreadyApproved}, wasAlreadyCompleted: ${wasAlreadyCompleted}`);

    const order = await dbHelpers.updateOrderStatus(
      parseInt(req.params.id),
      status,
      (status === 'approved' || status === 'completed') ? req.user.id : null
    );

    if (!order) {
      logger.warn('Order not found for update', { orderId: req.params.id, userId: req.user.id });
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update waiter statistics if order is approved or completed (and wasn't already approved)
    console.log(`=== STATISTICS UPDATE CHECK START ===`);
    console.log(`User role: ${req.user.role}`);
    console.log(`User ID: ${req.user.id}`);
    console.log(`Status: ${status}`);
    console.log(`Is waiter: ${req.user.role === 'waiter'}`);
    console.log(`Is approved or completed: ${status === 'approved' || status === 'completed'}`);

    if ((status === 'approved' || status === 'completed') && req.user.role === 'waiter') {
      // For completed orders, we need to check if it was already completed
      const wasAlreadyCompleted = currentOrder.status === 'completed';
      const shouldUpdateStats = !wasAlreadyApproved || (status === 'completed' && !wasAlreadyCompleted);

      console.log(`=== STATISTICS UPDATE CHECK ===`);
      console.log(`Waiter ID: ${req.user.id}`);
      console.log(`Order ID: ${order.id}`);
      console.log(`Status: ${status}`);
      console.log(`Was already approved: ${wasAlreadyApproved}`);
      console.log(`Was already completed: ${wasAlreadyCompleted}`);
      console.log(`Should update stats: ${shouldUpdateStats}`);

      if (shouldUpdateStats) {
        try {
          console.log(`=== CALLING updateWaiterStats ===`);
          console.log(`Waiter ID: ${req.user.id}`);
          console.log(`Order data:`, JSON.stringify(order, null, 2));

          await dbHelpers.updateWaiterStats(req.user.id, order);
          console.log(`=== STATISTICS UPDATED SUCCESSFULLY ===`);
          logger.info('Updated waiter statistics for approved/completed order', {
            waiterId: req.user.id,
            orderId: order.id,
            status: status
          });

          // Emit socket event to notify waiter about stats update
          const updatedStats = await dbHelpers.getWaiterTodayStats(req.user.id);
          io.emit('waiter_stats_updated', {
            waiterId: req.user.id,
            stats: updatedStats
          });
          console.log(`=== SOCKET EVENT EMITTED: waiter_stats_updated ===`);
        } catch (statsError) {
          console.log(`=== STATISTICS UPDATE ERROR ===`);
          console.log('Error:', statsError.message);
          console.log('Error stack:', statsError.stack);
          logger.error('Error updating waiter statistics', {
            waiterId: req.user.id,
            orderId: order.id,
            error: statsError.message
          });
          // Don't fail the order update if stats update fails
        }
      } else {
        console.log(`=== STATISTICS UPDATE SKIPPED ===`);
      }
    } else {
      console.log(`=== STATISTICS UPDATE SKIPPED - Not waiter or not approved/completed ===`);
      console.log(`User role: ${req.user.role}`);
      console.log(`Status: ${status}`);
    }

    // Decrease inventory for all users when order is approved (only if it wasn't already approved)
    if ((status === 'approved' || status === 'completed') && !wasAlreadyApproved) {
      try {
        console.log(`=== INVENTORY DECREASE FOR ALL USERS START ===`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Order status: ${status}`);
        console.log(`User role: ${req.user.role}`);
        console.log(`Order items count: ${order.items.length}`);
        console.log('Order items details:', JSON.stringify(order.items, null, 2));

        await dbHelpers.decreaseInventory(order.items);

        console.log(`=== INVENTORY DECREASE FOR ALL USERS COMPLETED ===`);
        logger.info('Decreased inventory for approved order', {
          orderId: order.id,
          items: order.items,
          userRole: req.user.role
        });
      } catch (inventoryError) {
        console.log(`=== INVENTORY DECREASE FOR ALL USERS ERROR ===`);
        console.log('Error:', inventoryError.message);
        logger.error('Error decreasing inventory', {
          orderId: order.id,
          error: inventoryError.message
        });
        // Don't fail the order update if inventory update fails
      }
    } else {
      console.log(`Order ${order.id} was already approved or not approved/completed, skipping inventory decrease`);
    }

    // Log order update
    logger.logOrder(order, `updated to ${status}`);
    logger.logUserAction(req.user, 'update_order', { orderId: order.id, status });

    io.emit('order_updated', order);
    res.json(order);
  } catch (error) {
    logger.error('Error updating order', { orderId: req.params.id, userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbHelpers.deleteOrder(parseInt(req.params.id));

    // Log order deletion
    logger.logUserAction(req.user, 'delete_order', { orderId: req.params.id });

    io.emit('order_deleted', { id: parseInt(req.params.id) });
    res.json(result);
  } catch (error) {
    logger.error('Error deleting order', { orderId: req.params.id, userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tables with positions
app.get('/api/tables-positions', authenticateToken, async (req, res) => {
  try {
    const tables = await dbHelpers.getTablesWithPositions();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tables with orders
app.get('/api/tables-with-orders', authenticateToken, async (req, res) => {
  try {
    const tables = await dbHelpers.getTablesWithOrders();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables with orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tables positions view
app.get('/api/tables-positions-view', authenticateToken, async (req, res) => {
  try {
    const tables = await dbHelpers.getTablesPositionsView();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables positions view:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get waiters
app.get('/api/waiters', authenticateToken, async (req, res) => {
  try {
    const waiters = await dbHelpers.getWaiters();
    res.json(waiters);
  } catch (error) {
    console.error('Error fetching waiters:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics
app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    const statistics = await dbHelpers.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get waiter shift statistics
app.get('/api/waiter-shift-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await dbHelpers.getWaiterShiftStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching waiter shift stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get shift statistics (for current waiter)
app.get('/api/shift-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await dbHelpers.getShiftStats(req.user.id);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching shift stats', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get waiter today statistics (current shift)
app.get('/api/waiter-today-stats', authenticateToken, async (req, res) => {
  try {
    console.log('=== WAITER TODAY STATS REQUEST ===');
    console.log('User from token:', req.user);
    console.log('User ID from token:', req.user.id);
    console.log('User role from token:', req.user.role);

    const stats = await dbHelpers.getWaiterTodayStats(req.user.id);
    console.log('Stats result:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching waiter today stats:', error);
    logger.error('Error fetching waiter today stats', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset waiter statistics (end shift)
app.post('/api/waiter-reset-stats', authenticateToken, async (req, res) => {
  try {
    const result = await dbHelpers.resetWaiterStats(req.user.id);
    logger.info('Waiter reset statistics', { userId: req.user.id, resetTime: result.reset_time });
    res.json(result);
  } catch (error) {
    logger.error('Error resetting waiter stats', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get waiter historical statistics
app.get('/api/waiter-historical-stats', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await dbHelpers.getWaiterHistoricalStats(req.user.id, days);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching historical stats', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Log frontend errors
app.post('/api/logs', async (req, res) => {
  try {
    const { type, message, stack, componentStack, url, userAgent, timestamp } = req.body;

    logger.error('Frontend error', {
      type,
      message,
      stack,
      componentStack,
      url,
      userAgent,
      timestamp
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error logging frontend error', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

// Create table
app.post('/api/tables', authenticateToken, async (req, res) => {
  const { table_number, x_position, y_position, location } = req.body;

  try {
    // Check if table number already exists
    const tableExists = await dbHelpers.getTableByNumber(table_number);
    if (tableExists) {
      return res.status(400).json({ message: 'Sto sa ovim brojem već postoji' });
    }

    const tableId = await createTable(table_number, x_position, y_position, location);

    res.json({
      message: 'Sto uspešno kreiran',
      tableId
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update table position
app.put('/api/tables/:id/position', authenticateToken, async (req, res) => {
  const { x, y } = req.body;
  const tableId = parseInt(req.params.id);

  console.log(`Updating table ${tableId} position to x=${x}, y=${y}`);

  try {
    const result = await dbHelpers.updateTablePosition(tableId, x, y);
    console.log(`Table position update result:`, result);

    // Emit WebSocket event to notify all clients about table position update
    io.emit('table_position_updated', {
      tableId,
      x,
      y,
      updatedBy: req.user.id
    });
    console.log(`WebSocket event 'table_position_updated' emitted for table ${tableId}`);

    res.json({ message: 'Pozicija stola ažurirana' });
  } catch (error) {
    console.error('Error updating table position:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update all table positions at once
app.put('/api/tables/positions', authenticateToken, async (req, res) => {
  const { positions } = req.body; // positions should be array of {id, x, y}

  console.log(`Updating ${positions.length} table positions`);

  try {
    // Update all positions
    const updatePromises = positions.map(pos =>
      dbHelpers.updateTablePosition(pos.id, pos.x, pos.y)
    );

    await Promise.all(updatePromises);

    // Emit WebSocket event to notify all clients about layout update
    io.emit('table_layout_updated', {
      positions,
      updatedBy: req.user.id
    });
    console.log(`WebSocket event 'table_layout_updated' emitted for ${positions.length} tables`);

    res.json({ message: 'Raspored stolova ažuriran' });
  } catch (error) {
    console.error('Error updating table positions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get menu items (admin)
app.get('/api/menu-items', authenticateToken, async (req, res) => {
  try {
    const menuItems = await dbHelpers.getMenuItems();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add menu item (admin)
app.post('/api/menu-items', authenticateToken, async (req, res) => {
  try {
    const newItem = await dbHelpers.addMenuItem(req.body);
    res.json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get inventory (admin)
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await dbHelpers.getInventory();
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory stock (admin)
app.put('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { stock } = req.body;
    const itemId = parseInt(req.params.id);
    await dbHelpers.updateInventoryStock(itemId, stock);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  logger.logError(error, req);

  // Send appropriate response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Greška na serveru'
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info('User connected to socket', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('User disconnected from socket', { socketId: socket.id });
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  logger.info('Server started successfully', { port: PORT, environment: process.env.NODE_ENV || 'development' });
  console.log(`Server running on port ${PORT}`);
}); 