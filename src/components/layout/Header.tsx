import Link from "next/link";
import Image from "next/image";
import { FiHome, FiFileText } from "react-icons/fi";

export default function Header() {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <FiHome className="w-4 h-4" />
              <span className="text-sm font-medium">Beranda</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
