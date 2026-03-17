import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Logout API - Clearing session');
    
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    });

    // Clear cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('user-session', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
}