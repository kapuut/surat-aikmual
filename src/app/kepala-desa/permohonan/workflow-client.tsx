"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import {
  FiCheck,
  FiDownload,
  FiEdit,
  FiEye,
  FiInfo,
  FiRotateCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";

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

function formatIsoDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
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
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");
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

  const filteredPermohonan = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchStatus = matchesArchiveCategory(item.status, archiveCategory);
      const matchSearch =
        item.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm);
      const createdAtDate = new Date(item.created_at);
      const createdAtValue = Number.isNaN(createdAtDate.getTime()) ? "" : createdAtDate.toISOString().slice(0, 10);
      const dayMin = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayFrom : selectedDayTo) : selectedDayFrom;
      const dayMax = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayTo : selectedDayFrom) : selectedDayTo;
      const matchDayFrom = !dayMin || createdAtValue >= dayMin;
      const matchDayTo = !dayMax || createdAtValue <= dayMax;

      return matchStatus && matchSearch && matchDayFrom && matchDayTo;
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
  }, [data, archiveCategory, searchTerm, selectedDayFrom, selectedDayTo]);

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

  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredPermohonan.length} data`;
  }, [selectedDayFrom, selectedDayTo, filteredPermohonan.length]);

  const hasDateFilter = Boolean(selectedDayFrom || selectedDayTo);

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

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Cari nama, NIK, atau jenis surat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={archiveCategory}
              onChange={(e) => setArchiveCategory(e.target.value as ArchiveCategory)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Menunggu TTD">Menunggu TTD</option>
              <option value="Semua">Semua</option>
              <option value="Surat Selesai">Surat Selesai</option>
            </select>
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
      </div>

      {hasDateFilter && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <FiInfo className="h-4 w-4 text-blue-700" />
          <span>{filterDescription.replace(`${filteredPermohonan.length} data`, "")}<strong>{filteredPermohonan.length}</strong> data</span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs sm:text-sm table-auto border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-bold text-gray-700 w-32">Nomor</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700">Pemohon</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 w-40">Jenis Surat</th>
              <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[200px]">Keperluan</th>
              <th className="px-2 py-3 text-left font-bold text-gray-700 w-32">Status</th>
              <th className="px-2 py-3 text-center font-bold text-gray-700 w-[220px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPermohonan.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500 italic" colSpan={6}>
                  Belum ada data surat.
                </td>
              </tr>
            ) : (
              filteredPermohonan.map((item) => {
                const suratPreviewPageUrl = `/kepala-desa/permohonan/${item.id}/preview`;

                return (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3 py-3 font-semibold text-gray-900 break-words truncate max-w-[150px]" title={item.nomor_surat || `REG-${item.id}`}>
                      {item.nomor_surat || `REG-${item.id}`}
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-medium truncate max-w-[150px]" title={item.nama_pemohon}>
                      {item.nama_pemohon}
                    </td>
                    <td className="px-3 py-3 text-gray-600 truncate max-w-[150px]" title={item.jenis_surat}>
                      {item.jenis_surat}
                    </td>
                    <td className="px-3 py-3 text-gray-500 leading-snug italic truncate max-w-[180px]" title={item.keperluan || "-"}>
                      {item.keperluan || "-"}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`status-chip scale-90 origin-left ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => window.open(suratPreviewPageUrl, "_blank")}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          title="Lihat detail surat"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          Lihat
                        </button>
                        <a
                          href={suratPreviewPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                          title="Unduh surat"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          Unduh
                        </a>

                        {item.status === "dikirim_ke_kepala_desa" && (
                          <button
                            onClick={() =>
                              handleUpdate(
                                item.id,
                                "selesai",
                                "",
                                "Surat berhasil diverifikasi dan ditandatangani digital.",
                                "Lanjut verifikasi + tanda tangan digital sekarang?"
                              )
                            }
                            disabled={actionId === item.id}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 border border-indigo-200 transition-all shadow-sm disabled:opacity-50"
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                            TTD
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
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm disabled:opacity-50"
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                            Selesai
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
