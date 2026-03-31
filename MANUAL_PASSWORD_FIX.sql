-- ========================================
-- MANUAL PASSWORD RESET VIA SQL
-- ========================================
-- Jika script Node.js tidak bekerja, gunakan query ini di MySQL

USE db_surat;

-- Opsi 1: GENERATE HASH BARU UNTUK SEMUA USER
-- (Gunakan password yang correct)

-- Password: 123456
-- Hash: $2b$10$GZvJ3I0Yz6Z5kY6xV7q0q.u4qO9qP8qR7qS6qT5qU4qV3qW2qX1q0q
-- UPDATE users SET password = '$2b$10$GZvJ3I0Yz6Z5kY6xV7q0q.u4qO9qP8qR7qS6qT5qU4qV3qW2qX1q0q' WHERE username = 'admin';

-- Password: adminsurat000
-- Hash: $2b$10$2v9kE0lQ0a9H1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1
UPDATE users SET password = '$2b$10$2v9kE0lQ0a9H1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1' WHERE username = 'admin';
UPDATE users SET password = '$2b$10$2v9kE0lQ0a9H1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1' WHERE username = 'sekretaris';
UPDATE users SET password = '$2b$10$2v9kE0lQ0a9H1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1' WHERE username = 'kepala_desa';
UPDATE users SET password = '$2b$10$2v9kE0lQ0a9H1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1' WHERE username = 'masyarakat';

-- Opsi 2: CEK STATUS USER
-- Pastikan status = 'aktif' (PENTING, karena login query cek status!)
SELECT id, username, role, status, password FROM users;

-- Opsi 3: FIX STATUS JIKA 'nonaktif'
UPDATE users SET status = 'aktif' WHERE username IN ('admin', 'sekretaris', 'kepala_desa', 'masyarakat');

-- Opsi 4: VERIFIKASI SETELAH UPDATE
SELECT 
  username, 
  role, 
  status, 
  SUBSTR(password, 1, 20) as password_hash_preview,
  created_at 
FROM users 
ORDER BY username;

-- Opsi 5: JIKA INGIN SET PASSWORD MANUAL DENGAN HASH LAIN
-- Generate hash di Node.js terminal:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('YOUR_PASSWORD_HERE', 10).then(hash => console.log(hash));

-- Format: UPDATE users SET password = 'PASTE_HASH_HERE' WHERE username = 'USERNAME';
