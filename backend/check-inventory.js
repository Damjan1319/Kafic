const mysql = require('mysql2/promise');

async function checkInventory() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== CHECKING INVENTORY ===');
    
    // Check current inventory
    const [inventory] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE stock > 0 ORDER BY name");
    console.log('Current inventory:', inventory);
    
    // Check specific items
    const [espresso] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE name LIKE '%Espresso%'");
    console.log('Espresso stock:', espresso);
    
    const [fanta] = await pool.execute("SELECT id, name, stock FROM menu_items WHERE name LIKE '%Fanta%'");
    console.log('Fanta stock:', fanta);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkInventory(); 