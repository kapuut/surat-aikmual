// Script untuk update password dengan password yang lebih aman
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

async function updateSecurePasswords() {
  try {
    console.log('🔍 Connecting to database...');
    const connection = await pool.getConnection();
    console.log('✅ Connected!\n');

    // Define new passwords
    const newPasswords = {
      admin: 'adminsurat000',
      sekretaris: 'sekretaris000',
      kepala_desa: 'kepaladesa000',
      masyarakat: 'masyarakat000'
    };

    console.log('🔐 Generating new secure password hashes...\n');

    // Generate and update each user's password
    for (const [username, password] of Object.entries(newPasswords)) {
      const hash = await bcrypt.hash(password, 10);
      
      await connection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hash, username]
      );
      
      console.log(`✅ ${username.padEnd(15)} → ${password} (hash updated)`);
    }

    console.log('\n📝 Verifying new passwords...\n');

    // Verify all passwords
    const [users] = await connection.execute('SELECT username, password FROM users');
    
    for (const user of users) {
      const expectedPassword = newPasswords[user.username];
      if (expectedPassword) {
        const isValid = await bcrypt.compare(expectedPassword, user.password);
        console.log(`${user.username.padEnd(15)} : ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }

    connection.release();
    
    console.log('\n✅ All passwords updated successfully!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📋 NEW LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: adminsurat000');
    console.log('');
    console.log('Sekretaris:');
    console.log('  Username: sekretaris');
    console.log('  Password: sekretaris000');
    console.log('');
    console.log('Kepala Desa:');
    console.log('  Username: kepala_desa');
    console.log('  Password: kepaladesa000');
    console.log('');
    console.log('Masyarakat:');
    console.log('  Username: masyarakat');
    console.log('  Password: masyarakat000');
    console.log('═══════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateSecurePasswords();
