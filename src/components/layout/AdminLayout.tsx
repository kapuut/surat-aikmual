import Link from "next/link";
import { usePathname } from "next/navigation";
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
  FiUser
} from 'react-icons/fi';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <FiFolder className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-bold">Arsip Surat</h1>
          </div>
          <p className="text-sm text-gray-300 mt-1">Panel Administrator</p>
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
            <Link
              href="/admin/laporan/grafik"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/laporan/grafik' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiTrendingDown className="w-4 h-4" />
              <span>Grafik Analisis</span>
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-400 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
            <Link
              href="/admin/approval"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/approval' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Persetujuan</span>
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/users' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Hak Akses Pengguna</span>
            </Link>
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
              <span>Profil Admin</span>
            </Link>
            <Link
              href="/admin/change-password"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/admin/change-password' 
                  ? 'bg-slate-800 text-white font-semibold' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FiLock className="w-4 h-4" />
              <span>Ganti Password</span>
            </Link>
          </div>
        </nav>

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
