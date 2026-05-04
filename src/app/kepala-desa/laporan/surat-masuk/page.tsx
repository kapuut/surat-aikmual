"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiCalendar, FiCheckCircle, FiDownload, FiEye, FiInbox, FiInfo, FiRefreshCw, FiRotateCcw, FiSend, FiUserCheck } from "react-icons/fi";

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
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");

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
      const statusA = getPenangananStatus(a);
      const statusB = getPenangananStatus(b);
      const hasDispA = hasRealDisposisi(a);
      const hasDispB = hasRealDisposisi(b);

      const getStatusWeight = (status: PenangananSurat, hasDisp: boolean) => {
        if (status === "baru") return 0;
        if (hasDisp) return 1; // Didisposisikan
        return 2; // Selesai ditangani
      };

      const weightStatusA = getStatusWeight(statusA, hasDispA);
      const weightStatusB = getStatusWeight(statusB, hasDispB);

      if (weightStatusA !== weightStatusB) {
        return weightStatusA - weightStatusB;
      }

      const dateA = parseDate(a.tanggal_terima || a.tanggal_surat);
      const dateB = parseDate(b.tanggal_terima || b.tanggal_surat);
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

  const totalSuratMasuk = data.length;
  const totalFiltered = sortedData.length;
  const totalSelesai = data.filter((item) => getPenangananStatus(item) === "selesai").length;
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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor surat, asal surat, perihal, atau urgensi..."
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
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Total Surat Masuk</p>
          <p className="text-xl font-bold text-blue-700">{totalSuratMasuk}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500">Selesai Ditangani</p>
          <p className="text-xl font-bold text-emerald-700">{totalSelesai}</p>
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
          <table className="w-full divide-y divide-gray-200 text-xs table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left text-[11px] font-bold text-gray-700">No</th>
                <th className="w-32 px-3 py-2.5 text-left text-[11px] font-bold text-gray-700">Nomor Surat</th>
                <th className="w-32 px-3 py-2.5 text-left text-[11px] font-bold text-gray-700">Tanggal Terima</th>
                <th className="w-40 px-3 py-2.5 text-left text-[11px] font-bold text-gray-700 max-w-[150px]">Asal Surat</th>
                <th className="w-20 px-3 py-2.5 text-center text-[11px] font-bold text-gray-700">Urgensi</th>
                <th className="min-w-[180px] px-3 py-2.5 text-left text-[11px] font-bold text-gray-700 max-w-[200px]">Perihal</th>
                <th className="w-40 px-3 py-2.5 text-center text-[11px] font-bold text-gray-700">Status Disposisi</th>
                <th className="w-32 px-3 py-2.5 text-center text-[11px] font-bold text-gray-700">Status Laporan</th>
                <th className="w-[380px] px-3 py-2.5 text-center text-[11px] font-bold text-gray-700">Aksi Penanganan</th>
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
                  <td className="px-3 py-3 align-top text-gray-700 max-w-[150px] truncate" title={item.asal_surat || "-"}>{item.asal_surat || "-"}</td>
                  <td className="px-3 py-3 align-middle text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getUrgensiClass(item.urgensi)}`}>
                      {getUrgensiLabel(item.urgensi)}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle text-gray-700 max-w-[200px] truncate italic" title={item.perihal || "-"}>{item.perihal || "-"}</td>
                  <td className="px-3 py-3 align-middle text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {hasDisposisi ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold w-fit">
                            Sudah didisposisikan
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex w-fit rounded-md bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 text-[10px] font-bold italic">
                          Tanpa disposisi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <Link
                        href={`/kepala-desa/surat-masuk/${item.id}`}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                        title="Lihat detail"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        Detail
                      </Link>

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

                      {penanganan !== "selesai" && !hasDisposisi && (
                        <>
                          <button
                            type="button"
                            onClick={() => openDisposisiDialog(item)}
                            disabled={submittingId === item.id}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm disabled:opacity-50"
                            title="Disposisi ke Sekretaris"
                          >
                            <FiSend className="w-3.5 h-3.5" />
                            Kirim Sekretaris
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmTarget(item)}
                            disabled={confirmingId === item.id}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-bold hover:bg-slate-100 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
                            title="Tandai selesai tanpa disposisi"
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Tanpa Disposisi
                          </button>
                        </>
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
