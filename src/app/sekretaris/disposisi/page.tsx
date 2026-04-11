"use client";

import { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiEye, FiCheck, FiClock, FiDownload } from "react-icons/fi";

interface DisposisiRow {
  id: number;
  surat_masuk_id: string;
  tujuan_role: string;
  tujuan_label?: string | null;
  status: string;
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
}

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

export default function SekretarisDisposisiPage() {
  const [disposisi, setDisposisi] = useState<DisposisiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalDisposisi = disposisi.length;
  const menungguCount = useMemo(
    () => disposisi.filter((item) => (item.status || "").toLowerCase() === "didisposisikan").length,
    [disposisi]
  );
  const selesaiCount = useMemo(
    () => disposisi.filter((item) => (item.status || "").toLowerCase() === "selesai").length,
    [disposisi]
  );

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiArrowRight className="text-blue-600" /> Disposisi Surat
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola disposisi surat masuk ke pihak terkait
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Surat masuk yang didisposisikan Kepala Desa ke Sekretaris. Lanjutkan disposisi ke unit terkait dari halaman kerja Sekretaris.
        </div>
        <button onClick={fetchDisposisi} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Disposisi</p>
              <p className="text-2xl font-bold text-gray-900">{totalDisposisi}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiArrowRight className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu</p>
              <p className="text-2xl font-bold text-orange-600">
                {menungguCount}
              </p>
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
              <p className="text-2xl font-bold text-blue-600">
                {menungguCount}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="inline-block w-10 h-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">WAIT</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-green-600">
                {selesaiCount}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <FiCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data disposisi...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : disposisi.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada disposisi surat masuk dari Kepala Desa.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Disposisi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Dari</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan Awal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Instruksi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {disposisi.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.nomor_surat || "-"}</td>
                  <td className="px-4 py-3">{formatDate(item.disposed_at)}</td>
                  <td className="px-4 py-3">{item.perihal || "-"}</td>
                  <td className="px-4 py-3">{item.disposed_by_name || "Kepala Desa"}</td>
                  <td className="px-4 py-3">{item.tujuan_label || item.tujuan_role || "-"}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="truncate" title={item.catatan || "-"}>
                      {item.catatan || "Tidak ada catatan"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {item.status || "didisposisikan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.file_path ? (
                        <>
                          <button
                            type="button"
                            onClick={() => window.open(item.file_path as string, "_blank")}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(item.file_path as string, "_blank")}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada file</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
