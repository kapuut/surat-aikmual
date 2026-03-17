-- =====================================================
-- UPDATE DATABASE QUERY UNTUK SISTEM ROLE-BASED
-- =====================================================
-- Jalankan query ini di phpMyAdmin atau MySQL client Anda
-- untuk update database existing ke sistem role-based

-- 1. BACKUP DATABASE DULU (OPTIONAL TAPI DIREKOMENDASIKAN)
-- CREATE DATABASE db_surat_backup AS SELECT * FROM db_surat;

-- 2. GUNAKAN DATABASE
USE db_surat;

-- 3. CEK STRUKTUR TABLE EXISTING
-- DESCRIBE users;

-- 4. TAMBAH KOLOM BARU (jika belum ada)
-- Cek dulu apakah kolom sudah ada untuk menghindari error
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'db_surat' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'nik');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN nik VARCHAR(16) NULL AFTER email;', 
              'SELECT "Column nik already exists" as message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'db_surat' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'alamat');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN alamat TEXT NULL AFTER nik;', 
              'SELECT "Column alamat already exists" as message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = 'db_surat' 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'telepon');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN telepon VARCHAR(15) NULL AFTER alamat;', 
              'SELECT "Column telepon already exists" as message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. UPDATE ENUM ROLE (HATI-HATI: BACKUP DULU!)
-- Cek current enum values
SHOW COLUMNS FROM users LIKE 'role';

-- Update enum untuk include role baru
ALTER TABLE users MODIFY COLUMN role ENUM(
  'admin', 
  'staff', 
  'sekretaris', 
  'kepala_desa', 
  'masyarakat'
) NOT NULL DEFAULT 'masyarakat';

-- 6. INSERT USER BARU (password: 123456 untuk semua)
-- Cek apakah user sudah ada dulu
INSERT IGNORE INTO users (username, password, nama, email, role, nik, alamat, telepon, status, created_at) VALUES 
('sekretaris', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sekretaris Desa', 'sekretaris@desa.go.id', 'sekretaris', '1234567890123456', 'Kantor Desa', '081234567890', 'active', NOW()),
('kepala_desa', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala Desa', 'kepaladesa@desa.go.id', 'kepala_desa', '1234567890123457', 'Kantor Desa', '081234567891', 'active', NOW()),
('masyarakat', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Warga Desa', 'masyarakat@example.com', 'masyarakat', '1234567890123458', 'RT 01 RW 01 Desa Contoh', '081234567892', 'active', NOW());

-- 7. UPDATE ADMIN USER (jika diperlukan)
-- Update admin existing untuk konsistensi
UPDATE users 
SET 
  nama = 'Administrator Sistem',
  email = 'admin@desa.go.id',
  status = 'active'
WHERE username = 'admin' AND role = 'admin';

-- 8. VERIFIKASI HASIL UPDATE
SELECT 'VERIFIKASI STRUKTUR TABLE:' as info;
DESCRIBE users;

SELECT 'VERIFIKASI USER YANG ADA:' as info;
SELECT id, username, nama, email, role, status, created_at FROM users ORDER BY role, username;

SELECT 'VERIFIKASI ENUM ROLE:' as info;
SHOW COLUMNS FROM users LIKE 'role';

-- 9. CEK APAKAH ADA MISSING DATA
SELECT 'CEK DATA YANG INCOMPLETE:' as info;
SELECT username, role, 
       CASE WHEN nik IS NULL THEN 'NIK Missing' ELSE 'NIK OK' END as nik_status,
       CASE WHEN alamat IS NULL THEN 'Alamat Missing' ELSE 'Alamat OK' END as alamat_status,
       CASE WHEN telepon IS NULL THEN 'Telepon Missing' ELSE 'Telepon OK' END as telepon_status
FROM users;

-- 10. SUMMARY
SELECT 'UPDATE SELESAI!' as status,
       COUNT(*) as total_users,
       COUNT(DISTINCT role) as total_roles
FROM users;

-- 10b. BUAT TABLE TEMPLATE SURAT (jika belum ada)
CREATE TABLE IF NOT EXISTS template_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_template VARCHAR(255) NOT NULL,
  jenis_surat VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_jenis_surat (jenis_surat),
  INDEX idx_template_uploaded_by (uploaded_by),
  CONSTRAINT fk_template_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. NORMALISASI NIK LAMA (format NIK_timestamp -> NIK)
UPDATE users
SET nik = SUBSTRING_INDEX(nik, '_', 1)
WHERE nik IS NOT NULL AND nik LIKE '%\_%';

UPDATE users
SET nik = TRIM(nik)
WHERE nik IS NOT NULL;

-- Set NULL untuk NIK invalid agar tidak bentrok saat unique index dibuat
UPDATE users
SET nik = NULL
WHERE nik IS NOT NULL
  AND nik NOT REGEXP '^[0-9]{16}$';

-- Cek duplikasi NIK valid, selesaikan jika ada sebelum menambah unique index
SELECT nik, COUNT(*) AS total
FROM users
WHERE nik IS NOT NULL AND nik REGEXP '^[0-9]{16}$'
GROUP BY nik
HAVING COUNT(*) > 1;

-- Terapkan unique index pada nik jika belum ada
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'db_surat'
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uk_users_nik'
);

SET @sql = IF(
  @idx_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uk_users_nik UNIQUE (nik);',
  'SELECT "Index uk_users_nik already exists" as message;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- CATATAN PENTING:
-- =====================================================
-- 1. Password untuk semua user baru: 123456
-- 2. Admin existing tetap menggunakan password lama
-- 3. Jika ada error, restore dari backup
-- 4. Test login setelah update selesai
-- =====================================================