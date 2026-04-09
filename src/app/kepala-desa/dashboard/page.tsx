"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AuthUser } from '@/lib/types';
import { useRequireRole, useSharedStats } from '@/lib/hooks';
import { 
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInbox,
  FiSend, 
  FiTrendingUp
} from 'react-icons/fi';

type ChartGroupBy = 'tanggal' | 'bulan' | 'tahun';
type ChartSortDirection = 'desc' | 'asc';

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

function monthLabel(monthNumber: string): string {
  const month = Number(monthNumber);
  if (month === 1) return 'Jan';
  if (month === 2) return 'Feb';
  if (month === 3) return 'Mar';
  if (month === 4) return 'Apr';
  if (month === 5) return 'Mei';
  if (month === 6) return 'Jun';
  if (month === 7) return 'Jul';
  if (month === 8) return 'Agu';
  if (month === 9) return 'Sep';
  if (month === 10) return 'Okt';
  if (month === 11) return 'Nov';
  return 'Des';
}

export default function HeadVillageDashboardPage() {
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['kepala_desa']);
  const { stats, loading: statsLoading } = useSharedStats();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [suratMasukRows, setSuratMasukRows] = useState<SuratMasukDateRow[]>([]);
  const [suratKeluarRows, setSuratKeluarRows] = useState<SuratKeluarDateRow[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartGroupBy, setChartGroupBy] = useState<ChartGroupBy>('bulan');
  const [chartSortDirection, setChartSortDirection] = useState<ChartSortDirection>('desc');

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
        setChartLoading(true);

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
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, []);

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

  const chartData = useMemo(() => {
    const bucketMap = new Map<string, number>();

    const addDateToBucket = (dateValue?: string) => {
      const date = parseDate(dateValue);
      if (!date) return;

      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const key =
        chartGroupBy === 'tanggal'
          ? `${year}-${month}-${day}`
          : chartGroupBy === 'bulan'
            ? `${year}-${month}`
            : year;

      bucketMap.set(key, (bucketMap.get(key) || 0) + 1);
    };

    suratMasukRows.forEach((item) => addDateToBucket(item.tanggal_terima || item.tanggal_surat));
    suratKeluarRows.forEach((item) => addDateToBucket(item.tanggal_surat));

    const rows = Array.from(bucketMap.entries()).map(([key, count]) => ({ key, count }));
    rows.sort((a, b) => (chartSortDirection === 'asc' ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)));

    const limitedRows = chartGroupBy === 'tanggal' ? rows.slice(0, 20) : rows;

    return limitedRows.map((item) => {
      if (chartGroupBy === 'tahun') {
        return { label: item.key, count: item.count };
      }

      if (chartGroupBy === 'bulan') {
        const [year, month] = item.key.split('-');
        return { label: `${monthLabel(month)} ${year.slice(2)}`, count: item.count };
      }

      const [year, month, day] = item.key.split('-');
      return { label: `${day}/${month}/${year.slice(2)}`, count: item.count };
    });
  }, [suratMasukRows, suratKeluarRows, chartGroupBy, chartSortDirection]);

  const maxChartValue = Math.max(1, ...chartData.map((item) => item.count));

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
            <FiBarChart2 className="text-indigo-600" /> Diagram Batang Aktivitas Surat
          </h3>
          <div className="flex gap-2 flex-wrap">
            <select
              value={chartGroupBy}
              onChange={(e) => setChartGroupBy(e.target.value as ChartGroupBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="tanggal">Grouping: Tanggal</option>
              <option value="bulan">Grouping: Bulan</option>
              <option value="tahun">Grouping: Tahun</option>
            </select>
            <select
              value={chartSortDirection}
              onChange={(e) => setChartSortDirection(e.target.value as ChartSortDirection)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="desc">Urut: Terbaru</option>
              <option value="asc">Urut: Terlama</option>
            </select>
          </div>
        </div>

        {chartLoading ? (
          <p className="text-sm text-gray-500">Memuat data diagram...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-500">Data diagram belum tersedia.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px] h-64 flex items-end gap-3">
              {chartData.map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">{item.count}</span>
                  <div className="w-full rounded-md bg-indigo-100 h-44 flex items-end">
                    <div
                      className="w-full rounded-md bg-indigo-500 transition-all"
                      style={{ height: `${(item.count / maxChartValue) * 100}%` }}
                      title={`${item.label}: ${item.count}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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