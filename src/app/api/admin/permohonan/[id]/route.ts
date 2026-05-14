import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

function normalizeMatchingText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function deleteLinkedSuratKeluarRows(existing: {
  nomor_surat?: string | null;
  jenis_surat?: string | null;
  keperluan?: string | null;
  nama_pemohon?: string | null;
  file_path?: string | null;
}): Promise<number> {
  const nomorSurat = String(existing.nomor_surat || '').trim();
  if (!nomorSurat) return 0;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, tujuan, perihal, file_path
     FROM surat_keluar
     WHERE nomor_surat = ?`,
    [nomorSurat]
  );

  if (!rows.length) return 0;

  const namaPemohon = String(existing.nama_pemohon || '').trim();
  const jenisSurat = String(existing.jenis_surat || '').trim();
  const keperluan = String(existing.keperluan || '').trim();
  const filePath = String(existing.file_path || '').trim();
  const targetPerihal = `${jenisSurat}${keperluan ? ` - ${keperluan}` : ''}`.trim();

  const targetNamaNorm = normalizeMatchingText(namaPemohon);
  const targetPerihalNorm = normalizeMatchingText(targetPerihal);
  const targetJenisNorm = normalizeMatchingText(jenisSurat);

  const strictMatches = rows.filter((row) => {
    const rowNamaNorm = normalizeMatchingText(row.tujuan);
    const rowPerihalNorm = normalizeMatchingText(row.perihal);
    return (
      targetNamaNorm.length > 0
      && targetPerihalNorm.length > 0
      && rowNamaNorm === targetNamaNorm
      && rowPerihalNorm === targetPerihalNorm
    );
  });

  const fallbackMatches = rows.filter((row) => {
    const rowNamaNorm = normalizeMatchingText(row.tujuan);
    const rowPerihalNorm = normalizeMatchingText(row.perihal);
    const sameNama = targetNamaNorm.length > 0 && rowNamaNorm === targetNamaNorm;
    const sameFilePath = filePath.length > 0 && String(row.file_path || '').trim() === filePath;
    const sameJenisPrefix = targetJenisNorm.length > 0 && rowPerihalNorm.startsWith(targetJenisNorm);

    return sameNama && (sameJenisPrefix || sameFilePath);
  });

  const matchedIds = Array.from(new Set([
    ...strictMatches.map((row) => Number(row.id)),
    ...fallbackMatches.map((row) => Number(row.id)),
  ].filter((id) => Number.isFinite(id) && id > 0)));

  if (!matchedIds.length) return 0;

  const placeholders = matchedIds.map(() => '?').join(', ');
  const [deleted] = await db.query<ResultSetHeader>(
    `DELETE FROM surat_keluar WHERE id IN (${placeholders})`,
    matchedIds
  );

  return deleted.affectedRows || 0;
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'ID permohonan tidak valid' }, { status: 400 });
    }

    const [existingRows]: any = await db.execute(
      'SELECT id, status, nomor_surat, jenis_surat, keperluan, nama_pemohon, file_path FROM permohonan_surat WHERE id = ? LIMIT 1',
      [id]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Data permohonan tidak ditemukan' }, { status: 404 });
    }

    const existing = existingRows[0];

    await db.execute('DELETE FROM permohonan_surat WHERE id = ? LIMIT 1', [id]);

    await deleteLinkedSuratKeluarRows(existing);

    return NextResponse.json({
      success: true,
      message: 'Permohonan berhasil dihapus dari daftar',
    });
  } catch (error) {
    console.error('Error deleting permohonan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus permohonan' },
      { status: 500 }
    );
  }
}
