"use client";

import { useState } from "react";
import { FiFileText, FiEye, FiCheck, FiX, FiFilter } from "react-icons/fi";

export default function SekretarisPermohonanPage() {
  const [permohonan] = useState([
    {
      id: 1,
      noPermohonan: "PRM001/I/2025",
      tanggal: "2025-01-10",
      pemohon: "Ahmad Suryadi",
      jenisSurat: "Surat Keterangan Domisili",
      status: "Menunggu Verifikasi",
      prioritas: "Normal"
    },
    {
      id: 2,
      noPermohonan: "PRM002/I/2025",
      tanggal: "2025-01-09",
      pemohon: "Siti Nurhaliza",
      jenisSurat: "Surat Keterangan Tidak Mampu",
      status: "Disetujui",
      prioritas: "Urgent"
    },
    {
      id: 3,
      noPermohonan: "PRM003/I/2025",
      tanggal: "2025-01-08",
      pemohon: "Budi Santoso",
      jenisSurat: "Surat Pengantar KTP",
      status: "Ditolak",
      prioritas: "Normal"
    },
    {
      id: 4,
      noPermohonan: "PRM004/I/2025",
      tanggal: "2025-01-07",
      pemohon: "Dewi Lestari",
      jenisSurat: "Surat Keterangan Usaha",
      status: "Dalam Proses",
      prioritas: "Normal"
    },
  ]);

  return (
    <section>
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
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Status</option>
            <option>Menunggu Verifikasi</option>
            <option>Dalam Proses</option>
            <option>Disetujui</option>
            <option>Ditolak</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Jenis Surat</option>
            <option>Surat Keterangan Domisili</option>
            <option>Surat Keterangan Tidak Mampu</option>
            <option>Surat Pengantar KTP</option>
            <option>Surat Keterangan Usaha</option>
          </select>
          <button className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
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
                {permohonan.filter(p => p.status === "Menunggu Verifikasi").length}
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">
                {permohonan.filter(p => p.status === "Disetujui").length}
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
                {permohonan.filter(p => p.status === "Ditolak").length}
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {permohonan.map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.noPermohonan}</td>
                <td className="px-4 py-3">{item.tanggal}</td>
                <td className="px-4 py-3">{item.pemohon}</td>
                <td className="px-4 py-3">{item.jenisSurat}</td>
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
                    item.status === 'Menunggu Verifikasi' 
                      ? 'bg-orange-100 text-orange-800' 
                      : item.status === 'Dalam Proses'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'Disetujui'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      <FiEye className="w-4 h-4" />
                    </button>
                    {item.status === 'Menunggu Verifikasi' && (
                      <>
                        <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
