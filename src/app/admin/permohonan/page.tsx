"use client";

import { useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";

export default function PermohonanAdminPage() {
  const [permohonan] = useState([
    {
      id: 1,
      tanggal: "2025-10-01",
      nama: "Ahmad Yusuf",
      nik: "1234567890123456",
      jenisSurat: "Surat Keterangan Domisili",
      keperluan: "Persyaratan CPNS",
      status: "Pending",
      file: "ktp-ahmad.pdf"
    },
    {
      id: 2,
      tanggal: "2025-10-03",
      nama: "Siti Nurhaliza",
      nik: "1234567890123457",
      jenisSurat: "Surat Keterangan Tidak Mampu",
      keperluan: "Beasiswa Kuliah",
      status: "Disetujui",
      file: "ktp-siti.pdf"
    },
    {
      id: 3,
      tanggal: "2025-10-05",
      nama: "Budi Santoso",
      nik: "1234567890123458",
      jenisSurat: "Surat Keterangan Usaha",
      keperluan: "Pengajuan Kredit",
      status: "Ditolak",
      file: "ktp-budi.pdf"
    },
    {
      id: 4,
      tanggal: "2025-10-07",
      nama: "Maria Ulfa",
      nik: "1234567890123459",
      jenisSurat: "Surat Keterangan Kepemilikan",
      keperluan: "Pendaftaran Sekolah",
      status: "Pending",
      file: "ktp-maria.pdf"
    },
  ]);

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">📋 Permohonan Surat</h2>
          <p className="text-gray-500 mt-1">
            Kelola permohonan surat yang diajukan oleh warga desa.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option>Semua Status</option>
              <option>Pending</option>
              <option>Disetujui</option>
              <option>Ditolak</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option>Semua Jenis Surat</option>
              {ALLOWED_SURAT_TYPES.map((item) => (
                <option key={item.slug}>{item.title}</option>
              ))}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm">
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
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              📄 Unduh Laporan
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Pemohon</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">NIK</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permohonan.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{p.tanggal}</td>
                  <td className="px-4 py-3 font-medium">{p.nama}</td>
                  <td className="px-4 py-3">{p.nik}</td>
                  <td className="px-4 py-3">{p.jenisSurat}</td>
                  <td className="px-4 py-3">{p.keperluan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Disetujui' 
                        ? 'bg-green-100 text-green-800' 
                        : p.status === 'Ditolak'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 hover:underline cursor-pointer">
                    {p.file}
                  </td>
                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      👁️
                    </button>
                    {p.status === 'Pending' && (
                      <>
                        <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                          ✅
                        </button>
                        <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                          ❌
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
