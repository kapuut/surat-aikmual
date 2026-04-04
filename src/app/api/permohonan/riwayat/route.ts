import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { cookies } from 'next/headers';

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value || cookieStore.get('token')?.value;
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

    const rawNik = typeof user.nik === 'string' ? user.nik.trim() : '';
    const baseNik = normalizeNikValue(rawNik);

    if (!rawNik && !baseNik) {
      return NextResponse.json(
        { error: 'NIK user tidak ditemukan' },
        { status: 400 }
      );
    }

    const [rows]: any = await db.execute(
      `SELECT *
       FROM permohonan_surat
       WHERE (nik = ? OR nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
       ORDER BY created_at DESC`,
      [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat permohonan' },
      { status: 500 }
    );
  }
}
