// src/components/layout/dashboard-layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { 
  FiFileText, FiPlus, FiHome, FiBarChart, 
  FiSettings, FiMail, FiSend 
} from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: FiHome
  },
  {
    name: 'Kelola Surat',
    href: '/surat',
    icon: FiFileText
  },
  {
    name: 'Tambah Surat',
    href: '/surat/tambah',
    icon: FiPlus
  },
  {
    name: 'Laporan',
    href: '/laporan',
    icon: FiBarChart
  },
  {
    name: 'Pengaturan',
    href: '/pengaturan',
    icon: FiSettings
  }
];

export default function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiFileText className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SI Arsip</h1>
                <p className="text-xs text-gray-600">Desa Aikmual</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="text-lg" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          {/* Footer dihapus agar dashboard tidak ada footer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6">
          <div>
            {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          </div>
          <div className="flex items-center space-x-4">
            {actions}
            <div className="text-sm text-gray-600">
              Kantor Desa Aikmual
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}