/**
 * CONTOH IMPLEMENTASI: Button Download Surat di Component Permohonan
 */

'use client';

import { useState } from 'react';
import { FiDownload, FiEye } from 'react-icons/fi';

interface PermohonanData {
  id: string;
  nomor_surat: string;
  surat_html?: string;
  status: string;
  // ... field lainnya
}

export function SuratButtons({ permohonan }: { permohonan: PermohonanData }) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Hanya tampil jika surat sudah dibuat (status approved)
  if (!permohonan.surat_html || permohonan.status !== 'approved') {
    return null;
  }

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      // Kirim HTML ke Puppeteer atau gunakan library lain
      // Atau: Generate PDF dari browser dengan html2canvas
      
      // Opsi 1: Download sebagai HTML
      if (permohonan.surat_html) {
        const element = document.createElement('a');
        const file = new Blob([permohonan.surat_html], { type: 'text/html' });
        element.href = URL.createObjectURL(file);
        element.download = `surat-${permohonan.nomor_surat}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

      // Opsi 2: Generate PDF dari browser
      // const { generateSuratPDFClient } = await import('@/lib/surat-generator');
      // await generateSuratPDFClient(suratData);

      alert('✅ Surat berhasil didownload!');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Gagal download surat');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (permohonan.surat_html) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(permohonan.surat_html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={() => setPreviewOpen(!previewOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FiEye className="w-4 h-4" />
        Preview
      </button>

      <button
        onClick={handleDownloadPDF}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        <FiDownload className="w-4 h-4" />
        {loading ? 'Mengunduh...' : 'Download'}
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        🖨️ Cetak
      </button>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-11/12 h-11/12 max-w-6xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between bg-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Preview Surat</h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div
                dangerouslySetInnerHTML={{ __html: permohonan.surat_html }}
                style={{ zoom: '0.85' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CONTOH PENGGUNAAN DI HALAMAN DETAIL PERMOHONAN:
 * 
 * import { SuratButtons } from '@/components/SuratButtons';
 * 
 * export default function DetailPermohonan({ permohonan }) {
 *   return (
 *     <div>
 *       <h1>{permohonan.jenis_surat}</h1>
 *       <p>Status: {permohonan.status}</p>
 *       
 *       {permohonan.status === 'approved' && (
 *         <SuratButtons permohonan={permohonan} />
 *       )}
 *     </div>
 *   );
 * }
 */
