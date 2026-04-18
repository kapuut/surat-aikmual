"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiHome, FiCheckCircle, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { checkBusinessHours } from "@/lib/utils";

export default function SuratDomisiliFormPage() {
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

  const composeOptionalAddress = (dusun: string, desa: string, kecamatan: string, kabupaten: string, provinsi: string) => {
    const topLine = [dusun ? `Dusun ${dusun}` : "", desa ? `Desa ${desa}` : ""].filter(Boolean).join(", ");
    const middleLine = [
      kecamatan ? `Kec. ${kecamatan}` : "",
      kabupaten ? `Kab. ${kabupaten}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const lines = [topLine, middleLine, provinsi ? `Provinsi ${provinsi}` : ""].filter(Boolean);
    return lines.join("\n");
  };

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

    const dusun = normalizeAreaValue(String(formData.get("dusun") || ""), "dusun");
    const desa = normalizeAreaValue(String(formData.get("desa") || ""), "desa");
    const kecamatan = normalizeAreaValue(String(formData.get("kecamatan") || ""), "kecamatan");
    const kabupaten = normalizeAreaValue(String(formData.get("kabupaten") || ""), "kabupaten");
    const provinsi = normalizeAreaValue(String(formData.get("provinsi") || ""), "provinsi");
    const alamatSekarang = composeAddress(dusun, desa, kecamatan, kabupaten, provinsi);

    const dusunSebelumnya = normalizeAreaValue(String(formData.get("dusunSebelumnya") || ""), "dusun");
    const desaSebelumnya = normalizeAreaValue(String(formData.get("desaSebelumnya") || ""), "desa");
    const kecamatanSebelumnya = normalizeAreaValue(String(formData.get("kecamatanSebelumnya") || ""), "kecamatan");
    const kabupatenSebelumnya = normalizeAreaValue(String(formData.get("kabupatenSebelumnya") || ""), "kabupaten");
    const provinsiSebelumnya = normalizeAreaValue(String(formData.get("provinsiSebelumnya") || ""), "provinsi");
    const alamatSebelumnya = composeOptionalAddress(
      dusunSebelumnya,
      desaSebelumnya,
      kecamatanSebelumnya,
      kabupatenSebelumnya,
      provinsiSebelumnya
    );

    formData.set("dusun", dusun);
    formData.set("desa", desa);
    formData.set("kecamatan", kecamatan);
    formData.set("kabupaten", kabupaten);
    formData.set("provinsi", provinsi);
    formData.set("alamat", alamatSekarang);
    formData.set("alamatSekarang", alamatSekarang);
    formData.set("alamatSebelumnya", alamatSebelumnya);

    formData.set("jenisSurat", "Surat Keterangan Domisili");

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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenisKelamin"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dusun
                  </label>
                  <input
                    type="text"
                    name="dusunSebelumnya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: Darwis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desa
                  </label>
                  <input
                    type="text"
                    name="desaSebelumnya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: Aikmual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    name="kecamatanSebelumnya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: Praya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kabupaten/Kota
                  </label>
                  <input
                    type="text"
                    name="kabupatenSebelumnya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: Lombok Tengah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    name="provinsiSebelumnya"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: Nusa Tenggara Barat"
                  />
                </div>
              </div>
            </div>

            {/* Data Alamat Sekarang (Domisili) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Alamat Domisili Sekarang
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dusun <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dusun"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Contoh: Aikmual"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      defaultValue="Lombok Tengah"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      defaultValue="Nusa Tenggara Barat"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nama provinsi"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RT
                    </label>
                    <input
                      type="text"
                      name="rt"
                      pattern="[0-9]{1,3}"
                      maxLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1-3 digit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RW
                    </label>
                    <input
                      type="text"
                      name="rw"
                      pattern="[0-9]{1,3}"
                      maxLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1-3 digit"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Contoh: 2 tahun 3 bulan"
                  />
                </div>
                <input type="hidden" name="keperluan" value="-" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <FiUpload className="text-orange-500" /> Menu Upload Dokumen
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Dokumen pendukung diisi sesuai kebutuhan permohonan domisili.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dokumen Pendukung Domisili (opsional)
                  </label>
                  <input
                    type="file"
                    name="dokumen"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-orange-100 file:text-orange-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contoh: surat pengantar RT/RW, bukti kontrak rumah, atau bukti pendukung lain sesuai kebutuhan.
                  </p>
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

            {loading && (
              <p className="text-sm text-gray-600">Permohonan sedang diproses...</p>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {successMessage && (
              <p className="text-sm text-green-700">{successMessage}</p>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
