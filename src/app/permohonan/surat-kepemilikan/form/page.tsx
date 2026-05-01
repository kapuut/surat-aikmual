"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiShield } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { checkBusinessHours } from "@/lib/utils";

export default function SuratKepemilikanFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check business hours on page load
  useEffect(() => {
    const hoursCheck = checkBusinessHours();
    if (!hoursCheck.isAllowed) {
      setError(hoursCheck.message || "Diluar jam kerja");
    }
  }, []);

  const normalizeSpacing = (value: string) => value.replace(/\s+/g, ' ').trim();

  const toTitleCase = (value: string) => {
    const cleaned = normalizeSpacing(value);
    if (!cleaned) return '';

    return cleaned
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ''))
      .join(' ');
  };

  const normalizeAreaValue = (value: string, type: 'dusun' | 'desa' | 'kecamatan' | 'kabupaten' | 'provinsi') => {
    const cleaned = normalizeSpacing(value);
    if (!cleaned) return '';

    const patterns = {
      dusun: /^dusun\s+/i,
      desa: /^desa\s+/i,
      kecamatan: /^(kecamatan|kec\.?)+\s+/i,
      kabupaten: /^(kabupaten|kab\.?)+\s+/i,
      provinsi: /^(provinsi|prov\.?)+\s+/i,
    } as const;

    return toTitleCase(cleaned.replace(patterns[type], ''));
  };

  const composeAddress = (dusun: string, desa: string, kecamatan: string, kabupaten: string, provinsi: string) => {
    if (!dusun || !desa || !kecamatan || !kabupaten) return '';
    const baseAddress = `Dusun ${dusun}, Desa ${desa}\nKec. ${kecamatan}, Kab. ${kabupaten}`;
    return provinsi ? `${baseAddress}\nProvinsi ${provinsi}` : baseAddress;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const dusun = normalizeAreaValue(String(formData.get("dusun") || ""), 'dusun');
    const desa = normalizeAreaValue(String(formData.get("desa") || ""), 'desa');
    const kecamatan = normalizeAreaValue(String(formData.get("kecamatan") || ""), 'kecamatan');
    const kabupaten = normalizeAreaValue(String(formData.get("kabupaten") || ""), 'kabupaten');
    const provinsi = normalizeAreaValue(String(formData.get("provinsi") || ""), 'provinsi');
    const alamat = composeAddress(dusun, desa, kecamatan, kabupaten, provinsi);

    const data = {
      jenisSurat: "Surat Keterangan Kepemilikan",
      nama: formData.get("namaLengkap"),
      nik: formData.get("nik"),
      tempatLahir: formData.get("tempatLahir"),
      tanggalLahir: formData.get("tanggalLahir"),
      jenisKelamin: formData.get("jenisKelamin"),
      pekerjaan: formData.get("pekerjaan"),
      dusun,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      alamat,
      noTelp: formData.get("noTelp"),
      // Data Kepemilikan
      jenisKepemilikan: formData.get("jenisKepemilikan"),
      lokasiObjek: formData.get("lokasiObjek"),
      luasTanah: formData.get("luasTanah"),
      batasTanah: formData.get("batasTanah"),
      nomorSertifikat: formData.get("nomorSertifikat"),
      tahunPerolehan: formData.get("tahunPerolehan"),
      caraPerolehan: formData.get("caraPerolehan"),
      keperluan: '-',
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-8 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/permohonan/surat-kepemilikan" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
              <FiArrowLeft /> Kembali
            </Link>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Formulir Surat Keterangan Kepemilikan</h1>
                  <p className="text-gray-600">Silakan lengkapi formulir di bawah ini dengan data yang benar</p>
                </div>
              </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pemohon */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                <input type="text" name="namaLengkap" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon *</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi *</label>
                <input type="text" name="provinsi" required defaultValue="Nusa Tenggara Barat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Data Kepemilikan */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Kepemilikan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kepemilikan *</label>
                <select name="jenisKepemilikan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Jenis</option>
                  <option value="Tanah">Tanah</option>
                  <option value="Bangunan/Rumah">Bangunan/Rumah</option>
                  <option value="Tanah dan Bangunan">Tanah dan Bangunan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Luas Tanah (mÂ²) *</label>
                <input type="number" name="luasTanah" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi Objek *</label>
                <textarea name="lokasiObjek" required rows={2} placeholder="Alamat lengkap lokasi tanah/bangunan" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Batas-Batas Tanah *</label>
                <textarea name="batasTanah" required rows={3} placeholder="Utara: ..., Selatan: ..., Timur: ..., Barat: ..." className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Sertifikat (jika ada)</label>
                <input type="text" name="nomorSertifikat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Perolehan *</label>
                <input type="number" name="tahunPerolehan" required min="1900" max="2099" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cara Perolehan *</label>
                <select name="caraPerolehan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Pilih Cara Perolehan</option>
                  <option value="Warisan">Warisan</option>
                  <option value="Pembelian">Pembelian</option>
                  <option value="Hibah">Hibah</option>
                  <option value="Tukar Menukar">Tukar Menukar</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tujuan dan Keperluan Surat</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan / Keperluan Surat *</label>
            <textarea
              name="keperluan"
              required
              rows={3}
              placeholder="Contoh: Persyaratan administrasi kepemilikan tanah"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/permohonan/surat-kepemilikan" className="bg-gray-100 text-gray-700 text-sm py-2.5 px-5 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="bg-purple-600 text-white text-sm py-2.5 px-5 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400 flex items-center justify-center gap-2">
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

