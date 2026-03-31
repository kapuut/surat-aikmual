"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiLoader } from "react-icons/fi";

type AlertType = 'success' | 'error' | 'info' | null;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Validasi token saat page load
  useEffect(() => {
    const validateToken = async () => {
      const tokenParam = searchParams.get("token");
      const emailParam = searchParams.get("email");

      if (!tokenParam || !emailParam) {
        setAlert({
          type: "error",
          message: "Link reset password tidak valid",
        });
        setValidating(false);
        return;
      }

      setToken(tokenParam);
      setEmail(emailParam);

      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(
            tokenParam
          )}&email=${encodeURIComponent(emailParam)}`
        );
        const data = await response.json();

        if (data.isValid) {
          setTokenValid(true);
          // Hitung waktu kadaluarsa
          const expiresAt = new Date(data.expiresAt);
          const now = new Date();
          const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
          if (minutesLeft >= 0) {
            setAlert({
              type: "info",
              message: `Link berlaku untuk ${minutesLeft} menit lagi`,
            });
          }
        } else {
          setAlert({
            type: "error",
            message: data.error || "Link tidak valid atau sudah kadaluarsa",
          });
        }
      } catch (error) {
        setAlert({
          type: "error",
          message: "Terjadi kesalahan validasi link. Coba lagi nanti.",
        });
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // Validasi form
    if (!formData.newPassword || !formData.confirmPassword) {
      setAlert({
        type: "error",
        message: "Semua field wajib diisi",
      });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setAlert({
        type: "error",
        message: "Password minimal 6 karakter",
      });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setAlert({
        type: "error",
        message: "Password tidak cocok",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: "success",
          message: data.message || "Password berhasil direset!",
        });
        setSubmitted(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
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

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <FiLoader className="text-4xl text-blue-600 mb-4 animate-spin" />
          <p className="text-gray-600">Memvalidasi link reset password...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <FiAlertCircle className="text-red-600 text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Tidak Valid</h1>
          <p className="text-gray-600 mb-6">
            {alert?.message || "Link reset password tidak valid atau sudah kadaluarsa."}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <FiCheck className="text-green-600 text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Password Berhasil Direset
          </h1>
          <p className="text-gray-600 mb-6">
            Password Anda telah berhasil diubah. Anda akan diarahkan ke halaman login...
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password Baru
          </h1>
          <p className="text-gray-600">
            Masukkan password baru Anda
          </p>
        </div>

        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg flex gap-3 ${
              alert.type === "error"
                ? "bg-red-50 border border-red-200"
                : alert.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {alert.type === "error" ? (
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
            ) : alert.type === "success" ? (
              <FiCheck className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <FiLoader className="text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                alert.type === "error"
                  ? "text-red-800"
                  : alert.type === "success"
                  ? "text-green-800"
                  : "text-blue-800"
              }
            >
              {alert.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {/* Password Baru */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ketik ulang password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">Password tidak cocok</p>
            )}
            {formData.newPassword && formData.newPassword === formData.confirmPassword && (
              <p className="text-green-600 text-sm mt-1">✓ Password cocok</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Memproses..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Ingat password Anda sekarang?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Login sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
