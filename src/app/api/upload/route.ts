import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Konfigurasi upload
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'surat');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipe file tidak diizinkan. Hanya PDF, DOC, DOCX, JPG, JPEG, PNG yang diperbolehkan.' 
        },
        { status: 400 }
      );
    }

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 10MB.' },
        { status: 400 }
      );
    }

    // Pastikan direktori upload ada
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Konversi file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Simpan file
    const filePath = join(UPLOAD_DIR, fileName);
    await writeFile(filePath, buffer);

    // Return URL file yang dapat diakses
    const fileUrl = `/uploads/surat/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload',
      data: {
        fileName,
        filePath: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Gagal mengupload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nama file tidak ditemukan' },
        { status: 400 }
      );
    }

    const filePath = join(UPLOAD_DIR, fileName);

    // Hapus file jika ada
    if (existsSync(filePath)) {
      const fs = require('fs').promises;
      await fs.unlink(filePath);
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus file' },
      { status: 500 }
    );
  }
}

// Info untuk upload
export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    uploadPath: '/uploads/surat/'
  });
}