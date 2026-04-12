"use client";

import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiCheckCircle, FiCornerUpLeft, FiEye, FiPenTool, FiRefreshCw, FiTrash2 } from "react-icons/fi";

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

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  const lowerPath = pathValue.toLowerCase();
  return lowerPath.includes("/generated-surat/") || lowerPath.endsWith(".html") || lowerPath.includes(".html?");
}

function isAttachmentFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes("/uploads/");
}

function resolveAttachmentPaths(item: PermohonanItem): string[] {
  const fromApi = Array.isArray(item.attachment_paths)
    ? item.attachment_paths
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    : [];

  if (fromApi.length > 0) {
    return Array.from(new Set(fromApi));
  }

  return isAttachmentFile(item.file_path) && item.file_path ? [item.file_path] : [];
}

function statusLabel(status: WorkflowStatus): string {
  const labels: Record<WorkflowStatus, string> = {
    pending: "Menunggu Verifikasi",
    diproses: "Diproses Admin",
    dikirim_ke_kepala_desa: "Dikirim ke Kepala Desa",
    perlu_revisi: "Perlu Revisi",
    ditandatangani: "Ditandatangani",
    selesai: "Selesai",
    ditolak: "Ditolak",
  };

  return labels[status] ?? status;
}

function statusClass(status: WorkflowStatus): string {
  const classes: Record<WorkflowStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    diproses: "bg-blue-100 text-blue-800",
    dikirim_ke_kepala_desa: "bg-indigo-100 text-indigo-800",
    perlu_revisi: "bg-orange-100 text-orange-800",
    ditandatangani: "bg-green-100 text-green-800",
    selesai: "bg-emerald-100 text-emerald-800",
    ditolak: "bg-red-100 text-red-800",
  };

  return classes[status] ?? "bg-gray-100 text-gray-800";
}

function processNote(status: WorkflowStatus): string {
  if (status === "dikirim_ke_kepala_desa") {
    return "Menunggu verifikasi oleh Kepala Desa";
  }
  if (status === "ditandatangani" || status === "selesai") {
    return "Surat sudah ditandatangani digital dan siap diverifikasi lewat QR";
  }
  if (status === "perlu_revisi") {
    return "Menunggu revisi data dari admin";
  }
  return "";
}

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

export default function KepalaDesaWorkflowClient() {
  const [data, setData] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revisionTargetId, setRevisionTargetId] = useState<number | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionError, setRevisionError] = useState<string | null>(null);

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
          ["dikirim_ke_kepala_desa", "ditandatangani", "selesai", "perlu_revisi"].includes(item.status)
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

  const handleDelete = async (id: number) => {
    try {
      if (!window.confirm("Hapus permohonan ini dari daftar? Data permohonan akan dihapus dari menu ini.")) {
        return;
      }

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

  const handleUpdate = async (
    id: number,
    status: "perlu_revisi" | "ditandatangani" | "selesai",
    catatan: string,
    successMessage: string,
    confirmMessage?: string
  ): Promise<boolean> => {
    try {
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return false;
      }

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

  const openRevisionModal = (id: number) => {
    setRevisionTargetId(id);
    setRevisionError(null);
    setRevisionNote("");
  };

  const closeRevisionModal = () => {
    if (actionId === revisionTargetId) {
      return;
    }

    setRevisionTargetId(null);
    setRevisionError(null);
  };

  const submitRevision = async () => {
    if (revisionTargetId === null) {
      return;
    }

    if (!revisionNote.trim()) {
      setRevisionError("Catatan revisi tidak boleh kosong.");
      return;
    }

    setRevisionError(null);
    const success = await handleUpdate(
      revisionTargetId,
      "perlu_revisi",
      revisionNote,
      "Permohonan berhasil dikembalikan ke admin untuk revisi."
    );

    if (success) {
      setRevisionTargetId(null);
      setRevisionError(null);
    }
  };

  const waitingSignatureCount = useMemo(
    () => data.filter((item) => item.status === "dikirim_ke_kepala_desa").length,
    [data]
  );

  const signedCount = useMemo(
    () =>
      data.filter(
        (item) => (item.status === "ditandatangani" || item.status === "selesai") && isGeneratedSuratFile(item.file_path)
      ).length,
    [data]
  );

  const visibleData = useMemo(() => {
    if (showArchive) {
      return data.filter((item) => isFinalizedStatus(item.status) && isGeneratedSuratFile(item.file_path));
    }
    return data.filter((item) => !(isFinalizedStatus(item.status) && isGeneratedSuratFile(item.file_path)));
  }, [data, showArchive]);

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiCheckCircle className="text-purple-600" /> Permohonan Warga
        </h2>
        <p className="text-gray-500 mt-1">Tinjau, tandatangani digital, atau hapus dari daftar permohonan bila sudah selesai.</p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Menunggu Tanda Tangan</p>
          <p className="text-2xl font-bold text-indigo-700">{waitingSignatureCount}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 shadow-sm p-4">
          <p className="text-sm text-gray-500">Ditandatangani / Selesai</p>
          <p className="text-2xl font-bold text-emerald-700">{signedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-end justify-between gap-3">
          <button
            onClick={() => setShowArchive((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
              showArchive
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <FiArchive className="w-4 h-4" />
            {showArchive ? "Tampilkan Aktif" : "Tampilkan Arsip"}
          </button>
          <button
            onClick={fetchPermohonan}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Menampilkan {visibleData.length} data {showArchive ? "arsip selesai" : "permohonan aktif"}
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
            ) : visibleData.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  {showArchive ? "Belum ada arsip permohonan selesai." : "Tidak ada permohonan aktif untuk ditinjau."}
                </td>
              </tr>
            ) : (
              visibleData.map((item) => {
                const attachmentLinks = resolveAttachmentPaths(item);
                const hasFinalSignedFile = isGeneratedSuratFile(item.file_path);
                const shouldOpenFinalFile = isFinalizedStatus(item.status) && hasFinalSignedFile;
                const suratPreviewUrl = shouldOpenFinalFile
                  ? (item.file_path as string)
                  : `/api/admin/permohonan/${item.id}/preview`;
                const suratPreviewLabel = shouldOpenFinalFile ? "Lihat Surat Final" : "Lihat Draft Surat";

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
                      <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
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
                        onClick={() => window.open(suratPreviewUrl, "_blank")}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        {suratPreviewLabel}
                      </button>

                      {attachmentLinks.length > 0 && (
                        <a
                          href={`/api/admin/permohonan/${item.id}/preview?attachments=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-700 hover:underline"
                        >
                          Lihat Lampiran
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {item.status === "dikirim_ke_kepala_desa" && (
                        <>
                          <button
                            onClick={() => openRevisionModal(item.id)}
                            disabled={actionId === item.id}
                            className="inline-flex items-center gap-1 bg-orange-500 text-white px-2 py-1 text-xs rounded hover:bg-orange-600 disabled:opacity-50"
                          >
                            <FiCornerUpLeft className="w-3.5 h-3.5" />
                            Perlu Revisi
                          </button>
                          <button
                            onClick={() =>
                              handleUpdate(
                                item.id,
                                "selesai",
                                "",
                                "Surat berhasil diverifikasi dan ditandatangani digital.",
                                "Pastikan data surat sudah benar. Lanjut verifikasi + tanda tangan digital sekarang?"
                              )
                            }
                            disabled={actionId === item.id}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            <FiPenTool className="w-3.5 h-3.5" />
                              Verifikasi + TTD Digital
                          </button>
                        </>
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
                          className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Selesaikan
                        </button>
                      )}

                      {(item.status === "perlu_revisi" || item.status === "selesai") && (
                        <>
                          <span className="text-xs text-gray-500">Tidak ada aksi</span>
                          {item.status === "selesai" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdate(
                                    item.id,
                                    "selesai",
                                    "Regenerasi surat final dengan TTD digital dan QR verifikasi oleh Kepala Desa.",
                                    "File final berhasil diperbarui dengan TTD digital + QR verifikasi.",
                                    "Regenerasi file final sekarang? Tindakan ini akan memperbarui QR dan metadata tanda tangan."
                                  )
                                }
                                disabled={actionId === item.id}
                                className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                Regenerasi TTD+QR
                              </button>
                              <button
                                onClick={() => (window.location.href = "/kepala-desa/surat-keluar")}
                                className="bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-700"
                              >
                                Ke Surat Keluar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteId === item.id}
                            className="inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-1 text-xs rounded hover:bg-rose-700 disabled:opacity-50"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            {deleteId === item.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </>
                      )}

                      {item.status === "ditandatangani" && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteId === item.id}
                          className="inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-1 text-xs rounded hover:bg-rose-700 disabled:opacity-50"
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

      {revisionTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Kirim Catatan Revisi</h3>
              <p className="mt-1 text-sm text-gray-500">Tulis arahan revisi untuk admin agar perbaikan lebih jelas.</p>
            </div>

            <div className="px-6 py-4">
              <label htmlFor="revision-note" className="mb-2 block text-sm font-medium text-gray-700">
                Catatan Revisi
              </label>
              <textarea
                id="revision-note"
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Contoh: Mohon perbaiki NIK almarhum dan lengkapi dokumen pendukung."
                disabled={actionId === revisionTargetId}
              />

              {revisionError && <p className="mt-2 text-sm text-red-600">{revisionError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeRevisionModal}
                disabled={actionId === revisionTargetId}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void submitRevision()}
                disabled={actionId === revisionTargetId}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId === revisionTargetId ? "Mengirim..." : "Kirim Revisi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
