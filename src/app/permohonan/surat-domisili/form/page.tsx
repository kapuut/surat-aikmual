"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiHome } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SuratDomisiliFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      jenisSurat: "Surat Keterangan Domisili",
      // Data Pemohon
      nama: formData.get("nama"),
      nik: formData.get("nik"),
      tempatLahir: formData.get("tempatLahir"),
      tanggalLahir: formData.get("tanggalLahir"),
      jenisKelamin: formData.get("jenisKelamin"),
      agama: formData.get("agama"),
      pekerjaan: formData.get("pekerjaan"),
      statusPerkawinan: formData.get("statusPerkawinan"),
      // Data Alamat
      alamatSebelumnya: formData.get("alamatSebelumnya"),
      alamatSekarang: formData.get("alamatSekarang"),
      rt: formData.get("rt"),
      rw: formData.get("rw"),
      kelurahan: formData.get("kelurahan"),
      kecamatan: formData.get("kecamatan"),
      kabupaten: formData.get("kabupaten"),
      provinsi: formData.get("provinsi"),
      kodePos: formData.get("kodePos"),
      noTelp: formData.get("noTelp"),
      // Data Tambahan
      statusTempat: formData.get("statusTempat"),
      lamaTinggal: formData.get("lamaTinggal"),
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/permohonan/surat-domisili"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4"
            >
              <FiArrowLeft /> Kembali
            </Link>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <FiHome className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Formulir Surat Keterangan Domisili
                  </h1>
                  <p className="text-gray-600">
                    Silakan lengkapi formulir di bawah ini dengan data yang benar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Pemohon */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Data Pemohon
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIK <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nik"
                    required
                    pattern="[0-9]{16}"
                    maxLength={16}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="16 digit NIK"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Kota/Kabupaten"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggalLahir"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenisKelamin"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agama <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="agama"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Pilih agama</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pekerjaan"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Pekerjaan saat ini"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Perkawinan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="statusPerkawinan"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Pilih status</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Alamat Sebelumnya */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Alamat Sebelumnya
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  name="alamatSebelumnya"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kabupaten, Provinsi"
                />
              </div>
            </div>

            {/* Data Alamat Sekarang (Domisili) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Alamat Domisili Sekarang
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamatSekarang"
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nama jalan, nomor rumah, nama kampung/dusun"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="rt"
                      required
                      pattern="[0-9]{3}"
                      maxLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RW <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="rw"
                      required
                      pattern="[0-9]{3}"
                      maxLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="001"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelurahan/Desa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kelurahan"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nama kelurahan"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kecamatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kecamatan"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nama kecamatan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kabupaten/Kota <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="kabupaten"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nama kabupaten/kota"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="provinsi"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nama provinsi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      name="kodePos"
                      pattern="[0-9]{5}"
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="12345"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon/HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="noTelp"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Data Tambahan */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Informasi Tambahan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Tempat Tinggal <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="statusTempat"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Pilih status</option>
                    <option value="Milik Sendiri">Milik Sendiri</option>
                    <option value="Milik Keluarga">Milik Keluarga</option>
                    <option value="Sewa/Kontrak">Sewa/Kontrak</option>
                    <option value="Menumpang">Menumpang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lama Tinggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lamaTinggal"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: 2 tahun 3 bulan"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keperluan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="keperluan"
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Jelaskan keperluan surat keterangan domisili ini"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                href="/permohonan/surat-domisili"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 text-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FiSend />
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
