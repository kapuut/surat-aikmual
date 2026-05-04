"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiClock,
  FiDownload,
  FiEye,
  FiTrash2,
  FiX,
} from "react-icons/fi";

interface DisposisiRow {
  id: number;
  surat_masuk_id: string;
  tujuan_role: string;
  tujuan_label?: string | null;
  status: string;
  urgensi?: string | null;
  catatan?: string | null;
  disposed_at?: string | null;
  disposed_by_name?: string | null;
  disposed_by_role?: string | null;
  nomor_surat?: string | null;
  tanggal_surat?: string | null;
  tanggal_terima?: string | null;
  asal_surat?: string | null;
  perihal?: string | null;
  file_path?: string | null;
  status_penanganan?: string | null;
  catatan_penanganan?: string | null;
}

type ConfirmDialogState = {
  kind: "delete" | "update";
  title: string;
  message: string;
  confirmText: string;
  payload: {
    id: number;
    status?: "didisposisikan" | "diproses" | "selesai";
  };
};

type ProsesFilter = "semua" | "belum_diproses" | "sudah_diproses";

type PreviewKind = "pdf" | "image" | "docx" | "doc" | "unsupported" | "missing";

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getFileNameFromPath(filePath?: string | null): string {
  if (!filePath) return "-";
  const segments = filePath.split("/");
  return segments[segments.length - 1] || filePath;
}

function detectPreviewKind(filePath: string | null | undefined): PreviewKind {
  if (!filePath) return "missing";

  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.endsWith(".pdf") || /\.(html|htm|xhtml)$/i.test(normalizedPath)) {
    return "pdf";
  }

  if (/\.(png|jpg|jpeg|webp|gif)$/i.test(normalizedPath)) {
    return "image";
  }

  if (normalizedPath.endsWith(".docx")) {
    return "docx";
  }

  if (normalizedPath.endsWith(".doc")) {
    return "doc";
  }

  return "unsupported";
}

function normalizeStatus(value?: string | null): "didisposisikan" | "diproses" | "selesai" {
  const status = String(value || "").trim().toLowerCase();
  if (status === "selesai") return "selesai";
  if (status === "diproses") return "diproses";
  return "didisposisikan";
}

function statusLabel(value?: string | null): string {
  const status = normalizeStatus(value);
  if (status === "diproses") return "diproses";
  if (status === "selesai") return "selesai";
  return "didisposisikan";
}

function statusClass(value?: string | null): string {
  const status = normalizeStatus(value);
  if (status === "diproses") return "bg-blue-100 text-blue-800";
  if (status === "selesai") return "bg-emerald-100 text-emerald-800";
  return "bg-orange-100 text-orange-800";
}

function normalizeUrgensi(value?: string | null): "tinggi" | "sedang" | "rendah" {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "tinggi") return "tinggi";
  if (raw === "rendah") return "rendah";
  return "sedang";
}

function urgensiClass(value?: string | null): string {
  const urgensi = normalizeUrgensi(value);
  if (urgensi === "tinggi") return "bg-red-100 text-red-800";
  if (urgensi === "rendah") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

function urgensiLabel(value?: string | null): string {
  const urgensi = normalizeUrgensi(value);
  return urgensi.charAt(0).toUpperCase() + urgensi.slice(1);
}

export default function SekretarisDisposisiPage() {
  const [disposisi, setDisposisi] = useState<DisposisiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<DisposisiRow | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [prosesFilter, setProsesFilter] = useState<ProsesFilter>("semua");

  const fetchDisposisi = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sekretaris/disposisi-surat-masuk", {
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data disposisi");
      }

      setDisposisi(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat disposisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisposisi();
  }, []);

  const handleDeleteDisposisi = (item: DisposisiRow) => {
    setConfirmDialog({
      kind: "delete",
      title: "Hapus Disposisi",
      message: `Hapus disposisi untuk surat ${item.nomor_surat || "-"}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus",
      payload: { id: item.id },
    });
  };

  const performDeleteDisposisi = async (id: number) => {
    try {
      setDeletingId(id);
      setError(null);
      setNotice(null);

      const response = await fetch("/api/sekretaris/disposisi-surat-masuk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal menghapus disposisi");
      }

      setNotice(result?.message || "Disposisi berhasil dihapus.");
      setDisposisi((prev) => prev.filter((row) => row.id !== id));
      if (detailItem?.id === id) {
        setDetailItem(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus disposisi");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = (item: DisposisiRow, status: "diproses" | "selesai") => {
    setConfirmDialog({
      kind: "update",
      title: status === "selesai" ? "Tandai Selesai" : "Tandai Diproses",
      message:
        status === "selesai"
          ? "Surat ini sudah selesai ditindaklanjuti oleh Sekretaris?"
          : "Pindahkan surat ini ke status diproses?",
      confirmText: status === "selesai" ? "Ya, Selesai" : "Ya, Diproses",
      payload: { id: item.id, status },
    });
  };

  const performUpdateStatus = async (id: number, status: "didisposisikan" | "diproses" | "selesai") => {
    try {
      setUpdatingId(id);
      setError(null);
      setNotice(null);

      const response = await fetch("/api/sekretaris/disposisi-surat-masuk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memperbarui status disposisi");
      }

      setNotice(result?.message || "Status disposisi berhasil diperbarui.");
      await fetchDisposisi();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  };

  const closeConfirmDialog = () => {
    const busyDelete = confirmDialog?.kind === "delete" && deletingId === confirmDialog.payload.id;
    const busyUpdate = confirmDialog?.kind === "update" && updatingId === confirmDialog.payload.id;
    if (busyDelete || busyUpdate) return;
    setConfirmDialog(null);
  };

  const submitConfirmDialog = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.kind === "delete") {
      await performDeleteDisposisi(confirmDialog.payload.id);
      setConfirmDialog(null);
      return;
    }

    if (confirmDialog.payload.status) {
      await performUpdateStatus(confirmDialog.payload.id, confirmDialog.payload.status);
    }
    setConfirmDialog(null);
  };

  const totalDisposisi = disposisi.length;
  const menungguCount = useMemo(
    () => disposisi.filter((item) => normalizeStatus(item.status) === "didisposisikan").length,
    [disposisi]
  );
  const diprosesCount = useMemo(
    () => disposisi.filter((item) => normalizeStatus(item.status) === "diproses").length,
    [disposisi]
  );
  const selesaiCount = useMemo(
    () => disposisi.filter((item) => normalizeStatus(item.status) === "selesai").length,
    [disposisi]
  );

  const filteredDisposisi = useMemo(() => {
    if (prosesFilter === "semua") {
      return disposisi;
    }

    if (prosesFilter === "belum_diproses") {
      return disposisi.filter((item) => normalizeStatus(item.status) === "didisposisikan");
    }

    return disposisi.filter((item) => {
      const status = normalizeStatus(item.status);
      return status === "diproses" || status === "selesai";
    });
  }, [disposisi, prosesFilter]);

  const detailPreviewKind = useMemo(() => detectPreviewKind(detailItem?.file_path), [detailItem?.file_path]);
  const detailFileName = useMemo(() => getFileNameFromPath(detailItem?.file_path), [detailItem?.file_path]);

  return (
    <section>
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-proses" className="text-sm font-medium text-slate-600">
            Filter Proses:
          </label>
          <select
            id="filter-proses"
            value={prosesFilter}
            onChange={(event) => setProsesFilter(event.target.value as ProsesFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="semua">Semua</option>
            <option value="belum_diproses">Belum Diproses</option>
            <option value="sudah_diproses">Sudah Diproses</option>
          </select>
        </div>

        <button
          onClick={fetchDisposisi}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Disposisi</p>
              <p className="text-2xl font-bold text-gray-900">{totalDisposisi}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiEye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu</p>
              <p className="text-2xl font-bold text-orange-600">{menungguCount}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <FiClock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dalam Proses</p>
              <p className="text-2xl font-bold text-blue-600">{diprosesCount}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                PROSES
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-emerald-600">{selesaiCount}</p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-full">
              <FiCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data disposisi...</div>
        ) : filteredDisposisi.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {prosesFilter === "semua"
              ? "Belum ada disposisi surat masuk dari Kepala Desa."
              : "Tidak ada surat yang sesuai dengan filter proses ini."}
          </div>
        ) : (
          <table className="w-full text-xs sm:text-sm table-auto border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left font-bold text-gray-700 w-10">No</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-36">No Surat</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-28">Tgl Disposisi</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[200px]">Perihal</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-20">Urgensi</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 max-w-[120px]">Dari</th>
                <th className="px-3 py-3 text-left font-bold text-gray-700 w-24">Status</th>
                <th className="px-2 py-3 text-center font-bold text-gray-700 w-72">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDisposisi.map((item, i) => {
                const normalized = normalizeStatus(item.status);
                return (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-2 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900 break-words">{item.nomor_surat || "-"}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{formatDate(item.disposed_at)}</td>
                    <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate" title={item.perihal || "-"}>{item.perihal || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${urgensiClass(item.urgensi)}`}>
                        {urgensiLabel(item.urgensi)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 max-w-[120px] truncate" title={item.disposed_by_name || "Kepala Desa"}>
                      {item.disposed_by_name || "Kepala Desa"}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                          title="Lihat detail surat"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          Detail
                        </button>

                        {item.file_path ? (
                          <a
                            href={item.file_path}
                            download={getFileNameFromPath(item.file_path)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-all shadow-sm"
                            title="Unduh file"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Unduh
                          </a>
                        ) : null}

                        {normalized !== "selesai" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item, "selesai")}
                            disabled={updatingId === item.id}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 border border-indigo-200 transition-all shadow-sm disabled:opacity-50"
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                            Selesai
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDisposisi(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold hover:bg-rose-100 border border-rose-200 transition-all shadow-sm disabled:opacity-50"
                          title="Hapus disposisi"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6">
          <button
            type="button"
            aria-label="Tutup detail"
            onClick={() => setDetailItem(null)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <div className="relative z-10 max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Detail Disposisi Surat</h3>
                <p className="text-sm text-slate-500">Nomor surat: {detailItem.nomor_surat || "-"}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(95vh-72px)] overflow-y-auto p-5 md:p-6">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Perihal</p>
                  <p className="text-sm font-medium text-slate-800">{detailItem.perihal || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Asal Surat</p>
                  <p className="text-sm font-medium text-slate-800">{detailItem.asal_surat || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Urgensi</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${urgensiClass(detailItem.urgensi)}`}>
                    {urgensiLabel(detailItem.urgensi)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(detailItem.status)}`}>
                    {statusLabel(detailItem.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal Surat</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(detailItem.tanggal_surat)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal Terima</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(detailItem.tanggal_terima)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Didisposisikan Oleh</p>
                  <p className="text-sm font-medium text-slate-800">{detailItem.disposed_by_name || "Kepala Desa"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tanggal Disposisi</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(detailItem.disposed_at)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Catatan Kepala Desa</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{detailItem.catatan || "Tidak ada catatan"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Catatan Tindak Lanjut Sekretaris</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{detailItem.catatan_penanganan || "Belum ada catatan tindak lanjut"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">Nama file: {detailFileName}</p>
                  {detailItem.file_path ? (
                    <div className="flex gap-2">
                      <a
                        href={detailItem.file_path}
                        download={detailFileName}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <FiDownload className="h-4 w-4" /> Unduh
                      </a>
                      <a
                        href={detailItem.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <FiEye className="h-4 w-4" /> Buka File Asli
                      </a>
                    </div>
                  ) : null}
                </div>

                {detailPreviewKind === "pdf" && detailItem.file_path ? (
                  <iframe
                    src={detailItem.file_path}
                    title={`Preview surat ${detailItem.nomor_surat || ""}`}
                    className="min-h-[72vh] w-full rounded-lg border border-slate-200 bg-slate-100"
                  />
                ) : null}

                {detailPreviewKind === "image" && detailItem.file_path ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <img src={detailItem.file_path} alt={detailItem.perihal || "Preview surat"} className="mx-auto max-w-full rounded-md" />
                  </div>
                ) : null}

                {(detailPreviewKind === "doc" || detailPreviewKind === "docx") && detailItem.file_path ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <object
                      data={detailItem.file_path}
                      type={detailPreviewKind === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/msword"}
                      className="min-h-[72vh] w-full"
                    >
                      <div className="p-4 text-sm text-slate-600">
                        Browser tidak mendukung preview Word langsung. Gunakan tombol <strong>Buka File Asli</strong> atau <strong>Unduh</strong>.
                      </div>
                    </object>
                  </div>
                ) : null}

                {(detailPreviewKind === "unsupported" || detailPreviewKind === "missing") && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    File belum tersedia atau jenis file belum didukung untuk preview langsung.
                  </div>
                )}
              </div>
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
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">{confirmDialog.title}</h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-700">{confirmDialog.message}</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={
                  (confirmDialog.kind === "delete" && deletingId === confirmDialog.payload.id) ||
                  (confirmDialog.kind === "update" && updatingId === confirmDialog.payload.id)
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitConfirmDialog}
                disabled={
                  (confirmDialog.kind === "delete" && deletingId === confirmDialog.payload.id) ||
                  (confirmDialog.kind === "update" && updatingId === confirmDialog.payload.id)
                }
                className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${
                  confirmDialog.kind === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmDialog.kind === "delete" && deletingId === confirmDialog.payload.id
                  ? "Menghapus..."
                  : confirmDialog.kind === "update" && updatingId === confirmDialog.payload.id
                    ? "Menyimpan..."
                    : confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
