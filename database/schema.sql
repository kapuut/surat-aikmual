-- Create database
CREATE DATABASE IF NOT EXISTS db_surat;
USE db_surat;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'staff') NOT NULL,
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Surat Masuk table
CREATE TABLE surat_masuk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    tanggal_surat DATE NOT NULL,
    tanggal_terima DATE NOT NULL,
    asal_surat VARCHAR(200) NOT NULL,
    perihal TEXT NOT NULL,
    file_path VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Surat Keluar table
CREATE TABLE surat_keluar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    tanggal_surat DATE NOT NULL,
    tujuan VARCHAR(200) NOT NULL,
    perihal TEXT NOT NULL,
    file_path VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Permohonan Surat table
CREATE TABLE permohonan_surat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pemohon VARCHAR(100) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    alamat TEXT NOT NULL,
    jenis_surat VARCHAR(100) NOT NULL,
    keperluan TEXT NOT NULL,
    status ENUM('pending', 'diproses', 'selesai', 'ditolak') DEFAULT 'pending',
    catatan TEXT,
    nomor_surat VARCHAR(100),
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_by INT,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Insert default admin user (password: adminsurat000)
INSERT INTO users (username, password, nama, email, role) VALUES 
('admin', '$2b$10$z8V9b2R4qmBbYaX3IYJ.2eerp0NLEByFFEcTKpPilrlPQE8ebqtR2', 'Administrator', 'admin@aikmual.com', 'admin');


Admin: username=admin, password=123456
Sekretaris: username=sekretaris, password=123456  
Kepala Desa: username=kepala_desa, password=123456
Masyarakat: username=masyarakat, password=123456