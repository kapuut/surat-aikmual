import { db } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getSuratBySlug, normalizeSuratSlug } from '@/lib/surat-data';
import { getUser } from '@/lib/auth';

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

function normalizeDateValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
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

    if (suratSlug === 'surat-domisili' && uploadedFiles.length < 2) {
      return NextResponse.json(
        { error: 'Upload KTP dan Kartu Keluarga (KK) wajib untuk Surat Domisili' },
        { status: 400 }
      );
    }

    const surat = getSuratBySlug(suratSlug);
    const namaPemohon = getFirstStringValue(payload, ['nama_pemohon', 'nama_lengkap', 'nama', 'nama_anak']);
    const nik = getFirstStringValue(payload, ['nik']);
    const alamat = getFirstStringValue(payload, ['alamat', 'alamatSekarang', 'alamat_saat_ini']);
    const keperluan = getFirstStringValue(payload, ['keperluan']);
    const tempatLahir = getFirstStringValue(payload, ['tempatLahir', 'tempat_lahir']);
    const tanggalLahirRaw = getFirstStringValue(payload, ['tanggalLahir', 'tanggal_lahir']);
    const jenisKelamin = getFirstStringValue(payload, ['jenisKelamin', 'jenis_kelamin']);
    const agama = getFirstStringValue(payload, ['agama']);
    const pekerjaan = getFirstStringValue(payload, ['pekerjaan']);
    const statusPerkawinan = getFirstStringValue(payload, ['statusPerkawinan', 'status_perkawinan']);
    const kewarganegaraan = getFirstStringValue(payload, ['kewarganegaraan']) || 'Indonesia';
    const masaBerlakuDariRaw = getFirstStringValue(payload, ['masaBerlakuDari', 'masa_berlaku_dari']);
    const masaBerlakuSampaiRaw = getFirstStringValue(payload, ['masaBerlakuSampai', 'masa_berlaku_sampai']);

    const tanggalLahir = normalizeDateValue(tanggalLahirRaw);
    const masaBerlakuDari = normalizeDateValue(masaBerlakuDariRaw);
    const masaBerlakuSampai = normalizeDateValue(masaBerlakuSampaiRaw);

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

    // Save to database (kompatibel untuk skema lama/baru)
    let result: any;
    try {
      const [insertResult]: any = await db.execute(
        `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pekerjaan, status_perkawinan, kewarganegaraan, masa_berlaku_dari, masa_berlaku_sampai, dokumen_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          surat.title,
          namaPemohon,
          nik,
          alamat,
          keperluan,
          tempatLahir || null,
          tanggalLahir,
          jenisKelamin || null,
          agama || null,
          pekerjaan || null,
          statusPerkawinan || null,
          kewarganegaraan,
          masaBerlakuDari,
          masaBerlakuSampai,
          JSON.stringify(uploadedFiles),
          'pending',
        ]
      );
      result = insertResult;
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
        throw error;
      }

      try {
        const [insertResult]: any = await db.execute(
          `INSERT INTO permohonan_surat 
           (jenis_surat, nama_pemohon, nik, alamat, keperluan, dokumen_path, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [surat.title, namaPemohon, nik, alamat, keperluan, JSON.stringify(uploadedFiles), 'pending']
        );
        result = insertResult;
      } catch (fallbackError: any) {
        if (!String(fallbackError?.message || '').toLowerCase().includes('unknown column')) {
          throw fallbackError;
        }

        const [insertResult]: any = await db.execute(
          `INSERT INTO permohonan_surat 
           (jenis_surat, nama_pemohon, nik, alamat, keperluan, file_path, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [surat.title, namaPemohon, nik, alamat, keperluan, JSON.stringify(uploadedFiles), 'pending']
        );
        result = insertResult;
      }
    }

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
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const rawNik = typeof user.nik === 'string' ? user.nik.trim() : '';
    const baseNik = normalizeNikValue(rawNik);

    if (!rawNik && !baseNik) {
      return NextResponse.json({ error: 'NIK user tidak ditemukan' }, { status: 400 });
    }

    const query = `
      SELECT 
        id, 
        nik, 
        jenis_surat, 
        nomor_surat, 
        status, 
        created_at AS tanggal_permohonan,
        CASE WHEN status IN ('selesai', 'ditandatangani') THEN updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN status IN ('ditolak', 'perlu_revisi') THEN catatan ELSE NULL END AS alasan_penolakan,
        file_path
      FROM permohonan_surat
      WHERE (nik = ? OR nik = ? OR SUBSTRING_INDEX(nik, '_', 1) = ?)
      ORDER BY created_at DESC
    `;

    const [permohonanRows] = await db.execute(query, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
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
