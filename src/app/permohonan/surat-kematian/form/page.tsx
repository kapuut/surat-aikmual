"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiHeart } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SuratKematianFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      jenisSurat: "Surat Keterangan Kematian",
      // Data Pemohon
      namaPemohon: formData.get("namaPemohon"),
      nikPemohon: formData.get("nikPemohon"),
      tempatLahirPemohon: formData.get("tempatLahirPemohon"),
      tanggalLahirPemohon: formData.get("tanggalLahirPemohon"),
      pekerjaanPemohon: formData.get("pekerjaanPemohon"),
      alamatPemohon: formData.get("alamatPemohon"),
      noTelpPemohon: formData.get("noTelpPemohon"),
      hubunganDenganAlmarhum: formData.get("hubunganDenganAlmarhum"),
      // Data Almarhum
      namaAlmarhum: formData.get("namaAlmarhum"),
      nikAlmarhum: formData.get("nikAlmarhum"),
      tempatLahirAlmarhum: formData.get("tempatLahirAlmarhum"),
      tanggalLahirAlmarhum: formData.get("tanggalLahirAlmarhum"),
      jenisKelamin: formData.get("jenisKelamin"),
      agama: formData.get("agama"),
      pekerjaanAlmarhum: formData.get("pekerjaanAlmarhum"),
      alamatAlmarhum: formData.get("alamatAlmarhum"),
      tanggalMeninggal: formData.get("tanggalMeninggal"),
      tempatMeninggal: formData.get("tempatMeninggal"),
      sebabMeninggal: formData.get("sebabMeninggal"),
      tempatPemakaman: formData.get("tempatPemakaman"),
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
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/permohonan/surat-kematian"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <FiArrowLeft /> Kembali
            </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-white">
                <FiHeart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Surat Keterangan Kematian
                </h1>
                <p className="text-gray-600">
                  Silakan lengkapi formulir di bawah ini
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pemohon */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Data Pemohon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap Pemohon *
                </label>
                <input
                  type="text"
                  name="namaPemohon"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIK Pemohon *
                </label>
                <input
                  type="text"
                  name="nikPemohon"
                  required
                  maxLength={16}
                  pattern="[0-9]{16}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Lahir Pemohon *
                </label>
                <input
                  type="text"
                  name="tempatLahirPemohon"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir Pemohon *
                </label>
                <input
                  type="date"
                  name="tanggalLahirPemohon"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pekerjaan Pemohon *
                </label>
                <input
                  type="text"
                  name="pekerjaanPemohon"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon Pemohon *
                </label>
                <input
                  type="tel"
                  name="noTelpPemohon"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap Pemohon *
                </label>
                <textarea
                  name="alamatPemohon"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hubungan dengan Almarhum/Almarhumah *
                </label>
                <select
                  name="hubunganDenganAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Hubungan</option>
                  <option value="Anak">Anak</option>
                  <option value="Suami">Suami</option>
                  <option value="Istri">Istri</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Saudara Kandung">Saudara Kandung</option>
                  <option value="Kerabat">Kerabat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Almarhum */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Data Almarhum/Almarhumah
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap Almarhum/Almarhumah *
                </label>
                <input
                  type="text"
                  name="namaAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIK Almarhum/Almarhumah *
                </label>
                <input
                  type="text"
                  name="nikAlmarhum"
                  required
                  maxLength={16}
                  pattern="[0-9]{16}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  name="tempatLahirAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  name="tanggalLahirAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin *
                </label>
                <select
                  name="jenisKelamin"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agama *
                </label>
                <select
                  name="agama"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pekerjaan *
                </label>
                <input
                  type="text"
                  name="pekerjaanAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap *
                </label>
                <textarea
                  name="alamatAlmarhum"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Data Kematian */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Data Kematian
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Meninggal *
                </label>
                <input
                  type="date"
                  name="tanggalMeninggal"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Meninggal *
                </label>
                <input
                  type="text"
                  name="tempatMeninggal"
                  required
                  placeholder="Contoh: Rumah Sakit, Rumah, dll"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sebab Meninggal *
                </label>
                <input
                  type="text"
                  name="sebabMeninggal"
                  required
                  placeholder="Contoh: Sakit, Kecelakaan, dll"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempat Pemakaman *
                </label>
                <input
                  type="text"
                  name="tempatPemakaman"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Keperluan */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Keperluan
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Untuk Keperluan *
              </label>
              <textarea
                name="keperluan"
                required
                rows={3}
                placeholder="Jelaskan keperluan surat ini..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/permohonan/surat-kematian"
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
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
    <Footer />
    </>
  );
}
