"use client";

import { useState } from "react";

export default function ApprovalPage() {
  const [documents] = useState([
    {
      id: 1,
      nomor: "001/PERM/2025",
      tanggal: "2025-10-01",
      pemohon: "Ahmad Yusuf",
      jenisSurat: "Surat Keterangan Domisili",
      keperluan: "Persyaratan CPNS",
      status: "Menunggu Approval",
      file: "draft-domisili-ahmad.pdf",
      priority: "Normal"
    },
    {
      id: 2,
      nomor: "002/PERM/2025",
      tanggal: "2025-10-02",
      pemohon: "Siti Nurhaliza",
      jenisSurat: "Surat Keterangan Tidak Mampu",
      keperluan: "Beasiswa Kuliah",
      status: "Menunggu Approval",
      file: "draft-sktm-siti.pdf",
      priority: "Urgent"
    },
    {
      id: 3,
      nomor: "003/PERM/2025",
      tanggal: "2025-10-03",
      pemohon: "Budi Santoso",
      jenisSurat: "Surat Keterangan Usaha",
      keperluan: "Pengajuan Kredit",
      status: "Disetujui",
      file: "approved-usaha-budi.pdf",
      priority: "Normal"
    },
    {
      id: 4,
      nomor: "004/PERM/2025",
      tanggal: "2025-10-04",
      pemohon: "Maria Ulfa",
      jenisSurat: "Akta Kelahiran",
      keperluan: "Pendaftaran Sekolah",
      status: "Ditolak",
      file: "rejected-akta-maria.pdf",
      priority: "Normal"
    }
  ]);

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Approval Dokumen</h2>
          <p className="text-gray-500 mt-1">
            Kelola persetujuan dan penandatanganan dokumen surat.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Status</option>
              <option>Menunggu Approval</option>
              <option>Disetujui</option>
              <option>Ditolak</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Priority</option>
              <option>Urgent</option>
              <option>Normal</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Jenis Surat</option>
              <option>Surat Keterangan Domisili</option>
              <option>Surat Keterangan Tidak Mampu</option>
              <option>Surat Keterangan Usaha</option>
              <option>Akta Kelahiran</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Laporan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Menunggu Approval</p>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">WTIN</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">OK</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">REJECT</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Dokumen</p>
                <p className="text-2xl font-bold text-blue-600">4</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">DOC</span>
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pemohon</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc, i) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{doc.nomor}</td>
                  <td className="px-4 py-3">{doc.tanggal}</td>
                  <td className="px-4 py-3">{doc.pemohon}</td>
                  <td className="px-4 py-3">{doc.jenisSurat}</td>
                  <td className="px-4 py-3">{doc.keperluan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.priority === 'Urgent' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'Disetujui' 
                        ? 'bg-green-100 text-green-800' 
                        : doc.status === 'Ditolak'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 hover:underline cursor-pointer">
                    {doc.file}
                  </td>
                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Lihat
                    </button>
                    {doc.status === 'Menunggu Approval' && (
                      <>
                        <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                          Setujui
                        </button>
                        <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                          Tolak
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
  );
}
