import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get('search') || '';
    
    const [rows]: any = await db.execute(
      `SELECT * FROM surat_masuk 
       WHERE nomor_surat LIKE ? OR perihal LIKE ? OR asal_surat LIKE ?
       ORDER BY tanggal_terima DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data surat masuk' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const [result]: any = await db.execute(
      `INSERT INTO surat_masuk 
       (nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.nomor_surat, data.tanggal_surat, data.tanggal_terima, 
       data.asal_surat, data.perihal, data.created_by]
    );

    return NextResponse.json({ 
      message: 'Surat masuk berhasil ditambahkan',
      id: result.insertId 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal menambahkan surat masuk' },
      { status: 500 }
    );
  }
}
