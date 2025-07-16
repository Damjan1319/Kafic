const mysql = require('mysql2/promise');

async function checkOrders() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== CHECKING PENDING ORDERS ===');
    
    // Check pending orders
    const [pendingOrders] = await pool.execute("SELECT id, status, waiter_id, total_price FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5");
    console.log('Pending orders:', pendingOrders);
    
    // Check recent orders
    const [recentOrders] = await pool.execute("SELECT id, status, waiter_id, total_price FROM orders ORDER BY created_at DESC LIMIT 10");
    console.log('Recent orders:', recentOrders);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkOrders(); 