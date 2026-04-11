import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

type JwtPayload = {
  userId?: string;
  role?: string;
};

type ColumnMeta = {
  Field: string;
};

async function getIdField() {
  const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
  const columns = (columnsRaw as ColumnMeta[]) || [];
  const columnSet = new Set(columns.map((item) => item.Field));
  return columnSet.has('id') ? 'id' : 'id_user';
}

async function ensureAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  try {
    const decoded = verify(token.value, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') {
      return { ok: false as const, status: 403, error: 'Forbidden - Admin only' };
    }

    return { ok: true as const, userId: String(decoded.userId || '') };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
  }
}

export async function GET() {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const idField = await getIdField();
    const [rows] = await db.execute(
      `SELECT ${idField} AS id, username, nama, email, role, status, nik, alamat, telepon, created_at, last_login FROM users WHERE ${idField} = ? LIMIT 1`,
      [auth.userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Profil admin tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: rows[0] });
  } catch (error) {
    console.error('Admin profile GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil profil admin' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '');

    if (!nama || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    const idField = await getIdField();
    const [rows]: any = await db.execute(
      `SELECT ${idField} AS id, password FROM users WHERE ${idField} = ? LIMIT 1`,
      [auth.userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Profil admin tidak ditemukan' }, { status: 404 });
    }

    const adminRow = rows[0];

    const [emailExists]: any = await db.execute(
      `SELECT ${idField} FROM users WHERE email = ? AND ${idField} <> ? LIMIT 1`,
      [email, auth.userId]
    );

    if (Array.isArray(emailExists) && emailExists.length > 0) {
      return NextResponse.json({ error: 'Email sudah digunakan akun lain' }, { status: 409 });
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password lama wajib diisi untuk mengganti password' }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminRow.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Password lama tidak benar' }, { status: 401 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.execute(
        `UPDATE users SET nama = ?, email = ?, alamat = ?, telepon = ?, password = ?, updated_at = NOW() WHERE ${idField} = ?`,
        [nama, email, alamat || null, telepon || null, passwordHash, auth.userId]
      );
    } else {
      await db.execute(
        `UPDATE users SET nama = ?, email = ?, alamat = ?, telepon = ?, updated_at = NOW() WHERE ${idField} = ?`,
        [nama, email, alamat || null, telepon || null, auth.userId]
      );
    }

    return NextResponse.json({ success: true, message: 'Profil admin berhasil diperbarui' });
  } catch (error) {
    console.error('Admin profile PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui profil admin' },
      { status: 500 }
    );
  }
}
