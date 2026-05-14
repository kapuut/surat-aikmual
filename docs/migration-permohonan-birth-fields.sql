-- Migration: tambah kolom identitas kelahiran untuk ketahanan generate draft/preview surat.
-- Jalankan pada database SI Surat (MySQL 8+).

ALTER TABLE permohonan_surat
  ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(120) NULL AFTER keperluan,
  ADD COLUMN IF NOT EXISTS tanggal_lahir DATE NULL AFTER tempat_lahir,
  ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(30) NULL AFTER tanggal_lahir,
  ADD COLUMN IF NOT EXISTS agama VARCHAR(50) NULL AFTER jenis_kelamin,
  ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(100) NULL AFTER agama,
  ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(60) NULL AFTER pekerjaan,
  ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(60) NULL AFTER status_perkawinan,
  ADD COLUMN IF NOT EXISTS masa_berlaku_dari DATE NULL AFTER kewarganegaraan,
  ADD COLUMN IF NOT EXISTS masa_berlaku_sampai DATE NULL AFTER masa_berlaku_dari,
  ADD COLUMN IF NOT EXISTS data_detail TEXT NULL AFTER catatan;
