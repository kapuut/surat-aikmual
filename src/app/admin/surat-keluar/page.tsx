"use client";

import { useEffect, useState } from "react";

interface SuratKeluarItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
  file_path: string | null;
}

export default function SuratKeluarPage() {
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
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Status</option>
              <option>Draft</option>
              <option>Terkirim</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Laporan
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Buat Surat Keluar
            </button>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Kirim</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suratKeluar.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.nomor_surat}</td>
                    <td className="px-4 py-3">{formatDate(s.tanggal_surat)}</td>
                    <td className="px-4 py-3">{s.tujuan}</td>
                    <td className="px-4 py-3">{s.perihal}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === "Terkirim"
                          ? "bg-green-100 text-green-800"
                          : s.status === "Menunggu"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.file_path ? (
                        <a href={s.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        {s.file_path ? (
                          <button
                            onClick={() => window.open(s.file_path as string, "_blank")}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Lihat
                          </button>
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
