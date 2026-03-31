'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiFileText, FiSearch, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/lib/useAuth';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-lg z-40">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-blue-700">
        <div className="text-center">
          <h2 className="text-xl font-bold">SI SURAT</h2>
          <p className="text-xs text-blue-200">Desa Aikmual</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-8">
        {menuItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-700 border-l-4 border-white text-white'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors text-sm"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
