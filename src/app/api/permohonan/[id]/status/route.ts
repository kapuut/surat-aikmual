import { db } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';
import { uploadText } from '@/lib/storage';
import QRCode from 'qrcode';
import { createHash, createHmac } from 'crypto';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateNomorSurat } from '@/lib/surat-generator/nomor-surat';
import { normalizeSuratSlug } from '@/lib/surat-data';
import { isWhatsAppApiConfigured, sendWhatsAppNotification } from '@/lib/whatsapp';
import type { UserRole } from '@/lib/types';
import { type JenisSurat, type SuratData } from '@/lib/surat-generator/types';
import { renderTemplateWithValues } from '@/lib/template-surat/render-template';
import { normalizeCustomTemplateHtml } from '@/lib/template-surat/official-layout';
import { buildOfficialDynamicSystemValues } from '@/lib/template-surat/official-defaults';

export const runtime = 'nodejs';

type PermohonanRow = {
  id: number;
  nama_pemohon: string;
  nik: string;
  alamat: string;
  telepon?: string | null;
  jenis_surat: string;
  keperluan: string;
  status: string;
  catatan: string | null;
  nomor_surat: string | null;
  file_path: string | null;
  data_detail?: string | null;
  email?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | Date | null;
  jenis_kelamin?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  status_perkawinan?: string | null;
  kewarganegaraan?: string | null;
  masa_berlaku_dari?: string | Date | null;
  masa_berlaku_sampai?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

type DetailData = Record<string, unknown>;

type DynamicTemplateGenerationRow = RowDataPacket & {
  id: string;
  nama: string;
  jenis_surat: string;
  html_template: string;
};

type DynamicTemplateGeneration = {
  id: string;
  nama: string;
  jenisSurat: string;
  htmlTemplate: string;
};

type NormalizedStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

type InternalRole = Extract<UserRole, 'admin' | 'kepala_desa'>;

function normalizeStatus(input: unknown): NormalizedStatus | null {
  const value = String(input ?? '').trim().toLowerCase();
  if (['pending', 'menunggu'].includes(value)) return 'pending';
  if (['diproses', 'proses', 'in_progress', 'in-progress'].includes(value)) return 'diproses';
  if (
    [
      'dikirim_ke_kepala_desa',
      'dikirim ke kepala desa',
      'dikirim-kepala-desa',
      'siap tandatangan',
      'siap_tandatangan',
      'terverifikasi',
      'verified',
    ].includes(value)
  ) {
    return 'dikirim_ke_kepala_desa';
  }
  if (['perlu_revisi', 'perlu revisi', 'revisi'].includes(value)) return 'perlu_revisi';
  if (['ditandatangani', 'signed', 'tertanda'].includes(value)) return 'ditandatangani';
  if (['selesai', 'approved', 'disetujui', 'approve'].includes(value)) return 'selesai';
  if (['ditolak', 'rejected', 'tolak', 'reject'].includes(value)) return 'ditolak';
  return null;
}

function inferStatusFromNote(note: unknown): NormalizedStatus | null {
  const text = String(note || '').trim().toLowerCase();
  if (!text) return null;

  if (text.includes('ditolak') || text.includes('tolak')) return 'ditolak';
  if (text.includes('revisi')) return 'perlu_revisi';
  if (text.includes('kepala desa') && (text.includes('dikirim') || text.includes('tanda tangan'))) {
    return 'dikirim_ke_kepala_desa';
  }
  if (text.includes('ditandatangani')) return 'ditandatangani';
  if (text.includes('selesai') || text.includes('final')) return 'selesai';

  return null;
}

function normalizePerihalArchiveDetail(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (/^-+$/.test(normalized)) return '';
  if (['-', '--', 'null', 'undefined', 'n/a', 'na'].includes(normalized)) return '';

  return String(value ?? '').trim();
}

function normalizeCurrentStatus(rawStatus: unknown, nomorSurat: unknown, note?: unknown): NormalizedStatus {
  const normalized = normalizeStatus(rawStatus);
  if (normalized) return normalized;

  const inferredFromNote = inferStatusFromNote(note);
  if (inferredFromNote) return inferredFromNote;

  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'dikirim_ke_kepala_desa';
  }

  return 'pending';
}

function getDefaultStatusNote(status: NormalizedStatus, role: InternalRole): string {
  if (status === 'dikirim_ke_kepala_desa') {
    return 'Data diverifikasi admin dan dikirim ke Kepala Desa untuk proses tanda tangan.';
  }

  if (status === 'perlu_revisi') {
    return role === 'kepala_desa'
      ? 'Permohonan dikembalikan untuk revisi oleh Kepala Desa.'
      : 'Permohonan perlu revisi oleh admin.';
  }

  if (status === 'ditandatangani') {
    return 'Surat telah ditandatangani oleh Kepala Desa.';
  }

  if (status === 'selesai') {
    return 'Permohonan selesai diproses dan surat siap digunakan.';
  }

  if (status === 'ditolak') {
    return role === 'kepala_desa'
      ? 'Permohonan ditolak oleh Kepala Desa.'
      : 'Permohonan ditolak oleh admin.';
  }

  if (status === 'diproses') {
    return 'Permohonan sedang diproses oleh admin.';
  }

  return 'Permohonan menunggu verifikasi admin.';
}

function statusLabel(status: NormalizedStatus): string {
  const labels: Record<NormalizedStatus, string> = {
    pending: 'Menunggu Verifikasi',
    diproses: 'Diproses',
    dikirim_ke_kepala_desa: 'Dikirim ke Kepala Desa',
    perlu_revisi: 'Perlu Revisi',
    ditandatangani: 'Ditandatangani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
  };

  return labels[status];
}

function canTransitionStatus(
  role: InternalRole,
  currentStatus: NormalizedStatus,
  nextStatus: NormalizedStatus
): boolean {
  if (currentStatus === nextStatus) return true;

  if (role === 'admin') {
    if (nextStatus === 'dikirim_ke_kepala_desa') {
      return ['pending', 'diproses', 'perlu_revisi'].includes(currentStatus);
    }
    if (nextStatus === 'ditolak') {
      return ['pending', 'diproses', 'perlu_revisi', 'dikirim_ke_kepala_desa'].includes(currentStatus);
    }
    if (nextStatus === 'diproses') {
      return ['pending', 'perlu_revisi'].includes(currentStatus);
    }
    if (nextStatus === 'pending') {
      return currentStatus === 'perlu_revisi';
    }
    return false;
  }

  if (role === 'kepala_desa') {
    if (nextStatus === 'perlu_revisi') {
      return currentStatus === 'dikirim_ke_kepala_desa';
    }
    if (nextStatus === 'ditandatangani') {
      return currentStatus === 'dikirim_ke_kepala_desa';
    }
    if (nextStatus === 'selesai') {
      return ['dikirim_ke_kepala_desa', 'ditandatangani'].includes(currentStatus);
    }
    return false;
  }

  return false;
}

function isUnknownColumnError(error: unknown): boolean {
  return String((error as any)?.message || '').toLowerCase().includes('unknown column');
}

async function upsertSuratKeluarArchive(
  connection: any,
  params: {
    nomorSurat: string;
    perihal: string;
    tujuan: string;
    filePath: string | null;
    createdBy: number | null;
    tanggal: string;
  }
) {
  const updateVariants: Array<{ query: string; values: unknown[] }> = [
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  status = 'aktif',
                  tanggal = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?
                AND LOWER(TRIM(perihal)) = LOWER(TRIM(?))`,
      values: [params.perihal, params.tujuan, params.filePath, params.tanggal, params.nomorSurat, params.perihal],
    },
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  status = 'aktif',
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?
                AND LOWER(TRIM(perihal)) = LOWER(TRIM(?))`,
      values: [params.perihal, params.tujuan, params.filePath, params.nomorSurat, params.perihal],
    },
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?
                AND LOWER(TRIM(perihal)) = LOWER(TRIM(?))`,
      values: [params.perihal, params.tujuan, params.filePath, params.nomorSurat, params.perihal],
    },
  ];

  for (const variant of updateVariants) {
    try {
      const [result]: any = await connection.execute(variant.query, variant.values);
      if (result?.affectedRows > 0) {
        return;
      }
      break;
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }

  const insertVariants: Array<{ query: string; values: unknown[] }> = [
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tanggal, tujuan, perihal, file_path, status, created_by)
              VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tujuan, perihal, file_path, status, created_by)
              VALUES (?, ?, ?, ?, ?, 'aktif', ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tujuan, perihal, file_path, created_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
  ];

  for (const variant of insertVariants) {
    try {
      await connection.execute(variant.query, variant.values);
      return;
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }
}

async function updatePermohonanStatusRow(
  connection: any,
  params: {
    status: NormalizedStatus;
    catatan: string | null;
    nomorSurat: string | null;
    filePath: string | null;
    processedBy: number | null;
    id: string;
  }
) {
  const updateVariants: Array<{ query: string; values: unknown[] }> = [
    {
      query: `UPDATE permohonan_surat
              SET status = ?,
                  catatan = COALESCE(?, catatan),
                  nomor_surat = COALESCE(?, nomor_surat),
                  file_path = COALESCE(?, file_path),
                  processed_by = COALESCE(?, processed_by),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
      values: [params.status, params.catatan, params.nomorSurat, params.filePath, params.processedBy, params.id],
    },
    {
      query: `UPDATE permohonan_surat
              SET status = ?,
                  catatan = COALESCE(?, catatan),
                  nomor_surat = COALESCE(?, nomor_surat),
                  dokumen_path = COALESCE(?, dokumen_path),
                  processed_by = COALESCE(?, processed_by),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
      values: [params.status, params.catatan, params.nomorSurat, params.filePath, params.processedBy, params.id],
    },
    {
      query: `UPDATE permohonan_surat
              SET status = ?,
                  catatan = COALESCE(?, catatan),
                  nomor_surat = COALESCE(?, nomor_surat),
                  processed_by = COALESCE(?, processed_by),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
      values: [params.status, params.catatan, params.nomorSurat, params.processedBy, params.id],
    },
    {
      query: `UPDATE permohonan_surat
              SET status = ?,
                  catatan = COALESCE(?, catatan),
                  nomor_surat = COALESCE(?, nomor_surat),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
      values: [params.status, params.catatan, params.nomorSurat, params.id],
    },
  ];

  for (const variant of updateVariants) {
    try {
      await connection.execute(variant.query, variant.values);
      return;
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }
}

function toJenisSurat(value: string): JenisSurat | null {
  const slug = normalizeSuratSlug(value);
  return slug ? (slug as JenisSurat) : null;
}

function toNomorSuratScope(value: string | null | undefined): string {
  const knownSlug = normalizeSuratSlug(value);
  if (knownSlug) return knownSlug;

  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'global';
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned || undefined;
}

function formatDateIndonesian(value: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

async function findDynamicTemplateForGeneration(
  jenisSurat: string,
  dynamicTemplateId?: string
): Promise<DynamicTemplateGeneration | null> {
  try {
    if (dynamicTemplateId && dynamicTemplateId.trim()) {
      const [rows] = await db.query<DynamicTemplateGenerationRow[]>(
        `SELECT id, nama, jenis_surat, html_template
         FROM dynamic_template_surat
         WHERE id = ? AND status = 'aktif'
         LIMIT 1`,
        [dynamicTemplateId.trim()]
      );

      const row = rows?.[0];
      if (row) {
        return {
          id: row.id,
          nama: row.nama,
          jenisSurat: row.jenis_surat,
          htmlTemplate: row.html_template,
        };
      }
    }

    const [rows] = await db.query<DynamicTemplateGenerationRow[]>(
      `SELECT id, nama, jenis_surat, html_template
       FROM dynamic_template_surat
       WHERE LOWER(TRIM(jenis_surat)) = LOWER(TRIM(?))
         AND status = 'aktif'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [jenisSurat]
    );

    const row = rows?.[0];
    if (!row) return null;

    return {
      id: row.id,
      nama: row.nama,
      jenisSurat: row.jenis_surat,
      htmlTemplate: row.html_template,
    };
  } catch (error: unknown) {
    const message = String((error as { message?: unknown })?.message || '').toLowerCase();
    if (message.includes("doesn't exist") || message.includes('does not exist')) {
      return null;
    }
    throw error;
  }
}

function buildDynamicTemplateValuesForGeneration(
  permohonan: PermohonanRow,
  detailData: DetailData,
  nomorSurat: string,
  tanggalSurat: Date,
  signerName?: string
): Record<string, string> {
  const createdAtDate = asDate(permohonan.created_at) || tanggalSurat;
  const values: Record<string, string> = {
    nama: String(permohonan.nama_pemohon || '').trim(),
    nik: String(permohonan.nik || '').trim(),
    alamat: String(permohonan.alamat || '').trim(),
    keperluan: String(permohonan.keperluan || '-').trim() || '-',
    jenis_surat: String(permohonan.jenis_surat || '').trim(),
    tanggal_permohonan: formatDateIndonesian(createdAtDate),
    ...buildOfficialDynamicSystemValues(formatDateIndonesian(tanggalSurat), nomorSurat, signerName),
  };

  for (const [key, rawValue] of Object.entries(detailData)) {
    if (rawValue == null) continue;

    if (typeof rawValue === 'string') {
      values[key] = rawValue;
      continue;
    }

    if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      values[key] = String(rawValue);
      continue;
    }

    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
      values[key] = formatDateIndonesian(rawValue);
    }
  }

  return values;
}

function renderDynamicSuratDocument(
  jenisSurat: string,
  renderedHtml: string,
  signatureOpts?: { signatureImageUrl?: string; qrCodeDataUrl?: string }
): string {
  // Official KOP surat header — same as static surat types
  const kopHtml = `
    <div style="margin-bottom:0.7cm;">
      <div style="display:grid;grid-template-columns:98px 1fr;column-gap:10px;align-items:center;">
        <div style="width:98px;height:98px;display:flex;align-items:center;justify-content:center;">
          <img src="/images/logo-loteng.png" alt="Logo Lombok Tengah" style="width:88px;height:88px;object-fit:contain;" />
        </div>
        <div style="text-align:center;padding-right:98px;font-family:'Times New Roman',serif;">
          <div style="font-size:14pt;font-weight:bold;letter-spacing:0.03em;text-transform:uppercase;">PEMERINTAH KABUPATEN LOMBOK TENGAH</div>
          <div style="font-size:14pt;font-weight:bold;text-transform:uppercase;">KECAMATAN PRAYA</div>
          <div style="font-size:14pt;font-weight:bold;text-transform:uppercase;margin-bottom:1px;">DESA AIKMUAL</div>
          <div style="font-size:9pt;border:1px solid #111;padding:2px 6px;display:inline-block;min-width:86%;white-space:nowrap;">Alamat : Jln raya Praya &ndash; Mantang KM 07 Aikmual Praya Phone 08175726709 / 08175790747 Kode Post 83500</div>
        </div>
      </div>
      <div style="margin-top:4px;border-top:1px solid #000;border-bottom:2px solid #000;height:3px;"></div>
    </div>`;

  // Replace the blank signature spacer with actual TTD images when signing
  let body = renderedHtml;
  const hasSignature = signatureOpts?.signatureImageUrl || signatureOpts?.qrCodeDataUrl;
  if (hasSignature) {
    const parts: string[] = [];
    if (signatureOpts!.qrCodeDataUrl) {
      parts.push(
        `<div style="width:2.35cm;text-align:center;order:1;">` +
        `<img src="${signatureOpts!.qrCodeDataUrl}" alt="QR verifikasi surat" ` +
        `style="width:1.95cm;height:1.95cm;object-fit:contain;border:1px solid #111;padding:0.04cm;background:#fff;" /></div>`
      );
    }
    if (signatureOpts!.signatureImageUrl) {
      parts.push(
        `<img src="${signatureOpts!.signatureImageUrl}" alt="Tanda tangan Kepala Desa" ` +
        `style="width:3.2cm;height:2.1cm;object-fit:contain;order:2;" />`
      );
    }
    const assetsHtml =
      `<div style="margin-top:0.35cm;min-height:2.35cm;display:flex;justify-content:center;` +
      `align-items:flex-end;gap:0.3cm;flex-direction:row;break-inside:avoid;">` +
      parts.join('') + `</div>`;
    // Replace spacer used in OFFICIAL_SIGNATURE_BLOCK
    body = body.replace('<div style="height: 2.2cm;"></div>', assetsHtml);
    // Replace spacer used in fallback template
    body = body.replace('<div style="height: 78px;"></div>', assetsHtml);
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Surat ${jenisSurat}</title>
  <style>
    body { margin: 0; background: #f1f5f9; padding: 16px; font-family: 'Bookman Old Style', 'Book Antiqua', serif; font-size: 12pt; line-height: 1.5; color: #000; }
    .paper { width: 21cm; min-height: 29.7cm; margin: 0 auto; background: #fff; padding: 1.2cm 1.3cm; box-shadow: 0 10px 25px rgba(15,23,42,0.12); }
    @media print {
      body { background: #fff; padding: 0; }
      .paper { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="paper">${kopHtml}${body}</div>
</body>
</html>`;
}

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const dateValue = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

function normalizeGender(value: unknown): 'Laki-laki' | 'Perempuan' | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const lowered = text.toLowerCase();
  if (lowered.includes('laki')) return 'Laki-laki';
  if (lowered.includes('perempuan')) return 'Perempuan';
  return undefined;
}

function parseDetailData(value: unknown): DetailData {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as DetailData;
  }

  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as DetailData;
    }
    return {};
  } catch {
    return {};
  }
}

function getTextWithDetail(primaryValue: unknown, detailData: DetailData, keys: string[]): string | undefined {
  const fromPrimary = asText(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = asText(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

function getDateWithDetail(primaryValue: unknown, detailData: DetailData, keys: string[]): Date | undefined {
  const fromPrimary = asDate(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = asDate(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

function getGenderWithDetail(
  primaryValue: unknown,
  detailData: DetailData,
  keys: string[]
): 'Laki-laki' | 'Perempuan' | undefined {
  const fromPrimary = normalizeGender(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = normalizeGender(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
}

function getAppBaseUrl(): string {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

async function resolvePemohonWhatsAppNumber(
  detailData: DetailData,
  permohonan: PermohonanRow
): Promise<string | null> {
  const fromDetail = getTextWithDetail(undefined, detailData, [
    'telepon',
    'noTelp',
    'no_telp',
    'phone',
    'no_hp',
    'nomor_hp',
    'no_wa',
    'nomor_wa',
    'whatsapp',
  ]);

  if (fromDetail) {
    return fromDetail;
  }

  const fromPermohonan = asText(permohonan.telepon);
  if (fromPermohonan) {
    return fromPermohonan;
  }

  const nikRaw = String(permohonan.nik || '').trim();
  const nikBase = normalizeNikValue(nikRaw);
  const email = asText(permohonan.email)?.toLowerCase() || '';

  if (!nikRaw && !nikBase && !email) {
    return null;
  }

  const [userRows]: any = await db.execute(
    `SELECT telepon
     FROM users
     WHERE telepon IS NOT NULL
       AND telepon <> ''
       AND (
         nik = ?
         OR SUBSTRING_INDEX(nik, '_', 1) = ?
         OR (? <> '' AND LOWER(email) = ?)
       )
     ORDER BY CASE WHEN SUBSTRING_INDEX(nik, '_', 1) = ? THEN 0 ELSE 1 END
     LIMIT 1`,
    [nikRaw || nikBase, nikBase || nikRaw, email, email, nikBase || nikRaw]
  );

  return asText(userRows?.[0]?.telepon) || null;
}

function buildVerificationCode(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 16).toUpperCase();
}

function buildIntegrityToken(source: string): string {
  const secret = process.env.QR_SIGN_SECRET || process.env.JWT_SECRET || 'aikmual-signature-secret';
  return createHmac('sha256', secret).update(source).digest('hex').slice(0, 24).toUpperCase();
}

async function createPermohonanQrCode(params: {
  id: number;
  nomorSurat: string;
  nik: string;
  namaPemohon: string;
  jenisSurat: string;
  keperluan: string;
  suratUntuk: string;
  pembuatSurat: string;
}): Promise<{ dataUrl: string; verificationCode: string }> {
  const source = [
    params.id,
    params.nomorSurat,
    params.nik,
    params.namaPemohon,
    params.jenisSurat,
    params.keperluan,
    params.suratUntuk,
    params.pembuatSurat,
  ].join('|');

  const verificationCode = buildVerificationCode(source);
  const integrityToken = buildIntegrityToken(source);
  const verifyUrl = `${getAppBaseUrl()}/verifikasi-surat?permohonan=${params.id}&kode=${verificationCode}&token=${integrityToken}`;

  // Use verification URL directly so mobile scanners open verification page immediately.
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    width: 180,
    margin: 1,
  });

  return { dataUrl, verificationCode };
}

async function getNextNomorSuratWithLock(
  connection: any,
  tanggal: Date,
  scopeKey: string
): Promise<string> {
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const tahun = String(tanggal.getFullYear());
  const suffix = `/${bulan}.${tahun}`;
  const normalizedScope = (scopeKey || 'global').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const nomorScope = normalizedScope || 'global';
  const lockName = `permohonan_surat_nomor_${nomorScope}_${bulan}_${tahun}`;

  await connection.execute('SELECT GET_LOCK(?, 10)', [lockName]);
  try {
    const [rows]: any = await connection.execute(
      `SELECT nomor_surat, jenis_surat, status, catatan
       FROM permohonan_surat
       WHERE nomor_surat LIKE ?
       ORDER BY id DESC
       FOR UPDATE`,
      [`%${suffix}`]
    );

    const scopedRows = Array.isArray(rows)
      ? rows.filter((row: any) => {
          const rowStatus = normalizeCurrentStatus(row?.status, row?.nomor_surat, row?.catatan);
          if (rowStatus === 'ditolak') return false;
          const rowScope = toNomorSuratScope(String(row?.jenis_surat || ''));
          return rowScope === scopeKey;
        })
      : [];

    let nomorUrut = 1;
    if (scopedRows.length > 0 && typeof scopedRows[0].nomor_surat === 'string') {
      const parsed = parseInt(String(scopedRows[0].nomor_surat).split('/')[0], 10);
      nomorUrut = Number.isFinite(parsed) ? parsed + 1 : 1;
    }

    return generateNomorSurat(nomorUrut, tanggal);
  } finally {
    await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

async function saveGeneratedSuratHtml(
  htmlContent: string,
  nomorSurat: string,
  jenisSurat: string
): Promise<string> {
  const safeNomor = nomorSurat.replace(/[^a-zA-Z0-9.-]+/g, '-');
  const safeJenisSurat = String(jenisSurat || 'surat').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase();
  const fileName = `${safeNomor}-${safeJenisSurat}.html`;
  const storagePath = `generated-surat/${fileName}`;
  return uploadText(storagePath, htmlContent, 'text/html');
}

async function resolveUserIdFieldForLookup(): Promise<'id' | 'id_user'> {
  try {
    const [columnsRaw] = await db.query<any[]>('SHOW COLUMNS FROM users');
    const columns = Array.isArray(columnsRaw) ? columnsRaw : [];
    const columnSet = new Set(columns.map((item: any) => String(item?.Field || '')));
    return columnSet.has('id') ? 'id' : 'id_user';
  } catch {
    return 'id';
  }
}

async function queryKepalaDesaRow(sql: string, params: unknown[] = []): Promise<Record<string, unknown> | null> {
  try {
    const [rows]: any = await db.execute(sql, params);
    return (rows as any[])?.[0] || null;
  } catch {
    return null;
  }
}

async function resolveKepalaDesaSigner(userId: number | null): Promise<{ nama: string; signatureUrl: string }> {
  const fallback = { nama: 'Kepala Desa', signatureUrl: '/images/sample-ttd.png' };

  try {
    const idField = await resolveUserIdFieldForLookup();

    if (userId && Number.isFinite(userId) && userId > 0) {
      // Try with signature_url; if that column doesn't exist yet, fall back to nama-only query
      let byActor = await queryKepalaDesaRow(
        `SELECT nama, signature_url FROM users WHERE ${idField} = ? AND role = 'kepala_desa' LIMIT 1`,
        [userId]
      );
      if (!byActor) {
        byActor = await queryKepalaDesaRow(
          `SELECT nama FROM users WHERE ${idField} = ? AND role = 'kepala_desa' LIMIT 1`,
          [userId]
        );
      }
      const byActorName = String(byActor?.nama || '').trim();
      const byActorSignature = String(byActor?.signature_url || '').trim();
      if (byActorName || byActorSignature) {
        return {
          nama: byActorName || fallback.nama,
          signatureUrl: byActorSignature || fallback.signatureUrl,
        };
      }
    }

    // Role-based lookup — try with signature_url first, then nama-only if column missing
    let kepalaDesa = await queryKepalaDesaRow(
      `SELECT nama, signature_url FROM users WHERE role = 'kepala_desa' LIMIT 1`
    );
    if (!kepalaDesa) {
      kepalaDesa = await queryKepalaDesaRow(
        `SELECT nama FROM users WHERE role = 'kepala_desa' LIMIT 1`
      );
    }

    const signerName = String(kepalaDesa?.nama || '').trim();
    const signerSignature = String(kepalaDesa?.signature_url || '').trim();

    return {
      nama: signerName || fallback.nama,
      signatureUrl: signerSignature || fallback.signatureUrl,
    };
  } catch {
    return fallback;
  }
}

/**
 * Ensure permohonan_surat.status is VARCHAR(50) instead of a restrictive ENUM.
 * The original schema used ENUM('pending','diproses','selesai','ditolak') but
 * the workflow requires 7 status values. This auto-migrates on first request.
 */
let statusColumnChecked = false;
async function ensureStatusColumnIsVarchar(): Promise<void> {
  if (statusColumnChecked) return;
  try {
    const [rows]: any = await db.execute(
      `SELECT COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'permohonan_surat'
         AND COLUMN_NAME = 'status'
       LIMIT 1`
    );
    const colType = String((rows as any[])?.[0]?.COLUMN_TYPE || '').toLowerCase();
    if (colType.startsWith('enum')) {
      console.log('[permohonan] Migrating status column from ENUM to VARCHAR(50)...');
      await db.execute(
        "ALTER TABLE permohonan_surat MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'"
      );
      console.log('[permohonan] status column migrated successfully.');
    }
    statusColumnChecked = true;
  } catch (error) {
    console.error('[permohonan] ensureStatusColumnIsVarchar error:', error instanceof Error ? error.message : String(error));
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Auto-migrate ENUM → VARCHAR on first request to prevent "Data truncated" error
  await ensureStatusColumnIsVarchar();

  const connection = await db.getConnection();
  let whatsappNotification:
    | 'not_triggered'
    | 'not_configured'
    | 'no_number'
    | 'sent'
    | 'failed' = 'not_triggered';
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getUser(token);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!['admin', 'kepala_desa'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const normalizedStatus = normalizeStatus(payload?.status);
    const catatan = typeof payload?.catatan === 'string' ? payload.catatan.trim() : null;
    const actorRole: InternalRole = authUser.role === 'kepala_desa' ? 'kepala_desa' : 'admin';
    const effectiveCatatan = normalizedStatus
      ? (catatan || getDefaultStatusNote(normalizedStatus, actorRole))
      : catatan;

    const processedByNumber = Number(authUser.id);
    const processedBy = Number.isFinite(processedByNumber) && processedByNumber > 0
      ? processedByNumber
      : null;

    if (!normalizedStatus) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [permohonanRows]: any = await connection.execute(
      'SELECT * FROM permohonan_surat WHERE id = ? FOR UPDATE',
      [params.id]
    );

    if (!permohonanRows || permohonanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Permohonan tidak ditemukan' }, { status: 404 });
    }

    const permohonan = permohonanRows[0] as PermohonanRow;
    const currentStatus = normalizeCurrentStatus(permohonan.status, permohonan.nomor_surat, permohonan.catatan);

    if (!canTransitionStatus(authUser.role as InternalRole, currentStatus, normalizedStatus)) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Transisi status dari ${statusLabel(currentStatus)} ke ${statusLabel(normalizedStatus)} tidak diizinkan untuk role ${authUser.role}`,
        },
        { status: 403 }
      );
    }

    const finalStatuses: NormalizedStatus[] = ['selesai'];
    const shouldSendReadyNotification =
      finalStatuses.includes(normalizedStatus) && !finalStatuses.includes(currentStatus);

    let nomorSurat = permohonan.nomor_surat;
    let generatedFilePath = permohonan.file_path;

    const shouldGenerateSurat = ['dikirim_ke_kepala_desa', 'ditandatangani', 'selesai'].includes(normalizedStatus);

    if (shouldGenerateSurat) {
      const signerInfo = await resolveKepalaDesaSigner(processedBy);
      const detailData = parseDetailData(permohonan.data_detail);
      const jenisSurat = toJenisSurat(permohonan.jenis_surat);
      const dynamicTemplateId = asText(detailData.dynamic_template_id);
      // For static surat types, check if admin has saved a DB override template
      const staticDbOverride = jenisSurat
        ? await findDynamicTemplateForGeneration(permohonan.jenis_surat, jenisSurat)
        : null;
      const dynamicTemplate = staticDbOverride
        || (jenisSurat
          ? null
          : await findDynamicTemplateForGeneration(permohonan.jenis_surat, dynamicTemplateId));

      const tanggalSurat = new Date();
      const generatedJenisSuratKey = jenisSurat || dynamicTemplate?.id || permohonan.jenis_surat;
      const nomorSuratScope = toNomorSuratScope(permohonan.jenis_surat);

      if (!nomorSurat) {
        nomorSurat = await getNextNomorSuratWithLock(connection, tanggalSurat, nomorSuratScope);
      }

      const shouldEmbedSignature = ['ditandatangani', 'selesai'].includes(normalizedStatus);
      const shouldRegenerateSurat = !generatedFilePath || shouldEmbedSignature;

      if (!jenisSurat || staticDbOverride) {
        if (shouldRegenerateSurat) {
          const renderValues = buildDynamicTemplateValuesForGeneration(
            permohonan,
            detailData,
            nomorSurat,
            tanggalSurat,
            signerInfo.nama
          );

          if (shouldEmbedSignature) {
            const signatureImageUrl = signerInfo.signatureUrl;
            const qr = await createPermohonanQrCode({
              id: Number(params.id),
              nomorSurat,
              nik: permohonan.nik,
              namaPemohon: permohonan.nama_pemohon,
              jenisSurat: permohonan.jenis_surat,
              keperluan: permohonan.keperluan,
              suratUntuk: `${permohonan.nama_pemohon} (${permohonan.nik})`,
              pembuatSurat: authUser.nama || 'Admin',
            });

            renderValues.qr_code = qr.dataUrl;
            renderValues.kode_verifikasi = qr.verificationCode;
            renderValues.ttd_kepala_desa = signatureImageUrl;
            renderValues.signature_image_url = signatureImageUrl;
          }

          const fallbackTemplate = `
            <div style="font-family: 'Bookman Old Style', 'Book Antiqua', serif; font-size: 12pt; line-height: 1.5; color: #000;">
              <h2 style="text-align:center; margin: 0 0 6px 0; text-transform: uppercase; text-decoration: underline;">{{jenis_surat}}</h2>
              <div style="text-align:center; margin-bottom: 16px;">Nomor : {{nomor_surat}}</div>
              <p style="margin: 0 0 10px 0; text-align: justify; text-indent: 1.2cm;">Yang bertanda tangan di bawah ini Kepala Desa {{nama_desa}} menerangkan bahwa:</p>
              <table style="width:100%; border-collapse:collapse; margin: 0 0 14px 0;">
                <tr><td style="width:200px; vertical-align:top;">Nama</td><td style="width:12px; vertical-align:top;">:</td><td style="vertical-align:top;">{{nama}}</td></tr>
                <tr><td style="vertical-align:top;">NIK</td><td style="vertical-align:top;">:</td><td style="vertical-align:top;">{{nik}}</td></tr>
                <tr><td style="vertical-align:top;">Alamat</td><td style="vertical-align:top;">:</td><td style="vertical-align:top;">{{alamat}}</td></tr>
                <tr><td style="vertical-align:top;">Keperluan</td><td style="vertical-align:top;">:</td><td style="vertical-align:top;">{{keperluan}}</td></tr>
              </table>
              <p style="margin: 0; text-align: justify; text-indent: 1.2cm;">Demikian surat ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>
              <div style="margin-top: 22px; display: flex; justify-content: flex-end;">
                <div style="width: 290px; text-align: center;">
                  <div>{{kota}}, {{tanggal_surat}}</div>
                  <div style="text-transform: uppercase;">Kepala Desa {{nama_desa}}</div>
                  <div style="height: 78px;"></div>
                  <div style="font-weight: bold; text-transform: uppercase; text-decoration: underline;">{{nama_kepala_desa}}</div>
                </div>
              </div>
            </div>
          `;

          const templateBody = dynamicTemplate
            ? normalizeCustomTemplateHtml(dynamicTemplate.htmlTemplate)
            : fallbackTemplate;
          const templateTitle = dynamicTemplate?.jenisSurat || permohonan.jenis_surat || 'Surat Keterangan';
          const htmlBody = renderTemplateWithValues(templateBody, renderValues);
          const htmlContent = renderDynamicSuratDocument(templateTitle, htmlBody, {
            signatureImageUrl: renderValues.ttd_kepala_desa,
            qrCodeDataUrl: renderValues.qr_code,
          });
          generatedFilePath = await saveGeneratedSuratHtml(htmlContent, nomorSurat, generatedJenisSuratKey);
        }
      } else {
      const tempatLahir = getTextWithDetail(permohonan.tempat_lahir, detailData, [
        'tempat_lahir',
        'tempatLahir',
        'tempat_lahir_pemohon',
        'tempatLahirPemohon',
      ]);
      const tanggalLahir = getDateWithDetail(permohonan.tanggal_lahir, detailData, [
        'tanggal_lahir',
        'tanggalLahir',
        'tanggal_lahir_pemohon',
        'tanggalLahirPemohon',
      ]);
      const jenisKelamin = getGenderWithDetail(permohonan.jenis_kelamin, detailData, [
        'jenis_kelamin',
        'jenisKelamin',
        'jenis_kelamin_pemohon',
        'jenisKelaminPemohon',
      ]);
      const agama = getTextWithDetail(permohonan.agama, detailData, ['agama']);
      const pekerjaan = getTextWithDetail(permohonan.pekerjaan, detailData, [
        'pekerjaan',
        'pekerjaan_pemohon',
        'pekerjaanPemohon',
      ]);
      const statusPerkawinan = getTextWithDetail(permohonan.status_perkawinan, detailData, [
        'status_perkawinan',
        'statusPerkawinan',
        'status_perkawinan_pemohon',
        'statusPerkawinanPemohon',
        'status',
      ]);
      const namaAlmarhum = getTextWithDetail(undefined, detailData, [
        'nama_almarhum',
        'namaAlmarhum',
      ]);
      const nikAlmarhum = getTextWithDetail(undefined, detailData, [
        'nik_almarhum',
        'nikAlmarhum',
      ]);
      const tempatLahirAlmarhum = getTextWithDetail(undefined, detailData, [
        'tempat_lahir_almarhum',
        'tempatLahirAlmarhum',
        'tempat_lahir',
        'tempatLahir',
      ]);
      const tanggalLahirAlmarhum = getDateWithDetail(undefined, detailData, [
        'tanggal_lahir_almarhum',
        'tanggalLahirAlmarhum',
        'tanggal_lahir',
        'tanggalLahir',
      ]);
      const jenisKelaminAlmarhum = getGenderWithDetail(undefined, detailData, [
        'jenis_kelamin_almarhum',
        'jenisKelaminAlmarhum',
        'jenis_kelamin',
        'jenisKelamin',
      ]);
      const agamaAlmarhum = getTextWithDetail(undefined, detailData, [
        'agama_almarhum',
        'agamaAlmarhum',
        'agama',
      ]);
      const pekerjaanAlmarhum = getTextWithDetail(undefined, detailData, [
        'pekerjaan_almarhum',
        'pekerjaanAlmarhum',
        'pekerjaan',
      ]);
      const alamatTerakhir = getTextWithDetail(undefined, detailData, [
        'alamat_terakhir',
        'alamatTerakhir',
        'alamat_almarhum',
        'alamatAlmarhum',
      ]);
      const hubunganPelapor = getTextWithDetail(undefined, detailData, [
        'hubungan_pelapor',
        'hubunganPelapor',
        'hubungan_dengan_almarhum',
        'hubunganDenganAlmarhum',
      ]);
      const tanggalMeninggal = getDateWithDetail(undefined, detailData, [
        'tanggal_meninggal',
        'tanggalMeninggal',
        'tanggal_kematian',
      ]);
      const waktuMeninggal = getTextWithDetail(undefined, detailData, [
        'waktu_meninggal',
        'waktuMeninggal',
      ]);
      const tempatMeninggal = getTextWithDetail(undefined, detailData, [
        'tempat_meninggal',
        'tempatMeninggal',
      ]);
      const sebabKematian = getTextWithDetail(undefined, detailData, [
        'sebab_kematian',
        'sebabKematian',
        'sebabMeninggal',
      ]);
      const tanggalPemakaman = getDateWithDetail(undefined, detailData, [
        'tanggal_pemakaman',
        'tanggalPemakaman',
      ]);
      const waktuPemakaman = getTextWithDetail(undefined, detailData, [
        'waktu_pemakaman',
        'waktuPemakaman',
      ]);
      const tempatPemakaman = getTextWithDetail(undefined, detailData, [
        'tempat_pemakaman',
        'tempatPemakaman',
      ]);
      const namaMantan = getTextWithDetail(undefined, detailData, [
        'nama_mantan',
        'namaMantan',
      ]);
      const nikPasangan = getTextWithDetail(undefined, detailData, [
        'nik_pasangan',
        'nikPasangan',
        'nik_mantan',
        'nikMantan',
      ]);
      const tempatLahirPasangan = getTextWithDetail(undefined, detailData, [
        'tempat_lahir_pasangan',
        'tempatLahirPasangan',
        'tempat_lahir_mantan',
        'tempatLahirMantan',
      ]);
      const tanggalLahirPasangan = getDateWithDetail(undefined, detailData, [
        'tanggal_lahir_pasangan',
        'tanggalLahirPasangan',
        'tanggal_lahir_mantan',
        'tanggalLahirMantan',
      ]);
      const kewarganegaraanPasangan =
        getTextWithDetail(undefined, detailData, ['kewarganegaraan_pasangan', 'kewarganegaraanPasangan']) ||
        'Indonesia';
      const agamaPasangan = getTextWithDetail(undefined, detailData, [
        'agama_pasangan',
        'agamaPasangan',
        'agama_mantan',
        'agamaMantan',
      ]);
      const pekerjaanPasangan = getTextWithDetail(undefined, detailData, [
        'pekerjaan_pasangan',
        'pekerjaanPasangan',
        'pekerjaan_mantan',
        'pekerjaanMantan',
      ]);
      const alamatPasangan = getTextWithDetail(undefined, detailData, [
        'alamat_pasangan',
        'alamatPasangan',
        'alamat_mantan',
        'alamatMantan',
      ]);
      const tanggalCerai = getDateWithDetail(undefined, detailData, [
        'tanggal_cerai',
        'tanggalCerai',
      ]);
      const nomorAktaCerai = getTextWithDetail(undefined, detailData, [
        'nomor_akta_cerai',
        'nomorAktaCerai',
        'no_akta_cerai',
        'noAktaCerai',
      ]);
      const tempatCerai = getTextWithDetail(undefined, detailData, [
        'tempat_cerai',
        'tempatCerai',
        'pengadilanCerai',
      ]);
      const teleponPemohon = getTextWithDetail(undefined, detailData, [
        'telepon',
        'noTelp',
        'no_telp',
        'nomor_hp',
        'no_hp',
        'nomor_wa',
        'no_wa',
        'whatsapp',
      ]);
      const statusJanda = getTextWithDetail(undefined, detailData, [
        'status_janda',
        'statusJanda',
      ]);
      const alasanStatusJanda = getTextWithDetail(undefined, detailData, [
        'alasan_status_janda',
        'alasanStatusJanda',
        'alasan_status',
        'alasanStatus',
        'sebab_status',
        'sebabStatus',
      ]);
      const namaPasanganJanda = getTextWithDetail(undefined, detailData, [
        'nama_pasangan',
        'namaPasangan',
      ]);
      const tanggalKejadianJanda = getDateWithDetail(undefined, detailData, [
        'tanggal_kejadian',
        'tanggalKejadian',
      ]);
      const statusPemohonKehilangan = getTextWithDetail(permohonan.status_perkawinan, detailData, [
        'statusPerkawinan',
        'status_perkawinan',
        'status',
      ]);
      const penyandangCacat = getTextWithDetail(undefined, detailData, [
        'penyandangCacat',
        'penyandang_cacat',
      ]);
      const jenisBarang = getTextWithDetail(undefined, detailData, [
        'jenisBarang',
        'jenis_barang',
        'kategoriBarang',
        'kategori_barang',
      ]);
      const barangHilang = getTextWithDetail(undefined, detailData, [
        'barangHilang',
        'barang_hilang',
        'namaBarang',
        'nama_barang',
        'objekKehilangan',
        'objek_kehilangan',
      ]);
      const asalBarang = getTextWithDetail(undefined, detailData, [
        'asalBarang',
        'asal_barang',
        'instansiBarang',
        'instansi_barang',
      ]);
      const labelNomorBarang = getTextWithDetail(undefined, detailData, [
        'labelNomorBarang',
        'label_nomor_barang',
      ]);
      const nomorBarang = getTextWithDetail(undefined, detailData, [
        'nomorBarang',
        'nomor_barang',
      ]);
      const ciriBarang = getTextWithDetail(undefined, detailData, [
        'ciriBarang',
        'ciri_barang',
        'deskripsiBarang',
        'deskripsi_barang',
      ]);
      const uraianKehilangan = getTextWithDetail(undefined, detailData, [
        'keteranganKehilangan',
        'keterangan_kehilangan',
        'uraianKehilangan',
        'uraian_kehilangan',
        'keluhanPemohon',
        'keluhan_pemohon',
      ]);
      const lokasiKehilangan = getTextWithDetail(undefined, detailData, [
        'lokasiKehilangan',
        'lokasi_kehilangan',
      ]);
      const tanggalKehilangan = getDateWithDetail(undefined, detailData, [
        'tanggalKehilangan',
        'tanggal_kehilangan',
      ]);
      const pendidikan = getTextWithDetail(undefined, detailData, [
        'pendidikan',
        'pendidikanTerakhir',
        'pendidikan_terakhir',
      ]);
      const namaWali = getTextWithDetail(undefined, detailData, [
        'nama_wali',
        'namaWali',
      ]);
      const nikWali = getTextWithDetail(undefined, detailData, [
        'nik_wali',
        'nikWali',
      ]);
      const tempatLahirWali = getTextWithDetail(undefined, detailData, [
        'tempat_lahir_wali',
        'tempatLahirWali',
      ]);
      const tanggalLahirWali = getDateWithDetail(undefined, detailData, [
        'tanggal_lahir_wali',
        'tanggalLahirWali',
      ]);
      const jenisKelaminWali = getGenderWithDetail(undefined, detailData, [
        'jenis_kelamin_wali',
        'jenisKelaminWali',
      ]);
      const agamaWali = getTextWithDetail(undefined, detailData, [
        'agama_wali',
        'agamaWali',
      ]);
      const sumberPenghasilan = getTextWithDetail(undefined, detailData, [
        'sumber_penghasilan',
        'sumberPenghasilan',
      ]);
      const penghasilanPerBulan = getTextWithDetail(undefined, detailData, [
        'penghasilan_per_bulan',
        'penghasilanPerBulan',
        'nominal_penghasilan',
        'nominalPenghasilan',
      ]);
      const dasarKeterangan = getTextWithDetail(undefined, detailData, [
        'dasar_keterangan',
        'dasarKeterangan',
      ]);
      const statusTempatTinggal = getTextWithDetail(undefined, detailData, [
        'status_tempat_tinggal',
        'statusTempatTinggal',
      ]);
      const namaPemilikRumah = getTextWithDetail(undefined, detailData, [
        'nama_pemilik_rumah',
        'namaPemilikRumah',
      ]);
      const hubunganDenganPemilik = getTextWithDetail(undefined, detailData, [
        'hubungan_dengan_pemilik',
        'hubunganDenganPemilik',
      ]);
      const alamatTinggalSekarang = getTextWithDetail(undefined, detailData, [
        'alamat_tinggal_sekarang',
        'alamatTinggalSekarang',
      ]);
      const lamaMenempati = getTextWithDetail(undefined, detailData, [
        'lama_menempati',
        'lamaMenempati',
      ]);
      const jumlahTanggungan = getTextWithDetail(undefined, detailData, [
        'jumlah_tanggungan',
        'jumlahTanggungan',
      ]);
      const alasanTidakMemiliki = getTextWithDetail(undefined, detailData, [
        'alasan_tidak_memiliki',
        'alasanTidakMemiliki',
      ]);
      const mulaiUsaha = getTextWithDetail(undefined, detailData, [
        'mulai_usaha',
        'mulaiUsaha',
      ]);
      const jenisUsaha = getTextWithDetail(undefined, detailData, [
        'jenis_usaha',
        'jenisUsaha',
        'nama_usaha',
        'namaUsaha',
      ]);
      const isSuratKematian = jenisSurat === 'surat-kematian';
      const isSuratCerai = jenisSurat === 'surat-cerai';
      const isSuratJanda = jenisSurat === 'surat-janda';
      const isSuratKehilangan = jenisSurat === 'surat-kehilangan';
      const isSuratPenghasilan = jenisSurat === 'surat-penghasilan';
      const isSuratTidakPunyaRumah = jenisSurat === 'surat-tidak-punya-rumah';
      const isSuratUsaha = jenisSurat === 'surat-usaha';
      const kewarganegaraan =
        getTextWithDetail(permohonan.kewarganegaraan, detailData, ['kewarganegaraan']) || 'Indonesia';
      const masaBerlakuDari =
        getDateWithDetail(permohonan.masa_berlaku_dari, detailData, ['masa_berlaku_dari', 'masaBerlakuDari']) ||
        tanggalSurat;
      const masaBerlakuSampai =
        getDateWithDetail(permohonan.masa_berlaku_sampai, detailData, ['masa_berlaku_sampai', 'masaBerlakuSampai']) ||
        new Date(masaBerlakuDari.getFullYear(), masaBerlakuDari.getMonth() + 6, masaBerlakuDari.getDate());
      const nomorSuratScope = toNomorSuratScope(permohonan.jenis_surat);

      if (!nomorSurat) {
        nomorSurat = await getNextNomorSuratWithLock(connection, tanggalSurat, nomorSuratScope);
      }

      const shouldEmbedSignature = ['ditandatangani', 'selesai'].includes(normalizedStatus);
      const shouldRegenerateSurat = !generatedFilePath || shouldEmbedSignature;

      if (shouldRegenerateSurat) {
        let qrCodeDataUrl: string | undefined;
        let verificationCode: string | undefined;
        let signatureImageUrl: string | undefined;

        if (shouldEmbedSignature) {
          signatureImageUrl = signerInfo.signatureUrl;
          const qr = await createPermohonanQrCode({
            id: Number(params.id),
            nomorSurat,
            nik: permohonan.nik,
            namaPemohon: permohonan.nama_pemohon,
            jenisSurat: permohonan.jenis_surat,
            keperluan: permohonan.keperluan,
            suratUntuk: `${permohonan.nama_pemohon} (${permohonan.nik})`,
            pembuatSurat: authUser.nama || (actorRole === 'kepala_desa' ? 'Kepala Desa' : 'Admin'),
          });
          qrCodeDataUrl = qr.dataUrl;
          verificationCode = qr.verificationCode;
        }

        const suratData: SuratData = {
          jenisSurat,
          nomorSurat,
          tanggalSurat,
          nama: isSuratKematian ? (namaAlmarhum || permohonan.nama_pemohon) : permohonan.nama_pemohon,
          nik: isSuratKematian ? (nikAlmarhum || permohonan.nik) : permohonan.nik,
          tempatLahir: isSuratKematian ? (tempatLahirAlmarhum || tempatLahir) : tempatLahir,
          tanggalLahir: isSuratKematian ? (tanggalLahirAlmarhum || tanggalLahir) : tanggalLahir,
          jeniKelamin: isSuratKematian ? (jenisKelaminAlmarhum || jenisKelamin) : jenisKelamin,
          agama: isSuratKematian ? (agamaAlmarhum || agama) : agama,
          pekerjaan: isSuratKematian ? (pekerjaanAlmarhum || pekerjaan) : pekerjaan,
          statusPerkawinan,
          kewarganegaraan,
          tanggalBerlaku: {
            dari: masaBerlakuDari,
            sampai: masaBerlakuSampai,
          },
          alamat: isSuratKematian ? (alamatTerakhir || permohonan.alamat) : permohonan.alamat,
          isiSurat: isSuratCerai
            ? `Bahwa berdasarkan data administrasi kependudukan yang ada, benar ${permohonan.nama_pemohon} telah bercerai secara sah dengan ${namaMantan || 'pasangannya'}.`
            : isSuratJanda
              ? `Bahwa yang namanya tersebut diatas memang benar berstatus ${statusJanda || 'Janda/Duda'}${alasanStatusJanda ? ` (${alasanStatusJanda})` : ''}.`
              : isSuratPenghasilan
                ? `Bahwa yang namanya tersebut di atas merupakan penduduk Desa Aikmual dan merupakan anak/tanggungan dari ${namaWali || 'wali yang bersangkutan'}. Berdasarkan keterangan ${dasarKeterangan || 'Kepala Dusun setempat'}, penghasilan wali/orang tua yang bersangkutan sebesar ${penghasilanPerBulan || 'sesuai keterangan'} per bulan${sumberPenghasilan ? ` dari ${sumberPenghasilan}` : ''}.`
              : isSuratTidakPunyaRumah
                ? `Orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, dan memang yang bersangkutan Belum Memiliki Rumah.`
              : isSuratUsaha
                ? `Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, yang memiliki usaha ${jenisUsaha || '-'}.`
              : isSuratKehilangan
                ? `Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dan telah kehilangan ${barangHilang || 'barang penting'}${jenisBarang ? ` yang tergolong ${jenisBarang}` : ''}${asalBarang ? ` milik/berasal dari ${asalBarang}` : ''}${nomorBarang ? ` dengan ${labelNomorBarang || 'Nomor'}: ${nomorBarang}` : ''}${lokasiKehilangan ? ` di ${lokasiKehilangan}` : ''}${uraianKehilangan ? `. Menurut keterangan pemohon ${uraianKehilangan}` : ''}${ciriBarang ? `. Barang tersebut memiliki ciri-ciri ${ciriBarang}` : ''}.`
              : `Dengan ini menerangkan bahwa nama yang di atas tersebut memang benar penduduk Desa Aikmual yang bertempat tinggal di ${permohonan.alamat}.`,
          kematian: isSuratKematian
            ? {
                namaAlmarhum: namaAlmarhum || permohonan.nama_pemohon,
                nikAlmarhum: nikAlmarhum || permohonan.nik,
                tempatLahirAlmarhum: tempatLahirAlmarhum || tempatLahir,
                tanggalLahirAlmarhum: tanggalLahirAlmarhum || tanggalLahir,
                jenisKelaminAlmarhum: jenisKelaminAlmarhum || jenisKelamin,
                agamaAlmarhum: agamaAlmarhum || agama,
                pekerjaanAlmarhum: pekerjaanAlmarhum || pekerjaan,
                alamatTerakhir: alamatTerakhir || permohonan.alamat,
                hubunganPelapor,
                tanggalMeninggal,
                waktuMeninggal,
                tempatMeninggal,
                sebabKematian,
                tanggalPemakaman,
                waktuPemakaman,
                tempatPemakaman,
              }
            : undefined,
          cerai: isSuratCerai
            ? {
                namaMantan,
                nikPasangan,
                tempatLahirPasangan,
                tanggalLahirPasangan,
                kewarganegaraanPasangan,
                agamaPasangan,
                pekerjaanPasangan,
                alamatPasangan,
                tanggalCerai,
                nomorAktaCerai,
                tempatCerai,
                teleponPemohon,
              }
            : undefined,
          janda: isSuratJanda
            ? {
                statusJanda,
                alasanStatus: alasanStatusJanda,
                namaPasangan: namaPasanganJanda,
                tanggalKejadian: tanggalKejadianJanda,
              }
            : undefined,
          kehilangan: isSuratKehilangan
            ? {
                statusPemohon: statusPemohonKehilangan,
                penyandangCacat,
                jenisBarang,
                barangHilang,
                asalBarang,
                labelNomorBarang,
                nomorBarang,
                ciriBarang,
                uraianKehilangan,
                lokasiKehilangan,
                tanggalKehilangan,
                keperluan: permohonan.keperluan,
              }
            : undefined,
          penghasilan: isSuratPenghasilan
            ? {
                pendidikan,
                namaWali,
                nikWali,
                tempatLahirWali,
                tanggalLahirWali,
                jenisKelaminWali,
                agamaWali,
                sumberPenghasilan,
                penghasilanPerBulan,
                dasarKeterangan,
              }
            : undefined,
          rumah: isSuratTidakPunyaRumah
            ? {
                penyandangCacat,
                statusTempatTinggal,
                namaPemilikRumah,
                hubunganDenganPemilik,
                alamatTinggalSekarang,
                lamaMenempati,
                jumlahTanggungan,
                alasanTidakMemiliki,
              }
            : undefined,
          usaha: isSuratUsaha
            ? {
                penyandangCacat,
                mulaiUsaha,
                jenisUsaha,
              }
            : undefined,
          kepalaDesa: {
            nama: signerInfo.nama,
            signatureImageUrl: shouldEmbedSignature ? signatureImageUrl : undefined,
            qrCodeDataUrl,
            verificationCode,
          },
        };

        const htmlContent = generateSuratTemplate(suratData);
        generatedFilePath = await saveGeneratedSuratHtml(htmlContent, nomorSurat, generatedJenisSuratKey);
      }
    }
    }

    await updatePermohonanStatusRow(connection, {
      status: normalizedStatus,
      catatan: effectiveCatatan,
      nomorSurat,
      filePath: generatedFilePath,
      processedBy,
      id: params.id,
    });

    const shouldSyncSuratKeluar = ['ditandatangani', 'selesai'].includes(normalizedStatus);
    if (shouldSyncSuratKeluar && nomorSurat) {
      const tanggalArsip = new Date().toISOString().split('T')[0];
      const tujuan = permohonan.nama_pemohon || 'Pemohon';
      const cleanKeperluan = normalizePerihalArchiveDetail(permohonan.keperluan);
      const perihal = `${permohonan.jenis_surat}${cleanKeperluan ? ` - ${cleanKeperluan}` : ''}`;

      try {
        await upsertSuratKeluarArchive(connection, {
          nomorSurat,
          perihal,
          tujuan,
          filePath: generatedFilePath,
          createdBy: processedBy,
          tanggal: tanggalArsip,
        });
      } catch (archiveError) {
        // Jangan gagalkan alur verifikasi/TTD ketika sinkronisasi arsip mengalami mismatch skema.
        console.warn('Sinkronisasi surat_keluar gagal (best-effort):', archiveError);
      }
    }

    await connection.commit();

    // Notifikasi email bersifat best-effort agar update status tidak gagal.
    if (typeof permohonan.email === 'string' && permohonan.email.trim()) {
      try {
        await sendNotificationEmail(
          permohonan.email,
          `Update Status Permohonan #${params.id}`,
          `Status permohonan Anda telah diupdate menjadi: ${statusLabel(normalizedStatus)}`
        );
      } catch (emailError) {
        console.error('Gagal kirim email notifikasi:', emailError);
      }
    }

    // Notifikasi WhatsApp bersifat best-effort agar alur update status tetap aman.
    if (shouldSendReadyNotification && isWhatsAppApiConfigured()) {
      try {
        const detailData = parseDetailData(permohonan.data_detail);
        const waNumber = await resolvePemohonWhatsAppNumber(detailData, permohonan);

        if (waNumber) {
          const nomorSuratLabel = nomorSurat || '-';
          const statusText = statusLabel(normalizedStatus);
          const jenisSuratLabel = permohonan.jenis_surat || 'Surat';
          const baseUrl = getAppBaseUrl();
          const trackingUrl = `${baseUrl}/tracking`;

          const finalFileUrl = generatedFilePath
            ? `${baseUrl}${generatedFilePath}${generatedFilePath.includes('?') ? '&print=1' : '?print=1'}`
            : trackingUrl;

          const messageLines = [
            `Halo ${permohonan.nama_pemohon},`,
            `Permohonan ${jenisSuratLabel} Anda sudah jadi (${statusText}).`,
            `Nomor Surat: ${nomorSuratLabel}`,
            `Lihat/unduh surat: ${finalFileUrl}`,
          ];

          await sendWhatsAppNotification({
            to: waNumber,
            message: messageLines.join('\n'),
            metadata: {
              permohonanId: Number(params.id),
              status: normalizedStatus,
              nomorSurat: nomorSurat || null,
            },
          });
          whatsappNotification = 'sent';
        } else {
          whatsappNotification = 'no_number';
        }
      } catch (waError) {
        console.error('Gagal kirim notifikasi WhatsApp:', waError);
        whatsappNotification = 'failed';
      }
    } else if (shouldSendReadyNotification) {
      whatsappNotification = 'not_configured';
    }

    return NextResponse.json({
      message: 'Status berhasil diupdate',
      data: {
        id: Number(params.id),
        status: normalizedStatus,
        nomor_surat: nomorSurat,
        file_path: generatedFilePath,
        whatsapp_notification: whatsappNotification,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    console.error('Gagal mengupdate status permohonan:', error);
    const detailMessage = error instanceof Error && error.message
      ? error.message
      : 'Gagal mengupdate status';
    return NextResponse.json(
      { error: detailMessage },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
