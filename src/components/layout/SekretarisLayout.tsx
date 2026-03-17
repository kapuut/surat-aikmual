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
  FiCheckCircle, 
  FiLock, 
  FiFolder,
  FiEdit
} from 'react-icons/fi';

export default function SekretarisLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen font-display">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center space-x-2">
            <FiFolder className="w-6 h-6 text-blue-300" />
            <h1 className="text-lg font-bold">Arsip Surat</h1>
          </div>
          <p className="text-sm text-blue-200 mt-1">Panel Sekretaris</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/sekretaris/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
              pathname === '/sekretaris/dashboard' 
                ? 'bg-blue-800 text-white font-semibold' 
                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <FiHome className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          
          <div>
            <p className="text-xs uppercase text-blue-300 mt-4 mb-2 font-semibold tracking-wider">Manajemen Surat</p>
            <Link
              href="/sekretaris/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/surat-masuk' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiInbox className="w-4 h-4" />
              <span>Surat Masuk</span>
            </Link>
            <Link
              href="/sekretaris/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/surat-keluar' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiSend className="w-4 h-4" />
              <span>Surat Keluar</span>
            </Link>
            <Link
              href="/sekretaris/permohonan"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/permohonan' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Permohonan</span>
            </Link>
            <Link
              href="/sekretaris/template-surat"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/template-surat' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiFile className="w-4 h-4" />
              <span>Template Surat</span>
            </Link>
          </div>
          
          <div>
            <p className="text-xs uppercase text-blue-300 mt-4 mb-2 font-semibold tracking-wider">Laporan</p>
            <Link
              href="/sekretaris/laporan/surat-masuk"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/laporan/surat-masuk' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiBarChart className="w-4 h-4" />
              <span>Laporan Surat Masuk</span>
            </Link>
            <Link
              href="/sekretaris/laporan/surat-keluar"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/laporan/surat-keluar' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              <span>Laporan Surat Keluar</span>
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase text-blue-300 mt-4 mb-2 font-semibold tracking-wider">Pengaturan</p>
            <Link
              href="/sekretaris/disposisi"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/disposisi' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiEdit className="w-4 h-4" />
              <span>Disposisi Surat</span>
            </Link>
            <Link
              href="/sekretaris/change-password"
              className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                pathname === '/sekretaris/change-password' 
                  ? 'bg-blue-800 text-white font-semibold' 
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <FiLock className="w-4 h-4" />
              <span>Ganti Password</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="text-center text-xs text-blue-200">
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
