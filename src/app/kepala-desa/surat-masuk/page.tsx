"use client";

import { useState } from "react";
import { FiInbox, FiDownload, FiEye } from "react-icons/fi";

export default function KepalaDesaSuratMasukPage() {
  const [suratMasuk] = useState([
    {
      id: 1,
      nomor: "001/SM/I/2025",
      tanggalTerima: "2025-01-10",
      pengirim: "Kecamatan Aikmual",
      perihal: "Undangan Rapat Koordinasi",
      status: "Sudah Dibaca",
    },
    {
      id: 2,
      nomor: "002/SM/I/2025",
      tanggalTerima: "2025-01-09",
      pengirim: "Dinas Kesehatan",
      perihal: "Program Posyandu Balita",
      status: "Sudah Dibaca",
    },
  ]);

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-purple-600" /> Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">Surat masuk yang diterima kantor desa</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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
                <td className="px-4 py-3 font-medium">{surat.nomor}</td>
                <td className="px-4 py-3">{surat.tanggalTerima}</td>
                <td className="px-4 py-3">{surat.pengirim}</td>
                <td className="px-4 py-3">{surat.perihal}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
