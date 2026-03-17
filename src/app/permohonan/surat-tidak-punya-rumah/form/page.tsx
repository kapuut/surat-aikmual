"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiMapPin } from "react-icons/fi";

export default function SuratTidakPunyaRumahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      jenisSurat: "Surat Keterangan Tidak Memiliki Rumah",
      namaLengkap: formData.get("namaLengkap"),
      nik: formData.get("nik"),
      tempatLahir: formData.get("tempatLahir"),
      tanggalLahir: formData.get("tanggalLahir"),
      jenisKelamin: formData.get("jenisKelamin"),
      statusPerkawinan: formData.get("statusPerkawinan"),
      pekerjaan: formData.get("pekerjaan"),
      alamat: formData.get("alamat"),
      noTelp: formData.get("noTelp"),
      statusTempaTinggal: formData.get("statusTempaTinggal"),
      namaPemilikRumah: formData.get("namaPemilikRumah"),
      hubunganDenganPemilik: formData.get("hubunganDenganPemilik"),
      alamatTinggalSekarang: formData.get("alamatTinggalSekarang"),
      lamaMenempati: formData.get("lamaMenempati"),
      penghasilanPerBulan: formData.get("penghasilanPerBulan"),
      jumlahTanggungan: formData.get("jumlahTanggungan"),
      alasanTidakMemiliki: formData.get("alasanTidakMemiliki"),
      keperluan: formData.get("keperluan"),
    };

    try {
      const response = await fetch("/api/permohonan/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengajukan permohonan");
      }

      alert("Permohonan berhasil diajukan!");
      router.push("/permohonan/riwayat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <FiArrowLeft /> Kembali
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                <FiMapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Surat Keterangan Tidak Memiliki Rumah</h1>
                <p className="text-gray-600">Silakan lengkapi formulir di bawah ini</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                <input type="text" name="namaLengkap" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                <input type="text" name="nik" required maxLength={16} pattern="[0-9]{16}" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir *</label>
                <input type="text" name="tempatLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir *</label>
                <input type="date" name="tanggalLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
                <select name="jenisKelamin" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Perkawinan *</label>
                <select name="statusPerkawinan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Status</option>
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pekerjaan *</label>
                <input type="text" name="pekerjaan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon *</label>
                <input type="tel" name="noTelp" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat KTP *</label>
                <textarea name="alamat" required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Tempat Tinggal Saat Ini</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Tempat Tinggal *</label>
                <select name="statusTempatTinggal" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Status</option>
                  <option value="Menumpang">Menumpang</option>
                  <option value="Kontrak/Sewa">Kontrak/Sewa</option>
                  <option value="Rumah Orang Tua">Rumah Orang Tua</option>
                  <option value="Rumah Kerabat">Rumah Kerabat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pemilik Rumah *</label>
                <input type="text" name="namaPemilikRumah" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hubungan dengan Pemilik *</label>
                <select name="hubunganDenganPemilik" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Hubungan</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Mertua">Mertua</option>
                  <option value="Saudara Kandung">Saudara Kandung</option>
                  <option value="Kerabat">Kerabat</option>
                  <option value="Teman">Teman</option>
                  <option value="Tidak Ada Hubungan">Tidak Ada Hubungan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lama Menempati *</label>
                <input type="text" name="lamaMenempati" required placeholder="Contoh: 2 tahun" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Tinggal Sekarang *</label>
                <textarea name="alamatTinggalSekarang" required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Ekonomi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Penghasilan per Bulan *</label>
                <input type="number" name="penghasilanPerBulan" required placeholder="Dalam Rupiah" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Tanggungan *</label>
                <input type="number" name="jumlahTanggungan" required placeholder="Jumlah orang" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Tidak Memiliki Rumah *</label>
                <textarea name="alasanTidakMemiliki" required rows={3} placeholder="Jelaskan alasan..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Keperluan</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Untuk Keperluan *</label>
              <textarea name="keperluan" required rows={3} placeholder="Contoh: Mengajukan subsidi perumahan, dll" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="flex gap-4">
            <Link href="/" className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Ajukan Permohonan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
