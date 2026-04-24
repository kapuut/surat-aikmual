"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import * as XLSX from "xlsx";

type AlertType = "success" | "error";

interface SuratMasuk {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  urgensi?: "rendah" | "sedang" | "tinggi" | string;
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

function getUrgensiLabel(rawValue: unknown): "Rendah" | "Sedang" | "Tinggi" {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "Tinggi";
  if (value === "rendah") return "Rendah";
  return "Sedang";
}

function getUrgensiClass(rawValue: unknown): string {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") {
    return "status-chip-danger";
  }

  if (value === "rendah") {
    return "status-chip-neutral";
  }

  return "status-chip-warning";
}

export default function SuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
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
    fetchSuratMasuk();
  }, []);

  const fetchSuratMasuk = async () => {
    try {
      const response = await fetch("/api/admin/surat-masuk", {
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengambil data surat masuk");
      }

      setSuratMasuk(result.data || []);
    } catch (error) {
      console.error("Error fetching surat masuk:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data surat masuk",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menghapus surat masuk ini?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setAlert(null);

      const response = await fetch(`/api/admin/surat-masuk/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menghapus surat masuk");
      }

      setAlert({
        type: "success",
        message: result.message || "Surat masuk berhasil dihapus",
      });
      await fetchSuratMasuk();
    } catch (error) {
      console.error("Error deleting surat masuk:", error);
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus surat masuk",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportExcel = () => {
    const exportRows = filteredSuratMasuk.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat,
      "Tanggal Surat": formatDate(item.tanggal_surat),
      "Tanggal Terima": formatDate(item.tanggal_terima),
      "Asal Surat": item.asal_surat,
      Urgensi: getUrgensiLabel(item.urgensi),
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 32 },
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Masuk");

    const exportDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `laporan-surat-masuk-${exportDate}.xlsx`);
  };



  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredSuratMasuk = suratMasuk.filter((item) => {
    const searchMatch = !normalizedSearchTerm || [item.nomor_surat, item.asal_surat, item.perihal, item.created_by_name, item.urgensi]
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

  return (
    <section>
        {alert && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              alert.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nomor surat, asal surat, perihal, atau urgensi"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
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
              Export Excel
            </button>
            <Link
              href="/admin/surat-masuk/tambah"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              Data Surat Masuk
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat data...</p>
            </div>
          ) : filteredSuratMasuk.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{hasFilter ? "Data surat masuk tidak ditemukan" : "Belum ada data surat masuk"}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Terima</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Asal Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Urgensi</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                  <th className="w-72 px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuratMasuk.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.nomor_surat}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_surat)}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_terima)}</td>
                    <td className="px-4 py-3">{s.asal_surat}</td>
                    <td className="px-4 py-3">
                      <span className={`status-chip ${getUrgensiClass(s.urgensi)}`}>
                        {getUrgensiLabel(s.urgensi)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.perihal}</td>
                    <td className="px-4 py-3 text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                        {s.file_path ? (
                          <a
                            href={`/admin/surat-masuk/${s.id}/preview`}
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
                          href={`/admin/surat-masuk/${s.id}`}
                          className="aksi-btn aksi-btn-edit"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="aksi-btn aksi-btn-delete"
                        >
                          {deletingId === s.id ? "Menghapus..." : "Hapus"}
                        </button>
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
