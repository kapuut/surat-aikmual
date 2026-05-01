"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";

type WorkflowStatus =
  | "pending"
  | "diproses"
  | "dikirim_ke_kepala_desa"
  | "perlu_revisi"
  | "ditandatangani"
  | "selesai"
  | "ditolak";

interface PermohonanItem {
  id: number;
  nomor_surat: string | null;
  file_path: string | null;
  attachment_paths?: string[];
  created_at: string;
  nama_pemohon: string;
  nik: string;
  jenis_surat: string;
  keperluan: string;
  status: WorkflowStatus;
  catatan: string | null;
}

function normalizeFilePath(rawValue: string | null): string | null {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;
  if (trimmed.startsWith("[") || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((item) => typeof item === "string" && item.trim());
        candidate = typeof first === "string" ? first.trim() : null;
      } else if (typeof parsed === "string" && parsed.trim()) {
        candidate = parsed.trim();
      }
    } catch {
      // Keep original when parsing fails.
    }
  }

  if (!candidate || candidate === "[]") return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function statusLabel(status: WorkflowStatus): string {
  const labels: Record<WorkflowStatus, string> = {
    pending: "Menunggu Verifikasi",
    diproses: "Diproses Admin",
    dikirim_ke_kepala_desa: "Menunggu TTD",
    perlu_revisi: "Perlu Revisi",
    ditandatangani: "Ditandatangani",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };

  return labels[status] ?? status;
}

function statusClass(status: WorkflowStatus): string {
  const classes: Record<WorkflowStatus, string> = {
    pending: "status-chip-warning",
    diproses: "status-chip-primary",
    dikirim_ke_kepala_desa: "status-chip-info",
    perlu_revisi: "status-chip-warning",
    ditandatangani: "status-chip-success",
    selesai: "status-chip-success",
    ditolak: "status-chip-danger",
  };

  return classes[status] ?? "status-chip-neutral";
}

function processNote(status: WorkflowStatus): string {
  if (status === "perlu_revisi") {
    return "Menunggu revisi data dari admin";
  }
  return "";
}

type ArchiveCategory = "Menunggu TTD" | "Perlu Revisi" | "Surat Selesai" | "Ditolak" | "Semua";

type ConfirmDialogState =
  | {
      kind: "update";
      title: string;
      message: string;
      confirmText: string;
      payload: {
        id: number;
        status: "ditandatangani" | "selesai";
        catatan: string;
        successMessage: string;
      };
    }
  | {
      kind: "delete";
      title: string;
      message: string;
      confirmText: string;
      payload: {
        id: number;
      };
    };

function isMenungguTtdStatus(status: WorkflowStatus): boolean {
  return status === "dikirim_ke_kepala_desa";
}

function isPermohonanSelesaiStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

function matchesArchiveCategory(status: WorkflowStatus, archiveCategory: ArchiveCategory): boolean {
  switch (archiveCategory) {
    case "Menunggu TTD":
      return isMenungguTtdStatus(status);
    case "Perlu Revisi":
      return status === "perlu_revisi";
    case "Surat Selesai":
      return isPermohonanSelesaiStatus(status);
    case "Ditolak":
      return status === "ditolak";
    case "Semua":
    default:
      return true;
  }
}

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

export default function KepalaDesaWorkflowClient() {
  const router = useRouter();
  const [data, setData] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [archiveCategory, setArchiveCategory] = useState<ArchiveCategory>("Menunggu TTD");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPermohonan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/permohonan", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data permohonan");
      }

      const rows = (result.data || []) as PermohonanItem[];
      setData(
        rows
          .map((item) => ({
            ...item,
            file_path: normalizeFilePath(item.file_path),
          }))
          .filter((item) =>
          ["dikirim_ke_kepala_desa", "ditandatangani", "selesai", "perlu_revisi", "ditolak"].includes(item.status)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermohonan();
  }, []);

  const performDelete = async (id: number) => {
    try {
      setDeleteId(id);
      setError(null);
      setNotice(null);

      const response = await fetch(`/api/admin/permohonan/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal menghapus permohonan");
      }

      setNotice(result?.message || "Permohonan berhasil dihapus.");
      await fetchPermohonan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      kind: "delete",
      title: "Hapus Permohonan",
      message: "Hapus permohonan ini dari daftar? Data permohonan akan dihapus dari menu ini.",
      confirmText: "Ya, Hapus",
      payload: { id },
    });
  };

  const performUpdate = async (
    id: number,
    status: "ditandatangani" | "selesai",
    catatan: string,
    successMessage: string
  ): Promise<boolean> => {
    try {
      setActionId(id);
      setError(null);
      setNotice(null);

      const response = await fetch(`/api/permohonan/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, catatan }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal memperbarui status");
      }

      setNotice(successMessage);
      await fetchPermohonan();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui status");
      return false;
    } finally {
      setActionId(null);
    }
  };

  const handleUpdate = async (
    id: number,
    status: "ditandatangani" | "selesai",
    catatan: string,
    successMessage: string,
    confirmMessage?: string
  ): Promise<boolean> => {
    if (confirmMessage) {
      setConfirmDialog({
        kind: "update",
        title: "Konfirmasi Tanda Tangan",
        message: confirmMessage,
        confirmText: "Ya, Lanjutkan",
        payload: { id, status, catatan, successMessage },
      });
      return false;
    }

    return performUpdate(id, status, catatan, successMessage);
  };

  const closeConfirmDialog = () => {
    const busyForUpdate =
      confirmDialog?.kind === "update" && actionId === confirmDialog.payload.id;
    const busyForDelete =
      confirmDialog?.kind === "delete" && deleteId === confirmDialog.payload.id;

    if (busyForUpdate || busyForDelete) return;
    setConfirmDialog(null);
  };

  const submitConfirmDialog = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.kind === "update") {
      const { id, status, catatan, successMessage } = confirmDialog.payload;
      await performUpdate(id, status, catatan, successMessage);
      setConfirmDialog(null);
      return;
    }

    await performDelete(confirmDialog.payload.id);
    setConfirmDialog(null);
  };



  const availableYears = useMemo(() => {
    const years = data
      .map((p) => new Date(p.created_at).getFullYear())
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

  const filteredPermohonan = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchStatus = matchesArchiveCategory(item.status, archiveCategory);
      const matchSearch =
        item.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm);
      const createdAt = new Date(item.created_at);
      const day = createdAt.getDate();
      const month = createdAt.getMonth() + 1;
      const year = createdAt.getFullYear();
      const parsedDayFrom = selectedDayFrom === "" ? null : Number(selectedDayFrom);
      const parsedDayTo = selectedDayTo === "" ? null : Number(selectedDayTo);
      const dayMin = parsedDayFrom !== null && parsedDayTo !== null ? Math.min(parsedDayFrom, parsedDayTo) : parsedDayFrom;
      const dayMax = parsedDayFrom !== null && parsedDayTo !== null ? Math.max(parsedDayFrom, parsedDayTo) : parsedDayTo;
      const matchDayFrom = dayMin === null || day >= dayMin;
      const matchDayTo = dayMax === null || day <= dayMax;
      const matchMonth = selectedMonth === "" || month === Number(selectedMonth);
      const matchYear = selectedYear === "" || year === Number(selectedYear);

      return matchStatus && matchSearch && matchDayFrom && matchDayTo && matchMonth && matchYear;
    });

    const statusPriority: Record<WorkflowStatus, number> = {
      dikirim_ke_kepala_desa: 0,
      perlu_revisi: 1,
      pending: 2,
      diproses: 3,
      ditandatangani: 4,
      selesai: 5,
      ditolak: 6,
    };

    return [...filtered].sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data, archiveCategory, searchTerm, selectedDayFrom, selectedDayTo, selectedMonth, selectedYear]);

  const filterDescription = useMemo(() => {
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const parts: string[] = [];
    if (selectedDayFrom && selectedDayTo) {
      parts.push(`tanggal ${selectedDayFrom}–${selectedDayTo}`);
    } else if (selectedDayFrom) {
      parts.push(`tanggal ${selectedDayFrom}`);
    } else if (selectedDayTo) {
      parts.push(`tanggal s/d ${selectedDayTo}`);
    }
    if (selectedMonth) parts.push(months[Number(selectedMonth) - 1] || selectedMonth);
    if (selectedYear) parts.push(`tahun ${selectedYear}`);
    return parts.length > 0 ? parts.join(' ') : 'semua waktu';
  }, [selectedYear, selectedMonth, selectedDayFrom, selectedDayTo]);

  const stats = {
    menungguTtd: data.filter((p) => p.status === "dikirim_ke_kepala_desa").length,
    perluRevisi: data.filter((p) => p.status === "perlu_revisi").length,
    selesai: data.filter((p) => p.status === "ditandatangani" || p.status === "selesai").length,
    ditolak: data.filter((p) => p.status === "ditolak").length,
  };

  return (
    <section>
      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu TTD</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.menungguTtd}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-indigo-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Perlu Revisi</p>
              <p className="text-2xl font-bold text-amber-600">{stats.perluRevisi}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-amber-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai / Ditandatangani</p>
              <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{stats.ditolak}</p>
            </div>
            <div className="bg-red-100 text-red-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              NO
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Cari nama, NIK, atau jenis surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          <select
            value={selectedDayFrom}
            onChange={(e) => setSelectedDayFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tanggal Dari</option>
            {availableDays.map((day) => (
              <option key={day} value={String(day)}>{day}</option>
            ))}
          </select>

          <select
            value={selectedDayTo}
            onChange={(e) => setSelectedDayTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tanggal Sampai</option>
            {availableDays.map((day) => (
              <option key={day} value={String(day)}>{day}</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>

          <select
            value={archiveCategory}
            onChange={(e) => setArchiveCategory(e.target.value as ArchiveCategory)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Menunggu TTD">Menunggu TTD</option>
            <option value="Perlu Revisi">Perlu Revisi</option>
            <option value="Surat Selesai">Surat Selesai</option>
            <option value="Semua">Semua</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Jumlah data dari {filterDescription} = {filteredPermohonan.length} data
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pemohon</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">File Surat</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  Memuat data...
                </td>
              </tr>
            ) : filteredPermohonan.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  Belum ada data surat.
                </td>
              </tr>
            ) : (
              filteredPermohonan.map((item) => {
                const suratPreviewPageUrl = `/kepala-desa/permohonan/${item.id}/preview`;
                const shouldOpenFinalFile = isFinalizedStatus(item.status);
                const suratPreviewLabel = shouldOpenFinalFile ? "File Final" : "Lihat Draft Surat";

                return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {item.nomor_surat || `REG-${item.id}/${new Date(item.created_at).getFullYear()}`}
                  </td>
                  <td className="px-4 py-3">{item.nama_pemohon}</td>
                  <td className="px-4 py-3">{item.jenis_surat}</td>
                  <td className="px-4 py-3">{item.keperluan}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`status-chip ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                      {processNote(item.status) && (
                        <span className="text-[11px] text-gray-500">{processNote(item.status)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => router.push(suratPreviewPageUrl)}
                        className={`aksi-btn ${shouldOpenFinalFile ? "aksi-btn-success" : "aksi-btn-view"}`}
                      >
                        {suratPreviewLabel}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      {item.status === "dikirim_ke_kepala_desa" && (
                        <button
                          onClick={() =>
                            handleUpdate(
                              item.id,
                              "selesai",
                              "",
                              "Surat berhasil diverifikasi dan ditandatangani digital. Data otomatis masuk ke menu Surat Keluar.",
                              "Pastikan data surat sudah benar. Lanjut verifikasi + tanda tangan digital sekarang?"
                            )
                          }
                          disabled={actionId === item.id}
                          className="aksi-btn aksi-btn-primary w-full"
                        >
                          Verifikasi & TTD
                        </button>
                      )}

                      {item.status === "ditandatangani" && (
                        <button
                          onClick={() =>
                            handleUpdate(
                              item.id,
                              "selesai",
                              "Permohonan selesai setelah proses tanda tangan digital.",
                              "Permohonan ditandai selesai."
                            )
                          }
                          disabled={actionId === item.id}
                          className="aksi-btn aksi-btn-success w-full"
                        >
                          Tandai Selesai
                        </button>
                      )}

                      {(item.status === "perlu_revisi" || item.status === "selesai") && (
                        <div className="flex flex-col w-full items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteId === item.id}
                            className="aksi-btn aksi-btn-delete"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            {deleteId === item.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      )}

                      {item.status === "ditandatangani" && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteId === item.id}
                          className="aksi-btn aksi-btn-delete w-full"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          {deleteId === item.id ? "Menghapus..." : "Hapus"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={closeConfirmDialog}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">{confirmDialog.title}</h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-700">{confirmDialog.message}</p>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={
                  (confirmDialog.kind === "update" && actionId === confirmDialog.payload.id) ||
                  (confirmDialog.kind === "delete" && deleteId === confirmDialog.payload.id)
                }
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitConfirmDialog}
                disabled={
                  (confirmDialog.kind === "update" && actionId === confirmDialog.payload.id) ||
                  (confirmDialog.kind === "delete" && deleteId === confirmDialog.payload.id)
                }
                className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 ${
                  confirmDialog.kind === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmDialog.kind === "update" && actionId === confirmDialog.payload.id
                  ? "Memproses..."
                  : confirmDialog.kind === "delete" && deleteId === confirmDialog.payload.id
                    ? "Menghapus..."
                    : confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}


    </section>
  );
}
