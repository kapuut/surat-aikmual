"use client";

import { useState } from "react";

export default function SuratKeluarPage() {
  const [suratKeluar] = useState([
    {
      nomor: "003/DESA/2025",
      tanggalKirim: "2025-10-01",
      tujuan: "Camat Aikmual",
      perihal: "Laporan Kegiatan Bulan September",
      status: "Terkirim",
      file: "laporan-september.pdf",
    },
    {
      nomor: "004/DESA/2025", 
      tanggalKirim: "2025-10-03",
      tujuan: "BPD Aikmual",
      perihal: "Undangan Rapat Desa",
      status: "Terkirim",
      file: "undangan-rapat-desa.pdf",
    },
    {
      nomor: "005/DESA/2025",
      tanggalKirim: "2025-10-07",
      tujuan: "Dinas Sosial NTB",
      perihal: "Permohonan Bantuan Sosial",
      status: "Draft",
      file: "permohonan-bansos.pdf",
    },
  ]);

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Surat Keluar</h2>
          <p className="text-gray-500 mt-1">
            Kelola data surat keluar yang dikirim oleh kantor desa.
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
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{s.nomor}</td>
                  <td className="px-4 py-3">{s.tanggalKirim}</td>
                  <td className="px-4 py-3">{s.tujuan}</td>
                  <td className="px-4 py-3">{s.perihal}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.status === 'Terkirim' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 hover:underline cursor-pointer">
                    {s.file}
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
        </div>
      </section>
  );
}
