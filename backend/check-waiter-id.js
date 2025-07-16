const mysql = require('mysql2/promise');

async function checkWaiterId() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== PROVERA ID ZA KONOBAR1 ===');
    
    // Check konobar1 specifically
    const [waiters] = await pool.execute('SELECT * FROM waiters WHERE username = "konobar1"');
    console.log(`Konobar1 found: ${waiters.length > 0 ? 'YES' : 'NO'}`);
    
    if (waiters.length > 0) {
      const waiter = waiters[0];
      console.log('Konobar1 details:');
      console.log(`  ID: ${waiter.id}`);
      console.log(`  Username: ${waiter.username}`);
      console.log(`  Name: ${waiter.name}`);
      console.log(`  Role: ${waiter.role}`);
    }
    
    // Check all waiters
    console.log('\n=== SVI KONOBARI ===');
    const [allWaiters] = await pool.execute('SELECT * FROM waiters WHERE role = "waiter"');
    console.log(`Ukupno konobara: ${allWaiters.length}`);
    
    allWaiters.forEach(waiter => {
      console.log(`  ID: ${waiter.id} | ${waiter.username} | ${waiter.name}`);
    });
    
    // Check which waiter is being used in orders
    console.log('\n=== KONOBARI U PORUDŽBINAMA ===');
    const [orderWaiters] = await pool.execute(`
      SELECT DISTINCT o.waiter_id, w.username, w.name, COUNT(o.id) as order_count
      FROM orders o
      LEFT JOIN waiters w ON o.waiter_id = w.id
      WHERE o.waiter_id IS NOT NULL
      GROUP BY o.waiter_id
    `);
    
    console.log('Waiters with orders:');
    orderWaiters.forEach(ow => {
      console.log(`  Waiter ID: ${ow.waiter_id} | ${ow.username} | ${ow.name} | Orders: ${ow.order_count}`);
    });
    
  } catch (error) {
    console.error('Error checking waiter ID:', error);
  } finally {
    await pool.end();
  }
}

checkWaiterId(); 