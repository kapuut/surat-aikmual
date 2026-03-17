import Link from "next/link";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-3">SI Surat Desa Aikmual</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sistem Informasi Persuratan Desa Aikmual untuk memudahkan pelayanan administrasi kepada masyarakat.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-3">Menu Cepat</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="text-gray-400 hover:text-white transition-colors">
                  Lacak Surat
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                  Login Masyarakat
                </Link>
              </li>
              <li>
                <Link href="/staff/login" className="text-gray-400 hover:text-white transition-colors">
                  Login Staff
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-3">Kontak</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400" />
                <span className="text-gray-400">Desa Aikmual, Kecamatan Praya Timur, Lombok Tengah</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">(0370) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">desa.aikmual@example.com</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Desa Aikmual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
