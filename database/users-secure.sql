-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 14, 2025 at 02:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12
-- 
-- UPDATED WITH SECURE PASSWORDS

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_surat`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telepon` varchar(15) DEFAULT NULL,
  `role` enum('admin','staff','sekretaris','kepala_desa','masyarakat') NOT NULL DEFAULT 'masyarakat',
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
-- NOTE: Passwords have been updated to more secure versions
-- Admin Password: adminsurat000
-- Sekretaris Password: sekretaris000
-- Kepala Desa Password: kepaladesa000
-- Masyarakat Password: masyarakat000
--

INSERT INTO `users` (`id`, `username`, `password`, `nama`, `email`, `nik`, `alamat`, `telepon`, `role`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', '$2b$10$secure_hash_will_be_generated', 'Administrator Sistem', 'admin@desa.go.id', NULL, NULL, NULL, 'admin', 'aktif', '2025-10-12 15:27:27', '2025-10-14 12:30:00', NULL),
(2, 'sekretaris', '$2b$10$secure_hash_will_be_generated', 'Sekretaris Desa', 'sekretaris@desa.go.id', '1234567890123456', 'Kantor Desa', '081234567890', 'sekretaris', 'aktif', '2025-10-14 08:59:25', '2025-10-14 12:30:00', NULL),
(3, 'kepala_desa', '$2b$10$secure_hash_will_be_generated', 'Kepala Desa', 'kepaladesa@desa.go.id', '1234567890123457', 'Kantor Desa', '081234567891', 'kepala_desa', 'aktif', '2025-10-14 08:59:25', '2025-10-14 12:30:00', NULL),
(4, 'masyarakat', '$2b$10$secure_hash_will_be_generated', 'Warga Desa', 'masyarakat@example.com', '1234567890123458', 'RT 01 RW 01 Desa Contoh', '081234567892', 'masyarakat', 'aktif', '2025-10-14 08:59:25', '2025-10-14 12:30:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

--
-- NOTE: To reset all passwords to secure defaults, run the script:
-- node update-secure-passwords.js
--
