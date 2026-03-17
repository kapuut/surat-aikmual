import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getUser(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const [rows]: any = await db.execute(
      `SELECT * FROM permohonan_surat WHERE nik = ? ORDER BY created_at DESC`,
      [user.nik]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat permohonan' },
      { status: 500 }
    );
  }
}
