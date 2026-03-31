/**
 * QUICK START: Cara menggunakan generator surat dalam 5 langkah
 */

// ============================================
// LANGKAH 1: Import yang diperlukan
// ============================================

import {
  generateSuratPDFClient,
  generateSuratPreviewHTML,
  generateNomorSurat,
  SuratData,
  JenisSurat,
} from '@/lib/surat-generator';

// ============================================
// LANGKAH 2: Siapkan data surat
// ============================================

const suratData: SuratData = {
  // Jenis surat (pilih salah satu)
  jenisSurat: 'surat-domisili',
  
  // Nomor surat otomatis (format: 001/Ds.Aml/03.2026)
  nomorSurat: generateNomorSurat(1),
  
  // Tanggal surat
  tanggalSurat: new Date(),
  
  // Tanggal berlaku (opsional)
  tanggalBerlaku: {
    dari: new Date(),
    sampai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  },
  
  // Data Pemohon
  nama: 'Budi Santoso',
  nik: '1234567890123456',
  tempatLahir: 'Bantul',
  tanggalLahir: new Date('1990-05-15'),
  jeniKelamin: 'Laki-laki',
  agama: 'Islam',
  pekerjaan: 'Petani',
  statusPerkawinan: 'Menikah',
  alamat: 'Jl. Raya Aikmual No. 123, Desa Aikmual',
  
  // Tanda Tangan Pejabat
  kepalaDesa: {
    nama: 'Kepala Desa AKMUAL',
    nip: '12345678',
  },
};

// ============================================
// LANGKAH 3: Generate Preview HTML
// ============================================

function previewSurat() {
  const html = generateSuratPreviewHTML(suratData);
  
  // Tampilkan dalam modal atau div
  document.getElementById('preview')!.innerHTML = html;
}

// ============================================
// LANGKAH 4: Download sebagai PDF
// ============================================

async function downloadPDF() {
  try {
    await generateSuratPDFClient(suratData, 'surat-domisili.pdf');
    console.log('✅ PDF berhasil didownload');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ============================================
// LANGKAH 5: Simpan ke Database (Optional)
// ============================================

async function saveSuratToDB() {
  const html = generateSuratPreviewHTML(suratData);
  
  // Kirim ke API
  const response = await fetch('/api/surat/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permohonanId: '123',
      nomorSurat: suratData.nomorSurat,
      suratHTML: html,
    }),
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('✅ Surat tersimpan di database');
  }
}

// ============================================
// BONUS: Dalam React Component
// ============================================

import { useState } from 'react';

export function QuickStartExample() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Generate data surat
      const data: SuratData = {
        jenisSurat: 'surat-domisili',
        nomorSurat: generateNomorSurat(1),
        tanggalSurat: new Date(),
        nama: 'John Doe',
        nik: '1234567890123456',
        alamat: 'Jl. Contoh No. 123',
        kepalaDesa: { nama: 'Kepala Desa', nip: '12345' },
      };

      // Download PDF
      await generateSuratPDFClient(data);
      alert('✅ Surat berhasil didownload!');
    } catch (error) {
      alert('❌ Gagal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="bg-green-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Membuat PDF...' : 'Download Surat PDF'}
    </button>
  );
}

// ============================================
// TIPS & TRICKS
// ============================================

/**
 * ✅ Best Practices:
 * 1. Nomor surat dari database (auto-increment)
 * 2. Data pemohon dari tabel users
 * 3. Simpan HTML surat untuk arsip
 * 4. Generate PDF di server jika butuh Puppeteer
 * 5. Loading state saat generate PDF
 * 6. Error handling yang proper
 * 7. Validasi data sebelum generate
 * 
 * ⚠️ Common Issues:
 * - Forgetting namespaces/imports → import dari '@/lib/surat-generator'
 * - HTML not rendering → check CSS file included
 * - Date format → gunakan date-fns formatTanggalSurat()
 * - Timeout jsPDF → optional, not critical
 * 
 * 🚀 Performance Tips:
 * - Lazy load html2canvas library
 * - Cache template HTML
 * - Batch process multiple surat
 * - Use Web Worker untuk heavy operations
 */
