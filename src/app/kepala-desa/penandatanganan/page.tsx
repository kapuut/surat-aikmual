"use client";

import { useEffect, useState } from "react";
import { FiEdit, FiEye, FiPenTool } from "react-icons/fi";

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
  jenis_surat: string;
  keperluan: string;
  status: WorkflowStatus;
}

export default function KepalaDesaPenandatangananPage() {
  const [data, setData] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/permohonan", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data penandatanganan");
      }

      const rows = (result.data || []) as PermohonanItem[];
      setData(rows.filter((item) => item.status === "dikirim_ke_kepala_desa" || item.status === "ditandatangani"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSign = async (id: number, status: "ditandatangani" | "selesai") => {
    try {
      const confirmMessage =
        status === "ditandatangani"
          ? "Lanjutkan proses tanda tangan digital untuk surat ini?"
          : "Tandai surat ini sebagai selesai?";

      if (!window.confirm(confirmMessage)) {
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
          catatan:
            status === "ditandatangani"
              ? "Surat telah ditandatangani secara digital oleh Kepala Desa."
              : "Permohonan selesai setelah penandatanganan.",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal memperbarui status surat");
      }

      setNotice(status === "ditandatangani" ? "Surat berhasil ditandatangani." : "Surat berhasil ditandai selesai.");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses tanda tangan");
    } finally {
      setActionId(null);
    }
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiEdit className="text-purple-600" /> Penandatanganan Surat
        </h2>
        <p className="text-gray-500 mt-1">Tandatangani surat yang sudah disetujui</p>
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

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pemohon</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">File Surat</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-5 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-5 text-center text-gray-500">
                  Tidak ada surat yang menunggu penandatanganan.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {item.nomor_surat || `REG-${item.id}/${new Date(item.created_at).getFullYear()}`}
                  </td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">{item.nama_pemohon}</td>
                  <td className="px-4 py-3">{item.jenis_surat}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "dikirim_ke_kepala_desa"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.status === "dikirim_ke_kepala_desa" ? "Menunggu Tanda Tangan" : "Ditandatangani"}
                    </span>
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
                        <button
                          onClick={() => handleSign(item.id, "ditandatangani")}
                          disabled={actionId === item.id}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          <FiPenTool className="w-3.5 h-3.5" />
                          Tandatangani
                        </button>
                      )}

                      {item.status === "ditandatangani" && (
                        <button
                          onClick={() => handleSign(item.id, "selesai")}
                          disabled={actionId === item.id}
                          className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Selesai
                        </button>
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
