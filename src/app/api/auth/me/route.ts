import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      );
    }

    // Verify token
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
    );

    const user = {
      id: verified.payload.userId as string,
      username: verified.payload.username as string,
      email: verified.payload.email as string,
      nama: verified.payload.nama as string,
      role: verified.payload.role as string,
      nik: verified.payload.nik as string,
      alamat: verified.payload.alamat as string,
      telepon: verified.payload.telepon as string,
    };

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
