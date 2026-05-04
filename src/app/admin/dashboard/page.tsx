"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequireRole } from "@/lib/hooks";
import { useSharedStats, type DashboardStats } from "@/lib/hooks";
import { AdminStats } from "@/components/dashboard/SharedStats";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import {
  FiActivity,
  FiAlertCircle,
  FiInfo,
  FiRotateCcw,
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
  const [chartDateFrom, setChartDateFrom] = useState<string>("");
  const [chartDateTo, setChartDateTo] = useState<string>("");
  const [chartData, setChartData] = useState<Array<{ jenis_surat: string; jumlah: number }>>([]);
  const [chartTotalSurat, setChartTotalSurat] = useState<number>(0);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const pendingCount = stats?.permohonan.pending ?? 0;
  const menungguTandaTanganCount = stats?.permohonan.menunggu_tanda_tangan ?? 0;
  const selesaiDitandatanganiCount = stats?.permohonan.selesai_ditandatangani ?? 0;

  const oversightAlerts = useMemo(
    () => [
      {
        label: "Permohonan baru menunggu verifikasi",
        value: pendingCount,
        description: "Prioritaskan validasi berkas agar antrean layanan tidak menumpuk.",
        tone: "info" as const,
      },
      {
        label: "Permohonan menunggu tanda tangan",
        value: menungguTandaTanganCount,
        description: "Koordinasikan dengan kepala desa agar proses legalisasi tidak tertunda.",
        tone: "warning" as const,
      },
      {
        label: "Permohonan selesai ditandatangani",
        value: selesaiDitandatanganiCount,
        description: "Data ini menunjukkan output layanan yang siap diarsipkan atau diserahkan.",
        tone: "neutral" as const,
      },
    ],
    [pendingCount, menungguTandaTanganCount, selesaiDitandatanganiCount]
  );

  const chartAxisMax = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((item) => item.jumlah), 0);
  }, [chartData]);

  const formatIsoDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  };

  const chartFilterSummary = useMemo(() => {
    if (!chartDateFrom && !chartDateTo) return "";

    const start = chartDateFrom || chartDateTo;
    const end = chartDateTo || chartDateFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${chartTotalSurat} data`;
  }, [chartDateFrom, chartDateTo, chartTotalSurat]);

  const hasChartFilter =
    chartDateFrom !== '' ||
    chartDateTo !== '';

  const fetchJenisSuratChart = async (overrides?: Partial<{
    dateFrom: string;
    dateTo: string;
  }>) => {
    const dateFrom = overrides?.dateFrom ?? chartDateFrom;
    const dateTo = overrides?.dateTo ?? chartDateTo;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setChartError("Tanggal Dari tidak boleh lebih besar dari Tanggal Sampai.");
      return;
    }

    try {
      setChartLoading(true);
      setChartError(null);

      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      params.set("sort", "date_desc");

      const response = await fetch(`/api/stats/surat-jenis?${params.toString()}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat diagram jenis surat");
      }

      setChartData(Array.isArray(result.data) ? result.data : []);
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
  }, [authorizedUser]);

  const applyFilters = () => {
    fetchJenisSuratChart();
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateFrom: "",
      dateTo: "",
    };

    setChartDateFrom(defaultFilters.dateFrom);
    setChartDateTo(defaultFilters.dateTo);
    fetchJenisSuratChart(defaultFilters);
  };

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
                  <span>
                    Jumlah data dari tanggal {formatIsoDate(chartDateFrom || chartDateTo)} sampai {formatIsoDate(chartDateTo || chartDateFrom)} = <strong>{chartTotalSurat}</strong> data
                  </span>
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