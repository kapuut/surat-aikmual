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

function normalizeFilePaths(rawValue: unknown): string[] {
  if (typeof rawValue !== 'string') return [];
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === '[]') return [];

  let candidates: unknown[] = [trimmed];
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      candidates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  const normalized = candidates
    .map((item) => normalizeFilePath(item))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/generated-surat/') || pathValue.toLowerCase().endsWith('.html');
}

function isAttachmentFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/uploads/');
}

function inferStatusFromNote(note: unknown): WorkflowStatus | null {
  const text = String(note || '').trim().toLowerCase();
  if (!text) return null;

  if (text.includes('ditolak') || text.includes('tolak')) return 'ditolak';
  if (text.includes('revisi')) return 'perlu_revisi';
  if (text.includes('kepala desa') && (text.includes('dikirim') || text.includes('tanda tangan'))) {
    return 'dikirim_ke_kepala_desa';
  }
  if (text.includes('ditandatangani')) return 'ditandatangani';
  if (text.includes('selesai') || text.includes('final')) return 'selesai';

  return null;
}

function normalizeWorkflowStatus(rawStatus: unknown, nomorSurat: unknown, note?: unknown): WorkflowStatus {
  const normalized = String(rawStatus || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
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

  const inferredFromNote = inferStatusFromNote(note);
  if (inferredFromNote) return inferredFromNote;

  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'dikirim_ke_kepala_desa';
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
        SELECT sk1.nomor_surat, sk1.perihal, sk1.file_path AS archived_file_path
        FROM surat_keluar sk1
        INNER JOIN (
          SELECT nomor_surat, perihal, MAX(id) AS latest_id
          FROM surat_keluar
          GROUP BY nomor_surat, perihal
        ) latest_sk ON latest_sk.latest_id = sk1.id
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
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
        SELECT sk1.nomor_surat, sk1.perihal, sk1.file_path AS archived_file_path
        FROM surat_keluar sk1
        INNER JOIN (
          SELECT nomor_surat, perihal, MAX(id) AS latest_id
          FROM surat_keluar
          GROUP BY nomor_surat, perihal
        ) latest_sk ON latest_sk.latest_id = sk1.id
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
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

    const normalizedRows = rows.map((row) => {
      const archivedFilePath = normalizeFilePath((row as any).archived_file_path);
      const candidatePaths = normalizeFilePaths((row as any).file_path);
      const generatedFromPermohonan = candidatePaths.find((pathValue) => isGeneratedSuratFile(pathValue)) || null;
      const attachmentPaths = candidatePaths.filter((pathValue) => isAttachmentFile(pathValue));

      return {
        ...row,
        status: normalizeWorkflowStatus((row as any).status, (row as any).nomor_surat, (row as any).catatan),
        file_path:
          (isGeneratedSuratFile(archivedFilePath) ? archivedFilePath : null) ||
          generatedFromPermohonan ||
          candidatePaths[0] ||
          null,
        attachment_paths: attachmentPaths,
      };
    });

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
