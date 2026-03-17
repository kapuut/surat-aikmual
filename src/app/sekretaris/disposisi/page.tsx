"use client";

import { useState } from "react";
import { FiArrowRight, FiEye, FiCheck, FiClock } from "react-icons/fi";

export default function SekretarisDisposisiPage() {
  const [disposisi] = useState([
    {
      id: 1,
      noSurat: "001/SM/I/2025",
      tanggal: "2025-01-10",
      perihal: "Undangan Rapat Koordinasi",
      dari: "Kecamatan Aikmual",
      tujuanDisposisi: "Kepala Desa",
      instruksi: "Untuk dihadiri dan ditindaklanjuti",
      prioritas: "Urgent",
      status: "Menunggu",
      batasTindak: "2025-01-15"
    },
    {
      id: 2,
      noSurat: "002/SM/I/2025",
      tanggal: "2025-01-09",
      perihal: "Program Posyandu Balita",
      dari: "Dinas Kesehatan",
      tujuanDisposisi: "Kader Posyandu",
      instruksi: "Untuk disosialisasikan kepada kader posyandu",
      prioritas: "Normal",
      status: "Selesai",
      batasTindak: "2025-01-20"
    },
    {
      id: 3,
      noSurat: "003/SM/I/2025",
      tanggal: "2025-01-08",
      perihal: "Sensus Penduduk 2025",
      dari: "BPS Kabupaten",
      tujuanDisposisi: "RT/RW",
      instruksi: "Untuk dikerjakan bersama RT/RW",
      prioritas: "Normal",
      status: "Dalam Proses",
      batasTindak: "2025-01-30"
    },
  ]);

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
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Status</option>
            <option>Menunggu</option>
            <option>Dalam Proses</option>
            <option>Selesai</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Prioritas</option>
            <option>Urgent</option>
            <option>Normal</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Tujuan</option>
            <option>Kepala Desa</option>
            <option>Kader Posyandu</option>
            <option>RT/RW</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Buat Disposisi Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Disposisi</p>
              <p className="text-2xl font-bold text-gray-900">{disposisi.length}</p>
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
                {disposisi.filter(d => d.status === "Menunggu").length}
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
                {disposisi.filter(d => d.status === "Dalam Proses").length}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selesai</p>
              <p className="text-2xl font-bold text-green-600">
                {disposisi.filter(d => d.status === "Selesai").length}
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
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">No Surat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dari</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tujuan Disposisi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Instruksi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Batas Tindak</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {disposisi.map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.noSurat}</td>
                <td className="px-4 py-3">{item.tanggal}</td>
                <td className="px-4 py-3">{item.perihal}</td>
                <td className="px-4 py-3">{item.dari}</td>
                <td className="px-4 py-3">{item.tujuanDisposisi}</td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="truncate" title={item.instruksi}>
                    {item.instruksi}
                  </div>
                </td>
                <td className="px-4 py-3">{item.batasTindak}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.prioritas === 'Urgent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.prioritas}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Menunggu' 
                      ? 'bg-orange-100 text-orange-800' 
                      : item.status === 'Dalam Proses'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                    <FiEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
