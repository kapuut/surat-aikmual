"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiEye, FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file_path?: string;
  created_by_name?: string;
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

function getStoredFileName(filePath?: string) {
  if (!filePath) {
    return "-";
  }

  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

export default function SekretarisSuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasukItem[]>([]);
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
    const fetchSuratMasuk = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/surat-masuk", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat masuk");
        }

        setSuratMasuk(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchSuratMasuk();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  const filteredSuratMasuk = suratMasuk.filter((item) => {
    const searchMatch = !normalizedSearchTerm || [item.nomor_surat, item.asal_surat, item.perihal, item.created_by_name]
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

  const isFilterActive =
    searchTerm !== "" ||
    selectedDayFrom !== "" ||
    selectedDayTo !== "" ||
    selectedMonth !== "" ||
    selectedYear !== "";



  const handleExportExcel = () => {
    const exportRows = filteredSuratMasuk.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Surat": formatDate(item.tanggal_surat),
      "Tanggal Terima": formatDate(item.tanggal_terima),
      "Asal Surat": item.asal_surat,
      Perihal: item.perihal,
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT MASUK"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${filteredSuratMasuk.length}`],
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
      { wch: 18 },
      { wch: 28 },
      { wch: 32 },
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Masuk");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-masuk-${exportDate}.xlsx`);
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
              placeholder="Cari nomor surat, asal surat, atau perihal"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedDayFrom}
              onChange={(event) => setSelectedDayFrom(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanggal Dari</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>{day}</option>
              ))}
            </select>
            <select
              value={selectedDayTo}
              onChange={(event) => setSelectedDayTo(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tanggal Sampai</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>{day}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Bulan</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {isFilterActive && (
        <div className="mb-4">
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 border border-indigo-100">
            Jumlah data dari {filterDescription} = {filteredSuratMasuk.length} data
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Memuat data...</p>
          </div>
        ) : filteredSuratMasuk.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>{hasFilter ? "Data surat masuk tidak ditemukan" : "Belum ada data surat masuk"}</p>
          </div>
        ) : (
          <table className="w-full text-xs sm:text-sm table-auto border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left font-bold text-gray-700 w-10">No</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-36">Nomor Surat</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Tgl Surat</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Tgl Terima</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[150px]">Asal Surat</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[200px]">Perihal</th>
                <th className="px-2 py-3 text-center font-bold text-gray-700 w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuratMasuk.map((surat, index) => (
                <tr key={surat.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-2 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 break-words">{surat.nomor_surat}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(surat.tanggal_surat)}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(surat.tanggal_terima)}</td>
                  <td className="px-3 py-3 text-gray-700 max-w-[150px] truncate" title={surat.asal_surat}>{surat.asal_surat}</td>
                  <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate" title={surat.perihal}>{surat.perihal}</td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      {surat.file_path ? (
                        <>
                          <Link
                            href={`/sekretaris/surat-masuk/${surat.id}/preview`}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            Lihat
                          </Link>
                          <a
                            href={surat.file_path}
                            download={getStoredFileName(surat.file_path)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Unduh
                          </a>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          Tidak ada file
                        </span>
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
