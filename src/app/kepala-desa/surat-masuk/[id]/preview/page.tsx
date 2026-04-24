"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";

interface SuratMasukDetail {
  id: number;
  nomor_surat: string;
  file_path?: string | null;
}

type PreviewKind = "pdf" | "image" | "docx" | "doc" | "unsupported" | "missing";

function getFileNameFromPath(filePath?: string | null): string {
  if (!filePath) {
    return "-";
  }

  const segments = filePath.split("/");
  return segments[segments.length - 1] || filePath;
}

function detectPreviewKind(filePath: string | null | undefined): PreviewKind {
  if (!filePath) {
    return "missing";
  }

  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.endsWith(".pdf")) {
    return "pdf";
  }

  if (/\.(png|jpg|jpeg|webp|gif)$/i.test(normalizedPath)) {
    return "image";
  }

  if (normalizedPath.endsWith(".docx")) {
    return "docx";
  }

  if (normalizedPath.endsWith(".doc")) {
    return "doc";
  }

  return "unsupported";
}

export default function PreviewKepalaDesaSuratMasukPage() {
  const params = useParams<{ id: string }>();
  const suratId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : (rawId || "");
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SuratMasukDetail | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!suratId) {
        setError("ID surat masuk tidak valid");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/surat-masuk/${encodeURIComponent(suratId)}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal memuat data preview surat masuk");
        }

        setDetail(result.data as SuratMasukDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat preview surat masuk");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [suratId]);

  const previewKind = useMemo(() => detectPreviewKind(detail?.file_path), [detail?.file_path]);

  const title = detail ? `Nomor Surat ${detail.nomor_surat}` : "Preview Surat Masuk";
  const fileName = getFileNameFromPath(detail?.file_path);

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto mb-6 max-w-6xl">
        <Link
          href="/kepala-desa/surat-masuk"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Daftar Surat Masuk
        </Link>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Preview Surat Masuk</h1>
            <p className="text-sm text-slate-500">{detail ? title : "Memuat dokumen surat masuk"}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {detail?.file_path ? (
              <>
                <a
                  href={detail.file_path}
                  download={fileName}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Unduh File
                </a>
                <a
                  href={detail.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiExternalLink className="h-4 w-4" /> Buka File Asli
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div className="p-5 md:p-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-sm text-slate-500">Memuat preview dokumen...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {!loading && !error && previewKind === "pdf" && detail?.file_path ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <iframe
                src={detail.file_path}
                title={title}
                className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
              />
            </div>
          ) : null}

          {!loading && !error && previewKind === "image" && detail?.file_path ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <img src={detail.file_path} alt={title} className="mx-auto max-w-full rounded-lg shadow-sm" />
              </div>
            </div>
          ) : null}

          {!loading && !error && previewKind === "docx" && detail?.file_path ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <object
                  data={detail.file_path}
                  type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="min-h-[78vh] w-full"
                >
                  <div className="p-4 text-sm text-slate-600">
                    Browser tidak mendukung preview Word langsung. Gunakan tombol <strong>Buka File Asli</strong> atau <strong>Unduh File</strong>.
                  </div>
                </object>
              </div>
            </div>
          ) : null}

          {!loading && !error && previewKind === "doc" && detail?.file_path ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <object
                  data={detail.file_path}
                  type="application/msword"
                  className="min-h-[78vh] w-full"
                >
                  <div className="p-4 text-sm text-slate-600">
                    Browser tidak mendukung preview Word langsung. Gunakan tombol <strong>Buka File Asli</strong> atau <strong>Unduh File</strong>.
                  </div>
                </object>
              </div>
            </div>
          ) : null}

          {!loading && !error && (previewKind === "unsupported" || previewKind === "missing") ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              File belum tersedia atau jenis file ini belum didukung untuk preview langsung.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
