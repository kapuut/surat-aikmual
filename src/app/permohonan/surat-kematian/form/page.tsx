"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiHeart, FiCheckCircle, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { checkBusinessHours } from "@/lib/utils";

export default function SuratKematianFormPage() {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    setSuccessMessage(null);

    // Provide explicit feedback instead of silently blocking submit on invalid fields.
    if (!form.checkValidity()) {
      const invalidElements = Array.from(form.elements).filter(
        (el): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
          (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) &&
          !el.checkValidity()
      );

      const invalidLabels = invalidElements
        .map((el) => {
          const id = el.id;
          if (id) {
            const directLabel = form.querySelector(`label[for="${id}"]`);
            if (directLabel) return directLabel.textContent?.replace('*', '').trim() || null;
          }

          const wrapperLabel = el.closest('div')?.querySelector('label');
          return wrapperLabel?.textContent?.replace('*', '').trim() || null;
        })
        .filter((label): label is string => Boolean(label));

      form.reportValidity();
      setLoading(false);
      if (invalidLabels.length > 0) {
        setError(`Data belum valid pada: ${invalidLabels.slice(0, 3).join(', ')}${invalidLabels.length > 3 ? ', ...' : ''}.`);
      } else {
        setError('Form belum lengkap atau ada data yang belum valid. Cek kembali semua field bertanda *.');
      }
      showFeedback();
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(form);

    const dusunPemohon = normalizeAreaValue(String(formData.get('dusun') || ''), 'dusun');
    const desaPemohon = normalizeAreaValue(String(formData.get('desa') || ''), 'desa');
    const kecamatanPemohon = normalizeAreaValue(String(formData.get('kecamatan') || ''), 'kecamatan');
    const kabupatenPemohon = normalizeAreaValue(String(formData.get('kabupaten') || ''), 'kabupaten');
    const provinsiPemohon = normalizeAreaValue(String(formData.get('provinsi') || ''), 'provinsi');
    const alamatPemohon = composeAddress(dusunPemohon, desaPemohon, kecamatanPemohon, kabupatenPemohon, provinsiPemohon);

    const dusunAlmarhum = normalizeAreaValue(String(formData.get('dusunAlmarhum') || ''), 'dusun');
    const desaAlmarhum = normalizeAreaValue(String(formData.get('desaAlmarhum') || ''), 'desa');
    const kecamatanAlmarhum = normalizeAreaValue(String(formData.get('kecamatanAlmarhum') || ''), 'kecamatan');
    const kabupatenAlmarhum = normalizeAreaValue(String(formData.get('kabupatenAlmarhum') || ''), 'kabupaten');
    const provinsiAlmarhum = normalizeAreaValue(String(formData.get('provinsiAlmarhum') || ''), 'provinsi');
    const alamatAlmarhum = composeAddress(dusunAlmarhum, desaAlmarhum, kecamatanAlmarhum, kabupatenAlmarhum, provinsiAlmarhum);

    formData.set('dusun', dusunPemohon);
    formData.set('desa', desaPemohon);
    formData.set('kecamatan', kecamatanPemohon);
    formData.set('kabupaten', kabupatenPemohon);
    formData.set('provinsi', provinsiPemohon);
    formData.set('alamatSekarang', alamatPemohon);

    formData.set('dusunAlmarhum', dusunAlmarhum);
    formData.set('desaAlmarhum', desaAlmarhum);
    formData.set('kecamatanAlmarhum', kecamatanAlmarhum);
    formData.set('kabupatenAlmarhum', kabupatenAlmarhum);
    formData.set('provinsiAlmarhum', provinsiAlmarhum);
    formData.set('alamatTerakhir', alamatAlmarhum);
    formData.set('keperluan', normalizeSpacing(String(formData.get('keperluan') || '')));

    const nikPemohonRaw = String(formData.get('nik') || '');
    const nikAlmarhumRaw = String(formData.get('nikAlmarhum') || '');
    const nikPemohon = nikPemohonRaw.replace(/\D/g, '').slice(0, 16);
    const nikAlmarhum = nikAlmarhumRaw.replace(/\D/g, '').slice(0, 16);

    formData.set('nik', nikPemohon);
    formData.set('nikAlmarhum', nikAlmarhum);

    if (nikPemohon.length !== 16) {
      setLoading(false);
      setError('NIK Pemohon harus terdiri dari 16 digit angka.');
      showFeedback();
      return;
    }

    if (nikAlmarhum.length !== 16) {
      setLoading(false);
      setError('NIK Almarhum/Almarhumah harus terdiri dari 16 digit angka.');
      showFeedback();
      return;
    }

    formData.set("jenisSurat", "Surat Keterangan Kematian");

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
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(
        message.toLowerCase().includes("failed to fetch")
          ? "Koneksi ke server terputus. Coba refresh halaman, lalu ajukan lagi."
          : message
      );
      showFeedback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/permohonan/surat-kematian"
              className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-4"
            >
              <FiArrowLeft /> Kembali
            </Link>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center text-white">
                  <FiHeart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Formulir Surat Keterangan Kematian
                  </h1>
                  <p className="text-gray-600">
                    Isi data sesuai identitas almarhum/almarhumah dan detail kejadian kematian
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
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pelapor */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Data Pelapor/Pemohon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap Pemohon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Nama pelapor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Pemohon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nik"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 16);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="16 digit NIK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon/WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="noTelp"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hubungan dengan Almarhum/Almarhumah <span className="text-red-500">*</span>
                </label>
                <select
                  name="hubunganDenganAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Pemohon (Isi Per Kolom) <span className="text-red-500">*</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dusun <span className="text-red-500">*</span></label>
                <input type="text" name="dusun" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa <span className="text-red-500">*</span></label>
                <input type="text" name="desa" required defaultValue="Aikmual" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan <span className="text-red-500">*</span></label>
                <input type="text" name="kecamatan" required defaultValue="Praya" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten <span className="text-red-500">*</span></label>
                <input type="text" name="kabupaten" required defaultValue="Lombok Tengah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi <span className="text-red-500">*</span></label>
                <input type="text" name="provinsi" required defaultValue="Nusa Tenggara Barat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* Data Almarhum */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Data Almarhum/Almarhumah
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap Almarhum/Almarhumah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Almarhum/Almarhumah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nikAlmarhum"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 16);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tempatLahirAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalLahirAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenisKelaminAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agama <span className="text-red-500">*</span>
                </label>
                <select
                  name="agamaAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pekerjaanAlmarhum"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Terakhir Almarhum/Almarhumah (Isi Per Kolom) <span className="text-red-500">*</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dusun <span className="text-red-500">*</span></label>
                <input type="text" name="dusunAlmarhum" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa <span className="text-red-500">*</span></label>
                <input type="text" name="desaAlmarhum" required defaultValue="Aikmual" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan <span className="text-red-500">*</span></label>
                <input type="text" name="kecamatanAlmarhum" required defaultValue="Praya" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten <span className="text-red-500">*</span></label>
                <input type="text" name="kabupatenAlmarhum" required defaultValue="Lombok Tengah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi <span className="text-red-500">*</span></label>
                <input type="text" name="provinsiAlmarhum" required defaultValue="Nusa Tenggara Barat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          {/* Data Wafat dan Pemakaman */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Data Wafat dan Pemakaman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hari/Tanggal/Tahun Meninggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalMeninggal"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Meninggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="waktuMeninggal"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Meninggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="tempatMeninggal"
                  required
                  placeholder="Contoh: Rumah Sakit Umum Provinsi NTB"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hari/Tanggal Pemakaman <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalPemakaman"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Pemakaman <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="waktuPemakaman"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempat Pemakaman <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="tempatPemakaman"
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sebab Kematian (opsional)
                </label>
                <input
                  type="text"
                  name="sebabKematian"
                  placeholder="Contoh: Sakit"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Tujuan dan Keperluan Surat</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tujuan / Keperluan Surat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="keperluan"
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Contoh: Persyaratan administrasi akta kematian"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <FiUpload className="text-slate-600" /> Upload Dokumen
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Dokumen pendukung kematian dapat ditambahkan bila tersedia.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dokumen Pendukung Kematian (opsional)
                </label>
                <input
                  type="file"
                  name="dokumenTambahan"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-slate-100 file:text-slate-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contoh: surat keterangan RS/dokter, surat pengantar RT/RW, atau dokumen pendukung lain.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 max-w-4xl mx-auto">
            <Link
              href="/permohonan/surat-kematian"
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Ajukan Permohonan
                </>
              )}
            </button>
          </div>

          {loading && (
            <p className="text-sm text-gray-600 text-center">Permohonan sedang diproses...</p>
          )}

          {!loading && (
            <p className="text-xs text-gray-500 text-center">
              Pastikan dokumen KTP dan KK sudah terunggah sebelum klik Ajukan Permohonan.
            </p>
          )}
        </form>
      </div>
      <Footer />
    </>
  );
}

