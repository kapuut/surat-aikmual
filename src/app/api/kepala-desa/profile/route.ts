import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

type JwtPayload = {
  userId?: string | number;
  id?: string | number;
  role?: string;
};

type ColumnMeta = {
  Field: string;
};

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

async function getIdField(): Promise<'id' | 'id_user'> {
  const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
  const columns = (columnsRaw as ColumnMeta[]) || [];
  const columnSet = new Set(columns.map((item) => item.Field));
  return columnSet.has('id') ? 'id' : 'id_user';
}

async function getSignatureUrlForUser(userId: string, idField: 'id' | 'id_user'): Promise<string | null> {
  try {
    const [rows]: any = await db.execute(
      `SELECT signature_url FROM users WHERE ${idField} = ? LIMIT 1`,
      [userId]
    );
    return (rows as any[])?.[0]?.signature_url || null;
  } catch {
    return null;
  }
}

async function ensureKepalaDesaAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'kepala_desa') {
      return { ok: false as const, status: 403, error: 'Forbidden - Kepala Desa only' };
    }

    const resolvedUserId = decoded.userId ?? decoded.id;
    return { ok: true as const, userId: String(resolvedUserId || '') };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
  }
}

export async function GET() {
  try {
    const auth = await ensureKepalaDesaAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const idField = await getIdField();
    const [rows] = await db.execute(
      `SELECT ${idField} AS id, username, nama, email, role, status, nik, alamat, telepon, created_at, updated_at, last_login
       FROM users
       WHERE ${idField} = ?
       LIMIT 1`,
      [auth.userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Profil Kepala Desa tidak ditemukan' }, { status: 404 });
    }

    const profile = rows[0] as Record<string, unknown>;
    const signatureUrl = await getSignatureUrlForUser(auth.userId, idField);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        signature_url: signatureUrl,
      },
    });
  } catch (error) {
    console.error('Kepala Desa profile GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil profil Kepala Desa' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await ensureKepalaDesaAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();

    if (!nama || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    const idField = await getIdField();

    const [userRows]: any = await db.execute(
      `SELECT ${idField} AS id FROM users WHERE ${idField} = ? LIMIT 1`,
      [auth.userId]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: 'Profil Kepala Desa tidak ditemukan' }, { status: 404 });
    }

    const [emailExists]: any = await db.execute(
      `SELECT ${idField} FROM users WHERE email = ? AND ${idField} <> ? LIMIT 1`,
      [email, auth.userId]
    );

    if (Array.isArray(emailExists) && emailExists.length > 0) {
      return NextResponse.json({ error: 'Email sudah digunakan akun lain' }, { status: 409 });
    }

    await db.execute(
      `UPDATE users
       SET nama = ?, email = ?, alamat = ?, telepon = ?, updated_at = NOW()
       WHERE ${idField} = ?`,
      [nama, email, alamat || null, telepon || null, auth.userId]
    );

    const signatureUrl = await getSignatureUrlForUser(auth.userId, idField);

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      profile: {
        nama,
        email,
        alamat,
        telepon,
        signature_url: signatureUrl,
      },
    });
  } catch (error) {
    console.error('Kepala Desa profile PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui profil Kepala Desa' },
      { status: 500 }
    );
  }
}
