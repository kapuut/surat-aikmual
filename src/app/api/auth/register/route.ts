import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

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

async function saveIdentityFile(file: File, nik: string, label: 'ktp' | 'kk'): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public/uploads/registrasi-identitas');
  await mkdir(uploadDir, { recursive: true });

  const originalName = file.name || `${label}.pdf`;
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${nik}-${label}-${safeName}`;
  const filePath = path.join(uploadDir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/registrasi-identitas/${filename}`;
}

async function ensureIdentityDocumentsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_identity_documents (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_nik VARCHAR(16) NOT NULL UNIQUE,
      user_id VARCHAR(64) NULL,
      dokumen_ktp_path VARCHAR(255) NOT NULL,
      dokumen_kk_path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const formData = isMultipart ? await request.formData() : null;
    const body = !isMultipart ? await request.json() : null;

    const getValue = (key: string) => {
      if (formData) return String(formData.get(key) || '').trim();
      return String(body?.[key] || '').trim();
    };

    const nama = getValue('nama');
    const email = getValue('email').toLowerCase();
    const nik = getValue('nik');
    const password = formData ? String(formData.get('password') || '') : String(body?.password || '');
    const alamat = getValue('alamat');
    const telepon = getValue('telepon');
    const dokumenKTP = formData?.get('dokumenKTP');
    const dokumenKK = formData?.get('dokumenKK');

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

    if (!(dokumenKTP instanceof File) || dokumenKTP.size === 0) {
      return NextResponse.json(
        { error: 'Dokumen KTP wajib diunggah saat registrasi' },
        { status: 400 }
      );
    }

    if (!(dokumenKK instanceof File) || dokumenKK.size === 0) {
      return NextResponse.json(
        { error: 'Dokumen Kartu Keluarga (KK) wajib diunggah saat registrasi' },
        { status: 400 }
      );
    }

    const [existingNikRows] = await db.execute(
      'SELECT 1 FROM users WHERE SUBSTRING_INDEX(nik, "_", 1) = ? LIMIT 1',
      [nik]
    );

    const [existingEmailRows] = await db.execute(
      'SELECT 1 FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    const nikSudahTerdaftar = Array.isArray(existingNikRows) && existingNikRows.length > 0;
    const emailSudahTerdaftar = Array.isArray(existingEmailRows) && existingEmailRows.length > 0;

    if (nikSudahTerdaftar && emailSudahTerdaftar) {
      return NextResponse.json(
        { error: 'NIK dan email sudah terdaftar' },
        { status: 409 }
      );
    }

    if (nikSudahTerdaftar) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 409 }
      );
    }

    if (emailSudahTerdaftar) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    const dokumenKtpPath = await saveIdentityFile(dokumenKTP, nik, 'ktp');
    const dokumenKkPath = await saveIdentityFile(dokumenKK, nik, 'kk');

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
    appendColumn('status', 'nonaktif');
    appendColumn('dokumen_ktp_path', dokumenKtpPath);
    appendColumn('dokumen_kk_path', dokumenKkPath);
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

    const [insertResult]: any = await db.execute(sql, insertValues);
    const generatedUserId =
      insertValues[insertColumns.indexOf(idColumn?.Field || '')] ||
      insertResult?.insertId ||
      null;

    await ensureIdentityDocumentsTable();
    await db.execute(
      `INSERT INTO user_identity_documents (user_nik, user_id, dokumen_ktp_path, dokumen_kk_path)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         dokumen_ktp_path = VALUES(dokumen_ktp_path),
         dokumen_kk_path = VALUES(dokumen_kk_path),
         updated_at = CURRENT_TIMESTAMP`,
      [nik, generatedUserId ? String(generatedUserId) : null, dokumenKtpPath, dokumenKkPath]
    );

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil. Akun Anda menunggu validasi admin sebelum dapat digunakan.',
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      const duplicateSource = String(error?.sqlMessage || '').toLowerCase();

      if (duplicateSource.includes('nik')) {
        return NextResponse.json(
          { error: 'NIK sudah terdaftar' },
          { status: 409 }
        );
      }

      if (duplicateSource.includes('email')) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'NIK atau email sudah terdaftar' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat registrasi' },
      { status: 500 }
    );
  }
}
