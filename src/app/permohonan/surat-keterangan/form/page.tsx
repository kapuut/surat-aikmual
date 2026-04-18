"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiFileText } from 'react-icons/fi';

interface FormData {
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  dusun: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  jenis_surat: string;
  keperluan: string;
  no_hp: string;
  email: string;
}

const jenisSuratOptions = [
  "Surat Keterangan Berkelakuan Baik",
  "Surat Keterangan Penghasilan",
  "Surat Keterangan Belum Menikah",
  "Surat Keterangan Kehilangan",
  "Surat Keterangan Kematian",
  "Lainnya"
];

export default function FormSuratKeterangan() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nama_lengkap: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    dusun: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    jenis_surat: '',
    keperluan: '',
    no_hp: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Check business hours on page load
  useEffect(() => {
    const hoursCheck = checkBusinessHours();
    if (!hoursCheck.isAllowed) {
      setError(hoursCheck.message || "Diluar jam kerja");
    }
  }, []);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      const alamatGabungan = `Dusun ${formData.dusun}, Desa ${formData.desa}\nKec. ${formData.kecamatan}, Kab. ${formData.kabupaten}\nProvinsi ${formData.provinsi}`;
      
      // Add form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key as keyof FormData]);
      });
      submitData.set('alamat', alamatGabungan);
      submitData.set('keperluan', '-');

      // Add files
      if (files) {
        Array.from(files).forEach((file) => {
          submitData.append('dokumen', file);
        });
      }

      const response = await fetch('/api/permohonan', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim permohonan');
      }

      const result = await response.json();
      
      // Redirect to success page or show success message
      alert('Permohonan berhasil dikirim! ID Tracking: ' + result.id);
      router.push('/permohonan/riwayat');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengirim permohonan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/permohonan/surat-keterangan"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              Kembali
            </Link>
            <div className="flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Form Surat Keterangan Umum</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Pribadi */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nama_lengkap" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    id="nama_lengkap"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-1">
                    NIK *
                  </label>
                  <input
                    type="text"
                    id="nik"
                    name="nik"
                    value={formData.nik}
                    onChange={handleInputChange}
                    required
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tempat_lahir" className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir *
                  </label>
                  <input
                    type="text"
                    id="tempat_lahir"
                    name="tempat_lahir"
                    value={formData.tempat_lahir}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    id="tanggal_lahir"
                    name="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="jenis_kelamin" className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    id="jenis_kelamin"
                    name="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="jenis_surat" className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Surat Keterangan *
                  </label>
                  <select
                    id="jenis_surat"
                    name="jenis_surat"
                    value={formData.jenis_surat}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jenis Surat</option>
                    {jenisSuratOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dusun" className="block text-sm font-medium text-gray-700 mb-1">
                    Dusun *
                  </label>
                  <input
                    type="text"
                    id="dusun"
                    name="dusun"
                    value={formData.dusun}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="desa" className="block text-sm font-medium text-gray-700 mb-1">
                    Desa *
                  </label>
                  <input
                    type="text"
                    id="desa"
                    name="desa"
                    value={formData.desa}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    id="kecamatan"
                    name="kecamatan"
                    value={formData.kecamatan}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="kabupaten" className="block text-sm font-medium text-gray-700 mb-1">
                    Kabupaten *
                  </label>
                  <input
                    type="text"
                    id="kabupaten"
                    name="kabupaten"
                    value={formData.kabupaten}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700 mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    id="provinsi"
                    name="provinsi"
                    value={formData.provinsi}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="no_hp" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP *
                  </label>
                  <input
                    type="tel"
                    id="no_hp"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <input type="hidden" name="keperluan" value="-" />

            {/* Upload Dokumen */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Dokumen</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="dokumen" className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Klik untuk upload dokumen persyaratan (PDF, JPG, PNG)
                  </span>
                  <input
                    type="file"
                    id="dokumen"
                    name="dokumen"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                </label>
                {files && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">File yang dipilih:</p>
                    {Array.from(files).map((file, index) => (
                      <p key={index} className="text-sm text-green-600">{file.name}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}
              </button>
              <Link
                href="/permohonan/surat-keterangan"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}