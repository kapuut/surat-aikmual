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

    return { ok: true as const, userId: String(decoded.userId ?? '') };
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
    const username = String(body?.username || '').trim();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const nik = String(body?.nik || '').trim();
    const role = String(body?.role || '').trim();
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();
    const status = body?.status === 'nonaktif' ? 'nonaktif' : 'aktif';
    const allowedRoles = new Set(['admin', 'sekretaris', 'kepala_desa', 'masyarakat']);

    if (!nama || !email || !username || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    if (nik && !isValidNik(nik)) {
      return NextResponse.json({ error: 'NIK wajib 16 digit angka' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    const columnMap = await getUsersColumnMap();
    const idField = columnMap.has('id') ? 'id' : 'id_user';

    const duplicateChecks = ['email = ?', 'username = ?'];
    const duplicateParams: Array<string | null> = [email, username];
    if (nik) {
      duplicateChecks.push('SUBSTRING_INDEX(nik, "_", 1) = ?');
      duplicateParams.push(nik);
    }
    duplicateChecks.push(`${idField} <> ?`);
    duplicateParams.push(params.id);

    const [existingRows] = await db.execute(
      `SELECT ${idField} FROM users WHERE (${duplicateChecks.slice(0, -1).join(' OR ')}) AND ${duplicateChecks[duplicateChecks.length - 1]} LIMIT 1`,
      duplicateParams
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json(
        { error: 'Email, username, atau NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    const updates = [
      'username = ?',
      'nama = ?',
      'email = ?',
      'nik = ?',
      'role = ?',
      'alamat = ?',
      'telepon = ?',
      'status = ?',
    ];

    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE ${idField} = ?`,
      [username, nama, email, nik || null, role, alamat || null, telepon || null, status, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui',
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data pengguna' },
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

    if (auth.userId === params.id) {
      return NextResponse.json(
        { error: 'Akun sendiri tidak dapat dihapus' },
        { status: 400 }
      );
    }

    await db.execute(
      `DELETE FROM users WHERE ${idField} = ?`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil dihapus',
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data pengguna' },
      { status: 500 }
    );
  }
}
