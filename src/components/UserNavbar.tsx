'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiUser, FiLogOut, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/lib/hooks';

interface UserNavbarProps {
  showMainMenu?: boolean;
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'sekretaris':
      return '/sekretaris/dashboard';
    case 'kepala_desa':
      return '/kepala-desa/dashboard';
    case 'masyarakat':
    default:
      return '/dashboard';
  }
}

export default function UserNavbar({ showMainMenu = true }: UserNavbarProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown saat click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex-shrink-0">
              <Image 
                src="/images/logo-desa.png" 
                alt="Logo Desa Aikmual" 
                width={40} 
                height={40}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Sistem Pelayanan Surat</h1>
              <p className="text-xs text-gray-600 leading-tight">Desa Aikmual</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated && user ? (
              <>
                {showMainMenu && (
                  <>
                    {/* Dashboard - dinamis berdasarkan role */}
                    <Link 
                      href={getDashboardRoute(user.role)} 
                      className="text-gray-600 hover:text-blue-600 transition font-medium"
                    >
                      Dashboard
                    </Link>

                    {/* Permohonan - hanya untuk masyarakat */}
                    {user.role === 'masyarakat' && (
                      <Link href="/permohonan" className="text-gray-600 hover:text-blue-600 transition">
                        Permohonan
                      </Link>
                    )}

                    {/* Lacak Surat - sembunyikan hanya untuk admin */}
                    {user.role !== 'admin' && (
                      <Link href="/tracking" className="text-gray-600 hover:text-blue-600 transition">
                        Lacak Surat
                      </Link>
                    )}
                  </>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    <FiUser className="text-lg" />
                    <span className="text-sm font-medium text-gray-700">{user.nama}</span>
                    <FiChevronDown className={`text-sm transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.nama}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiUser className="text-lg" />
                          <span>Kelola Akun</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                        >
                          <FiLogOut className="text-lg" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600"
            >
              {isMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Beranda
                </Link>
                {/* Dashboard - dinamis berdasarkan role */}
                {showMainMenu && (
                  <>
                    <Link
                      href={getDashboardRoute(user.role)}
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>

                    {/* Permohonan - hanya untuk masyarakat */}
                    {user.role === 'masyarakat' && (
                      <Link
                        href="/permohonan"
                        className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Permohonan
                      </Link>
                    )}

                    {/* Lacak Surat - sembunyikan hanya untuk admin */}
                    {user.role !== 'admin' && (
                      <Link
                        href="/tracking"
                        className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Lacak Surat
                      </Link>
                    )}
                  </>
                )}
                
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kelola Akun
                </Link>

                {/* Ganti Password - hanya untuk user biasa, tidak untuk staff/admin */}
                {user.role === 'masyarakat' && (
                  <Link
                    href="/change-password"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ganti Password
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
