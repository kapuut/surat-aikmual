// src/app/dashboard/page.tsx
import Link from 'next/link';
import { FiMail, FiSend, FiArchive, FiFileText, FiPlus, FiBarChart, FiEye } from 'react-icons/fi';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import DashboardLayout from '@/components/layout/dashboard-layout';

async function getStatistik() {
  const totalSurat = await db.query('SELECT COUNT(*) as count FROM surat');
  const suratMasuk = await db.query('SELECT COUNT(*) as count FROM surat WHERE jenis_surat = "masuk"');
  const suratKeluar = await db.query('SELECT COUNT(*) as count FROM surat WHERE jenis_surat = "keluar"');
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const suratBulanIni = await db.query(
    'SELECT COUNT(*) as count FROM surat WHERE created_at >= ?',
    [startOfMonth]
  );

  return { 
    totalSurat: (totalSurat as any)[0]?.count || 0, 
    suratMasuk: (suratMasuk as any)[0]?.count || 0, 
    suratKeluar: (suratKeluar as any)[0]?.count || 0, 
    suratBulanIni: (suratBulanIni as any)[0]?.count || 0 
  };
}

async function getSuratTerbaru(): Promise<any[]> {
  try {
    const [surat] = await db.query(
      `SELECT 
        id, 
        nomor_surat as nomorSurat, 
        perihal, 
        jenis_surat as jenisSurat, 
        tanggal_surat as tanggal,
        asal_surat as pengirim,
        tujuan_surat as penerima,
        kategori
      FROM surat 
      ORDER BY tanggal_surat DESC 
      LIMIT 5`
    );
    return Array.isArray(surat) ? surat : [];
  } catch (error) {
    console.error('Error getting surat terbaru:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const statistik = await getStatistik();
  const suratTerbaru = await getSuratTerbaru();

  return (
    <DashboardLayout title="Dashboard">
      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Surat</p>
              <p className="text-2xl font-bold text-gray-900">{statistik.totalSurat}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Surat Masuk</p>
              <p className="text-2xl font-bold text-gray-900">{statistik.suratMasuk}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiMail className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Surat Keluar</p>
              <p className="text-2xl font-bold text-gray-900">{statistik.suratKeluar}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiSend className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{statistik.suratBulanIni}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiArchive className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/surat/tambah"
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FiPlus className="text-2xl" />
            <div>
              <h3 className="font-semibold">Tambah Surat Baru</h3>
              <p className="text-blue-100 text-sm">Input surat masuk/keluar</p>
            </div>
          </div>
        </Link>

        <Link
          href="/surat"
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FiFileText className="text-2xl" />
            <div>
              <h3 className="font-semibold">Kelola Arsip</h3>
              <p className="text-green-100 text-sm">Lihat dan edit surat</p>
            </div>
          </div>
        </Link>

        <Link
          href="/laporan"
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FiBarChart className="text-2xl" />
            <div>
              <h3 className="font-semibold">Buat Laporan</h3>
              <p className="text-purple-100 text-sm">Export dan statistik</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Surat Terbaru</h3>
            <Link
              href="/surat"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
        <div className="p-6">
          {suratTerbaru.length > 0 ? (
            <div className="space-y-4">
              {suratTerbaru.map((surat) => (
                <div key={surat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      surat.jenisSurat === 'masuk' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {surat.jenisSurat === 'masuk' ? (
                        <FiMail className="text-lg text-green-600" />
                      ) : (
                        <FiSend className="text-lg text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{surat.perihal}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{surat.nomorSurat}</span>
                        <span>{surat.jenisSurat === 'masuk' ? surat.pengirim : surat.penerima}</span>
                        <span>{formatDate(surat.tanggal)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      surat.jenisSurat === 'masuk' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {surat.jenisSurat === 'masuk' ? 'Masuk' : 'Keluar'}
                    </span>
                    <Link
                      href={`/surat/detail/${surat.id}`}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Lihat Detail"
                    >
                      <FiEye />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiFileText className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-600">Belum ada surat yang diarsipkan</p>
              <Link
                href="/surat/tambah"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mt-2"
              >
                <FiPlus />
                <span>Tambah Surat Pertama</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}