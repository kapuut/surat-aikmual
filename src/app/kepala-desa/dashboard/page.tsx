"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AuthUser } from '@/lib/types';
import { useRequireRole, useSharedStats } from '@/lib/hooks';
import { 
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInbox,
  FiSend, 
  FiTrendingUp
} from 'react-icons/fi';

const BAR_COLOR_PALETTE = [
  '#2563eb',
  '#0891b2',
  '#7c3aed',
  '#16a34a',
  '#f59e0b',
  '#e11d48',
  '#0ea5e9',
  '#9333ea',
  '#14b8a6',
  '#ea580c',
];

interface SuratMasukDateRow {
  tanggal_terima?: string;
  tanggal_surat?: string;
}

interface SuratKeluarDateRow {
  tanggal_surat?: string;
  status?: string;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function HeadVillageDashboardPage() {
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['kepala_desa']);
  const { stats, loading: statsLoading } = useSharedStats();
  const now = useMemo(() => new Date(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [suratMasukRows, setSuratMasukRows] = useState<SuratMasukDateRow[]>([]);
  const [suratKeluarRows, setSuratKeluarRows] = useState<SuratKeluarDateRow[]>([]);
  const [chartYear, setChartYear] = useState<string>(String(now.getFullYear()));
  const [chartMonth, setChartMonth] = useState<string>('');
  const [chartSort, setChartSort] = useState<'asc' | 'desc' | 'date_desc' | 'date_asc'>('desc');
  const [chartData, setChartData] = useState<Array<{ jenis_surat: string; jumlah: number }>>([]);
  const [chartYears, setChartYears] = useState<number[]>([now.getFullYear()]);
  const [chartTotalSurat, setChartTotalSurat] = useState<number>(0);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const [masukResponse, keluarResponse] = await Promise.all([
          fetch('/api/admin/surat-masuk', { credentials: 'include' }),
          fetch('/api/surat-keluar', { credentials: 'include' }),
        ]);

        const masukResult = await masukResponse.json();
        const keluarResult = await keluarResponse.json();

        if (masukResponse.ok && masukResult?.success) {
          setSuratMasukRows((masukResult.data || []) as SuratMasukDateRow[]);
        }

        if (keluarResponse.ok && keluarResult?.success) {
          setSuratKeluarRows((keluarResult.data || []) as SuratKeluarDateRow[]);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchChartData();
  }, []);

  const fetchJenisSuratChart = async () => {
    try {
      setChartLoading(true);
      setChartError(null);

      const params = new URLSearchParams();
      params.set('year', chartYear);
      if (chartMonth) params.set('month', chartMonth);
      params.set('sort', chartSort);

      const response = await fetch(`/api/stats/surat-jenis?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Gagal memuat diagram jenis surat');
      }

      setChartData(Array.isArray(result.data) ? result.data : []);
      setChartYears(Array.isArray(result.availableYears) && result.availableYears.length > 0 ? result.availableYears : [now.getFullYear()]);
      setChartTotalSurat(Number(result?.summary?.totalSurat || 0));
    } catch (error) {
      setChartError(error instanceof Error ? error.message : 'Gagal memuat diagram jenis surat');
      setChartData([]);
      setChartTotalSurat(0);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (!authorizedUser) return;
    fetchJenisSuratChart();
  }, [authorizedUser, chartYear, chartMonth, chartSort]);

  const pendingApproval = stats?.permohonan.menunggu_tanda_tangan ?? stats?.permohonan.pending ?? 0;
  const totalApproved = stats?.permohonan.selesai_ditandatangani ?? stats?.permohonan.disetujui ?? 0;
  const totalSuratMasuk = stats?.suratMasuk.total ?? 0;
  const hasSuratKeluarRows = suratKeluarRows.length > 0;
  const suratKeluarBulanIniFromRows = suratKeluarRows.filter((item) => {
    const parsed = parseDate(item.tanggal_surat);
    if (!parsed) return false;
    const now = new Date();
    return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
  }).length;
  const totalSuratKeluar = hasSuratKeluarRows ? suratKeluarRows.length : (stats?.suratKeluar.total ?? 0);
  const totalDraftKeluar = hasSuratKeluarRows
    ? suratKeluarRows.filter((item) => String(item.status || '').trim().toLowerCase() === 'draft').length
    : (stats?.suratKeluar.draft ?? 0);
  const totalSuratKeluarBulanIni = hasSuratKeluarRows
    ? suratKeluarBulanIniFromRows
    : (stats?.suratKeluar.bulanIni ?? 0);
  const totalBulanIni = (stats?.suratMasuk.bulanIni ?? 0) + totalSuratKeluarBulanIni;
  const totalBelumDibacaMasuk = stats?.suratMasuk.belumDibaca ?? 0;

  const chartAxisMax = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((item) => item.jumlah), 0);
  }, [chartData]);

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
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Ringkasan Layanan Surat</p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Dashboard Kepala Desa</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Pantau performa surat masuk, surat keluar, dan permohonan warga dalam satu tampilan.
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg bg-blue-50 text-blue-700 px-3 py-2 text-sm font-medium">
            Pengguna aktif: {user?.nama || 'Kepala Desa'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
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

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Disetujui / Selesai</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalApproved}</p>
              <div className="flex items-center text-sm text-green-600">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                <span>Proses selesai</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Surat Masuk</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalSuratMasuk}</p>
              <div className="flex items-center text-sm text-blue-600">
                <FiInbox className="w-4 h-4 mr-1" />
                <span>Belum dibaca: {totalBelumDibacaMasuk}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiInbox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Surat Keluar</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalSuratKeluar}</p>
              <div className="flex items-center text-sm text-purple-600">
                <FiSend className="w-4 h-4 mr-1" />
                <span>Draft: {totalDraftKeluar}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiSend className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-end gap-3">
          <button
            onClick={fetchJenisSuratChart}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FiActivity className="h-4 w-4" />
            Segarkan Diagram
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Tahun</label>
            <select
              value={chartYear}
              onChange={(e) => setChartYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {chartYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Bulan</label>
            <select
              value={chartMonth}
              onChange={(e) => setChartMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Urutan</label>
            <select
              value={chartSort}
              onChange={(e) => setChartSort(e.target.value as 'asc' | 'desc' | 'date_desc' | 'date_asc')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Jumlah Terbanyak</option>
              <option value="asc">Jumlah Tersedikit</option>
              <option value="date_desc">Tanggal Terbaru</option>
              <option value="date_asc">Tanggal Terlama</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
            Total Surat: {chartTotalSurat}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            Total Jenis: {chartData.length}
          </span>
        </div>

        <div className="mt-5">
          {chartError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {chartError}
            </div>
          )}

          {chartLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )}

          {!chartLoading && !chartError && chartData.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Belum ada data jenis surat untuk filter yang dipilih.
            </div>
          )}

          {!chartLoading && !chartError && chartData.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Perbandingan Jumlah Surat per Jenis</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Jenis Surat</span>
                  <span>Skala 0 - {chartAxisMax}</span>
                </div>

                <div className="space-y-2.5">
                  {chartData.map((item, index) => {
                    const scaleBase = chartAxisMax > 0 ? chartAxisMax : 1;
                    const barWidthPercent = (item.jumlah / scaleBase) * 100;
                    const barColor = BAR_COLOR_PALETTE[index % BAR_COLOR_PALETTE.length];

                    return (
                      <div
                        key={item.jenis_surat}
                        className="grid items-center gap-3"
                        style={{ gridTemplateColumns: 'minmax(130px, 220px) minmax(220px, 1fr) 34px' }}
                      >
                        <p className="truncate text-xs sm:text-sm font-medium text-gray-700" title={item.jenis_surat}>
                          {item.jenis_surat}
                        </p>

                        <div className="h-8 rounded-lg border border-gray-200 bg-gray-50 p-1">
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            title={`Jumlah: ${item.jumlah} (${item.jenis_surat})`}
                            style={{
                              width: `${barWidthPercent}%`,
                              background: `linear-gradient(to right, ${barColor} 0%, ${barColor} 70%, rgba(255,255,255,0.35) 100%)`,
                              border: `1px solid ${barColor}`,
                              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                            }}
                          />
                        </div>

                        <span className="text-right text-xs font-semibold text-gray-700">{item.jumlah}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiInbox className="w-5 h-5 text-blue-600" /> Surat Masuk
            </h3>
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
              Ringkasan
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuratMasuk}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.suratMasuk.bulanIni ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Belum Dibaca</p>
              <p className="text-2xl font-bold text-gray-900">{totalBelumDibacaMasuk}</p>
            </div>
          </div>
          <Link
            href="/kepala-desa/laporan/surat-masuk"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Buka Surat Masuk
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSend className="w-5 h-5 text-purple-600" /> Surat Keluar
            </h3>
            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
              Ringkasan
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuratKeluar}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuratKeluarBulanIni}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{totalDraftKeluar}</p>
            </div>
          </div>
          <Link
            href="/kepala-desa/laporan/surat-keluar"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            Buka Surat Keluar
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-orange-600" /> Tindak Lanjut Permohonan
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Saat ini ada {pendingApproval} permohonan menunggu persetujuan. Total surat bulan ini: {totalBulanIni}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/kepala-desa/approval"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700"
            >
              Review Approval
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/kepala-desa/permohonan"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-200"
            >
              Lihat Permohonan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}