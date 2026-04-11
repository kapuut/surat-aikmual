import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { readdir } from 'fs/promises';
import path from 'path';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { normalizeSuratSlug } from '@/lib/surat-data';
import type { JenisSurat, SuratData } from '@/lib/surat-generator/types';

type WorkflowStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

type PermohonanRow = RowDataPacket & {
  id: number;
  nama_pemohon: string;
  nik: string;
  alamat: string;
  jenis_surat: string;
  keperluan: string;
  status?: string | null;
  file_path?: string | null;
  nomor_surat: string | null;
  data_detail?: string | null;
  created_at: string;
  updated_at: string;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | Date | null;
  jenis_kelamin?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  status_perkawinan?: string | null;
  kewarganegaraan?: string | null;
  masa_berlaku_dari?: string | Date | null;
  masa_berlaku_sampai?: string | Date | null;
  catatan?: string | null;
  processed_by?: number | null;
};

type DetailData = Record<string, unknown>;

function normalizeStatus(value: unknown): WorkflowStatus | null {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const known: WorkflowStatus[] = [
    'pending',
    'diproses',
    'dikirim_ke_kepala_desa',
    'perlu_revisi',
    'ditandatangani',
    'selesai',
    'ditolak',
  ];

  if ((known as string[]).includes(normalized)) {
    return normalized as WorkflowStatus;
  }

  return null;
}

function inferStatusFromNote(note: unknown): WorkflowStatus | null {
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

function normalizeWorkflowStatus(rawStatus: unknown, nomorSurat: unknown, note?: unknown): WorkflowStatus {
  const normalized = normalizeStatus(rawStatus);
  if (normalized) return normalized;

  const inferred = inferStatusFromNote(note);
  if (inferred) return inferred;

  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'selesai';
  }

  return 'pending';
}

async function resolveKepalaDesaSignatureUrl(processedBy: unknown): Promise<string> {
  const fallback = '/images/sample-ttd.png';
  const userId = Number(processedBy);
  if (!Number.isFinite(userId) || userId <= 0) return fallback;

  const signaturesDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
  const prefix = `kepala-desa-${userId}.`;

  try {
    const entries = await readdir(signaturesDir, { withFileTypes: true });
    const matched = entries.find((entry) => entry.isFile() && entry.name.startsWith(prefix));
    if (!matched) return fallback;
    return `/uploads/signatures/${matched.name}`;
  } catch {
    return fallback;
  }
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned || undefined;
}

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const dateValue = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((item) => typeof item === 'string' && item.trim());
        candidate = typeof first === 'string' ? first.trim() : null;
      } else if (typeof parsed === 'string' && parsed.trim()) {
        candidate = parsed.trim();
      }
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  if (!candidate || candidate === '[]') return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith('/') ? candidate : `/${candidate}`;
}

function normalizeFilePaths(rawValue: unknown): string[] {
  if (typeof rawValue !== 'string') return [];
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === '[]') return [];

  let candidates: unknown[] = [trimmed];
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      candidates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  const normalized = candidates
    .map((item) => normalizeFilePath(item))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/generated-surat/') || pathValue.toLowerCase().endsWith('.html');
}

async function resolveFinalSuratKeluarPath(nomorSurat: string | null, jenisSurat: string): Promise<string | null> {
  if (!nomorSurat || !nomorSurat.trim()) return null;

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT file_path
       FROM surat_keluar
       WHERE nomor_surat = ?
         AND LOWER(TRIM(perihal)) LIKE CONCAT(LOWER(TRIM(?)), '%')
       ORDER BY id DESC
       LIMIT 1`,
      [nomorSurat, jenisSurat]
    );

    const strictPath = rows && rows.length > 0 ? normalizeFilePath((rows[0] as any).file_path) : null;
    if (strictPath) return strictPath;

    const [fallbackRows] = await db.query<RowDataPacket[]>(
      `SELECT file_path
       FROM surat_keluar
       WHERE nomor_surat = ?
         AND file_path IS NOT NULL
         AND TRIM(file_path) <> ''
       ORDER BY id DESC
       LIMIT 1`,
      [nomorSurat]
    );

    if (!fallbackRows || fallbackRows.length === 0) return null;
    return normalizeFilePath((fallbackRows[0] as any).file_path);
  } catch {
    return null;
  }
}

function isAttachmentFile(pathValue: string): boolean {
  return pathValue.includes('/uploads/');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAttachmentsPage(attachmentPaths: string[]): string {
  const attachmentCards = attachmentPaths
    .map((pathValue, index) => {
      const lowerPath = pathValue.toLowerCase();
      const fileName = pathValue.split('/').pop() || `Lampiran ${index + 1}`;
      const title = `Lampiran ${index + 1}`;
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(lowerPath);
      const isPdf = /\.pdf$/i.test(lowerPath);

      let previewHtml = `<a class="open-link" href="${escapeHtml(pathValue)}" target="_blank" rel="noreferrer">Buka File</a>`;

      if (isImage) {
        previewHtml = `
          <a href="${escapeHtml(pathValue)}" target="_blank" rel="noreferrer">
            <img src="${escapeHtml(pathValue)}" alt="${escapeHtml(title)}" />
          </a>
          <a class="open-link" href="${escapeHtml(pathValue)}" target="_blank" rel="noreferrer">Buka Gambar</a>
        `;
      } else if (isPdf) {
        previewHtml = `
          <iframe src="${escapeHtml(pathValue)}" title="${escapeHtml(title)}"></iframe>
          <a class="open-link" href="${escapeHtml(pathValue)}" target="_blank" rel="noreferrer">Buka PDF</a>
        `;
      }

      return `
        <article class="card">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(fileName)}</p>
          ${previewHtml}
        </article>
      `;
    })
    .join('');

  const emptyState = `
    <article class="card">
      <h2>Lampiran Tidak Ditemukan</h2>
      <p>Data ini belum memiliki lampiran yang dapat ditampilkan.</p>
    </article>
  `;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daftar Lampiran</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 20px; }
    h1 { margin: 0 0 12px; font-size: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .card h2 { margin: 0 0 6px; font-size: 16px; }
    .card p { margin: 0 0 10px; color: #475569; font-size: 13px; word-break: break-all; }
    .card img { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
    .card iframe { width: 100%; height: 320px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
    .open-link { display: inline-block; margin-top: 10px; color: #1d4ed8; text-decoration: none; font-weight: 600; }
    .open-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Lampiran Permohonan</h1>
    <div class="grid">
      ${attachmentCards || emptyState}
    </div>
  </div>
</body>
</html>`;
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestUrl = new URL(request.url);
    const mode = String(requestUrl.searchParams.get('mode') || '').toLowerCase();
    const download = String(requestUrl.searchParams.get('download') || '').toLowerCase();
    const wantsAttachments = requestUrl.searchParams.get('attachments') === '1';
    const wantsDoc = download === 'doc';
    const printFlag = requestUrl.searchParams.get('print') === '1';

    const [rows] = await db.query<PermohonanRow[]>(
      `SELECT *
       FROM permohonan_surat
       WHERE id = ?
       LIMIT 1`,
      [params.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Permohonan tidak ditemukan' }, { status: 404 });
    }

    const permohonan = rows[0];
    const normalizedStatus = normalizeWorkflowStatus(permohonan.status, permohonan.nomor_surat, permohonan.catatan);
    const isFinalized = ['ditandatangani', 'selesai'].includes(normalizedStatus);
    const shouldEmbedSignature = isFinalized && mode !== 'admin';
    const attachmentPaths = normalizeFilePaths(permohonan.file_path).filter((pathValue) => isAttachmentFile(pathValue));

    const suratKeluarFinalPath = isFinalized
      ? await resolveFinalSuratKeluarPath(permohonan.nomor_surat, permohonan.jenis_surat)
      : null;
    const permohonanFinalPath = normalizeFilePath(permohonan.file_path);
    const preferredFinalPath = suratKeluarFinalPath || permohonanFinalPath;

    if (isFinalized && mode !== 'admin' && isGeneratedSuratFile(preferredFinalPath)) {
      const targetUrl = new URL(preferredFinalPath as string, request.url);
      if (printFlag) {
        targetUrl.searchParams.set('print', '1');
      }
      return NextResponse.redirect(targetUrl);
    }

    if (wantsAttachments) {
      return new NextResponse(renderAttachmentsPage(attachmentPaths), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    const detailData = parseDetailData(permohonan.data_detail);
    const suratSlug = normalizeSuratSlug(permohonan.jenis_surat);

    if (!suratSlug) {
      return NextResponse.json({ error: 'Jenis surat tidak valid untuk preview' }, { status: 400 });
    }

    const tanggalSurat = new Date(permohonan.updated_at || permohonan.created_at || Date.now());
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

    const isSuratKematian = suratSlug === 'surat-kematian';
    const isSuratCerai = suratSlug === 'surat-cerai';
    const isSuratJanda = suratSlug === 'surat-janda';
    const isSuratKehilangan = suratSlug === 'surat-kehilangan';
    const isSuratPenghasilan = suratSlug === 'surat-penghasilan';
    const isSuratTidakPunyaRumah = suratSlug === 'surat-tidak-punya-rumah';
    const isSuratUsaha = suratSlug === 'surat-usaha';
    const kewarganegaraan =
      getTextWithDetail(permohonan.kewarganegaraan, detailData, ['kewarganegaraan']) || 'Indonesia';

    const masaBerlakuDari =
      getDateWithDetail(permohonan.masa_berlaku_dari, detailData, ['masa_berlaku_dari', 'masaBerlakuDari']) ||
      tanggalSurat;
    const masaBerlakuSampai =
      getDateWithDetail(permohonan.masa_berlaku_sampai, detailData, ['masa_berlaku_sampai', 'masaBerlakuSampai']) ||
      new Date(masaBerlakuDari.getFullYear(), masaBerlakuDari.getMonth() + 6, masaBerlakuDari.getDate());

    const suratData: SuratData = {
      jenisSurat: suratSlug as JenisSurat,
      nomorSurat: permohonan.nomor_surat || undefined,
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
        ? `Bahwa berdasarkan data administrasi kependudukan yang ada, benar ${permohonan.nama_pemohon} telah bercerai secara sah dengan ${namaMantan || 'pasangannya'}. Surat keterangan ini dipergunakan untuk keperluan ${permohonan.keperluan}.`
        : isSuratJanda
          ? `Bahwa yang namanya tersebut diatas memang benar berstatus ${statusJanda || 'Janda/Duda'}${alasanStatusJanda ? ` (${alasanStatusJanda})` : ''}.`
          : isSuratPenghasilan
            ? `Bahwa yang namanya tersebut di atas merupakan penduduk Desa Aikmual dan merupakan anak/tanggungan dari ${namaWali || 'wali yang bersangkutan'}. Berdasarkan keterangan ${dasarKeterangan || 'Kepala Dusun setempat'}, penghasilan wali/orang tua yang bersangkutan sebesar ${penghasilanPerBulan || 'sesuai keterangan'} per bulan${sumberPenghasilan ? ` dari ${sumberPenghasilan}` : ''}. Surat ini dipergunakan untuk keperluan ${permohonan.keperluan}.`
          : isSuratTidakPunyaRumah
            ? `Orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, dan memang yang bersangkutan Belum Memiliki Rumah.`
          : isSuratUsaha
            ? `Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, yang memiliki usaha ${jenisUsaha || '-'}.`
          : isSuratKehilangan
            ? `Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dan telah kehilangan ${barangHilang || 'barang penting'}${jenisBarang ? ` yang tergolong ${jenisBarang}` : ''}${asalBarang ? ` milik/berasal dari ${asalBarang}` : ''}${nomorBarang ? ` dengan ${labelNomorBarang || 'Nomor'}: ${nomorBarang}` : ''}${lokasiKehilangan ? ` di ${lokasiKehilangan}` : ''}${uraianKehilangan ? `. Menurut keterangan pemohon ${uraianKehilangan}` : ''}${ciriBarang ? `. Barang tersebut memiliki ciri-ciri ${ciriBarang}` : ''}.`
          : `Dengan ini menerangkan bahwa nama yang di atas tersebut memang benar penduduk Desa Aikmual yang bertempat tinggal di ${permohonan.alamat}. Surat keterangan ini dipergunakan untuk keperluan ${permohonan.keperluan}.`,
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
            keperluan: permohonan.keperluan,
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
            keperluan: permohonan.keperluan,
            penyandangCacat,
            mulaiUsaha,
            jenisUsaha,
          }
        : undefined,
      kepalaDesa: {
        nama: 'KEPALA DESA AIKMUAL',
        signatureImageUrl: shouldEmbedSignature
          ? await resolveKepalaDesaSignatureUrl(permohonan.processed_by)
          : undefined,
      },
    };

    const html = generateSuratTemplate(
      suratData,
      mode === 'admin'
        ? {
            editable: true,
            showToolbar: true,
            logoUrl: '/images/logo-loteng.png',
          }
        : undefined
    );

    if (wantsDoc) {
      const fileBaseName = (permohonan.nomor_surat || `surat-${params.id}`).replace(/[^a-zA-Z0-9.-]+/g, '-');
      return new NextResponse(`\ufeff${html}`, {
        headers: {
          'Content-Type': 'application/msword; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileBaseName}.doc"`,
        },
      });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ error: 'Gagal membuat preview surat' }, { status: 500 });
  }
}
