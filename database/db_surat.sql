-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 27, 2026 at 01:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

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
-- Table structure for table `disposisi_surat_masuk`
--

CREATE TABLE `disposisi_surat_masuk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `surat_masuk_id` varchar(64) NOT NULL,
  `tujuan_role` varchar(50) NOT NULL,
  `tujuan_label` varchar(120) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'didisposisikan',
  `urgensi` varchar(20) NOT NULL DEFAULT 'sedang',
  `catatan` text DEFAULT NULL,
  `disposed_by_id` varchar(64) DEFAULT NULL,
  `disposed_by_name` varchar(191) DEFAULT NULL,
  `disposed_by_role` varchar(50) DEFAULT NULL,
  `disposed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disposisi_surat_masuk`
--

INSERT INTO `disposisi_surat_masuk` (`id`, `surat_masuk_id`, `tujuan_role`, `tujuan_label`, `status`, `urgensi`, `catatan`, `disposed_by_id`, `disposed_by_name`, `disposed_by_role`, `disposed_at`, `created_at`) VALUES
(1, '4', 'sekretaris', 'Sekretaris Desa', 'didisposisikan', 'sedang', 'Mohon ditindaklanjuti terkait surat masuk 002/AKM/2026.\nArahan tujuan lanjutan: KAUR PEMERINTAHAN', '3', 'Kepala Desa', 'kepala_desa', '2026-04-11 20:00:20', '2026-04-11 20:00:20'),
(3, '9', 'kepala_desa', 'Konfirmasi Kepala Desa', 'selesai', 'sedang', 'Surat 002/Ds.Aml/04.2026 telah dibaca dan dikonfirmasi selesai oleh Kepala Desa.', '3', 'Kepala Desa', 'kepala_desa', '2026-04-23 12:53:53', '2026-04-23 12:53:53'),
(4, '10', 'kepala_desa', 'Konfirmasi Kepala Desa', 'selesai', 'sedang', 'Surat 009/AKM/2026 telah dibaca dan dikonfirmasi selesai oleh Kepala Desa.', '3', 'Kepala Desa', 'kepala_desa', '2026-04-23 12:54:09', '2026-04-23 12:54:09'),
(5, '8', 'sekretaris', 'Sekretaris Desa', 'diproses', 'tinggi', 'Urgensi disposisi: tinggi\nMohon ditindaklanjuti terkait surat masuk 002/ABC/2026.', '3', 'Kepala Desa', 'kepala_desa', '2026-04-24 11:52:14', '2026-04-24 11:52:14'),
(6, '6', 'sekretaris', 'Sekretaris Desa', 'didisposisikan', 'sedang', 'Urgensi disposisi: sedang\nMohon ditindaklanjuti terkait surat masuk 001/SDK/2026.\nArahan tujuan lanjutan: PELAYANAN', '3', 'Kepala Desa', 'kepala_desa', '2026-04-27 08:55:03', '2026-04-27 08:55:03');

-- --------------------------------------------------------

--
-- Table structure for table `dynamic_template_surat`
--

CREATE TABLE `dynamic_template_surat` (
  `id` varchar(150) NOT NULL,
  `nama` varchar(200) NOT NULL,
  `jenis_surat` varchar(200) NOT NULL,
  `deskripsi` text NOT NULL,
  `html_template` longtext NOT NULL,
  `fields_json` longtext NOT NULL,
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dynamic_template_surat`
--

INSERT INTO `dynamic_template_surat` (`id`, `nama`, `jenis_surat`, `deskripsi`, `html_template`, `fields_json`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
('custom-surat-contoh-2-1777004537904', 'Contoh 2', 'Surat Contoh 2', 'Percobaan contoh 2', '<div style=\"font-family: \'Bookman Old Style\', \'Book Antiqua\', serif; font-size: 12pt; line-height: 1.5; color: #000;\">\n      <div style=\"text-align: center; margin: 0.1cm 0 0.02cm 0; font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;\">SURAT CONTOH 2</div>\n      <div style=\"text-align: center; margin-bottom: 0.32cm; font-size: 12pt; line-height: 1.2;\">Nomor : {{nomor_surat}}</div>\n\n      <p style=\"margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Yang bertanda tangan di bawah ini Kepala Desa {{nama_desa}} Kecamatan Praya Kabupaten Lombok Tengah menerangkan dengan sebenarnya kepada:</p><table style=\"width: 100%; border-collapse: collapse; margin: 0.15cm 0 0.35cm 1.1cm; font-size: 12pt;\"><tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Nama Lengkap</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{nama}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">NIK</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{nik}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Agama</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{agama}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Jenis Kelamin</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{jenis_kelamin}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Alamat</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{alamat}}</td></tr></table><p style=\"margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Dengan ini menerangkan bahwa masyarakat dengan nama  {{nama}} benar ber alamat di  {{alamat}}</p>\n\n      <p style=\"margin: 20px 0 0; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Demikian surat keterangan ini kami buat</p>\n\n      <div style=\"margin-top: 0.25cm; display: flex; justify-content: flex-end; font-size: 12pt; break-inside: avoid; page-break-inside: avoid;\">\n        <div style=\"width: 7.4cm; text-align: center; margin-right: 0.2cm;\">\n          <div>{{kota}}, {{tanggal_surat}}</div>\n          <div style=\"text-transform: uppercase;\">Kepala Desa {{nama_desa}}</div>\n          <div style=\"height: 2.2cm;\"></div>\n          <div style=\"font-weight: bold; text-transform: uppercase; text-decoration: underline;\">{{nama_kepala_desa}}</div>\n        </div>\n      </div>\n    </div>', '[{\"name\":\"nama\",\"label\":\"Nama Lengkap\",\"type\":\"text\",\"required\":true},{\"name\":\"nik\",\"label\":\"NIK\",\"type\":\"text\",\"required\":true},{\"name\":\"agama\",\"label\":\"Agama\",\"type\":\"text\",\"required\":false},{\"name\":\"jenis_kelamin\",\"label\":\"Jenis Kelamin\",\"type\":\"select\",\"required\":false,\"options\":[{\"label\":\"Laki-laki\",\"value\":\"Laki-laki\"},{\"label\":\"Perempuan\",\"value\":\"Perempuan\"}]},{\"name\":\"alamat\",\"label\":\"Alamat\",\"type\":\"textarea\",\"required\":true}]', 'aktif', '1', '2026-04-24 04:22:17', '2026-04-24 04:22:17'),
('custom-surat-keterangan-contoh-1776712713162', 'Template Surat Contoh', 'Surat Keterangan Contoh', 'Template contoh', '<div style=\"font-family: \'Times New Roman\', serif; line-height: 1.7; color: #111827;\">\n      <h2 style=\"text-align:center; margin-bottom: 0;\">SURAT KETERANGAN CONTOH</h2>\n      <p style=\"text-align:center; margin-top: 4px;\">Nomor: {{nomor_surat}}</p>\n\n      <p style=\"margin: 0 0 12px;\">Yang bertanda tangan di bawah ini, Kepala Desa Aikmual, menerangkan dengan sebenarnya kepada:</p><table style=\"width:100%; margin: 12px 0 16px; border-collapse: collapse;\"><tr><td style=\"width: 220px; vertical-align: top;\">Nama Lengkap</td><td>: {{nama}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">NIK / No KTP</td><td>: {{nik}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Alamat</td><td>: {{alamat}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Tempat Lahir</td><td>: {{tempat_lahir}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Tanggal Lahir</td><td>: {{tanggal_lahir}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Jenis Kelamin</td><td>: {{jenis_kelamin}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Status Perkawinan</td><td>: {{status_perkawinan}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Kewarganegaraan</td><td>: {{kewarganegaraan}}</td></tr>\n<tr><td style=\"width: 220px; vertical-align: top;\">Pekerjaan</td><td>: {{pekerjaan}}</td></tr></table><p style=\"margin: 0 0 12px;\">Dengan ini menerangkan bahwa</p>\n\n      <p style=\"margin: 20px 0 0;\">Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.</p>\n\n      <div style=\"margin-top: 32px; text-align:right;\">\n        <p>{{kota}}, {{tanggal_surat}}</p>\n        <p>Kepala Desa {{nama_desa}}</p>\n        <br /><br /><br />\n        <p><b>{{nama_kepala_desa}}</b></p>\n      </div>\n    </div>', '[{\"name\":\"nama\",\"label\":\"Nama Lengkap\",\"type\":\"text\",\"required\":true},{\"name\":\"nik\",\"label\":\"NIK / No KTP\",\"type\":\"text\",\"required\":true},{\"name\":\"alamat\",\"label\":\"Alamat\",\"type\":\"textarea\",\"required\":true},{\"name\":\"tempat_lahir\",\"label\":\"Tempat Lahir\",\"type\":\"text\",\"required\":false},{\"name\":\"tanggal_lahir\",\"label\":\"Tanggal Lahir\",\"type\":\"date\",\"required\":false},{\"name\":\"jenis_kelamin\",\"label\":\"Jenis Kelamin\",\"type\":\"select\",\"required\":false,\"options\":[{\"label\":\"Laki-laki\",\"value\":\"Laki-laki\"},{\"label\":\"Perempuan\",\"value\":\"Perempuan\"}]},{\"name\":\"status_perkawinan\",\"label\":\"Status Perkawinan\",\"type\":\"select\",\"required\":false,\"options\":[{\"label\":\"Belum Kawin\",\"value\":\"Belum Kawin\"},{\"label\":\"Kawin\",\"value\":\"Kawin\"},{\"label\":\"Cerai Hidup\",\"value\":\"Cerai Hidup\"},{\"label\":\"Cerai Mati\",\"value\":\"Cerai Mati\"}]},{\"name\":\"kewarganegaraan\",\"label\":\"Kewarganegaraan\",\"type\":\"text\",\"required\":false,\"placeholder\":\"Indonesia\"},{\"name\":\"pekerjaan\",\"label\":\"Pekerjaan\",\"type\":\"text\",\"required\":false}]', 'aktif', '1', '2026-04-20 19:18:33', '2026-04-20 19:18:33'),
('surat-domisili', 'Template Surat Keterangan Domisili', 'Surat Keterangan Domisili', 'Template HTML dinamis untuk surat keterangan tempat tinggal atau domisili.', '<div style=\"font-family: \'Bookman Old Style\', \'Book Antiqua\', serif; font-size: 12pt; line-height: 1.5; color: #000;\">\n      <div style=\"text-align: center; margin: 0.1cm 0 0.02cm 0; font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;\">SURAT KETERANGAN DOMISILI</div>\n      <div style=\"text-align: center; margin-bottom: 0.32cm; font-size: 12pt; line-height: 1.2;\">Nomor : {{nomor_surat}}</div>\n\n      <p style=\"margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Yang bertanda tangan di bawah ini Kepala Desa {{nama_desa}} Kecamatan Praya Kabupaten Lombok Tengah menerangkan dengan sebenarnya kepada:</p><table style=\"width: 100%; border-collapse: collapse; margin: 0.15cm 0 0.35cm 1.1cm; font-size: 12pt;\"><tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Nama Lengkap</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{nama}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">NIK</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{nik}}</td></tr>\n<tr><td style=\"width: 3.8cm; white-space: nowrap; vertical-align: top;\">Alamat</td><td style=\"width: 0.35cm; text-align: center; vertical-align: top;\">:</td><td style=\"vertical-align: top;\">{{alamat}}</td></tr></table><p style=\"margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Dengan ini menerangkan bahwa {{nama}} dengan NIK {{nik}} benar berdomisili di {{alamat}}.</p>\n\n      <p style=\"margin: 20px 0 0; text-align: justify; text-indent: 1.1cm; line-height: 1.5;\">Demikian surat keterangan</p>\n\n      <div style=\"margin-top: 0.25cm; display: flex; justify-content: flex-end; font-size: 12pt; break-inside: avoid; page-break-inside: avoid;\">\n        <div style=\"width: 7.4cm; text-align: center; margin-right: 0.2cm;\">\n          <div>{{kota}}, {{tanggal_surat}}</div>\n          <div style=\"text-transform: uppercase;\">Kepala Desa {{nama_desa}}</div>\n          <div style=\"height: 2.2cm;\"></div>\n          <div style=\"font-weight: bold; text-transform: uppercase; text-decoration: underline;\">{{nama_kepala_desa}}</div>\n        </div>\n      </div>\n    </div>', '[{\"name\":\"nama\",\"label\":\"Nama Lengkap\",\"type\":\"text\",\"required\":true},{\"name\":\"nik\",\"label\":\"NIK\",\"type\":\"text\",\"required\":true},{\"name\":\"alamat\",\"label\":\"Alamat\",\"type\":\"textarea\",\"required\":true}]', 'aktif', '1', '2026-04-24 04:17:46', '2026-04-24 04:17:46');

-- --------------------------------------------------------

--
-- Table structure for table `letterhead_templates`
--

CREATE TABLE `letterhead_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('desa','kecamatan','kabupaten') DEFAULT 'desa',
  `header_content` text DEFAULT NULL COMMENT 'HTML/Text untuk header',
  `footer_content` text DEFAULT NULL COMMENT 'HTML/Text untuk footer',
  `logo_path` varchar(500) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `letterhead_templates`
--

INSERT INTO `letterhead_templates` (`id`, `name`, `type`, `header_content`, `footer_content`, `logo_path`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 'Kop Surat Desa Aikmual', 'desa', 'PEMERINTAH KABUPATEN LOMBOK TENGAH\nKECAMATAN PRAYA BARAT\nDESA AIKMUAL\n\nAlamat: Jl. Raya Aikmual, Praya Barat, Lombok Tengah\nTelepon: (0370) 123456 | Email: aikmual@lomboktengah.go.id', NULL, NULL, 1, '2026-02-26 18:10:36', '2026-02-26 18:10:36');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`, `used_at`) VALUES
(3, 10, '163ddbb98a830ec8db63f48d9ab01fc976fc41cfae30e4093cc27c63213a5507', '2026-04-19 18:49:16', '2026-04-19 10:49:16', '2026-04-19 17:49:16');

-- --------------------------------------------------------

--
-- Stand-in structure for view `password_reset_tokens_csv`
-- (See below for the actual view)
--
CREATE TABLE `password_reset_tokens_csv` (
`id` int(11)
,`user_id` int(11)
,`token` varchar(255)
,`expires_at` varchar(24)
,`created_at` varchar(24)
,`used_at` varchar(24)
);

-- --------------------------------------------------------

--
-- Table structure for table `permohonan_surat`
--

CREATE TABLE `permohonan_surat` (
  `id` int(11) NOT NULL,
  `nomor_permohonan` varchar(50) DEFAULT NULL,
  `nama_pemohon` varchar(100) NOT NULL,
  `nik` varchar(16) NOT NULL,
  `alamat` text NOT NULL,
  `jenis_surat` varchar(100) NOT NULL,
  `keperluan` text NOT NULL,
  `status` enum('pending','diproses','selesai','ditolak') DEFAULT 'pending',
  `catatan` text DEFAULT NULL,
  `data_detail` text DEFAULT NULL,
  `nomor_surat` varchar(100) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `processed_by` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permohonan_surat`
--

INSERT INTO `permohonan_surat` (`id`, `nomor_permohonan`, `nama_pemohon`, `nik`, `alamat`, `jenis_surat`, `keperluan`, `status`, `catatan`, `data_detail`, `nomor_surat`, `file_path`, `created_at`, `updated_at`, `processed_by`, `user_id`) VALUES
(8, 'PMH-00008', 'Shaqueena', '5202014209030001', 'Aikmual Barat', 'Surat Keterangan Domisili', 'SURAT DOMISILI', 'selesai', 'Surat telah diverifikasi dan ditandatangani secara digital oleh Kepala Desa.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2005-12-12\",\"jenis_kelamin\":\"Perempuan\",\"agama\":\"Islam\",\"pekerjaan\":\"PNS\",\"status_perkawinan\":\"Belum Kawin\",\"kewarganegaraan\":\"Indonesia\",\"alamatSebelumnya\":\"Aikmual Timur\",\"rt\":\"001\",\"rw\":\"001\",\"kelurahan\":\"Aikmual\",\"kecamatan\":\"Praya\",\"kabupaten\":\"Praya\",\"provinsi\":\"Indonesia\",\"kodePos\":\"83511\",\"noTelp\":\"08175736407\",\"statusTempat\":\"Milik Sendiri\",\"lamaTinggal\":\"1 tahun\"}', '004/Ds.Aml/04.2026', '/generated-surat/004-Ds.Aml-04.2026-surat-domisili.html', '2026-04-06 12:55:25', '2026-04-27 06:15:11', 3, 9),
(9, 'PMH-00009', 'aeri', '5202014209030001', 'Aikmual timur', 'Surat Keterangan Masih Hidup', 'Untuk asuransi', 'selesai', 'Surat telah diverifikasi dan ditandatangani secara digital oleh Kepala Desa.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2005-12-12\",\"jenis_kelamin\":\"Perempuan\",\"agama\":\"Islam\",\"kewarganegaraan\":\"Indonesia\",\"telepon\":\"085253271360\",\"noTelp\":\"085253271360\",\"alamatTerakhir\":\"Aikmual timur\"}', '005/Ds.Aml/04.2026', '/generated-surat/005-Ds.Aml-04.2026-surat-masih-hidup.html', '2026-04-06 18:52:54', '2026-04-27 06:15:11', 3, 9),
(10, 'PMH-00010', 'Agil', '5202014209030001', 'Dasan Agung', 'Surat Keterangan Masih Hidup', 'Nikah', 'selesai', 'Surat telah diverifikasi dan ditandatangani secara digital oleh Kepala Desa.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2003-12-12\",\"jenis_kelamin\":\"Laki-laki\",\"agama\":\"Islam\",\"kewarganegaraan\":\"Indonesia\",\"telepon\":\"087765328724\",\"nik_input\":\"5202014209030001\",\"noTelp\":\"087765328724\",\"alamatTerakhir\":\"Dasan Agung\"}', '006/Ds.Aml/04.2026', '/generated-surat/006-Ds.Aml-04.2026-surat-masih-hidup.html', '2026-04-07 04:53:38', '2026-04-27 06:15:11', 3, 9),
(14, 'PMH-00014', 'Karunia Putri', '5202014209030001', 'Mataram, NTB', 'Surat Keterangan Kematian', 'Keperluan waris', 'selesai', 'Surat telah diverifikasi dan ditandatangani secara digital oleh Kepala Desa.', '{\"tempat_lahir\":\"Aikmual\",\"tanggal_lahir\":\"1988-04-12\",\"jenis_kelamin\":\"Perempuan\",\"agama\":\"Islam\",\"pekerjaan\":\"Pegawa Negri Sipil (PNS)\",\"kewarganegaraan\":\"Indonesia\",\"telepon\":\"087654321123\",\"nik_input\":\"5202014258000888\",\"nama_almarhum\":\"Siti\",\"nik_almarhum\":\"5201105487000967\",\"tempat_lahir_almarhum\":\"Aikmual\",\"tanggal_lahir_almarhum\":\"1988-04-12\",\"jenis_kelamin_almarhum\":\"Perempuan\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"Pegawa Negri Sipil (PNS)\",\"alamat_terakhir\":\"Aikmual Timur, Desa Aikmual\",\"hubungan_pelapor\":\"Anak\",\"tanggal_meninggal\":\"2025-12-30\",\"waktu_meninggal\":\"07:00\",\"tempat_meninggal\":\"RSUD Provinsi\",\"tanggal_pemakaman\":\"2025-12-30\",\"waktu_pemakaman\":\"16:00\",\"tempat_pemakaman\":\"Pemakaman Umum Desa Aikmual\",\"noTelp\":\"087654321123\",\"hubunganDenganAlmarhum\":\"Anak\",\"namaAlmarhum\":\"Siti\",\"nikAlmarhum\":\"5201105487000967\",\"tempatLahirAlmarhum\":\"Aikmual\",\"tanggalLahirAlmarhum\":\"1988-04-12\",\"jenisKelaminAlmarhum\":\"Perempuan\",\"agamaAlmarhum\":\"Islam\",\"pekerjaanAlmarhum\":\"Pegawa Negri Sipil (PNS)\",\"alamatTerakhir\":\"Aikmual Timur, Desa Aikmual\",\"tanggalMeninggal\":\"2025-12-30\",\"waktuMeninggal\":\"07:00\",\"tempatMeninggal\":\"RSUD Provinsi\",\"tanggalPemakaman\":\"2025-12-30\",\"waktuPemakaman\":\"16:00\",\"tempatPemakaman\":\"Pemakaman Umum Desa Aikmual\"}', '007/Ds.Aml/04.2026', '/generated-surat/007-Ds.Aml-04.2026-surat-kematian.html', '2026-04-08 10:01:48', '2026-04-27 06:15:11', 3, 9),
(15, 'PMH-00015', 'Uji Cerai Flow', '1234567890123456', 'Dusun Uji Alur', 'Surat Keterangan Cerai', 'Uji validasi end-to-end', 'ditolak', 'Data permohonan belum sesuai persyaratan.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"1990-01-01\",\"jenis_kelamin\":\"Laki-laki\",\"agama\":\"Islam\",\"pekerjaan\":\"Wiraswasta\",\"status_perkawinan\":\"Cerai Hidup\",\"kewarganegaraan\":\"Indonesia\",\"telepon\":\"081234567890\",\"nik_input\":\"1234567890123456\",\"jenis_kelamin_almarhum\":\"Laki-laki\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"Wiraswasta\",\"nama_mantan\":\"Uji Mantan\",\"tanggal_cerai\":\"2024-01-10\",\"nomor_akta_cerai\":\"123/AC/2024\",\"tempat_cerai\":\"Pengadilan Agama Praya\",\"noTelp\":\"081234567890\",\"namaMantan\":\"Uji Mantan\",\"tanggalCerai\":\"2024-01-10\",\"nomorAktaCerai\":\"123/AC/2024\",\"tempatCerai\":\"Pengadilan Agama Praya\"}', NULL, '[\"/uploads/1775645154688-README.md\",\"/uploads/1775645154688-README.md\",\"/uploads/1775645154688-README.md\"]', '2026-04-08 10:45:54', '2026-04-27 06:15:11', 1, 2),
(17, 'PMH-00017', 'Nina', '5202014209030001', 'Dusun Darwis Desa Aikmual', 'Surat Keterangan Cerai', 'keperluan hukum', 'ditolak', 'BLM SESUAI', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"1990-12-12\",\"jenis_kelamin\":\"Perempuan\",\"agama\":\"Islam\",\"pekerjaan\":\"PNS\",\"status_perkawinan\":\"Cerai Hidup\",\"kewarganegaraan\":\"Indonesia\",\"telepon\":\"081346758908\",\"nik_input\":\"5202011425467900\",\"jenis_kelamin_almarhum\":\"Perempuan\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"PNS\",\"nama_mantan\":\"Nino\",\"nik_pasangan\":\"5203857629385740\",\"tempat_lahir_pasangan\":\"Puyung\",\"tanggal_lahir_pasangan\":\"1989-03-27\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"agama_pasangan\":\"Islam\",\"pekerjaan_pasangan\":\"Wiraswasta\",\"alamat_pasangan\":\"Dusun Darwis Desa Aikmual\",\"tanggal_cerai\":\"2026-04-01\",\"noTelp\":\"081346758908\",\"namaMantan\":\"Nino\",\"nikPasangan\":\"5203857629385740\",\"tempatLahirPasangan\":\"Puyung\",\"tanggalLahirPasangan\":\"1989-03-27\",\"kewarganegaraanPasangan\":\"Indonesia\",\"agamaPasangan\":\"Islam\",\"pekerjaanPasangan\":\"Wiraswasta\",\"tanggalCerai\":\"2026-04-01\",\"alamatPasangan\":\"Dusun Darwis Desa Aikmual\",\"nikMantan\":\"5203857629385740\"}', NULL, '[\"/uploads/1775693102459-ava 1.jpg\",\"/uploads/1775693102459-ava 5.jpg\",\"/uploads/1775693102459-ava 7.jpg\"]', '2026-04-09 00:05:02', '2026-04-27 06:15:11', 1, 9),
(18, 'PMH-00018', 'Akmal', '5202014209030001', 'Dusun Penaban, Desa Aikmual\nKec. Praya, Kab. Lombok Tengah', 'Surat Keterangan Janda/Duda', 'surat', '', 'Status diperbarui oleh Admin', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"1990-04-23\",\"jenis_kelamin\":\"Laki-laki\",\"agama\":\"Islam\",\"pekerjaan\":\"Wiraswasta\",\"status_perkawinan\":\"Duda (Cerai Hidup)\",\"status_janda\":\"Duda\",\"alasan_status_janda\":\"Cerai Hidup\",\"kewarganegaraan\":\"Indonesia\",\"dusun_pemohon\":\"Penaban\",\"desa_pemohon\":\"Aikmual\",\"kecamatan_pemohon\":\"Praya\",\"kabupaten_pemohon\":\"Lombok Tengah\",\"alamat_pemohon\":\"Dusun Penaban, Desa Aikmual\\nKec. Praya, Kab. Lombok Tengah\",\"telepon\":\"087654321123\",\"nik_input\":\"4578299887598596\",\"jenis_kelamin_almarhum\":\"Laki-laki\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"Wiraswasta\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"noTelp\":\"087654321123\"}', '001/Ds.Aml/04.2026', '[]', '2026-04-09 03:08:08', '2026-04-27 06:15:11', 1, 9),
(19, 'PMH-00019', 'Bahira', '5202014209030001', 'Dusun Penaban, Desa Aikmual\nKec. Praya, Kab. Lombok Tengah', 'Surat Keterangan Kehilangan', '-', '', 'Status diperbarui oleh Admin', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2000-09-23\",\"jenis_kelamin\":\"Perempuan\",\"pekerjaan\":\"Mahasiswa\",\"status_perkawinan\":\"Belum Kawin\",\"kewarganegaraan\":\"Indonesia\",\"dusun_pemohon\":\"Penaban\",\"desa_pemohon\":\"Aikmual\",\"kecamatan_pemohon\":\"Praya\",\"kabupaten_pemohon\":\"Lombok Tengah\",\"alamat_pemohon\":\"Dusun Penaban, Desa Aikmual\\nKec. Praya, Kab. Lombok Tengah\",\"telepon\":\"087654321123\",\"nik_input\":\"5647820860836750\",\"masa_berlaku_dari\":\"2026-04-09\",\"masa_berlaku_sampai\":\"2026-10-09\",\"penyandang_cacat\":\"Tidak\",\"jenis_barang\":\"Barang Pribadi\",\"barang_hilang\":\"Dompet\",\"ciri_barang\":\"Warna Hitam Merk A\",\"tanggal_kehilangan\":\"2026-04-09\",\"lokasi_kehilangan\":\"Jalan Praya - Mantang\",\"jenis_kelamin_almarhum\":\"Perempuan\",\"pekerjaan_almarhum\":\"Mahasiswa\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"noTelp\":\"087654321123\"}', '001/Ds.Aml/04.2026', '[]', '2026-04-09 03:45:31', '2026-04-27 06:15:11', 1, 9),
(20, 'PMH-00020', 'Wawan', '1234567890123456', 'Dusun A, Desa B\nKec. C, Kab. D', 'Surat Keterangan Penghasilan', 'Beasiswa', '', 'Status diperbarui oleh Admin', '{\"a\":1}', '002/Ds.Aml/04.2026', '[\"/uploads/a.png\",\"/uploads/b.png\"]', '2026-04-09 04:30:23', '2026-04-27 06:15:11', 1, 2),
(23, 'PMH-00023', 'Wawan', '5202014209030001', 'Dusun Penaban, Desa Aikmual\nKec. Praya, Kab. Lombok Tengah', 'Surat Keterangan Penghasilan', 'UKT', 'selesai', 'Status diperbarui oleh Kepala Desa', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2025-12-31\",\"jenis_kelamin\":\"Laki-laki\",\"agama\":\"Islam\",\"pekerjaan\":\"Mahasiswa\",\"status_perkawinan\":\"Belum Kawin\",\"kewarganegaraan\":\"Indonesia\",\"dusun_pemohon\":\"Penaban\",\"desa_pemohon\":\"Aikmual\",\"kecamatan_pemohon\":\"Praya\",\"kabupaten_pemohon\":\"Lombok Tengah\",\"alamat_pemohon\":\"Dusun Penaban, Desa Aikmual\\nKec. Praya, Kab. Lombok Tengah\",\"telepon\":\"087654321123\",\"nik_input\":\"5202014209030009\",\"pendidikan\":\"S1\",\"nama_wali\":\"M. Hasyim\",\"nik_wali\":\"9757467874897867\",\"tempat_lahir_wali\":\"Aikmual\",\"tanggal_lahir_wali\":\"1987-03-12\",\"jenis_kelamin_wali\":\"Laki-laki\",\"agama_wali\":\"Islam\",\"sumber_penghasilan\":\"Guru\",\"penghasilan_per_bulan\":\"3000000\",\"jenis_kelamin_almarhum\":\"Laki-laki\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"Mahasiswa\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"noTelp\":\"087654321123\"}', '001/Ds.Aml/04.2026', '/generated-surat/001-Ds.Aml-04.2026-surat-penghasilan.html', '2026-04-09 04:38:56', '2026-04-27 06:15:11', 3, 9),
(24, 'PMH-00024', 'Agil', '5201010101010101', 'Dusun Lengkok Buak, Desa Aikmual\nKec. Praya, Kab. Lombok Tengah', 'Surat Keterangan Tidak Memiliki Rumah', 'Kelengkapan Administrasi', 'selesai', 'Surat telah diverifikasi dan ditandatangani secara digital oleh Kepala Desa.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"1993-10-23\",\"jenis_kelamin\":\"Laki-laki\",\"agama\":\"Islam\",\"pekerjaan\":\"Karyawan Swasta\",\"status_perkawinan\":\"Belum Kawin\",\"kewarganegaraan\":\"Indonesia\",\"dusun_pemohon\":\"Lengkok Buak\",\"desa_pemohon\":\"Aikmual\",\"kecamatan_pemohon\":\"Praya\",\"kabupaten_pemohon\":\"Lombok Tengah\",\"alamat_pemohon\":\"Dusun Lengkok Buak, Desa Aikmual\\nKec. Praya, Kab. Lombok Tengah\",\"telepon\":\"081234567890\",\"nik_input\":\"5201010101010101\",\"status_tempat_tinggal\":\"Menumpang\",\"nama_pemilik_rumah\":\"H. Salim\",\"hubungan_dengan_pemilik\":\"Kerabat\",\"alamat_tinggal_sekarang\":\"Lengkok Buak Desa Aikmual\",\"lama_menempati\":\"3 tahun\",\"jumlah_tanggungan\":\"2\",\"alasan_tidak_memiliki\":\"Belum mampu membeli rumah\",\"penyandang_cacat\":\"Tidak\",\"jenis_kelamin_almarhum\":\"Laki-laki\",\"agama_almarhum\":\"Islam\",\"pekerjaan_almarhum\":\"Karyawan Swasta\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"noTelp\":\"081234567890\"}', '002/Ds.Aml/04.2026', '/generated-surat/002-Ds.Aml-04.2026-surat-tidak-punya-rumah.html', '2026-04-09 04:47:46', '2026-04-27 06:15:32', 3, 1),
(28, 'PMH-00028', 'Giselle', '5202014209030001', 'Aikmual Barat, Desa Aikmual', 'Surat Keterangan Masih Hidup', 'Asuransi', 'selesai', 'Permohonan selesai diproses dan surat siap digunakan.', '{\"tempat_lahir\":\"Praya\",\"tanggal_lahir\":\"2000-03-24\",\"jenis_kelamin\":\"Perempuan\",\"agama\":\"Islam\",\"kewarganegaraan\":\"Indonesia\",\"alamat_pemohon\":\"Aikmual Barat, Desa Aikmual\",\"telepon\":\"08175736407\",\"nik_input\":\"5202014209030001\",\"jenis_kelamin_almarhum\":\"Perempuan\",\"agama_almarhum\":\"Islam\",\"alamat_terakhir\":\"Aikmual Barat, Desa Aikmual\",\"kewarganegaraan_pasangan\":\"Indonesia\",\"noTelp\":\"08175736407\",\"alamatTerakhir\":\"Aikmual Barat, Desa Aikmual\"}', '007/Ds.Aml/04.2026', '/generated-surat/007-Ds.Aml-04.2026-surat-masih-hidup.html', '2026-04-12 07:23:58', '2026-04-27 06:15:11', 3, 9);

-- --------------------------------------------------------

--
-- Table structure for table `surat_keluar`
--

CREATE TABLE `surat_keluar` (
  `id` int(11) NOT NULL,
  `nomor_surat` varchar(100) NOT NULL,
  `tanggal_surat` date NOT NULL,
  `tujuan` varchar(200) NOT NULL,
  `perihal` text NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `surat_keluar`
--

INSERT INTO `surat_keluar` (`id`, `nomor_surat`, `tanggal_surat`, `tujuan`, `perihal`, `file_path`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '001/Ds.Aml/04.2026', '2026-04-06', 'Karunia Putri', 'Surat Keterangan Domisili - Surat', '/generated-surat/001-Ds.Aml-04.2026-surat-domisili.html', 3, '2026-04-06 05:45:26', '2026-04-06 07:44:32'),
(2, '004/Ds.Aml/04.2026', '2026-04-06', 'Shaqueena', 'Surat Keterangan Domisili - SURAT DOMISILI', '/generated-surat/004-Ds.Aml-04.2026-surat-domisili.html', 3, '2026-04-06 16:37:10', '2026-04-06 16:37:10'),
(3, '003/Ds.Aml/04.2026', '2026-04-06', 'Ka Putri', 'Surat Keterangan Domisili - surat', '/generated-surat/003-Ds.Aml-04.2026-surat-domisili.html', 3, '2026-04-06 16:37:16', '2026-04-06 16:37:16'),
(4, '005/Ds.Aml/04.2026', '2026-04-06', 'aeri', 'Surat Keterangan Masih Hidup - Untuk asuransi', '/generated-surat/005-Ds.Aml-04.2026-surat-masih-hidup.html', 3, '2026-04-06 19:18:07', '2026-04-06 19:18:07'),
(5, '006/Ds.Aml/04.2026', '2026-04-07', 'Agil', 'Surat Keterangan Masih Hidup - Nikah', '/generated-surat/006-Ds.Aml-04.2026-surat-masih-hidup.html', 3, '2026-04-07 04:58:30', '2026-04-07 04:58:30'),
(6, '007/Ds.Aml/04.2026', '2026-04-08', 'Karunia Putri', 'Surat Keterangan Kematian - Keperluan waris', '/generated-surat/007-Ds.Aml-04.2026-surat-kematian.html', 3, '2026-04-08 10:29:50', '2026-04-08 10:29:50'),
(7, '002/Ds.Aml/04.2026', '2026-04-09', 'Agil', 'Surat Keterangan Tidak Memiliki Rumah - Kelengkapan Administrasi', '/generated-surat/002-Ds.Aml-04.2026-surat-tidak-punya-rumah.html', 3, '2026-04-09 05:20:54', '2026-04-09 05:20:54'),
(11, '003/AKM/2026', '2026-04-22', 'SDN 3 Aikmual', 'Undangan Rapat', '/uploads/surat-keluar/DIAGRAM-DIAGRAM TA-Struktur Proyek PXP.drawio (1).png', 1, '2026-04-22 11:27:12', '2026-04-22 11:27:12'),
(12, '009/Ds.Aml/04.2026', '2026-04-24', 'Karunia Putri', 'Surat Contoh 2', '/generated-surat/009-Ds.Aml-04.2026-custom-surat-contoh-2-1777004537904.html', 3, '2026-04-24 04:38:02', '2026-04-24 04:38:02'),
(13, '008/Ds.Aml/04.2026', '2026-04-24', 'Karunia Putri', 'Surat Keterangan Contoh', '/generated-surat/008-Ds.Aml-04.2026-custom-surat-keterangan-contoh-1776712713162.html', 3, '2026-04-24 04:40:20', '2026-04-24 04:40:20'),
(14, '007/Ds.Aml/04.2026', '2026-04-24', 'Giselle', 'Surat Keterangan Masih Hidup', '/generated-surat/007-Ds.Aml-04.2026-surat-masih-hidup.html', 3, '2026-04-24 04:49:47', '2026-04-24 04:49:47');

-- --------------------------------------------------------

--
-- Table structure for table `surat_masuk`
--

CREATE TABLE `surat_masuk` (
  `id` int(11) NOT NULL,
  `nomor_surat` varchar(100) NOT NULL,
  `tanggal_surat` date NOT NULL,
  `tanggal_terima` date NOT NULL,
  `asal_surat` varchar(200) NOT NULL,
  `perihal` text NOT NULL,
  `urgensi` varchar(20) NOT NULL DEFAULT 'sedang',
  `status_penanganan` varchar(30) NOT NULL DEFAULT 'belum_ditangani',
  `ditangani_at` datetime NOT NULL,
  `ditangani_by_id` varchar(64) NOT NULL DEFAULT '0',
  `ditangani_by_name` varchar(191) NOT NULL DEFAULT 'Belum Ditangani',
  `catatan_penanganan` text NOT NULL,
  `file_path` varchar(255) NOT NULL DEFAULT '',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `surat_masuk`
--

INSERT INTO `surat_masuk` (`id`, `nomor_surat`, `tanggal_surat`, `tanggal_terima`, `asal_surat`, `perihal`, `urgensi`, `status_penanganan`, `ditangani_at`, `ditangani_by_id`, `ditangani_by_name`, `catatan_penanganan`, `file_path`, `created_by`, `created_at`, `updated_at`) VALUES
(4, '002/AKM/2026', '2025-12-12', '2026-04-09', 'Dinas Pendidikan Provinsi', 'Undangan rapats', 'sedang', 'belum_ditangani', '2026-04-10 06:43:48', '0', 'Belum Ditangani', 'Belum ditangani', '/uploads/surat-masuk/1775778228480-mypkodr-Jadwal_Kuliah_Genap_2025-2026_v2.0__1_.pdf', 1, '2026-04-09 23:43:48', '2026-04-27 06:22:16'),
(5, '002/AKM/2026', '2020-12-12', '2026-04-21', 'Perpustakaan NTB', 'Perihal undangan', 'sedang', 'belum_ditangani', '2026-04-21 14:53:03', '0', 'Belum Ditangani', 'Belum ditangani', '/uploads/surat-masuk/1776757983263-37hnoqi-DOMISILI.docx', 1, '2026-04-21 07:53:03', '2026-04-27 06:22:16'),
(6, '001/SDK/2026', '2026-01-12', '2026-04-21', 'Universitas Mataram', 'Penting', 'sedang', 'belum_ditangani', '2026-04-21 15:32:23', '0', 'Belum Ditangani', 'Belum ditangani', '/uploads/surat-masuk/1776760343624-ztvq5j4-materi_ptrait.png', 1, '2026-04-21 08:32:23', '2026-04-27 06:22:16'),
(7, '002/ABC/2026', '2026-01-23', '2026-04-21', 'SDN 1 Aikmual', 'Surat undangan', 'sedang', 'selesai', '2026-04-24 11:52:30', '3', 'Kepala Desa', 'Surat 002/ABC/2026 telah dibaca dan dikonfirmasi selesai oleh Kepala Desa.', '/uploads/surat-masuk/5318-Article Text-15118-1-10-20220815 (1).pdf', 1, '2026-04-21 09:11:32', '2026-04-24 04:52:30'),
(8, '002/ABC/2026', '2025-09-01', '2026-04-22', 'SDN 3 Aikmual', 'Surat Permohonan', 'sedang', 'diproses', '2026-04-27 08:51:48', '2', 'Sekretaris Desa', 'Surat sedang ditindaklanjuti oleh Sekretaris.', '/uploads/surat-masuk/screencapture-localhost-3000-api-admin-dynamic-templates-preview-surat-penghasilan-2026-04-21-07_03_51.png', 1, '2026-04-22 11:32:02', '2026-04-27 01:51:48'),
(9, '002/Ds.Aml/04.2026', '2025-04-12', '2026-04-22', 'Universitas Mataram', 'Undangan', 'sedang', 'belum_ditangani', '2026-04-22 18:38:24', '0', 'Belum Ditangani', 'Belum ditangani', '/uploads/surat-masuk/screencapture-localhost-3000-api-admin-dynamic-templates-preview-surat-penghasilan-2026-04-21-07_03_51 (1).png', 1, '2026-04-22 11:38:24', '2026-04-27 06:22:16'),
(10, '009/AKM/2026', '2025-07-23', '2025-07-23', 'SDN 2 Praya', 'Pemberitahuan', 'sedang', 'belum_ditangani', '2026-04-22 18:41:44', '0', 'Belum Ditangani', 'Belum ditangani', '/uploads/surat-masuk/screencapture-localhost-3000-api-admin-dynamic-templates-preview-custom-surat-keterangan-contoh-1776712713162-2026-04-21-07_11_44.png', 1, '2026-04-22 11:41:44', '2026-04-27 06:22:16');

-- --------------------------------------------------------

--
-- Table structure for table `surat_numbering`
--

CREATE TABLE `surat_numbering` (
  `id` int(11) NOT NULL,
  `jenis_surat` varchar(100) NOT NULL,
  `tahun` int(11) NOT NULL,
  `bulan` int(11) NOT NULL,
  `last_number` int(11) DEFAULT 0,
  `prefix` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `template_surat`
--

CREATE TABLE `template_surat` (
  `id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `jenis_surat` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `kategori` varchar(50) DEFAULT 'Keterangan',
  `placeholder_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`placeholder_fields`)),
  `status` enum('aktif','nonaktif','draft') DEFAULT 'aktif',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `has_letterhead` tinyint(1) DEFAULT 0 COMMENT 'Apakah template sudah memiliki kop surat',
  `letterhead_type` enum('desa','kecamatan','custom','none') DEFAULT 'none' COMMENT 'Jenis kop surat',
  `auto_number` tinyint(1) DEFAULT 1 COMMENT 'Auto generate nomor surat',
  `number_format` varchar(100) DEFAULT '{nomor}/SKD/DS/{tahun}' COMMENT 'Format nomor surat',
  `field_mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Mapping field form ke placeholder template' CHECK (json_valid(`field_mapping`)),
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Aturan validasi field' CHECK (json_valid(`validation_rules`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `template_surat`
--

INSERT INTO `template_surat` (`id`, `nama`, `jenis_surat`, `deskripsi`, `file_path`, `file_name`, `kategori`, `placeholder_fields`, `status`, `created_by`, `created_at`, `updated_at`, `has_letterhead`, `letterhead_type`, `auto_number`, `number_format`, `field_mapping`, `validation_rules`) VALUES
(1, 'Template Surat Domisili', 'surat-domisili', 'Template untuk surat keterangan domisili', '/templates/template-domisili.docx', 'template-domisili.docx', 'Keterangan', '[\"nama\", \"nik\", \"tempatLahir\", \"tanggalLahir\", \"jenisKelamin\", \"agama\", \"pekerjaan\", \"alamat\", \"rt\", \"rw\", \"kelurahan\", \"kecamatan\", \"keperluan\"]', 'aktif', 1, '2026-02-15 15:17:25', '2026-04-27 06:28:39', 1, 'desa', 1, '{nomor}/SKD/DS/{tahun}', '{\"nama\": \"nama\", \"nik\": \"nik\", \"tempatLahir\": \"tempatLahir\", \"tanggalLahir\": \"tanggalLahir\", \"jenisKelamin\": \"jenisKelamin\", \"agama\": \"agama\", \"pekerjaan\": \"pekerjaan\", \"alamat\": \"alamat\", \"rt\": \"rt\", \"rw\": \"rw\", \"kelurahan\": \"kelurahan\", \"kecamatan\": \"kecamatan\", \"keperluan\": \"keperluan\"}', '{}'),
(2, 'Template Surat Kehilangan', 'surat-kehilangan', 'Template untuk surat keterangan kehilangan', '/templates/template-kehilangan.docx', 'template-kehilangan.docx', 'Keterangan', '[\"nama\", \"nik\", \"tempatLahir\", \"tanggalLahir\", \"pekerjaan\", \"alamat\", \"barangHilang\", \"ciriCiri\", \"waktuKejadian\", \"tempatKejadian\", \"kronologi\"]', 'aktif', 1, '2026-02-15 15:17:25', '2026-04-27 06:28:39', 1, 'desa', 1, '{nomor}/SKD/DS/{tahun}', '{\"nama\": \"nama\", \"nik\": \"nik\", \"tempatLahir\": \"tempatLahir\", \"tanggalLahir\": \"tanggalLahir\", \"pekerjaan\": \"pekerjaan\", \"alamat\": \"alamat\", \"barangHilang\": \"barangHilang\", \"ciriCiri\": \"ciriCiri\", \"waktuKejadian\": \"waktuKejadian\", \"tempatKejadian\": \"tempatKejadian\", \"kronologi\": \"kronologi\"}', '{}'),
(3, 'Template Surat Keterangan Umum', 'surat-keterangan', 'Template untuk surat keterangan umum', '/templates/template-keterangan.docx', 'template-keterangan.docx', 'Keterangan', '[\"nama\", \"nik\", \"tempatLahir\", \"tanggalLahir\", \"pekerjaan\", \"alamat\", \"keperluan\", \"keterangan\"]', 'aktif', 1, '2026-02-15 15:17:25', '2026-04-27 06:28:39', 1, 'desa', 1, '{nomor}/SKD/DS/{tahun}', '{}', '{}');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `ktp_url` varchar(255) DEFAULT NULL,
  `created_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_note` text DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telepon` varchar(15) DEFAULT NULL,
  `role` enum('admin','staff','sekretaris','kepala_desa','masyarakat') NOT NULL DEFAULT 'masyarakat',
  `status` enum('aktif','nonaktif','pending','rejected','disabled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `nama`, `email`, `nik`, `ktp_url`, `created_by_admin`, `verified_by`, `verified_at`, `verification_note`, `alamat`, `telepon`, `role`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', '$2b$10$g4WPeOa8sGbTxeeORzVku.i2PtpjLyd/2PkD4mbjyvFn8xfRQ9e7a', 'Administrator Sistem', 'admin@desa.go.id', '0000000000000001', '', 0, 1, '2025-10-12 22:27:27', '', '', '', 'admin', 'aktif', '2025-10-12 15:27:27', '2026-04-27 06:01:47', '2026-04-27 03:54:21'),
(2, 'sekretaris', '$2b$10$VhcWX.ytB0JlfBoYikmDHOM9nV5daQIm4jGpuE51sjZIH7lqIFs0W', 'Sekretaris Desa', 'sekretaris@desa.go.id', '1234567890123456', '', 0, 1, '2025-10-14 15:59:25', '', 'Kantor Desa', '081234567890', 'sekretaris', 'aktif', '2025-10-14 08:59:25', '2026-04-27 06:01:47', '2026-04-27 02:54:04'),
(3, 'kepala_desa', '$2b$10$G.dVz8cNz36rF0J7Wz.5GOH4UWNnJ.jovKuyq3MEcOZbs19YMC2XG', 'Kepala Desa', 'kepaladesa@desa.go.id', '1234567890123457', '', 0, 1, '2025-10-14 15:59:25', '', 'Kantor Desa', '081234567891', 'kepala_desa', 'aktif', '2025-10-14 08:59:25', '2026-04-27 06:01:47', '2026-04-27 01:53:06'),
(9, '5202014209030001', '$2b$10$WYIV1Tv7GLDj14oFe8b42u.NnYAWJMz1oi8LreGufgJOjdngIDIQa', 'Queen', 'privateonlyonee@gmail.com', '5202014209030001', '', 0, 1, '2026-03-30 00:56:23', '', 'Mataram, NTB', '', 'masyarakat', 'aktif', '2026-03-29 17:56:23', '2026-04-27 06:01:47', '2026-04-27 02:05:07'),
(10, '5202014209030004', '$2b$10$VCLZbMg93zL5jV50hGkTi.hhH5wKLdNInFkqmzdx8sD.cRdKGRDHS', 'Karunia Putri', 'kaaaruniaputriii@gmail.com', '5202014209030004', '', 0, 1, '2026-04-12 16:02:38', '', 'Aikmual', '085253271360', 'masyarakat', 'aktif', '2026-04-12 09:02:38', '2026-04-27 06:01:47', '2026-04-24 15:09:57');

-- --------------------------------------------------------

--
-- Table structure for table `user_identity_documents`
--

CREATE TABLE `user_identity_documents` (
  `id` bigint(20) NOT NULL,
  `user_nik` varchar(16) NOT NULL,
  `user_id` varchar(64) DEFAULT NULL,
  `dokumen_ktp_path` varchar(255) NOT NULL,
  `dokumen_kk_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_identity_documents`
--

INSERT INTO `user_identity_documents` (`id`, `user_nik`, `user_id`, `dokumen_ktp_path`, `dokumen_kk_path`, `created_at`, `updated_at`) VALUES
(1, '5202014209030004', '10', '/uploads/registrasi-identitas/1775984558423-5202014209030004-ktp-ktp.jpg', '/uploads/registrasi-identitas/1775984558425-5202014209030004-kk-kk.jpg', '2026-04-12 09:02:38', '2026-04-12 09:02:38');

-- --------------------------------------------------------

--
-- Structure for view `password_reset_tokens_csv`
--
DROP TABLE IF EXISTS `password_reset_tokens_csv`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `password_reset_tokens_csv`  AS SELECT `password_reset_tokens`.`id` AS `id`, `password_reset_tokens`.`user_id` AS `user_id`, `password_reset_tokens`.`token` AS `token`, date_format(`password_reset_tokens`.`expires_at`,'%Y-%m-%d %H:%i:%s') AS `expires_at`, date_format(`password_reset_tokens`.`created_at`,'%Y-%m-%d %H:%i:%s') AS `created_at`, date_format(coalesce(`password_reset_tokens`.`used_at`,`password_reset_tokens`.`created_at`),'%Y-%m-%d %H:%i:%s') AS `used_at` FROM `password_reset_tokens` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `disposisi_surat_masuk`
--
ALTER TABLE `disposisi_surat_masuk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_disposisi_surat_masuk_id` (`surat_masuk_id`),
  ADD KEY `idx_disposisi_tujuan_role` (`tujuan_role`),
  ADD KEY `idx_disposisi_disposed_at` (`disposed_at`);

--
-- Indexes for table `dynamic_template_surat`
--
ALTER TABLE `dynamic_template_surat`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `letterhead_templates`
--
ALTER TABLE `letterhead_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `permohonan_surat`
--
ALTER TABLE `permohonan_surat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `surat_keluar`
--
ALTER TABLE `surat_keluar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `surat_masuk`
--
ALTER TABLE `surat_masuk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `surat_numbering`
--
ALTER TABLE `surat_numbering`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_surat_period` (`jenis_surat`,`tahun`,`bulan`),
  ADD KEY `idx_numbering_lookup` (`jenis_surat`,`tahun`,`bulan`);

--
-- Indexes for table `template_surat`
--
ALTER TABLE `template_surat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_template_jenis` (`jenis_surat`,`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nik` (`nik`),
  ADD UNIQUE KEY `uk_users_nik` (`nik`),
  ADD KEY `idx_nik` (`nik`);

--
-- Indexes for table `user_identity_documents`
--
ALTER TABLE `user_identity_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_nik` (`user_nik`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `disposisi_surat_masuk`
--
ALTER TABLE `disposisi_surat_masuk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `letterhead_templates`
--
ALTER TABLE `letterhead_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `permohonan_surat`
--
ALTER TABLE `permohonan_surat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `surat_keluar`
--
ALTER TABLE `surat_keluar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `surat_masuk`
--
ALTER TABLE `surat_masuk`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `surat_numbering`
--
ALTER TABLE `surat_numbering`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `template_surat`
--
ALTER TABLE `template_surat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_identity_documents`
--
ALTER TABLE `user_identity_documents`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permohonan_surat`
--
ALTER TABLE `permohonan_surat`
  ADD CONSTRAINT `fk_permohonan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permohonan_surat_ibfk_1` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `surat_keluar`
--
ALTER TABLE `surat_keluar`
  ADD CONSTRAINT `surat_keluar_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `surat_masuk`
--
ALTER TABLE `surat_masuk`
  ADD CONSTRAINT `surat_masuk_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `template_surat`
--
ALTER TABLE `template_surat`
  ADD CONSTRAINT `template_surat_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
