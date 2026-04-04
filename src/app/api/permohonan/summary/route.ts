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

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('pending', 'diproses', 'dikirim_ke_kepala_desa', 'perlu_revisi') THEN 1 ELSE 0 END) as diproses,
        SUM(CASE WHEN status IN ('selesai', 'ditandatangani') THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak
      FROM permohonan_surat
      WHERE (nik = ? OR nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
    `;

    const [statsRows] = await db.execute(statsQuery, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
    const stats = (statsRows as any[])[0] || {
      total: 0,
      diproses: 0,
      selesai: 0,
      ditolak: 0,
    };

    // Get recent permohonan
    const recentQuery = `
      SELECT 
        id,
        jenis_surat,
        status,
        created_at AS tanggal_dibuat,
        CASE WHEN status IN ('selesai', 'ditandatangani') THEN updated_at ELSE NULL END AS tanggal_selesai,
        nomor_surat,
        file_path
      FROM permohonan_surat
      WHERE (nik = ? OR nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [permohonanRows] = await db.execute(recentQuery, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
    const permohonan = (permohonanRows as any[]) || [];

    return NextResponse.json({
      success: true,
      stats: {
        total: stats.total || 0,
        diproses: stats.diproses || 0,
        selesai: stats.selesai || 0,
        ditolak: stats.ditolak || 0,
      },
      permohonan,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    );
  }
}
