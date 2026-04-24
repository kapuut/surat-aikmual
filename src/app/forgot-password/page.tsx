"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Lupa Password?
          </h1>
          <p className="text-gray-700 text-lg mb-6">
            Jika Anda lupa password atau data akun, silakan hubungi <b>Admin Desa</b> untuk melakukan reset password.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mt-4"
          >
            <FiArrowLeft /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
