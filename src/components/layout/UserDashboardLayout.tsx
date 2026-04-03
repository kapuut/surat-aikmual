"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiFileText, 
  FiSearch,
  FiUser,
  FiLogOut
} from 'react-icons/fi';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export default function UserDashboardLayout({ children, onLogout }: UserDashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-64px)] font-display">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col fixed left-0 top-16 h-[calc(100vh-64px)]">
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

          <div className="border-t border-slate-700 my-4"></div>

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
        </nav>

        <div className="p-4 border-t border-slate-700">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-slate-800 hover:text-white rounded transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto md:ml-64">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
