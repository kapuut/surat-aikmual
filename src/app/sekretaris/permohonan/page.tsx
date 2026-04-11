"use client";

import { useEffect, useMemo, useState } from "react";
import { FiFileText, FiEye, FiCheck, FiX, FiFilter, FiRefreshCw } from "react-icons/fi";

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
  jenis_surat: string;
  status: WorkflowStatus;
}

function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending":
      return "Menunggu Verifikasi";
    case "diproses":
      return "Diproses";
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
    case "pending":
      return "bg-orange-100 text-orange-800";
    case "diproses":
      return "bg-blue-100 text-blue-800";
    case "dikirim_ke_kepala_desa":
      return "bg-indigo-100 text-indigo-800";
    case "perlu_revisi":
      return "bg-yellow-100 text-yellow-800";
    case "ditandatangani":
    case "selesai":
      return "bg-green-100 text-green-800";
    case "ditolak":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function nomorPermohonan(item: PermohonanItem): string {
  if (item.nomor_surat && item.nomor_surat.trim()) {
    return item.nomor_surat.trim();
  }

  const year = new Date(item.created_at).getFullYear();
  return `REG-${item.id}/${year}`;
}

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

export default function SekretarisPermohonanPage() {
  const [permohonan, setPermohonan] = useState<PermohonanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterJenisSurat, setFilterJenisSurat] = useState("Semua Jenis Surat");

  const fetchPermohonan = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/permohonan", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal mengambil data permohonan");
      }

      setPermohonan(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermohonan();
  }, []);

  const statusOptions = [
    "Semua Status",
    "Menunggu Verifikasi",
    "Diproses",
    "Menunggu Konfirmasi Kepala Desa",
    "Perlu Revisi",
    "Ditandatangani",
    "Selesai",
    "Ditolak",
  ];

  const jenisSuratOptions = useMemo(() => {
    const uniqueJenis = Array.from(
      new Set(
        permohonan
          .map((item) => String(item.jenis_surat || "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b, "id"));

    return ["Semua Jenis Surat", ...uniqueJenis];
  }, [permohonan]);

  const filteredPermohonan = useMemo(() => {
    return permohonan.filter((item) => {
      const statusMatch =
        filterStatus === "Semua Status" || statusLabel(item.status) === filterStatus;

      const jenisMatch =
        filterJenisSurat === "Semua Jenis Surat" || item.jenis_surat === filterJenisSurat;

      return statusMatch && jenisMatch;
    });
  }, [permohonan, filterJenisSurat, filterStatus]);

  const totalMenungguVerifikasi = permohonan.filter((item) => {
    return (
      item.status === "pending" ||
      item.status === "diproses" ||
      item.status === "dikirim_ke_kepala_desa" ||
      item.status === "perlu_revisi"
    );
  }).length;

  const totalDisetujui = permohonan.filter((item) => {
    return item.status === "ditandatangani" || item.status === "selesai";
  }).length;

  const totalDitolak = permohonan.filter((item) => item.status === "ditolak").length;

  return (
    <section>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiFileText className="text-blue-600" /> Permohonan Surat
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola permohonan surat dari masyarakat
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={filterJenisSurat}
            onChange={(event) => setFilterJenisSurat(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {jenisSuratOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <button
            onClick={fetchPermohonan}
            className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            <FiRefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
          <div className="hidden items-center rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 md:flex">
            <FiFilter className="mr-2 h-4 w-4" />
            Filter aktif: {filteredPermohonan.length} data
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Permohonan</p>
              <p className="text-2xl font-bold text-gray-900">{permohonan.length}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiFileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalMenungguVerifikasi}
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <span className="inline-block w-10 h-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">WAIT</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">
                {totalDisetujui}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <FiCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">
                {totalDitolak}
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <FiX className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No Permohonan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pemohon</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  Memuat data permohonan...
                </td>
              </tr>
            ) : filteredPermohonan.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-center text-gray-500" colSpan={7}>
                  Belum ada data permohonan
                </td>
              </tr>
            ) : (
              filteredPermohonan.map((item, i) => {
                const isFinalized = isFinalizedStatus(item.status);
                const previewUrl = isFinalized
                  ? `/api/admin/permohonan/${item.id}/preview`
                  : `/api/admin/permohonan/${item.id}/preview?mode=admin`;

                return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{nomorPermohonan(item)}</td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">{item.nama_pemohon}</td>
                  <td className="px-4 py-3">{item.jenis_surat}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => window.open(previewUrl, "_blank")}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        title={isFinalized ? "Lihat surat final" : "Lihat draft surat"}
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
