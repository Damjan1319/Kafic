const mysql = require('mysql2/promise');
const { dbHelpers } = require('./database-mysql.js');

async function testStatsAPI() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== TESTING WAITER STATISTICS API ===');
    
    const waiterId = 4;
    
    // Test getWaiterTodayStats function
    console.log('\n=== TESTING getWaiterTodayStats ===');
    try {
      const stats = await dbHelpers.getWaiterTodayStats(waiterId);
      console.log('getWaiterTodayStats result:', stats);
    } catch (error) {
      console.error('Error in getWaiterTodayStats:', error);
    }
    
    // Test getWaiterShiftStats function
    console.log('\n=== TESTING getWaiterShiftStats ===');
    try {
      const shiftStats = await dbHelpers.getWaiterShiftStats(waiterId);
      console.log('getWaiterShiftStats result:', shiftStats);
    } catch (error) {
      console.error('Error in getWaiterShiftStats:', error);
    }
    
    // Check raw database data
    console.log('\n=== CHECKING RAW DATABASE DATA ===');
    const [rawStats] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = ? AND date = CURDATE()", [waiterId]);
    console.log('Raw stats for today:', rawStats);
    
    // Check orders for today
    console.log('\n=== CHECKING ORDERS FOR TODAY ===');
    const [todayOrders] = await pool.execute(`
      SELECT id, status, waiter_id, total_price, created_at 
      FROM orders 
      WHERE waiter_id = ? AND DATE(created_at) = CURDATE()
    `, [waiterId]);
    console.log('Orders for today:', todayOrders);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testStatsAPI(); 