const mysql = require('mysql2/promise');

async function deleteAllData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('Brisanje svih podataka iz order_items, orders, waiter_statistics i menu_items...');
    await pool.execute('DELETE FROM order_items');
    await pool.execute('DELETE FROM orders');
    await pool.execute('DELETE FROM waiter_statistics');
    await pool.execute('DELETE FROM menu_items');
    console.log('Svi podaci su obrisani.');
  } catch (error) {
    console.error('Greška pri brisanju:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

deleteAllData(); 