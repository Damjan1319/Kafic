const mysql = require('mysql2/promise');
const { dbHelpers } = require('./database-mysql.js');

async function testApproveOrder() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== TESTING ORDER APPROVAL ===');
    
    // Create a test order
    const orderData = {
      table_id: 1,
      items: [
        { id: 1, name: 'Espresso', price: 120, quantity: 1, item_id: 1 },
        { id: 3, name: 'Fanta', price: 100, quantity: 1, item_id: 3 }
      ],
      total_price: 220
    };
    
    console.log('Creating test order...');
    const order = await dbHelpers.createOrder(orderData.table_id, orderData.items, orderData.total_price);
    console.log('Created order:', order);
    
    // Check inventory before approval
    console.log('\n=== INVENTORY BEFORE APPROVAL ===');
    const [inventoryBefore] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE id IN (1, 3)");
    console.log('Inventory before:', inventoryBefore);
    
    // Check waiter stats before approval
    console.log('\n=== WAITER STATS BEFORE APPROVAL ===');
    const [statsBefore] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = 4 AND date = CURDATE()");
    console.log('Stats before:', statsBefore);
    
    // Simulate order approval by waiter
    console.log('\n=== APPROVING ORDER ===');
    const waiterId = 4;
    const orderId = order.id;
    
    // Update order status to approved
    const updatedOrder = await dbHelpers.updateOrderStatus(orderId, 'approved', waiterId);
    console.log('Updated order:', updatedOrder);
    
    // Test statistics update
    console.log('\n=== TESTING STATISTICS UPDATE ===');
    try {
      await dbHelpers.updateWaiterStats(waiterId, updatedOrder);
      console.log('Statistics updated successfully');
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
    
    // Test inventory decrease
    console.log('\n=== TESTING INVENTORY DECREASE ===');
    try {
      await dbHelpers.decreaseInventory(updatedOrder.items);
      console.log('Inventory decreased successfully');
    } catch (error) {
      console.error('Error decreasing inventory:', error);
    }
    
    // Check inventory after approval
    console.log('\n=== INVENTORY AFTER APPROVAL ===');
    const [inventoryAfter] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE id IN (1, 3)");
    console.log('Inventory after:', inventoryAfter);
    
    // Check waiter stats after approval
    console.log('\n=== WAITER STATS AFTER APPROVAL ===');
    const [statsAfter] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = 4 AND date = CURDATE()");
    console.log('Stats after:', statsAfter);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testApproveOrder(); 