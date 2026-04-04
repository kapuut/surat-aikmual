"use client";

import { useEffect, useState } from "react";
import { FiSend, FiDownload, FiEye, FiFilter } from "react-icons/fi";

interface SuratKeluarItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
  file_path: string | null;
}

export default function SekretarisSuratKeluarPage() {
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuratKeluar = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/surat-keluar", { credentials: "include" });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Gagal memuat data surat keluar");
      }

      setSuratKeluar(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuratKeluar();
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
          <FiSend className="text-blue-600" /> Surat Keluar
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola surat keluar yang dikirim oleh kantor desa
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Semua Status</option>
            <option>Menunggu TTD</option>
            <option>Terkirim</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Semua Tujuan</option>
            <option>Kecamatan</option>
            <option>Dinas</option>
            <option>BPD</option>
          </select>
          <button className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Buat Surat Keluar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surat Keluar</p>
              <p className="text-2xl font-bold text-gray-900">{suratKeluar.length}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiSend className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu TTD</p>
              <p className="text-2xl font-bold text-orange-600">
                {suratKeluar.filter(s => s.status === "Menunggu").length}
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
              <p className="text-sm font-medium text-gray-500">Terkirim</p>
              <p className="text-2xl font-bold text-green-600">
                {suratKeluar.filter(s => s.status === "Terkirim").length}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <span className="inline-block w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data surat keluar...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : suratKeluar.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data surat keluar.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suratKeluar.map((surat, i) => (
                <tr key={surat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{surat.nomor_surat}</td>
                  <td className="px-4 py-3">{formatDate(surat.tanggal_surat)}</td>
                  <td className="px-4 py-3">{surat.tujuan}</td>
                  <td className="px-4 py-3">{surat.perihal}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      surat.status === "Menunggu"
                        ? "bg-orange-100 text-orange-800"
                        : surat.status === "Draft"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                    }`}>
                      {surat.status}
                    </span>
                  </td>
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
