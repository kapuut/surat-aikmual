"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PublicLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const toFriendlyLoginError = (status: number) => {
    if (status === 404) {
      return "Layanan login tidak ditemukan (404). Pastikan aplikasi berjalan di port yang benar.";
    }
    if (status >= 500) {
      return "Server sedang bermasalah. Silakan coba lagi beberapa saat.";
    }
    return `Gagal memproses login (status ${status}). Silakan coba lagi.`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const nik = String(formData.get("nik") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!nik || !password) {
      setError("NIK/email dan password wajib diisi");
      setLoading(false);
      return;
    }

    const looksLikeNik = /^\d+$/.test(nik);
    if (looksLikeNik && !/^\d{16}$/.test(nik)) {
      setError("Format NIK tidak valid. NIK harus 16 digit angka.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nik,
          password,
          loginType: "public",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(toFriendlyLoginError(response.status));
      }

      if (!response.ok) {
        throw new Error(data.error || "Login gagal. Silakan coba lagi.");
      }

      router.push(data.redirectUrl || "/");
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi atau jalankan ulang aplikasi.");
      } else {
        setError(err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-600 text-white p-4 rounded-2xl mb-4 shadow-lg">
              <FiUser className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Portal Masyarakat</h1>
            <p className="text-gray-600">SI Surat Desa Aikmual</p>
          </div>

        {/* Card Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Masuk ke Akun Anda</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {searchParams.get("registered") === "1" && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Registrasi berhasil, silakan login
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-2">
                NIK atau Email
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
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  placeholder="Masukkan NIK atau email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
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
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-12 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  placeholder="Masukkan kata sandi"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lupa password?
                </Link>
              </div>
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
                  <FiLogIn className="w-5 h-5" />
                  Masuk
                </>
              )}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-700">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Daftar di sini
            </Link>
          </div>
          {/* Footer Info */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Kembali ke Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </>
  );
}
