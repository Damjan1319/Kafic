const mysql = require('mysql2/promise');

async function checkMenuItems() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== CHECKING MENU ITEMS ===');
    
    // Check all menu items
    const [menuItems] = await pool.execute("SELECT id, name, price FROM menu_items ORDER BY id");
    console.log('Available menu items:', menuItems);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkMenuItems(); 