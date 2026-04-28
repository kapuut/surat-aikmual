"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSend, FiUsers, FiCheckCircle, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { checkBusinessHours } from "@/lib/utils";

export default function SuratCeraiFormPage() {
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

  const toTitleCase = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    return cleaned
      .toLowerCase()
      .split(" ")
      .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ""))
      .join(" ");
  };

  const normalizeAreaValue = (value: string, type: "dusun" | "desa" | "kecamatan" | "kabupaten" | "provinsi") => {
    const cleaned = value.replace(/\s+/g, " ").trim();
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
            if (directLabel) return directLabel.textContent?.replace("*", "").trim() || null;
          }

          const wrapperLabel = el.closest("div")?.querySelector("label");
          return wrapperLabel?.textContent?.replace("*", "").trim() || null;
        })
        .filter((label): label is string => Boolean(label));

      form.reportValidity();
      if (invalidLabels.length > 0) {
        setError(`Data belum valid pada: ${invalidLabels.slice(0, 3).join(", ")}${invalidLabels.length > 3 ? ", ..." : ""}.`);
      } else {
        setError("Form belum lengkap atau ada data yang belum valid. Cek kembali semua field bertanda *.");
      }
      showFeedback();
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(form);

    const nama = toTitleCase(String(formData.get("nama") || ""));
    const tempatLahir = toTitleCase(String(formData.get("tempatLahir") || ""));
    const pekerjaan = toTitleCase(String(formData.get("pekerjaan") || ""));
    const kewarganegaraan = toTitleCase(String(formData.get("kewarganegaraan") || "Indonesia")) || "Indonesia";

    const namaMantan = toTitleCase(String(formData.get("namaMantan") || ""));
    const tempatLahirPasangan = toTitleCase(String(formData.get("tempatLahirPasangan") || ""));
    const pekerjaanPasangan = toTitleCase(String(formData.get("pekerjaanPasangan") || ""));
    const kewarganegaraanPasangan = toTitleCase(String(formData.get("kewarganegaraanPasangan") || "Indonesia")) || "Indonesia";

    const dusun = normalizeAreaValue(String(formData.get("dusun") || ""), "dusun");
    const desa = normalizeAreaValue(String(formData.get("desa") || ""), "desa");
    const kecamatan = normalizeAreaValue(String(formData.get("kecamatan") || ""), "kecamatan");
    const kabupaten = normalizeAreaValue(String(formData.get("kabupaten") || ""), "kabupaten");
    const provinsi = normalizeAreaValue(String(formData.get("provinsi") || ""), "provinsi");
    const alamatPemohon = composeAddress(dusun, desa, kecamatan, kabupaten, provinsi);

    const dusunPasangan = normalizeAreaValue(String(formData.get("dusunPasangan") || ""), "dusun");
    const desaPasangan = normalizeAreaValue(String(formData.get("desaPasangan") || ""), "desa");
    const kecamatanPasangan = normalizeAreaValue(String(formData.get("kecamatanPasangan") || ""), "kecamatan");
    const kabupatenPasangan = normalizeAreaValue(String(formData.get("kabupatenPasangan") || ""), "kabupaten");
    const provinsiPasangan = normalizeAreaValue(String(formData.get("provinsiPasangan") || ""), "provinsi");
    const alamatPasangan = composeAddress(dusunPasangan, desaPasangan, kecamatanPasangan, kabupatenPasangan, provinsiPasangan);

    formData.set("nama", nama);
    formData.set("tempatLahir", tempatLahir);
    formData.set("pekerjaan", pekerjaan);
    formData.set("kewarganegaraan", kewarganegaraan);

    formData.set("namaMantan", namaMantan);
    formData.set("tempatLahirPasangan", tempatLahirPasangan);
    formData.set("pekerjaanPasangan", pekerjaanPasangan);
    formData.set("kewarganegaraanPasangan", kewarganegaraanPasangan);

    formData.set("dusun", dusun);
    formData.set("desa", desa);
    formData.set("kecamatan", kecamatan);
    formData.set("kabupaten", kabupaten);
    formData.set("provinsi", provinsi);
    formData.set("alamatSekarang", alamatPemohon);
    formData.set("alamat", alamatPemohon);

    formData.set("dusunPasangan", dusunPasangan);
    formData.set("desaPasangan", desaPasangan);
    formData.set("kecamatanPasangan", kecamatanPasangan);
    formData.set("kabupatenPasangan", kabupatenPasangan);
    formData.set("provinsiPasangan", provinsiPasangan);
    formData.set("alamatPasangan", alamatPasangan);
    formData.set("keperluan", String(formData.get("keperluan") || "").replace(/\s+/g, " ").trim());

    const nikRaw = String(formData.get("nik") || "");
    const nik = nikRaw.replace(/\D/g, "").slice(0, 16);
    formData.set("nik", nik);

    const nikPasanganRaw = String(formData.get("nikPasangan") || "");
    const nikPasangan = nikPasanganRaw.replace(/\D/g, "").slice(0, 16);
    formData.set("nikPasangan", nikPasangan);
    // Keep backward compatibility for existing backend aliases.
    formData.set("nikMantan", nikPasangan);

    if (nik.length !== 16) {
      setLoading(false);
      setError("NIK harus terdiri dari 16 digit angka.");
      showFeedback();
      return;
    }

    if (nikPasangan.length !== 16) {
      setLoading(false);
      setError("NIK pasangan cerai harus terdiri dari 16 digit angka.");
      showFeedback();
      return;
    }

    const dokumenAktaCerai = formData.get("dokumenAktaCerai");
    const hasAktaCerai = dokumenAktaCerai instanceof File && dokumenAktaCerai.size > 0;

    if (!hasAktaCerai) {
      setLoading(false);
      setError("Upload Akta Cerai wajib diisi.");
      showFeedback();
      return;
    }

    formData.set("jenisSurat", "Surat Keterangan Cerai");

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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/permohonan/surat-cerai"
              className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 mb-4"
            >
              <FiArrowLeft /> Kembali
            </Link>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center text-white">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Formulir Surat Keterangan Cerai</h1>
                  <p className="text-gray-600">Lengkapi data inti pemohon sesuai kebutuhan surat</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
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

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="statusPerkawinan" value="Cerai Hidup" />

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Data Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" name="nama" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nik"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 16);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="16 digit NIK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir <span className="text-red-500">*</span></label>
                <input type="text" name="tempatLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input type="date" name="tanggalLahir" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select name="jenisKelamin" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agama <span className="text-red-500">*</span></label>
                <select name="agama" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan <span className="text-red-500">*</span></label>
                <input type="text" name="pekerjaan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon/WhatsApp <span className="text-red-500">*</span></label>
                <input type="tel" name="noTelp" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kewarganegaraan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="kewarganegaraan"
                  required
                  defaultValue="Indonesia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pemohon (Isi Per Kolom) <span className="text-red-500">*</span></label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dusun <span className="text-red-500">*</span></label>
                <input type="text" name="dusun" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Darwis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa <span className="text-red-500">*</span></label>
                <input type="text" name="desa" required defaultValue="Aikmual" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Aikmual" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan <span className="text-red-500">*</span></label>
                <input type="text" name="kecamatan" required defaultValue="Praya" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Praya" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten <span className="text-red-500">*</span></label>
                <input type="text" name="kabupaten" required defaultValue="Lombok Tengah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Lombok Tengah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi <span className="text-red-500">*</span></label>
                <input type="text" name="provinsi" required defaultValue="Nusa Tenggara Barat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Nusa Tenggara Barat" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Data Pasangan Cerai</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap Pasangan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="namaMantan"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Nama mantan suami/istri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK Pasangan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nikPasangan"
                  required
                  maxLength={16}
                  inputMode="numeric"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 16);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="16 digit NIK pasangan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="tempatLahirPasangan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir Pasangan <span className="text-red-500">*</span></label>
                <input type="date" name="tanggalLahirPasangan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kewarganegaraan Pasangan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="kewarganegaraanPasangan"
                  required
                  defaultValue="Indonesia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agama Pasangan <span className="text-red-500">*</span></label>
                <select name="agamaPasangan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="pekerjaanPasangan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Cerai <span className="text-red-500">*</span></label>
                <input type="date" name="tanggalCerai" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pasangan (Isi Per Kolom) <span className="text-red-500">*</span></label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dusun Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="dusunPasangan" required className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Darwis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="desaPasangan" required defaultValue="Aikmual" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Aikmual" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="kecamatanPasangan" required defaultValue="Praya" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Praya" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="kabupatenPasangan" required defaultValue="Lombok Tengah" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Lombok Tengah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi Pasangan <span className="text-red-500">*</span></label>
                <input type="text" name="provinsiPasangan" required defaultValue="Nusa Tenggara Barat" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Contoh: Nusa Tenggara Barat" />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Contoh: Persyaratan administrasi perubahan KK"
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <FiUpload className="text-sky-600" /> Upload Dokumen
            </h2>
            <p className="text-sm text-gray-600 mb-4">Akta Cerai wajib diunggah. Dokumen tambahan bisa dilampirkan jika diperlukan.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Akta Cerai <span className="text-red-500">*</span></label>
                <input type="file" name="dokumenAktaCerai" required accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-sky-100 file:text-sky-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen Tambahan (opsional)</label>
                <input type="file" name="dokumenTambahan" multiple accept=".jpg,.jpeg,.png,.pdf" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded file:bg-slate-100 file:text-slate-700" />
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/permohonan/surat-cerai"
              className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-sky-700 transition-colors disabled:bg-sky-400 flex items-center justify-center gap-2"
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
      <Footer />
    </>
  );
}
