"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { FiCalendar, FiCheckCircle, FiDownload, FiInbox, FiRefreshCw, FiSend, FiUserCheck } from "react-icons/fi";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  urgensi?: "rendah" | "sedang" | "tinggi" | string;
  perihal: string;
  file_path?: string | null;
  created_by_name?: string | null;
  latest_disposisi_tujuan?: string | null;
  latest_disposisi_tujuan_label?: string | null;
  latest_disposisi_status?: string | null;
  latest_disposisi_urgensi?: "rendah" | "sedang" | "tinggi" | string | null;
  latest_disposisi_catatan?: string | null;
  latest_disposisi_at?: string | null;
  latest_disposisi_by?: string | null;
  status_penanganan?: string | null;
  ditangani_at?: string | null;
  ditangani_by_name?: string | null;
}

const FIXED_TUJUAN_ROLE = "sekretaris";
const FIXED_TUJUAN_LABEL = "Sekretaris Desa";
type DisposisiUrgensi = "rendah" | "sedang" | "tinggi";
type StatusFilter = "semua" | "belum" | "sudah";

type PenangananSurat = "baru" | "diproses" | "selesai";

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

function normalizeDisposisiStatus(rawValue: unknown): string {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isKonfirmasiKepalaDesa(item: SuratMasukItem): boolean {
  const tujuan = String(item.latest_disposisi_tujuan || "").trim().toLowerCase();
  const label = String(item.latest_disposisi_tujuan_label || "").trim().toLowerCase();

  return tujuan === "kepala_desa" || label.includes("konfirmasi kepala desa");
}

function hasRealDisposisi(item: SuratMasukItem): boolean {
  return Boolean(item.latest_disposisi_tujuan) && !isKonfirmasiKepalaDesa(item);
}

function normalizePenangananStatus(rawValue: unknown): string {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getUrgensiRank(rawValue: unknown): number {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return 3;
  if (value === "sedang") return 2;
  if (value === "rendah") return 1;
  return 2;
}

function getPenangananStatus(item: SuratMasukItem): PenangananSurat {
  const handledStatus = normalizePenangananStatus(item.status_penanganan);
  if (["selesai", "sudah", "done", "completed", "selesai_ditangani", "sudah_ditangani"].includes(handledStatus)) {
    return "selesai";
  }

  const hasDisposisi = hasRealDisposisi(item);
  const status = normalizeDisposisiStatus(item.latest_disposisi_status);

  if (isKonfirmasiKepalaDesa(item) && ["selesai", "terlaksana", "completed", "done", "tuntas"].includes(status)) {
    return "selesai";
  }

  if (!hasDisposisi && !status) {
    return "baru";
  }

  if (!hasDisposisi && status) {
    return "baru";
  }

  if (["pending", "diproses", "proses", "menunggu"].includes(status)) {
    return "diproses";
  }

  if (
    ["didisposisikan", "diteruskan", "selesai", "terlaksana", "completed", "done", "ditindaklanjuti", "tuntas"].includes(status)
  ) {
    return "selesai";
  }

  if (hasDisposisi) {
    return "diproses";
  }

  if (status) {
    return "baru";
  }

  return "baru";
}

function getPenangananMeta(status: PenangananSurat) {
  if (status === "baru") {
    return {
      label: "Baru masuk",
      className: "bg-blue-100 text-blue-700",
    };
  }

  if (status === "selesai") {
    return {
      label: "Selesai ditangani",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: "Sedang diproses",
    className: "bg-amber-100 text-amber-700",
  };
}

function getUrgensiLabel(rawValue: unknown): "Rendah" | "Sedang" | "Tinggi" {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "Tinggi";
  if (value === "rendah") return "Rendah";
  return "Sedang";
}

function getUrgensiClass(rawValue: unknown): string {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "bg-red-100 text-red-700";
  if (value === "rendah") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function normalizeUrgensiValue(rawValue: unknown): DisposisiUrgensi {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "tinggi";
  if (value === "rendah") return "rendah";
  return "sedang";
}

export default function KepalaDesaLaporanSuratMasukPage() {
  const [data, setData] = useState<SuratMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [disposisiTarget, setDisposisiTarget] = useState<SuratMasukItem | null>(null);
  const [tujuanLanjutan, setTujuanLanjutan] = useState<string>("");
  const [urgensiDisposisi, setUrgensiDisposisi] = useState<DisposisiUrgensi>("sedang");
  const [catatanDisposisi, setCatatanDisposisi] = useState<string>("");
  const [confirmTarget, setConfirmTarget] = useState<SuratMasukItem | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [sortBy, setSortBy] = useState<"urgensi-tinggi" | "urgensi-sedang" | "urgensi-rendah">("urgensi-tinggi");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/surat-masuk", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data laporan surat masuk");
      }

      setData((result.data || []) as SuratMasukItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = data
      .map((item) => parseDate(item.tanggal_terima || item.tanggal_surat)?.getFullYear() ?? null)
      .filter((year): year is number => year !== null)
      .filter((year) => Number.isFinite(year));

    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [data]);

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

  const openDisposisiDialog = (item: SuratMasukItem) => {
    setDisposisiTarget(item);
    setTujuanLanjutan("");
    setUrgensiDisposisi(normalizeUrgensiValue(item.urgensi));
    setCatatanDisposisi(`Mohon ditindaklanjuti terkait surat masuk ${item.nomor_surat || ""}.`.trim());
  };

  const closeDisposisiDialog = () => {
    setDisposisiTarget(null);
    setTujuanLanjutan("");
    setUrgensiDisposisi("sedang");
    setCatatanDisposisi("");
  };

  const handleDisposisi = async () => {
    if (!disposisiTarget) {
      return;
    }

    try {
      setSubmittingId(disposisiTarget.id);
      setFeedback(null);

      const response = await fetch(`/api/kepala-desa/surat-masuk/${disposisiTarget.id}/disposisi`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tujuan_role: FIXED_TUJUAN_ROLE,
          tujuan_label: FIXED_TUJUAN_LABEL,
          tujuan_lanjutan: tujuanLanjutan,
          urgensi_disposisi: urgensiDisposisi,
          catatan: catatanDisposisi,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal melakukan disposisi");
      }

      const nowIso = new Date().toISOString();

      setData((current) =>
        current.map((row) =>
          row.id === disposisiTarget.id
            ? {
                ...row,
                latest_disposisi_tujuan: FIXED_TUJUAN_ROLE,
                latest_disposisi_tujuan_label: FIXED_TUJUAN_LABEL,
                latest_disposisi_status: "didisposisikan",
                latest_disposisi_urgensi: urgensiDisposisi,
                latest_disposisi_catatan: catatanDisposisi,
                latest_disposisi_at: nowIso,
                latest_disposisi_by: "Kepala Desa",
              }
            : row
        )
      );

      setFeedback({
        type: "success",
        text: `Surat ${disposisiTarget.nomor_surat || ""} berhasil didisposisikan ke ${FIXED_TUJUAN_LABEL}.`,
      });
      closeDisposisiDialog();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat melakukan disposisi",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleKonfirmasiSelesai = async (item: SuratMasukItem) => {
    try {
      setConfirmingId(item.id);
      setFeedback(null);

      const response = await fetch(`/api/kepala-desa/surat-masuk/${item.id}/konfirmasi`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catatan: `Surat ${item.nomor_surat || ""} telah dibaca dan dikonfirmasi selesai oleh Kepala Desa.`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal mengonfirmasi surat selesai");
      }

      const nowIso = new Date().toISOString();

      setData((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status_penanganan: "selesai",
                ditangani_at: nowIso,
                ditangani_by_name: "Kepala Desa",
              }
            : row
        )
      );

      setFeedback({
        type: "success",
        text: `Surat ${item.nomor_surat || ""} ditandai selesai ditangani.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan saat mengonfirmasi surat selesai",
      });
    } finally {
      setConfirmingId(null);
      setConfirmTarget(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchPool = [
        item.nomor_surat,
        item.asal_surat,
        item.perihal,
        item.urgensi || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm.trim() || searchPool.includes(searchTerm.trim().toLowerCase());

      const dateSource = parseDate(item.tanggal_terima || item.tanggal_surat);
      const day = dateSource ? dateSource.getDate() : null;
      const month = dateSource ? dateSource.getMonth() + 1 : null;
      const year = dateSource ? dateSource.getFullYear() : null;
      const parsedDayFrom = selectedDayFrom === "" ? null : Number(selectedDayFrom);
      const parsedDayTo = selectedDayTo === "" ? null : Number(selectedDayTo);
      const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
      const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;
      const matchesDayFrom = dayMin === null || (day !== null && day >= dayMin);
      const matchesDayTo = dayMax === null || (day !== null && day <= dayMax);
      const matchesMonth = selectedMonth === "" || month === Number(selectedMonth);
      const matchesYear = selectedYear === "" || year === Number(selectedYear);

      const penanganan = getPenangananStatus(item);
      const matchesStatus =
        statusFilter === "semua"
          ? true
          : statusFilter === "belum"
            ? penanganan === "baru"
            : penanganan === "diproses" || penanganan === "selesai";

      return matchesSearch && matchesDayFrom && matchesDayTo && matchesMonth && matchesYear && matchesStatus;
    });
  }, [data, searchTerm, selectedDayFrom, selectedDayTo, selectedMonth, selectedYear, statusFilter]);

  const sortedData = useMemo(() => {
    const rows = [...filteredData];

    const getUrgensiWeight = (rank: number): number => {
      if (sortBy === "urgensi-tinggi") {
        if (rank === 3) return 0;
        if (rank === 2) return 1;
        return 2;
      }

      if (sortBy === "urgensi-sedang") {
        if (rank === 2) return 0;
        if (rank === 3) return 1;
        return 2;
      }

      if (rank === 1) return 0;
      if (rank === 2) return 1;
      return 2;
    };

    rows.sort((a, b) => {
      const dateA = parseDate(a.tanggal_terima || a.tanggal_surat);
      const dateB = parseDate(b.tanggal_terima || b.tanggal_surat);

      const timeA = dateA?.getTime() ?? 0;
      const timeB = dateB?.getTime() ?? 0;
      const urgensiA = getUrgensiRank(a.urgensi);
      const urgensiB = getUrgensiRank(b.urgensi);

      const weightA = getUrgensiWeight(urgensiA);
      const weightB = getUrgensiWeight(urgensiB);
      return weightA - weightB || timeB - timeA;
    });

    return rows;
  }, [filteredData, sortBy]);

  const totalSuratMasuk = data.length;
  const totalFiltered = sortedData.length;
  const totalBaruMasuk = data.filter((item) => getPenangananStatus(item) === "baru").length;
  const totalDiproses = data.filter((item) => getPenangananStatus(item) === "diproses").length;
  const totalSelesai = data.filter((item) => getPenangananStatus(item) === "selesai").length;
  const bulanIniCount = data.filter((item) => {
    const parsed = parseDate(item.tanggal_terima || item.tanggal_surat);
    if (!parsed) return false;
    const now = new Date();
    return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
  }).length;
  const handleExportExcel = () => {
    const exportRows = sortedData.map((item, index) => ({
      No: index + 1,
      "Nomor Surat": item.nomor_surat || "-",
      "Tanggal Surat": formatDate(item.tanggal_surat),
      "Tanggal Terima": formatDate(item.tanggal_terima || item.tanggal_surat),
      "Asal Surat": item.asal_surat || "-",
      Urgensi: getUrgensiLabel(item.urgensi),
      Perihal: item.perihal || "-",
      "Status Penanganan": getPenangananMeta(getPenangananStatus(item)).label,
      "Nama File": getStoredFileName(item.file_path),
      "Status File": item.file_path ? "Tersedia" : "Tidak ada",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["LAPORAN SURAT MASUK"],
      [`Tanggal Export: ${getExportDateLabel()}`],
      [`Total Data: ${sortedData.length}`],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, exportRows, {
      origin: "A5",
      skipHeader: false,
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    ];

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 32 },
      { wch: 20 },
      { wch: 38 },
      { wch: 14 },
    ];

    worksheet["!autofilter"] = {
      ref: `A5:J${Math.max(exportRows.length + 5, 5)}`,
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
      <p className="mb-3 text-sm text-gray-600">
        Ringkasan surat masuk berdasarkan filter periode, pencarian, sorting, dan rentang tanggal dari-sampai.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Pencarian</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor surat, asal surat, perihal, atau urgensi..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Tanggal Dari</label>
            <select
              value={selectedDayFrom}
              onChange={(e) => setSelectedDayFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Tanggal Sampai</label>
            <select
              value={selectedDayTo}
              onChange={(e) => setSelectedDayTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Sorting</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="urgensi-tinggi">Urgensi Tinggi</option>
              <option value="urgensi-sedang">Urgensi Sedang</option>
              <option value="urgensi-rendah">Urgensi Rendah</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Status Penanganan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua</option>
              <option value="belum">Belum ditangani</option>
              <option value="sudah">Sudah ditangani</option>
            </select>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-gray-600">
          <FiCalendar className="text-gray-500" />
          Menampilkan {totalFiltered} dari {totalSuratMasuk} surat masuk
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 hover:bg-slate-200"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700"
          >
            <FiDownload className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Total Surat Masuk</p>
          <p className="text-xl font-bold text-blue-700">{totalSuratMasuk}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Data Ditampilkan</p>
          <p className="text-xl font-bold text-emerald-700">{totalFiltered}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Bulan Ini</p>
          <p className="text-xl font-bold text-purple-700">{bulanIniCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Baru Masuk</p>
          <p className="text-xl font-bold text-blue-700">{totalBaruMasuk}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Selesai Ditangani</p>
          <p className="text-xl font-bold text-emerald-700">{totalSelesai}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Sedang Diproses</p>
          <p className="text-xl font-bold text-amber-700">{totalDiproses}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data laporan surat masuk...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data yang sesuai filter.</div>
        ) : (
          <table className="min-w-[1280px] divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-12 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">No</th>
                <th className="w-40 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Nomor Surat</th>
                <th className="w-40 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Tanggal Terima</th>
                <th className="w-48 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Asal Surat</th>
                <th className="w-24 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Urgensi</th>
                <th className="min-w-[200px] px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Perihal</th>
                <th className="w-[260px] px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Disposisi</th>
                <th className="w-40 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Status Penanganan</th>
                <th className="w-40 px-3 py-2.5 text-left text-[11px] font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((item, index) => {
                const penanganan = getPenangananStatus(item);
                const meta = getPenangananMeta(penanganan);
                const hasDisposisi = hasRealDisposisi(item);

                return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 align-top text-gray-700">{index + 1}</td>
                  <td className="px-3 py-3 align-top whitespace-nowrap font-semibold text-gray-900">{item.nomor_surat || "-"}</td>
                  <td className="px-3 py-3 align-top whitespace-nowrap text-gray-700">{formatDate(item.tanggal_terima || item.tanggal_surat)}</td>
                  <td className="px-3 py-3 align-top text-gray-700">{item.asal_surat || "-"}</td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getUrgensiClass(item.urgensi)}`}>
                      {getUrgensiLabel(item.urgensi)}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">{item.perihal || "-"}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      {hasDisposisi ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] text-emerald-800">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                            Sudah didisposisikan
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          Tanpa disposisi
                        </span>
                      )}

                      {penanganan !== "selesai" && !hasDisposisi ? (
                        <button
                          type="button"
                          onClick={() => openDisposisiDialog(item)}
                          disabled={submittingId === item.id}
                          className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          <FiSend className="h-3 w-3" />
                          {submittingId === item.id ? "Memproses..." : "Kirim Sekretaris"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col items-start gap-1.5">
                      <Link
                        href={`/kepala-desa/surat-masuk/${item.id}`}
                        className="inline-flex rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
                      >
                        Lihat Detail
                      </Link>

                      {penanganan !== "selesai" ? (
                        <button
                          type="button"
                          onClick={() => setConfirmTarget(item)}
                          disabled={confirmingId === item.id}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          <FiCheckCircle className="h-3 w-3" />
                          {confirmingId === item.id ? "Memproses..." : "Centang Selesai"}
                        </button>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          Sudah selesai
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {disposisiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Disposisi Surat Masuk</h3>
            <p className="mt-1 text-sm text-gray-600">
              Nomor surat: <span className="font-semibold text-gray-800">{disposisiTarget.nomor_surat || "-"}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tujuan Disposisi</label>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 inline-flex items-center gap-2">
                  <FiUserCheck className="h-4 w-4" />
                  Surat ini akan dikirim ke <span className="font-semibold">{FIXED_TUJUAN_LABEL}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Sekretaris akan menentukan penerusan disposisi berikutnya ke kaur/kasi/staf sesuai kebutuhan.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Rekomendasi Tujuan Lanjutan oleh Sekretaris (opsional)
                </label>
                <input
                  type="text"
                  value={tujuanLanjutan}
                  onChange={(e) => setTujuanLanjutan(e.target.value)}
                  placeholder="Contoh: Kaur Pemerintahan dan Kasi Pelayanan"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Urgensi Disposisi</label>
                <select
                  value={urgensiDisposisi}
                  onChange={(e) => setUrgensiDisposisi(normalizeUrgensiValue(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tinggi">Tinggi</option>
                  <option value="sedang">Sedang</option>
                  <option value="rendah">Rendah</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Keterangan Disposisi (instruksi tindak lanjut)
                </label>
                <textarea
                  value={catatanDisposisi}
                  onChange={(e) => setCatatanDisposisi(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Isi arahan untuk petugas yang menerima disposisi"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDisposisiDialog}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDisposisi}
                disabled={submittingId === disposisiTarget.id}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <FiSend className="h-4 w-4" />
                {submittingId === disposisiTarget.id ? "Memproses..." : "Simpan Disposisi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Konfirmasi Selesai Ditangani</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tandai surat <span className="font-semibold text-gray-800">{confirmTarget.nomor_surat || "-"}</span> sebagai selesai ditangani?
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Aksi ini tidak membuat disposisi otomatis. Keterangan disposisi hanya muncul jika Anda memang mengirim disposisi.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={confirmingId === confirmTarget.id}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleKonfirmasiSelesai(confirmTarget)}
                disabled={confirmingId === confirmTarget.id}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <FiCheckCircle className="h-4 w-4" />
                {confirmingId === confirmTarget.id ? "Memproses..." : "Ya, tandai selesai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
