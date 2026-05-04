import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const authToken = cookies().get('auth-token');
    
    console.log('Verify API - Checking auth token:', {
      hasToken: !!authToken,
      tokenValue: authToken?.value ? 'exists' : 'missing'
    });
    
    if (!authToken) {
      console.log('Verify API - No auth token found');
      return NextResponse.json(
        { error: 'No auth token found' },
        { status: 401 }
      );
    }

    // Verifikasi JWT token
    const decoded = jwt.verify(
      authToken.value, 
      process.env.JWT_SECRET || 'si-surat-secret-key-2024'
    ) as any;

    const userId = decoded.userId;

    // Fetch fresh user data from database to ensure dynamic name updates
    const [rows]: any = await db.execute(
      'SELECT id, username, email, nama, role, nik, alamat, telepon FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const dbUser = rows && rows.length > 0 ? rows[0] : null;

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Return complete user data structure that matches AuthUser interface
    const user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      nama: dbUser.nama,
      role: dbUser.role,
      nik: dbUser.nik || '',
      alamat: dbUser.alamat || '',
      telepon: dbUser.telepon || '',
    };

    return NextResponse.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}