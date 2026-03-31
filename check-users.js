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
    
    console.log('🔍 Checking users in database...\n');
    
    const [users] = await connection.execute('SELECT id, username, password, role, status, email FROM users');
    
    if (users.length === 0) {
      console.log('❌ TIDAK ADA USER DI DATABASE!');
      console.log('Silakan jalankan: node update-secure-passwords.js');
    } else {
      console.log(`✅ Ditemukan ${users.length} user:\n`);
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
        console.log('');
      });
    }
    
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\n⚠️ Pastikan:');
    console.log('1. MySQL running');
    console.log('2. Database db_surat exists');
    console.log('3. Credentials benar (host: localhost, user: root)');
  }
})();
