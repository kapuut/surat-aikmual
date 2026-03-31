const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_surat'
  });

  try {
    const connection = await pool.getConnection();
    
    console.log('🔧 Updating user status to aktif...\n');
    
    // Update semua user status menjadi 'aktif'
    const [result] = await connection.execute(
      "UPDATE users SET status = 'aktif' WHERE status IS NULL OR status = ''"
    );
    
    console.log(`✅ Updated ${result.affectedRows} users\n`);
    
    // Verify
    const [users] = await connection.execute('SELECT username, role, status FROM users');
    console.log('📋 User Status Sekarang:');
    console.table(users);
    
    connection.release();
    await pool.end();
    console.log('\n✅ SELESAI! Admin sekarang sudah aktif dan bisa login.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
