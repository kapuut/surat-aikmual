import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
}

export async function GET(request: NextRequest) {
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

    // Fetch permohonan for this user
    const query = `
      SELECT 
        id, 
        nik, 
        jenis_surat, 
        nomor_surat, 
        status, 
        created_at AS tanggal_permohonan,
        CASE WHEN status IN ('selesai', 'ditandatangani') THEN updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN status IN ('ditolak', 'perlu_revisi') THEN catatan ELSE NULL END AS alasan_penolakan,
        file_path
      FROM permohonan_surat
      WHERE (nik = ? OR nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
      ORDER BY created_at DESC
    `;

    const [permohonanRows] = await db.execute(query, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
    const permohonanData = (permohonanRows as any[]) || [];

    return NextResponse.json({
      success: true,
      data: permohonanData,
      total: permohonanData.length,
    });
  } catch (error) {
    console.error('Error fetching permohonan:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data permohonan' },
      { status: 500 }
    );
  }
}
