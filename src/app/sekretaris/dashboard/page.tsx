"use client";

import { useEffect, useMemo, useState } from 'react';
import { AuthUser } from '@/lib/types';
import { useRequireRole, useSharedStats } from '@/lib/hooks';
import PopupDatePicker from '@/components/shared/PopupDatePicker';
import {
  FiInbox,
  FiSend,
  FiFileText,
  FiActivity,
  FiArrowRight,
  FiClock,
  FiInfo,
  FiRotateCcw,
  FiTrendingUp,
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

export default function SecretaryDashboardPage() {
  // Ensure only sekretaris users can access this page
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['sekretaris']);

  // All hooks must be called unconditionally, before any early returns
  const [user, setUser] = useState<AuthUser | null>(null);
  const { stats } = useSharedStats();
  const [chartDateFrom, setChartDateFrom] = useState<string>('');
  const [chartDateTo, setChartDateTo] = useState<string>('');
  const [chartData, setChartData] = useState<Array<{ jenis_surat: string; jumlah: number }>>([]);
  const [chartTotalSurat, setChartTotalSurat] = useState<number>(0);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const suratMasukBulanIni = stats?.suratMasuk.bulanIni ?? 0;
  const suratKeluarBulanIni = stats?.suratKeluar.bulanIni ?? 0;
  const [disposisiMasuk, setDisposisiMasuk] = useState<number>(0);

  const [recentSuratMasuk, setRecentSuratMasuk] = useState<{ nomor_surat: string; asal_surat: string; perihal: string; tanggal_terima: string }[]>([]);
  const [recentSuratKeluar, setRecentSuratKeluar] = useState<{ nomor_surat: string; tujuan: string; perihal: string; tanggal: string; tanggal_surat: string; status: string }[]>([]);

  const chartAxisMax = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((item) => item.jumlah), 0);
  }, [chartData]);

  const fetchJenisSuratChart = async (overrides?: Partial<{
    dateFrom: string;
    dateTo: string;
  }>) => {
    const dateFrom = overrides?.dateFrom ?? chartDateFrom;
    const dateTo = overrides?.dateTo ?? chartDateTo;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setChartError('Tanggal Dari tidak boleh lebih besar dari Tanggal Sampai.');
      return;
    }

    try {
      setChartLoading(true);
      setChartError(null);

      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      params.set('sort', 'date_desc');

      const response = await fetch(`/api/stats/surat-jenis?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Gagal memuat diagram jenis surat');
      }

      setChartData(Array.isArray(result.data) ? result.data : []);
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

  useEffect(() => {
    const fetchRecentSurat = async () => {
      try {
        const [resMasuk, resKeluar] = await Promise.all([
          fetch('/api/surat-masuk', { credentials: 'include' }),
          fetch('/api/surat-keluar', { credentials: 'include' }),
        ]);
        if (resMasuk.ok) {
          const data = await resMasuk.json();
          const rows = Array.isArray(data) ? data : (data?.data ?? []);
          setRecentSuratMasuk(rows.slice(0, 3));
        }
        if (resKeluar.ok) {
          const data = await resKeluar.json();
          const rows = Array.isArray(data) ? data : (data?.data ?? []);
          setRecentSuratKeluar(rows.slice(0, 3));
        }
      } catch {
        // ignore
      }
    };
    fetchRecentSurat();
  }, []);

  useEffect(() => {
    const fetchDisposisi = async () => {
      try {
        const response = await fetch('/api/sekretaris/disposisi-surat-masuk', { credentials: 'include' });
        const result = await response.json();
        if (result?.success && Array.isArray(result.data)) {
          setDisposisiMasuk(result.data.length);
        }
      } catch {
        // ignore
      }
    };
    fetchDisposisi();
  }, []);

  useEffect(() => {
    if (!authorizedUser) return;
    fetchJenisSuratChart();
  }, [authorizedUser]);

  const applyFilters = () => {
    fetchJenisSuratChart();
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateFrom: '',
      dateTo: '',
    };

    setChartDateFrom(defaultFilters.dateFrom);
    setChartDateTo(defaultFilters.dateTo);
    fetchJenisSuratChart(defaultFilters);
  };

  const filterDescription = useMemo(() => {
    if (!chartDateFrom && !chartDateTo) return '';
    const formatIsoDate = (value: string) => {
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-');
    };
    const start = chartDateFrom || chartDateTo;
    const end = chartDateTo || chartDateFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${chartTotalSurat} data`;
  }, [chartDateFrom, chartDateTo, chartTotalSurat]);

  const hasChartFilter =
    chartDateFrom !== '' ||
    chartDateTo !== '';

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
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
        {/* Box Statistik */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Surat Masuk</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{suratMasukBulanIni}</p>
              <div className="flex items-center text-xs text-blue-600">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiInbox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Surat Keluar</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{suratKeluarBulanIni}</p>
              <div className="flex items-center text-xs text-red-600">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <FiSend className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Disposisi Masuk</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{disposisiMasuk}</p>
              <div className="flex items-center text-xs text-orange-600">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Total disposisi</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-8">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={applyFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <FiActivity className="h-3.5 w-3.5" />
                Terapkan Filter
              </button>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PopupDatePicker
              label="Tanggal Dari"
              value={chartDateFrom}
              max={chartDateTo || undefined}
              onChange={setChartDateFrom}
            />
            <PopupDatePicker
              label="Tanggal Sampai"
              value={chartDateTo}
              min={chartDateFrom || undefined}
              onChange={setChartDateTo}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {hasChartFilter && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
              <FiInfo className="h-4 w-4 text-blue-700" />
              <span>{filterDescription}</span>
            </div>
          )}
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
                <p className="text-base font-semibold text-gray-800">Grafik Surat</p>
                <p className="text-xs text-gray-500 mt-1">Perbandingan Jumlah Surat per Jenis</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Jenis Surat</span>
                  <span>Total</span>
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
                              boxShadow: `0 4px 10px rgba(0,0,0,0.08)`,
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

      {/* Konten utama: grid 2 kolom di layar besar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Surat Masuk Terbaru */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiInbox className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Surat Masuk Terbaru</h3>
              </div>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                {recentSuratMasuk.length} item
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSuratMasuk.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada surat masuk</p>
              ) : (
                recentSuratMasuk.map((surat, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{surat.nomor_surat}</p>
                        <p className="text-sm text-gray-700">{surat.perihal}</p>
                        <p className="text-xs text-gray-500 mt-1">Dari: {surat.asal_surat}</p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{surat.tanggal_terima ? new Date(surat.tanggal_terima).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="/sekretaris/surat-masuk" className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1">
                Lihat semua surat masuk
                <FiArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Surat Keluar Terbaru */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiSend className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Surat Keluar Terbaru</h3>
              </div>
              <span className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                {recentSuratKeluar.length} item
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSuratKeluar.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada surat keluar</p>
              ) : (
                recentSuratKeluar.map((surat, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{surat.nomor_surat}</p>
                        <p className="text-sm text-gray-700">{surat.perihal}</p>
                        <p className="text-xs text-gray-500 mt-1">Kepada: {surat.tujuan}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-500">{(surat.tanggal || surat.tanggal_surat) ? new Date(surat.tanggal || surat.tanggal_surat).toLocaleDateString('id-ID') : '-'}</span>
                        <div className="mt-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                              surat.status === 'dikirim' || surat.status === 'Dikirim'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}
                          >
                            {surat.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
    </div>
  );
}
