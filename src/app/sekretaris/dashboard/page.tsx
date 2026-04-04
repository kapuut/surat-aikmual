"use client";

import { useEffect, useState } from 'react';
import { AuthUser } from '@/lib/types';
import { useRequireRole, useSharedStats } from '@/lib/hooks';
import {
  FiInbox,
  FiSend,
  FiFileText,
  FiActivity,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

export default function SecretaryDashboardPage() {
  // Ensure only sekretaris users can access this page
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['sekretaris']);

  // All hooks must be called unconditionally, before any early returns
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
    { nomor: 'SM-003/2025', pengirim: 'BPS Kabupaten', perihal: 'Sensus Penduduk', tanggal: '2025-01-08' },
  ]);

  const [recentSuratKeluar] = useState([
    { nomor: 'SK-001/2025', penerima: 'Seluruh RT/RW', perihal: 'Pemberitahuan Gotong Royong', tanggal: '2025-01-10', status: 'Dikirim' },
    { nomor: 'SK-002/2025', penerima: 'Kecamatan', perihal: 'Laporan Bulanan', tanggal: '2025-01-09', status: 'Dikirim' },
    { nomor: 'SK-003/2025', penerima: 'Dinas Sosial', perihal: 'Data Penerima Bantuan', tanggal: '2025-01-08', status: 'Draft' },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include',
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

  if (loading || !isAuthenticated || !authorizedUser || !user) {
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
      {permohonanPending > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-orange-100 p-2 text-orange-600">
                <FiAlertCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Ada {permohonanPending} permohonan warga yang perlu diverifikasi.
                </p>
                <p className="text-sm text-orange-700">Segera proses agar alur persetujuan tetap lancar.</p>
              </div>
            </div>
            <a
              href="/sekretaris/permohonan"
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            >
              Proses Permohonan
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiInbox className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Surat Masuk Terbaru</h3>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {recentSuratMasuk.length} item
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSuratMasuk.map((surat, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{surat.nomor}</p>
                        <p className="text-sm text-gray-700">{surat.perihal}</p>
                        <p className="text-xs text-gray-500 mt-1">Dari: {surat.pengirim}</p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{surat.tanggal}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a href="/sekretaris/surat-masuk" className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1">
                  Lihat semua surat masuk
                  <FiArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiSend className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Surat Keluar Terbaru</h3>
                </div>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {recentSuratKeluar.length} item
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSuratKeluar.map((surat, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{surat.nomor}</p>
                        <p className="text-sm text-gray-700">{surat.perihal}</p>
                        <p className="text-xs text-gray-500 mt-1">Kepada: {surat.penerima}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-500">{surat.tanggal}</span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              surat.status === 'Dikirim'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {surat.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a href="/sekretaris/surat-keluar" className="text-red-600 text-sm hover:underline inline-flex items-center gap-1">
                  Lihat semua surat keluar
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
            <p className="mt-1 text-sm text-gray-500">Akses menu operasional utama sekretaris desa.</p>
            <div className="mt-4 space-y-3">
              <a
                href="/sekretaris/permohonan"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="mt-1 rounded-lg bg-blue-600/10 p-2 text-blue-600">
                  <FiClock className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">Proses permohonan</p>
                  <p className="text-xs text-gray-500">Verifikasi berkas warga sebelum dikirim ke kepala desa.</p>
                </div>
              </a>
              <a
                href="/sekretaris/surat-masuk"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span className="mt-1 rounded-lg bg-indigo-600/10 p-2 text-indigo-600">
                  <FiInbox className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">Kelola surat masuk</p>
                  <p className="text-xs text-gray-500">Distribusikan surat masuk sesuai prioritas layanan.</p>
                </div>
              </a>
              <a
                href="/sekretaris/template-surat"
                className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span className="mt-1 rounded-lg bg-emerald-600/10 p-2 text-emerald-600">
                  <FiCheckCircle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600">Perbarui template</p>
                  <p className="text-xs text-gray-500">Pastikan format surat sesuai standar administrasi.</p>
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
            <p className="mt-1 text-sm text-gray-500">Indikator kerja utama untuk memantau operasional harian.</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Surat masuk bulan ini</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{suratMasukBulanIni}</p>
                <p className="text-xs text-gray-500">Arsip surat masuk aktif.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Permohonan pending</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{permohonanPending}</p>
                <p className="text-xs text-gray-500">Butuh verifikasi sekretaris.</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Petugas aktif</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{petugasAktif}</p>
                <p className="text-xs text-gray-500">Admin, sekretaris, dan kepala desa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
