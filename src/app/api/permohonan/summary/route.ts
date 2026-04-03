import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get and verify JWT token
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: JWTPayload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      decoded = verified.payload as unknown as JWTPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's NIK
    const userQuery = 'SELECT nik FROM users WHERE id = ?';
    const [userRows] = await db.execute(userQuery, [decoded.userId]);
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('pending', 'diproses') THEN 1 ELSE 0 END) as diproses,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak
      FROM permohonan_surat
      WHERE nik = ?
    `;

    const [statsRows] = await db.execute(statsQuery, [userData.nik]);
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
        CASE WHEN status = 'selesai' THEN updated_at ELSE NULL END AS tanggal_selesai,
        nomor_surat,
        file_path
      FROM permohonan_surat
      WHERE nik = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [permohonanRows] = await db.execute(recentQuery, [userData.nik]);
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
