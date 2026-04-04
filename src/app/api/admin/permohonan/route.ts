import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;

  // Some rows store dokumen as JSON arrays (e.g. ["/uploads/a.pdf"]).
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((item) => typeof item === 'string' && item.trim());
        candidate = typeof first === 'string' ? first.trim() : null;
      } else if (typeof parsed === 'string' && parsed.trim()) {
        candidate = parsed.trim();
      }
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  if (!candidate || candidate === '[]') return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith('/') ? candidate : `/${candidate}`;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    if (!['admin', 'sekretaris', 'kepala_desa'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const baseQueryWithFilePath = `
      SELECT
        id,
        nama_pemohon,
        nik,
        alamat,
        jenis_surat,
        keperluan,
        status,
        catatan,
        nomor_surat,
        file_path,
        created_at,
        updated_at,
        processed_by
      FROM permohonan_surat
      ORDER BY created_at DESC
    `;

    const fallbackQueryWithDokumenPath = `
      SELECT
        id,
        nama_pemohon,
        nik,
        alamat,
        jenis_surat,
        keperluan,
        status,
        catatan,
        nomor_surat,
        dokumen_path AS file_path,
        created_at,
        updated_at,
        processed_by
      FROM permohonan_surat
      ORDER BY created_at DESC
    `;

    let rows: RowDataPacket[];
    try {
      const [result] = await db.query<RowDataPacket[]>(baseQueryWithFilePath);
      rows = result;
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
        throw error;
      }
      const [result] = await db.query<RowDataPacket[]>(fallbackQueryWithDokumenPath);
      rows = result;
    }

    const normalizedRows = rows.map((row) => ({
      ...row,
      file_path: normalizeFilePath((row as any).file_path),
    }));

    return NextResponse.json({
      success: true,
      data: normalizedRows,
      total: normalizedRows.length,
    });
  } catch (error) {
    console.error('Error fetching admin permohonan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data permohonan' },
      { status: 500 }
    );
  }
}
