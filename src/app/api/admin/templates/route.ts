import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { uploadFile, uniqueStoragePath } from '@/lib/storage';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const runtime = 'nodejs';

type JwtPayload = {
  userId?: string;
  role?: string;
};

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

    return { ok: true as const, userId: decoded.userId || null };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
  }
}

async function ensureTemplateTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS template_surat (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(200) NOT NULL,
      deskripsi TEXT NULL,
      jenis_surat VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      status ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
      uploaded_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

function sanitizeFileName(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `${Date.now()}_${safeName}`;
}

function isAllowedExtension(fileName: string): boolean {
  const lowered = fileName.toLowerCase();
  return lowered.endsWith('.docx') || lowered.endsWith('.pdf');
}

export async function GET() {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureTemplateTable();
    const [rows] = await db.execute('SELECT * FROM template_surat ORDER BY created_at DESC');

    return NextResponse.json({ success: true, templates: rows });
  } catch (error) {
    console.error('Admin templates GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar template' },
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

    const formData = await request.formData();
    const nama = String(formData.get('nama') || '').trim();
    const deskripsi = String(formData.get('deskripsi') || '').trim();
    const jenisSurat = String(formData.get('jenisSurat') || '').trim();
    const file = formData.get('file') as File | null;

    if (!nama || !jenisSurat || !file) {
      return NextResponse.json(
        { error: 'Nama template, jenis surat, dan file wajib diisi' },
        { status: 400 }
      );
    }

    if (!isAllowedExtension(file.name)) {
      return NextResponse.json(
        { error: 'File template harus berformat .docx atau .pdf' },
        { status: 400 }
      );
    }

    await ensureTemplateTable();

    const fileName = sanitizeFileName(file.name);
    const storagePath = `templates/${fileName}`;
    const bytes = await file.arrayBuffer();
    const relativePath = await uploadFile(storagePath, Buffer.from(bytes), file.type || undefined);

    await db.execute(
      `
        INSERT INTO template_surat
        (nama, deskripsi, jenis_surat, file_name, file_path, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nama,
        deskripsi || null,
        jenisSurat,
        fileName,
        relativePath,
        auth.userId,
      ]
    );

    return NextResponse.json({ success: true, message: 'Template berhasil diupload' });
  } catch (error) {
    console.error('Admin templates POST error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupload template' },
      { status: 500 }
    );
  }
}
