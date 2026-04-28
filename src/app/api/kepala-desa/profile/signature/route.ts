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
  userId?: string;
  role?: string;
};

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

    return { ok: true as const, userId: String(decoded.userId || '') };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
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
    const fileExt = allowedMimeToExt[fileType];
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
    const signatureUrl = await uploadFile(storagePath, Buffer.from(bytes), fileType);

    // Persist URL to DB so profile lookup doesn't need readdir
    try {
      await db.execute(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url VARCHAR(500) NULL'
      );
    } catch { /* column may already exist */ }
    await db.execute('UPDATE users SET signature_url = ? WHERE id = ?', [signatureUrl, auth.userId]);

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
