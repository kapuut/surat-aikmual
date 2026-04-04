"use client";

import { useEffect, useState } from "react";
import { FiInbox, FiDownload, FiEye, FiFilter } from "react-icons/fi";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file_path?: string;
}

export default function SekretarisSuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuratMasuk = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/admin/surat-masuk", { credentials: "include" });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data surat masuk");
        }

        setSuratMasuk(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchSuratMasuk();
  }, []);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-blue-600" /> Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola surat masuk yang diterima oleh kantor desa
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Semua Status</option>
            <option>Belum Dibaca</option>
            <option>Sudah Dibaca</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Semua Prioritas</option>
            <option>Urgent</option>
            <option>Normal</option>
          </select>
          <button className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Tambah Surat Masuk
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surat Masuk</p>
              <p className="text-2xl font-bold text-gray-900">{suratMasuk.length}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiInbox className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Belum Dibaca</p>
              <p className="text-2xl font-bold text-orange-600">
                {suratMasuk.length}
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <span className="text-xl">📬</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-red-600">
                0
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <span className="text-xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data surat masuk...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : suratMasuk.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data surat masuk.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tgl Terima</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tgl Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suratMasuk.map((surat, i) => (
                <tr key={surat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{surat.nomor_surat}</td>
                  <td className="px-4 py-3">{formatDate(surat.tanggal_terima)}</td>
                  <td className="px-4 py-3">{formatDate(surat.tanggal_surat)}</td>
                  <td className="px-4 py-3">{surat.asal_surat}</td>
                  <td className="px-4 py-3">{surat.perihal}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      {surat.file_path ? (
                        <>
                          <button
                            onClick={() => window.open(surat.file_path as string, "_blank")}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(surat.file_path as string, "_blank")}
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
