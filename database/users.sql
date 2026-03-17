-- Drop table if exists to recreate with new structure
DROP TABLE IF EXISTS users;

-- Buat tabel users dengan struktur lengkap
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    role ENUM('admin', 'sekretaris', 'kepala_desa', 'masyarakat') NOT NULL DEFAULT 'masyarakat',
    status ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    nik VARCHAR(16) NULL UNIQUE, -- NIK untuk masyarakat (unik)
    alamat TEXT NULL, -- Alamat lengkap
    telepon VARCHAR(15) NULL, -- Nomor telepon
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default users (password: 123456 untuk semua)
-- Password sudah di-hash menggunakan bcrypt dengan salt rounds 10
INSERT INTO users (id, username, email, password, nama, role, nik, alamat, telepon) VALUES
('admin-001', 'admin', 'admin@desa.go.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator Sistem', 'admin', NULL, NULL, NULL),
('sekretaris-001', 'sekretaris', 'sekretaris@desa.go.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sekretaris Desa', 'sekretaris', '1234567890123456', 'Kantor Desa', '081234567890'),
('kepala-001', 'kepala_desa', 'kepaladesa@desa.go.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala Desa', 'kepala_desa', '1234567890123457', 'Kantor Desa', '081234567891'),
('masyarakat-001', 'masyarakat', 'masyarakat@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Warga Desa', 'masyarakat', '1234567890123458', 'RT 01 RW 01 Desa Contoh', '081234567892');

-- Untuk login gunakan:
-- Admin: username=admin, password=123456
-- Sekretaris: username=sekretaris, password=123456  
-- Kepala Desa: username=kepala_desa, password=123456
-- Masyarakat: username=masyarakat, password=123456