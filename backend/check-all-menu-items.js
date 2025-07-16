const mysql = require('mysql2/promise');

async function checkAllMenuItems() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== PROVERA SVIH MENU ITEMS ===');
    
    // Check all menu items with full details
    const [menuItems] = await pool.execute(`
      SELECT id, name, price, category, description, created_at, updated_at 
      FROM menu_items 
      ORDER BY id
    `);
    
    console.log(`\nUkupno menu items: ${menuItems.length}`);
    console.log('\nSvi menu items:');
    menuItems.forEach(item => {
      console.log(`ID: ${item.id} | ${item.name} | ${item.price} RSD | ${item.category} | Created: ${item.created_at}`);
    });
    
    // Check categories
    const [categories] = await pool.execute(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM menu_items 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('\n=== KATEGORIJE ===');
    categories.forEach(cat => {
      console.log(`${cat.category}: ${cat.count} items`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

checkAllMenuItems(); 