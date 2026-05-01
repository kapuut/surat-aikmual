"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  FiHome, 
  FiFileText, 
  FiSearch,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiMenu,
  FiX,
} from 'react-icons/fi';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

type HeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
};

const HEADER_BY_PATH: Record<string, HeaderContent> = {
  '/dashboard': {
    eyebrow: 'Layanan Warga Desa Aikmual',
    title: 'Dashboard Masyarakat',
    description: 'Kelola pengajuan surat dan pantau progres layanan administrasi desa.',
  },
  '/permohonan': {
    eyebrow: 'Layanan Warga Desa Aikmual',
    title: 'Permohonan Surat',
    description: 'Pilih jenis surat, lengkapi formulir, dan kirim pengajuan secara online.',
  },
  '/tracking': {
    eyebrow: 'Layanan Warga Desa Aikmual',
    title: 'Lacak Surat',
    description: 'Pantau status setiap permohonan sampai surat selesai diterbitkan.',
  },
  '/profile': {
    eyebrow: 'Layanan Warga Desa Aikmual',
    title: 'Profil Akun',
    description: 'Kelola data pribadi dan informasi akun masyarakat.',
  },
  '/change-password': {
    eyebrow: 'Layanan Warga Desa Aikmual',
    title: 'Ganti Password',
    description: 'Perbarui password akun untuk menjaga keamanan akses Anda.',
  },
};

export default function UserDashboardLayout({ children, onLogout }: UserDashboardLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Warga Desa');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const headerContent = (() => {
    if (HEADER_BY_PATH[pathname]) {
      return HEADER_BY_PATH[pathname];
    }

    if (pathname.startsWith('/permohonan')) {
      return {
        ...HEADER_BY_PATH['/permohonan'],
        title: pathname.includes('/form') ? 'Form Permohonan Surat' : HEADER_BY_PATH['/permohonan'].title,
      };
    }

    if (pathname.startsWith('/tracking')) {
      return HEADER_BY_PATH['/tracking'];
    }

    return {
      eyebrow: 'Layanan Warga Desa Aikmual',
      title: 'Layanan Masyarakat',
      description: 'Akses seluruh layanan administrasi surat desa dari satu panel.',
    };
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

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex h-screen overflow-hidden font-display">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 flex items-center justify-between">
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
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                  pathname === '/dashboard'
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
                  href="/permohonan"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/permohonan')
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Permohonan</span>
                </Link>

                <Link
                  href="/tracking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                    pathname === '/tracking'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Lacak Surat</span>
                </Link>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                    pathname === '/profile'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FiUser className="w-4 h-4" />
                  <span>Profil Saya</span>
                </Link>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onLogout?.(); }}
                className="flex items-center space-x-3 px-3 py-2 rounded text-red-400 hover:bg-slate-800 hover:text-red-300 w-full transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen bg-slate-900 text-white flex-col overflow-y-auto">
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
            href="/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/dashboard' 
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
            href="/permohonan"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname.startsWith('/permohonan') 
                ? 'bg-slate-800 text-white font-semibold' 
                : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FiFileText className="w-4 h-4" />
            <span>Permohonan</span>
          </Link>

          <Link
            href="/tracking"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/tracking' 
                ? 'bg-slate-800 text-white font-semibold' 
                : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FiSearch className="w-4 h-4" />
            <span>Lacak Surat</span>
          </Link>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
          <Link
            href="/profile"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/profile' 
                ? 'bg-slate-800 text-white font-semibold' 
                : 'text-gray-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Profil Saya</span>
          </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen bg-gray-50 overflow-y-auto w-full">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Hamburger button — mobile only */}
            <button
              className="md:hidden mt-1 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{headerContent.eyebrow}</p>
              <h1 className="mt-1 text-xl md:text-2xl font-bold text-gray-900">{headerContent.title}</h1>
              <p className="mt-1 text-sm text-gray-600 max-w-3xl">{headerContent.description}</p>
            </div>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex h-9 items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-2.5 transition"
            >
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                {initials || 'MS'}
              </span>
              <span className="hidden sm:flex h-7 max-w-[180px] items-center truncate text-xs font-medium text-gray-700 leading-none">{userName}</span>
              <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-30">
                <Link
                  href="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiUser className="w-4 h-4" />
                  Profil Saya
                </Link>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={pathname === '/dashboard' ? '' : 'px-6 py-6 lg:px-8'}>
          {children}
        </div>
      </main>
    </div>
  );
}
