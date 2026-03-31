// Fungsi generate nomor surat otomatis
// Format: No: {nomor}/Ds.Aml/{bulan}.{tahun}

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Generate nomor surat otomatis dengan format resmi
 * @param nomorUrut Nomor urut dari database
 * @param tanggal Tanggal surat (default: hari ini)
 * @returns Nomor surat format: {nomor}/Ds.Aml/{bulan}.{tahun}
 * 
 * @example
 * generateNomorSurat(1) // Output: 001/Ds.Aml/03.2026
 * generateNomorSurat(25, new Date('2026-03-15')) // Output: 025/Ds.Aml/03.2026
 */
export function generateNomorSurat(nomorUrut: number, tanggal: Date = new Date()): string {
  // Format nomor urut dengan leading zero (3 digit)
  const nomor = String(nomorUrut).padStart(3, '0');
  
  // Format bulan dan tahun
  const bulan = format(tanggal, 'MM', { locale: id });
  const tahun = format(tanggal, 'yyyy', { locale: id });
  
  return `${nomor}/Ds.Aml/${bulan}.${tahun}`;
}

/**
 * Get nomor urut next (untuk database increment)
 * Biasanya handled oleh auto-increment di database
 */
export function formatNomorSurat(nomor: number): string {
  return String(nomor).padStart(3, '0');
}

/**
 * Parse nomor surat untuk ambil komponen
 * @param nomorSurat Format: 001/Ds.Aml/03.2026
 * @returns Object dengan nomor, bulan, tahun
 */
export function parseNomorSurat(nomorSurat: string) {
  const parts = nomorSurat.split('/');
  if (parts.length !== 3) {
    throw new Error('Format nomor surat tidak valid');
  }

  const nomor = parseInt(parts[0], 10);
  const tanggalParts = parts[2].split('.');
  const bulan = parseInt(tanggalParts[0], 10);
  const tahun = parseInt(tanggalParts[1], 10);

  return { nomor, bulan, tahun, nomorSurat };
}

/**
 * Format tanggal surat dengan format Indonesia
 * @param tanggal Date object
 * @returns String format: "15 Maret 2026"
 */
export function formatTanggalSurat(tanggal: Date): string {
  return format(tanggal, 'dd MMMM yyyy', { locale: id });
}
