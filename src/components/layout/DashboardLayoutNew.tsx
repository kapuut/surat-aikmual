'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { FiHome, FiFileText, FiSearch, FiUser, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: FiHome,
    },
    {
      label: 'Permohonan Surat',
      href: '/permohonan',
      icon: FiFileText,
    },
    {
      label: 'Lacak Surat',
      href: '/tracking',
      icon: FiSearch,
    },
    {
      label: 'Kelola Akun',
      href: '/profile',
      icon: FiUser,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl z-40">
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-blue-700 px-6">
          <div className="text-center">
            <h2 className="text-lg font-bold">SI SURAT</h2>
            <p className="text-xs text-blue-200">Desa Aikmual</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-8 px-3">
          <div className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    active
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {active && <FiChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors text-sm"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-64 right-0 h-20 bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="h-full px-8 flex items-center justify-between">
          {/* Left - Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-600 mt-0.5">{description}</p>}
          </div>

          {/* Right - User Info */}
          <div className="text-right border-l border-gray-200 pl-8">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</p>
            <p className="text-sm font-bold text-blue-900">{user?.nama || 'User'}</p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="ml-64 mt-20 p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
