const mysql = require('mysql2/promise');

async function checkTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== CHECKING WAITER_STATISTICS TABLE ===');
    
    // Check if table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'waiter_statistics'");
    console.log('Table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await pool.execute("DESCRIBE waiter_statistics");
      console.log('Table structure:', columns);
      
      // Check if there's any data
      const [data] = await pool.execute("SELECT * FROM waiter_statistics");
      console.log('Data in table:', data);
      
      // Check specific waiter
      const [waiter4] = await pool.execute("SELECT * FROM waiter_statistics WHERE waiter_id = 4");
      console.log('Waiter 4 data:', waiter4);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkTable(); 