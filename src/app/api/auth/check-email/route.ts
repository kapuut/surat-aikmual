import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { exists: false, error: 'Format email tidak sesuai' },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      'SELECT 1 FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );

    const exists = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { exists: false, error: 'Terjadi kesalahan server saat memeriksa email' },
      { status: 500 }
    );
  }
}
