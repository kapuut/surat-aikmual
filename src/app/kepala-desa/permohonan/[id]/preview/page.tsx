"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiDownload, FiExternalLink } from "react-icons/fi";

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
}

type PreviewKind = "pdf" | "image" | "docx" | "doc" | "unsupported" | "missing";

function statusLabel(status: WorkflowStatus): string {
  switch (status) {
    case "pending": return "Baru";
    case "diproses": return "Diproses";
    case "dikirim_ke_kepala_desa": return "Menunggu TTD Kepala Desa";
    case "perlu_revisi": return "Perlu Revisi";
    case "ditandatangani": return "Ditandatangani";
    case "selesai": return "Selesai";
    case "ditolak": return "Ditolak";
    default: return status;
  }
}

function detectPreviewKind(url: string | null | undefined): PreviewKind {
  if (!url) return "missing";

  const lower = url.toLowerCase();
  if (lower.includes("/api/admin/permohonan/")) return "pdf";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(html|htm|xhtml)$/i.test(lower)) return "pdf";
  if (/\.(png|jpe?g|webp|gif)$/i.test(lower)) return "image";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  return "unsupported";
}

export default function KepalaDesaPermohonanPreviewPage() {
  const params = useParams<{ id: string }>();
  const permohonanId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : (raw ?? "");
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

        const response = await fetch("/api/admin/permohonan", { credentials: "include" });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Gagal memuat data permohonan");
        }

        const rows = Array.isArray(result.data) ? (result.data as PermohonanItem[]) : [];
        const found = rows.find((item) => item.id === Number(permohonanId));

        if (!found) {
          throw new Error("Data permohonan tidak ditemukan");
        }

        setDetail(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat preview");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [permohonanId]);

  const isFinalized = detail?.status === "ditandatangani" || detail?.status === "selesai";

  const previewUrl = useMemo(() => {
    if (!detail) return null;
    return isFinalized
      ? `/api/admin/permohonan/${detail.id}/preview`
      : `/api/admin/permohonan/${detail.id}/preview?mode=admin`;
  }, [detail, isFinalized]);

  const downloadUrl = useMemo(() => {
    if (!previewUrl) return null;
    return `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}download=doc`;
  }, [previewUrl]);

  const previewKind = useMemo(() => detectPreviewKind(previewUrl), [previewUrl]);

  const nomorSurat = detail
    ? detail.nomor_surat || `REG-${detail.id}/${new Date(detail.created_at).getFullYear()}`
    : "";

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto mb-6 max-w-6xl">
        <Link
          href="/kepala-desa/permohonan"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Daftar Permohonan
        </Link>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isFinalized ? "Surat Final" : "Draft Surat"}
            </h1>
            {detail && (
              <p className="mt-1 text-sm text-slate-500">
                {nomorSurat} &mdash; {detail.jenis_surat}
              </p>
            )}
          </div>

          {detail && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {statusLabel(detail.status)}
              </span>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <FiDownload className="h-4 w-4" /> Unduh Draft (.doc)
                </a>
              )}
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiExternalLink className="h-4 w-4" /> Buka File Asli
                </a>
              )}
            </div>
          )}
        </div>

        {/* Info pemohon */}
        {detail && (
          <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-4 border-b border-slate-100">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pemohon</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detail.nama_pemohon}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">NIK</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detail.nik}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Jenis Surat</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detail.jenis_surat}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Keperluan</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detail.keperluan}</p>
            </div>
          </div>
        )}

        {/* File viewer */}
        <div className="space-y-4 p-5 md:p-6">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-sm text-slate-500">Memuat dokumen...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && previewKind === "pdf" && previewUrl && (
            <iframe
              src={previewUrl}
              title={`Preview ${nomorSurat}`}
              className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
            />
          )}

          {!loading && !error && previewKind === "image" && previewUrl && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <img src={previewUrl} alt={`Preview ${nomorSurat}`} className="mx-auto max-w-full rounded-lg shadow-sm" />
            </div>
          )}

          {!loading && !error && (previewKind === "docx" || previewKind === "doc") && previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <object
                data={previewUrl}
                type={previewKind === "docx"
                  ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  : "application/msword"
                }
                className="min-h-[78vh] w-full"
              >
                <div className="p-4 text-sm text-slate-600">
                  Browser tidak mendukung preview Word langsung. Gunakan tombol{" "}
                  <strong>Buka File Asli</strong> atau <strong>Unduh Draft</strong>.
                </div>
              </object>
            </div>
          )}

          {!loading && !error && (previewKind === "unsupported" || previewKind === "missing") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              File belum tersedia atau jenis file ini belum didukung untuk preview langsung.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
