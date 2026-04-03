import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const baseQueryWithFilePath = `
      SELECT
        id,
        nama_pemohon,
        nik,
        alamat,
        jenis_surat,
        keperluan,
        status,
        catatan,
        nomor_surat,
        file_path,
        created_at,
        updated_at,
        processed_by
      FROM permohonan_surat
      ORDER BY created_at DESC
    `;

    const fallbackQueryWithDokumenPath = `
      SELECT
        id,
        nama_pemohon,
        nik,
        alamat,
        jenis_surat,
        keperluan,
        status,
        catatan,
        nomor_surat,
        dokumen_path AS file_path,
        created_at,
        updated_at,
        processed_by
      FROM permohonan_surat
      ORDER BY created_at DESC
    `;

    let rows: RowDataPacket[];
    try {
      const [result] = await db.query<RowDataPacket[]>(baseQueryWithFilePath);
      rows = result;
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
        throw error;
      }
      const [result] = await db.query<RowDataPacket[]>(fallbackQueryWithDokumenPath);
      rows = result;
    }

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error('Error fetching admin permohonan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data permohonan' },
      { status: 500 }
    );
  }
}
