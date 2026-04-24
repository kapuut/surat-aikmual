"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiFileText } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  buildOfficialDynamicRequirements,
  OFFICIAL_DYNAMIC_PROCEDURE,
} from "@/lib/template-surat/official-defaults";

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

  const persyaratan = useMemo(() => {
    if (!template) return [];

    return buildOfficialDynamicRequirements(requiredFields);
  }, [requiredFields, template]);

  const prosedur = useMemo(() => [...OFFICIAL_DYNAMIC_PROCEDURE], []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center text-gray-600">
            Memuat informasi surat dinamis...
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!template) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Jenis surat dinamis tidak ditemukan</h1>
            <p className="mt-4 text-gray-600">Template mungkin belum aktif atau sudah dihapus oleh admin.</p>
            <Link
              href="/permohonan"
              className="mt-6 inline-block rounded-lg bg-green-500 px-5 py-3 font-semibold text-white hover:bg-green-600"
            >
              Kembali ke Daftar Surat
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Link
            href="/permohonan"
            className="mb-6 inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
          >
            <FiArrowLeft /> Kembali
          </Link>

          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
              <FiFileText className="text-4xl text-white" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-800">{template.jenisSurat}</h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              {template.deskripsi || "Surat dinamis yang dibuat admin dengan field dan isi sesuai kebutuhan layanan."}
            </p>
          </div>

          <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center">
              <FiFileText className="mr-3 text-3xl text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800">Persyaratan Dokumen</h2>
            </div>
            <div className="space-y-4">
              {persyaratan.map((item, index) => (
                <div key={index} className="flex items-start">
                  <FiCheckCircle className="mr-3 mt-1 shrink-0 text-xl text-green-500" />
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Prosedur Permohonan</h2>
            <div className="space-y-6">
              {prosedur.map((item) => (
                <div key={item.step} className="flex items-start">
                  <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/permohonan/dinamis/${encodeURIComponent(template.id)}/form`}
              className="inline-flex transform items-center justify-center rounded-lg bg-green-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-green-600 hover:shadow-xl"
            >
              Ajukan Permohonan Sekarang
            </Link>
            <p className="mt-4 text-sm text-gray-500">Pastikan semua persyaratan dokumen sudah disiapkan</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
