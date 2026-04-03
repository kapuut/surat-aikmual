"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  FiHome, 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiBarChart, 
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle, 
  FiLock, 
  FiFolder,
  FiAward,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';

export default function KepalaDesaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Kepala Desa');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/verify', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.nama) {
            setUserName(data.user.nama);
          }
        }
      } catch {
        // Ignore user fetch error in layout header
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.href = '/kepala-desa/login';
    }
  };

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-900 text-white flex flex-col">
        <div className="p-4 border-b border-purple-800">
          <div className="flex items-center space-x-2">
            <FiFolder className="w-6 h-6 text-purple-300" />
            <h1 className="text-lg font-bold">Arsip Surat</h1>
          </div>
          <p className="text-sm text-purple-200 mt-1">Panel Kepala Desa</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/kepala-desa/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/kepala-desa/dashboard' 
                ? 'bg-purple-800 text-white font-semibold' 
                : 'text-purple-100 hover:bg-purple-800 hover:text-white'
            }`}
          >
            <FiHome className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          
          <div>
            <p className="text-xs uppercase text-purple-300 mt-4 mb-2 font-semibold tracking-wider">Manajemen Surat</p>
            <Link
              href="/kepala-desa/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/surat-masuk' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiInbox className="w-4 h-4" />
              <span>Surat Masuk</span>
            </Link>
            <Link
              href="/kepala-desa/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/surat-keluar' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiSend className="w-4 h-4" />
              <span>Surat Keluar</span>
            </Link>
            <Link
              href="/kepala-desa/permohonan"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/permohonan' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Permohonan Warga</span>
            </Link>
          </div>
          
          <div>
            <p className="text-xs uppercase text-purple-300 mt-4 mb-2 font-semibold tracking-wider">Persetujuan</p>
            <Link
              href="/kepala-desa/approval"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/approval' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Persetujuan Surat</span>
            </Link>
            <Link
              href="/kepala-desa/penandatanganan"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/penandatanganan' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiAward className="w-4 h-4" />
              <span>Penandatanganan</span>
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase text-purple-300 mt-4 mb-2 font-semibold tracking-wider">Laporan & Analisis</p>
            <Link
              href="/kepala-desa/laporan/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/laporan/surat-masuk' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiBarChart className="w-4 h-4" />
              <span>Laporan Surat Masuk</span>
            </Link>
            <Link
              href="/kepala-desa/laporan/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/laporan/surat-keluar' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              <span>Laporan Surat Keluar</span>
            </Link>
            <Link
              href="/kepala-desa/laporan/grafik"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/laporan/grafik' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiTrendingDown className="w-4 h-4" />
              <span>Grafik Analisis</span>
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase text-purple-300 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
            <Link
              href="/kepala-desa/change-password"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/kepala-desa/change-password' 
                  ? 'bg-purple-800 text-white font-semibold' 
                  : 'text-purple-100 hover:bg-purple-800 hover:text-white'
              }`}
            >
              <FiLock className="w-4 h-4" />
              <span>Ganti Password</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-purple-800">
          <div className="text-center text-xs text-purple-200">
            <p className="font-medium">Sistem Informasi Surat</p>
            <p className="mt-1">© 2025 Desa Digital</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition"
            >
              <span className="w-8 h-8 rounded-full bg-purple-900 text-white text-sm font-semibold flex items-center justify-center">
                {initials || 'KD'}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
                <p className="text-xs text-gray-500 leading-tight">Kepala Desa</p>
              </div>
              <FiChevronDown className={`text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-30">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
