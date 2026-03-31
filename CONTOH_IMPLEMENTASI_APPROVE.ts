/**
 * CONTOH IMPLEMENTASI: Generate Surat saat Permohonan Diapprove
 * 
 * Letakkan file ini di: src/app/api/permohonan/[id]/approve/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateNomorSurat } from '@/lib/surat-generator/nomor-surat';
import { SuratData, JenisSurat } from '@/lib/surat-generator/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 1. Get permohonan dari database
    const [permohonan] = await db.query(
      'SELECT * FROM permohonan WHERE id = ?',
      [id]
    );

    if (!Array.isArray(permohonan) || permohonan.length === 0) {
      return NextResponse.json(
        { error: 'Permohonan tidak ditemukan' },
        { status: 404 }
      );
    }

    const data = permohonan[0] as any;

    // 2. Get data pemohon
    const [user] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [data.user_id]
    );

    if (!Array.isArray(user) || user.length === 0) {
      return NextResponse.json(
        { error: 'Data pemohon tidak ditemukan' },
        { status: 404 }
      );
    }

    const userData = user[0] as any;

    // 3. Get kepala desa (misalnya dari config atau database)
    const kepalaDesa = {
      nama: 'Kepala Desa AKMUAL',
      nip: '12345678',
    };

    // 4. Generate nomor surat otomatis
    // Misalnya dari counter di database atau urutan per-bulan
    const nomorUrut = await getNextNomorSurat(data.jenis_surat);
    const nomorSurat = generateNomorSurat(nomorUrut);

    // 5. Buat SuratData object
    const suratData: SuratData = {
      jenisSurat: data.jenis_surat as JenisSurat,
      nomorSurat,
      tanggalSurat: new Date(),
      
      nama: userData.nama,
      nik: userData.nik,
      tempatLahir: data.tempat_lahir,
      tanggalLahir: data.tanggal_lahir ? new Date(data.tanggal_lahir) : undefined,
      jeniKelamin: data.jenis_kelamin as 'Laki-laki' | 'Perempuan',
      agama: data.agama,
      pekerjaan: data.pekerjaan,
      statusPerkawinan: data.status_perkawinan,
      alamat: userData.alamat || data.alamat,
      
      tanggalBerlaku: {
        dari: new Date(),
        sampai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
      
      kepalaDesa,
    };

    // 6. Generate HTML surat
    const suratHTML = generateSuratTemplate(suratData);

    // 7. Simpan surat ke database atau storage
    // Option A: Simpan HTML ke tabel permohonan
    await db.query(
      'UPDATE permohonan SET surat_html = ?, nomor_surat = ?, status = ? WHERE id = ?',
      [suratHTML, nomorSurat, 'approved', id]
    );

    // Option B: Simpan PDF ke storage
    // ... (implementasi menyimpan file ke folder atau S3)

    // 8. Kirim email dengan link download
    // await sendEmailWithSurat(userData.email, nomorSurat);

    return NextResponse.json({
      success: true,
      message: 'Permohonan diapprove dan surat berhasil dibuat',
      data: {
        id,
        nomorSurat,
        status: 'approved',
      },
    });

  } catch (error) {
    console.error('Error approving permohonan:', error);
    return NextResponse.json(
      { error: 'Gagal approve permohonan' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get nomor urut berikutnya untuk surat
 * Bisa dari counter database atau sequence per-bulan
 */
async function getNextNomorSurat(jenisSurat: string): Promise<number> {
  // Option 1: Dari counter global
  const counter = await db.query(
    'SELECT MAX(CAST(SUBSTRING(nomor_surat, 1, 3) AS UNSIGNED)) as max_nomor FROM permohonan WHERE jenis_surat = ? AND MONTH(created_at) = MONTH(NOW())',
    [jenisSurat]
  );

  const maxNomor = counter[0]?.max_nomor || 0;
  return maxNomor + 1;

  // Option 2: Dari table terpisah counter
  // const result = await db.query(
  //   'UPDATE nomor_surat_counter SET nomor = nomor + 1 WHERE jenis_surat = ? AND MONTH = ?',
  //   [jenisSurat, new Date().getMonth()]
  // );
  // ...
}

/**
 * Helper: Download surat sebagai PDF atau HTML
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const permohonan = await db.query(
      'SELECT surat_html FROM permohonan WHERE id = ?',
      [id]
    );

    if (!permohonan || !permohonan[0]?.surat_html) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      );
    }

    const html = permohonan[0].surat_html;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="surat-${id}.html"`,
      },
    });

  } catch (error) {
    console.error('Error getting surat:', error);
    return NextResponse.json(
      { error: 'Gagal ambil surat' },
      { status: 500 }
    );
  }
}
