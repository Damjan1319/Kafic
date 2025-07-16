const mysql = require('mysql2/promise');

async function checkWaiters() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== PROVERA KONOBARA ===');
    
    // Check waiters
    const [waiters] = await pool.execute('SELECT * FROM waiters');
    console.log(`Ukupno korisnika: ${waiters.length}`);
    
    waiters.forEach(waiter => {
      console.log(`ID: ${waiter.id} | ${waiter.name} | Role: ${waiter.role} | Username: ${waiter.username}`);
    });
    
    // Check if we have any waiters (role = 'waiter')
    const actualWaiters = waiters.filter(w => w.role === 'waiter');
    console.log(`\nKonobara (role = 'waiter'): ${actualWaiters.length}`);
    
    if (actualWaiters.length === 0) {
      console.log('\n⚠️  NEMA KONOBARA! Dodajemo test konobara...');
      
      // Add a test waiter
      const [result] = await pool.execute(
        'INSERT INTO waiters (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['waiter1', '$2a$10$Yb/V5OeYY3Ldmh2Sfzdgau62UqFtFL40p3oklYJLqYsRiJOU0jmP2', 'Test Konobar', 'waiter']
      );
      
      console.log(`✅ Dodao test konobara sa ID: ${result.insertId}`);
    }
    
  } catch (error) {
    console.error('Error checking waiters:', error);
  } finally {
    await pool.end();
  }
}

checkWaiters(); 