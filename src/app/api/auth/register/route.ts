import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

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

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9+]/g, '').trim();
  if (!digits) return false;
  return /^(\+62|62|0|8)\d{8,13}$/.test(digits);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nama = String(body?.nama || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const nik = String(body?.nik || '').trim();
    const password = String(body?.password || '');
    const alamat = String(body?.alamat || '').trim();
    const telepon = String(body?.telepon || '').trim();

    if (!nama || !email || !nik || !password || !alamat || !telepon) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi, termasuk nomor WhatsApp aktif' },
        { status: 400 }
      );
    }

    if (!isValidNik(nik)) {
      return NextResponse.json(
        { error: 'NIK wajib 16 digit angka' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    if (!isValidPhone(telepon)) {
      return NextResponse.json(
        { error: 'Format nomor WhatsApp tidak valid' },
        { status: 400 }
      );
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

    const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
    const columns = (columnsRaw as ColumnMeta[]) || [];
    const columnMap = new Map(columns.map((column) => [column.Field, column]));

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
    appendColumn('telepon', telepon);
    appendColumn('role', 'masyarakat');
    appendColumn('status', 'aktif');
    appendColumn('username', nik);

    const idColumn = columnMap.get('id') || columnMap.get('id_user');
    if (idColumn && !/auto_increment/i.test(idColumn.Extra) && idColumn.Null === 'NO') {
      insertColumns.push(idColumn.Field);
      insertValues.push(randomUUID());
    }

    if (insertColumns.length === 0) {
      return NextResponse.json(
        { error: 'Struktur tabel users tidak sesuai untuk registrasi' },
        { status: 500 }
      );
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const sql = `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders})`;

    await db.execute(sql, insertValues);

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil, silakan login',
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat registrasi' },
      { status: 500 }
    );
  }
}
