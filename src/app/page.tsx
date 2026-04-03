// src/app/page.tsx
'use client';

import { useAuth } from '@/lib/useAuth';
import Image from 'next/image';
import UserNavbar from '@/components/UserNavbar';
import Link from 'next/link';
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiInfo,
  FiArrowRight,
} from 'react-icons/fi';

const ALLOWED_SURAT_TYPES = [
  {
    slug: 'surat-domisili',
    title: 'Surat Keterangan Domisili',
    href: '/permohonan/surat-domisili',
    description: 'Keterangan domisili resmi untuk keperluan administrasi warga.',
    estimate: '1-2 hari kerja',
  },
  {
    slug: 'surat-kematian',
    title: 'Surat Keterangan Kematian',
    href: '/permohonan/surat-kematian',
    description: 'Surat keterangan kematian untuk pelaporan dan pengurusan dokumen keluarga.',
    estimate: '1-2 hari kerja',
  },
  {
    slug: 'surat-kepemilikan',
    title: 'Surat Keterangan Kepemilikan',
    href: '/permohonan/surat-kepemilikan',
    description: 'Keterangan kepemilikan aset/barang sesuai data pendukung pemohon.',
    estimate: '2-3 hari kerja',
  },
  {
    slug: 'surat-cerai',
    title: 'Surat Keterangan Cerai',
    href: '/permohonan/surat-cerai',
    description: 'Surat pendukung status cerai untuk kebutuhan administrasi tertentu.',
    estimate: '2-3 hari kerja',
  },
  {
    slug: 'surat-janda',
    title: 'Surat Keterangan Janda/Duda',
    href: '/permohonan/surat-janda',
    description: 'Keterangan status janda/duda untuk keperluan program atau layanan publik.',
    estimate: '1-2 hari kerja',
  },
  {
    slug: 'surat-kehilangan',
    title: 'Surat Keterangan Kehilangan',
    href: '/permohonan/surat-kehilangan',
    description: 'Keterangan kehilangan dokumen/barang sebagai dasar pengurusan lanjutan.',
    estimate: '1-2 hari kerja',
  },
  {
    slug: 'surat-penghasilan',
    title: 'Surat Keterangan Penghasilan',
    href: '/permohonan/surat-penghasilan',
    description: 'Surat penghasilan untuk syarat bantuan, pendidikan, atau administrasi lain.',
    estimate: '1-2 hari kerja',
  },
  {
    slug: 'surat-tidak-punya-rumah',
    title: 'Surat Keterangan Tidak Memiliki Rumah',
    href: '/permohonan/surat-tidak-punya-rumah',
    description: 'Keterangan tidak memiliki rumah untuk syarat program bantuan perumahan.',
    estimate: '2-3 hari kerja',
  },
  {
    slug: 'surat-usaha',
    title: 'Surat Keterangan Usaha',
    href: '/permohonan/surat-usaha',
    description: 'Keterangan usaha warga untuk kebutuhan perizinan dan dukungan pembiayaan.',
    estimate: '1-2 hari kerja',
  },
];

const SERVICE_STEPS = [
  {
    title: '1. Isi Formulir Online',
    description: 'Pilih jenis surat, isi data pemohon, lalu unggah dokumen persyaratan.',
    icon: FiFileText,
  },
  {
    title: '2. Verifikasi Petugas',
    description: 'Petugas desa memeriksa kelengkapan data dan memberi notifikasi jika perlu revisi.',
    icon: FiCheckCircle,
  },
  {
    title: '3. Surat Selesai',
    description: 'Surat dapat diunduh atau diambil sesuai arahan petugas sesuai jam pelayanan.',
    icon: FiClock,
  },
];

const SERVICE_ANNOUNCEMENTS = [
  'Layanan online aktif 24 jam, verifikasi berkas dilakukan pada jam kerja kantor desa.',
  'Pastikan NIK dan nomor WhatsApp aktif agar notifikasi proses dapat diterima.',
  'Pengajuan yang masuk di luar jam kerja diproses pada hari kerja berikutnya.',
];

const POPULAR_REQUIREMENTS = [
  {
    title: 'Surat Keterangan Domisili',
    requirements: ['Fotokopi KTP', 'Fotokopi KK', 'Mengisi formulir pengajuan'],
  },
  {
    title: 'Surat Keterangan Usaha',
    requirements: ['Fotokopi KTP', 'Fotokopi KK', 'Keterangan lokasi/usaha yang dijalankan'],
  },
  {
    title: 'Surat Keterangan Penghasilan',
    requirements: ['Fotokopi KTP', 'Fotokopi KK', 'Surat pernyataan penghasilan'],
  },
];

const FAQ_ITEMS = [
  {
    question: 'Berapa lama proses surat diselesaikan?',
    answer: 'Estimasi layanan 1-2 hari kerja tergantung jenis surat dan kelengkapan berkas.',
  },
  {
    question: 'Apakah pengajuan bisa dilakukan dari HP?',
    answer: 'Bisa. Sistem ini dapat diakses melalui ponsel maupun komputer selama terhubung internet.',
  },
  {
    question: 'Bagaimana jika ada data yang salah?',
    answer: 'Petugas akan memberi catatan revisi pada status permohonan. Anda bisa memperbaiki data lalu kirim ulang.',
  },
  {
    question: 'Bagaimana cara cek status surat?',
    answer: 'Gunakan menu Cek Progres Surat dan masukkan data pelacakan sesuai yang diberikan sistem.',
  },
];

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 animate-pulse"></div>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
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
              <div>
                <h1 className="text-lg font-bold text-gray-900">Sistem Pelayanan Surat</h1>
                <p className="text-xs text-gray-600">Desa Aikmual</p>
              </div>
            </Link>
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
      <section className="relative w-full bg-[url('/images/gerbang-aikmual.png')] bg-cover bg-center bg-no-repeat text-white py-28 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/45"></div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Sistem Pelayanan Surat
              <span className="block text-blue-200 text-3xl md:text-4xl mt-2">Desa Aikmual</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Pelayanan administrasi surat resmi Pemerintah Desa Aikmual yang mudah, cepat, dan transparan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={isAuthenticated ? '/permohonan' : '/login'}
                className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FiFileText className="w-5 h-5" />
                {isAuthenticated ? 'Buat Permohonan' : 'Mulai Sekarang'}
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tracking"
                className="border-2 border-white text-white font-semibold py-4 px-8 rounded-full hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
              >
                <FiCheckCircle className="w-5 h-5" />
                Cek Progres Surat
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm md:text-base text-blue-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-4 py-2">
                <FiClock className="h-4 w-4" />
                <span>Senin-Jumat, 08.00-15.00 WITA</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-4 py-2">
                <FiMapPin className="h-4 w-4" />
                <span>Kantor Desa Aikmual</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-4 py-2">
                <FiPhone className="h-4 w-4" />
                <span>Kontak Pelayanan: 08xx-xxxx-xxxx</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Pengajuan */}
      <section className="w-full py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Alur Pengajuan Surat</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Proses dibuat sederhana agar warga dapat mengurus surat dengan langkah yang jelas dan terpantau.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICE_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="p-6 rounded-2xl border border-gray-200 bg-gray-50 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <main id="layanan" className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Layanan Surat Online</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Pilih jenis surat yang Anda butuhkan. Setiap layanan dilengkapi persyaratan dan estimasi waktu penyelesaian.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-12 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <FiInfo className="w-4 h-4" />
            Informasi Pelayanan Hari Ini
          </div>
          <ul className="space-y-2 text-sm text-amber-900">
            {SERVICE_ANNOUNCEMENTS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-700"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Service Cards */}
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ALLOWED_SURAT_TYPES.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <FiFileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 min-h-[44px]">{item.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                      Estimasi {item.estimate}
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200 transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600">
                      <FiArrowRight className="w-4 h-4 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Persyaratan Surat Populer</h3>
          <div className="grid gap-5 md:grid-cols-3">
            {POPULAR_REQUIREMENTS.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="font-bold text-gray-900 mb-3">{item.title}</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {item.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pertanyaan Umum (FAQ)</h3>
          <div className="max-w-4xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group rounded-xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer list-none font-semibold text-gray-900 group-open:text-blue-700">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Butuh Bantuan Pengajuan?</h3>
          <p className="text-gray-600 mb-6">
            Gunakan pelacakan untuk melihat progres, atau hubungi petugas desa untuk konsultasi langsung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isAuthenticated ? '/permohonan' : '/login'}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isAuthenticated ? 'Buat Permohonan' : 'Masuk Untuk Mengajukan'}
            </Link>
            <Link
              href="/tracking"
              className="border border-blue-600 text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              Cek Progres Surat
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 md:py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <div className="relative h-11 w-11 flex-shrink-0">
                  <Image
                    src="/images/logo-desa.png"
                    alt="Logo Desa Aikmual"
                    fill
                    sizes="44px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Desa Aikmual</h3>
                  <p className="text-sm text-gray-600">Pelayanan Online</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sistem informasi pelayanan surat online untuk mempermudah pelayanan administrasi desa.
              </p>
            </div>
            <div className="text-center md:text-left md:justify-self-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {ALLOWED_SURAT_TYPES.slice(0, 3).map((item) => (
                  <li key={item.slug}>
                    <Link href={item.href} className="hover:text-blue-600">
                      {item.title}
                    </Link>
                  </li>
                ))}
                <li><Link href="/tracking" className="hover:text-blue-600">Cek Progres Surat</Link></li>
                <li><Link href="/staff/login" className="hover:text-blue-600">Login Staff</Link></li>
              </ul>
            </div>
            <div className="text-center md:text-left md:justify-self-end">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Kantor Desa Aikmual</p>
                <p>Kecamatan Aikmual</p>
                <p>Kabupaten Lombok Utara</p>
                <p>Nusa Tenggara Barat</p>
                <p>Senin-Jumat, 08.00-15.00 WITA</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-6 pt-6">
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
