"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequireRole } from "@/lib/hooks";
import { useSharedStats, type DashboardStats } from "@/lib/hooks";
import { AdminStats } from "@/components/dashboard/SharedStats";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiSend,
  FiTrendingUp,
} from "react-icons/fi";

const BAR_COLOR_PALETTE = [
  "#2563eb", // blue
  "#0891b2", // cyan
  "#7c3aed", // violet
  "#16a34a", // green
  "#f59e0b", // amber
  "#e11d48", // rose
  "#0ea5e9", // sky
  "#9333ea", // purple
  "#14b8a6", // teal
  "#ea580c", // orange
];

export default function AdminDashboardPage() {
  // Ensure only admin users can access this page
  const { user: authorizedUser, loading, isAuthenticated } = useRequireRole(['admin']);
  const { stats, loading: statsLoading, error: statsError, refresh } = useSharedStats();
  const now = useMemo(() => new Date(), []);
  const [chartYear, setChartYear] = useState<string>(String(now.getFullYear()));
  const [chartMonth, setChartMonth] = useState<string>("");
  const [chartSort, setChartSort] = useState<"asc" | "desc">("desc");
  const [chartData, setChartData] = useState<Array<{ jenis_surat: string; jumlah: number }>>([]);
  const [chartYears, setChartYears] = useState<number[]>([now.getFullYear()]);
  const [chartTotalSurat, setChartTotalSurat] = useState<number>(0);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const pendingCount = stats?.permohonan.pending ?? 0;
  const approvedCount = stats?.permohonan.disetujui ?? 0;
  const draftSuratKeluar = stats?.suratKeluar.draft ?? 0;
  const unreadSuratMasuk = stats?.suratMasuk.belumDibaca ?? 0;

  const staffHighlights = useMemo(
    () => [
      {
        role: "Sekretaris Desa",
        description:
          "Mengelola surat masuk dan keluar serta memverifikasi permohonan warga sebelum diajukan ke kepala desa.",
        accent: "text-blue-600",
        background: "bg-blue-50",
        icon: FiInbox,
        metrics: [
          {
            label: "Surat masuk bulan ini",
            value: stats?.suratMasuk.bulanIni ?? 0,
          },
          {
            label: "Surat keluar bulan ini",
            value: stats?.suratKeluar.bulanIni ?? 0,
          },
          {
            label: "Permohonan menunggu verifikasi",
            value: pendingCount,
          },
        ],
      },
      {
        role: "Kepala Desa",
        description:
          "Mereview dan menyetujui permohonan yang sudah diverifikasi serta memantau laporan layanan warga.",
        accent: "text-emerald-600",
        background: "bg-emerald-50",
        icon: FiCheckCircle,
        metrics: [
          {
            label: "Menunggu tanda tangan",
            value: pendingCount,
          },
          {
            label: "Surat disetujui bulan ini",
            value: approvedCount,
          },
          {
            label: "Surat keluar draft",
            value: draftSuratKeluar,
          },
        ],
      },
    ],
    [stats, pendingCount, approvedCount, draftSuratKeluar]
  );

  const oversightAlerts = useMemo(
    () => [
      {
        label: "Surat masuk belum dibaca",
        value: unreadSuratMasuk,
        description: "Segera distribusikan ke sekretaris untuk ditindaklanjuti.",
        tone: "info" as const,
      },
      {
        label: "Permohonan menunggu verifikasi",
        value: pendingCount,
        description: "Pastikan sekretaris telah melengkapi berkas sebelum dikirim ke kepala desa.",
        tone: "warning" as const,
      },
      {
        label: "Surat keluar masih draft",
        value: draftSuratKeluar,
        description: "Koordinasikan finalisasi sebelum surat disebarkan.",
        tone: "neutral" as const,
      },
    ],
    [draftSuratKeluar, pendingCount, unreadSuratMasuk]
  );

  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map((item) => item.jumlah), 1);
  }, [chartData]);

  const chartAxisMax = useMemo(() => Math.max(1, maxChartValue), [maxChartValue]);

  const chartTicks = useMemo(() => {
    if (chartAxisMax <= 8) {
      return Array.from({ length: chartAxisMax + 1 }, (_, idx) => idx);
    }

    const divisions = 4;
    const ticks = Array.from({ length: divisions + 1 }, (_, idx) => {
      const value = Math.round((idx / divisions) * chartAxisMax);
      return value;
    });

    ticks[ticks.length - 1] = chartAxisMax;
    return Array.from(new Set(ticks));
  }, [chartAxisMax]);

  const fetchJenisSuratChart = async () => {
    try {
      setChartLoading(true);
      setChartError(null);

      const params = new URLSearchParams();
      params.set("year", chartYear);
      if (chartMonth) params.set("month", chartMonth);
      params.set("sort", chartSort);

      const response = await fetch(`/api/stats/surat-jenis?${params.toString()}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat diagram jenis surat");
      }

      setChartData(Array.isArray(result.data) ? result.data : []);
      setChartYears(Array.isArray(result.availableYears) && result.availableYears.length > 0 ? result.availableYears : [now.getFullYear()]);
      setChartTotalSurat(Number(result?.summary?.totalSurat || 0));
    } catch (error) {
      setChartError(error instanceof Error ? error.message : "Gagal memuat diagram jenis surat");
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

  if (loading || !isAuthenticated || !authorizedUser) {
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
          
          <div className="space-y-4">
            {statsError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                Gagal memuat statistik terkini. <button onClick={refresh} className="underline font-semibold">Muat ulang</button>
              </div>
            )}
            {statsLoading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                ))}
              </div>
            )}
            {!statsLoading && stats && <AdminStats stats={stats as DashboardStats} />}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiTrendingUp className="h-5 w-5 text-indigo-600" /> Diagram Batang Jenis Surat
                </h2>
                <p className="text-sm text-gray-500">Distribusi jenis surat permohonan dengan filter bulan dan tahun.</p>
              </div>
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
                  onChange={(e) => setChartSort(e.target.value === "asc" ? "asc" : "desc")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Jumlah Terbanyak</option>
                  <option value="asc">Jumlah Tersedikit</option>
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
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Perbandingan Jumlah Surat per Jenis</p>
                    <div className="text-xs text-gray-500">Skala otomatis (maksimum: {chartAxisMax})</div>
                  </div>

                  <div className="overflow-x-auto">
                    <div
                      className="grid min-w-[780px] gap-3"
                      style={{ gridTemplateColumns: `52px repeat(${chartData.length}, minmax(76px, 1fr))` }}
                    >
                      <div className="relative h-72 border-r border-gray-300">
                        {chartTicks.map((tick) => {
                          const bottomPercent = (tick / chartAxisMax) * 100;
                          return (
                            <div
                              key={`tick-${tick}`}
                              className="absolute left-0 right-0"
                              style={{ bottom: `${bottomPercent}%`, transform: 'translateY(50%)' }}
                            >
                              <span className="-translate-y-1/2 block pr-2 text-right text-[11px] font-medium text-gray-500">
                                {tick}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {chartData.map((item, index) => {
                        const barHeightPercent = (item.jumlah / chartAxisMax) * 100;
                        const barColor = BAR_COLOR_PALETTE[index % BAR_COLOR_PALETTE.length];

                        return (
                          <div key={item.jenis_surat} className="flex flex-col items-center gap-2">
                            <div className="relative h-72 w-full rounded-lg border border-gray-200 bg-white">
                              {chartTicks.map((tick) => {
                                const bottomPercent = (tick / chartAxisMax) * 100;
                                return (
                                  <div
                                    key={`${item.jenis_surat}-grid-${tick}`}
                                    className="absolute left-0 right-0 border-t border-dashed border-gray-200"
                                    style={{ bottom: `${bottomPercent}%` }}
                                  />
                                );
                              })}

                              <div className="absolute inset-0 flex items-end justify-center px-2 pb-2 pt-2">
                                <div
                                  className="relative w-11 rounded-t-md shadow-sm transition-all duration-500"
                                  style={{
                                    height: `${barHeightPercent}%`,
                                    minHeight: item.jumlah > 0 ? '12px' : '0px',
                                  }}
                                >
                                  <div
                                    className="h-full w-full rounded-t-md"
                                    style={{
                                      background: `linear-gradient(to top, ${barColor} 0%, ${barColor} 70%, rgba(255,255,255,0.35) 100%)`,
                                      border: `1px solid ${barColor}`,
                                      boxShadow: `0 6px 14px rgba(0,0,0,0.12)`,
                                    }}
                                  />
                                  <span
                                    className="absolute -top-6 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                    style={{ backgroundColor: barColor }}
                                  >
                                    {item.jumlah}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p
                              className="w-full max-w-[90px] truncate text-center text-xs font-medium text-gray-700"
                              title={item.jenis_surat}
                            >
                              {item.jenis_surat}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 text-orange-500" /> Pengawasan Real-time
            </h2>
            <p className="mt-1 text-sm text-gray-500">Prioritas tindakan agar alur surat tetap terkoordinasi.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {oversightAlerts.map((alert) => (
                <div
                  key={alert.label}
                  className={`rounded-2xl border p-4 ${
                    alert.tone === "warning"
                      ? "border-orange-200 bg-orange-50"
                      : alert.tone === "info"
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{alert.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{alert.value}</p>
                  <p className="mt-1 text-xs text-gray-600">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSend className="h-5 w-5 text-blue-600" /> Ringkasan Kinerja Peran
            </h2>
            <p className="mt-1 text-sm text-gray-500">Ikhtisar tugas dan progres setiap peran dalam sistem.</p>
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {staffHighlights.map((highlight) => {
                const Icon = highlight.icon;
                return (
                  <div key={highlight.role} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-xl ${highlight.background} p-3 text-2xl text-gray-700`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className={`text-sm font-semibold uppercase tracking-wide ${highlight.accent}`}>{highlight.role}</p>
                        <p className="text-xs text-gray-500">Aktif dalam koordinasi harian</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">{highlight.description}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {highlight.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                          <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                          <p className="text-xs text-gray-500">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
    </div>
  );
}