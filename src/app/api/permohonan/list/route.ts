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

    // Get user's NIK to fetch permohonan
    const userQuery = 'SELECT nik FROM users WHERE id = ?';
    const [userRows] = await db.execute(userQuery, [decoded.userId]);
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Fetch permohonan for this user
    const query = `
      SELECT 
        id, 
        nik, 
        jenis_surat, 
        nomor_surat, 
        status, 
        tanggal_permohonan,
        tanggal_selesai,
        alasan_penolakan
      FROM permohonan
      WHERE nik = ?
      ORDER BY tanggal_permohonan DESC
    `;

    const [permohonanRows] = await db.execute(query, [userData.nik]);
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
