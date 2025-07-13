const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database
const { pool, dbHelpers, initDatabase, createTable } = require('./database-mysql');

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
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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
app.get('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Routes

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const waiter = await dbHelpers.getWaiterByUsername(username);
    if (!waiter || !bcrypt.compareSync(password, waiter.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: waiter.id, username: waiter.username, role: waiter.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: waiter.id,
        username: waiter.username,
        name: waiter.name,
        role: waiter.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
  
  try {
    const newOrder = await dbHelpers.createOrder(table_id, items, total_price);
    
    // Emit to waiters
    io.emit('new_order', newOrder);

    res.json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders for waiter
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await dbHelpers.getOrders();
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
    const order = await dbHelpers.updateOrderStatus(
      parseInt(req.params.id), 
      status, 
      status === 'approved' ? req.user.id : null
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    io.emit('order_updated', order);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const result = await dbHelpers.deleteOrder(parseInt(req.params.id));
    io.emit('order_deleted', { id: parseInt(req.params.id) });
    res.json(result);
  } catch (error) {
    console.error('Error deleting order:', error);
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
    console.error('Error fetching shift stats:', error);
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
  
  try {
    await dbHelpers.updateTablePosition(tableId, x, y);
    res.json({ message: 'Pozicija stola ažurirana' });
  } catch (error) {
    console.error('Error updating table position:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 