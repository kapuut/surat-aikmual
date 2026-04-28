// src/app/page.tsx
'use client';

import { useAuth } from '@/lib/useAuth';
import UserNavbar from '@/components/UserNavbar';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useEffect, useMemo, useState } from 'react';
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
    description: 'Keterangan domisili resmi untuk administrasi warga.',
  },
  {
    slug: 'surat-masih-hidup',
    title: 'Surat Keterangan Masih Hidup',
    href: '/permohonan/surat-masih-hidup',
    description: 'Surat pernyataan bahwa seseorang masih hidup untuk kebutuhan administrasi.',
  },
  {
    slug: 'surat-kematian',
    title: 'Surat Keterangan Kematian',
    href: '/permohonan/surat-kematian',
    description: 'Surat keterangan kematian untuk pelaporan dan pengurusan dokumen keluarga.',
  },
  {
    slug: 'surat-cerai',
    title: 'Surat Keterangan Cerai',
    href: '/permohonan/surat-cerai',
    description: 'Surat pendukung status cerai untuk kebutuhan administrasi tertentu.',
  },
  {
    slug: 'surat-janda',
    title: 'Surat Keterangan Janda/Duda',
    href: '/permohonan/surat-janda',
    description: 'Keterangan status janda/duda untuk program atau layanan publik.',
  },
  {
    slug: 'surat-kehilangan',
    title: 'Surat Keterangan Kehilangan',
    href: '/permohonan/surat-kehilangan',
    description: 'Keterangan kehilangan dokumen/barang sebagai dasar pengurusan lanjutan.',
  },
  {
    slug: 'surat-penghasilan',
    title: 'Surat Keterangan Penghasilan',
    href: '/permohonan/surat-penghasilan',
    description: 'Surat penghasilan untuk syarat bantuan, pendidikan, atau administrasi lain.',
  },
  {
    slug: 'surat-tidak-punya-rumah',
    title: 'Surat Keterangan Tidak Memiliki Rumah',
    href: '/permohonan/surat-tidak-punya-rumah',
    description: 'Keterangan tidak memiliki rumah untuk syarat program bantuan perumahan.',
  },
  {
    slug: 'surat-usaha',
    title: 'Surat Keterangan Usaha',
    href: '/permohonan/surat-usaha',
    description: 'Keterangan usaha warga untuk kebutuhan perizinan dan dukungan pembiayaan.',
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
  'Layanan pengajuan surat dibuka Senin-Jumat pukul 08.00-15.00 WITA.',
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
    answer: 'Lama proses surat disesuaikan dengan jenis surat dan kelengkapan berkas yang diajukan.',
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

type DynamicTemplateSummary = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
};

const PRIMARY_SURAT_LIMIT = 9;

function normalizeSuratName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [dynamicTemplates, setDynamicTemplates] = useState<DynamicTemplateSummary[]>([]);
  const [showAllSurat, setShowAllSurat] = useState(false);
  const isMasyarakat = isAuthenticated && user?.role === 'masyarakat';
  const showCitizenActions = isMasyarakat;
  const isPublicView = !isAuthenticated || !user;

  useEffect(() => {
    let cancelled = false;

    const loadDynamicTemplates = async () => {
      try {
        const response = await fetch('/api/dynamic-templates');
        const data = await response.json();

        if (!response.ok || !data?.success || !Array.isArray(data?.templates)) {
          return;
        }

        if (!cancelled) {
          setDynamicTemplates(data.templates as DynamicTemplateSummary[]);
        }
      } catch {
        // Keep the landing page stable even if dynamic templates fail to load.
      }
    };

    loadDynamicTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const suratCards = useMemo(() => {
    const staticCards = ALLOWED_SURAT_TYPES.map((item) => ({
      key: `static-${item.slug}`,
      title: item.title,
      description: item.description,
      href: item.href,
    }));

    const mergedCards = [...staticCards];
    const cardIndexByName = new Map<string, number>();
    const seenDynamicNames = new Set<string>();

    mergedCards.forEach((card, index) => {
      cardIndexByName.set(normalizeSuratName(card.title), index);
    });

    for (const template of dynamicTemplates) {
      const dynamicTitle = (template.jenisSurat || template.nama || '').trim();
      if (!dynamicTitle) continue;

      const dynamicNameKey = normalizeSuratName(dynamicTitle);
      if (!dynamicNameKey || seenDynamicNames.has(dynamicNameKey)) {
        continue;
      }
      seenDynamicNames.add(dynamicNameKey);

      const dynamicCard = {
        key: `dynamic-${template.id}`,
        title: dynamicTitle,
        description: template.deskripsi || 'Jenis surat tambahan yang dikonfigurasi admin.',
        href: `/permohonan/dinamis/${encodeURIComponent(template.id)}`,
      };

      const existingIndex = cardIndexByName.get(dynamicNameKey);
      if (existingIndex !== undefined) {
        mergedCards[existingIndex] = {
          ...mergedCards[existingIndex],
          description: dynamicCard.description,
          href: dynamicCard.href,
        };
        continue;
      }

      cardIndexByName.set(dynamicNameKey, mergedCards.length);
      mergedCards.push(dynamicCard);
    }

    return mergedCards;
  }, [dynamicTemplates]);

  const displayedSuratCards = showAllSurat ? suratCards : suratCards.slice(0, PRIMARY_SURAT_LIMIT);
  const hasMoreSuratCards = suratCards.length > PRIMARY_SURAT_LIMIT;
  const hiddenSuratCount = Math.max(suratCards.length - PRIMARY_SURAT_LIMIT, 0);

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
    <div className={`min-h-screen bg-gray-50 ${isPublicView ? 'pt-20' : ''}`}>
      {/* Header - Berubah jika authenticated */}
      {isAuthenticated && user ? (
        <UserNavbar />
      ) : (
        <Header />
      )}

      {/* Hero Section */}
      <section id="beranda" className="relative w-full overflow-hidden bg-[url('/images/gerbang-aikmual.png')] bg-cover bg-center bg-no-repeat py-28 text-white md:py-32">
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

            {showCitizenActions && (
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
            )}

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
                <a href="tel:085253271360" className="hover:text-white transition-colors">
                  Kontak: 085253271360
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Pengajuan */}
      <section id="alur-pengajuan" className="w-full bg-white py-16">
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
            Pilih jenis surat yang Anda butuhkan. Setiap layanan dilengkapi persyaratan yang jelas.
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
          {displayedSuratCards.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <FiFileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 min-h-[44px]">{item.description}</p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200 transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600">
                      <FiArrowRight className="w-4 h-4 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {hasMoreSuratCards && (
          <div className="mx-auto mt-8 flex max-w-7xl justify-center">
            <button
              type="button"
              onClick={() => setShowAllSurat((current) => !current)}
              className="rounded-full border border-blue-200 bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              {showAllSurat
                ? 'Tutup jenis permohonan lainnya'
                : `Lihat jenis permohonan lainnya (${hiddenSuratCount})`}
            </button>
          </div>
        )}

        <div id="persyaratan" className="mt-16 scroll-mt-28">
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

        <div id="faq" className="mt-16 scroll-mt-28">
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
          {showCitizenActions && (
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
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
