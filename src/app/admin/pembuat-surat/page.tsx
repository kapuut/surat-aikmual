'use client';

import { useState } from 'react';
import { SuratData, JenisSurat, SURAT_TYPES } from '@/lib/surat-generator/types';
import { generateSuratPDFClient, generateSuratPreviewHTML } from '@/lib/surat-generator/pdf-generator';
import { FiDownload, FiEye } from 'react-icons/fi';

const JENIS_SURAT_LIST: JenisSurat[] = [
  'surat-domisili',
  'surat-kematian',
  'surat-kepemilikan',
  'surat-cerai',
  'surat-janda',
  'surat-kehilangan',
  'surat-penghasilan',
  'surat-tidak-punya-rumah',
  'surat-usaha',
];

export default function GeneratorSuratPage() {
  const [formData, setFormData] = useState<Partial<SuratData>>({
    jenisSurat: 'surat-domisili',
    tanggalSurat: new Date(),
    nama: '',
    nik: '',
    alamat: '',
    kepalaDesa: {
      nama: 'Kepala Desa AKMUAL',
      nip: '12345678',
    },
  });

  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.startsWith('kepalaDesa.')) {
      const fieldName = name.replace('kepalaDesa.', '');
      setFormData(prev => ({
        ...prev,
        kepalaDesa: {
          ...(prev.kepalaDesa || {}),
          [fieldName]: value,
        },
      } as Partial<SuratData>));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'tanggalSurat' ? new Date(value) : value,
      } as Partial<SuratData>));
    }
  };

  const handlePreview = () => {
    if (!formData.nama || !formData.nik || !formData.alamat) {
      alert('Nama, NIK, dan Alamat harus diisi');
      return;
    }

    const html = generateSuratPreviewHTML(formData as SuratData);
    setPreviewHTML(html);
  };

  const handleDownloadPDF = async () => {
    if (!formData.nama || !formData.nik || !formData.alamat) {
      alert('Nama, NIK, dan Alamat harus diisi');
      return;
    }

    setLoading(true);
    try {
      await generateSuratPDFClient(formData as SuratData);
      alert('PDF berhasil didownload!');
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal membuat PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const selectedSuratType = SURAT_TYPES[formData.jenisSurat || 'surat-domisili'];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold mb-6 text-gray-900">Pembuat Surat Otomatis</h1>

              {/* Jenis Surat */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Surat
                </label>
                <select
                  name="jenisSurat"
                  value={formData.jenisSurat || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {JENIS_SURAT_LIST.map(jenis => (
                    <option key={jenis} value={jenis}>
                      {SURAT_TYPES[jenis].judul}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedSuratType?.deskripsi}
                </p>
              </div>

              {/* Tanggal Surat */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  name="tanggalSurat"
                  value={formData.tanggalSurat instanceof Date 
                    ? formData.tanggalSurat.toISOString().split('T')[0] 
                    : ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {['nama', 'nik', 'tempatLahir', 'pekerjaan', 'alamat'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {field === 'tempatLahir' 
                        ? 'Tempat Lahir' 
                        : field === 'pekerjaan' 
                        ? 'Pekerjaan' 
                        : field}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={(formData as any)[field] || ''}
                      onChange={handleInputChange}
                      placeholder={`Masukkan ${field}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Kepala Desa */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tanda Tangan Kepala Desa</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Kepala Desa
                    </label>
                    <input
                      type="text"
                      name="kepalaDesa.nama"
                      value={formData.kepalaDesa?.nama || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      NIP Kepala Desa (optional)
                    </label>
                    <input
                      type="text"
                      name="kepalaDesa.nip"
                      value={formData.kepalaDesa?.nip || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handlePreview}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  <FiEye className="w-5 h-5" />
                  Preview
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiDownload className="w-5 h-5" />
                  {loading ? 'Membuat PDF...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              {previewHTML ? (
                <div
                  dangerouslySetInnerHTML={{ __html: previewHTML }}
                  style={{ zoom: '0.75', transformOrigin: 'top left' }}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <FiEye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Preview surat akan muncul di sini</p>
                    <p className="text-sm text-gray-500 mt-2">Klik tombol &quot;Preview&quot; untuk melihat surat</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
