import { db } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getSuratBySlug, normalizeSuratSlug } from '@/lib/surat-data';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export const runtime = 'nodejs';

const nikRegex = /^\d{16}$/;

async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  return Promise.all(
    files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name}`;
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      return `/uploads/${filename}`;
    })
  );
}

function getFirstStringValue(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

async function handlePermohonanPost(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};
    let uploadedFiles: string[] = [];

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
      const fileList = formData
        .getAll('dokumen')
        .filter((item): item is File => item instanceof File && item.size > 0);
      uploadedFiles = await saveUploadedFiles(fileList);
    }

    const rawJenisSurat = getFirstStringValue(payload, ['jenis_surat', 'jenisSurat', 'jenis']);
    const suratSlug = normalizeSuratSlug(rawJenisSurat);
    if (!suratSlug) {
      return NextResponse.json(
        { error: 'Jenis surat tidak tersedia' },
        { status: 400 }
      );
    }

    const surat = getSuratBySlug(suratSlug);
    const namaPemohon = getFirstStringValue(payload, ['nama_pemohon', 'nama_lengkap', 'nama', 'nama_anak']);
    const nik = getFirstStringValue(payload, ['nik']);
    const alamat = getFirstStringValue(payload, ['alamat', 'alamatSekarang', 'alamat_saat_ini']);
    const keperluan = getFirstStringValue(payload, ['keperluan']);

    if (!namaPemohon || !nik || !alamat || !keperluan) {
      return NextResponse.json(
        { error: 'Data permohonan belum lengkap' },
        { status: 400 }
      );
    }

    if (!nikRegex.test(nik)) {
      return NextResponse.json(
        { error: 'NIK harus 16 digit angka' },
        { status: 400 }
      );
    }

    // Save to database
    const [result]: any = await db.execute(
      `INSERT INTO permohonan_surat 
       (jenis_surat, nama_pemohon, nik, alamat, keperluan, dokumen_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [surat.title, namaPemohon, nik, alamat, keperluan, JSON.stringify(uploadedFiles), 'pending']
    );

    return NextResponse.json({ 
      message: 'Permohonan berhasil dikirim',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim permohonan' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handlePermohonanPost(request);
}

export async function GET(request: NextRequest) {
  try {
    // Get and verify JWT token
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      decoded = verified.payload as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's NIK to fetch permohonan
    const userQuery = 'SELECT nik FROM users WHERE id = ?';
    const [userRows] = await db.execute(userQuery, [decoded.userId]);
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Fetch permohonan for this user
    const query = `
      SELECT 
        id, 
        nik, 
        jenis_surat, 
        nomor_surat, 
        status, 
        tanggal_permohonan,
        tanggal_selesai,
        alasan_penolakan
      FROM permohonan
      WHERE nik = ?
      ORDER BY tanggal_permohonan DESC
    `;

    const [permohonanRows] = await db.execute(query, [userData.nik]);
    const permohonanData = (permohonanRows as any[]) || [];

    return NextResponse.json({
      success: true,
      data: permohonanData,
      total: permohonanData.length,
    });
  } catch (error) {
    console.error('Error fetching permohonan:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data permohonan' },
      { status: 500 }
    );
  }
}
