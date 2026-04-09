"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiSend, FiShield, FiUpload } from "react-icons/fi";

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

function formatDateYmd(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addMonths(value: Date, months: number): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  result.setMonth(result.getMonth() + months);
  return result;
}

export default function SuratKehilanganPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showFeedback = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleInvalid = () => {
    setSuccessMessage(null);
    setError("Form belum lengkap atau ada data yang belum valid. Cek kembali semua field bertanda *.");
    showFeedback();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const asString = (name: string) => String(formData.get(name) || "");
    const asTitleCase = (name: string) => toTitleCase(asString(name));
    const today = new Date();
    const berlakuMulai = formatDateYmd(today);
    const berlakuSampai = formatDateYmd(addMonths(today, 6));

    const dokumenKTP = formData.get("dokumenKTP");
    const dokumenKK = formData.get("dokumenKK");
    const hasKtp = dokumenKTP instanceof File && dokumenKTP.size > 0;
    const hasKk = dokumenKK instanceof File && dokumenKK.size > 0;

    if (!hasKtp || !hasKk) {
      setLoading(false);
      setError("Upload KTP dan Kartu Keluarga (KK) wajib diisi.");
      showFeedback();
      return;
    }

    formData.set("jenisSurat", "Surat Keterangan Kehilangan");
    formData.set("nama", asTitleCase("nama"));
    formData.set("nik", normalizeSpacing(asString("nik")));
    formData.set("tempatLahir", asTitleCase("tempatLahir"));
    formData.set("pekerjaan", asTitleCase("pekerjaan"));
    formData.set("kewarganegaraan", asTitleCase("kewarganegaraan"));
    formData.set("noTelp", normalizeSpacing(asString("noTelp")));
    formData.set("dusun", asTitleCase("dusun"));
    formData.set("desa", asTitleCase("desa"));
    formData.set("kecamatan", asTitleCase("kecamatan"));
    formData.set("kabupaten", asTitleCase("kabupaten"));
    formData.set("jenisBarang", asTitleCase("jenisBarang"));
    formData.set("barangHilang", asTitleCase("barangHilang"));
    formData.set("asalBarang", asTitleCase("asalBarang"));
    formData.set("labelNomorBarang", asTitleCase("labelNomorBarang"));
    formData.set("nomorBarang", normalizeSpacing(asString("nomorBarang")));
    formData.set("ciriBarang", asTitleCase("ciriBarang"));
    formData.set("keteranganKehilangan", normalizeSpacing(asString("keteranganKehilangan")));
    formData.set("lokasiKehilangan", asTitleCase("lokasiKehilangan"));
    formData.set("keperluan", normalizeSpacing(asString("keperluan")));
    formData.set("masaBerlakuDari", berlakuMulai);
    formData.set("masaBerlakuSampai", berlakuSampai);

    try {
      const response = await fetch("/api/permohonan/submit", {
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
          <Link href="/permohonan/surat-kehilangan" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <FiArrowLeft /> Kembali
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Surat Keterangan Kehilangan</h1>
                <p className="text-gray-600">Silakan lengkapi formulir sesuai data pada surat yang akan diterbitkan</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} onInvalidCapture={handleInvalid} className="space-y-6">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pelapor</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Pekerjaan *</label>
                <input type="text" name="pekerjaan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select name="statusPerkawinan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Status</option>
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kewarganegaraan *</label>
                <input type="text" name="kewarganegaraan" required defaultValue="Indonesia" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon/WhatsApp *</label>
                <input type="tel" name="noTelp" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat (Isi Per Kolom) *</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dusun *</label>
                <input type="text" name="dusun" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desa *</label>
                <input type="text" name="desa" required defaultValue="Aikmual" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kecamatan *</label>
                <input type="text" name="kecamatan" required defaultValue="Praya" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kabupaten *</label>
                <input type="text" name="kabupaten" required defaultValue="Lombok Tengah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Kehilangan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Penyandang Cacat *</label>
                <select name="penyandangCacat" required defaultValue="-" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="-">-</option>
                  <option value="Tidak">Tidak</option>
                  <option value="Ya">Ya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Barang *</label>
                <select name="jenisBarang" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Kategori</option>
                  <option value="Dokumen Identitas">Dokumen Identitas (KTP/KK/SIM/Paspor)</option>
                  <option value="Dokumen Kendaraan">Dokumen Kendaraan (STNK/BPKB)</option>
                  <option value="Dokumen Pendidikan">Dokumen Pendidikan (Ijazah/Rapor/Sertifikat)</option>
                  <option value="Dokumen Keuangan">Dokumen Keuangan (Buku Tabungan/ATM/Gadai)</option>
                  <option value="Elektronik">Elektronik (HP/Laptop/Tablet)</option>
                  <option value="Perhiasan">Perhiasan</option>
                  <option value="Barang Pribadi">Barang Pribadi (Dompet/Tas/dll)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Barang/Dokumen yang Hilang *</label>
                <input type="text" name="barangHilang" required placeholder="Contoh: Dompet hitam berisi KTP dan kartu ATM" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asal/Kepemilikan Barang (Opsional)</label>
                <input type="text" name="asalBarang" placeholder="Contoh: Milik pribadi / kantor / sekolah / bank" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label Nomor (Opsional)</label>
                  <input type="text" name="labelNomorBarang" defaultValue="Nomor" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor/ID Barang (Opsional)</label>
                  <input type="text" name="nomorBarang" placeholder="Contoh: No. Polisi / IMEI / Nomor dokumen" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciri-ciri Barang (Opsional)</label>
                <textarea name="ciriBarang" rows={2} placeholder="Contoh: Warna hitam, merek A, ada stiker nama" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Uraian Kehilangan / Keluhan Pemohon (Opsional)</label>
                <textarea
                  name="keteranganKehilangan"
                  rows={3}
                  placeholder="Contoh: Dompet saya jatuh di sekitar Jalan Praya - Mantang saat perjalanan pulang, berisi KTP dan kartu ATM, dan sampai saat ini belum ditemukan."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Kehilangan</label>
                <input type="date" name="tanggalKehilangan" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi Kehilangan *</label>
                <input type="text" name="lokasiKehilangan" required placeholder="Contoh: Jalan Praya - Mantang" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Keperluan</h2>
            <p className="text-sm text-gray-600 mb-4">Masa berlaku surat diatur otomatis selama 6 bulan sejak tanggal terbit surat.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keperluan *</label>
              <textarea
                name="keperluan"
                required
                rows={3}
                placeholder="Contoh: Kelengkapan administrasi Desa Aikmual"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUpload className="w-5 h-5 text-blue-600" />
              Upload Dokumen
            </h2>
            <p className="text-sm text-gray-600 mb-4">KTP dan KK wajib diunggah. Dokumen pendukung lainnya bersifat opsional.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload KTP *</label>
                <input type="file" name="dokumenKTP" required accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-blue-100 file:text-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Kartu Keluarga (KK) *</label>
                <input type="file" name="dokumenKK" required accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-blue-100 file:text-blue-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dokumen Pendukung Lainnya (Opsional)</label>
                <input type="file" name="dokumenTambahan" multiple accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-gray-100 file:text-gray-700" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/permohonan/surat-kehilangan" className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center">
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
