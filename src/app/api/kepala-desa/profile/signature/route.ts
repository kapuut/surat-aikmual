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

    // Use a stable path so uploading a new signature overwrites the old one (addRandomSuffix: false in storage.ts)
    const storedFileName = `kepala-desa-${safeUserId}.${fileExt}`;
    const storagePath = `uploads/signatures/${storedFileName}`;
    const bytes = await rawFile.arrayBuffer();
    const normalizedContentType = fileType || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg');
    const signatureUrl = await uploadFile(storagePath, Buffer.from(bytes), normalizedContentType);

    const idField = await getIdField();

    // Persist URL to DB so profile lookup doesn't need readdir
    try {
      await db.execute(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url VARCHAR(500) NULL'
      );
    } catch { /* column may already exist */ }
    await db.execute(`UPDATE users SET signature_url = ? WHERE ${idField} = ?`, [signatureUrl, auth.userId]);

    return NextResponse.json({
      success: true,
      message: 'File tanda tangan berhasil diunggah',
      signature_url: `${signatureUrl}?t=${Date.now()}`,
    });
  } catch (error) {
    console.error('Kepala Desa signature upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah file tanda tangan' },
      { status: 500 }
    );
  }
}
