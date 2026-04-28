import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uniqueStoragePath } from '@/lib/storage';

// Konfigurasi upload
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

    // Generate nama file unik dan simpan ke storage
    const storagePath = uniqueStoragePath('uploads/surat', file.name || 'upload');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUrl = await uploadFile(storagePath, buffer, file.type || undefined);
    const fileName = storagePath.split('/').pop() || storagePath;

    // Return URL file yang dapat diakses

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

    const filePath = fileName; // kept for reference only — deletion not supported on Vercel Blob here

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