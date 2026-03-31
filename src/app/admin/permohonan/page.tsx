"use client";

import { useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";

export default function PermohonanAdminPage() {
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [permohonan, setPermohonan] = useState([
    {
      id: 1,
      nomor: "REG-001/2025",
      tanggal: "2025-10-01",
      nama: "Ahmad Yusuf",
      nik: "1234567890123456",
      jenisSurat: "Surat Keterangan Domisili",
      keperluan: "Persyaratan CPNS",
      status: "Menunggu Approval",
      priority: "Normal",
      file: "ktp-ahmad.pdf"
    },
    {
      id: 2,
      nomor: "REG-002/2025",
      tanggal: "2025-10-03",
      nama: "Siti Nurhaliza",
      nik: "1234567890123457",
      jenisSurat: "Surat Keterangan Tidak Mampu",
      keperluan: "Beasiswa Kuliah",
      status: "Disetujui",
      priority: "Urgent",
      file: "ktp-siti.pdf"
    },
    {
      id: 3,
      nomor: "REG-003/2025",
      tanggal: "2025-10-05",
      nama: "Budi Santoso",
      nik: "1234567890123458",
      jenisSurat: "Surat Keterangan Usaha",
      keperluan: "Pengajuan Kredit",
      status: "Ditolak",
      priority: "Normal",
      file: "ktp-budi.pdf"
    },
    {
      id: 4,
      nomor: "REG-004/2025",
      tanggal: "2025-10-07",
      nama: "Maria Ulfa",
      nik: "1234567890123459",
      jenisSurat: "Surat Keterangan Kepemilikan",
      keperluan: "Pendaftaran Sekolah",
      status: "Siap Tandatangan",
      priority: "Normal",
      file: "ktp-maria.pdf"
    },
  ]);

  const handleApprove = (id: number) => {
    setPermohonan(permohonan.map(p => 
      p.id === id ? {...p, status: "Siap Tandatangan"} : p
    ));
    alert("Permohonan disetujui!");
  };

  const handleReject = (id: number) => {
    setPermohonan(permohonan.map(p => 
      p.id === id ? {...p, status: "Ditolak"} : p
    ));
    alert("Permohonan ditolak!");
  };

  const handleSendToChief = (id: number) => {
    setPermohonan(permohonan.map(p => 
      p.id === id ? {...p, status: "Dikirim ke Kepala Desa"} : p
    ));
    alert("Permohonan telah dikirim ke Kepala Desa untuk ditandatangani!");
  };

  const filteredPermohonan = permohonan.filter(p => {
    const matchStatus = filterStatus === "Semua" || p.status === filterStatus;
    const matchSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.jenisSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.nik.includes(searchTerm);
    const matchMonth = selectedMonth === "" || 
                      new Date(p.tanggal).getMonth() + 1 === parseInt(selectedMonth);
    return matchStatus && matchSearch && matchMonth;
  });

  const stats = {
    menunggu: permohonan.filter(p => p.status === "Menunggu Approval").length,
    disetujui: permohonan.filter(p => p.status === "Disetujui").length,
    ditolak: permohonan.filter(p => p.status === "Ditolak").length,
    siapTandatangan: permohonan.filter(p => p.status === "Siap Tandatangan").length,
    dikirim: permohonan.filter(p => p.status === "Dikirim ke Kepala Desa").length,
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Permohonan Surat</h2>
          <p className="text-gray-500 mt-1">
            Kelola permohonan, approval, dan penandatanganan surat oleh warga desa.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Menunggu Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.menunggu}</p>
              </div>
              <div className="bg-yellow-100 text-yellow-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
                WAIT
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{stats.disetujui}</p>
              </div>
              <div className="bg-green-100 text-green-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
                OK
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">{stats.ditolak}</p>
              </div>
              <div className="bg-red-100 text-red-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
                NO
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Siap Tandatangan</p>
                <p className="text-2xl font-bold text-blue-600">{stats.siapTandatangan}</p>
              </div>
              <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
                SIGN
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Dikirim ke Kepala</p>
                <p className="text-2xl font-bold text-purple-600">{stats.dikirim}</p>
              </div>
              <div className="bg-purple-100 text-purple-700 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold">
                SENT
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Cari nama, NIK, atau jenis surat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option>Semua Status</option>
              <option>Menunggu Approval</option>
              <option>Disetujui</option>
              <option>Ditolak</option>
              <option>Siap Tandatangan</option>
              <option>Dikirim ke Kepala Desa</option>
            </select>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Laporan
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Menampilkan {filteredPermohonan.length} dari {permohonan.length} data
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nomor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Pemohon</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">NIK</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Keperluan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPermohonan.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.nomor}</td>
                  <td className="px-4 py-3">{p.tanggal}</td>
                  <td className="px-4 py-3 font-medium">{p.nama}</td>
                  <td className="px-4 py-3">{p.nik}</td>
                  <td className="px-4 py-3">{p.jenisSurat}</td>
                  <td className="px-4 py-3">{p.keperluan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.priority === 'Urgent' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Disetujui' 
                        ? 'bg-green-100 text-green-800' 
                        : p.status === 'Ditolak'
                        ? 'bg-red-100 text-red-800'
                        : p.status === 'Menunggu Approval'
                        ? 'bg-yellow-100 text-yellow-800'
                        : p.status === 'Siap Tandatangan'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 hover:underline cursor-pointer">
                    {p.file}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center flex-wrap">
                      <button className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600">
                        Lihat
                      </button>
                      {p.status === 'Menunggu Approval' && (
                        <>
                          <button 
                            onClick={() => handleApprove(p.id)}
                            className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleReject(p.id)}
                            className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      {p.status === 'Disetujui' && (
                        <button 
                          onClick={() => handleSendToChief(p.id)}
                          className="bg-purple-500 text-white px-2 py-1 text-xs rounded hover:bg-purple-600"
                        >
                          Kirim ke Kepala
                        </button>
                      )}
                      {(p.status === 'Siap Tandatangan' || p.status === 'Dikirim ke Kepala Desa') && (
                        <span className="text-xs text-gray-500 px-2 py-1">Selesai</span>
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
