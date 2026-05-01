"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiSearch } from "react-icons/fi";
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

function getReferenceId(item: SuratKeluarItem): number {
  if (
    item.source_type === "permohonan"
    && item.source_permohonan_id
    && Number(item.source_permohonan_id) > 0
  ) {
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

export default function KepalaDesaSuratKeluarPage() {
  const [data, setData] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/surat-keluar", { credentials: "include" });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat keluar");
        }

        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredData = data.filter((item) => {
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

    return searchMatch && dayFromMatch && dayToMatch && monthMatch && yearMatch;
  });

  const hasFilter = Boolean(normalizedSearchTerm || selectedMonth || selectedYear || selectedDayFrom || selectedDayTo);

  const filterDescription = useMemo(() => {
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const parts: string[] = [];
    if (selectedDayFrom && selectedDayTo) {
      parts.push(`tanggal ${selectedDayFrom}\u2013${selectedDayTo}`);
    } else if (selectedDayFrom) {
      parts.push(`tanggal ${selectedDayFrom}`);
    } else if (selectedDayTo) {
      parts.push(`tanggal s/d ${selectedDayTo}`);
    }
    if (selectedMonth) parts.push(months[Number(selectedMonth) - 1] || selectedMonth);
    if (selectedYear) parts.push(`tahun ${selectedYear}`);
    return parts.length > 0 ? parts.join(' ') : 'semua waktu';
  }, [selectedYear, selectedMonth, selectedDayFrom, selectedDayTo]);

  const handleExportExcel = () => {
    const exportRows = filteredData.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Kirim": formatDate(item.tanggal_surat),
      Tujuan: item.tujuan,
      Perihal: item.perihal,
      Status: item.status,
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT KELUAR"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${filteredData.length}`],
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
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nomor surat, tujuan, atau perihal"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedDayFrom}
              onChange={(event) => setSelectedDayFrom(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanggal Dari</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>{day}</option>
              ))}
            </select>
            <select
              value={selectedDayTo}
              onChange={(event) => setSelectedDayTo(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanggal Sampai</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>{day}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Bulan</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </div>

      <p className="mb-2 text-sm text-gray-600">
        <span className="font-medium">Jumlah data dari {filterDescription} = {filteredData.length} data</span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data surat keluar...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : filteredData.length === 0 ? (
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
                <th className="w-52 px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item, index) => {
                const refId = getReferenceId(item);

                return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.nomor_surat}</td>
                  <td className="px-4 py-3">{formatDate(item.tanggal_surat)}</td>
                  <td className="px-4 py-3">{item.tujuan}</td>
                  <td className="px-4 py-3">{item.perihal}</td>
                  <td className="px-4 py-3">
                    <span className={`status-chip ${
                      item.status === "Terkirim"
                        ? "status-chip-success"
                        : item.status === "Menunggu"
                          ? "status-chip-warning"
                          : "status-chip-neutral"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    {item.file_path ? (
                      <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                        <Link
                          href={`/kepala-desa/surat-keluar/${refId}`}
                          className="aksi-btn aksi-btn-view"
                        >
                          Lihat File
                        </Link>
                        <a
                          href={item.file_path}
                          download={getStoredFileName(item.file_path)}
                          className="aksi-btn aksi-btn-download"
                        >
                          <FiDownload className="mr-1 h-4 w-4" />
                          Unduh
                        </a>
                      </div>
                    ) : (
                      <span className="aksi-btn-muted">
                        Tidak ada file
                      </span>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
