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
    const hasKtpColumn = columnMap.has('dokumen_ktp_path');
    const hasKkColumn = columnMap.has('dokumen_kk_path');

    const [identityTableRows] = await db.query("SHOW TABLES LIKE 'user_identity_documents'");
    const hasIdentityTable = Array.isArray(identityTableRows) && identityTableRows.length > 0;

    const dokumenKtpExpr = hasIdentityTable
      ? hasKtpColumn
        ? 'COALESCE(u.dokumen_ktp_path, uid.dokumen_ktp_path)'
        : 'uid.dokumen_ktp_path'
      : hasKtpColumn
        ? 'u.dokumen_ktp_path'
        : 'NULL';

    const dokumenKkExpr = hasIdentityTable
      ? hasKkColumn
        ? 'COALESCE(u.dokumen_kk_path, uid.dokumen_kk_path)'
        : 'uid.dokumen_kk_path'
      : hasKkColumn
        ? 'u.dokumen_kk_path'
        : 'NULL';

    const joinIdentityTable = hasIdentityTable
      ? `
      LEFT JOIN user_identity_documents uid
        ON BINARY uid.user_id = BINARY CAST(u.${idField} AS CHAR)
        ${columnMap.has('nik') ? "OR BINARY uid.user_nik = BINARY SUBSTRING_INDEX(u.nik, '_', 1)" : ''}`
      : '';

    const selectedColumns = [
      `u.${idField} AS id`,
      columnMap.has('username') ? 'u.username' : 'NULL AS username',
      columnMap.has('nama') ? 'u.nama' : 'NULL AS nama',
      columnMap.has('email') ? 'u.email' : 'NULL AS email',
      columnMap.has('nik') ? 'u.nik' : 'NULL AS nik',
      columnMap.has('alamat') ? 'u.alamat' : 'NULL AS alamat',
      columnMap.has('telepon') ? 'u.telepon' : 'NULL AS telepon',
      columnMap.has('role') ? 'u.role' : '"masyarakat" AS role',
      columnMap.has('status') ? 'u.status' : '"aktif" AS status',
      columnMap.has('created_at') ? 'u.created_at' : 'NULL AS created_at',
      columnMap.has('last_login') ? 'u.last_login' : 'NULL AS last_login',
      `${dokumenKtpExpr} AS dokumen_ktp_path`,
      `${dokumenKkExpr} AS dokumen_kk_path`,
    ];

    const fallbackSelectedColumns = [
      `u.${idField} AS id`,
      columnMap.has('username') ? 'u.username' : 'NULL AS username',
      columnMap.has('nama') ? 'u.nama' : 'NULL AS nama',
      columnMap.has('email') ? 'u.email' : 'NULL AS email',
      columnMap.has('nik') ? 'u.nik' : 'NULL AS nik',
      columnMap.has('alamat') ? 'u.alamat' : 'NULL AS alamat',
      columnMap.has('telepon') ? 'u.telepon' : 'NULL AS telepon',
      columnMap.has('role') ? 'u.role' : '"masyarakat" AS role',
      columnMap.has('status') ? 'u.status' : '"aktif" AS status',
      columnMap.has('created_at') ? 'u.created_at' : 'NULL AS created_at',
      columnMap.has('last_login') ? 'u.last_login' : 'NULL AS last_login',
      hasKtpColumn ? 'u.dokumen_ktp_path AS dokumen_ktp_path' : 'NULL AS dokumen_ktp_path',
      hasKkColumn ? 'u.dokumen_kk_path AS dokumen_kk_path' : 'NULL AS dokumen_kk_path',
    ];

    const orderByClause = columnMap.has('created_at') ? 'ORDER BY u.created_at DESC' : '';

    let rows: any = [];
    try {
      const [joinedRows] = await db.query(`
        SELECT ${selectedColumns.join(', ')}
        FROM users u
        ${joinIdentityTable}
        ${orderByClause}
      `);
      rows = joinedRows;
    } catch (joinedQueryError) {
      console.error('Admin users GET joined query failed, using fallback query:', joinedQueryError);

      const [fallbackRows] = await db.query(`
        SELECT ${fallbackSelectedColumns.join(', ')}
        FROM users u
        ${orderByClause}
      `);
      rows = fallbackRows;
    }

    return NextResponse.json({
      success: true,
      users: rows,
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pengguna' },
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
    const username = String(body?.username || '').trim();
    const role = String(body?.role || 'masyarakat').trim();
    const password = String(body?.password || '');
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();
    const normalizedNik = nik || null;
    const allowedRoles = new Set(['admin', 'sekretaris', 'kepala_desa', 'masyarakat']);

    if (!allowedRoles.has(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    if (!nama || !email || !username || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (normalizedNik && !isValidNik(normalizedNik)) {
      return NextResponse.json({ error: 'NIK wajib 16 digit angka' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const duplicateChecks = ['email = ?', 'username = ?'];
    const duplicateParams: Array<string | null> = [email, username];
    if (normalizedNik) {
      duplicateChecks.push('SUBSTRING_INDEX(nik, "_", 1) = ?');
      duplicateParams.push(normalizedNik);
    }

    const [existingRows] = await db.execute(
      `SELECT 1 FROM users WHERE ${duplicateChecks.join(' OR ')} LIMIT 1`,
      duplicateParams
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json(
        { error: 'Email, username, atau NIK sudah terdaftar' },
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
    appendColumn('nik', normalizedNik);
    appendColumn('password', passwordHash);
    appendColumn('alamat', alamat || null);
    appendColumn('telepon', telepon || null);
    appendColumn('role', role);
    appendColumn('status', 'aktif');
    appendColumn('username', username);

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
      message: 'Data pengguna berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Admin users POST error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Email, username, atau NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal menambahkan data pengguna' },
      { status: 500 }
    );
  }
}
