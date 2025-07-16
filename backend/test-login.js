const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testLogin() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafe_ordering'
  });

  try {
    console.log('=== TESTING LOGIN FOR KONOBAR1 ===');
    
    const username = 'konobar1';
    const password = '123456'; // default password
    
    // Get waiter from database
    const [waiters] = await pool.execute('SELECT * FROM waiters WHERE username = ?', [username]);
    
    if (waiters.length === 0) {
      console.log('❌ Konobar1 not found in database');
      return;
    }
    
    const waiter = waiters[0];
    console.log('✅ Konobar1 found:');
    console.log(`  ID: ${waiter.id}`);
    console.log(`  Username: ${waiter.username}`);
    console.log(`  Name: ${waiter.name}`);
    console.log(`  Role: ${waiter.role}`);
    
    // Check password
    const isValidPassword = bcrypt.compareSync(password, waiter.password);
    console.log(`Password valid: ${isValidPassword}`);
    
    if (isValidPassword) {
      // Create token like in server
      const token = jwt.sign(
        { id: waiter.id, username: waiter.username, role: waiter.role },
        'secret',
        { expiresIn: '24h' }
      );
      
      console.log('\n=== TOKEN CREATED ===');
      console.log('Token payload:', { id: waiter.id, username: waiter.username, role: waiter.role });
      
      // Decode token to verify
      const decoded = jwt.verify(token, 'secret');
      console.log('Decoded token:', decoded);
      
      console.log('\n✅ Token contains correct ID:', decoded.id === waiter.id);
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    await pool.end();
  }
}

testLogin(); 