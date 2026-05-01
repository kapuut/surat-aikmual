"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  FiHome, 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiFile, 
  FiBarChart, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiUsers,
  FiUser,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';

type HeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
};

const HEADER_BY_PATH: Record<string, HeaderContent> = {
  '/admin/dashboard': {
    eyebrow: 'Portal Admin',
    title: 'Selamat datang, Administrator Sistem',
    description: '',
  },
  '/admin/surat-masuk': {
    eyebrow: 'Portal Admin',
    title: 'Surat Masuk',
    description: 'Kelola data surat masuk yang diterima oleh kantor desa.',
  },
  '/admin/surat-keluar': {
    eyebrow: 'Portal Admin',
    title: 'Surat Keluar',
    description: 'Kelola data surat keluar yang dikirim oleh kantor desa.',
  },
  '/admin/permohonan': {
    eyebrow: 'Portal Admin',
    title: 'Permohonan Surat',
    description: 'Kelola permohonan, approval, dan penandatanganan surat oleh warga desa.',
  },
  '/admin/template-surat': {
    eyebrow: 'Portal Admin',
    title: 'Template Surat',
    description: 'Kelola template surat yang digunakan untuk pembuatan surat.',
  },
  '/admin/laporan/surat-masuk': {
    eyebrow: 'Portal Admin',
    title: 'Laporan Surat Masuk',
    description: 'Laporan lengkap data surat masuk yang diterima oleh kantor desa.',
  },
  '/admin/laporan/surat-keluar': {
    eyebrow: 'Portal Admin',
    title: 'Laporan Surat Keluar',
    description: 'Laporan lengkap data surat keluar yang dikirim oleh kantor desa.',
  },
  '/admin/pemantauan-user': {
    eyebrow: 'Portal Admin',
    title: 'Pemantauan User',
    description: 'Kelola aktivitas user dan hak akses dalam sistem.',
  },
  '/admin/profile': {
    eyebrow: 'Portal Admin',
    title: 'Profil Akun',
    description: 'Kelola data akun dan keamanan administrator sistem.',
  },
  '/admin/approval': {
    eyebrow: 'Portal Admin',
    title: 'Approval Dokumen',
    description: 'Kelola persetujuan dan penandatanganan dokumen surat.',
  },
  '/admin/laporan/grafik': {
    eyebrow: 'Portal Admin',
    title: 'Laporan Grafik',
    description: 'Visualisasi data surat masuk dan keluar dalam bentuk grafik per bulan.',
  },
  '/admin/surat-masuk/tambah': {
    eyebrow: 'Portal Admin',
    title: 'Tambah Surat Masuk',
    description: 'Input dan arsipkan surat masuk baru ke dalam sistem.',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Administrator Sistem');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const headerContent = (() => {
    if (pathname === '/admin/dashboard') {
      return {
        ...HEADER_BY_PATH['/admin/dashboard'],
        title: `Selamat datang, ${userName}`,
      };
    }

    if (HEADER_BY_PATH[pathname]) {
      return HEADER_BY_PATH[pathname];
    }

    if (pathname.startsWith('/admin/laporan/')) {
      return {
        eyebrow: 'Portal Admin',
        title: 'Laporan Administrasi',
        description: 'Pantau ringkasan laporan untuk mendukung pengambilan keputusan.',
      };
    }

    if (pathname.startsWith('/admin/')) {
      return {
        eyebrow: 'Portal Admin',
        title: 'Menu Administrasi',
        description: 'Kelola operasional surat dan layanan desa melalui panel admin.',
      };
    }

    return null;
  })();

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
      window.location.href = '/admin/login';
    }
  };

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join('');
  const profileLabel = 'Admin';

  return (
    <div className="flex h-screen overflow-hidden font-display">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 h-screen bg-slate-900 text-white flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl border border-slate-600 bg-slate-800/80 p-1 shadow-sm ring-1 ring-white/10 backdrop-blur-sm">
              <Image
                src="/images/logo-desa.png"
                alt="Logo Desa"
                width={40}
                height={40}
                className="h-full w-full rounded-xl object-contain"
                priority
              />
            </div>
            <div className="flex h-12 flex-col justify-center gap-0.5">
              <h1 className="text-lg leading-tight font-semibold tracking-tight text-white">SI Surat</h1>
              <p className="text-xs leading-tight text-blue-100/90">Desa Aikmual</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/admin/dashboard' 
                ? 'bg-slate-800 text-white font-semibold' 
                : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FiHome className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          
          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Manajemen Surat</p>
            <Link
              href="/admin/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/surat-masuk' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiInbox className="w-4 h-4" />
              <span>Surat Masuk</span>
            </Link>
            <Link
              href="/admin/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/surat-keluar' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiSend className="w-4 h-4" />
              <span>Surat Keluar</span>
            </Link>
            <Link
              href="/admin/permohonan"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/permohonan' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Permohonan</span>
            </Link>
            <Link
              href="/admin/template-surat"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/template-surat' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiFile className="w-4 h-4" />
              <span>Template Surat</span>
            </Link>
          </div>
          
          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Laporan & Analisis</p>
            <Link
              href="/admin/laporan/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/laporan/surat-masuk' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiBarChart className="w-4 h-4" />
              <span>Laporan Surat Masuk</span>
            </Link>
            <Link
              href="/admin/laporan/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/laporan/surat-keluar' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              <span>Laporan Surat Keluar</span>
            </Link>

          </div>

          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
            <Link
              href="/admin/pemantauan-user"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/pemantauan-user' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Pemantauan User</span>
            </Link>
            <Link
              href="/admin/profile"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/profile' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiUser className="w-4 h-4" />
              <span>Profil Akun</span>
            </Link>
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen bg-gray-50 overflow-y-auto w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {headerContent && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{headerContent.eyebrow}</p>
                <h1 className="mt-1 text-xl md:text-2xl font-bold text-gray-900">{headerContent.title}</h1>
                {headerContent.description && (
                  <p className="mt-1 text-sm text-gray-600 max-w-3xl">
                    {headerContent.description}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex h-9 items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-2.5 transition"
            >
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                {initials || 'AD'}
              </span>
              <span className="flex h-7 items-center text-xs font-medium text-gray-700 leading-none">{profileLabel}</span>
              <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
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
        <div className={pathname === '/admin/dashboard' ? '' : 'px-6 py-6 lg:px-8'}>{children}</div>
      </main>
    </div>
  );
}
