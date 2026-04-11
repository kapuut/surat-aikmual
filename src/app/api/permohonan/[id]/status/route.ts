import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';
import { mkdir, readdir, writeFile } from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { createHash, createHmac } from 'crypto';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateNomorSurat } from '@/lib/surat-generator/nomor-surat';
import { normalizeSuratSlug } from '@/lib/surat-data';
import { isWhatsAppApiConfigured, sendWhatsAppNotification } from '@/lib/whatsapp';
import type { UserRole } from '@/lib/types';
import { type JenisSurat, type SuratData } from '@/lib/surat-generator/types';

export const runtime = 'nodejs';

type PermohonanRow = {
  id: number;
  nama_pemohon: string;
  nik: string;
  alamat: string;
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
};

type DetailData = Record<string, unknown>;

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

function normalizeCurrentStatus(rawStatus: unknown, nomorSurat: unknown, note?: unknown): NormalizedStatus {
  const normalized = normalizeStatus(rawStatus);
  if (normalized) return normalized;

  const inferredFromNote = inferStatusFromNote(note);
  if (inferredFromNote) return inferredFromNote;

  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'selesai';
  }

  return 'pending';
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
  jenisSurat?: JenisSurat
): Promise<string> {
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const tahun = String(tanggal.getFullYear());
  const suffix = `/${bulan}.${tahun}`;
  const nomorScope = jenisSurat
    ? jenisSurat.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
    : 'global';
  const lockName = `permohonan_surat_nomor_${nomorScope}_${bulan}_${tahun}`;

  await connection.execute('SELECT GET_LOCK(?, 10)', [lockName]);
  try {
    const [rows]: any = await connection.execute(
      `SELECT nomor_surat, jenis_surat
       FROM permohonan_surat
       WHERE nomor_surat LIKE ?
       ORDER BY id DESC
       FOR UPDATE`,
      [`%${suffix}`]
    );

    const scopedRows = Array.isArray(rows)
      ? rows.filter((row: any) => {
          if (!jenisSurat) return true;
          return normalizeSuratSlug(String(row?.jenis_surat || '')) === jenisSurat;
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
  jenisSurat: JenisSurat
): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'generated-surat');
  await mkdir(outputDir, { recursive: true });

  const safeNomor = nomorSurat.replace(/[^a-zA-Z0-9.-]+/g, '-');
  const fileName = `${safeNomor}-${jenisSurat}.html`;
  const absolutePath = path.join(outputDir, fileName);

  await writeFile(absolutePath, htmlContent, 'utf-8');
  return `/generated-surat/${fileName}`;
}

async function resolveKepalaDesaSignatureUrl(userId: number | null): Promise<string> {
  const fallback = '/images/sample-ttd.png';
  if (!userId) return fallback;

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await db.getConnection();
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
    const noteByRole =
      authUser.role === 'admin'
        ? 'Admin'
        : 'Kepala Desa';
    const effectiveCatatan = catatan || `Status diperbarui oleh ${noteByRole}`;

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
      const jenisSurat = toJenisSurat(permohonan.jenis_surat);
      if (!jenisSurat) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Jenis surat pada permohonan tidak dikenali' },
          { status: 400 }
        );
      }

      const tanggalSurat = new Date();
      const detailData = parseDetailData(permohonan.data_detail);
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

      if (!nomorSurat) {
        nomorSurat = await getNextNomorSuratWithLock(connection, tanggalSurat, jenisSurat);
      }

      const shouldEmbedSignature = ['ditandatangani', 'selesai'].includes(normalizedStatus);
      const shouldRegenerateSurat = !generatedFilePath || shouldEmbedSignature;

      if (shouldRegenerateSurat) {
        let qrCodeDataUrl: string | undefined;
        let verificationCode: string | undefined;
        let signatureImageUrl: string | undefined;

        if (shouldEmbedSignature) {
          signatureImageUrl = await resolveKepalaDesaSignatureUrl(processedBy);
          const qr = await createPermohonanQrCode({
            id: Number(params.id),
            nomorSurat,
            nik: permohonan.nik,
            namaPemohon: permohonan.nama_pemohon,
            jenisSurat: permohonan.jenis_surat,
            keperluan: permohonan.keperluan,
            suratUntuk: `${permohonan.nama_pemohon} (${permohonan.nik})`,
            pembuatSurat: authUser.nama || noteByRole,
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
            signatureImageUrl: shouldEmbedSignature ? signatureImageUrl : undefined,
            qrCodeDataUrl,
            verificationCode,
          },
        };

        const htmlContent = generateSuratTemplate(suratData);
        generatedFilePath = await saveGeneratedSuratHtml(htmlContent, nomorSurat, jenisSurat);
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
      const perihal = `${permohonan.jenis_surat} - ${permohonan.keperluan}`;

      await upsertSuratKeluarArchive(connection, {
        nomorSurat,
        perihal,
        tujuan,
        filePath: generatedFilePath,
        createdBy: processedBy,
        tanggal: tanggalArsip,
      });
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
        const nikRaw = String(permohonan.nik || '').trim();
        const nikBase = normalizeNikValue(nikRaw);

        let waNumber = getTextWithDetail(undefined, detailData, [
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

        if (nikRaw || nikBase) {
          const [userRows]: any = await db.execute(
            `SELECT telepon
             FROM users
             WHERE telepon IS NOT NULL
               AND telepon <> ''
               AND (nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
             ORDER BY CASE WHEN SUBSTRING_INDEX(nik, '_', 1) = ? THEN 0 ELSE 1 END
             LIMIT 1`,
            [nikRaw || nikBase, nikBase || nikRaw, nikBase || nikRaw]
          );

          const teleponFromUser = asText(userRows?.[0]?.telepon);
          if (teleponFromUser) {
            waNumber = teleponFromUser;
          }
        }

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
            `Keperluan: ${permohonan.keperluan}`,
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
        }
      } catch (waError) {
        console.error('Gagal kirim notifikasi WhatsApp:', waError);
      }
    }

    return NextResponse.json({
      message: 'Status berhasil diupdate',
      data: {
        id: Number(params.id),
        status: normalizedStatus,
        nomor_surat: nomorSurat,
        file_path: generatedFilePath,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    console.error('Gagal mengupdate status permohonan:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate status' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
