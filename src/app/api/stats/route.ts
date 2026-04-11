import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { cookies } from 'next/headers';

type CountRow = { count?: number | string | null };

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
  return executeCountWithFallback([
    { query: 'SELECT COUNT(*) as count FROM surat_keluar WHERE status = "aktif"' },
    { query: 'SELECT COUNT(*) as count FROM surat_keluar WHERE status = "active"' },
    { query: 'SELECT COUNT(*) as count FROM surat_keluar WHERE LOWER(TRIM(status)) <> "draft"' },
    { query: 'SELECT COUNT(*) as count FROM surat_keluar' },
  ]);
}

async function getSuratKeluarBulanIni(startDate: string, endDate: string): Promise<number> {
  const dateColumns = ['tanggal', 'tanggal_surat', 'created_at'];
  const variants: Array<{ query: string; params?: unknown[] }> = [];

  for (const col of dateColumns) {
    const rangeCondition = buildDateRangeCondition(col);
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_keluar WHERE status = "aktif" AND ${rangeCondition}`,
      params: [startDate, endDate],
    });
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_keluar WHERE status = "active" AND ${rangeCondition}`,
      params: [startDate, endDate],
    });
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_keluar WHERE LOWER(TRIM(status)) <> "draft" AND ${rangeCondition}`,
      params: [startDate, endDate],
    });
    variants.push({
      query: `SELECT COUNT(*) as count FROM surat_keluar WHERE ${rangeCondition}`,
      params: [startDate, endDate],
    });
  }

  return executeCountWithFallback(variants);
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

    const [permohonanTotalRows]: any = await db.execute('SELECT COUNT(*) as count FROM permohonan_surat');
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
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE LOWER(TRIM(status)) = "dikirim_ke_kepala_desa"'
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
        total: toCount(permohonanTotalRows),
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
