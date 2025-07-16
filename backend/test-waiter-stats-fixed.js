const mysql = require('mysql2/promise');

async function testWaiterStatsFixed() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== TESTING WAITER STATISTICS (FIXED) ===');
    
    // Get first waiter (not admin)
    const [waiters] = await pool.execute('SELECT * FROM waiters WHERE role = "waiter" LIMIT 1');
    if (waiters.length === 0) {
      console.log('No waiters found in database');
      return;
    }
    
    const waiter = waiters[0];
    console.log('Testing with waiter:', waiter);
    
    // Test getWaiterTodayStats
    console.log('\n=== TESTING getWaiterTodayStats ===');
    const dbHelpers = require('./database-mysql.js').dbHelpers;
    
    const stats = await dbHelpers.getWaiterTodayStats(waiter.id);
    console.log('getWaiterTodayStats result:', stats);
    console.log('Product stats:', stats.product_stats);
    console.log('Total orders:', stats.total_orders);
    console.log('Total revenue:', stats.total_revenue);
    
    // Check orders for this waiter
    console.log('\n=== CHECKING ORDERS FOR THIS WAITER ===');
    const [orders] = await pool.execute(`
      SELECT o.*, COUNT(oi.id) as item_count 
      FROM orders o 
      LEFT JOIN order_items oi ON o.id = oi.order_id 
      WHERE o.waiter_id = ? 
      GROUP BY o.id
    `, [waiter.id]);
    console.log('Orders for this waiter:', orders.length);
    if (orders.length > 0) {
      console.log('Sample order:', orders[0]);
    }
    
    // Check all orders in system
    console.log('\n=== CHECKING ALL ORDERS IN SYSTEM ===');
    const [allOrders] = await pool.execute(`
      SELECT o.*, w.name as waiter_name, COUNT(oi.id) as item_count 
      FROM orders o 
      LEFT JOIN waiters w ON o.waiter_id = w.id
      LEFT JOIN order_items oi ON o.id = oi.order_id 
      GROUP BY o.id
    `);
    console.log('Total orders in system:', allOrders.length);
    if (allOrders.length > 0) {
      console.log('Sample orders:');
      allOrders.slice(0, 3).forEach(order => {
        console.log(`  ID: ${order.id} | Status: ${order.status} | Waiter: ${order.waiter_name || 'None'} | Items: ${order.item_count}`);
      });
    }
    
    // Check waiter_statistics table
    console.log('\n=== CHECKING waiter_statistics TABLE ===');
    const [statsRows] = await pool.execute('SELECT * FROM waiter_statistics WHERE waiter_id = ?', [waiter.id]);
    console.log('waiter_statistics rows for this waiter:', statsRows.length);
    if (statsRows.length > 0) {
      console.log('Sample stats row:', statsRows[0]);
    }
    
  } catch (error) {
    console.error('Error testing waiter stats:', error);
  } finally {
    await pool.end();
  }
}

testWaiterStatsFixed(); 