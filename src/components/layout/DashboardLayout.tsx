"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser, UserRole } from "@/lib/types";
import { getUserPermissions } from "@/lib/auth";
import { 
  FiHome, 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiFile, 
  FiBarChart, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCheckCircle, 
  FiLock, 
  FiFolder,
  FiUsers,
  FiLogOut,
  FiSettings,
  FiClock
} from 'react-icons/fi';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: AuthUser;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const permissions = getUserPermissions(user.role);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getMenuItems = (role: UserRole) => {
    const baseUrl = role === 'admin' ? '/admin' : 
                   role === 'sekretaris' ? '/sekretaris' :
                   role === 'kepala_desa' ? '/kepala-desa' : '';

    const items = [];

    // Dashboard - semua role
    items.push({
      href: `${baseUrl}/dashboard`,
      icon: FiHome,
      label: 'Dashboard',
      section: 'main'
    });

    // Menu berdasarkan permission
    if (permissions.suratMasuk.read) {
      items.push({
        href: `${baseUrl}/surat-masuk`,
        icon: FiInbox,
        label: 'Surat Masuk',
        section: 'surat'
      });
    }

    if (permissions.suratKeluar.read) {
      items.push({
        href: `${baseUrl}/surat-keluar`,
        icon: FiSend,
        label: 'Surat Keluar',
        section: 'surat'
      });
    }

    if (permissions.permohonan.read) {
      items.push({
        href: role === 'masyarakat' ? '/permohonan' : `${baseUrl}/permohonan`,
        icon: FiFileText,
        label: 'Permohonan',
        section: 'surat'
      });
    }

    if (permissions.templateSurat.read && role !== 'masyarakat') {
      items.push({
        href: `${baseUrl}/template-surat`,
        icon: FiFile,
        label: 'Template Surat',
        section: 'surat'
      });
    }

    // Laporan
    if (permissions.laporan.read) {
      items.push({
        href: `${baseUrl}/laporan/surat-masuk`,
        icon: FiBarChart,
        label: 'Laporan Surat Masuk',
        section: 'laporan'
      });
      items.push({
        href: `${baseUrl}/laporan/surat-keluar`,
        icon: FiTrendingUp,
        label: 'Laporan Surat Keluar',
        section: 'laporan'
      });
      items.push({
        href: `${baseUrl}/laporan/grafik`,
        icon: FiTrendingDown,
        label: 'Grafik Analisis',
        section: 'laporan'
      });
    }

    // Approval
    if (permissions.approval.read) {
      items.push({
        href: `${baseUrl}/approval`,
        icon: FiCheckCircle,
        label: 'Persetujuan',
        section: 'pengaturan'
      });
    }

    // User Management
    if (permissions.userManagement.read) {
      items.push({
        href: `${baseUrl}/users`,
        icon: FiUsers,
        label: 'Manajemen User',
        section: 'pengaturan'
      });
    }

    // Riwayat untuk masyarakat
    if (role === 'masyarakat') {
      items.push({
        href: '/permohonan/riwayat',
        icon: FiClock,
        label: 'Riwayat Permohonan',
        section: 'surat'
      });
    }

    // Ganti Password - semua role
    items.push({
      href: `${baseUrl}/change-password`,
      icon: FiLock,
      label: 'Ganti Password',
      section: 'pengaturan'
    });

    return items;
  };

  const menuItems = currentUser ? getMenuItems(currentUser.role) : [];
  const sections = {
    main: menuItems.filter(item => item.section === 'main'),
    surat: menuItems.filter(item => item.section === 'surat'),
    laporan: menuItems.filter(item => item.section === 'laporan'),
    pengaturan: menuItems.filter(item => item.section === 'pengaturan')
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'sekretaris': return 'Sekretaris Desa';
      case 'kepala_desa': return 'Kepala Desa';
      case 'masyarakat': return 'Masyarakat';
      default: return 'User';
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <FiFolder className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">Sistem Informasi Surat</h1>
          </div>
          <p className="text-sm text-gray-300 mt-1">{getRoleLabel(currentUser.role)}</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {currentUser.nama.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.nama}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Main Section */}
          {sections.main.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Surat Section */}
          {sections.surat.length > 0 && (
            <>
              <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">
                {currentUser.role === 'masyarakat' ? 'Layanan Surat' : 'Manajemen Surat'}
              </p>
              {sections.surat.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                      pathname === item.href
                        ? 'bg-slate-800 text-white font-semibold' 
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Laporan Section */}
          {sections.laporan.length > 0 && (
            <>
              <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">
                Laporan & Analisis
              </p>
              {sections.laporan.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                      pathname === item.href
                        ? 'bg-slate-800 text-white font-semibold' 
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Pengaturan Section */}
          {sections.pengaturan.length > 0 && (
            <>
              <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">
                Pengaturan
              </p>
              {sections.pengaturan.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                      pathname === item.href
                        ? 'bg-slate-800 text-white font-semibold' 
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded text-gray-300 hover:bg-red-600 hover:text-white transition-colors w-full"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-center text-xs text-gray-400">
            <p className="font-medium">Sistem Informasi Surat</p>
            <p className="mt-1">© 2025 Desa Digital</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}