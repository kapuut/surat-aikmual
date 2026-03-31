// src/app/page.tsx
'use client';

import { useAuth } from '@/lib/useAuth';
import UserNavbar from '@/components/UserNavbar';
import Link from 'next/link';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiArrowRight,
} from 'react-icons/fi';

const ALLOWED_SURAT_TYPES = [
  {
    slug: 'surat-domisili',
    title: 'Surat Keterangan Domisili',
    href: '/permohonan/surat-domisili',
  },
  {
    slug: 'surat-kematian',
    title: 'Surat Keterangan Kematian',
    href: '/permohonan/surat-kematian',
  },
  {
    slug: 'surat-kepemilikan',
    title: 'Surat Keterangan Kepemilikan',
    href: '/permohonan/surat-kepemilikan',
  },
  {
    slug: 'surat-cerai',
    title: 'Surat Keterangan Cerai',
    href: '/permohonan/surat-cerai',
  },
  {
    slug: 'surat-janda',
    title: 'Surat Keterangan Janda/Duda',
    href: '/permohonan/surat-janda',
  },
  {
    slug: 'surat-kehilangan',
    title: 'Surat Keterangan Kehilangan',
    href: '/permohonan/surat-kehilangan',
  },
  {
    slug: 'surat-penghasilan',
    title: 'Surat Keterangan Penghasilan',
    href: '/permohonan/surat-penghasilan',
  },
  {
    slug: 'surat-tidak-punya-rumah',
    title: 'Surat Keterangan Tidak Memiliki Rumah',
    href: '/permohonan/surat-tidak-punya-rumah',
  },
  {
    slug: 'surat-usaha',
    title: 'Surat Keterangan Usaha',
    href: '/permohonan/surat-usaha',
  },
];

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Berubah jika authenticated */}
      {isAuthenticated && user ? (
        <UserNavbar />
      ) : (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                SI
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pelayanan Online</h1>
                <p className="text-sm text-gray-600">Desa Aikmual</p>
              </div>
            </div>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Masuk/Daftar
            </Link>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Pelayanan Surat Online
              <span className="block text-blue-200 text-3xl md:text-4xl mt-2">
                Desa Aikmual
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Ajukan berbagai macam surat keterangan secara online dengan mudah, cepat, dan terpercaya
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={isAuthenticated ? "/permohonan" : "/login"}
                className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FiFileText className="w-5 h-5" />
                {isAuthenticated ? "Buat Permohonan" : "Mulai Sekarang"}
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tracking"
                className="border-2 border-white text-white font-semibold py-4 px-8 rounded-full hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
              >
                <FiCheckCircle className="w-5 h-5" />
                Lacak Status Surat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">24/7</h3>
              <p className="text-gray-600">Layanan Online Tersedia Kapan Saja</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Mudah</h3>
              <p className="text-gray-600">Proses Pengajuan Yang Simpel</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiStar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Terpercaya</h3>
              <p className="text-gray-600">Resmi Dari Kantor Desa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <main id="layanan" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Layanan Surat Online
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Pilih jenis surat yang Anda butuhkan. Setiap layanan dilengkapi dengan persyaratan lengkap dan estimasi waktu penyelesaian.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ALLOWED_SURAT_TYPES.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 hover:border-blue-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-600 group-hover:scale-110 transition-transform">
                  <FiFileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-end">
                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Butuh Bantuan Pengajuan?
          </h3>
          <p className="text-gray-600 mb-6">
            Gunakan pelacakan untuk melihat progres, atau hubungi petugas desa untuk konsultasi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isAuthenticated ? "/permohonan" : "/login"}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isAuthenticated ? "Buat Permohonan" : "Masuk Untuk Mengajukan"}
            </Link>
            <Link
              href="/tracking"
              className="border border-blue-600 text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              Lacak Status Surat
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  SI
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Desa Aikmual</h3>
                  <p className="text-sm text-gray-600">Pelayanan Online</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Sistem informasi pelayanan surat online untuk mempermudah pelayanan administrasi desa.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {ALLOWED_SURAT_TYPES.slice(0, 3).map((item) => (
                  <li key={item.slug}>
                    <Link href={item.href} className="hover:text-blue-600">
                      {item.title}
                    </Link>
                  </li>
                ))}
                <li><Link href="/tracking" className="hover:text-blue-600">Lacak Status Surat</Link></li>
                <li><Link href="/staff/login" className="hover:text-blue-600">Login Staff</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Kantor Desa Aikmual</p>
                <p>Kecamatan Aikmual</p>
                <p>Kabupaten Lombok Utara</p>
                <p>Nusa Tenggara Barat</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} SI Pengarsipan Surat Desa Aikmual. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}