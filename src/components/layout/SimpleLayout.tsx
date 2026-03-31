'use client';

import { useRequireAuth } from '@/lib/useAuth';
import UserNavbar from '@/components/UserNavbar';
import React from 'react';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <UserNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Branding */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  SI
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Desa Aikmual</h3>
                  <p className="text-sm text-gray-600">Pelayanan Online</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Sistem informasi pelayanan surat online untuk mempermudah pelayanan administrasi desa.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Menu Utama</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="/" className="hover:text-blue-600 transition">Beranda</a>
                </li>
                <li>
                  <a href="/permohonan" className="hover:text-blue-600 transition">Permohonan Surat</a>
                </li>
                <li>
                  <a href="/tracking" className="hover:text-blue-600 transition">Lacak Surat</a>
                </li>
                <li>
                  <a href="/profile" className="hover:text-blue-600 transition">Profil Akun</a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Kontak & Informasi</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="font-medium text-gray-700">Kantor Desa Aikmual</li>
                <li>Email: info@aikmual.go.id</li>
                <li>Telepon: (0xxx) xxx-xxxx</li>
                <li>Jam Kerja: Senin-Jumat, 08:00-16:00</li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © 2026 Desa Aikmual. Semua hak dilindungi.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition">Kebijakan Privasi</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition">Syarat Layanan</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition">Hubungi Kami</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
