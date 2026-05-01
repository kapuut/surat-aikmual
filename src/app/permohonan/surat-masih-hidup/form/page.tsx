"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiHeart, FiSend, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRequireAuth } from "@/lib/hooks";
import { checkBusinessHours } from "@/lib/utils";

export default function SuratMasihHidupFormPage() {
  const router = useRouter();
  const { user, loading: loadingAuth } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const akunNik = String(user?.nik || "").split("_")[0].trim();

  const showFeedback = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Check business hours on page load
  useEffect(() => {
    const hoursCheck = checkBusinessHours();
    if (!hoursCheck.isAllowed) {
      setError(hoursCheck.message || "Diluar jam kerja");
    }
  }, []);

  const normalizeSpacing = (value: string) => value.replace(/\s+/g, " ").trim();

  const toTitleCase = (value: string) => {
    const cleaned = normalizeSpacing(value);
    if (!cleaned) return "";
    return cleaned
      .toLowerCase()
      .split(" ")
      .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ""))
      .join(" ");
  };

  const normalizeAreaValue = (value: string, type: "dusun" | "desa" | "kecamatan" | "kabupaten" | "provinsi") => {
    const cleaned = normalizeSpacing(value);
    if (!cleaned) return "";

    const patterns = {
      dusun: /^dusun\s+/i,
      desa: /^desa\s+/i,
      kecamatan: /^(kecamatan|kec\.?)+\s+/i,
      kabupaten: /^(kabupaten|kab\.?)+\s+/i,
      provinsi: /^(provinsi|prov\.?)+\s+/i,
    } as const;

    return toTitleCase(cleaned.replace(patterns[type], ""));
  };

  const composeAddress = (dusun: string, desa: string, kecamatan: string, kabupaten: string, provinsi: string) => {
    if (!dusun || !desa || !kecamatan || !kabupaten) return "";
    const baseAddress = `Dusun ${dusun}, Desa ${desa}\nKec. ${kecamatan}, Kab. ${kabupaten}`;
    return provinsi ? `${baseAddress}\nProvinsi ${provinsi}` : baseAddress;
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

    if (!akunNik) {
      setLoading(false);
      setError("NIK akun tidak ditemukan. Silakan lengkapi profil atau login ulang.");
      showFeedback();
      return;
    }

    const dokumenTambahan = formData
      .getAll("dokumenTambahan")
      .filter((item): item is File => item instanceof File && item.size > 0);

    const submitData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key === "dokumenTambahan") {
        continue;
      }
      submitData.append(key, value);
    }

    for (const file of dokumenTambahan) {
      submitData.append("dokumen", file);
    }

    submitData.set("nik", akunNik);
    submitData.set("jenisSurat", "Surat Keterangan Masih Hidup");

    const dusun = normalizeAreaValue(String(formData.get("dusun") || ""), "dusun");
    const desa = normalizeAreaValue(String(formData.get("desa") || ""), "desa");
    const kecamatan = normalizeAreaValue(String(formData.get("kecamatan") || ""), "kecamatan");
    const kabupaten = normalizeAreaValue(String(formData.get("kabupaten") || ""), "kabupaten");
    const provinsi = normalizeAreaValue(String(formData.get("provinsi") || ""), "provinsi");
    const alamatTerakhir = composeAddress(dusun, desa, kecamatan, kabupaten, provinsi);

    submitData.set("dusun", dusun);
    submitData.set("desa", desa);
    submitData.set("kecamatan", kecamatan);
    submitData.set("kabupaten", kabupaten);
    submitData.set("provinsi", provinsi);
    submitData.set("alamat", alamatTerakhir);
    submitData.set("alamatTerakhir", alamatTerakhir);
    submitData.set("keperluan", normalizeSpacing(String(formData.get("keperluan") || "")));

    try {
      const response = await fetch("/api/permohonan/submit", {
        method: "POST",
        body: submitData,
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
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/permohonan/surat-masih-hidup"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4"
            >
              <FiArrowLeft /> Kembali
            </Link>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white">
                  <FiHeart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Formulir Surat Keterangan Masih Hidup
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

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Permohonan Berhasil</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} onInvalidCapture={handleInvalid} className="space-y-6">
            {/* Data Pribadi */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Data Pribadi
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    value={akunNik}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={loadingAuth ? "Memuat NIK akun..." : "16 digit NIK"}
                  />
                  <p className="text-xs text-gray-500 mt-1">NIK mengikuti akun yang sedang login.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenisKelamin"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

              </div>
            </div>

            {/* Alamat Terakhir */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Alamat Terakhir
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dusun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="dusun"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Contoh: Darwis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="desa"
                    required
                    defaultValue="Aikmual"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="kecamatan"
                    required
                    defaultValue="Praya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="kabupaten"
                    required
                    defaultValue="Lombok Tengah"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    defaultValue="Nusa Tenggara Barat"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Upload Dokumen */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <FiUpload className="text-green-600" />
                Upload Dokumen Pendukung
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dokumen Pendukung Tambahan (opsional)
                  </label>
                  <input
                    type="file"
                    name="dokumenTambahan"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <p className="text-xs text-gray-500">Format yang didukung: JPG, PNG, PDF.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Tujuan dan Keperluan Surat</h2>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tujuan / Keperluan Surat <span className="text-red-500">*</span>
              </label>
              <textarea
                name="keperluan"
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Contoh: Persyaratan administrasi pensiun"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
                  <Link
                    href="/permohonan/surat-masih-hidup"
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition duration-200 text-center"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || loadingAuth || !akunNik}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2.5 px-5 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || loadingAuth ? "Mengirim..." : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Submit Permohonan
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
