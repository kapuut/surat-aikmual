"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiUser,
  FiLock,
  FiArrowLeft,
  FiShield,
  FiUsers,
  FiStar,
  FiLogIn,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export type InternalLoginVariant = "admin" | "sekretaris" | "kepala_desa" | "shared";

interface InternalLoginPageProps {
  variant?: InternalLoginVariant;
}

const VARIANT_CONFIG: Record<InternalLoginVariant, { 
  title: string; 
  description: string; 
  bgColor: string;
  icon: any;
  dashboardUrl: string;
}> = {
  admin: {
    title: "Admin",
    description: "Kelola sistem dan pengguna",
    bgColor: "from-slate-600 to-slate-700",
    icon: FiShield,
    dashboardUrl: "/admin/dashboard",
  },
  sekretaris: {
    title: "Sekretaris",
    description: "Proses surat dan permohonan",
    bgColor: "from-blue-600 to-blue-700",
    icon: FiUsers,
    dashboardUrl: "/sekretaris/dashboard",
  },
  kepala_desa: {
    title: "Kepala Desa",
    description: "Persetujuan dan monitoring",
    bgColor: "from-purple-600 to-purple-700",
    icon: FiStar,
    dashboardUrl: "/kepala-desa/dashboard",
  },
  shared: {
    title: "Portal Staff",
    description: "Login sebagai Admin, Sekretaris, atau Kepala Desa",
    bgColor: "from-gray-600 to-gray-700",
    icon: FiShield,
    dashboardUrl: "/dashboard",
  },
};

export default function InternalLoginPage({ variant = "shared" }: InternalLoginPageProps) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const config = useMemo(() => VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.shared, [variant]);
  const IconComponent = config.icon;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...credentials,
          loginType: "internal",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }

      setTimeout(() => {
        const redirectUrl = data.redirectUrl || config.dashboardUrl;
        if (typeof window !== "undefined") {
          window.location.href = redirectUrl;
        } else {
          router.push(redirectUrl);
        }
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  placeholder="Masukkan username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
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
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-12 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  placeholder="Masukkan password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${config.bgColor} hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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

          {/* Navigation Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/staff/login"
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Kembali ke Pilihan Login
            </Link>
          </div>
        </div>

        {/* Footer */}
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
    <Footer />
  </>
  );
}
