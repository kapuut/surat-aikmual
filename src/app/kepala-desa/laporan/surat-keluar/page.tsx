"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { FiCalendar, FiDownload, FiRefreshCw } from "react-icons/fi";

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
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDayFrom, setFilterDayFrom] = useState("");
  const [filterDayTo, setFilterDayTo] = useState("");
  const [sortBy, setSortBy] = useState<
    "tanggal-desc" | "tanggal-asc" | "bulan-desc" | "bulan-asc" | "tahun-desc" | "tahun-asc"
  >("tanggal-desc");

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const values = new Set<number>([currentYear]);

    data.forEach((item) => {
      const parsed = parseDate(item.tanggal_surat);
      if (parsed) values.add(parsed.getFullYear());
    });

    return Array.from(values).sort((a, b) => b - a);
  }, [data]);

  const availableDays = useMemo(() => {
    if (filterMonth === "") {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const month = Number(filterMonth);
    const fallbackYear = new Date().getFullYear();
    const year = filterYear === "" ? fallbackYear : Number(filterYear);

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return Array.from({ length: 31 }, (_, index) => index + 1);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (filterDayFrom !== "") {
      const selectedDayFromNumber = Number(filterDayFrom);
      if (!availableDays.includes(selectedDayFromNumber)) {
        setFilterDayFrom("");
      }
    }

    if (filterDayTo !== "") {
      const selectedDayToNumber = Number(filterDayTo);
      if (!availableDays.includes(selectedDayToNumber)) {
        setFilterDayTo("");
      }
    }
  }, [availableDays, filterDayFrom, filterDayTo]);

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
      const day = dateSource ? dateSource.getDate() : null;
      const matchesMonth = !filterMonth || (dateSource ? dateSource.getMonth() + 1 === Number(filterMonth) : false);
      const matchesYear = !filterYear || (dateSource ? dateSource.getFullYear() === Number(filterYear) : false);
      const parsedDayFrom = filterDayFrom === "" ? null : Number(filterDayFrom);
      const parsedDayTo = filterDayTo === "" ? null : Number(filterDayTo);
      const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
      const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;
      const matchesDayFrom = dayMin === null || (day !== null && day >= dayMin);
      const matchesDayTo = dayMax === null || (day !== null && day <= dayMax);

      return matchesSearch && matchesDayFrom && matchesDayTo && matchesMonth && matchesYear;
    });
  }, [data, searchTerm, filterMonth, filterYear, filterDayFrom, filterDayTo]);

  const sortedData = useMemo(() => {
    const rows = [...filteredData];

    rows.sort((a, b) => {
      const dateA = parseDate(a.tanggal_surat);
      const dateB = parseDate(b.tanggal_surat);

      const timeA = dateA?.getTime() ?? 0;
      const timeB = dateB?.getTime() ?? 0;
      const monthA = dateA ? dateA.getMonth() + 1 : 0;
      const monthB = dateB ? dateB.getMonth() + 1 : 0;
      const yearA = dateA?.getFullYear() ?? 0;
      const yearB = dateB?.getFullYear() ?? 0;

      switch (sortBy) {
        case "tanggal-asc":
          return timeA - timeB;
        case "tanggal-desc":
          return timeB - timeA;
        case "bulan-asc":
          return monthA - monthB || yearA - yearB || timeA - timeB;
        case "bulan-desc":
          return monthB - monthA || yearB - yearA || timeB - timeA;
        case "tahun-asc":
          return yearA - yearB || monthA - monthB || timeA - timeB;
        case "tahun-desc":
          return yearB - yearA || monthB - monthA || timeB - timeA;
        default:
          return timeB - timeA;
      }
    });

    return rows;
  }, [filteredData, sortBy]);

  const totalSuratKeluar = data.length;
  const totalFiltered = sortedData.length;
  const totalTerkirim = data.filter((item) => item.status === "Terkirim").length;
  const totalMenunggu = data.filter((item) => item.status === "Menunggu" || item.status === "Draft").length;

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
      <p className="mb-3 text-sm text-gray-600">Ringkasan surat keluar berdasarkan filter periode dan pencarian.</p>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor surat, tujuan, atau perihal..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Dari</label>
            <select
              value={filterDayFrom}
              onChange={(e) => setFilterDayFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tanggal Dari</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Sampai</label>
            <select
              value={filterDayTo}
              onChange={(e) => setFilterDayTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tanggal Sampai</option>
              {availableDays.map((day) => (
                <option key={day} value={String(day)}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sorting</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="tanggal-desc">Tanggal Terbaru</option>
              <option value="tanggal-asc">Tanggal Terlama</option>
              <option value="bulan-desc">Bulan Terbesar ke Kecil</option>
              <option value="bulan-asc">Bulan Terkecil ke Besar</option>
              <option value="tahun-desc">Tahun Terbaru</option>
              <option value="tahun-asc">Tahun Terlama</option>
            </select>
          </div>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Surat Keluar</p>
          <p className="text-2xl font-bold text-blue-700">{totalSuratKeluar}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Data Ditampilkan</p>
          <p className="text-2xl font-bold text-emerald-700">{totalFiltered}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Terkirim</p>
          <p className="text-2xl font-bold text-green-700">{totalTerkirim}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Menunggu / Draft</p>
          <p className="text-2xl font-bold text-orange-700">{totalMenunggu}</p>
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
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.nomor_surat || "-"}</td>
                  <td className="px-4 py-3">{formatDate(item.tanggal_surat)}</td>
                  <td className="px-4 py-3">{item.tujuan || "-"}</td>
                  <td className="px-4 py-3">{item.perihal || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Terkirim"
                          ? "bg-green-100 text-green-800"
                          : item.status === "Menunggu"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.file_path ? (
                      <Link
                        href={`/kepala-desa/surat-keluar/${item.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Lihat File
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
