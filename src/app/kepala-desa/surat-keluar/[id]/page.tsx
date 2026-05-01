"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiDownload, FiExternalLink, FiFileText } from "react-icons/fi";

interface SuratKeluarDetail {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
  file_path?: string | null;
  attachment_paths?: string[];
  created_by_name?: string | null;
  is_auto_from_permohonan?: boolean;
}

type PreviewKind = "pdf" | "image" | "docx" | "doc" | "unsupported" | "missing";

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

function getFileNameFromPath(filePath?: string | null): string {
  if (!filePath) {
    return "-";
  }

  const segments = filePath.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : filePath;
}

function detectPreviewKind(filePath: string | null | undefined): PreviewKind {
  if (!filePath) {
    return "missing";
  }

  const normalizedPath = filePath.toLowerCase();

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function HtmlIframe({ url, title }: { url: string; title: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.text();
      })
      .then((text) => {
        if (isMounted) setContent(text);
      })
      .catch((err) => {
        console.error("Failed to fetch HTML:", err);
        if (isMounted) setError(true);
      });
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error) {
    return (
      <iframe
        src={url}
        title={title}
        className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
      />
    );
  }

  if (content === null) {
    return (
      <div className="flex min-h-[78vh] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
        Memuat preview...
      </div>
    );
  }

  return (
    <iframe
      srcDoc={content}
      title={title}
      className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
    />
  );
}

export default function DetailKepalaDesaSuratKeluarPage() {
  const params = useParams<{ id: string }>();
  const suratId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : (rawId || "");
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SuratKeluarDetail | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!suratId) {
        setError("ID surat keluar tidak valid");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/surat-keluar/${encodeURIComponent(suratId)}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal memuat detail surat keluar");
        }

        setDetail(result.data as SuratKeluarDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail surat keluar");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [suratId]);

  const previewKind = useMemo(() => detectPreviewKind(detail?.file_path), [detail?.file_path]);
  const fileName = getFileNameFromPath(detail?.file_path);
  const attachmentPaths = Array.isArray(detail?.attachment_paths) ? detail.attachment_paths : [];

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/kepala-desa/laporan/surat-keluar"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Daftar Surat Keluar
        </Link>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat detail surat keluar...</p>
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
                <h2 className="text-xl font-bold text-gray-900">Detail Surat Keluar</h2>
                <p className="text-sm text-gray-500">Informasi lengkap surat keluar nomor {detail.nomor_surat || "-"}</p>
              </div>

              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                Kepala Desa
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailRow label="Nomor Surat" value={detail.nomor_surat || "-"} />
              <DetailRow label="Tujuan" value={detail.tujuan || "-"} />
              <DetailRow label="Tanggal Surat" value={formatDate(detail.tanggal_surat)} />
              <DetailRow label="Status" value={detail.status || "-"} />
              <DetailRow
                label="Dibuat Oleh"
                value={detail.created_by_name || (detail.is_auto_from_permohonan ? "Otomatis dari Permohonan" : "-")}
              />
              <DetailRow label="Perihal" value={detail.perihal || "-"} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Dokumen Utama</h3>
              {detail.file_path ? (
                <div className="inline-flex items-center gap-2">
                  <a
                    href={detail.file_path}
                    download={fileName}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <FiDownload className="h-4 w-4" /> Unduh File
                  </a>
                  <a
                    href={detail.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <FiExternalLink className="h-4 w-4" /> Buka File Asli
                  </a>
                </div>
              ) : null}
            </div>

            {detail.file_path ? (
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-gray-600">Nama file: {fileName}</p>
                <p className="break-all text-xs text-gray-400">Path: {detail.file_path}</p>
              </div>
            ) : (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
                <FiFileText className="h-4 w-4" />
                {detail.is_auto_from_permohonan
                  ? "Dokumen belum dibuat. Permohonan ini perlu diproses ulang oleh Admin melalui halaman Permohonan Warga."
                  : "Dokumen surat belum tersedia."}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Preview Dokumen</h3>

            {previewKind === "pdf" && detail.file_path ? (
              <div className="mt-3 space-y-3">
                {/\.(html|htm|xhtml)$/i.test(detail.file_path) ? (
                  <HtmlIframe url={detail.file_path} title={`Preview surat keluar ${detail.nomor_surat || ""}`} />
                ) : (
                  <iframe
                    src={detail.file_path}
                    title={`Preview surat keluar ${detail.nomor_surat || ""}`}
                    className="min-h-[78vh] w-full rounded-xl border border-slate-200 bg-slate-100"
                  />
                )}
              </div>
            ) : null}

            {previewKind === "image" && detail.file_path ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <img
                  src={detail.file_path}
                  alt={`Preview surat keluar ${detail.nomor_surat || ""}`}
                  className="mx-auto max-w-full rounded-lg shadow-sm"
                />
              </div>
            ) : null}

            {previewKind === "docx" && detail.file_path ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
            ) : null}

            {previewKind === "doc" && detail.file_path ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
            ) : null}

            {(previewKind === "unsupported" || previewKind === "missing") && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {previewKind === "missing" && detail.is_auto_from_permohonan
                  ? "Surat belum dibuat. Admin perlu memproses permohonan ini (ubah status ke Selesai) agar dokumen tersedia."
                  : "File belum tersedia atau jenis file ini belum didukung untuk preview langsung."}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Lampiran</h3>

            {attachmentPaths.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Tidak ada lampiran pada surat ini.</p>
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
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                        <span className="text-sm font-medium text-slate-700">Lampiran {index + 1}: {attachmentFileName}</span>
                        <a
                          href={attachmentPath}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Buka File
                        </a>
                      </div>

                      {isImage && (
                        <div className="flex justify-center bg-slate-50 p-3">
                          <img
                            src={attachmentPath}
                            alt={`Lampiran ${index + 1}`}
                            className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
                          />
                        </div>
                      )}

                      {isPdf && (
                        <iframe
                          src={attachmentPath}
                          title={`Lampiran ${index + 1}`}
                          className="h-[50vh] w-full border-0"
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
        </div>
      )}
    </section>
  );
}
