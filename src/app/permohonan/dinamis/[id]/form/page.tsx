"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckCircle, FiSend, FiUpload } from "react-icons/fi";
import DynamicTemplateForm from "@/components/surat/DynamicTemplateForm";
import { createInitialFormValues } from "@/lib/template-surat/render-template";
import type { TemplateField, TemplateFormValues } from "@/lib/template-surat/types";

type DynamicTemplate = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
  fields: TemplateField[];
};

interface DynamicSuratFormPageProps {
  params: {
    id: string;
  };
}

function normalizeSpacing(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toTitleCase(value: string): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ""))
    .join(" ");
}

export default function DynamicSuratFormPage({ params }: DynamicSuratFormPageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<DynamicTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [baseData, setBaseData] = useState({
    nama: "",
    nik: "",
    alamat: "",
    noTelp: "",
  });
  const [dynamicValues, setDynamicValues] = useState<TemplateFormValues>({});

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      try {
        setLoadingTemplate(true);
        const response = await fetch("/api/dynamic-templates", { credentials: "include" });
        const data = await response.json();

        if (!response.ok || !data?.success || !Array.isArray(data?.templates)) {
          throw new Error(data?.error || "Gagal mengambil template dinamis");
        }

        const templateId = decodeURIComponent(params.id || "").trim();
        const found = data.templates.find((item: DynamicTemplate) => item.id === templateId) || null;

        if (!cancelled) {
          setTemplate(found);
          setDynamicValues(found ? createInitialFormValues(found.fields) : {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal mengambil template dinamis");
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplate(false);
        }
      }
    };

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const backHref = useMemo(() => {
    const safeId = encodeURIComponent(decodeURIComponent(params.id || "").trim());
    return `/permohonan/dinamis/${safeId}`;
  }, [params.id]);

  const showFeedback = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = new FormData();
      payload.set("jenisSurat", template.jenisSurat);
      payload.set("dynamicTemplateId", template.id);
      payload.set("nama", toTitleCase(baseData.nama));
      payload.set("nik", normalizeSpacing(baseData.nik));
      payload.set("alamat", toTitleCase(baseData.alamat));
      payload.set("noTelp", normalizeSpacing(baseData.noTelp));
      payload.set("keperluan", "-");

      Object.entries(dynamicValues).forEach(([key, value]) => {
        payload.set(key, value);
      });

      const fileInput = event.currentTarget.elements.namedItem("dokumenTambahan") as HTMLInputElement | null;
      if (fileInput?.files) {
        Array.from(fileInput.files).forEach((file) => {
          payload.append("dokumenTambahan", file);
        });
      }

      const response = await fetch("/api/permohonan", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengajukan permohonan surat dinamis");
      }

      setSuccessMessage("Permohonan berhasil diajukan. Anda akan diarahkan ke halaman tracking.");
      showFeedback();
      window.setTimeout(() => {
        router.push("/tracking");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim permohonan");
      showFeedback();
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center text-gray-600">Memuat formulir surat dinamis...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Template surat dinamis tidak ditemukan</h1>
          <p className="mt-2 text-gray-600">Template mungkin sudah dinonaktifkan oleh admin.</p>
          <Link href="/permohonan" className="inline-block mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Kembali ke daftar permohonan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href={backHref} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <FiArrowLeft /> Kembali
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900">{template.jenisSurat}</h1>
            <p className="text-gray-600 mt-1">{template.deskripsi || "Form ini dibuat dari template dinamis admin."}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Permohonan Berhasil</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Dasar Pemohon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={baseData.nama}
                  onChange={(event) => setBaseData((prev) => ({ ...prev, nama: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  pattern="[0-9]{16}"
                  value={baseData.nik}
                  onChange={(event) => setBaseData((prev) => ({ ...prev, nik: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat *</label>
                <textarea
                  required
                  rows={3}
                  value={baseData.alamat}
                  onChange={(event) => setBaseData((prev) => ({ ...prev, alamat: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={baseData.noTelp}
                  onChange={(event) => setBaseData((prev) => ({ ...prev, noTelp: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Dinamis dari Admin</h2>
            <DynamicTemplateForm
              fields={template.fields}
              values={dynamicValues}
              onFieldChange={handleFieldChange}
            />
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUpload className="w-5 h-5 text-blue-600" />
              Upload Dokumen Pendukung (Opsional)
            </h2>
            <input
              type="file"
              name="dokumenTambahan"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-gray-700"
            />
          </section>

          <div className="flex gap-4">
            <Link href={backHref} className="flex-1 rounded-lg bg-gray-100 py-3 px-6 text-center font-semibold text-gray-700 hover:bg-gray-200">
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 py-3 px-6 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  Kirim Permohonan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
