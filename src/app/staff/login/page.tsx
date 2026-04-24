"use client";


import Link from "next/link";
import { FiShield, FiUsers, FiStar, FiArrowLeft } from "react-icons/fi";
import Header from "@/components/layout/Header";

export default function StaffLoginSelectionPage() {
  const roles = [
    {
      id: "admin",
      title: "Admin",
      description: "Kelola sistem dan pengguna",
      icon: FiShield,
      iconBg: "bg-slate-600",
      cardBg: "bg-white hover:bg-slate-50",
      iconColor: "text-slate-600",
      borderColor: "border-slate-200 hover:border-slate-300",
      href: "/admin/login",
    },
    {
      id: "sekretaris",
      title: "Sekretaris",
      description: "Proses surat dan permohonan",
      icon: FiUsers,
      iconBg: "bg-blue-600",
      cardBg: "bg-white hover:bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200 hover:border-blue-300",
      href: "/sekretaris/login",
    },
    {
      id: "kepala_desa",
      title: "Kepala Desa",
      description: "Persetujuan dan monitoring",
      icon: FiStar,
      iconBg: "bg-purple-600",
      cardBg: "bg-white hover:bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200 hover:border-purple-300",
      href: "/kepala-desa/login",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-slate-600 to-blue-600 text-white p-4 rounded-2xl mb-6 shadow-lg">
            <FiShield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Login Staff Desa
          </h1>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Link
                key={role.id}
                href={role.href}
                className={`${role.cardBg} ${role.borderColor} border-2 rounded-2xl p-8 transition-all transform hover:scale-105 hover:shadow-xl group`}
              >
                <div className="flex flex-col items-center text-center">
                  <h3 className={`text-2xl font-bold mb-3 ${role.iconColor}`}>
                    {role.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {role.description}
                  </p>
                  <div className={`mt-4 ${role.iconColor} text-sm font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Login sebagai {role.title}
                    <FiArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              Kembali ke Landing Page
            </Link>
          </div>
        </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full text-center py-4 text-gray-500 text-sm bg-white/70 border-t border-gray-100">
        &copy; {new Date().getFullYear()} Desa Aikmual. Sistem Informasi Surat.
      </footer>
    </div>
  );
}
