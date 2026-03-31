"use client";

import { useState } from "react";
import { FiInbox, FiCalendar, FiDownload, FiPrinter } from "react-icons/fi";

export default function SekretarisLaporanSuratMasukPage() {
  const [periode, setPeriode] = useState("januari-2025");
  
  const dataBulan = [
    { bulan: "Januari", total: 45, belumDibaca: 12, sudahDibaca: 33 },
    { bulan: "Desember", total: 38, belumDibaca: 5, sudahDibaca: 33 },
    { bulan: "November", total: 42, belumDibaca: 8, sudahDibaca: 34 },
  ];

  const dataDetail = [
    { kategori: "Undangan", jumlah: 15, persentase: 33 },
    { kategori: "Pemberitahuan", jumlah: 12, persentase: 27 },
    { kategori: "Permohonan", jumlah: 10, persentase: 22 },
    { kategori: "Laporan", jumlah: 8, persentase: 18 },
  ];

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiInbox className="text-blue-600" /> Laporan Surat Masuk
        </h2>
        <p className="text-gray-500 mt-1">
          Laporan dan statistik surat masuk berdasarkan periode
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 items-center">
          <FiCalendar className="text-gray-500" />
          <select 
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="januari-2025">Januari 2025</option>
            <option value="desember-2024">Desember 2024</option>
            <option value="november-2024">November 2024</option>
            <option value="custom">Pilih Periode...</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export Excel
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <FiPrinter className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surat Masuk</p>
              <p className="text-3xl font-bold text-gray-900">45</p>
              <p className="text-xs text-green-600 mt-1">↑ 12% dari bulan lalu</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiInbox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Belum Dibaca</p>
              <p className="text-3xl font-bold text-orange-600">12</p>
              <p className="text-xs text-gray-500 mt-1">26.7% dari total</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-2xl">📬</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sudah Dibaca</p>
              <p className="text-3xl font-bold text-green-600">33</p>
              <p className="text-xs text-gray-500 mt-1">73.3% dari total</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="inline-block w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tren Bulanan */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren 3 Bulan Terakhir</h3>
          <div className="space-y-4">
            {dataBulan.map((item, i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{item.bulan}</span>
                  <span className="text-lg font-bold text-blue-600">{item.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(item.total / 50) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Belum: {item.belumDibaca}</span>
                  <span>Sudah: {item.sudahDibaca}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori Surat */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kategori Surat Masuk</h3>
          <div className="space-y-4">
            {dataDetail.map((item, i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{item.kategori}</span>
                  <span className="text-sm font-semibold text-gray-600">{item.jumlah} surat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${item.persentase}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 min-w-[40px] text-right">{item.persentase}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Detail</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">45</p>
            <p className="text-sm text-gray-600">Total Masuk</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">12</p>
            <p className="text-sm text-gray-600">Belum Dibaca</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">33</p>
            <p className="text-sm text-gray-600">Sudah Dibaca</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">1.5</p>
            <p className="text-sm text-gray-600">Rata-rata/Hari</p>
          </div>
        </div>
      </div>
    </section>
  );
}
