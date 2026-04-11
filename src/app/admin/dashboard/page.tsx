"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequireRole } from "@/lib/hooks";
import { useSharedStats, type DashboardStats } from "@/lib/hooks";
import { AdminStats } from "@/components/dashboard/SharedStats";
import {
  FiActivity,
  FiAlertCircle,
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

  const chartAxisMax = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((item) => item.jumlah), 0);
  }, [chartData]);

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

    </div>
  );
}