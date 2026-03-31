/**
 * API Route: Generate Surat PDF
 * Method: POST
 * Body: { suratData: SuratData }
 * Response: Buffer PDF atau HTML download link
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateSuratFilename } from '@/lib/surat-generator/pdf-generator';
import { SuratData } from '@/lib/surat-generator/types';

export async function POST(request: NextRequest) {
  try {
    const { suratData } = await request.json() as { suratData: SuratData };

    if (!suratData) {
      return NextResponse.json(
        { error: 'Data surat tidak ditemukan' },
        { status: 400 }
      );
    }

    // Generate HTML template
    const htmlContent = generateSuratTemplate(suratData);
    
    // Opsi 1: Return HTML untuk download atau preview
    // Ini bisa di-print langsung dari browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${generateSuratFilename(suratData)}.html"`,
      },
    });

    // Opsi 2: Untuk PDF di server-side, gunakan puppeteer (uncomment jika sudah setup)
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(htmlContent);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // 
    // return new NextResponse(pdf, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="${generateSuratFilename(suratData)}"`,
    //   },
    // });

  } catch (error) {
    console.error('Error generating surat:', error);
    return NextResponse.json(
      { error: 'Gagal membuat surat: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST dengan data surat untuk generate PDF',
    example: {
      jenisSurat: 'surat-domisili',
      tanggalSurat: new Date().toISOString(),
      nama: 'Contoh Nama',
      nik: '1234567890123456',
      alamat: 'Jl. Contoh No. 123',
      kepalaDesa: {
        nama: 'Kepala Desa',
        nip: '12345678',
      },
    },
  });
}
