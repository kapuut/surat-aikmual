// src/app/surat/tambah/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiUpload, FiFile } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SuratFormData, KATEGORI_SURAT, JENIS_SURAT } from '@/lib/types';
import { validateFile } from '@/lib/utils';

export default function TambahSuratPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<SuratFormData>({
    nomorSurat: '',
    tanggal: new Date().toISOString().split('T')[0],
    perihal: '',
    pengirim: '',
    penerima: '',
    jenisSurat: 'masuk',
    kategori: '',
    isiSingkat: '',
    keterangan: '',
  });

  const handleInputChange = (field: keyof SuratFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, file: validation.error! }));
        return;
      }
      setFile(selectedFile);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomorSurat.trim()) {
      newErrors.nomorSurat = 'Nomor surat wajib diisi';
    }
    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal wajib diisi';
    }
    if (!formData.perihal.trim()) {
      newErrors.perihal = 'Perihal wajib diisi';
    }
    if (!formData.pengirim.trim()) {
      newErrors.pengirim = 'Pengirim wajib diisi';
    }
    if (!formData.penerima.trim()) {
      newErrors.penerima = 'Penerima wajib diisi';
    }
    if (!formData.kategori) {
      newErrors.kategori = 'Kategori wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      let filePath = '';
      let fileName = '';

      // Upload file first if exists
      if (file) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        fileFormData.append('type', 'surat');

        const fileResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData,
        });

        const fileResult = await fileResponse.json();
        if (!fileResult.success) {
          throw new Error(fileResult.error || 'Gagal upload file');
        }

        filePath = fileResult.data.path;
        fileName = fileResult.data.filename;
      }

      // Create surat
      const response = await fetch('/api/surat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          filePath: filePath || null,
          fileName: fileName || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/surat');
        router.refresh();
      } else {
        throw new Error(result.error || 'Gagal menyimpan surat');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Terjadi kesalahan' 
      });
    } finally {
      setLoading(false);
    }
  };

  const kategoriOptions = KATEGORI_SURAT.map(kategori => ({
    value: kategori,
    label: kategori
  }));

  return (
    <DashboardLayout 
      title="Tambah Surat"
      actions={
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <FiX className="mr-2" />
          Batal
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Surat
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Jenis Surat"
                options={JENIS_SURAT}
                value={formData.jenisSurat}
                onChange={(e) => handleInputChange('jenisSurat', e.target.value as 'masuk' | 'keluar')}
                required
              />

              <Input
                label="Nomor Surat"
                value={formData.nomorSurat}
                onChange={(e) => handleInputChange('nomorSurat', e.target.value)}
                placeholder="contoh: 001/SM/01/2025"
                required
                error={errors.nomorSurat}
              />

              <Input
                type="date"
                label="Tanggal Surat"
                value={formData.tanggal}
                onChange={(e) => handleInputChange('tanggal', e.target.value)}
                required
                error={errors.tanggal}
              />

              <Select
                label="Kategori"
                options={kategoriOptions}
                value={formData.kategori}
                onChange={(e) => handleInputChange('kategori', e.target.value)}
                placeholder="Pilih kategori surat"
                required
                error={errors.kategori}
              />
            </div>

            <div className="mt-6">
              <Input
                label="Perihal"
                value={formData.perihal}
                onChange={(e) => handleInputChange('perihal', e.target.value)}
                placeholder="Masukkan perihal surat"
                required
                error={errors.perihal}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Input
                label={formData.jenisSurat === 'masuk' ? 'Pengirim' : 'Penerima'}
                value={formData.pengirim}
                onChange={(e) => handleInputChange('pengirim', e.target.value)}
                placeholder={formData.jenisSurat === 'masuk' ? 'Nama pengirim surat' : 'Nama penerima surat'}
                required
                error={errors.pengirim}
              />

              <Input
                label={formData.jenisSurat === 'masuk' ? 'Penerima' : 'Pengirim'}
                value={formData.penerima}
                onChange={(e) => handleInputChange('penerima', e.target.value)}
                placeholder={formData.jenisSurat === 'masuk' ? 'Nama penerima surat' : 'Nama pengirim surat'}
                required
                error={errors.penerima}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Isi Singkat
              </label>
              <textarea
                value={formData.isiSingkat}
                onChange={(e) => handleInputChange('isiSingkat', e.target.value)}
                placeholder="Ringkasan isi surat (opsional)"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan
              </label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => handleInputChange('keterangan', e.target.value)}
                placeholder="Keterangan tambahan (opsional)"
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              File Lampiran
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Maks. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
              </div>

              {file && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <FiFile className="text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiX />
                  </button>
                </div>
              )}

              {errors.file && (
                <p className="text-sm text-red-600">{errors.file}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="min-w-32"
            >
              <FiSave className="mr-2" />
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}