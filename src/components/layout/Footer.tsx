import Link from "next/link";
import Image from "next/image";
import { FiFileText, FiMapPin, FiPhone } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="kontak" className="border-t border-gray-200 bg-white text-gray-700 w-full">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3 md:gap-8">
          {/* Brand */}
          <div className="text-left pb-5 md:pb-0">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0 md:h-12 md:w-12">
                <Image
                  src="/images/logo-desa.png"
                  alt="Logo Desa Aikmual"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 md:text-xl">Desa Aikmual</h3>
                <p className="text-xs text-gray-500 md:text-sm">Pelayanan Online</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 md:text-sm">
              Layanan surat online Desa Aikmual
            </p>
          </div>

          {/* Divider mobile */}
          <div className="border-t border-gray-100 my-4 md:hidden" />

          {/* Layanan */}
          <div className="text-left pb-5 md:pb-0 md:justify-self-center">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800 md:text-base">
              <FiFileText className="w-4 h-4 text-green-600" />
              Layanan
            </h3>
            <ul className="space-y-2 text-xs text-gray-500 leading-relaxed md:text-sm">
              <li>
                <Link href="/permohonan/surat-domisili" className="transition-colors hover:text-green-600">
                  Surat Keterangan Domisili
                </Link>
              </li>
              <li>
                <Link href="/permohonan/surat-masih-hidup" className="transition-colors hover:text-green-600">
                  Surat Keterangan Masih Hidup
                </Link>
              </li>
              <li>
                <Link href="/permohonan/surat-kematian" className="transition-colors hover:text-green-600">
                  Surat Keterangan Kematian
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="transition-colors hover:text-green-600">
                  Cek Progres Surat
                </Link>
              </li>
              <li>
                <Link href="/staff/login" className="transition-colors hover:text-green-600">
                  Login Staff
                </Link>
              </li>
            </ul>
          </div>

          {/* Divider mobile */}
          <div className="border-t border-gray-100 my-4 md:hidden" />

          {/* Kontak */}
          <div className="text-left md:justify-self-end">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800 md:text-base">
              <FiMapPin className="w-4 h-4 text-green-600" />
              Kontak
            </h3>
            <div className="space-y-1.5 text-xs text-gray-500 leading-relaxed md:text-sm">
              <p>Kantor Desa Aikmual</p>
              <p>Kecamatan Aikmual</p>
              <p>Kabupaten Lombok Utara, NTB</p>
              <p className="flex items-center gap-1">
                <FiPhone className="w-3 h-3 flex-shrink-0" />
                085253271360
              </p>
              <p>Senin–Jumat, 08.00–15.00 WITA</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400 md:text-sm">
            &copy; {currentYear} Desa Aikmual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
