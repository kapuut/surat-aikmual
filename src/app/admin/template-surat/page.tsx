"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";

type TemplateItem = {
  id: number;
  nama: string;
  deskripsi: string | null;
  jenis_surat: string;
  file_name: string;
  file_path: string;
  status: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
};

export default function TemplateSuratPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    jenisSurat: ALLOWED_SURAT_TYPES[0]?.title || "",
    file: null as File | null,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/templates", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil daftar template");
      }

      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil daftar template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file: selected }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.nama || !formData.jenisSurat || !formData.file) {
      setError("Nama template, jenis surat, dan file wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("nama", formData.nama);
      payload.append("deskripsi", formData.deskripsi);
      payload.append("jenisSurat", formData.jenisSurat);
      payload.append("file", formData.file);

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupload template");
      }

      setMessage(data.message || "Template berhasil diupload");
      setFormData({
        nama: "",
        deskripsi: "",
        jenisSurat: ALLOWED_SURAT_TYPES[0]?.title || "",
        file: null,
      });
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupload template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    const shouldDelete = window.confirm("Hapus template ini?");
    if (!shouldDelete) return;

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus template");
      }

      setMessage(data.message || "Template berhasil dihapus");
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus template");
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Template Surat</h2>
          <p className="text-gray-500 mt-1">
            Kelola template surat yang digunakan untuk pembuatan surat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Upload Template Surat</h3>

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Template Surat Domisili"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat</label>
              <select
                value={formData.jenisSurat}
                onChange={(e) => setFormData((prev) => ({ ...prev, jenisSurat: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {ALLOWED_SURAT_TYPES.map((item) => (
                  <option key={item.slug} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">File Template (.docx/.pdf)</label>
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? "Mengupload..." : "Upload Template"}
          </button>
        </form>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Kategori Resmi</option>
              <option>Keterangan</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Status</option>
              <option>Aktif</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Semua Template
            </button>
          </div>
        </div>

        {/* Grid Template Cards */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Memuat template...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">TMPL</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.status === 'aktif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {template.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {template.nama}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {template.deskripsi || '-'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jenis Surat:</span>
                    <span className="font-medium">{template.jenis_surat}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">File:</span>
                    <a href={template.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{template.file_name}</a>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Terakhir diubah:</span>
                    <span className="font-medium">{new Date(template.updated_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <a href={template.file_path} target="_blank" rel="noreferrer" className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 text-center">
                    Preview
                  </a>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
  );
}
