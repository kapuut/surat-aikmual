"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiEdit2, FiExternalLink } from "react-icons/fi";

interface SuratMasukDetail {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  urgensi?: "rendah" | "sedang" | "tinggi" | string;
  perihal: string;
  file_path?: string | null;
  created_by_name?: string | null;
}

function formatUrgensi(rawValue: unknown): string {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "Tinggi";
  if (value === "rendah") return "Rendah";
  return "Sedang";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

export default function DetailSuratMasukPage() {
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
          throw new Error(result.error || "Gagal memuat detail surat masuk");
        }

        setDetail(result.data as SuratMasukDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail surat masuk");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [suratId]);

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/surat-masuk"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Daftar Surat Masuk
        </Link>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat detail surat masuk...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && detail && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detail Surat Masuk</h2>
                <p className="text-sm text-gray-500">Informasi lengkap surat masuk nomor {detail.nomor_surat}</p>
              </div>

              <Link
                href={`/admin/surat-masuk/${detail.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                <FiEdit2 className="h-4 w-4" /> Edit Surat
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow label="Nomor Surat" value={detail.nomor_surat} />
              <DetailRow label="Asal Surat" value={detail.asal_surat} />
              <DetailRow label="Tanggal Surat" value={formatDate(detail.tanggal_surat)} />
              <DetailRow label="Tanggal Diterima" value={formatDate(detail.tanggal_terima)} />
              <DetailRow label="Urgensi" value={formatUrgensi(detail.urgensi)} />
              <DetailRow label="Dibuat Oleh" value={detail.created_by_name || "-"} />
              <DetailRow label="Perihal" value={detail.perihal} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Dokumen</h3>
            {detail.file_path ? (
              <a
                href={`/admin/surat-masuk/${detail.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
              >
                <FiExternalLink className="h-4 w-4" /> Lihat file surat
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Dokumen surat belum tersedia.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
