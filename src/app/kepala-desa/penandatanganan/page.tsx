"use client";

import { FiEdit } from "react-icons/fi";

export default function KepalaDesaPenandatangananPage() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiEdit className="text-purple-600" /> Penandatanganan Surat
        </h2>
        <p className="text-gray-500 mt-1">Tandatangani surat yang sudah disetujui</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p>Halaman Penandatanganan - Dalam Pengembangan</p>
      </div>
    </section>
  );
}
