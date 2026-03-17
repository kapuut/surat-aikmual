import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [rows]: any = await db.execute(
      `SELECT p.*, u.nama as processed_by_name 
       FROM permohonan_surat p 
       LEFT JOIN users u ON p.processed_by = u.id 
       WHERE p.id = ?`,
      [params.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Permohonan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data permohonan' },
      { status: 500 }
    );
  }
}
