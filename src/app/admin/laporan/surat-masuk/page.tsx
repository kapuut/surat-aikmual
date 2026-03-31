"use client";

import { useState } from "react";

export default function LaporanSuratMasukPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  
  const [suratMasuk] = useState([
    {
      noRegistrasi: "REG-001/2025",
      noSurat: "001/DISDIK/2025",
      tanggalSurat: "2025-10-02",
      pengirim: "Dinas Pendidikan NTB",
      perihal: "Undangan Rapat Koordinasi Sekolah Digital",
      penerima: "Kepala Desa Aikmual"
    },
    {
      noRegistrasi: "REG-002/2025",
      noSurat: "002/KEMENDESA/2025",
      tanggalSurat: "2025-10-05",
      pengirim: "Kementerian Desa",
      perihal: "Sosialisasi Program P3MD",
      penerima: "Sekretaris Desa"
    },
    {
      noRegistrasi: "REG-003/2025",
      noSurat: "003/BUPATI/2025",
      tanggalSurat: "2025-10-08",
      pengirim: "Kantor Bupati Lombok Tengah",
      perihal: "Instruksi Pelaksanaan Gotong Royong",
      penerima: "Kepala Desa Aikmual"
    },
    {
      noRegistrasi: "REG-004/2025",
      noSurat: "004/POLSEK/2025",
      tanggalSurat: "2025-10-10",
      pengirim: "Polsek Aikmual",
      perihal: "Surat Edaran Keamanan Lingkungan",
      penerima: "Babinsa Desa"
    },
    {
      noRegistrasi: "REG-005/2025",
      noSurat: "005/DINKES/2025",
      tanggalSurat: "2025-10-12",
      pengirim: "Dinas Kesehatan NTB",
      perihal: "Program Imunisasi Anak dan Lansia",
      penerima: "Kader Posyandu"
    }
  ]);

  // Filter data berdasarkan search dan filter
  const filteredData = suratMasuk.filter(surat => {
    const matchSearch = searchTerm === "" || 
      surat.noSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.penerima.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchBulan = filterBulan === "" || 
      new Date(surat.tanggalSurat).getMonth() + 1 === parseInt(filterBulan);
    
    const matchTahun = filterTahun === "" || 
      new Date(surat.tanggalSurat).getFullYear() === parseInt(filterTahun);
    
    return matchSearch && matchBulan && matchTahun;
  });

  const handleExportPDF = () => {
    alert("Export PDF akan diimplementasikan");
  };

  const handleExportExcel = () => {
    alert("Export Excel akan diimplementasikan");
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Laporan Surat Masuk</h2>
          <p className="text-gray-500 mt-1">
            Laporan lengkap data surat masuk yang diterima oleh kantor desa.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pencarian
              </label>
              <input
                type="text"
                placeholder="Cari berdasarkan nomor surat, pengirim, perihal, atau penerima..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulan
              </label>
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahun
              </label>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Semua Tahun</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Menampilkan {filteredData.length} dari {suratMasuk.length} data
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
            >
              Export PDF
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Registrasi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No. Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Surat</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perihal</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Penerima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((surat, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{surat.noRegistrasi}</td>
                    <td className="px-4 py-3">{surat.noSurat}</td>
                    <td className="px-4 py-3">{surat.tanggalSurat}</td>
                    <td className="px-4 py-3">{surat.pengirim}</td>
                    <td className="px-4 py-3">{surat.perihal}</td>
                    <td className="px-4 py-3">{surat.penerima}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surat Masuk</p>
                <p className="text-2xl font-bold text-blue-600">{suratMasuk.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">IN</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Data Ditampilkan</p>
                <p className="text-2xl font-bold text-green-600">{filteredData.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <span className="inline-block w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">CHT</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bulan Ini</p>
                <p className="text-2xl font-bold text-purple-600">
                  {suratMasuk.filter(s => new Date(s.tanggalSurat).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}