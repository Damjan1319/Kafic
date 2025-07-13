const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_ordering',
  port: process.env.DB_PORT || 3306
};

// SQLite database path
const sqliteDbPath = './cafe.db';

async function migrateData() {
  let sqliteDb;
  let mysqlConnection;

  try {
    console.log('Starting migration from SQLite to MySQL...');

    // Connect to SQLite
    sqliteDb = new sqlite3.Database(sqliteDbPath);
    console.log('Connected to SQLite database');

    // Connect to MySQL
    mysqlConnection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Create database if it doesn't exist
    await mysqlConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await mysqlConnection.execute(`USE ${dbConfig.database}`);

    // Migrate waiters
    console.log('Migrating waiters...');
    const waiters = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM waiters', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const waiter of waiters) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO waiters (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [waiter.id, waiter.username, waiter.password, waiter.name, waiter.role, waiter.created_at]
      );
    }
    console.log(`Migrated ${waiters.length} waiters`);

    // Migrate tables
    console.log('Migrating tables...');
    const tables = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM tables', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const table of tables) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO tables (id, table_number, qr_code, current_order_count, created_at) VALUES (?, ?, ?, ?, ?)',
        [table.id, table.table_number, table.qr_code, table.current_order_count, table.created_at]
      );
    }
    console.log(`Migrated ${tables.length} tables`);

    // Migrate menu items
    console.log('Migrating menu items...');
    const menuItems = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM menu_items', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of menuItems) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO menu_items (id, name, category, price, description, available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.name, item.category, item.price, item.description, item.available, item.created_at]
      );
    }
    console.log(`Migrated ${menuItems.length} menu items`);

    // Migrate orders
    console.log('Migrating orders...');
    const orders = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM orders', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const order of orders) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO orders (id, table_id, order_number, total_price, status, waiter_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [order.id, order.table_id, order.order_number, order.total_price, order.status, order.waiter_id, order.created_at]
      );
    }
    console.log(`Migrated ${orders.length} orders`);

    // Migrate order items
    console.log('Migrating order items...');
    const orderItems = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM order_items', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of orderItems) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO order_items (id, order_id, item_id, name, price, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.order_id, item.item_id, item.name, item.price, item.quantity, item.created_at]
      );
    }
    console.log(`Migrated ${orderItems.length} order items`);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 