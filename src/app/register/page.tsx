"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiMapPin, FiPhone, FiEye, FiEyeOff, FiUserPlus, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      nama: String(formData.get("nama") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      nik: String(formData.get("nik") || "").trim(),
      password: String(formData.get("password") || ""),
      alamat: String(formData.get("alamat") || "").trim(),
      telepon: String(formData.get("telepon") || "").trim(),
    };
    const dokumenKTP = formData.get("dokumenKTP");
    const dokumenKK = formData.get("dokumenKK");

    if (!payload.nama || !payload.email || !payload.nik || !payload.password || !payload.alamat || !payload.telepon) {
      setError("Semua field wajib diisi, termasuk nomor WhatsApp aktif");
      setLoading(false);
      return;
    }

    if (!/^\d{16}$/.test(payload.nik)) {
      setError("NIK wajib 16 digit angka");
      setLoading(false);
      return;
    }

    if (payload.password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (!/^(\+62|62|0|8)\d{8,13}$/.test(payload.telepon.replace(/[^0-9+]/g, ""))) {
      setError("Format nomor WhatsApp tidak valid");
      setLoading(false);
      return;
    }

    if (!(dokumenKTP instanceof File) || dokumenKTP.size === 0) {
      setError("Dokumen KTP wajib diunggah saat registrasi");
      setLoading(false);
      return;
    }

    if (!(dokumenKK instanceof File) || dokumenKK.size === 0) {
      setError("Dokumen Kartu Keluarga (KK) wajib diunggah saat registrasi");
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    submitData.set("nama", payload.nama);
    submitData.set("email", payload.email);
    submitData.set("nik", payload.nik);
    submitData.set("password", payload.password);
    submitData.set("alamat", payload.alamat);
    submitData.set("telepon", payload.telepon);
    submitData.set("dokumenKTP", dokumenKTP);
    submitData.set("dokumenKK", dokumenKK);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: submitData,
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(
          `Server tidak mengembalikan JSON. Kemungkinan endpoint error/404. Status: ${response.status}.` +
          (rawText ? ` Detail: ${rawText.slice(0, 120)}` : "")
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Registrasi gagal. Silakan coba lagi.");
      }

      router.push("/login?registered=pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-600 text-white p-4 rounded-2xl mb-4 shadow-lg">
              <FiUserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrasi Masyarakat</h1>
            <p className="text-gray-600">Buat akun Portal Masyarakat SI Surat Desa</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Daftar Akun Baru</h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-2">
                  NIK
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nik"
                    name="nik"
                    type="text"
                    required
                    maxLength={16}
                    pattern="[0-9]{16}"
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan NIK"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-12 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="alamat"
                    name="alamat"
                    required
                    rows={3}
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telepon" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp Aktif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telepon"
                    name="telepon"
                    type="tel"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Digunakan untuk notifikasi saat surat selesai diproses.
                </p>
              </div>

              <div>
                <label htmlFor="dokumenKTP" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload KTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUpload className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="dokumenKTP"
                    name="dokumenKTP"
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dokumenKK" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Kartu Keluarga (KK)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUpload className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="dokumenKK"
                    name="dokumenKK"
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  KTP dan KK diunggah sekali saat registrasi, tidak perlu diulang saat ajukan surat.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="w-5 h-5" />
                    Daftar
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-700">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Login di sini
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
