"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiMapPin, FiPhone, FiEye, FiEyeOff, FiUserPlus, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import FooterWrapper from "@/components/layout/FooterWrapper";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [nikInput, setNikInput] = useState("");
  const [nikCheckState, setNikCheckState] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const [nikCheckMessage, setNikCheckMessage] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailCheckState, setEmailCheckState] = useState<"idle" | "checking" | "taken" | "invalid" | "available">("idle");
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
  const [conflictModal, setConflictModal] = useState<{ title: string; message: string; field: string } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  }, [error]);

  useEffect(() => {
    const nik = nikInput.trim();

    if (!nik) {
      setNikCheckState("idle");
      setNikCheckMessage(null);
      return;
    }

    if (!/^\d+$/.test(nik) || nik.length < 16) {
      setNikCheckState("idle");
      setNikCheckMessage(null);
      return;
    }

    if (nik.length > 16) {
      setNikCheckState("idle");
      setNikCheckMessage("NIK wajib 16 digit angka");
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setNikCheckState("checking");
      setNikCheckMessage("Memeriksa NIK...");

      try {
        const response = await fetch(`/api/auth/check-nik?nik=${encodeURIComponent(nik)}`, {
          method: "GET",
          signal: abortController.signal,
          cache: "no-store",
        });

        const data = await response.json();

        if (data?.exists) {
          setNikCheckState("taken");
          setNikCheckMessage("NIK sudah digunakan");
          return;
        }

        setNikCheckState("available");
        setNikCheckMessage(null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setNikCheckState("idle");
        setNikCheckMessage(null);
      }
    }, 350);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [nikInput]);

  useEffect(() => {
    const email = emailInput.trim();

    if (!email) {
      setEmailCheckState("idle");
      setEmailCheckMessage(null);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckState("invalid");
      setEmailCheckMessage("Format email tidak sesuai");
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setEmailCheckState("checking");
      setEmailCheckMessage("Memeriksa email...");

      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
          method: "GET",
          signal: abortController.signal,
          cache: "no-store",
        });

        const data = await response.json();

        if (data?.exists) {
          setEmailCheckState("taken");
          setEmailCheckMessage("Email sudah digunakan");
          return;
        }

        setEmailCheckState("available");
        setEmailCheckMessage(null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setEmailCheckState("idle");
        setEmailCheckMessage(null);
      }
    }, 400);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [emailInput]);

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
      setError("Email dan password wajib diisi");
      setLoading(false);
      return;
    }

    if (!/^\d{16}$/.test(payload.nik)) {
      setError("NIK wajib 16 digit angka");
      setLoading(false);
      return;
    }

    if (nikCheckState === "taken") {
      setConflictModal({
        title: "NIK Sudah Terdaftar",
        message: "NIK yang Anda masukkan sudah digunakan oleh akun lain. Pastikan NIK yang dimasukkan benar, atau hubungi admin desa jika terjadi kesalahan.",
        field: "NIK",
      });
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError("Format email tidak sesuai");
      setLoading(false);
      return;
    }

    if (emailCheckState === "taken") {
      setConflictModal({
        title: "Email Sudah Digunakan",
        message: "Alamat email yang Anda masukkan sudah terdaftar. Gunakan email lain, atau login jika Anda sudah memiliki akun.",
        field: "Email",
      });
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

            <div ref={errorRef}>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

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
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border rounded-lg focus:ring-2 ${
                      emailCheckState === "taken" || emailCheckState === "invalid"
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="Masukkan email"
                  />
                </div>
                {emailCheckMessage && (
                  <p
                    className={`mt-1 text-xs ${
                      emailCheckState === "taken" || emailCheckState === "invalid"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {emailCheckMessage}
                  </p>
                )}
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
                    value={nikInput}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setNikInput(sanitized);
                    }}
                    className={`block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border rounded-lg focus:ring-2 ${
                      nikCheckState === "taken"
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="Masukkan NIK"
                  />
                </div>
                {nikCheckMessage && (
                  <p
                    className={`mt-1 text-xs ${
                      nikCheckState === "taken"
                        ? "text-red-600"
                        : nikCheckState === "checking"
                          ? "text-gray-500"
                          : "text-gray-500"
                    }`}
                  >
                    {nikCheckMessage}
                  </p>
                )}
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
      <FooterWrapper />

      {conflictModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConflictModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 bg-red-100 text-red-600 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{conflictModal.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{conflictModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConflictModal(null);
                  const fieldId = conflictModal.field === "NIK" ? "nik" : "email";
                  document.getElementById(fieldId)?.focus();
                  document.getElementById(fieldId)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Ubah {conflictModal.field}
              </button>
              <button
                onClick={() => setConflictModal(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
