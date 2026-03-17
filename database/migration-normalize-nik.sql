-- =====================================================
-- NORMALISASI NIK & UNIQUE CONSTRAINT
-- Tujuan:
-- 1) Ubah data lama format NIK_timestamp menjadi hanya NIK
-- 2) Validasi NIK numerik 16 digit
-- 3) Terapkan unique index pada users.nik
-- =====================================================

USE db_surat;

-- 1) Backup yang direkomendasikan (manual)
-- CREATE TABLE users_backup_nik_20260317 AS SELECT * FROM users;

-- 2) Normalisasi NIK lama: ambil bagian sebelum underscore
UPDATE users
SET nik = SUBSTRING_INDEX(nik, '_', 1)
WHERE nik IS NOT NULL AND nik LIKE '%\_%';

-- 3) Trimming whitespace
UPDATE users
SET nik = TRIM(nik)
WHERE nik IS NOT NULL;

-- 4) Set NULL jika NIK tidak valid agar tidak mengganggu unique index
UPDATE users
SET nik = NULL
WHERE nik IS NOT NULL
  AND nik NOT REGEXP '^[0-9]{16}$';

-- 5) Cek duplikasi NIK valid sebelum membuat unique index
SELECT nik, COUNT(*) AS total
FROM users
WHERE nik IS NOT NULL AND nik REGEXP '^[0-9]{16}$'
GROUP BY nik
HAVING COUNT(*) > 1;

-- Jika query di atas mengembalikan baris, selesaikan duplikasi dulu secara manual.
-- Contoh strategi manual (opsional): nonaktifkan akun duplikat terbaru atau kosongkan NIK duplikat.

-- 6) Pastikan tipe kolom cocok
ALTER TABLE users MODIFY COLUMN nik VARCHAR(16) NULL;

-- 7) Tambah unique index jika belum ada
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uk_users_nik'
);

SET @sql = IF(
  @idx_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uk_users_nik UNIQUE (nik);',
  'SELECT "Index uk_users_nik already exists" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8) Verifikasi akhir
SELECT id, username, email, nik, role, status
FROM users
ORDER BY created_at DESC;
