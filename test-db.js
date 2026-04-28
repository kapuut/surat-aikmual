// TEST DATABASE CONNECTION
// Jalankan: node test-db.js

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'switchback.proxy.rlwy.net',
  user: 'root',
  password: 'iJvABOutghbumwDglDLzCxatyKdjQsSE',
  database: 'railway',
  port: 48124,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Test users table
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = "admin"');
    console.log('✅ Admin user found:', rows);
    
    // Test login query
    const [loginRows] = await connection.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND status IN ("active", "aktif") LIMIT 1',
      ['admin', 'admin']
    );
    console.log('✅ Login query result:', loginRows);
    
    connection.release();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();