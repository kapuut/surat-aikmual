"use client";

import { useState } from "react";
import { FiInbox, FiDownload, FiEye, FiFilter } from "react-icons/fi";

export default function SekretarisSuratMasukPage() {
  const [suratMasuk] = useState([
    {
      id: 1,
      nomor: "001/SM/I/2025",
      tanggalTerima: "2025-01-10",
      tanggalSurat: "2025-01-08",
      pengirim: "Kecamatan Aikmual",
      perihal: "Undangan Rapat Koordinasi",
      status: "Belum Dibaca",
      prioritas: "Normal"
    },
    {
      id: 2,
      nomor: "002/SM/I/2025",
      tanggalTerima: "2025-01-09",
      tanggalSurat: "2025-01-07",
      pengirim: "Dinas Kesehatan",
      perihal: "Program Posyandu Balita",
      status: "Sudah Dibaca",
      prioritas: "Urgent"
    },
    {
      id: 3,
      nomor: "003/SM/I/2025",
      tanggalTerima: "2025-01-08",
      tanggalSurat: "2025-01-06",
      pengirim: "BPS Kabupaten",
      perihal: "Sensus Penduduk 2025",
      status: "Sudah Dibaca",
      prioritas: "Normal"
    },
  ]);

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
                {suratMasuk.filter(s => s.status === "Belum Dibaca").length}
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
                {suratMasuk.filter(s => s.prioritas === "Urgent").length}
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
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tgl Terima</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tgl Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengirim</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suratMasuk.map((surat, i) => (
              <tr key={surat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{surat.nomor}</td>
                <td className="px-4 py-3">{surat.tanggalTerima}</td>
                <td className="px-4 py-3">{surat.tanggalSurat}</td>
                <td className="px-4 py-3">{surat.pengirim}</td>
                <td className="px-4 py-3">{surat.perihal}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    surat.prioritas === 'Urgent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {surat.prioritas}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    surat.status === 'Belum Dibaca' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {surat.status}
                  </span>
                </td>
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
