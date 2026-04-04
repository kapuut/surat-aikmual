"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiCornerUpLeft, FiEye, FiPenTool } from "react-icons/fi";

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
  created_at: string;
  nama_pemohon: string;
  nik: string;
  jenis_surat: string;
  keperluan: string;
  status: WorkflowStatus;
  catatan: string | null;
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
    return "Selesai diverifikasi dan siap arsip surat keluar";
  }
  if (status === "perlu_revisi") {
    return "Menunggu revisi data dari admin";
  }
  return "";
}

export default function KepalaDesaWorkflowClient() {
  const [data, setData] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
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
        rows.filter((item) =>
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

  const handleUpdate = async (
    id: number,
    status: "perlu_revisi" | "ditandatangani" | "selesai",
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
        body: JSON.stringify({ status, catatan }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal memperbarui status");
      }

      setNotice(successMessage);
      await fetchPermohonan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui status");
    } finally {
      setActionId(null);
    }
  };

  const waitingSignatureCount = useMemo(
    () => data.filter((item) => item.status === "dikirim_ke_kepala_desa").length,
    [data]
  );

  const signedCount = useMemo(
    () => data.filter((item) => item.status === "ditandatangani" || item.status === "selesai").length,
    [data]
  );

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiCheckCircle className="text-purple-600" /> Permohonan Warga
        </h2>
        <p className="text-gray-500 mt-1">Tinjau, tandatangani digital, atau kembalikan permohonan untuk revisi.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Menunggu Tanda Tangan</p>
          <p className="text-2xl font-bold text-indigo-600">{waitingSignatureCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Ditandatangani / Selesai</p>
          <p className="text-2xl font-bold text-green-600">{signedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-end">
          <button
            onClick={fetchPermohonan}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            Refresh Data
          </button>
        </div>
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
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  Tidak ada permohonan untuk ditinjau.
                </td>
              </tr>
            ) : (
              data.map((item) => (
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
                    {item.file_path ? (
                      <button
                        onClick={() => window.open(item.file_path as string, "_blank")}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        Lihat Surat
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Belum ada file</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {item.status === "dikirim_ke_kepala_desa" && (
                        <>
                          <button
                            onClick={() => {
                              const revisiNote = window.prompt(
                                "Masukkan catatan revisi untuk admin:",
                                "Mohon perbaiki data permohonan sesuai catatan peninjauan Kepala Desa."
                              );

                              if (revisiNote === null) return;
                              if (!revisiNote.trim()) {
                                window.alert("Catatan revisi tidak boleh kosong.");
                                return;
                              }

                              void handleUpdate(
                                item.id,
                                "perlu_revisi",
                                revisiNote,
                                "Permohonan berhasil dikembalikan ke admin untuk revisi."
                              );
                            }}
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
                                "ditandatangani",
                                "Surat telah ditandatangani secara digital oleh Kepala Desa.",
                                "Surat berhasil ditandatangani.",
                                "Pastikan surat sudah sesuai. Lanjut tandatangani sekarang?"
                              )
                            }
                            disabled={actionId === item.id}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            <FiPenTool className="w-3.5 h-3.5" />
                            Tandatangani
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
                            <button
                              onClick={() => (window.location.href = "/kepala-desa/surat-keluar")}
                              className="bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-700"
                            >
                              Ke Surat Keluar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
