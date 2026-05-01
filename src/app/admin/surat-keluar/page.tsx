"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";

interface SuratKeluarItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
  file_path: string | null;
  source_type?: "manual" | "permohonan";
  source_permohonan_id?: number | null;
}

function resolveSourceType(item: SuratKeluarItem): "manual" | "permohonan" {
  if (item.source_permohonan_id && Number(item.source_permohonan_id) > 0) {
    return "permohonan";
  }

  if (item.source_type === "permohonan") {
    return "permohonan";
  }

  return "manual";
}

function normalizeSourceFilter(value: string): "semua" | "manual" | "permohonan" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "manual") return "manual";
  if (normalized === "permohonan") return "permohonan";
  return "semua";
}

function getReferenceId(item: SuratKeluarItem): number {
  if (resolveSourceType(item) === "permohonan" && item.source_permohonan_id && Number(item.source_permohonan_id) > 0) {
    return -Math.abs(Number(item.source_permohonan_id));
  }

  return item.id;
}


const MONTH_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
] as const;

const MONTH_LABELS = MONTH_OPTIONS.reduce<Record<string, string>>((acc, month) => {
  acc[month.value] = month.label;
  return acc;
}, {});

function buildYearOptions() {
  const startYear = 2016;
  const currentYear = new Date().getFullYear();
  const endYear = Math.max(currentYear, startYear);

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => String(endYear - index));
}

function parseValidDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getExportDateLabel() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStoredFileName(filePath?: string | null) {
  if (!filePath) {
    return "-";
  }

  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

export default function SuratKeluarPage() {
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState<"semua" | "manual" | "permohonan">("semua");

  const yearOptions = buildYearOptions();

  const availableDays = useMemo(() => {
    if (selectedMonth === "") {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const month = Number(selectedMonth);
    const fallbackYear = new Date().getFullYear();
    const year = selectedYear === "" ? fallbackYear : Number(selectedYear);

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDayFrom !== "") {
      const selectedDayFromNumber = Number(selectedDayFrom);
      if (!availableDays.includes(selectedDayFromNumber)) {
        setSelectedDayFrom("");
      }
    }

    if (selectedDayTo !== "") {
      const selectedDayToNumber = Number(selectedDayTo);
      if (!availableDays.includes(selectedDayToNumber)) {
        setSelectedDayTo("");
      }
    }
  }, [availableDays, selectedDayFrom, selectedDayTo]);

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("source", normalizeSourceFilter(selectedSourceType));
      const response = await fetch(`/api/surat-keluar?${params.toString()}`, { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data surat keluar");
      }

      setSuratKeluar(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuratKeluar();
  }, [selectedSourceType]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDelete = async (item: SuratKeluarItem) => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus data surat keluar ini?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      const targetId = getReferenceId(item);
      const params = new URLSearchParams();
      if (resolveSourceType(item) === "permohonan") {
        params.set("source", "permohonan");
        if (item.source_permohonan_id && item.source_permohonan_id > 0) {
          params.set("permohonanId", String(item.source_permohonan_id));
        }
      }

      const response = await fetch(`/api/surat-keluar/${targetId}${params.toString() ? `?${params.toString()}` : ""}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal menghapus data surat keluar");
      }

      await fetchSuratKeluar();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data");
    } finally {
      setDeletingId(null);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredSuratKeluar = suratKeluar.filter((item) => {
    const searchMatch = !normalizedSearchTerm || [item.nomor_surat, item.tujuan, item.perihal]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm));

    const tanggalSurat = parseValidDate(item.tanggal_surat);
    const day = tanggalSurat?.getDate() ?? null;
    const parsedDayFrom = selectedDayFrom === "" ? null : Number(selectedDayFrom);
    const parsedDayTo = selectedDayTo === "" ? null : Number(selectedDayTo);
    const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
    const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;
    const dayFromMatch = dayMin === null || (day !== null && day >= dayMin);
    const dayToMatch = dayMax === null || (day !== null && day <= dayMax);
    const monthMatch = !selectedMonth || (!!tanggalSurat && String(tanggalSurat.getMonth() + 1) === selectedMonth);
    const yearMatch = !selectedYear || (!!tanggalSurat && String(tanggalSurat.getFullYear()) === selectedYear);
    const sourceType = resolveSourceType(item);
    const sourceFilter = normalizeSourceFilter(selectedSourceType);
    const sourceMatch = sourceFilter === "semua" || sourceType === sourceFilter;

    return searchMatch && dayFromMatch && dayToMatch && monthMatch && yearMatch && sourceMatch;
  });

  const hasFilter = Boolean(normalizedSearchTerm || selectedMonth || selectedYear || selectedDayFrom || selectedDayTo || selectedSourceType !== "semua");

  const filterSummaryText = useMemo(() => {
    const monthLabel = selectedMonth ? (MONTH_LABELS[selectedMonth] || `Bulan ${selectedMonth}`) : "semua bulan";
    const yearLabel = selectedYear || "semua tahun";

    let dayLabel = "semua tanggal";
    if (selectedDayFrom && selectedDayTo) {
      const from = Number(selectedDayFrom);
      const to = Number(selectedDayTo);
      const min = Number.isFinite(from) && Number.isFinite(to) ? Math.min(from, to) : selectedDayFrom;
      const max = Number.isFinite(from) && Number.isFinite(to) ? Math.max(from, to) : selectedDayTo;
      dayLabel = `tanggal ${min} sampai ${max}`;
    } else if (selectedDayFrom) {
      dayLabel = `tanggal mulai ${selectedDayFrom}`;
    } else if (selectedDayTo) {
      dayLabel = `tanggal sampai ${selectedDayTo}`;
    }

    const sourceLabel =
      selectedSourceType === "manual"
        ? "input manual"
        : selectedSourceType === "permohonan"
        ? "dari permohonan"
        : "semua sumber";

    const parts: string[] = [];
    if (selectedDayFrom && selectedDayTo) {
      parts.push(`tanggal ${Math.min(Number(selectedDayFrom), Number(selectedDayTo))}\u2013${Math.max(Number(selectedDayFrom), Number(selectedDayTo))}`);
    } else if (selectedDayFrom) {
      parts.push(`tanggal ${selectedDayFrom}`);
    } else if (selectedDayTo) {
      parts.push(`tanggal s/d ${selectedDayTo}`);
    }
    if (selectedMonth) parts.push(monthLabel);
    if (selectedYear) parts.push(`tahun ${selectedYear}`);
    if (selectedSourceType !== "" && selectedSourceType !== "semua") parts.push(sourceLabel);
    const desc = parts.length > 0 ? parts.join(' ') : 'semua waktu';
    return `Jumlah data dari ${desc} = ${filteredSuratKeluar.length} data`;
  }, [filteredSuratKeluar.length, selectedDayFrom, selectedDayTo, selectedMonth, selectedSourceType, selectedYear]);

  const handleExportExcel = () => {
    const exportRows = filteredSuratKeluar.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Kirim": formatDate(item.tanggal_surat),
      Tujuan: item.tujuan,
      Perihal: item.perihal,
      Status: item.status,
      Sumber: resolveSourceType(item) === "permohonan" ? "Dari Permohonan" : "Input Manual",
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${filteredSuratKeluar.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 38 },
      { wch: 14 },
      { wch: 18 },
      { wch: 38 },
      { wch: 14 },
    ];

    worksheet["!autofilter"] = {
      ref: `A5:I${Math.max(exportRows.length + 5, 5)}`,
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
        {/* Toolbar */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-[1160px] items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
            <div className="relative w-[270px]">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nomor surat, tujuan, atau perihal"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDayFrom}
                onChange={(event) => setSelectedDayFrom(event.target.value)}
                className="h-10 w-[126px] rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tanggal Dari</option>
                {availableDays.map((day) => (
                  <option key={day} value={String(day)}>{day}</option>
                ))}
              </select>
              <select
                value={selectedDayTo}
                onChange={(event) => setSelectedDayTo(event.target.value)}
                className="h-10 w-[126px] rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tanggal Sampai</option>
                {availableDays.map((day) => (
                  <option key={day} value={String(day)}>{day}</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-10 w-[116px] rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Bulan</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-10 w-[104px] rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Tahun</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedSourceType}
                onChange={(event) => setSelectedSourceType(normalizeSourceFilter(event.target.value))}
                className="h-10 w-[148px] rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semua">Semua Sumber</option>
                <option value="manual">Input Manual</option>
                <option value="permohonan">Dari Permohonan</option>
              </select>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Export
            </button>
            <Link
              href="/admin/surat-keluar/tambah"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Data Surat Keluar
            </Link>
          </div>
        </div>
        </div>

        {hasFilter && (
          <p className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-base font-bold text-blue-900">
            {filterSummaryText}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data surat keluar...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredSuratKeluar.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {hasFilter ? "Data surat keluar tidak ditemukan" : "Belum ada data surat keluar."}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Kirim</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Sumber</th>
                  <th className="w-72 px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuratKeluar.map((s, i) => {
                  const sourceType = resolveSourceType(s);
                  const sourceFilter = normalizeSourceFilter(selectedSourceType);
                  if (sourceFilter !== "semua" && sourceType !== sourceFilter) {
                    return null;
                  }

                  return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.nomor_surat}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_surat)}</td>
                    <td className="px-4 py-3">{s.tujuan}</td>
                    <td className="px-4 py-3">{s.perihal}</td>
                    <td className="px-4 py-3">
                      <span className={`status-chip ${
                        s.status === "Terkirim"
                          ? "status-chip-success"
                          : s.status === "Menunggu"
                            ? "status-chip-warning"
                            : "status-chip-neutral"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {resolveSourceType(s) === "permohonan" ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Dari Permohonan
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Input Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                        {(() => {
                          const refId = getReferenceId(s);
                          return (
                            <>
                        {s.file_path ? (
                          <a
                            href={`/admin/surat-keluar/${refId}/preview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aksi-btn aksi-btn-view"
                          >
                            Lihat File
                          </a>
                        ) : (
                          <span className="aksi-btn-muted">
                            Tidak ada file
                          </span>
                        )}

                        <Link
                          href={`/admin/surat-keluar/${refId}`}
                          className="aksi-btn aksi-btn-edit"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          className="aksi-btn aksi-btn-delete"
                        >
                          {deletingId === s.id ? "Menghapus..." : "Hapus"}
                        </button>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
  );
}
