import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

    console.log('Verify API - Token verified successfully:', decoded);

    // Return complete user data structure that matches AuthUser interface
    const user = {
      id: decoded.userId,
      username: decoded.username || 'admin',
      email: decoded.email || 'admin@aikmual.com',
      nama: decoded.nama || 'Administrator',
      role: decoded.role,
      nik: decoded.nik || '',
      alamat: decoded.alamat || '',
      telepon: decoded.telepon || '',
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