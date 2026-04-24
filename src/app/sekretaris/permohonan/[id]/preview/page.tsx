"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiExternalLink, FiDownload } from "react-icons/fi";

type WorkflowStatus =
  | "pending"
  | "diproses"
  | "dikirim_ke_kepala_desa"
  | "perlu_revisi"
  | "ditandatangani"
  | "selesai"
  | "ditolak";

interface PermohonanItem {
  id: number;
  nomor_surat: string | null;
  created_at: string;
  nama_pemohon: string;
  nik: string;
  jenis_surat: string;
  keperluan: string;
  status: WorkflowStatus;
  file_path: string | null;
  attachment_paths?: string[];
}

type PreviewKind = "pdf" | "image" | "docx" | "doc" | "unsupported" | "missing";

function isFinalizedStatus(status: WorkflowStatus): boolean {
  return status === "ditandatangani" || status === "selesai";
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  const lowerPath = pathValue.toLowerCase();
  return lowerPath.includes("/generated-surat/") || lowerPath.endsWith(".html") || lowerPath.includes(".html?");
}

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

  if (normalizedPath.includes("/api/admin/permohonan/")) {
    return "pdf";
  }

  if (normalizedPath.endsWith(".pdf")) {
    return "pdf";
  }

  if (/\.(html|htm|xhtml)$/i.test(normalizedPath)) {
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

export default function SekretarisPermohonanPreviewPage() {
  const params = useParams<{ id: string }>();
  const permohonanId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : (rawId || "");
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PermohonanItem | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!permohonanId) {
        setError("ID permohonan tidak valid");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/permohonan", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data permohonan");
        }

        const rows = Array.isArray(result.data) ? (result.data as PermohonanItem[]) : [];
        const idAsNumber = Number(permohonanId);
        const current = rows.find((item) => item.id === idAsNumber);

        if (!current) {
          throw new Error("Data permohonan tidak ditemukan");
        }

        setDetail(current);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat preview");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [permohonanId]);

  const isFinalized = useMemo(() => (detail ? isFinalizedStatus(detail.status) : false), [detail]);

  const previewUrl = useMemo(() => {
    if (!detail) return null;

    const canUseFinalFile = isFinalized && isGeneratedSuratFile(detail.file_path);
    if (canUseFinalFile && detail.file_path) {
      return detail.file_path;
    }

    return isFinalized
      ? `/api/admin/permohonan/${detail.id}/preview`
      : `/api/admin/permohonan/${detail.id}/preview?mode=admin`;
  }, [detail, isFinalized]);

  const downloadDocUrl = useMemo(() => {
    if (!detail) return null;

    const base = isFinalized
      ? `/api/admin/permohonan/${detail.id}/preview`
      : `/api/admin/permohonan/${detail.id}/preview?mode=admin`;

    return `${base}${base.includes("?") ? "&" : "?"}download=doc`;
  }, [detail, isFinalized]);

  const previewKind = useMemo(() => detectPreviewKind(previewUrl), [previewUrl]);
  const title = detail
    ? `${detail.nomor_surat || `REG-${detail.id}/${new Date(detail.created_at).getFullYear()}`} - ${detail.jenis_surat}`
    : "Preview Permohonan";
  const fileName = getFileNameFromPath(previewUrl);
  const attachmentPaths = Array.isArray(detail?.attachment_paths) ? detail.attachment_paths : [];

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto mb-6 max-w-6xl">
        <Link
          href="/sekretaris/permohonan"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Daftar Permohonan
        </Link>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Preview Permohonan</h1>
            <p className="text-sm text-slate-500">{detail ? title : "Memuat dokumen permohonan"}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {downloadDocUrl ? (
              <a
                href={downloadDocUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <FiDownload className="h-4 w-4" /> Unduh Draft (.doc)
              </a>
            ) : null}
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FiExternalLink className="h-4 w-4" /> Buka File Asli
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-sm text-slate-500">Memuat preview dokumen...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {!loading && !error && previewKind === "pdf" && previewUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <iframe
                src={previewUrl}
                title={title}
                className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
              />
            </div>
          ) : null}

          {!loading && !error && previewKind === "image" && previewUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <img src={previewUrl} alt={title} className="mx-auto max-w-full rounded-lg shadow-sm" />
              </div>
            </div>
          ) : null}

          {!loading && !error && previewKind === "docx" && previewUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <object
                  data={previewUrl}
                  type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="min-h-[78vh] w-full"
                >
                  <div className="p-4 text-sm text-slate-600">
                    Browser tidak mendukung preview Word langsung. Gunakan tombol <strong>Buka File Asli</strong> atau <strong>Unduh Draft</strong>.
                  </div>
                </object>
              </div>
            </div>
          ) : null}

          {!loading && !error && previewKind === "doc" && previewUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Nama file: {fileName}</p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <object data={previewUrl} type="application/msword" className="min-h-[78vh] w-full">
                  <div className="p-4 text-sm text-slate-600">
                    Browser tidak mendukung preview Word langsung. Gunakan tombol <strong>Buka File Asli</strong> atau <strong>Unduh Draft</strong>.
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

          {!loading && !error && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-900">Lampiran Permohonan</h2>
              {attachmentPaths.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Tidak ada lampiran pada permohonan ini.</p>
              ) : (
                <div className="mt-3 space-y-4">
                  {attachmentPaths.map((attachmentPath, index) => {
                    const lowerPath = attachmentPath.toLowerCase();
                    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(lowerPath);
                    const isPdf = /\.pdf$/i.test(lowerPath);
                    const attachmentFileName = getFileNameFromPath(attachmentPath);

                    return (
                      <div
                        key={`${attachmentPath}-${index}`}
                        className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-700">Lampiran {index + 1}: {attachmentFileName}</span>
                          <a
                            href={attachmentPath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-blue-600 hover:underline shrink-0"
                          >
                            Buka File
                          </a>
                        </div>
                        {isImage && (
                          <div className="p-3 bg-slate-50 flex justify-center">
                            <img
                              src={attachmentPath}
                              alt={`Lampiran ${index + 1}`}
                              className="max-w-full max-h-[60vh] rounded-lg shadow-sm object-contain"
                            />
                          </div>
                        )}
                        {isPdf && (
                          <iframe
                            src={attachmentPath}
                            title={`Lampiran ${index + 1}`}
                            className="w-full h-[50vh] border-0"
                          />
                        )}
                        {!isImage && !isPdf && (
                          <div className="px-3 py-3 text-sm text-slate-500">
                            Preview tidak tersedia untuk jenis file ini. Gunakan tombol Buka File untuk membukanya.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
