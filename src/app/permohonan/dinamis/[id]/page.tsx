"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiFileText } from "react-icons/fi";

type TemplateField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select";
  required?: boolean;
};

type DynamicTemplate = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
  fields: TemplateField[];
};

interface DynamicSuratDetailPageProps {
  params: {
    id: string;
  };
}

export default function DynamicSuratDetailPage({ params }: DynamicSuratDetailPageProps) {
  const [template, setTemplate] = useState<DynamicTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dynamic-templates", { credentials: "include" });
        const data = await response.json();

        if (!response.ok || !data?.success || !Array.isArray(data?.templates)) {
          return;
        }

        const templateId = decodeURIComponent(params.id || "").trim();
        const found = data.templates.find((item: DynamicTemplate) => item.id === templateId) || null;

        if (!cancelled) {
          setTemplate(found);
        }
      } catch {
        if (!cancelled) {
          setTemplate(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const requiredFields = useMemo(() => {
    if (!template) return [];
    return template.fields.filter((field) => field.required).map((field) => field.label);
  }, [template]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-600">
        Memuat informasi surat dinamis...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Jenis surat dinamis tidak ditemukan</h1>
        <p className="mt-4 text-gray-600">Template mungkin belum aktif atau sudah dihapus oleh admin.</p>
        <Link
          href="/permohonan"
          className="inline-block mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Kembali ke Daftar Surat
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/permohonan" className="hover:text-blue-600 flex items-center gap-2">
            <FiArrowLeft /> Kembali
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{template.jenisSurat}</h1>
        <p className="text-lg text-gray-600 mb-10">{template.deskripsi || "Template surat dinamis dari admin."}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiCheckCircle className="text-blue-600" />
                  Ringkasan Isian
                </h2>
              </div>
              <div className="card-body">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600">•</span>
                    <span>Field dari admin: {template.fields.length} kolom</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600">•</span>
                    <span>Field wajib sistem: Nama, NIK, Alamat, No. WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600">•</span>
                    <span>Paragraf surat akan mengikuti template HTML yang diatur admin</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiFileText className="text-blue-600" />
                  Field Wajib dari Admin
                </h2>
              </div>
              <div className="card-body">
                {requiredFields.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {requiredFields.map((fieldLabel) => (
                      <li key={fieldLabel}>{fieldLabel}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Tidak ada field tambahan yang ditandai wajib.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 card">
              <div className="card-body">
                <h3 className="font-bold text-lg mb-4">Ajukan Permohonan</h3>
                <Link
                  href={`/permohonan/dinamis/${encodeURIComponent(template.id)}/form`}
                  className="btn btn-primary w-full"
                >
                  Buat Permohonan
                </Link>

                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold text-blue-800">Catatan</h4>
                  <ul className="mt-2 space-y-2 text-sm text-blue-700">
                    <li>1. Pastikan data sesuai dokumen resmi</li>
                    <li>2. Upload lampiran pendukung bila diperlukan</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
