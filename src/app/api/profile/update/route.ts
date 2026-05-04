import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'si-surat-secret-key-2024';

interface AppJwtPayload extends JwtPayload {
  userId?: number;
  id?: number;
  username?: string;
  role?: string;
}

export async function PUT(request: NextRequest) {
  try {
    // Keep backward compatibility but prioritize the active auth cookie.
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: AppJwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as AppJwtPayload;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = Number(decoded.userId ?? decoded.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
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

    await db.execute(query, [nama, email, alamat || null, telepon || null, userId]);

    // Fetch updated user data
    const userQuery = `
      SELECT id, username, email, nama, role, status, nik, alamat, telepon
      FROM users
      WHERE id = ?
    `;

    const [userRows] = await db.execute(userQuery, [userId]);
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
