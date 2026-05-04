"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiCalendar, FiDownload, FiEye, FiInfo, FiRefreshCw, FiRotateCcw } from "react-icons/fi";

type SuratKeluarStatus = "Draft" | "Menunggu" | "Terkirim";

interface SuratKeluarItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: SuratKeluarStatus;
  file_path: string | null;
  created_by_name?: string | null;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string): string {
  const parsed = parseDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStoredFileName(filePath?: string | null): string {
  if (!filePath) {
    return "-";
  }

  const trimmed = filePath.trim();
  if (!trimmed) {
    return "-";
  }

  const segments = trimmed.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : trimmed;
}

function getExportDateLabel(): string {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KepalaDesaLaporanSuratKeluarPage() {
  const [data, setData] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/surat-keluar", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data laporan surat keluar");
      }

      setData((result.data || []) as SuratKeluarItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchPool = [
        item.nomor_surat,
        item.tujuan,
        item.perihal,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm.trim() || searchPool.includes(searchTerm.trim().toLowerCase());

      const dateSource = parseDate(item.tanggal_surat);
      const itemDateValue = dateSource ? dateSource.toISOString().slice(0, 10) : "";
      const dayMin = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayFrom : selectedDayTo) : selectedDayFrom;
      const dayMax = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayTo : selectedDayFrom) : selectedDayTo;
      const matchesDayFrom = !dayMin || (itemDateValue !== "" && itemDateValue >= dayMin);
      const matchesDayTo = !dayMax || (itemDateValue !== "" && itemDateValue <= dayMax);

      return matchesSearch && matchesDayFrom && matchesDayTo;
    });
  }, [data, searchTerm, selectedDayFrom, selectedDayTo]);

  const sortedData = useMemo(() => {
    const rows = [...filteredData];

    rows.sort((a, b) => {
      const dateA = parseDate(a.tanggal_surat);
      const dateB = parseDate(b.tanggal_surat);

      const timeA = dateA?.getTime() ?? 0;
      const timeB = dateB?.getTime() ?? 0;
      return timeB - timeA;
    });

    return rows;
  }, [filteredData]);

  const formatIsoDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  };

  const hasDateFilter = Boolean(selectedDayFrom || selectedDayTo);
  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${sortedData.length} data`;
  }, [selectedDayFrom, selectedDayTo, sortedData.length]);

  const applyDateFilters = () => {
    if (draftDayFrom && draftDayTo && draftDayFrom > draftDayTo) {
      setSelectedDayFrom(draftDayTo);
      setSelectedDayTo(draftDayFrom);
      return;
    }

    setSelectedDayFrom(draftDayFrom);
    setSelectedDayTo(draftDayTo);
  };

  const resetDateFilters = () => {
    setDraftDayFrom("");
    setDraftDayTo("");
    setSelectedDayFrom("");
    setSelectedDayTo("");
  };

  const totalSuratKeluar = data.length;
  const totalFiltered = sortedData.length;
  const totalTerkirim = data.filter((item) => item.status === "Terkirim").length;

  const bulanIniCount = data.filter((item) => {
    const parsed = parseDate(item.tanggal_surat);
    if (!parsed) return false;
    const now = new Date();
    return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
  }).length;

  const handleExportExcel = () => {
    const exportRows = sortedData.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat || "-",
      "Tanggal Kirim": formatDate(item.tanggal_surat),
      Tujuan: item.tujuan || "-",
      Perihal: item.perihal || "-",
      Status: item.status || "-",
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${sortedData.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 38 },
      { wch: 14 },
      { wch: 38 },
      { wch: 14 },
    ];

    worksheet["!autofilter"] = {
      ref: `A5:H${Math.max(exportRows.length + 5, 5)}`,
    };

    worksheet["!rows"] = [
      { hpt: 24 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 8 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-keluar-${exportDate}.xlsx`);
  };

  return (
    <section>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor surat, tujuan, atau perihal..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyDateFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                Terapkan Filter
              </button>
              <button
                type="button"
                onClick={resetDateFilters}
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
              value={draftDayFrom}
              max={draftDayTo || undefined}
              onChange={setDraftDayFrom}
            />
            <PopupDatePicker
              label="Tanggal Sampai"
              value={draftDayTo}
              min={draftDayFrom || undefined}
              onChange={setDraftDayTo}
            />
          </div>
        </div>

        {hasDateFilter && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
            <FiInfo className="h-4 w-4 text-blue-700" />
            <span>{filterDescription.replace(`${sortedData.length} data`, "")}<strong>{sortedData.length}</strong> data</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="text-sm text-gray-600 inline-flex items-center gap-2">
          <FiCalendar className="text-gray-500" />
          Menampilkan {totalFiltered} dari {totalSuratKeluar} surat keluar
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm hover:bg-slate-200"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Surat Keluar</p>
          <p className="text-2xl font-bold text-blue-700">{totalSuratKeluar}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Terkirim</p>
          <p className="text-2xl font-bold text-green-700">{totalTerkirim}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Bulan Ini</p>
          <p className="text-2xl font-bold text-purple-700">{bulanIniCount}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data laporan surat keluar...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data yang sesuai filter.</div>
        ) : (
          <table className="w-full divide-y divide-gray-200 text-xs table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-10 px-4 py-3 text-left font-bold text-gray-700">No</th>
                <th className="w-32 px-4 py-3 text-left font-bold text-gray-700">Nomor Surat</th>
                <th className="w-32 px-4 py-3 text-left font-bold text-gray-700">Tanggal Surat</th>
                <th className="w-40 px-4 py-3 text-left font-bold text-gray-700 max-w-[150px]">Tujuan</th>
                <th className="min-w-[180px] px-4 py-3 text-left font-bold text-gray-700 max-w-[200px]">Perihal</th>
                <th className="w-24 px-4 py-3 text-left font-bold text-gray-700">Status</th>
                <th className="w-40 px-4 py-3 text-center font-bold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{item.nomor_surat || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.tanggal_surat)}</td>
                  <td className="px-4 py-3 max-w-[150px] truncate" title={item.tujuan || "-"}>{item.tujuan || "-"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate italic" title={item.perihal || "-"}>{item.perihal || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "Terkirim"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Menunggu"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {item.file_path ? (
                        <Link
                          href={`/kepala-desa/surat-keluar/${item.id}`}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          title="Lihat detail"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                      ) : (
                        <span className="text-gray-400 italic text-[10px]">-</span>
                      )}

                      {item.file_path && (
                        <a
                          href={item.file_path}
                          download={getStoredFileName(item.file_path)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                          title="Unduh file"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          Unduh
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
