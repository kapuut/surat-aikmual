"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SuratMasuk {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file_path?: string;
  created_by_name?: string;
}

export default function SuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuratMasuk();
  }, []);

  const fetchSuratMasuk = async () => {
    try {
      const response = await fetch("/api/admin/surat-masuk");
      const result = await response.json();
      if (result.success) {
        setSuratMasuk(result.data);
      }
    } catch (error) {
      console.error("Error fetching surat masuk:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Surat Masuk</h2>
        <p className="text-gray-500 mt-1">
          Kelola data surat masuk yang diterima oleh kantor desa.
        </p>
      </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Pilih Bulan</option>
              <option>Januari</option>
              <option>Februari</option>
              <option>Maret</option>
              <option>April</option>
              <option>Mei</option>
              <option>Juni</option>
              <option>Juli</option>
              <option>Agustus</option>
              <option>September</option>
              <option>Oktober</option>
              <option>November</option>
              <option>Desember</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Pilih Tahun</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Laporan
            </button>
            <Link
              href="/admin/surat-masuk/tambah"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 inline-flex items-center gap-2"
            >
              Tambah Surat Masuk
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat data...</p>
            </div>
          ) : suratMasuk.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Belum ada data surat masuk</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Terima</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Asal Surat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suratMasuk.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.nomor_surat}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_surat)}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_terima)}</td>
                    <td className="px-4 py-3">{s.asal_surat}</td>
                    <td className="px-4 py-3">{s.perihal}</td>
                    <td className="px-4 py-3">
                      {s.file_path ? (
                        <a href={s.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center flex gap-2 justify-center">
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                        Lihat
                      </button>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                        Edit
                      </button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                        Hapus
                      </button>
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
