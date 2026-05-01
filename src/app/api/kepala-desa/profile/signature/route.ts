import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { uploadFile } from '@/lib/storage';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024; // 2MB

const allowedMimeToExt: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

type JwtPayload = {
  userId?: string | number;
  id?: string | number;
  role?: string;
};

type ColumnMeta = {
  Field: string;
};

async function getIdField(): Promise<'id' | 'id_user'> {
  const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
  const columns = (columnsRaw as ColumnMeta[]) || [];
  const columnSet = new Set(columns.map((item) => item.Field));
  return columnSet.has('id') ? 'id' : 'id_user';
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
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

function resolveExtensionFromName(fileName: string): string | null {
  const lowerName = String(fileName || '').toLowerCase();
  if (lowerName.endsWith('.png')) return 'png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'jpg';
  if (lowerName.endsWith('.webp')) return 'webp';
  return null;
}

/** Ensure the signature_url column exists with enough capacity for blob URLs or data URIs */
async function ensureSignatureUrlColumn(_idField: string): Promise<void> {
  try {
    // Check if column exists using INFORMATION_SCHEMA
    const [rows]: any = await db.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'signature_url'
       LIMIT 1`
    );

    const existing = Array.isArray(rows) ? rows[0] : null;

    if (!existing) {
      // Column doesn't exist — create it
      console.log('[signature] Adding signature_url column to users table...');
      await db.execute('ALTER TABLE users ADD COLUMN signature_url MEDIUMTEXT NULL');
      console.log('[signature] signature_url column added successfully.');
      return;
    }

    // Column exists — widen to MEDIUMTEXT if it's still VARCHAR/TEXT (too small for base64)
    const colType = String(existing.COLUMN_TYPE || existing.column_type || '').toLowerCase();
    if (colType.includes('varchar') || colType === 'text') {
      console.log('[signature] Widening signature_url column to MEDIUMTEXT...');
      await db.execute('ALTER TABLE users MODIFY COLUMN signature_url MEDIUMTEXT NULL');
      console.log('[signature] signature_url column widened successfully.');
    }
  } catch (error) {
    // Log the error explicitly instead of silently swallowing it
    console.error('[signature] ensureSignatureUrlColumn error:', error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    const auth = await ensureKepalaDesaAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const rawFile = formData.get('signature');

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: 'File tanda tangan wajib diunggah' }, { status: 400 });
    }

    if (rawFile.size <= 0) {
      return NextResponse.json({ error: 'File tanda tangan kosong' }, { status: 400 });
    }

    if (rawFile.size > MAX_SIGNATURE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 });
    }

    const fileType = String(rawFile.type || '').toLowerCase();
    const fileExt = allowedMimeToExt[fileType] || resolveExtensionFromName(rawFile.name);
    if (!fileExt) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan PNG, JPG, atau WEBP.' },
        { status: 400 }
      );
    }

    const safeUserId = safeFilePart(auth.userId);
    if (!safeUserId) {
      return NextResponse.json({ error: 'User ID tidak valid' }, { status: 400 });
    }

    const bytes = await rawFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const normalizedContentType = fileType || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg');

    let signatureUrl: string;

    // Try Vercel Blob or local filesystem first
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const storedFileName = `kepala-desa-${safeUserId}.${fileExt}`;
      const storagePath = `uploads/signatures/${storedFileName}`;
      try {
        signatureUrl = await uploadFile(storagePath, buffer, normalizedContentType);
      } catch (err) {
        console.warn('[signature] Vercel Blob failed, falling back to base64 data URI:', err);
        const base64 = buffer.toString('base64');
        signatureUrl = `data:${normalizedContentType};base64,${base64}`;
      }
    } else {
      // No external storage available (e.g. Vercel without Blob token, or local dev fallback)
      // Store signature as base64 data URI directly in the database
      const base64 = buffer.toString('base64');
      signatureUrl = `data:${normalizedContentType};base64,${base64}`;
    }

    const idField = await getIdField();
    await ensureSignatureUrlColumn(idField);
    await db.execute(`UPDATE users SET signature_url = ? WHERE ${idField} = ?`, [signatureUrl, auth.userId]);

    // Return a cache-busted URL for display; for data URIs the timestamp param is stripped on display
    const displayUrl = signatureUrl.startsWith('data:') ? signatureUrl : `${signatureUrl}?t=${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'File tanda tangan berhasil diunggah',
      signature_url: displayUrl,
    });
  } catch (error) {
    console.error('Kepala Desa signature upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah file tanda tangan' },
      { status: 500 }
    );
  }
}

