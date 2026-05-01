import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="kontak" className="border-t border-gray-200 bg-white text-gray-700 text-sm md:text-base w-full">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <div className="text-left">
            <div className="mb-4 flex items-start gap-3">
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image
                  src="/images/logo-desa.png"
                  alt="Logo Desa Aikmual"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-gray-900 md:text-2xl">Desa Aikmual</h3>
                <p className="mt-1 text-xs text-gray-600 md:text-base">Pelayanan Online</p>
              </div>
            </div>
            <p className="max-w-md text-xs leading-6 text-gray-600 md:text-base">
              Sistem informasi pelayanan surat online untuk mempermudah pelayanan administrasi desa.
            </p>
          </div>

          <div className="text-left md:justify-self-center">
            <h3 className="mb-4 text-lg font-bold tracking-tight text-gray-900 md:text-2xl">Layanan</h3>
            <ul className="space-y-2 text-xs text-gray-600 md:text-base">
              <li>
                <Link href="/permohonan/surat-domisili" className="transition-colors hover:text-blue-600">
                  Surat Keterangan Domisili
                </Link>
              </li>
              <li>
                <Link href="/permohonan/surat-masih-hidup" className="transition-colors hover:text-blue-600">
                  Surat Keterangan Masih Hidup
                </Link>
              </li>
              <li>
                <Link href="/permohonan/surat-kematian" className="transition-colors hover:text-blue-600">
                  Surat Keterangan Kematian
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="transition-colors hover:text-blue-600">
                  Cek Progres Surat
                </Link>
              </li>
              <li>
                <Link href="/staff/login" className="transition-colors hover:text-blue-600">
                  Login Staff
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-left md:justify-self-end">
            <h3 className="mb-4 text-lg font-bold tracking-tight text-gray-900 md:text-2xl">Kontak</h3>
            <div className="space-y-2 text-xs text-gray-600 md:text-base">
              <p>Kantor Desa Aikmual</p>
              <p>Kecamatan Aikmual</p>
              <p>Kabupaten Lombok Utara</p>
              <p>Nusa Tenggara Barat</p>
              <p>Telepon/WhatsApp: 085253271360</p>
              <p>Senin-Jumat, 08.00-15.00 WITA</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-500 md:text-base">
            &copy; {currentYear} SI Pengarsipan Surat Desa Aikmual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
