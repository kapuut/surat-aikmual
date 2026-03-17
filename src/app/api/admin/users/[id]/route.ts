import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

type ColumnMeta = {
  Field: string;
  Type: string;
  Null: 'YES' | 'NO';
  Key: string;
  Default: string | null;
  Extra: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

async function ensureAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  try {
    const decoded = verify(token.value, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      return { ok: false as const, status: 403, error: 'Forbidden - Admin only' };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
  }
}

async function getUsersColumnMap() {
  const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
  const columns = (columnsRaw as ColumnMeta[]) || [];
  return new Map(columns.map((column) => [column.Field, column]));
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const nik = String(body?.nik || '').trim();
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();
    const status = body?.status === 'nonaktif' ? 'nonaktif' : 'aktif';

    if (!nama || !email || !nik || !alamat) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (!isValidNik(nik)) {
      return NextResponse.json({ error: 'NIK wajib 16 digit angka' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    const columnMap = await getUsersColumnMap();
    const idField = columnMap.has('id') ? 'id' : 'id_user';

    const [existingRows] = await db.execute(
      `SELECT ${idField} FROM users WHERE (SUBSTRING_INDEX(nik, "_", 1) = ? OR email = ?) AND ${idField} <> ? LIMIT 1`,
      [nik, email, params.id]
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    await db.execute(
      `
      UPDATE users
      SET nama = ?, email = ?, nik = ?, alamat = ?, telepon = ?, status = ?
      WHERE ${idField} = ? AND role = 'masyarakat'
      `,
      [nama, email, nik, alamat, telepon || null, status, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Data masyarakat berhasil diperbarui',
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data masyarakat' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const columnMap = await getUsersColumnMap();
    const idField = columnMap.has('id') ? 'id' : 'id_user';

    await db.execute(
      `DELETE FROM users WHERE ${idField} = ? AND role = 'masyarakat'`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Data masyarakat berhasil dihapus',
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data masyarakat' },
      { status: 500 }
    );
  }
}
