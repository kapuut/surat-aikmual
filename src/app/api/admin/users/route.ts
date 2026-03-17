import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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

export async function GET() {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const columnMap = await getUsersColumnMap();
    const idField = columnMap.has('id') ? 'id' : 'id_user';

    const selectedColumns = [
      `${idField} AS id`,
      columnMap.has('username') ? 'username' : 'NULL AS username',
      columnMap.has('nama') ? 'nama' : 'NULL AS nama',
      columnMap.has('email') ? 'email' : 'NULL AS email',
      columnMap.has('nik') ? 'nik' : 'NULL AS nik',
      columnMap.has('alamat') ? 'alamat' : 'NULL AS alamat',
      columnMap.has('telepon') ? 'telepon' : 'NULL AS telepon',
      columnMap.has('role') ? 'role' : '"masyarakat" AS role',
      columnMap.has('status') ? 'status' : '"aktif" AS status',
      columnMap.has('created_at') ? 'created_at' : 'NULL AS created_at',
      columnMap.has('last_login') ? 'last_login' : 'NULL AS last_login',
    ];

    const whereClause = columnMap.has('role')
      ? `WHERE role = 'masyarakat'`
      : '';

    const orderByClause = columnMap.has('created_at') ? 'ORDER BY created_at DESC' : '';

    const [rows] = await db.query(`
      SELECT ${selectedColumns.join(', ')}
      FROM users
      ${whereClause}
      ${orderByClause}
    `);

    return NextResponse.json({
      success: true,
      users: rows,
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data masyarakat' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const nik = String(body?.nik || '').trim();
    const password = String(body?.password || '');
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();

    if (!nama || !email || !nik || !password || !alamat) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (!isValidNik(nik)) {
      return NextResponse.json({ error: 'NIK wajib 16 digit angka' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const [existingRows] = await db.execute(
      'SELECT 1 FROM users WHERE SUBSTRING_INDEX(nik, "_", 1) = ? OR email = ? LIMIT 1',
      [nik, email]
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    const columnMap = await getUsersColumnMap();
    const passwordHash = await bcrypt.hash(password, 10);

    const insertColumns: string[] = [];
    const insertValues: Array<string | null> = [];

    const appendColumn = (column: string, value: string | null) => {
      if (columnMap.has(column)) {
        insertColumns.push(column);
        insertValues.push(value);
      }
    };

    appendColumn('nama', nama);
    appendColumn('email', email);
    appendColumn('nik', nik);
    appendColumn('password', passwordHash);
    appendColumn('alamat', alamat);
    appendColumn('telepon', telepon || null);
    appendColumn('role', 'masyarakat');
    appendColumn('status', 'aktif');
    appendColumn('username', nik);

    const idColumn = columnMap.get('id') || columnMap.get('id_user');
    if (idColumn && !/auto_increment/i.test(idColumn.Extra) && idColumn.Null === 'NO') {
      insertColumns.push(idColumn.Field);
      insertValues.push(randomUUID());
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    await db.execute(
      `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );

    return NextResponse.json({
      success: true,
      message: 'Data masyarakat berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Admin users POST error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal menambahkan data masyarakat' },
      { status: 500 }
    );
  }
}
