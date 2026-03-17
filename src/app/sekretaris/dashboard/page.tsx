"use client";

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/types';
import { useSharedStats } from '@/components/dashboard/SharedStats';
import { 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiActivity,
  FiCalendar,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';

export default function SecretaryDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { stats } = useSharedStats();

  const suratMasukBulanIni = stats?.suratMasuk.bulanIni ?? 0;
  const suratKeluarBulanIni = stats?.suratKeluar.bulanIni ?? 0;
  const permohonanPending = stats?.permohonan.pending ?? 0;
  const petugasAktif =
    (stats?.users.admin ?? 0) +
    (stats?.users.sekretaris ?? 0) +
    (stats?.users.kepala_desa ?? 0);

  const [recentSuratMasuk] = useState([
    { nomor: 'SM-001/2025', pengirim: 'Kecamatan Sukabumi', perihal: 'Undangan Rapat Koordinasi', tanggal: '2025-01-10' },
    { nomor: 'SM-002/2025', pengirim: 'Dinas Kesehatan', perihal: 'Program Posyandu', tanggal: '2025-01-09' },
    { nomor: 'SM-003/2025', pengirim: 'BPS Kabupaten', perihal: 'Sensus Penduduk', tanggal: '2025-01-08' }
  ]);

  const [recentSuratKeluar] = useState([
    { nomor: 'SK-001/2025', penerima: 'Seluruh RT/RW', perihal: 'Pemberitahuan Gotong Royong', tanggal: '2025-01-10', status: 'Dikirim' },
    { nomor: 'SK-002/2025', penerima: 'Kecamatan', perihal: 'Laporan Bulanan', tanggal: '2025-01-09', status: 'Dikirim' },
    { nomor: 'SK-003/2025', peneriba: 'Dinas Sosial', perihal: 'Data Penerima Bantuan', tanggal: '2025-01-08', status: 'Draft' }
  ]);

  useEffect(() => {
    // Get user data from API or local storage
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Sekretaris</h1>
                <p className="text-gray-600 mt-1">Selamat datang, {user.nama}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FiCalendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Surat Masuk */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Surat Masuk</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{suratMasukBulanIni}</p>
                  <div className="flex items-center text-sm text-blue-600">
                    <FiTrendingUp className="w-4 h-4 mr-1" />
                    <span>Bulan ini</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiInbox className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Surat Keluar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Surat Keluar</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{suratKeluarBulanIni}</p>
                  <div className="flex items-center text-sm text-red-600">
                    <FiTrendingUp className="w-4 h-4 mr-1" />
                    <span>Bulan ini</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FiSend className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Permohonan Pending */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Permohonan Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{permohonanPending}</p>
                  <div className="flex items-center text-sm text-orange-600">
                    <FiActivity className="w-4 h-4 mr-1" />
                    <span>Perlu diproses</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Template Surat */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Petugas Aktif</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{petugasAktif}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <FiUsers className="w-4 h-4 mr-1" />
                    <span>Admin & Tim Lapangan</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Surat Masuk */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <FiInbox className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Surat Masuk Terbaru</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentSuratMasuk.map((surat, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{surat.nomor}</p>
                          <p className="text-sm text-gray-600">{surat.perihal}</p>
                          <p className="text-xs text-gray-500 mt-1">Dari: {surat.pengirim}</p>
                        </div>
                        <span className="text-xs text-gray-500">{surat.tanggal}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a href="/sekretaris/surat-masuk" className="text-blue-600 text-sm hover:underline flex items-center">
                    Lihat semua surat masuk
                    <FiArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Recent Surat Keluar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <FiSend className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Surat Keluar Terbaru</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentSuratKeluar.map((surat, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{surat.nomor}</p>
                          <p className="text-sm text-gray-600">{surat.perihal}</p>
                          <p className="text-xs text-gray-500 mt-1">Kepada: {surat.penerima}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">{surat.tanggal}</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              surat.status === 'Dikirim' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {surat.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a href="/sekretaris/surat-keluar" className="text-red-600 text-sm hover:underline flex items-center">
                    Lihat semua surat keluar
                    <FiArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}