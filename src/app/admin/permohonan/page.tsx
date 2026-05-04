"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PopupDatePicker from "@/components/shared/PopupDatePicker";
import { FiInfo, FiRotateCcw, FiTrash2 } from "react-icons/fi";

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
  created_at: string;
  nama_pemohon: string;
  nik: string;
  jenis_surat: string;
  keperluan: string;
  status: WorkflowStatus;
  catatan: string | null;
  file_path: string | null;
  attachment_paths?: string[];
}

type ConfirmDialogState =
  | {
      kind: "update";
      title: string;
      message: string;
      confirmText: string;
      payload: {
        id: number;
        status: WorkflowStatus;
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

type ArchiveCategory =
  | "Semua"
  | "Surat Baru"
  | "Surat Menunggu TTD"
  | "Surat Selesai"
  | "Ditolak";

function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "Baru";
    case "diproses":
      return "Proses";
    case "dikirim_ke_kepala_desa":
      return "Menunggu TTD";
    case "perlu_revisi":
      return "Revisi";
    case "ditandatangani":
      return "TTD";
    case "selesai":
      return "Selesai";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
}

function isPermohonanBaruStatus(status: WorkflowStatus): boolean {
  return status === "pending" || status === "diproses" || status === "perlu_revisi";
}

function isMenungguTtdStatus(status: WorkflowStatus): boolean {
  return status === "dikirim_ke_kepala_desa";
}

function isPermohonanSelesaiStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

function matchesArchiveCategory(status: WorkflowStatus, archiveCategory: ArchiveCategory): boolean {
  switch (archiveCategory) {
    case "Surat Baru":
      return isPermohonanBaruStatus(status);
    case "Surat Menunggu TTD":
      return isMenungguTtdStatus(status);
    case "Surat Selesai":
      return isPermohonanSelesaiStatus(status);
    case "Ditolak":
      return status === "ditolak";
    case "Semua":
    default:
      return true;
  }
}

function statusBadgeLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "Baru";
    case "diproses":
      return "Proses";
    case "dikirim_ke_kepala_desa":
      return "Menunggu TTD";
    case "perlu_revisi":
      return "Revisi";
    case "ditandatangani":
      return "TTD";
    case "selesai":
      return "Selesai";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
}

function statusClass(status: WorkflowStatus): string {
  switch (status) {
    case "dikirim_ke_kepala_desa":
      return "status-chip-primary";
    case "ditandatangani":
    case "selesai":
      return "status-chip-success";
    case "ditolak":
      return "status-chip-danger";
    case "perlu_revisi":
      return "status-chip-warning";
    case "pending":
      return "status-chip-info";
    case "diproses":
      return "status-chip-primary";
    default:
      return "status-chip-neutral";
  }
}

function processNote(status: WorkflowStatus, catatan?: string | null): string {
  const note = (catatan || "").trim();
  const lowerNote = note.toLowerCase();

  const isGenericNote =
    !note ||
    lowerNote.includes("status diperbarui oleh") ||
    lowerNote.includes("data diverifikasi admin dan dikirim ke kepala desa") ||
    lowerNote.includes("menunggu verifikasi/tanda tangan kepala desa") ||
    lowerNote.includes("selesai diverifikasi kepala desa") ||
    lowerNote.includes("mohon perbaiki data permohonan sesuai catatan peninjauan kepala desa") ||
    lowerNote.includes("surat telah diverifikasi dan ditandatangani secara digital oleh kepala desa") ||
    lowerNote.includes("menunggu perbaikan dari admin");

  if (status === "dikirim_ke_kepala_desa") {
    return isGenericNote ? "" : note;
  }
  if (status === "ditandatangani" || status === "selesai") {
    return isGenericNote ? "" : note;
  }
  if (status === "perlu_revisi") {
    return isGenericNote ? "" : note;
  }
  if (status === "ditolak") {
    return note ? `Alasan penolakan: ${note}` : "Permohonan ditolak";
  }

  return isGenericNote ? "" : note;
}

function isAttachmentFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/uploads/');
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  const lowerPath = pathValue.toLowerCase();
  return lowerPath.includes('/generated-surat/') || lowerPath.endsWith('.html') || lowerPath.includes('.html?');
}

function resolveAttachmentPaths(item: PermohonanItem): string[] {
  const normalizedFromArray = Array.isArray(item.attachment_paths)
    ? item.attachment_paths
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    : [];

  if (normalizedFromArray.length > 0) {
    return Array.from(new Set(normalizedFromArray));
  }

  return isAttachmentFile(item.file_path) && item.file_path ? [item.file_path] : [];
}

function formatIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
}

export default function PermohonanAdminPage() {
  const [archiveCategory, setArchiveCategory] = useState<ArchiveCategory>("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDayFrom, setSelectedDayFrom] = useState("");
  const [selectedDayTo, setSelectedDayTo] = useState("");
  const [draftDayFrom, setDraftDayFrom] = useState("");
  const [draftDayTo, setDraftDayTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("Data permohonan belum sesuai persyaratan.");
  const [rejectFormError, setRejectFormError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement | null>(null);

  const [permohonan, setPermohonan] = useState<PermohonanItem[]>([]);
  const [expandedRejectReasonIds, setExpandedRejectReasonIds] = useState<number[]>([]);

  const toggleRejectReason = (id: number) => {
    setExpandedRejectReasonIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const fetchPermohonan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/permohonan", { credentials: "include" });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal mengambil data permohonan");
      }

      setPermohonan(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermohonan();
  }, []);

  useEffect(() => {
    if (rejectTargetId === null) return;
    rejectReasonRef.current?.focus();
  }, [rejectTargetId]);

  const performUpdateStatus = async (
    id: number,
    status: WorkflowStatus,
    catatan: string,
    successMessage: string
  ) => {
    try {
      setActionId(id);
      setError(null);
      setNotice(null);

      const response = await fetch(`/api/permohonan/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          catatan,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengubah status");
      }

      setNotice(successMessage);

      await fetchPermohonan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setActionId(null);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: WorkflowStatus,
    catatan: string,
    successMessage: string,
    confirmMessage?: string
  ) => {
    if (confirmMessage) {
      setConfirmDialog({
        kind: "update",
        title: "Konfirmasi Tindakan",
        message: confirmMessage,
        confirmText: "Ya, Lanjutkan",
        payload: { id, status, catatan, successMessage },
      });
      return;
    }

    await performUpdateStatus(id, status, catatan, successMessage);
  };

  const performDelete = async (id: number) => {
    try {
      setDeleteId(id);
      setError(null);
      setNotice(null);

      const response = await fetch(`/api/admin/permohonan/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal menghapus permohonan");
      }

      setNotice(data?.message || "Permohonan berhasil dihapus.");
      await fetchPermohonan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      kind: "delete",
      title: "Konfirmasi Hapus",
      message: "Hapus permohonan ini dari daftar?",
      confirmText: "Ya, Hapus",
      payload: { id },
    });
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
      await performUpdateStatus(id, status, catatan, successMessage);
      setConfirmDialog(null);
      return;
    }

    await performDelete(confirmDialog.payload.id);
    setConfirmDialog(null);
  };

  const openRejectDialog = (id: number) => {
    setRejectTargetId(id);
    setRejectReason("Data permohonan belum sesuai persyaratan.");
    setRejectFormError(null);
  };

  const closeRejectDialog = () => {
    if (rejectTargetId !== null && actionId === rejectTargetId) {
      return;
    }
    setRejectTargetId(null);
    setRejectFormError(null);
  };

  const submitReject = async () => {
    if (rejectTargetId === null) return;

    const alasanTrimmed = rejectReason.trim();
    if (!alasanTrimmed) {
      setRejectFormError("Alasan penolakan wajib diisi.");
      return;
    }

    setRejectFormError(null);
    await handleUpdateStatus(
      rejectTargetId,
      "ditolak",
      alasanTrimmed,
      "Permohonan berhasil ditolak."
    );

    setRejectTargetId(null);
    setRejectFormError(null);
  };

  const filteredPermohonan = useMemo(() => {
    const source = permohonan;

    return source.filter((p) => {
      const matchStatus = matchesArchiveCategory(p.status, archiveCategory);
      const matchSearch =
        p.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.jenis_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm);
      const createdAt = new Date(p.created_at);
      const createdAtValue = Number.isNaN(createdAt.getTime()) ? "" : createdAt.toISOString().slice(0, 10);
      const dayMin = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayFrom : selectedDayTo) : selectedDayFrom;
      const dayMax = selectedDayFrom && selectedDayTo ? (selectedDayFrom <= selectedDayTo ? selectedDayTo : selectedDayFrom) : selectedDayTo;
      const matchDayFrom = !dayMin || (createdAtValue !== "" && createdAtValue >= dayMin);
      const matchDayTo = !dayMax || (createdAtValue !== "" && createdAtValue <= dayMax);
      return matchStatus && matchSearch && matchDayFrom && matchDayTo;
    });
  }, [permohonan, archiveCategory, searchTerm, selectedDayFrom, selectedDayTo]);

  const filterDescription = useMemo(() => {
    if (!selectedDayFrom && !selectedDayTo) return "";
    const start = selectedDayFrom || selectedDayTo;
    const end = selectedDayTo || selectedDayFrom;
    return `Jumlah data dari tanggal ${formatIsoDate(start)} sampai ${formatIsoDate(end)} = ${filteredPermohonan.length} data`;
  }, [selectedDayFrom, selectedDayTo]);

  const hasDateFilter = Boolean(selectedDayFrom || selectedDayTo);

  const isFilterActive =
    searchTerm !== "" ||
    selectedDayFrom !== "" ||
    selectedDayTo !== "";

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

  const groupedPermohonan = useMemo(() => {
    return {
      baru: filteredPermohonan.filter((p) => isPermohonanBaruStatus(p.status)),
      menungguTtd: filteredPermohonan.filter((p) => isMenungguTtdStatus(p.status)),
      selesai: filteredPermohonan.filter((p) => isPermohonanSelesaiStatus(p.status)),
      ditolak: filteredPermohonan.filter((p) => p.status === "ditolak"),
    };
  }, [filteredPermohonan]);

  const groupedSections = useMemo(() => {
    const baseSections = [
      {
        key: "baru",
        title: "Surat Baru",
        subtitle: "Belum dikirim ke Kepala Desa.",
        items: groupedPermohonan.baru,
      },
      {
        key: "menunggu-ttd",
        title: "Surat Menunggu TTD",
        subtitle: "Sudah dikirim, menunggu TTD Kepala Desa.",
        items: groupedPermohonan.menungguTtd,
      },
      {
        key: "selesai",
        title: "Permohonan Selesai",
        subtitle: "Permohonan yang sudah ditandatangani atau selesai diproses.",
        items: groupedPermohonan.selesai,
      },
    ];

    if (archiveCategory === "Semua" || archiveCategory === "Ditolak") {
      baseSections.push({
        key: "ditolak",
        title: "Permohonan Ditolak",
        subtitle: "Arsip permohonan yang ditolak.",
        items: groupedPermohonan.ditolak,
      });
    }

    return baseSections.filter((section) => section.items.length > 0);
  }, [groupedPermohonan, archiveCategory]);

  const stats = {
    menungguVerifikasi: permohonan.filter((p) => p.status === "pending" || p.status === "diproses" || p.status === "perlu_revisi").length,
    dikirimKeKepala: permohonan.filter((p) => p.status === "dikirim_ke_kepala_desa").length,
    selesai: permohonan.filter((p) => p.status === "ditandatangani" || p.status === "selesai").length,
    ditolak: permohonan.filter((p) => p.status === "ditolak").length,
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
              <p className="text-sm font-medium text-gray-500">Surat Baru</p>
              <p className="text-2xl font-bold text-blue-600">{stats.menungguVerifikasi}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Surat Menunggu TTD</p>
              <p className="text-2xl font-bold text-blue-700">{stats.dikirimKeKepala}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai / TTD</p>
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

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Cari nama, NIK, atau jenis surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          <select
            value={archiveCategory}
            onChange={(e) => setArchiveCategory(e.target.value as ArchiveCategory)}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Semua">Semua</option>
            <option value="Surat Baru">Surat Baru</option>
            <option value="Surat Menunggu TTD">Surat Menunggu TTD</option>
            <option value="Surat Selesai">Surat Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyDateFilters}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={resetDateFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
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
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <FiInfo className="h-4 w-4 text-blue-700" />
          <span>{filterDescription.replace(`${filteredPermohonan.length} data`, "")}<strong>{filteredPermohonan.length}</strong> data</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm px-4 py-5 text-center text-sm text-gray-500">
          Memuat data...
        </div>
      ) : groupedSections.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm px-4 py-5 text-center text-sm text-gray-500">
          Belum ada data permohonan
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSections.map((section) => (
            <div key={section.key} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{section.subtitle}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Pemohon</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">NIK</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {section.items.map((p, i) => {
                      const noteText = processNote(p.status, p.catatan);
                      const canToggleRejectReason =
                        p.status === "ditolak" && noteText.startsWith("Alasan penolakan:");
                      const showRejectReason =
                        canToggleRejectReason && expandedRejectReasonIds.includes(p.id);
                      const isFinalizedStatus = p.status === "ditandatangani" || p.status === "selesai";
                      const suratPreviewUrl = `/admin/permohonan/${p.id}/preview`;
                      const suratPreviewLabel = isFinalizedStatus ? "Lihat Surat Final" : "Lihat Draft Surat";

                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{i + 1}</td>
                          <td className="px-4 py-3 font-medium">{p.nomor_surat || `REG-${p.id}/${new Date(p.created_at).getFullYear()}`}</td>
                          <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                          <td className="px-4 py-3 font-medium">{p.nama_pemohon}</td>
                          <td className="px-4 py-3">{p.nik}</td>
                          <td className="px-4 py-3">{p.jenis_surat}</td>
                          <td className="px-4 py-3">{p.keperluan}</td>
                          <td className="px-4 py-3">
                            <div className="flex max-w-[200px] flex-col gap-1">
                              {canToggleRejectReason ? (
                                <button
                                  type="button"
                                  onClick={() => toggleRejectReason(p.id)}
                                  className={`status-chip ${statusClass(p.status)} hover:opacity-85`}
                                  title="Klik untuk lihat/sembunyikan alasan"
                                >
                                  {statusBadgeLabel(p.status)}
                                </button>
                              ) : (
                                <span className={`status-chip ${statusClass(p.status)}`}>
                                  {statusBadgeLabel(p.status)}
                                </span>
                              )}
                              {noteText && p.status !== "ditolak" && (
                                <span className="text-[11px] leading-4 text-gray-500 whitespace-pre-wrap break-words">{noteText}</span>
                              )}
                              {showRejectReason && (
                                <span className="text-[11px] leading-4 text-gray-500 whitespace-pre-wrap break-words">{noteText}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <a
                                href={suratPreviewUrl}
                                className={`aksi-btn ${isFinalizedStatus ? "aksi-btn-success" : "aksi-btn-view"}`}
                              >
                                {isFinalizedStatus ? "Final" : "Draft"}
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5 items-center justify-center">
                              {(p.status === "pending" || p.status === "diproses" || p.status === "perlu_revisi") && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(
                                        p.id,
                                        "dikirim_ke_kepala_desa",
                                        "",
                                        "Permohonan berhasil dikirim ke Kepala Desa.",
                                        "Pastikan data permohonan sudah lengkap dan benar. Kirim ke Kepala Desa sekarang?"
                                      )
                                    }
                                    disabled={actionId === p.id}
                                    className="aksi-btn aksi-btn-primary"
                                  >
                                    Kirim ke Kades
                                  </button>
                                  <button
                                    onClick={() => openRejectDialog(p.id)}
                                    disabled={actionId === p.id}
                                    className="aksi-btn aksi-btn-delete"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {p.status === "dikirim_ke_kepala_desa" && (
                                <span className="status-chip status-chip-primary">
                                  Menunggu TTD
                                </span>
                              )}

                              {(p.status === "ditandatangani" || p.status === "selesai") && (
                                <>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    disabled={deleteId === p.id}
                                    className="aksi-btn aksi-btn-delete"
                                  >
                                    <FiTrash2 className="w-3 h-3" />
                                    {deleteId === p.id ? "Menghapus..." : "Hapus"}
                                  </button>
                                </>
                              )}

                              {p.status === "ditolak" && (
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  disabled={deleteId === p.id}
                                  className="aksi-btn aksi-btn-delete"
                                >
                                  <FiTrash2 className="w-3 h-3" />
                                  {deleteId === p.id ? "Menghapus..." : "Hapus"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={closeRejectDialog}
            className="absolute inset-0 bg-white/70"
          />

          <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Tolak Permohonan</h3>
              <p className="text-sm text-slate-500 mt-1">Masukkan keterangan penolakan agar pemohon mengetahui alasan secara jelas.</p>
            </div>

            <div className="px-5 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan Penolakan</label>
              <textarea
                ref={rejectReasonRef}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectFormError) setRejectFormError(null);
                }}
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400"
                placeholder="Contoh: Foto KTP tidak terbaca, mohon upload ulang dokumen yang jelas."
              />
              {rejectFormError && (
                <p className="mt-2 text-xs text-red-600">{rejectFormError}</p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRejectDialog}
                disabled={actionId === rejectTargetId}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={actionId === rejectTargetId}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionId === rejectTargetId ? "Menyimpan..." : "Tolak Permohonan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={closeConfirmDialog}
            className="absolute inset-0 bg-white/70"
          />

          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">{confirmDialog.title}</h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-slate-700">{confirmDialog.message}</p>
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
