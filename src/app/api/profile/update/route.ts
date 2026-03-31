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

export async function PUT(request: NextRequest) {
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

    // Get request body
    const { nama, email, alamat, telepon } = await request.json();

    // Validate required fields
    if (!nama || !email) {
      return NextResponse.json(
        { error: 'Nama dan email harus diisi' },
        { status: 400 }
      );
    }

    // Update user profile
    const query = `
      UPDATE users 
      SET nama = ?, email = ?, alamat = ?, telepon = ?
      WHERE id = ?
    `;

    await db.execute(query, [nama, email, alamat || null, telepon || null, decoded.userId]);

    // Fetch updated user data
    const userQuery = `
      SELECT id, username, email, nama, role, status, nik, alamat, telepon
      FROM users
      WHERE id = ?
    `;

    const [userRows] = await db.execute(userQuery, [decoded.userId]);
    const userData = (userRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: userData,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui profil' },
      { status: 500 }
    );
  }
}
