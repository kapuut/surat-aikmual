"use client";

import { useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";

export default function TemplateSuratPage() {
  const [templates] = useState(
    ALLOWED_SURAT_TYPES.map((item, index) => ({
      id: index + 1,
      nama: item.title,
      deskripsi: item.description,
      kategori: "Keterangan",
      file: item.templateFile,
      terakhirDiubah: "2025-10-10",
      status: "Aktif"
    }))
  );

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">📄 Template Surat</h2>
          <p className="text-gray-500 mt-1">
            Kelola template surat yang digunakan untuk pembuatan surat.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option>Kategori Resmi</option>
              <option>Keterangan</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option>Semua Status</option>
              <option>Aktif</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              📄 Unduh Semua Template
            </button>
          </div>
        </div>

        {/* Grid Template Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-2xl">📄</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.status === 'Aktif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {template.nama}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {template.deskripsi}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kategori:</span>
                    <span className="font-medium">{template.kategori}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">File:</span>
                    <span className="text-blue-600 hover:underline cursor-pointer">{template.file}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Terakhir diubah:</span>
                    <span className="font-medium">{template.terakhirDiubah}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-100">
                    👁️ Preview
                  </button>
                  <button className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg text-sm hover:bg-yellow-100">
                    ✏️ Edit
                  </button>
                  <button className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
  );
}
