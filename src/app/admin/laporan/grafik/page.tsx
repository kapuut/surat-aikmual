"use client";

import { useState } from "react";

export default function LaporanGrafikPage() {
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  
  // Data statistik per bulan
  const [chartData] = useState<{
    [key: string]: {
      labels: string[];
      suratMasuk: number[];
      suratKeluar: number[];
    }
  }>({
    2025: {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      suratMasuk: [2, 1, 3, 2, 1, 4, 2, 1, 3, 5, 0, 0],
      suratKeluar: [1, 2, 2, 3, 1, 2, 1, 2, 4, 5, 0, 0]
    },
    2024: {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      suratMasuk: [3, 2, 4, 3, 2, 5, 3, 2, 4, 6, 3, 4],
      suratKeluar: [2, 3, 3, 4, 2, 3, 2, 3, 5, 6, 2, 3]
    }
  });

  const currentData = chartData[selectedYear];
  const maxValue = Math.max(...currentData.suratMasuk, ...currentData.suratKeluar);

  // Statistik tahunan
  const totalSuratMasuk = currentData.suratMasuk.reduce((a: number, b: number) => a + b, 0);
  const totalSuratKeluar = currentData.suratKeluar.reduce((a: number, b: number) => a + b, 0);
  const avgSuratMasuk = (totalSuratMasuk / 12).toFixed(1);
  const avgSuratKeluar = (totalSuratKeluar / 12).toFixed(1);

  const handleExportChart = () => {
    alert("Export grafik akan diimplementasikan");
  };

  const handlePrintReport = () => {
    alert("Print laporan akan diimplementasikan");
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Laporan Grafik</h2>
          <p className="text-gray-500 mt-1">
            Visualisasi data surat masuk dan keluar dalam bentuk grafik per bulan.
          </p>
        </div>

        {/* Filter Year */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Pilih Tahun:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleExportChart}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                Export Grafik
              </button>
              <button 
                onClick={handlePrintReport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
              >
                Print Laporan
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surat Masuk</p>
                <p className="text-3xl font-bold text-blue-600">{totalSuratMasuk}</p>
                <p className="text-xs text-gray-400 mt-1">Tahun {selectedYear}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-700">IN</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surat Keluar</p>
                <p className="text-3xl font-bold text-red-600">{totalSuratKeluar}</p>
                <p className="text-xs text-gray-400 mt-1">Tahun {selectedYear}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-xs font-bold text-red-700">OUT</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Masuk</p>
                <p className="text-3xl font-bold text-green-600">{avgSuratMasuk}</p>
                <p className="text-xs text-gray-400 mt-1">per bulan</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="inline-block w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">CHT</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Keluar</p>
                <p className="text-3xl font-bold text-purple-600">{avgSuratKeluar}</p>
                <p className="text-xs text-gray-400 mt-1">per bulan</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Grafik Surat Masuk dan Keluar Tahun {selectedYear}
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Surat Masuk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Surat Keluar</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {currentData.labels.map((month: string, index: number) => (
              <div key={month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{month}</span>
                  <span className="text-gray-500">
                    Masuk: {currentData.suratMasuk[index]} | Keluar: {currentData.suratKeluar[index]}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {/* Surat Masuk Bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 w-16">Masuk</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                        style={{ 
                          width: maxValue > 0 ? `${(currentData.suratMasuk[index] / maxValue) * 100}%` : '0%' 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-8">{currentData.suratMasuk[index]}</span>
                  </div>
                  
                  {/* Surat Keluar Bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 w-16">Keluar</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-red-500 h-4 rounded-full transition-all duration-300"
                        style={{ 
                          width: maxValue > 0 ? `${(currentData.suratKeluar[index] / maxValue) * 100}%` : '0%' 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 w-8">{currentData.suratKeluar[index]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Month */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Bulan Tertinggi</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Surat Masuk Tertinggi</p>
                  <p className="text-sm text-blue-600">
                    {currentData.labels[currentData.suratMasuk.indexOf(Math.max(...currentData.suratMasuk))]} 
                    - {Math.max(...currentData.suratMasuk)} surat
                  </p>
                </div>
                <span className="inline-block w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold\">IN</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Surat Keluar Tertinggi</p>
                  <p className="text-sm text-red-600">
                    {currentData.labels[currentData.suratKeluar.indexOf(Math.max(...currentData.suratKeluar))]} 
                    - {Math.max(...currentData.suratKeluar)} surat
                  </p>
                </div>
                <span className="inline-block w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold\">OUT</span>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Bulan</th>
                    <th className="text-center py-2">Masuk</th>
                    <th className="text-center py-2">Keluar</th>
                    <th className="text-center py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.labels.slice(0, 6).map((month: string, index: number) => (
                    <tr key={month} className="border-b border-gray-100">
                      <td className="py-2">{month}</td>
                      <td className="text-center py-2 text-blue-600">{currentData.suratMasuk[index]}</td>
                      <td className="text-center py-2 text-red-600">{currentData.suratKeluar[index]}</td>
                      <td className="text-center py-2 font-medium">
                        {currentData.suratMasuk[index] + currentData.suratKeluar[index]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
  );
}