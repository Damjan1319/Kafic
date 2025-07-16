const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function testAPIApproval() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== TESTING API ORDER APPROVAL ===');
    
    // Create a test order first
    console.log('Creating test order...');
    const orderData = {
      table_id: 1,
      items: [
        { id: 6, name: 'Espresso', price: 120, quantity: 1, item_id: 6 },
        { id: 17, name: 'Fanta', price: 120, quantity: 1, item_id: 17 }
      ],
      total_price: 240
    };
    
    // Insert order directly
    const [orderResult] = await pool.execute(
      'INSERT INTO orders (table_id, order_number, total_price, status) VALUES (?, ?, ?, ?)',
      [orderData.table_id, 1, orderData.total_price, 'pending']
    );
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of orderData.items) {
      await pool.execute(
        'INSERT INTO order_items (order_id, item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.item_id, item.name, item.price, item.quantity]
      );
    }
    
    console.log('Created order ID:', orderId);
    
    // Check inventory before
    console.log('\n=== INVENTORY BEFORE ===');
    const [inventoryBefore] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE id IN (6, 17)");
    console.log('Inventory before:', inventoryBefore);
    
    // Check waiter stats before
    console.log('\n=== WAITER STATS BEFORE ===');
    const [statsBefore] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = 4 AND date = CURDATE()");
    console.log('Stats before:', statsBefore);
    
    // Create JWT token for waiter
    const waiterToken = jwt.sign(
      { id: 4, username: 'konobar4', role: 'waiter' },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('\n=== SIMULATING API CALL ===');
    console.log('Waiter token:', waiterToken);
    console.log('Order ID to approve:', orderId);
    
    // Simulate the API call
    const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${waiterToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    
    console.log('API Response status:', response.status);
    const result = await response.json();
    console.log('API Response:', result);
    
    // Check inventory after
    console.log('\n=== INVENTORY AFTER ===');
    const [inventoryAfter] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE id IN (6, 17)");
    console.log('Inventory after:', inventoryAfter);
    
    // Check waiter stats after
    console.log('\n=== WAITER STATS AFTER ===');
    const [statsAfter] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = 4 AND date = CURDATE()");
    console.log('Stats after:', statsAfter);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testAPIApproval(); 