import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDashboardRoute } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    console.log('Simple Login API - Attempt:', { username });

    // Verifikasi kredensial
    if (username === 'admin' && password === 'adminsurat000') {
      const token = jwt.sign(
        {
          userId: 1,
          role: 'admin',
          username: 'admin',
          email: 'admin@aikmual.com',
          nama: 'Administrator',
          nik: '',
          alamat: '',
          telepon: ''
        },
        process.env.JWT_SECRET || 'si-surat-secret-key-2024',
        { expiresIn: '1d' }
      );

      console.log('Simple Login API - Login successful, token created');

      // Set cookie dengan konfigurasi yang lebih kompatibel
      const user = {
        id: 1,
        nama: 'Administrator',
        email: 'admin@aikmual.com',
        role: 'admin' as UserRole,
      };

      const response = NextResponse.json({
        success: true,
        message: 'Login berhasil',
        token: token, // Kirim token di response juga
        user: user,
        redirectUrl: getDashboardRoute(user.role)
      });

      // Set cookie dengan beberapa variasi untuk kompatibilitas
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/'
      });

      response.cookies.set('user-session', 'active', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/'
      });

      return response;
    }

    console.log('Simple Login API - Invalid credentials');
    return NextResponse.json(
      { error: 'Username atau password salah' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Simple Login API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}