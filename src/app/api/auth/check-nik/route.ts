import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nik = String(searchParams.get('nik') || '').trim();

    if (!isValidNik(nik)) {
      return NextResponse.json(
        { exists: false, error: 'NIK wajib 16 digit angka' },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      'SELECT 1 FROM users WHERE SUBSTRING_INDEX(nik, "_", 1) = ? LIMIT 1',
      [nik]
    );

    const exists = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Check NIK error:', error);
    return NextResponse.json(
      { exists: false, error: 'Terjadi kesalahan server saat memeriksa NIK' },
      { status: 500 }
    );
  }
}
