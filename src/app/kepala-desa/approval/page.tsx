"use client";

import { FiCheckCircle } from "react-icons/fi";

export default function KepalaDesaApprovalPage() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiCheckCircle className="text-purple-600" /> Approval Permohonan
        </h2>
        <p className="text-gray-500 mt-1">Setujui atau tolak permohonan surat</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p>Halaman Approval - Dalam Pengembangan</p>
      </div>
    </section>
  );
}
