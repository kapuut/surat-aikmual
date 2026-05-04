import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';

type YearRow = { tahun?: number | string | null };

type JenisRow = {
  jenis_surat?: string | null;
  jumlah?: number | string | null;
  tanggal_terbaru?: string | Date | null;
};

const DATE_COLUMN_CANDIDATES = ['created_at', 'tanggal_permohonan', 'tanggal_dibuat', 'tanggal'];

function isUnknownColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return message.includes('unknown column');
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDayValue(value: string | null): number | null {
  if (!value) return null;
  if (!/^\d{1,2}$/.test(value)) return null;
  const n = parseInt(value, 10);
  return !isNaN(n) && n >= 1 && n <= 31 ? n : null;
}

function normalizeIsoDate(value: string | null): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function buildDateFilter(
  dateColumn: string,
  year: number | null,
  month: number,
  dayFrom: number | null,
  dayTo: number | null,
  isoDateFrom: string | null,
  isoDateTo: string | null
): { whereClause: string; params: unknown[] } {
  const whereParts: string[] = [];
  const params: unknown[] = [];

  if (isoDateFrom || isoDateTo) {
    if (isoDateFrom) {
      whereParts.push(`DATE(${dateColumn}) >= ?`);
      params.push(isoDateFrom);
    }
    if (isoDateTo) {
      whereParts.push(`DATE(${dateColumn}) <= ?`);
      params.push(isoDateTo);
    }
  } else {
    if (year !== null) {
      whereParts.push(`YEAR(${dateColumn}) = ?`);
      params.push(year);
    }

    if (month > 0) {
      whereParts.push(`MONTH(${dateColumn}) = ?`);
      params.push(month);
    }

    if (dayFrom !== null) {
      whereParts.push(`DAY(${dateColumn}) >= ?`);
      params.push(dayFrom);
    }

    if (dayTo !== null) {
      whereParts.push(`DAY(${dateColumn}) <= ?`);
      params.push(dayTo);
    }
  }

  return {
    whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
    params,
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const now = new Date();
    const { nextUrl } = request;
    const { searchParams } = nextUrl;
    const rawYear = searchParams.get('year');
    const parsedYear = normalizeNumber(rawYear, 0);
    const parsedMonth = normalizeNumber(searchParams.get('month'), 0);
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');
    const dateFrom = normalizeDayValue(dateFromParam);
    const dateTo = normalizeDayValue(dateToParam);
    const isoDateFrom = normalizeIsoDate(dateFromParam);
    const isoDateTo = normalizeIsoDate(dateToParam);
    const sortRaw = String(searchParams.get('sort') || 'desc').toLowerCase();

    const selectedYear = rawYear ? (parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : null) : null;
    const selectedMonth = parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : 0;
    const selectedSort = ['asc', 'desc', 'date_desc', 'date_asc'].includes(sortRaw) ? sortRaw : 'desc';
    const isDateSort = selectedSort === 'date_desc' || selectedSort === 'date_asc';
    const sortDirection = selectedSort === 'asc' ? 'ASC' : 'DESC';
    const dateSortDirection = selectedSort === 'date_asc' ? 'ASC' : 'DESC';

    let rows: any[] = [];
    let resolvedDateColumn: string | null = null;

    for (const candidate of DATE_COLUMN_CANDIDATES) {
      const { whereClause, params } = buildDateFilter(
        candidate,
        selectedYear,
        selectedMonth,
        dateFrom,
        dateTo,
        isoDateFrom,
        isoDateTo
      );

      try {
        const [result]: any = await db.execute(
          `SELECT
             COALESCE(NULLIF(TRIM(jenis_surat), ''), 'Lainnya') AS jenis_surat,
             COUNT(*) AS jumlah,
             MAX(${candidate}) AS tanggal_terbaru
           FROM permohonan_surat
           ${whereClause}
           GROUP BY COALESCE(NULLIF(TRIM(jenis_surat), ''), 'Lainnya')
           ORDER BY ${isDateSort ? `tanggal_terbaru ${dateSortDirection}, jumlah DESC` : `jumlah ${sortDirection}`}, jenis_surat ASC`,
          params
        );

        rows = Array.isArray(result) ? result : [];
        resolvedDateColumn = candidate;
        break;
      } catch (error) {
        if (isUnknownColumnError(error)) {
          continue;
        }
        throw error;
      }
    }

    if (!resolvedDateColumn) {
      const [result]: any = await db.execute(
        `SELECT
           COALESCE(NULLIF(TRIM(jenis_surat), ''), 'Lainnya') AS jenis_surat,
           COUNT(*) AS jumlah
         FROM permohonan_surat
         GROUP BY COALESCE(NULLIF(TRIM(jenis_surat), ''), 'Lainnya')
        ORDER BY jumlah ${sortDirection}, jenis_surat ASC`
      );
      rows = Array.isArray(result) ? result : [];
    }

    let availableYears: number[] = [now.getFullYear()];
    if (resolvedDateColumn) {
      try {
        const [yearRows]: any = await db.execute(
          `SELECT DISTINCT YEAR(${resolvedDateColumn}) AS tahun
           FROM permohonan_surat
           WHERE ${resolvedDateColumn} IS NOT NULL
           ORDER BY tahun DESC`
        );

        availableYears = (Array.isArray(yearRows) ? yearRows : [])
          .map((row: YearRow) => normalizeNumber(row.tahun, 0))
          .filter((year: number) => year > 0);

        if (availableYears.length === 0) {
          availableYears = [now.getFullYear()];
        }
      } catch (error) {
        availableYears = [now.getFullYear()];
      }
    }

    const data = (Array.isArray(rows) ? rows : []).map((row: JenisRow) => ({
      jenis_surat: String(row.jenis_surat || 'Lainnya'),
      jumlah: normalizeNumber(row.jumlah, 0),
    }));

    const totalSurat = data.reduce((sum, item) => sum + item.jumlah, 0);

    return NextResponse.json({
      success: true,
      filters: {
        year: selectedYear,
        month: selectedMonth,
        dateFrom: isoDateFrom ?? dateFrom,
        dateTo: isoDateTo ?? dateTo,
        sort: selectedSort,
      },
      availableYears,
      summary: {
        totalJenis: data.length,
        totalSurat,
      },
      data,
    });
  } catch (error) {
    console.error('Error fetching surat jenis chart:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data diagram surat' },
      { status: 500 }
    );
  }
}
