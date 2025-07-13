const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_ordering',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and tables
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waiters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'waiter') DEFAULT 'waiter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_number INT UNIQUE NOT NULL,
        qr_code VARCHAR(100) UNIQUE NOT NULL,
        location ENUM('indoor', 'outdoor') DEFAULT 'indoor',
        x_position INT DEFAULT 0,
        y_position INT DEFAULT 0,
        current_order_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        order_number INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'approved', 'completed') DEFAULT 'pending',
        waiter_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id),
        FOREIGN KEY (waiter_id) REFERENCES waiters(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        item_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES menu_items(id)
      )
    `);

    // Add location column to existing tables if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN location ENUM('indoor', 'outdoor') DEFAULT 'indoor'
      `);
      console.log('Location column added to tables');
    } catch (error) {
      // Column already exists, ignore error
      console.log('Location column already exists or error adding it:', error.message);
    }

    // Add x_position column to existing tables if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN x_position INT DEFAULT 0
      `);
      console.log('x_position column added to tables');
    } catch (error) {
      // Column already exists, ignore error
      console.log('x_position column already exists or error adding it:', error.message);
    }

    // Add y_position column to existing tables if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN y_position INT DEFAULT 0
      `);
      console.log('y_position column added to tables');
    } catch (error) {
      // Column already exists, ignore error
      console.log('y_position column already exists or error adding it:', error.message);
    }

    connection.release();
    console.log('Database and tables initialized successfully');
    
    // Insert default data
    await insertDefaultData();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Insert default data
const insertDefaultData = async () => {
  try {
    const connection = await pool.getConnection();
    const bcrypt = require('bcryptjs');
    
    // Insert default waiters
    const waiters = [
      { username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'Admin', role: 'admin' },
      { username: 'waiter', password: bcrypt.hashSync('waiter123', 10), name: 'Waiter 1', role: 'waiter' },
      { username: 'waiter2', password: bcrypt.hashSync('waiter123', 10), name: 'Waiter 2', role: 'waiter' },
      { username: 'konobar1', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 1', role: 'waiter' },
      { username: 'konobar2', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 2', role: 'waiter' },
      { username: 'konobar3', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 3', role: 'waiter' },
      { username: 'konobar4', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 4', role: 'waiter' }
    ];

    for (const waiter of waiters) {
      await connection.execute(
        'INSERT IGNORE INTO waiters (username, password, name, role) VALUES (?, ?, ?, ?)',
        [waiter.username, waiter.password, waiter.name, waiter.role]
      );
    }

    // Clear existing orders and menu items, then insert comprehensive menu
    await connection.execute('DELETE FROM order_items');
    await connection.execute('DELETE FROM orders');
    await connection.execute('DELETE FROM menu_items');
    
    const menuItems = [
        // KAFE
        { name: 'Espresso', category: 'coffee', price: 120, description: 'Classic Italian espresso' },
        { name: 'Cappuccino', category: 'coffee', price: 150, description: 'Espresso with steamed milk foam' },
        { name: 'Latte', category: 'coffee', price: 160, description: 'Espresso with steamed milk' },
        { name: 'Machiato', category: 'coffee', price: 130, description: 'Espresso with a dash of milk' },
        { name: 'Americano', category: 'coffee', price: 140, description: 'Espresso with hot water' },
        { name: 'Turska Kafa', category: 'coffee', price: 100, description: 'Traditional Turkish coffee' },
        { name: 'Nescafe', category: 'coffee', price: 110, description: 'Instant coffee with hot water' },
        { name: 'Mocha', category: 'coffee', price: 170, description: 'Espresso with chocolate and milk' },
        { name: 'Flat White', category: 'coffee', price: 160, description: 'Espresso with microfoam' },
        { name: 'Ristretto', category: 'coffee', price: 120, description: 'Concentrated espresso shot' },
        
        // SOKOVI
        { name: 'Coca Cola', category: 'soda', price: 120, description: 'Classic carbonated soft drink' },
        { name: 'Fanta', category: 'soda', price: 120, description: 'Orange flavored soda' },
        { name: 'Sprite', category: 'soda', price: 120, description: 'Lemon-lime flavored soda' },
        { name: 'Pepsi', category: 'soda', price: 120, description: 'Pepsi cola soft drink' },
        { name: 'Schweppes', category: 'soda', price: 130, description: 'Premium tonic water' },
        { name: 'Red Bull', category: 'energy', price: 180, description: 'Energy drink with caffeine' },
        { name: 'Monster', category: 'energy', price: 200, description: 'High energy drink' },
        { name: 'Cedevita', category: 'soda', price: 100, description: 'Vitamin drink powder' },
        
        // ŽESTOKA PIĆA
        { name: 'Rakija šljiva', category: 'spirits', price: 250, description: 'Plum brandy (šljivovica)' },
        { name: 'Rakija kajsija', category: 'spirits', price: 270, description: 'Apricot brandy' },
        { name: 'Rakija dunja', category: 'spirits', price: 270, description: 'Quince brandy' },
        { name: 'Rakija loza', category: 'spirits', price: 250, description: 'Grape brandy' },
        { name: 'Vodka', category: 'spirits', price: 300, description: 'Premium vodka shot' },
        { name: 'Whiskey Jameson', category: 'spirits', price: 350, description: 'Jameson Irish whiskey' },
        { name: 'Whiskey Jack Daniel’s', category: 'spirits', price: 370, description: 'Jack Daniel’s Tennessee whiskey' },
        { name: 'Whiskey Ballantine’s', category: 'spirits', price: 360, description: 'Ballantine’s Scotch whisky' },
        { name: 'Rum Havana Club', category: 'spirits', price: 320, description: 'Havana Club white rum' },
        { name: 'Rum Captain Morgan', category: 'spirits', price: 340, description: 'Captain Morgan spiced rum' },
        { name: 'Gin Beefeater', category: 'spirits', price: 340, description: 'Beefeater London dry gin' },
        { name: 'Gin Bombay Sapphire', category: 'spirits', price: 360, description: 'Bombay Sapphire gin' },
        { name: 'Tequila Olmeca', category: 'spirits', price: 360, description: 'Olmeca tequila shot' },
        { name: 'Tequila Sierra', category: 'spirits', price: 370, description: 'Sierra tequila shot' },
        { name: 'Cognac Hennessy', category: 'spirits', price: 400, description: 'Hennessy French cognac' },
        { name: 'Cognac Courvoisier', category: 'spirits', price: 420, description: 'Courvoisier French cognac' },
        { name: 'Absinthe', category: 'spirits', price: 450, description: 'Green fairy spirit' },
        { name: 'Jägermeister', category: 'spirits', price: 320, description: 'Herbal liqueur' },
        { name: 'Baileys', category: 'spirits', price: 320, description: 'Irish cream liqueur' },
        { name: 'Amaretto', category: 'spirits', price: 320, description: 'Almond liqueur' },
        
        // PIVA
        { name: 'Jelen', category: 'beer', price: 150, description: 'Serbian lager beer' },
        { name: 'Lav', category: 'beer', price: 140, description: 'Serbian lager beer' },
        { name: 'Zaječarsko', category: 'beer', price: 150, description: 'Serbian lager beer' },
        { name: 'Heineken', category: 'beer', price: 180, description: 'Dutch premium lager' },
        { name: 'Corona', category: 'beer', price: 200, description: 'Mexican lager with lime' },
        { name: 'Stella Artois', category: 'beer', price: 190, description: 'Belgian premium lager' },
        { name: 'Tuborg', category: 'beer', price: 160, description: 'Danish lager beer' },
        { name: 'Guinness', category: 'beer', price: 220, description: 'Irish dry stout' },
        { name: 'Paulaner', category: 'beer', price: 230, description: 'German wheat beer' },
        { name: 'Kozel', category: 'beer', price: 180, description: 'Czech dark lager' },
        { name: 'Budweiser', category: 'beer', price: 180, description: 'American lager' },
        { name: 'IPA', category: 'beer', price: 210, description: 'India Pale Ale' },
        { name: 'Pilsner', category: 'beer', price: 190, description: 'Pilsner style beer' },
        
        // VINA
        { name: 'Vranac', category: 'wine', price: 220, description: 'Red wine, Vranac grape' },
        { name: 'Merlot', category: 'wine', price: 240, description: 'Red wine, Merlot grape' },
        { name: 'Cabernet Sauvignon', category: 'wine', price: 250, description: 'Red wine, Cabernet Sauvignon grape' },
        { name: 'Prokupac', category: 'wine', price: 210, description: 'Serbian red wine' },
        { name: 'Chardonnay', category: 'wine', price: 230, description: 'White wine, Chardonnay grape' },
        { name: 'Sauvignon Blanc', category: 'wine', price: 230, description: 'White wine, Sauvignon Blanc grape' },
        { name: 'Graševina', category: 'wine', price: 210, description: 'White wine, Graševina grape' },
        { name: 'Rose', category: 'wine', price: 220, description: 'Rosé wine' },
        { name: 'Prosecco', category: 'wine', price: 260, description: 'Italian sparkling wine' },
        { name: 'Šampanjac', category: 'wine', price: 500, description: 'Champagne' },
        { name: 'Desertno vino', category: 'wine', price: 300, description: 'Sweet dessert wine' },
        
        // VODE
        { name: 'Rosa Voda', category: 'water', price: 80, description: 'Natural spring water' },
        { name: 'Knjaz Miloš', category: 'water', price: 90, description: 'Premium mineral water' },
        { name: 'Aqua Viva', category: 'water', price: 70, description: 'Pure drinking water' },
        { name: 'Jana', category: 'water', price: 85, description: 'Natural mineral water' },
        { name: 'Voda sa Limunom', category: 'water', price: 100, description: 'Water with fresh lemon' },
        { name: 'Voda sa Limetom', category: 'water', price: 100, description: 'Water with fresh lime' },
        
        // KOKTELI
        { name: 'Mojito', category: 'cocktails', price: 280, description: 'Rum, mint, lime and soda' },
        { name: 'Margarita', category: 'cocktails', price: 320, description: 'Tequila, lime and triple sec' },
        { name: 'Martini', category: 'cocktails', price: 350, description: 'Gin and vermouth cocktail' },
        { name: 'Negroni', category: 'cocktails', price: 380, description: 'Gin, vermouth and campari' },
        { name: 'Old Fashioned', category: 'cocktails', price: 400, description: 'Whiskey, bitters and sugar' },
        { name: 'Manhattan', category: 'cocktails', price: 420, description: 'Whiskey and vermouth cocktail' },
        { name: 'Daiquiri', category: 'cocktails', price: 300, description: 'Rum, lime and sugar' },
        { name: 'Cosmopolitan', category: 'cocktails', price: 360, description: 'Vodka, cranberry and lime' },
        { name: 'Pina Colada', category: 'cocktails', price: 320, description: 'Rum, coconut and pineapple' },
        { name: 'Sex on the Beach', category: 'cocktails', price: 340, description: 'Vodka, peach and cranberry' },
        { name: 'Long Island Iced Tea', category: 'cocktails', price: 380, description: 'Multiple spirits with cola' },
        { name: 'Blue Lagoon', category: 'cocktails', price: 300, description: 'Vodka, blue curaçao and lemon' },
        { name: 'White Russian', category: 'cocktails', price: 360, description: 'Vodka, coffee liqueur and cream' },
        { name: 'Black Russian', category: 'cocktails', price: 320, description: 'Vodka and coffee liqueur' },
        { name: 'Gin Tonic', category: 'cocktails', price: 280, description: 'Gin and tonic water' },
        { name: 'Rum Cola', category: 'cocktails', price: 260, description: 'Rum and cola' },
        { name: 'Whiskey Sour', category: 'cocktails', price: 320, description: 'Whiskey, lemon and sugar' },
        
        // TOPLI NAPITCI
        { name: 'Čaj', category: 'tea', price: 80, description: 'Hot tea selection' },
        { name: 'Kamilica', category: 'tea', price: 90, description: 'Chamomile herbal tea' },
        { name: 'Nana', category: 'tea', price: 90, description: 'Mint herbal tea' },
        { name: 'Zeleni Čaj', category: 'tea', price: 100, description: 'Green tea' },
        { name: 'Crni Čaj', category: 'tea', price: 80, description: 'Black tea' },
        { name: 'Topla Čokolada', category: 'tea', price: 140, description: 'Hot chocolate with milk' }
      ];
      for (const item of menuItems) {
        await connection.execute(
          'INSERT INTO menu_items (name, category, price, description) VALUES (?, ?, ?, ?)',
          [item.name, item.category, item.price, item.description]
        );
      }

    // Insert default tables SAMO AKO NEMA NIJEDNOG
    const [tableCountRows] = await connection.execute('SELECT COUNT(*) as count FROM tables');
    if (tableCountRows[0].count === 0) {
      const tablePositions = [
        // Indoor tables (1-12)
        { number: 1, x: 100, y: 50, location: 'indoor' },
        { number: 2, x: 200, y: 50, location: 'indoor' },
        { number: 3, x: 300, y: 50, location: 'indoor' },
        { number: 4, x: 100, y: 150, location: 'indoor' },
        { number: 5, x: 200, y: 150, location: 'indoor' },
        { number: 6, x: 300, y: 150, location: 'indoor' },
        { number: 7, x: 100, y: 250, location: 'indoor' },
        { number: 8, x: 200, y: 250, location: 'indoor' },
        { number: 9, x: 300, y: 250, location: 'indoor' },
        { number: 10, x: 100, y: 350, location: 'indoor' },
        { number: 11, x: 200, y: 350, location: 'indoor' },
        { number: 12, x: 300, y: 350, location: 'indoor' },
        // Outdoor tables (13-30)
        { number: 13, x: 500, y: 50, location: 'outdoor' },
        { number: 14, x: 600, y: 50, location: 'outdoor' },
        { number: 15, x: 700, y: 50, location: 'outdoor' },
        { number: 16, x: 500, y: 150, location: 'outdoor' },
        { number: 17, x: 600, y: 150, location: 'outdoor' },
        { number: 18, x: 700, y: 150, location: 'outdoor' },
        { number: 19, x: 500, y: 250, location: 'outdoor' },
        { number: 20, x: 600, y: 250, location: 'outdoor' },
        { number: 21, x: 700, y: 250, location: 'outdoor' },
        { number: 22, x: 500, y: 350, location: 'outdoor' },
        { number: 23, x: 600, y: 350, location: 'outdoor' },
        { number: 24, x: 700, y: 350, location: 'outdoor' },
        { number: 25, x: 500, y: 450, location: 'outdoor' },
        { number: 26, x: 600, y: 450, location: 'outdoor' },
        { number: 27, x: 700, y: 450, location: 'outdoor' },
        { number: 28, x: 500, y: 550, location: 'outdoor' },
        { number: 29, x: 600, y: 550, location: 'outdoor' },
        { number: 30, x: 700, y: 550, location: 'outdoor' }
      ];
      for (const table of tablePositions) {
        await connection.execute(
          'INSERT IGNORE INTO tables (table_number, qr_code, x_position, y_position, location) VALUES (?, ?, ?, ?, ?)',
          [table.number, `TABLE_${table.number.toString().padStart(3, '0')}`, table.x, table.y, table.location]
        );
      }
    }
    
    // Force update all tables with correct location
    await connection.execute(`
      UPDATE tables 
      SET location = 'indoor' 
      WHERE table_number <= 12
    `);
    
    await connection.execute(`
      UPDATE tables 
      SET location = 'outdoor' 
      WHERE table_number > 12
    `);
    
    console.log('Updated table locations:');
    const [updatedTables] = await connection.execute('SELECT table_number, location FROM tables ORDER BY table_number');
    console.log(updatedTables);

    // Funkcija za postavljanje default pozicija stolova
    await setDefaultTablePositions(connection);

    connection.release();
    console.log('Default data inserted successfully');
    
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};

// Funkcija za postavljanje default pozicija stolova
async function setDefaultTablePositions(connection) {
  try {
    // Pronađi sve stolove koji imaju x_position=0 i y_position=0
    const [tables] = await connection.execute('SELECT * FROM tables WHERE x_position = 0 AND y_position = 0');
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
        await connection.execute(
          'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
          [Math.round(x), Math.round(y), table.id]
        );
      }
      console.log('Default pozicije stolova postavljene');
    }
  } catch (error) {
    console.error('Greška pri postavljanju default pozicija:', error);
  }
}

// Database helper functions
const dbHelpers = {
  // Get all waiters
  getWaiters: async () => {
    const [rows] = await pool.execute('SELECT * FROM waiters');
    return rows;
  },

  // Get waiter by username
  getWaiterByUsername: async (username) => {
    const [rows] = await pool.execute('SELECT * FROM waiters WHERE username = ?', [username]);
    return rows[0];
  },

  // Get tables with positions
  getTablesWithPositions: async () => {
    const [rows] = await pool.execute('SELECT * FROM tables ORDER BY location, table_number');
    return rows;
  },

  // Update table position
  updateTablePosition: async (id, x, y) => {
    const [result] = await pool.execute(
      'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
      [x, y, id]
    );
    return result;
  },

  // Get all tables
  getTables: async () => {
    const [rows] = await pool.execute('SELECT * FROM tables');
    return rows;
  },

  // Get table by QR code
  getTableByQRCode: async (qrCode) => {
    const [rows] = await pool.execute('SELECT * FROM tables WHERE qr_code = ?', [qrCode]);
    return rows[0];
  },

  // Get table by number
  getTableByNumber: async (tableNumber) => {
    const [rows] = await pool.execute('SELECT * FROM tables WHERE table_number = ?', [tableNumber]);
    return rows[0];
  },

  // Get tables with order details
  getTablesWithOrders: async () => {
    const [tables] = await pool.execute('SELECT * FROM tables ORDER BY location, table_number');
    
    for (let table of tables) {
      // Get active orders for this table
      const [orders] = await pool.execute(`
        SELECT o.*, w.name as waiter_name
        FROM orders o
        LEFT JOIN waiters w ON o.waiter_id = w.id
        WHERE o.table_id = ? AND o.status IN ('pending', 'approved')
        ORDER BY o.created_at DESC
      `, [table.id]);

      // Get order items for each order
      for (let order of orders) {
        const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      table.orders = orders;
      table.pendingOrders = orders.filter(o => o.status === 'pending');
      table.approvedOrders = orders.filter(o => o.status === 'approved');
      table.totalOrders = orders.length;
    }

    return tables;
  },

  // Get tables positions view (for interactive map)
  getTablesPositionsView: async () => {
    const [tables] = await pool.execute(`
      SELECT id, table_number, x_position, y_position, location, current_order_count
      FROM tables 
      ORDER BY table_number
    `);
    return tables;
  },

  // Get all orders with items
  getOrders: async () => {
    const [orders] = await pool.execute(`
      SELECT o.*, t.table_number, w.name as waiter_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN waiters w ON o.waiter_id = w.id
      ORDER BY o.created_at DESC
    `);

    // Get items for each order
    for (let order of orders) {
      const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    return orders;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const [orders] = await pool.execute(`
      SELECT o.*, t.table_number, w.name as waiter_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN waiters w ON o.waiter_id = w.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;

    return order;
  },

  // Create new order
  createOrder: async (tableId, items, totalPrice) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current order count for table
      const [tables] = await connection.execute('SELECT current_order_count FROM tables WHERE id = ?', [tableId]);
      const table = tables[0];
      const orderNumber = (table.current_order_count || 0) + 1;

      // Create order
      const [result] = await connection.execute(`
        INSERT INTO orders (table_id, order_number, total_price, status)
        VALUES (?, ?, ?, 'pending')
      `, [tableId, orderNumber, totalPrice]);

      const orderId = result.insertId;

      // Insert order items
      for (const item of items) {
        await connection.execute(`
          INSERT INTO order_items (order_id, item_id, name, price, quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.id, item.name, item.price, item.quantity]);
      }

      // Update table order count
      await connection.execute('UPDATE tables SET current_order_count = ? WHERE id = ?', [orderNumber, tableId]);

      await connection.commit();
      
      // Get the created order
      return await dbHelpers.getOrderById(orderId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status, waiterId = null) => {
    if (waiterId) {
      await pool.execute(`
        UPDATE orders 
        SET status = ?, waiter_id = ?
        WHERE id = ?
      `, [status, waiterId, orderId]);
    } else {
      await pool.execute(`
        UPDATE orders 
        SET status = ?
        WHERE id = ?
      `, [status, orderId]);
    }
    
    return await dbHelpers.getOrderById(orderId);
  },

  // Delete order
  deleteOrder: async (orderId) => {
    await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    return { message: 'Order deleted successfully' };
  },

  // Get menu items
  getMenuItems: async () => {
    const [rows] = await pool.execute('SELECT * FROM menu_items WHERE available = 1');
    return rows;
  },

  // Get statistics
  getStatistics: async () => {
    console.log('=== Getting statistics ===');
    
    // Product statistics
    const [productStats] = await pool.execute(`
      SELECT 
        oi.name,
        SUM(oi.quantity) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT oi.order_id) as orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      GROUP BY oi.name
    `);
    console.log('Product stats:', productStats);

    // Waiter statistics
    const [waiterStats] = await pool.execute(`
      SELECT 
        w.id,
        w.name,
        COUNT(o.id) as ordersHandled,
        COALESCE(SUM(o.total_price), 0) as totalRevenue,
        COALESCE(SUM(oi.quantity), 0) as itemsSold
      FROM waiters w
      LEFT JOIN orders o ON w.id = o.waiter_id AND o.status IN ('approved', 'completed')
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE w.role = 'waiter'
      GROUP BY w.id, w.name
      ORDER BY w.name
    `);
    console.log('Waiter stats:', waiterStats);

    // Overall statistics
    const [overallStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_price), 0) as totalRevenue,
        COALESCE(AVG(total_price), 0) as averageOrderValue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders
      FROM orders
    `);
    console.log('Overall stats:', overallStats[0]);

    // Debug: Check all waiters
    const [allWaiters] = await pool.execute('SELECT * FROM waiters WHERE role = "waiter"');
    console.log('All waiters:', allWaiters);

    // Debug: Check all orders with waiter_id
    const [ordersWithWaiters] = await pool.execute('SELECT id, waiter_id, status FROM orders WHERE waiter_id IS NOT NULL');
    console.log('Orders with waiters:', ordersWithWaiters);

    return {
      productStats,
      waiterStats,
      overallStats: overallStats[0]
    };
  },

  // Get waiter shift statistics
  getWaiterShiftStats: async (waiterId) => {
    console.log('=== Getting waiter shift stats for waiter ID:', waiterId, '===');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Product statistics for today - include all orders approved by this waiter
    const [productStats] = await pool.execute(`
      SELECT 
        oi.name,
        SUM(oi.quantity) as quantitySold,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT oi.order_id) as orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.waiter_id = ? 
        AND o.status IN ('approved', 'completed')
        AND DATE(o.created_at) = ?
      GROUP BY oi.name
      ORDER BY quantitySold DESC
    `, [waiterId, today]);
    console.log('Product stats for waiter:', productStats);

    // Overall statistics for today - include all orders approved by this waiter
    const [overallStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_price), 0) as totalRevenue,
        COALESCE(AVG(total_price), 0) as averageOrderValue,
        COALESCE(SUM(oi.quantity), 0) as totalItems
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.waiter_id = ? 
        AND o.status IN ('approved', 'completed')
        AND DATE(o.created_at) = ?
    `, [waiterId, today]);
    console.log('Overall stats for waiter:', overallStats[0]);

    // Debug: Check all orders for this waiter today
    const [debugOrders] = await pool.execute(`
      SELECT id, status, waiter_id, total_price, created_at 
      FROM orders 
      WHERE waiter_id = ? AND DATE(created_at) = ?
    `, [waiterId, today]);
    console.log('Debug - All orders for waiter today:', debugOrders);

    return {
      productStats,
      totalOrders: overallStats[0]?.totalOrders || 0,
      totalRevenue: overallStats[0]?.totalRevenue || 0,
      averageOrderValue: overallStats[0]?.averageOrderValue || 0,
      totalItems: overallStats[0]?.totalItems || 0
    };
  },

  // Get shift statistics (alias for getWaiterShiftStats)
  getShiftStats: async (waiterId) => {
    return await dbHelpers.getWaiterShiftStats(waiterId);
  }
};

// Dodaj/izmeni helper za ažuriranje pozicije stola
async function updateTablePosition(id, x, y) {
  const [result] = await pool.execute(
    'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
    [x, y, id]
  );
  return result;
}

// Helper za kreiranje novog stola
async function createTable(tableNumber, xPosition, yPosition, location = 'indoor') {
  const qrCode = `table_${tableNumber}_${Date.now()}`;
  const [result] = await pool.execute(
    'INSERT INTO tables (table_number, qr_code, x_position, y_position, location) VALUES (?, ?, ?, ?, ?)',
    [tableNumber, qrCode, xPosition, yPosition, location]
  );
  return result.insertId;
}

module.exports = { pool, dbHelpers, initDatabase }; 
module.exports.updateTablePosition = updateTablePosition;
module.exports.createTable = createTable; 