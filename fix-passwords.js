// Script untuk memverifikasi dan memperbaiki password users
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_surat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixPasswords() {
  try {
    console.log('🔍 Checking database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Connected to database\n');

    // Check existing users
    console.log('📋 Existing users:');
    const [users] = await connection.execute('SELECT id, username, role, status FROM users');
    console.table(users);

    // Generate new password hash for '123456'
    const password = '123456';
    const newHash = await bcrypt.hash(password, 10);
    console.log(`\n🔐 New password hash for '${password}':`);
    console.log(newHash);

    // Test current passwords
    console.log('\n🧪 Testing current passwords with "123456":');
    const [allUsers] = await connection.execute('SELECT username, password FROM users');
    
    for (const user of allUsers) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`${user.username}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    // Ask to update passwords
    console.log('\n📝 Updating all passwords to "123456"...');
    
    await connection.execute(
      'UPDATE users SET password = ? WHERE username IN ("admin", "sekretaris", "kepala_desa", "masyarakat")',
      [newHash]
    );

    console.log('✅ Passwords updated successfully!');

    // Verify update
    console.log('\n✔️ Verifying updated passwords:');
    const [updatedUsers] = await connection.execute('SELECT username, password FROM users');
    
    for (const user of updatedUsers) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`${user.username}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

    connection.release();
    console.log('\n✅ All done! You can now login with:');
    console.log('   Username: admin/sekretaris/kepala_desa/masyarakat');
    console.log('   Password: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixPasswords();
