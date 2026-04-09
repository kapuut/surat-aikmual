import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

type WorkflowStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
}

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;
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
      // Keep original value when parsing fails.
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
    return 'selesai';
  }

  return 'pending';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const rawNik = typeof user.nik === 'string' ? user.nik.trim() : '';
    const baseNik = normalizeNikValue(rawNik);
    if (!rawNik && !baseNik) {
      return NextResponse.json({ error: 'NIK user tidak ditemukan' }, { status: 400 });
    }

    const baseQuery = `
      SELECT
        p.id,
        p.nik,
        p.jenis_surat,
        p.nomor_surat,
        p.status,
        p.catatan,
        p.created_at,
        p.updated_at,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.file_path,
        sk.archived_file_path,
        u.nama AS processed_by_name
      FROM permohonan_surat p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN (
        SELECT nomor_surat, perihal, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat, perihal
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
      WHERE p.id = ? AND (p.nik = ? OR p.nik = ? OR SUBSTRING_INDEX(p.nik, '_', 1) = ?)
      LIMIT 1
    `;

    const fallbackQuery = `
      SELECT
        p.id,
        p.nik,
        p.jenis_surat,
        p.nomor_surat,
        p.status,
        p.catatan,
        p.created_at,
        p.updated_at,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.dokumen_path AS file_path,
        sk.archived_file_path,
        u.nama AS processed_by_name
      FROM permohonan_surat p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN (
        SELECT nomor_surat, perihal, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat, perihal
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
      WHERE p.id = ? AND (p.nik = ? OR p.nik = ? OR SUBSTRING_INDEX(p.nik, '_', 1) = ?)
      LIMIT 1
    `;

    let rows: any[] = [];
    try {
      const [baseRows] = await db.execute(baseQuery, [params.id, rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
      rows = (baseRows as any[]) || [];
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
        throw error;
      }
      const [fallbackRows] = await db.execute(fallbackQuery, [params.id, rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
      rows = (fallbackRows as any[]) || [];
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Permohonan tidak ditemukan' },
        { status: 404 }
      );
    }

    const row = rows[0];
    const normalizedStatus = normalizeWorkflowStatus(row.status, row.nomor_surat, row.catatan);
    const archivedFilePath = normalizeFilePath(row.archived_file_path);
    const rawFilePath = normalizeFilePath(row.file_path);

    const finalFilePath =
      (isGeneratedSuratFile(archivedFilePath) ? archivedFilePath : null) ||
      (isGeneratedSuratFile(rawFilePath) ? rawFilePath : null) ||
      null;

    const responsePayload = {
      id: row.id,
      nik: row.nik,
      jenis_surat: row.jenis_surat,
      nomor_surat: row.nomor_surat || null,
      status: normalizedStatus,
      catatan: row.catatan || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
      tanggal_permohonan: row.tanggal_permohonan || row.created_at || null,
      tanggal_selesai:
        ['selesai', 'ditandatangani'].includes(normalizedStatus)
          ? row.tanggal_selesai || row.updated_at || row.tanggal_permohonan || row.created_at || null
          : null,
      alasan_penolakan:
        ['ditolak', 'perlu_revisi'].includes(normalizedStatus)
          ? row.alasan_penolakan || row.catatan || null
          : null,
      file_path: finalFilePath,
      processed_by_name: row.processed_by_name || null,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error detail tracking:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data permohonan' },
      { status: 500 }
    );
  }
}
