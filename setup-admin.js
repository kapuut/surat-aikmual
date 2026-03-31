const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'db_arsip_surat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Checking admin user...\n');
    const connection = await pool.getConnection();

    // Check if admin exists
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND role = "admin"',
      ['admin']
    );

    if (rows.length > 0) {
      const user = rows[0];
      console.log('✅ Admin user already exists:');
      console.log('   Username:', user.username);
      console.log('   Email:', user.email);
      console.log('   Nama:', user.nama);
      console.log('   Status:', user.status);
      console.log('\n📝 Testing password...\n');

      // Test if the password matches
      const hashedPassword = '$2b$10$z8V9b2R4qmBbYaX3IYJ.2eerp0NLEByFFEcTKpPilrlPQE8ebqtR2'; // adminsurat000
      const isMatchDefault = await bcrypt.compare('adminsurat000', user.password);
      
      if (isMatchDefault) {
        console.log('✅ Password "adminsurat000" is CORRECT\n');
      } else {
        console.log('❌ Password "adminsurat000" does NOT match\n');
        console.log('🔄 Updating password to "adminsurat000"...\n');
        await connection.execute(
          'UPDATE users SET password = ? WHERE username = ? AND role = "admin"',
          [hashedPassword, 'admin']
        );
        console.log('✅ Password updated!\n');
      }
    } else {
      console.log('⚠️  Admin user not found. Creating new admin user...\n');
      
      const hashedPassword = '$2b$10$z8V9b2R4qmBbYaX3IYJ.2eerp0NLEByFFEcTKpPilrlPQE8ebqtR2'; // adminsurat000
      
      await connection.execute(
        'INSERT INTO users (username, password, nama, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'Administrator', 'admin@aikmual.com', 'admin', 'aktif']
      );
      
      console.log('✅ Admin user created:\n');
      console.log('   Username: admin');
      console.log('   Password: adminsurat000');
      console.log('   Email: admin@aikmual.com');
      console.log('   Nama: Administrator\n');
    }

    console.log('📋 All users with admin role:');
    const [allAdmins] = await connection.execute(
      'SELECT username, email, nama, status FROM users WHERE role = "admin"'
    );
    
    allAdmins.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.username} (${user.email}) - ${user.status}`);
    });

    console.log('\n✅ Setup complete!\n');
    console.log('🔑 You can now login with:');
    console.log('   URL: http://localhost:3000/admin/login');
    console.log('   Username: admin');
    console.log('   Password: adminsurat000\n');

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. MySQL server is running');
    console.error('2. Database name is correct: db_arsip_surat');
    console.error('3. .env file has correct credentials');
    console.error('4. users table exists with proper schema\n');
    process.exit(1);
  }
}

setupAdmin();
