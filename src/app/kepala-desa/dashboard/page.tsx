"use client";

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/types';
import { useRequireRole, useSharedStats } from '@/lib/hooks';
import { 
  FiSend, 
  FiFileText, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiActivity,
  FiArrowRight,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';

export default function HeadVillageDashboardPage() {
  // Ensure only kepala_desa users can access this page
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['kepala_desa']);

  // All hooks must be called unconditionally, before any early returns
  const [user, setUser] = useState<AuthUser | null>(null);
  const { stats, loading: statsLoading } = useSharedStats();

  const pendingApproval = stats?.permohonan.menunggu_tanda_tangan ?? stats?.permohonan.pending ?? 0;
  const pendingSignature = 5; // Placeholder

  // Dummy data for pending approvals
  const [pendingApprovals] = useState([
    { id: 'P-001/2025', jenisSurat: 'Surat Keterangan Tidak Mampu', pemohon: 'Budi Santoso', tanggal: '2025-01-10', priority: 'high' },
    { id: 'P-002/2025', jenisSurat: 'Surat Keterangan Domisili', pemohon: 'Ani Wijaya', tanggal: '2025-01-09', priority: 'normal' },
    { id: 'P-003/2025', jenisSurat: 'Surat Pengantar KTP', pemohon: 'Citra Dewi', tanggal: '2025-01-08', priority: 'normal' }
  ]);

  // Dummy data for recent approvals
  const [recentApprovals] = useState([
    { id: 'P-098/2024', jenisSurat: 'Surat Keterangan Usaha', pemohon: 'Dedi Hartono', tglDisetujui: '2025-01-09', status: 'Disetujui' },
    { id: 'P-099/2024', jenisSurat: 'Surat Keterangan Domisili', pemohon: 'Eka Putri', tglDisetujui: '2025-01-08', status: 'Disetujui' },
    { id: 'P-100/2024', jenisSurat: 'Surat Pengantar Nikah', pemohon: 'Fajar Ramadhan', tglDisetujui: '2025-01-07', status: 'Disetujui' }
  ]);

  useEffect(() => {
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

  if (loading || !isAuthenticated || !authorizedUser || statsLoading || !user) {
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
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-7">
      {pendingApproval > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-orange-100 p-2 text-orange-600">
                <FiAlertCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Ada {pendingApproval} permohonan yang menunggu persetujuan Anda.
                </p>
                <p className="text-sm text-orange-700">Silakan tinjau agar layanan warga tetap cepat.</p>
              </div>
            </div>
            <a
              href="/kepala-desa/approval"
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            >
              Tinjau Sekarang
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Menunggu Persetujuan</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pendingApproval}</p>
              <div className="flex items-center text-sm text-orange-600">
                <FiClock className="w-4 h-4 mr-1" />
                <span>Perlu tindakan</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Telah Disetujui</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.permohonan.disetujui ?? 0}</p>
              <div className="flex items-center text-sm text-green-600">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Perlu Tanda Tangan</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pendingSignature}</p>
              <div className="flex items-center text-sm text-blue-600">
                <FiFileText className="w-4 h-4 mr-1" />
                <span>Siap ditandatangani</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Surat</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{(stats?.suratMasuk.bulanIni ?? 0) + (stats?.suratKeluar.bulanIni ?? 0)}</p>
              <div className="flex items-center text-sm text-purple-600">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiSend className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiClock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Menunggu Persetujuan</h3>
                </div>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {pendingApprovals.length} item
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{item.id}</p>
                          {item.priority === 'high' && (
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              Priority
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{item.jenisSurat}</p>
                        <p className="text-xs text-gray-500 mt-1">Pemohon: {item.pemohon}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-500">{item.tanggal}</span>
                        <div className="mt-1">
                          <button className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors">
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a href="/kepala-desa/approval" className="text-orange-600 text-sm hover:underline inline-flex items-center gap-1">
                  Lihat semua permohonan
                  <FiArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Persetujuan Terbaru</h3>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  {recentApprovals.length} item
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentApprovals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.id}</p>
                        <p className="text-sm text-gray-700">{item.jenisSurat}</p>
                        <p className="text-xs text-gray-500 mt-1">Pemohon: {item.pemohon}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-500">Disetujui: {item.tglDisetujui}</span>
                        <div className="mt-1">
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a href="/kepala-desa/laporan" className="text-green-600 text-sm hover:underline inline-flex items-center gap-1">
                  Lihat laporan lengkap
                  <FiArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiFileText className="h-5 w-5 text-blue-600" /> Tindakan Cepat
            </h2>
            <p className="mt-1 text-sm text-gray-500">Akses menu utama kepala desa untuk menindaklanjuti layanan.</p>
            <div className="mt-4 space-y-3">
              <a
                href="/kepala-desa/approval"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="mt-1 rounded-lg bg-blue-600/10 p-2 text-blue-600">
                  <FiClock className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">Review permohonan</p>
                  <p className="text-xs text-gray-500">Periksa berkas warga yang menunggu persetujuan.</p>
                </div>
              </a>
              <a
                href="/kepala-desa/penandatanganan"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="mt-1 rounded-lg bg-emerald-600/10 p-2 text-emerald-600">
                  <FiCheckCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600">Tanda tangani surat</p>
                  <p className="text-xs text-gray-500">Selesaikan dokumen yang siap diterbitkan.</p>
                </div>
              </a>
              <a
                href="/kepala-desa/laporan/grafik"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-purple-200 hover:bg-purple-50"
              >
                <span className="mt-1 rounded-lg bg-purple-600/10 p-2 text-purple-600">
                  <FiActivity className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-600">Pantau laporan</p>
                  <p className="text-xs text-gray-500">Lihat ringkasan performa layanan surat desa.</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiActivity className="h-5 w-5 text-slate-600" /> Ringkasan Aktivitas
              </h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                Hari ini
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Status kerja utama untuk menjaga SLA pelayanan warga.</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Permohonan pending</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{pendingApproval}</p>
                <p className="text-xs text-gray-500">Perlu approval kepala desa.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Surat perlu tanda tangan</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{pendingSignature}</p>
                <p className="text-xs text-gray-500">Siap ditandatangani hari ini.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total surat bulan ini</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{(stats?.suratMasuk.bulanIni ?? 0) + (stats?.suratKeluar.bulanIni ?? 0)}</p>
                <p className="text-xs text-gray-500">Gabungan surat masuk dan keluar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}