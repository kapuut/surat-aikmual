"use client";

import { useEffect, useState } from "react";
import { FiInbox, FiDownload, FiEye } from "react-icons/fi";

interface SuratMasukItem {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  file_path?: string;
}

export default function KepalaDesaSuratMasukPage() {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuratMasuk = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/surat-masuk", {
          credentials: "include",
        });
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-purple-600" /> Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">Surat masuk yang diterima kantor desa</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Memuat data surat masuk...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : suratMasuk.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Belum ada data surat masuk.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">Nomor Surat</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold">Perihal</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suratMasuk.map((surat, i) => (
                <tr key={surat.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{surat.nomor_surat}</td>
                  <td className="px-4 py-3">{formatDate(surat.tanggal_terima)}</td>
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
