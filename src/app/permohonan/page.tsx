'use client';

import { useRequireAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import SimpleLayout from '@/components/layout/SimpleLayout';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';

const SURAT_TYPES = [
  {
    slug: 'surat-domisili',
    title: 'Surat Keterangan Domisili',
    description: 'Surat yang menyatakan tempat tinggal seseorang',
  },
  {
    slug: 'surat-masih-hidup',
    title: 'Surat Keterangan Masih Hidup',
    description: 'Surat pernyataan bahwa seseorang masih hidup',
  },
  {
    slug: 'surat-kematian',
    title: 'Surat Keterangan Kematian',
    description: 'Surat resmi untuk administrasi kematian',
  },
  {
    slug: 'surat-cerai',
    title: 'Surat Keterangan Cerai',
    description: 'Surat yang menyatakan status perceraian',
  },
  {
    slug: 'surat-janda',
    title: 'Surat Keterangan Janda',
    description: 'Surat yang menyatakan status janda',
  },
  {
    slug: 'surat-kehilangan',
    title: 'Surat Keterangan Hilang',
    description: 'Laporan resmi untuk dokumen atau barang yang hilang',
  },
  {
    slug: 'surat-penghasilan',
    title: 'Surat Keterangan Penghasilan',
    description: 'Surat yang menyatakan penghasilan seseorang',
  },
  {
    slug: 'surat-tidak-punya-rumah',
    title: 'Surat Keterangan Tidak Memiliki Rumah',
    description: 'Surat untuk pengajuan bantuan rumah atau properti',
  },
  {
    slug: 'surat-usaha',
    title: 'Surat Keterangan Usaha',
    description: 'Surat yang menyatakan kegiatan usaha seseorang',
  },
];

export default function PermohonanPage() {
  useRequireAuth();

  return (
    <SimpleLayout useSidebar>
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Permohonan Surat</h1>
        <p className="text-lg text-gray-600">Pilih jenis surat yang ingin Anda ajukan.</p>
      </div>

      {/* Surat Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {SURAT_TYPES.map(surat => (
          <Link
            key={surat.slug}
            href={`/permohonan/${surat.slug}`}
            className="group"
          >
            <Card className="h-full hover:shadow-lg">
              <CardBody className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition">
                  {surat.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{surat.description}</p>
                <div className="flex items-center gap-2 text-blue-900 font-medium group-hover:gap-3 transition">
                  <span>Ajukan</span>
                  <FiArrowRight className="w-4 h-4" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader title="Panduan Pengajuan Surat" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Langkah-Langkah</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Pilih jenis surat yang Anda butuhkan</li>
                <li>2. Isi formulir dengan data yang lengkap dan benar</li>
                <li>3. Upload dokumen pendukung jika diperlukan</li>
                <li>4. Klik tombol Submit untuk mengirimkan permohonan</li>
                <li>5. Pantau status di menu &ldquo;Lacak Surat&rdquo;</li>
              </ol>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Estimasi Waktu</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Surat Domisili: 1-2 hari kerja</li>
                <li>• Surat Tidak Mampu: 2-3 hari kerja</li>
                <li>• Surat Keterangan: 1-2 hari kerja</li>
                <li>• Akta Kelahiran: 3-5 hari kerja</li>
                <li className="text-xs text-gray-600 pt-2">*Waktu dapat berubah sesuai kelengkapan dokumen</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </SimpleLayout>
  );
}
