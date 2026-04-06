import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

type WorkflowStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

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

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/generated-surat/') || pathValue.toLowerCase().endsWith('.html');
}

function normalizeWorkflowStatus(rawStatus: unknown, nomorSurat: unknown): WorkflowStatus {
  const normalized = String(rawStatus || '').trim().toLowerCase();
  const knownStatuses: WorkflowStatus[] = [
    'pending',
    'diproses',
    'dikirim_ke_kepala_desa',
    'perlu_revisi',
    'ditandatangani',
    'selesai',
    'ditolak',
  ];

  if ((knownStatuses as string[]).includes(normalized)) {
    return normalized as WorkflowStatus;
  }

  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'selesai';
  }

  return 'pending';
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
        p.id,
        p.nama_pemohon,
        p.nik,
        p.alamat,
        p.jenis_surat,
        p.keperluan,
        p.status,
        p.catatan,
        p.nomor_surat,
        p.file_path,
        sk.archived_file_path,
        p.created_at,
        p.updated_at,
        p.processed_by
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat
      ) sk ON sk.nomor_surat = p.nomor_surat
      ORDER BY p.created_at DESC
    `;

    const fallbackQueryWithDokumenPath = `
      SELECT
        p.id,
        p.nama_pemohon,
        p.nik,
        p.alamat,
        p.jenis_surat,
        p.keperluan,
        p.status,
        p.catatan,
        p.nomor_surat,
        p.dokumen_path AS file_path,
        sk.archived_file_path,
        p.created_at,
        p.updated_at,
        p.processed_by
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat
      ) sk ON sk.nomor_surat = p.nomor_surat
      ORDER BY p.created_at DESC
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
      status: normalizeWorkflowStatus((row as any).status, (row as any).nomor_surat),
      file_path:
        (isGeneratedSuratFile(normalizeFilePath((row as any).archived_file_path))
          ? normalizeFilePath((row as any).archived_file_path)
          : null) || normalizeFilePath((row as any).file_path),
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
