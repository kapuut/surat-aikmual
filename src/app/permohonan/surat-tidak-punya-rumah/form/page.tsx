"use client";

import { useState, useEffect } from "react";
import { checkBusinessHours } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiSend, FiUpload } from "react-icons/fi";

function normalizeSpacing(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toTitleCase(value: string): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ""))
    .join(" ");
}

export default function SuratTidakPunyaRumahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check business hours on page load
  useEffect(() => {
    const hoursCheck = checkBusinessHours();
    if (!hoursCheck.isAllowed) {
      setError(hoursCheck.message || "Diluar jam kerja");
    }
  }, []);

  const showFeedback = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const asString = (name: string) => String(formData.get(name) || "");

    formData.set("jenisSurat", "Surat Keterangan Tidak Memiliki Rumah");
    formData.set("nama", toTitleCase(asString("nama")));
    formData.set("nik", normalizeSpacing(asString("nik")));
    formData.set("tempatLahir", toTitleCase(asString("tempatLahir")));
    formData.set("agama", toTitleCase(asString("agama")));
    formData.set("statusPerkawinan", toTitleCase(asString("statusPerkawinan")));
    formData.set("pekerjaan", toTitleCase(asString("pekerjaan")));
    formData.set("kewarganegaraan", toTitleCase(asString("kewarganegaraan")) || "Indonesia");
    formData.set("noTelp", normalizeSpacing(asString("noTelp")));

    formData.set("dusun", toTitleCase(asString("dusun")));
    formData.set("desa", toTitleCase(asString("desa")));
    formData.set("kecamatan", toTitleCase(asString("kecamatan")));
    formData.set("kabupaten", toTitleCase(asString("kabupaten")));
    formData.set("provinsi", toTitleCase(asString("provinsi")));

    formData.set("penyandangCacat", toTitleCase(asString("penyandangCacat")) || "Tidak");
    formData.set("statusTempatTinggal", toTitleCase(asString("statusTempatTinggal")));
    formData.set("namaPemilikRumah", toTitleCase(asString("namaPemilikRumah")));
    formData.set("hubunganDenganPemilik", toTitleCase(asString("hubunganDenganPemilik")));
    formData.set("alamatTinggalSekarang", toTitleCase(asString("alamatTinggalSekarang")));
    formData.set("lamaMenempati", normalizeSpacing(asString("lamaMenempati")));
    formData.set("jumlahTanggungan", normalizeSpacing(asString("jumlahTanggungan")));
    formData.set("alasanTidakMemiliki", normalizeSpacing(asString("alasanTidakMemiliki")));
    formData.set("keperluan", "-");

    try {
      const response = await fetch("/api/permohonan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengajukan permohonan");
      }

      setSuccessMessage("Permohonan berhasil diajukan. Anda akan diarahkan ke halaman tracking.");
      showFeedback();
      window.setTimeout(() => {
        router.push("/tracking");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      showFeedback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/permohonan/surat-tidak-punya-rumah" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Permohonan Berhasil</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                <input type="text" name="nama" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                <input type="text" name="nik" required maxLength={16} pattern="[0-9]{16}" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir *</label>
                <input type="text" name="tempatLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir *</label>
                <input type="date" name="tanggalLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
                <select name="jenisKelamin" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agama *</label>
                <select name="agama" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Perkawinan *</label>
                <select name="statusPerkawinan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Status</option>
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pekerjaan *</label>
                <input type="text" name="pekerjaan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kewarganegaraan *</label>
                <input type="text" name="kewarganegaraan" defaultValue="Indonesia" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon *</label>
                <input type="tel" name="noTelp" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat KTP (Isi Per Kolom) *</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dusun *</label>
                <input type="text" name="dusun" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desa *</label>
                <input type="text" name="desa" defaultValue="Aikmual" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kecamatan *</label>
                <input type="text" name="kecamatan" defaultValue="Praya" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kabupaten *</label>
                <input type="text" name="kabupaten" defaultValue="Lombok Tengah" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi *</label>
                <input type="text" name="provinsi" defaultValue="Nusa Tenggara Barat" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Penyandang Cacat</label>
                <select name="penyandangCacat" defaultValue="Tidak" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="Tidak">Tidak</option>
                  <option value="Ya">Ya</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Tempat Tinggal Saat Ini</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Tempat Tinggal *</label>
                <select name="statusTempatTinggal" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Status</option>
                  <option value="Menumpang">Menumpang</option>
                  <option value="Kontrak/Sewa">Kontrak/Sewa</option>
                  <option value="Rumah Orang Tua">Rumah Orang Tua</option>
                  <option value="Rumah Kerabat">Rumah Kerabat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pemilik Rumah</label>
                <input type="text" name="namaPemilikRumah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hubungan dengan Pemilik</label>
                <select name="hubunganDenganPemilik" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Lama Menempati</label>
                <input type="text" name="lamaMenempati" placeholder="Contoh: 2 tahun" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Tinggal Sekarang *</label>
                <textarea name="alamatTinggalSekarang" required rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Tambahan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Tanggungan</label>
                <input type="number" name="jumlahTanggungan" min={0} placeholder="Jumlah orang" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Tidak Memiliki Rumah</label>
                <textarea name="alasanTidakMemiliki" rows={3} placeholder="Jelaskan alasan..." className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <input type="hidden" name="keperluan" value="-" />

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUpload className="w-5 h-5 text-blue-600" />
              Upload Dokumen
            </h2>
            <p className="text-sm text-gray-600 mb-4">Dokumen pendukung lainnya opsional.</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung Lainnya (Opsional)</label>
                <input type="file" name="dokumenTambahan" multiple accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-gray-100 file:text-gray-700" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/permohonan/surat-tidak-punya-rumah" className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center">
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

