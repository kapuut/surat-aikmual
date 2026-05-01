'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiDownload, FiRefreshCw } from 'react-icons/fi';
import SimpleLayout from '@/components/layout/SimpleLayout';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Table';
import { Button } from '@/components/ui/button';
import { generateSuratPDFClient, generateSuratFilename } from '@/lib/surat-generator/pdf-generator';
import { SuratData } from '@/lib/surat-generator/types';

type WorkflowStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

interface TrackingDetail {
  id: number | string;
  nik?: string;
  jenis_surat: string;
  nomor_surat: string | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  tanggal_dibuat?: string | null;
  tanggal_permohonan?: string | null;
  tanggal_selesai?: string | null;
  catatan?: string | null;
  alasan_penolakan?: string | null;
  file_path?: string | null;
  processed_by_name?: string | null;
}

const KNOWN_STATUSES: WorkflowStatus[] = [
  'pending',
  'diproses',
  'dikirim_ke_kepala_desa',
  'perlu_revisi',
  'ditandatangani',
  'selesai',
  'ditolak',
];

function normalizeStatus(status: string | null | undefined): WorkflowStatus {
  const normalized = String(status || 'pending').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return KNOWN_STATUSES.includes(normalized as WorkflowStatus)
    ? (normalized as WorkflowStatus)
    : 'pending';
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildPdfUrl(data: TrackingDetail): string {
  if (typeof data.file_path === 'string' && data.file_path.trim()) {
    const path = data.file_path.trim();
    return `${path}${path.includes('?') ? '&' : '?'}print=1`;
  }

  return `/api/admin/permohonan/${data.id}/preview?print=1`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function getStatusDescription(status: WorkflowStatus): string {
  switch (status) {
    case 'pending':
      return 'Permohonan Anda sudah masuk dan sedang menunggu verifikasi awal.';
    case 'diproses':
      return 'Permohonan sedang diproses oleh petugas desa.';
    case 'dikirim_ke_kepala_desa':
      return 'Permohonan sudah dikirim ke Kepala Desa untuk persetujuan.';
    case 'perlu_revisi':
      return 'Permohonan perlu revisi. Silakan cek catatan petugas di bawah.';
    case 'ditandatangani':
      return 'Surat sudah ditandatangani dan siap diunduh.';
    case 'selesai':
      return 'Permohonan selesai. Dokumen final tersedia untuk diunduh.';
    case 'ditolak':
      return 'Permohonan ditolak. Silakan cek alasan penolakan di bawah.';
    default:
      return '-';
  }
}

function getImportantNote(detail: TrackingDetail, status: WorkflowStatus): { label: string; text: string; tone: 'red' | 'amber' | 'blue' } | null {
  if (status === 'ditolak') {
    return {
      label: 'Alasan Penolakan',
      text: (detail.alasan_penolakan || detail.catatan || 'Permohonan ditolak tanpa catatan tambahan.').trim(),
      tone: 'red',
    };
  }

  if (status === 'perlu_revisi') {
    return {
      label: 'Catatan Revisi',
      text: (detail.alasan_penolakan || detail.catatan || 'Permohonan perlu revisi. Silakan hubungi petugas desa.').trim(),
      tone: 'amber',
    };
  }

  if (detail.catatan && detail.catatan.trim()) {
    return {
      label: 'Catatan Petugas',
      text: detail.catatan.trim(),
      tone: 'blue',
    };
  }

  return null;
}

export default function TrackingDetailPage() {
  const params = useParams<{ id: string }>();
  const permohonanId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : (rawId || '');
  }, [params]);

  const [detail, setDetail] = useState<TrackingDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!permohonanId) {
      setFetchError('ID permohonan tidak valid.');
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      setFetchError(null);

      const response = await fetch(`/api/tracking/${encodeURIComponent(permohonanId)}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal memuat detail permohonan');
      }

      setDetail(data as TrackingDetail);
    } catch (error) {
      console.error('Error fetching detail permohonan:', error);
      setFetchError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat detail');
      setDetail(null);
    } finally {
      setLoadingData(false);
    }
  }, [permohonanId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const normalizedStatus = normalizeStatus(detail?.status);
  const canDownload = normalizedStatus === 'selesai' || normalizedStatus === 'ditandatangani';
  const importantNote = detail ? getImportantNote(detail, normalizedStatus) : null;

  const noteColorClass = {
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
  };

  return (
    <SimpleLayout useSidebar>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2">
            <Link href="/tracking" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              <FiArrowLeft className="h-4 w-4" />
              Kembali ke daftar tracking
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Detail Permohonan</h1>
          <p className="mt-1 text-gray-600">Informasi lengkap permohonan surat Anda.</p>
        </div>

        {!loadingData && !fetchError && detail && (
          <Button variant="outline" size="sm" onClick={fetchDetail}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {loadingData && (
        <Card>
          <CardBody>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {!loadingData && fetchError && (
        <Card>
          <CardBody>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {fetchError}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" className="w-full sm:w-auto" onClick={fetchDetail}>
                Coba Lagi
              </Button>
              <Link href="/tracking">
                <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                  Kembali
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {!loadingData && !fetchError && detail && (
        <>
          <Card>
            <CardHeader
              title={detail.jenis_surat || 'Permohonan Surat'}
              description={`ID Permohonan: ${detail.id}`}
              action={<StatusBadge status={normalizedStatus} />}
            />
            <CardBody>
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {getStatusDescription(normalizedStatus)}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailItem
                  label="Tanggal Pengajuan"
                  value={formatDateLabel(detail.tanggal_permohonan || detail.tanggal_dibuat || detail.created_at)}
                />
                <DetailItem
                  label="Tanggal Selesai"
                  value={formatDateLabel(detail.tanggal_selesai || detail.updated_at)}
                />
                <DetailItem
                  label="Nomor Surat"
                  value={detail.nomor_surat || 'Belum diterbitkan'}
                />
                <DetailItem
                  label="Diproses Oleh"
                  value={detail.processed_by_name || '-'}
                />
              </div>

              {importantNote && (
                <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${noteColorClass[importantNote.tone]}`}>
                  <p className="font-semibold">{importantNote.label}</p>
                  <p className="mt-1">{importantNote.text}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Aksi Dokumen" />
            <CardBody>
              {canDownload ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      // Fetch the HTML content first
                      const pdfUrl = buildPdfUrl(detail);
                      const response = await fetch(pdfUrl);
                      if (!response.ok) throw new Error('Gagal mengambil konten surat');
                      
                      const htmlText = await response.text();
                      
                      // Create a temporary container to hold the HTML
                      const container = document.createElement('div');
                      container.innerHTML = htmlText;
                      container.style.position = 'fixed';
                      container.style.left = '-9999px';
                      container.style.top = '0';
                      container.style.width = '21cm'; // A4 width
                      document.body.appendChild(container);
                      
                      // Import html2canvas dynamically
                      const html2canvas = (await import('html2canvas')).default;
                      const { jsPDF } = await import('jspdf');
                      
                      // Wait for images
                      const images = Array.from(container.getElementsByTagName('img'));
                      await Promise.all(images.map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                      }));

                      // Wait a bit more for fonts/layout
                      await new Promise(r => setTimeout(r, 500));

                      const canvas = await html2canvas(container, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        windowWidth: 794, // 21cm at 96dpi
                      });
                      
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      const pdfWidth = pdf.internal.pageSize.getWidth();
                      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                      
                      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                      pdf.save(`surat-${detail.jenis_surat || 'desa'}-${detail.id}.pdf`);
                      
                      document.body.removeChild(container);
                    } catch (error) {
                      console.error('PDF Generation error:', error);
                      // Fallback to window.open if generation fails
                      window.open(buildPdfUrl(detail), '_blank');
                    }
                  }}
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  Unduh PDF
                </Button>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <FiClock className="h-4 w-4" />
                  Dokumen final belum tersedia. Mohon tunggu proses verifikasi selesai.
                </p>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </SimpleLayout>
  );
}
