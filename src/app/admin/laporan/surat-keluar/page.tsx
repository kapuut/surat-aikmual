"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiInfo, FiRotateCcw } from "react-icons/fi";

interface SuratKeluarApiItem {
  id?: number;
  nomor_surat?: string;
  tanggal_surat?: string;
  tujuan?: string;
  perihal?: string;
  created_by_name?: string | null;
  source_type?: "manual" | "permohonan";
}

interface SuratKeluarReportItem {
  noRegistrasi: string;
  noSurat: string;
  tanggalSurat: string;
  pengirim: string;
  perihal: string;
  penerima: string;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

function parseValidDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toIsoDate(value: string | null | undefined): string {
  const parsed = parseValidDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
}

function formatDate(value: string): string {
  const parsed = parseValidDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatIsoDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
}

function buildRegistrasiCode(prefix: string, idValue: number, dateValue: string): string {
  const year = parseValidDate(dateValue)?.getFullYear() || new Date().getFullYear();
  return `${prefix}-${String(idValue).padStart(3, "0")}/${year}`;
}

export default function LaporanSuratKeluarPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTanggalDari, setFilterTanggalDari] = useState("");
  const [filterTanggalSampai, setFilterTanggalSampai] = useState("");
  const [draftTanggalDari, setDraftTanggalDari] = useState("");
  const [draftTanggalSampai, setDraftTanggalSampai] = useState("");
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarReportItem[]>([]);

  useEffect(() => {
    const fetchSuratKeluar = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/surat-keluar", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat keluar");
        }

        const rows = Array.isArray(result?.data) ? (result.data as SuratKeluarApiItem[]) : [];
        const mapped = rows.map((item, index) => {
          const parsedId = Number(item.id);
          const idValue = Number.isFinite(parsedId) && parsedId !== 0 ? Math.abs(parsedId) : index + 1;
          const tanggalIso = toIsoDate(item.tanggal_surat);
          const registrasiPrefix = item.source_type === "permohonan" ? "REG-PRM" : "REG-OUT";

          return {
            noRegistrasi: buildRegistrasiCode(registrasiPrefix, idValue, tanggalIso),
            noSurat: String(item.nomor_surat || "-").trim() || "-",
            tanggalSurat: tanggalIso,
            pengirim: String(item.created_by_name || (item.source_type === "permohonan" ? "Permohonan Masyarakat" : "Admin/Operator Desa") || "-").trim() || "-",
            perihal: String(item.perihal || "-").trim() || "-",
            penerima: String(item.tujuan || "-").trim() || "-",
          };
        });

        setSuratKeluar(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat laporan");
      } finally {
        setLoading(false);
      }
    };

    fetchSuratKeluar();
  }, []);

  const filteredData = suratKeluar.filter((surat) => {
    const matchSearch = searchTerm === "" || 
      surat.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.noRegistrasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.penerima.toLowerCase().includes(searchTerm.toLowerCase());

    const tanggalSurat = parseValidDate(surat.tanggalSurat);
    const tanggalSuratValue = tanggalSurat ? tanggalSurat.toISOString().slice(0, 10) : "";
    const dayMin = filterTanggalDari && filterTanggalSampai ? (filterTanggalDari <= filterTanggalSampai ? filterTanggalDari : filterTanggalSampai) : filterTanggalDari;
    const dayMax = filterTanggalDari && filterTanggalSampai ? (filterTanggalDari <= filterTanggalSampai ? filterTanggalSampai : filterTanggalDari) : filterTanggalSampai;
    const matchDayFrom = !dayMin || (tanggalSuratValue !== "" && tanggalSuratValue >= dayMin);
    const matchDayTo = !dayMax || (tanggalSuratValue !== "" && tanggalSuratValue <= dayMax);

    return matchSearch && matchDayFrom && matchDayTo;
  });

  const filterDescription = useMemo(() => {
    if (!filterTanggalDari && !filterTanggalSampai) return "";
    const start = filterTanggalDari || filterTanggalSampai;
    const end = filterTanggalSampai || filterTanggalDari;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredData.length} data`;
  }, [filterTanggalDari, filterTanggalSampai, filteredData.length]);

  const hasDateFilter = Boolean(filterTanggalDari || filterTanggalSampai);

  const isFilterActive =
    searchTerm !== "" ||
    filterTanggalDari !== "" ||
    filterTanggalSampai !== "";

  const applyDateFilters = () => {
    if (draftTanggalDari && draftTanggalSampai && draftTanggalDari > draftTanggalSampai) {
      setFilterTanggalDari(draftTanggalSampai);
      setFilterTanggalSampai(draftTanggalDari);
      return;
    }

    setFilterTanggalDari(draftTanggalDari);
    setFilterTanggalSampai(draftTanggalSampai);
  };

  const resetDateFilters = () => {
    setDraftTanggalDari("");
    setDraftTanggalSampai("");
    setFilterTanggalDari("");
    setFilterTanggalSampai("");
  };

  const monthlyChartData = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);

    for (const item of filteredData) {
      const date = parseValidDate(item.tanggalSurat);
      if (!date) continue;
      counts[date.getMonth()] += 1;
    }

    const maxValue = Math.max(...counts, 1);
    return MONTH_LABELS.map((label, index) => {
      const value = counts[index];
      const percent = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;
      return {
        label,
        value,
        width: `${percent}%`,
      };
    });
  }, [filteredData]);

  const handleExportExcel = () => {
    const exportRows = filteredData.map((surat, index) => ({
      No: index + 1,
      "No. Registrasi": surat.noRegistrasi,
      "No. Surat": surat.noSurat,
      "Tanggal Surat": formatDate(surat.tanggalSurat),
      Pengirim: surat.pengirim,
      Perihal: surat.perihal,
      Penerima: surat.penerima,
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`],
      [`Total Data: ${filteredData.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 38 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-keluar-${exportDate}.xlsx`);
  };

  return (
    <section>
        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surat Keluar</p>
              <p className="text-2xl font-bold text-red-600">{suratKeluar.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Bulan Ini</p>
              <p className="text-2xl font-bold text-purple-600">
                {suratKeluar.filter((s) => {
                  const currentDate = new Date();
                  const suratDate = parseValidDate(s.tanggalSurat);
                  if (!suratDate) return false;
                  return suratDate.getMonth() === currentDate.getMonth() && suratDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800">Grafik Surat Keluar per Bulan</h3>
          <p className="mt-1 text-xs text-gray-500">Mengikuti data yang sedang difilter.</p>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[36px_1fr_28px] items-center gap-2">
              <span></span><span></span>
              <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</span>
            </div>
            {monthlyChartData.map((item) => (
              <div key={item.label} className="grid grid-cols-[36px_1fr_28px] items-center gap-2">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: item.width }}
                  />
                </div>
                <span className="text-right text-xs font-medium text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Cari berdasarkan nomor surat, pengirim, perihal, atau penerima..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-label="Pencarian"
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyDateFilters}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Terapkan Filter
              </button>
              <button
                type="button"
                onClick={resetDateFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PopupDatePicker
              label="Tanggal Dari"
              value={draftTanggalDari}
              max={draftTanggalSampai || undefined}
              onChange={setDraftTanggalDari}
            />

            <PopupDatePicker
              label="Tanggal Sampai"
              value={draftTanggalSampai}
              min={draftTanggalDari || undefined}
              onChange={setDraftTanggalSampai}
            />
          </div>
        </div>

        {hasDateFilter && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
            <FiInfo className="h-4 w-4 text-blue-700" />
            <span>{filterDescription.replace(`${filteredData.length} data`, "")}<strong>{filteredData.length}</strong> data</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end mb-6">
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
          >
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Registrasi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Penerima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((surat, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-red-600">{surat.noRegistrasi}</td>
                    <td className="px-4 py-3">{surat.noSurat}</td>
                    <td className="px-4 py-3">{formatDate(surat.tanggalSurat)}</td>
                    <td className="px-4 py-3">{surat.pengirim}</td>
                    <td className="px-4 py-3">{surat.perihal}</td>
                    <td className="px-4 py-3">{surat.penerima}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>
  );
}