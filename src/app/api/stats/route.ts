import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { normalizeSuratSlug } from '@/lib/surat-data';

type CountRow = { count?: number | string | null };

type MergedSuratKeluarItem = {
  id: number;
  nomor_surat: string;
  tanggal_surat: unknown;
  tujuan: string;
  perihal: string;
  file_path: string | null;
  status: 'Draft' | 'Menunggu' | 'Terkirim';
  created_by_name: string | null;
  source_type: 'manual' | 'permohonan';
  source_permohonan_id: number | null;
};

function isUnknownColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('unknown column');
}

function toCount(rows: unknown): number {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  const value = (rows[0] as CountRow)?.count;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function executeCountWithFallback(
  variants: Array<{ query: string; params?: unknown[] }>,
  fallbackValue = 0
): Promise<number> {
  for (const variant of variants) {
    try {
      const [rows] = await db.execute(variant.query, variant.params || []);
      return toCount(rows);
    } catch (error) {
      if (isUnknownColumnError(error)) {
        continue;
      }
      throw error;
    }
  }

  return fallbackValue;
}

function buildDateRangeCondition(column: string): string {
  if (column.endsWith('_at') || column === 'created_at' || column === 'updated_at') {
    return `DATE(${column}) >= ? AND DATE(${column}) <= ?`;
  }
  return `${column} >= ? AND ${column} <= ?`;
}

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function isGeneratedSuratFile(filePath: string | null): boolean {
  if (!filePath) return false;
  const normalized = filePath.toLowerCase();
  return normalized.includes('/generated-surat/') || normalized.endsWith('.html') || normalized.includes('.html?');
}

function normalizeStatus(value: unknown): 'Draft' | 'Menunggu' | 'Terkirim' {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return 'Terkirim';
  if (['draft', 'draf'].includes(text)) return 'Draft';
  if (['pending', 'menunggu', 'proses', 'diproses'].includes(text)) return 'Menunggu';
  return 'Terkirim';
}

function normalizeWorkflowStatusValue(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function isEligiblePermohonanForSuratKeluar(status: unknown): boolean {
  const normalizedStatus = normalizeWorkflowStatusValue(status);
  if (!normalizedStatus) return true;

  const excludedStatuses = new Set([
    'pending',
    'diproses',
    'dikirim_ke_kepala_desa',
    'perlu_revisi',
    'ditolak',
  ]);

  return !excludedStatuses.has(normalizedStatus);
}

function getJenisKeyFromPerihal(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text) return 'unknown';

  const head = text.split(' - ')[0]?.trim() || text;
  const normalized = normalizeSuratSlug(head) || normalizeSuratSlug(text);
  return normalized || head.toLowerCase();
}

function normalizeSyncSegment(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePerihalDetail(value: unknown): string {
  const normalized = normalizeSyncSegment(value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .trim();

  if (!normalized) return '';
  if (/^-+$/.test(normalized)) return '';
  if (['-', '--', 'null', 'undefined', 'n/a', 'na'].includes(normalized)) return '';

  return normalized;
}

function getDetailKeyFromPerihal(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const parts = text.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return '';

  return normalizePerihalDetail(parts.slice(1).join(' - '));
}

function createSyncKey(nomorSurat: unknown, jenisValue: unknown, detailValue: unknown = ''): string {
  const nomor = normalizeSyncSegment(nomorSurat);
  const jenis = normalizeSyncSegment(jenisValue);
  const detail = normalizePerihalDetail(detailValue);
  return `${nomor}||${jenis}||${detail}`;
}

function createSyncKeyPrefix(nomorSurat: unknown, jenisValue: unknown): string {
  const nomor = normalizeSyncSegment(nomorSurat);
  const jenis = normalizeSyncSegment(jenisValue);
  return `${nomor}||${jenis}||`;
}

function toDateOnly(value: unknown): string {
  const parsed = new Date(String(value ?? ''));
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function isWithinDateRange(value: unknown, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;

  const dateValue = toDateOnly(value);
  if (!dateValue) return false;

  if (startDate && dateValue < startDate) return false;
  if (endDate && dateValue > endDate) return false;
  return true;
}

async function getMergedSuratKeluarCount(startDate?: string, endDate?: string): Promise<number> {
  const manualQueryVariants = [
    `SELECT
      sk.id,
      sk.nomor_surat,
      sk.tanggal,
      sk.tanggal_surat,
      sk.tujuan,
      sk.perihal,
      sk.file_path,
      sk.status,
      sk.created_at,
      u.nama AS created_by_name
    FROM surat_keluar sk
    LEFT JOIN users u ON sk.created_by = u.id
    ORDER BY sk.created_at DESC`,
    `SELECT
      sk.id,
      sk.nomor_surat,
      sk.tanggal_surat,
      sk.tujuan,
      sk.perihal,
      sk.file_path,
      sk.status,
      sk.created_at,
      u.nama AS created_by_name
    FROM surat_keluar sk
    LEFT JOIN users u ON sk.created_by = u.id
    ORDER BY sk.created_at DESC`,
    `SELECT
      sk.id,
      sk.nomor_surat,
      sk.tanggal_surat,
      sk.tujuan,
      sk.perihal,
      sk.file_path,
      sk.created_at,
      u.nama AS created_by_name
    FROM surat_keluar sk
    LEFT JOIN users u ON sk.created_by = u.id
    ORDER BY sk.created_at DESC`,
  ];

  let manualRows: any[] = [];
  let manualError: unknown = null;

  for (const query of manualQueryVariants) {
    try {
      const [result] = await db.query<any[]>(query);
      manualRows = result;
      manualError = null;
      break;
    } catch (error) {
      manualError = error;
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }

  if (manualError) {
    throw manualError;
  }

  const permohonanQueryVariants = [
    `SELECT
      p.id,
      p.nomor_surat,
      p.jenis_surat,
      p.keperluan,
      p.nama_pemohon,
      p.file_path,
      p.status,
      p.updated_at,
      p.created_at
    FROM permohonan_surat p
    WHERE p.nomor_surat IS NOT NULL
      AND p.nomor_surat <> ''`,
    `SELECT
      p.id,
      p.nomor_surat,
      p.jenis_surat,
      p.keperluan,
      p.nama_pemohon,
      p.dokumen_path AS file_path,
      p.status,
      p.updated_at,
      p.created_at
    FROM permohonan_surat p
    WHERE p.nomor_surat IS NOT NULL
      AND p.nomor_surat <> ''`,
  ];

  let permohonanRows: any[] = [];
  let permohonanError: unknown = null;

  for (const query of permohonanQueryVariants) {
    try {
      const [result] = await db.query<any[]>(query);
      permohonanRows = result;
      permohonanError = null;
      break;
    } catch (error) {
      permohonanError = error;
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }

  if (permohonanError && !permohonanRows.length) {
    throw permohonanError;
  }

  const merged = new Map<string, MergedSuratKeluarItem>();

  manualRows.forEach((row) => {
    const tanggal = row?.tanggal ?? row?.tanggal_surat ?? row?.created_at;
    const normalizedFilePath = normalizeFilePath(row?.file_path);
    const item: MergedSuratKeluarItem = {
      id: Number(row?.id),
      nomor_surat: row?.nomor_surat || '-',
      tanggal_surat: tanggal,
      tujuan: row?.tujuan || 'Pemohon',
      perihal: row?.perihal || '-',
      file_path: normalizedFilePath,
      status: normalizeStatus(row?.status),
      created_by_name: row?.created_by_name || null,
      source_type: isGeneratedSuratFile(normalizedFilePath) ? 'permohonan' : 'manual',
      source_permohonan_id: null,
    };

    const jenisKey = getJenisKeyFromPerihal(item.perihal);
    const detailKey = getDetailKeyFromPerihal(item.perihal);
    const key = createSyncKey(item.nomor_surat, jenisKey, detailKey);
    merged.set(key, item);
  });

  permohonanRows.forEach((row) => {
    const nomorSurat = String(row?.nomor_surat || '').trim();
    if (!nomorSurat) return;
    if (!isEligiblePermohonanForSuratKeluar(row?.status)) return;

    const permohonanId = Number(row?.id) || null;
    const jenisSurat = String(row?.jenis_surat || '').trim();
    const keperluan = String(row?.keperluan || '').trim();
    const normalizedKeperluan = normalizePerihalDetail(keperluan);
    const perihal = `${jenisSurat || 'surat'}${normalizedKeperluan ? ` - ${normalizedKeperluan}` : ''}`;
    const filePath = normalizeFilePath(row?.file_path);
    const tujuan = String(row?.nama_pemohon || 'Pemohon').trim() || 'Pemohon';
    const previewFallbackPath = permohonanId ? `/api/admin/permohonan/${permohonanId}/preview` : null;
    const permohonanDocumentPath = isGeneratedSuratFile(filePath) ? filePath : (filePath || previewFallbackPath);
    const tanggal = row?.updated_at ?? row?.created_at ?? null;
    const key = createSyncKey(
      nomorSurat,
      normalizeSuratSlug(jenisSurat) || jenisSurat.toLowerCase(),
      normalizedKeperluan
    );

    const fallbackItem: MergedSuratKeluarItem = {
      id: Number(row?.id) * -1,
      nomor_surat: nomorSurat,
      tanggal_surat: tanggal,
      tujuan,
      perihal,
      file_path: permohonanDocumentPath,
      status: normalizeStatus(row?.status),
      created_by_name: null,
      source_type: 'permohonan',
      source_permohonan_id: permohonanId,
    };

    let existingKey: string | null = null;
    let existing = merged.get(key);
    if (existing) {
      existingKey = key;
    }

    if (!existing) {
      const fallbackPrefix = createSyncKeyPrefix(
        nomorSurat,
        normalizeSuratSlug(jenisSurat) || jenisSurat.toLowerCase()
      );
      const matchedEntry = Array.from(merged.entries()).find(([candidateKey]) => candidateKey.startsWith(fallbackPrefix));
      if (matchedEntry) {
        existingKey = matchedEntry[0];
        existing = matchedEntry[1];
      }
    }

    if (!existing) {
      const matchedByNomorTujuan = Array.from(merged.entries()).find(([, candidate]) => {
        if (candidate.source_permohonan_id) return false;
        return (
          normalizeSyncSegment(candidate.nomor_surat) === normalizeSyncSegment(nomorSurat)
          && normalizeSyncSegment(candidate.tujuan) === normalizeSyncSegment(tujuan)
        );
      });

      if (matchedByNomorTujuan) {
        existingKey = matchedByNomorTujuan[0];
        existing = matchedByNomorTujuan[1];
      }
    }

    if (!existing) {
      merged.set(key, fallbackItem);
      return;
    }

    existing.source_type = 'permohonan';
    existing.source_permohonan_id = permohonanId || existing.source_permohonan_id;

    if (fallbackItem.file_path) {
      const existingPath = normalizeFilePath(existing.file_path);
      const existingIsGenerated = isGeneratedSuratFile(existingPath);
      const nextIsGenerated = isGeneratedSuratFile(fallbackItem.file_path);
      const existingIsPreview = Boolean(existingPath && existingPath.includes('/api/admin/permohonan/'));
      const nextIsPreview = fallbackItem.file_path.includes('/api/admin/permohonan/');

      if (
        !existingPath
        || (nextIsGenerated && !existingIsGenerated)
        || (existingIsPreview && !nextIsPreview)
      ) {
        existing.file_path = fallbackItem.file_path;
      }
    }

    if (existing.status !== 'Terkirim' && fallbackItem.status === 'Terkirim') {
      existing.status = 'Terkirim';
    }

    if (!existing.tanggal_surat && fallbackItem.tanggal_surat) {
      existing.tanggal_surat = fallbackItem.tanggal_surat;
    }

    merged.set(existingKey || key, existing);
  });

  return Array.from(merged.values()).filter((item) => isWithinDateRange(item.tanggal_surat, startDate, endDate)).length;
}

async function getSuratMasukTotal(): Promise<number> {
  return executeCountWithFallback([
    { query: 'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif"' },
    { query: 'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "active"' },
    { query: 'SELECT COUNT(*) as count FROM surat_masuk' },
  ]);
}

async function getSuratMasukBulanIni(startDate: string, endDate: string): Promise<number> {
  const dateColumns = ['tanggal_terima', 'tanggal_surat', 'tanggal', 'created_at'];
  const variants: Array<{ query: string; params?: unknown[] }> = [];

  for (const col of dateColumns) {
    const rangeCondition = buildDateRangeCondition(col);
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif" AND ${rangeCondition}`,
      params: [startDate, endDate],
    });
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_masuk WHERE status = "active" AND ${rangeCondition}`,
      params: [startDate, endDate],
    });
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_masuk WHERE ${rangeCondition}`,
      params: [startDate, endDate],
    });
  }

  return executeCountWithFallback(variants);
}

async function getSuratMasukBelumDibaca(): Promise<number> {
  return executeCountWithFallback([
    { query: 'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif" AND is_read = 0' },
    { query: 'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "active" AND is_read = 0' },
    { query: 'SELECT COUNT(*) as count FROM surat_masuk WHERE is_read = 0' },
  ]);
}

async function getSuratKeluarTotal(): Promise<number> {
  return getMergedSuratKeluarCount();
}

async function getSuratKeluarBulanIni(startDate: string, endDate: string): Promise<number> {
  return getMergedSuratKeluarCount(startDate, endDate);
}

async function getSuratKeluarDraft(): Promise<number> {
  return executeCountWithFallback([
    { query: 'SELECT COUNT(*) as count FROM surat_keluar WHERE LOWER(TRIM(status)) = "draft"' },
  ]);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [
      suratMasukTotal,
      suratMasukBulanIni,
      suratMasukBelumDibaca,
      suratKeluarTotal,
      suratKeluarBulanIni,
      suratKeluarDraft,
    ] = await Promise.all([
      getSuratMasukTotal(),
      getSuratMasukBulanIni(monthStart, monthEnd),
      getSuratMasukBelumDibaca(),
      getSuratKeluarTotal(),
      getSuratKeluarBulanIni(monthStart, monthEnd),
      getSuratKeluarDraft(),
    ]);

    const [permohonanPendingRows]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE LOWER(TRIM(status)) IN ("pending", "perlu_revisi")'
    );
    const [permohonanDisetujuiRows]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE LOWER(TRIM(status)) IN ("dikirim_ke_kepala_desa", "ditandatangani", "selesai")'
    );
    const [permohonanDitolakRows]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE LOWER(TRIM(status)) = "ditolak"'
    );
    const [permohonanMenungguRows]: any = await db.execute(
      `SELECT COUNT(*) as count FROM permohonan_surat
       WHERE LOWER(TRIM(status)) = 'dikirim_ke_kepala_desa'
          OR (
            LOWER(TRIM(status)) NOT IN ('pending','diproses','perlu_revisi','ditandatangani','selesai','ditolak')
            AND (nomor_surat IS NOT NULL AND TRIM(nomor_surat) != '')
          )`
    );
    const [permohonanSelesaiRows]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE LOWER(TRIM(status)) IN ("ditandatangani", "selesai")'
    );

    let usersStats = {
      total: 0,
      aktif: 0,
      admin: 0,
      sekretaris: 0,
      kepala_desa: 0,
    };

    if (user.role === 'admin') {
      const [usersTotalRows]: any = await db.execute('SELECT COUNT(*) as count FROM users');
      const [usersAktifRows]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE status IN ("aktif", "active")'
      );
      const [usersAdminRows]: any = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      const [usersSekretarisRows]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "sekretaris"'
      );
      const [usersKepalaDesaRows]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "kepala_desa"'
      );

      usersStats = {
        total: toCount(usersTotalRows),
        aktif: toCount(usersAktifRows),
        admin: toCount(usersAdminRows),
        sekretaris: toCount(usersSekretarisRows),
        kepala_desa: toCount(usersKepalaDesaRows),
      };
    }

    const stats = {
      suratMasuk: {
        total: suratMasukTotal,
        bulanIni: suratMasukBulanIni,
        belumDibaca: suratMasukBelumDibaca,
      },
      suratKeluar: {
        total: suratKeluarTotal,
        bulanIni: suratKeluarBulanIni,
        draft: suratKeluarDraft,
      },
      permohonan: {
        total: toCount(permohonanSelesaiRows),
        pending: toCount(permohonanPendingRows),
        disetujui: toCount(permohonanDisetujuiRows),
        ditolak: toCount(permohonanDitolakRows),
        menunggu_tanda_tangan: toCount(permohonanMenungguRows),
        selesai_ditandatangani: toCount(permohonanSelesaiRows),
      },
      users: usersStats,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}
