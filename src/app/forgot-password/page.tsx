"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiArrowLeft, FiCheck, FiAlertCircle } from "react-icons/fi";

type AlertType = 'success' | 'error' | 'info' | null;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: "success",
          message: data.message || "Email reset password telah dikirim. Periksa inbox Anda.",
        });
        setSubmitted(true);
        setEmail("");
      } else {
        setAlert({
          type: "error",
          message: data.error || "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Terjadi kesalahan koneksi. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <FiCheck className="text-green-600 text-3xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Link Reset Terkirim
            </h1>
            <p className="text-gray-600 mb-6">
              Kami telah mengirimkan link reset password ke email Anda. Link berlaku selama 1 jam.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-900">
                <strong>Langkah berikutnya:</strong>
              </p>
              <ul className="text-sm text-blue-900 list-decimal list-inside mt-2 space-y-1">
                <li>Periksa email Anda (termasuk folder spam)</li>
                <li>Klik link reset password</li>
                <li>Buat password baru Anda</li>
                <li>Login dengan password baru</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 font-medium"
              >
                <FiArrowLeft /> Kembali ke Login
              </Link>
            </div>

            <p className="text-sm text-gray-600 mt-6">
              Belum menerima email?{" "}
              <button
                onClick={() => setSubmitted(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                Coba lagi
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lupa Password?
          </h1>
          <p className="text-gray-600">
            Masukkan email akun Anda untuk menerima link reset password
          </p>
        </div>

        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg flex gap-3 ${
              alert.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {alert.type === "success" ? (
              <FiCheck className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                alert.type === "success" ? "text-green-800" : "text-red-800"
              }
            >
              {alert.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">atau</span>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Kembali ke Login
          </Link>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
