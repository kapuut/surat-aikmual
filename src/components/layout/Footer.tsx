import Link from "next/link";
import Image from "next/image";
import { FiFileText, FiMapPin, FiPhone } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="kontak" className="border-t border-gray-200 bg-white text-gray-700 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 py-8 md:py-10">
        <div className="w-full flex flex-col gap-7 md:flex-row md:items-start md:justify-between md:gap-6">
          {/* Brand */}
          <div className="w-full text-left md:w-[34%]">
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
                <h3 className="text-xl font-bold tracking-tight text-gray-900">Desa Aikmual</h3>
                <p className="text-sm text-gray-500 md:text-base">Pelayanan Online</p>
              </div>
            </div>
            <p className="text-base leading-relaxed text-gray-500">
              Layanan surat online Desa Aikmual
            </p>
          </div>

          {/* Divider mobile */}
          <div className="border-t border-gray-100 my-4 md:hidden" />

          {/* Layanan */}
          <div className="w-full text-left md:w-[30%] md:px-2">
            <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-gray-800 md:text-lg">
              <FiFileText className="w-4 h-4 text-green-600" />
              Layanan
            </h3>
            <ul className="space-y-2 text-base text-gray-500 leading-relaxed">
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
          <div className="w-full text-left md:w-[32%] md:pl-2">
            <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold text-gray-800 md:text-lg">
              <FiMapPin className="w-4 h-4 text-green-600" />
              Kontak
            </h3>
            <div className="space-y-1.5 text-base text-gray-500 leading-relaxed">
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

        <div className="mt-7 border-t border-gray-100 pt-5 text-center">
          <p className="text-base text-gray-500">
            &copy; {currentYear} Desa Aikmual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
