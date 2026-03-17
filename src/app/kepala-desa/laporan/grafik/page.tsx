"use client";

import { FiBarChart2 } from "react-icons/fi";

export default function KepalaDesaLaporanGrafikPage() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiBarChart2 className="text-purple-600" /> Laporan Grafik
        </h2>
        <p className="text-gray-500 mt-1">Grafik dan visualisasi data surat</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p>Laporan Grafik - Dalam Pengembangan</p>
      </div>
    </section>
  );
}
