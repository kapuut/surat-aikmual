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
  FiUser,
  FiEdit,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';

type HeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
};

const HEADER_BY_PATH: Record<string, HeaderContent> = {
  '/sekretaris/dashboard': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Selamat datang, Sekretaris Desa',
    description:
      'Kelola surat masuk, surat keluar, dan verifikasi permohonan warga dengan alur kerja yang terstruktur.',
  },
  '/sekretaris/surat-masuk': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Surat Masuk',
    description: 'Kelola distribusi surat masuk agar proses disposisi berjalan cepat.',
  },
  '/sekretaris/surat-keluar': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Surat Keluar',
    description: 'Pantau surat keluar dari tahap draft hingga arsip pengiriman.',
  },
  '/sekretaris/permohonan': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Permohonan Warga',
    description: 'Verifikasi kelengkapan berkas sebelum diteruskan ke kepala desa.',
  },
  '/sekretaris/disposisi': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Disposisi Surat',
    description: 'Atur tindak lanjut surat masuk ke unit atau petugas terkait.',
  },
  '/sekretaris/change-password': {
    eyebrow: 'Portal Administrasi Terpadu',
    title: 'Profil Akun',
    description: 'Kelola data profil, ubah password, dan pengaturan akun Sekretaris.',
  },
};

export default function SekretarisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Sekretaris Desa');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isSuratMasukActive =
    pathname === '/sekretaris/surat-masuk' ||
    pathname.startsWith('/sekretaris/surat-masuk/') ||
    pathname === '/sekretaris/laporan/surat-masuk';
  const isSuratKeluarActive =
    pathname === '/sekretaris/surat-keluar' ||
    pathname.startsWith('/sekretaris/surat-keluar/') ||
    pathname === '/sekretaris/laporan/surat-keluar';

  const headerContent = (() => {
    if (pathname === '/sekretaris/dashboard') {
      return {
        ...HEADER_BY_PATH['/sekretaris/dashboard'],
        title: `Selamat datang, ${userName}`,
      };
    }

    if (HEADER_BY_PATH[pathname]) {
      return HEADER_BY_PATH[pathname];
    }

    if (pathname.startsWith('/sekretaris/')) {
      return {
        eyebrow: 'Portal Administrasi Terpadu',
        title: 'Panel Sekretaris',
        description: 'Kelola proses surat desa dari verifikasi hingga arsip final.',
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
      window.location.href = '/sekretaris/login';
    }
  };

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join('');
  const profileLabel = 'Sekretaris';

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
            href="/sekretaris/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/sekretaris/dashboard' 
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
              href="/sekretaris/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                isSuratMasukActive
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiInbox className="w-4 h-4" />
              <span>Surat Masuk</span>
            </Link>
            <Link
              href="/sekretaris/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                isSuratKeluarActive
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiSend className="w-4 h-4" />
              <span>Surat Keluar</span>
            </Link>
            <Link
              href="/sekretaris/permohonan"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/permohonan' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Permohonan Warga</span>
            </Link>
          </div>
          
          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
            <Link
              href="/sekretaris/disposisi"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/disposisi' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiEdit className="w-4 h-4" />
              <span>Disposisi Surat</span>
            </Link>
            <Link
              href="/sekretaris/change-password"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/change-password' 
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
                <p className="mt-1 text-sm text-gray-600 max-w-3xl">
                  {headerContent.description}
                </p>
              </>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex h-9 items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-2.5 transition"
            >
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                {initials || 'SD'}
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
        <div className={pathname === '/sekretaris/dashboard' ? '' : 'px-6 py-6 lg:px-8'}>{children}</div>
      </main>
    </div>
  );
}
