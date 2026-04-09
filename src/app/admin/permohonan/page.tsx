"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiArchive, FiRefreshCw, FiTrash2 } from "react-icons/fi";

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

function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "Menunggu Verifikasi";
    case "diproses":
      return "Diproses Admin";
    case "dikirim_ke_kepala_desa":
      return "Menunggu Konfirmasi Kepala Desa";
    case "perlu_revisi":
      return "Perlu Revisi";
    case "ditandatangani":
      return "Ditandatangani";
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
      return "bg-indigo-100 text-indigo-800";
    case "ditandatangani":
    case "selesai":
      return "bg-green-100 text-green-800";
    case "ditolak":
      return "bg-red-100 text-red-800";
    case "perlu_revisi":
      return "bg-orange-100 text-orange-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "diproses":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function processNote(status: WorkflowStatus, catatan?: string | null): string {
  if (status === "dikirim_ke_kepala_desa") {
    return "Menunggu verifikasi/tanda tangan Kepala Desa";
  }
  if (status === "ditandatangani" || status === "selesai") {
    return "Selesai diverifikasi Kepala Desa";
  }
  if (status === "perlu_revisi") {
    return "Menunggu perbaikan dari admin";
  }
  if (status === "ditolak") {
    const note = (catatan || "").trim();
    return note ? `Alasan penolakan: ${note}` : "Permohonan ditolak";
  }
  return "";
}

function isAttachmentFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/uploads/');
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

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

export default function PermohonanAdminPage() {
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("Data permohonan belum sesuai persyaratan.");
  const [rejectFormError, setRejectFormError] = useState<string | null>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement | null>(null);

  const [permohonan, setPermohonan] = useState<PermohonanItem[]>([]);

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

  const handleUpdateStatus = async (
    id: number,
    status: WorkflowStatus,
    catatan: string,
    successMessage: string,
    confirmMessage?: string
  ) => {
    try {
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
      }

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

  const handleDelete = async (id: number) => {
    try {
      if (!window.confirm("Hapus permohonan ini dari daftar?")) {
        return;
      }

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
    const source = showArchive
      ? permohonan
      : permohonan.filter((p) => !isFinalizedStatus(p.status));

    return source.filter((p) => {
      const label = statusLabel(p.status);
      const matchStatus = filterStatus === "Semua" || label === filterStatus;
      const matchSearch =
        p.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.jenis_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm);
      const month = new Date(p.created_at).getMonth() + 1;
      const matchMonth = selectedMonth === "" || month === Number(selectedMonth);
      return matchStatus && matchSearch && matchMonth;
    });
  }, [permohonan, showArchive, filterStatus, searchTerm, selectedMonth]);

  const stats = {
    menungguVerifikasi: permohonan.filter((p) => p.status === "pending" || p.status === "diproses").length,
    dikirimKeKepala: permohonan.filter((p) => p.status === "dikirim_ke_kepala_desa").length,
    perluRevisi: permohonan.filter((p) => p.status === "perlu_revisi").length,
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.menungguVerifikasi}</p>
            </div>
            <div className="bg-yellow-100 text-yellow-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              WAIT
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Konfirmasi Kepala Desa</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.dikirimKeKepala}</p>
            </div>
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              SENT
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Perlu Revisi</p>
              <p className="text-2xl font-bold text-orange-600">{stats.perluRevisi}</p>
            </div>
            <div className="bg-orange-100 text-orange-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              REV
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai / Ditandatangani</p>
              <p className="text-2xl font-bold text-green-600">{stats.selesai}</p>
            </div>
            <div className="bg-green-100 text-green-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
              DONE
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Cari nama, NIK, atau jenis surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option>Semua</option>
            <option>Menunggu Verifikasi</option>
            <option>Diproses Admin</option>
            <option>Menunggu Konfirmasi Kepala Desa</option>
            <option>Perlu Revisi</option>
            <option>Ditandatangani</option>
            <option>Selesai</option>
            <option>Ditolak</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchive((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
                showArchive
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <FiArchive className="w-4 h-4" />
              {showArchive ? "Mode Aktif" : "Mode Arsip"}
            </button>
            <button onClick={fetchPermohonan} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              <FiRefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Menampilkan {filteredPermohonan.length} data {showArchive ? "arsip/riwayat" : "permohonan aktif"}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Pemohon</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">NIK</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={10}>Memuat data...</td>
              </tr>
            ) : filteredPermohonan.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={10}>Belum ada data permohonan</td>
              </tr>
            ) : (
              filteredPermohonan.map((p, i) => {
                const attachmentLinks = resolveAttachmentPaths(p);

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
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${statusClass(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                      {processNote(p.status, p.catatan) && (
                        <span className="text-[11px] text-gray-500 whitespace-pre-wrap break-words">{processNote(p.status, p.catatan)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <a
                        href={`/api/admin/permohonan/${p.id}/preview?mode=admin`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Lihat Draft Surat
                      </a>

                      {attachmentLinks.length > 0 && (
                        <a
                          href={`/api/admin/permohonan/${p.id}/preview?mode=admin&attachments=1`}
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
                    <div className="flex gap-1 justify-center flex-wrap">
                      <button
                        onClick={() => window.open(`/api/admin/permohonan/${p.id}/preview?mode=admin`, "_blank")}
                        className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
                      >
                        Lihat/Edit
                      </button>

                      {(p.status === "pending" || p.status === "diproses" || p.status === "perlu_revisi") && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                p.id,
                                "dikirim_ke_kepala_desa",
                                "Data diverifikasi admin dan dikirim ke Kepala Desa untuk proses tanda tangan.",
                                "Permohonan berhasil dikirim ke Kepala Desa.",
                                "Pastikan data permohonan sudah lengkap dan benar. Kirim ke Kepala Desa sekarang?"
                              )
                            }
                            disabled={actionId === p.id}
                            className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            Kirim ke Kepala Desa
                          </button>
                          <button
                            onClick={() => openRejectDialog(p.id)}
                            disabled={actionId === p.id}
                            className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </>
                      )}

                      {p.status === "dikirim_ke_kepala_desa" && (
                        <span className="text-xs text-indigo-600 px-2 py-1">Menunggu Tanda Tangan Kepala Desa</span>
                      )}

                      {(p.status === "ditandatangani" || p.status === "selesai") && (
                        <>
                          <span className="text-xs text-green-600 px-2 py-1">Final</span>
                          <button
                            onClick={() => (window.location.href = "/admin/surat-keluar")}
                            className="bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-700"
                          >
                            Ke Surat Keluar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleteId === p.id}
                            className="inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-1 text-xs rounded hover:bg-rose-700 disabled:opacity-50"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            {deleteId === p.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </>
                      )}

                      {p.status === "ditolak" && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteId === p.id}
                          className="inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-1 text-xs rounded hover:bg-rose-700 disabled:opacity-50"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          {deleteId === p.id ? "Menghapus..." : "Hapus"}
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
    </section>
  );
}
