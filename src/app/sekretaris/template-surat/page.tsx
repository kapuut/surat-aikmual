"use client";

import { useState } from "react";
import { FiFile, FiEdit, FiTrash2, FiPlus, FiDownload } from "react-icons/fi";

export default function SekretarisTemplateSuratPage() {
  const [templates] = useState([
    {
      id: 1,
      nama: "Template Surat Keterangan Domisili",
      kategori: "Keterangan",
      deskripsi: "Template untuk surat keterangan domisili warga",
      terakhirDiubah: "2025-01-10",
      penggunaan: 45
    },
    {
      id: 2,
      nama: "Template Surat Keterangan Tidak Mampu",
      kategori: "Keterangan",
      deskripsi: "Template untuk surat keterangan tidak mampu",
      terakhirDiubah: "2025-01-08",
      penggunaan: 32
    },
    {
      id: 3,
      nama: "Template Surat Pengantar KTP",
      kategori: "Pengantar",
      deskripsi: "Template untuk surat pengantar pembuatan KTP",
      terakhirDiubah: "2025-01-05",
      penggunaan: 28
    },
    {
      id: 4,
      nama: "Template Surat Keterangan Usaha",
      kategori: "Keterangan",
      deskripsi: "Template untuk surat keterangan usaha",
      terakhirDiubah: "2025-01-03",
      penggunaan: 15
    },
    {
      id: 5,
      nama: "Template Surat Undangan",
      kategori: "Undangan",
      deskripsi: "Template untuk surat undangan resmi desa",
      terakhirDiubah: "2024-12-28",
      penggunaan: 12
    },
  ]);

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiFile className="text-blue-600" /> Template Surat
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola template surat untuk berbagai keperluan administrasi desa
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option>Semua Kategori</option>
            <option>Keterangan</option>
            <option>Pengantar</option>
            <option>Undangan</option>
            <option>Pemberitahuan</option>
          </select>
          <input
            type="text"
            placeholder="Cari template..."
            className="border rounded-lg px-3 py-2 text-sm w-64"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Tambah Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Template</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FiFile className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Keterangan</p>
              <p className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.kategori === "Keterangan").length}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <span className="text-xl">📋</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pengantar</p>
              <p className="text-2xl font-bold text-purple-600">
                {templates.filter(t => t.kategori === "Pengantar").length}
              </p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <span className="text-xl">📝</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Penggunaan</p>
              <p className="text-2xl font-bold text-orange-600">
                {templates.reduce((sum, t) => sum + t.penggunaan, 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FiFile className="w-6 h-6 text-blue-600" />
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {template.kategori}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {template.nama}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {template.deskripsi}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>Diubah: {template.terakhirDiubah}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                {template.penggunaan}x digunakan
              </span>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm flex items-center justify-center gap-1">
                <FiEdit className="w-3 h-3" />
                Edit
              </button>
              <button className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
                <FiDownload className="w-4 h-4" />
              </button>
              <button className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
