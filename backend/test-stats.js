const mysql = require('mysql2/promise');
const { dbHelpers } = require('./database-mysql.js');

async function testUpdateWaiterStats() {
  try {
    console.log('=== TESTING updateWaiterStats ===');
    
    // Test data
    const waiterId = 4;
    const orderData = {
      id: 29,
      total_price: 157.00,
      items: [
        { name: 'Espresso', quantity: 1, price: 120 },
        { name: 'Fanta', quantity: 1, price: 100 }
      ]
    };
    
    console.log('Waiter ID:', waiterId);
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    
    // Test the function
    const result = await dbHelpers.updateWaiterStats(waiterId, orderData);
    
    console.log('=== RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if stats were created
    const [stats] = await dbHelpers.pool.execute(
      'SELECT * FROM waiter_statistics WHERE waiter_id = ? AND date = CURDATE()',
      [waiterId]
    );
    
    console.log('=== STATS IN DATABASE ===');
    console.log(JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('Error testing updateWaiterStats:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit();
  }
}

testUpdateWaiterStats(); 