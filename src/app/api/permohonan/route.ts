import { db } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { getSuratBySlug, normalizeSuratSlug } from '@/lib/surat-data';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

const nikRegex = /^\d{16}$/;

type WorkflowStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await mkdir(uploadDir, { recursive: true });

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

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((item) => typeof item === 'string' && item.trim());
        candidate = typeof first === 'string' ? first.trim() : null;
      } else if (typeof parsed === 'string' && parsed.trim()) {
        candidate = parsed.trim();
      }
    } catch {
      // Keep original value when parsing fails.
    }
  }

  if (!candidate || candidate === '[]') return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith('/') ? candidate : `/${candidate}`;
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes('/generated-surat/') || pathValue.toLowerCase().endsWith('.html');
}

function normalizeWorkflowStatus(rawStatus: unknown, nomorSurat: unknown): WorkflowStatus {
  const normalized = String(rawStatus || '').trim().toLowerCase();
  const knownStatuses: WorkflowStatus[] = [
    'pending',
    'diproses',
    'dikirim_ke_kepala_desa',
    'perlu_revisi',
    'ditandatangani',
    'selesai',
    'ditolak',
  ];

  if ((knownStatuses as string[]).includes(normalized)) {
    return normalized as WorkflowStatus;
  }

  // Data lama kadang menyimpan status kosong walau nomor surat sudah ada.
  if (typeof nomorSurat === 'string' && nomorSurat.trim()) {
    return 'selesai';
  }

  return 'pending';
}

function collectAdditionalDetailFields(payload: Record<string, unknown>): Record<string, string> {
  const knownKeys = new Set([
    'jenis_surat',
    'jenisSurat',
    'jenis',
    'nama_pemohon',
    'nama_lengkap',
    'nama',
    'nama_anak',
    'nik',
    'alamat',
    'alamatSekarang',
    'alamat_saat_ini',
    'keperluan',
    'tempatLahir',
    'tempat_lahir',
    'tanggalLahir',
    'tanggal_lahir',
    'jenisKelamin',
    'jenis_kelamin',
    'agama',
    'pekerjaan',
    'statusPerkawinan',
    'status_perkawinan',
    'kewarganegaraan',
    'masaBerlakuDari',
    'masa_berlaku_dari',
    'masaBerlakuSampai',
    'masa_berlaku_sampai',
    'dokumen',
  ]);

  const additionalDetail: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (knownKeys.has(key)) continue;
    if (typeof value !== 'string') continue;

    const cleaned = value.trim();
    if (!cleaned) continue;
    additionalDetail[key] = cleaned;
  }

  return additionalDetail;
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
    const tempatLahir = getFirstStringValue(payload, [
      'tempatLahir',
      'tempat_lahir',
      'tempatLahirPemohon',
      'tempat_lahir_pemohon',
    ]);
    const tanggalLahirRaw = getFirstStringValue(payload, [
      'tanggalLahir',
      'tanggal_lahir',
      'tanggalLahirPemohon',
      'tanggal_lahir_pemohon',
    ]);
    const jenisKelamin = getFirstStringValue(payload, [
      'jenisKelamin',
      'jenis_kelamin',
      'jenisKelaminPemohon',
      'jenis_kelamin_pemohon',
    ]);
    const agama = getFirstStringValue(payload, ['agama']);
    const pekerjaan = getFirstStringValue(payload, [
      'pekerjaan',
      'pekerjaanPemohon',
      'pekerjaan_pemohon',
    ]);
    const statusPerkawinan = getFirstStringValue(payload, [
      'statusPerkawinan',
      'status_perkawinan',
      'statusPerkawinanPemohon',
      'status_perkawinan_pemohon',
      'status',
    ]);
    const kewarganegaraan = getFirstStringValue(payload, ['kewarganegaraan']) || 'Indonesia';
    const masaBerlakuDariRaw = getFirstStringValue(payload, ['masaBerlakuDari', 'masa_berlaku_dari']);
    const masaBerlakuSampaiRaw = getFirstStringValue(payload, ['masaBerlakuSampai', 'masa_berlaku_sampai']);

    const tanggalLahir = normalizeDateValue(tanggalLahirRaw);
    const masaBerlakuDari = normalizeDateValue(masaBerlakuDariRaw);
    const masaBerlakuSampai = normalizeDateValue(masaBerlakuSampaiRaw);

    const detailData: Record<string, unknown> = {
      tempat_lahir: tempatLahir || undefined,
      tanggal_lahir: tanggalLahir || undefined,
      jenis_kelamin: jenisKelamin || undefined,
      agama: agama || undefined,
      pekerjaan: pekerjaan || undefined,
      status_perkawinan: statusPerkawinan || undefined,
      kewarganegaraan: kewarganegaraan || undefined,
      masa_berlaku_dari: masaBerlakuDari || undefined,
      masa_berlaku_sampai: masaBerlakuSampai || undefined,
      ...collectAdditionalDetailFields(payload),
    };

    const detailDataJson = JSON.stringify(detailData);

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

    if (suratSlug === 'surat-domisili') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!agama) missingFields.push('Agama');
      if (!pekerjaan) missingFields.push('Pekerjaan');
      if (!statusPerkawinan) missingFields.push('Status perkawinan');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data domisili belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Save to database (kompatibel untuk skema lama/baru)
    const filePayload = JSON.stringify(uploadedFiles);
    const insertVariants: Array<{ query: string; values: unknown[] }> = [
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pekerjaan, status_perkawinan, kewarganegaraan, masa_berlaku_dari, masa_berlaku_sampai, dokumen_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
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
          filePayload,
          'pending',
        ],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, data_detail, dokumen_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [surat.title, namaPemohon, nik, alamat, keperluan, detailDataJson, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, data_detail, file_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [surat.title, namaPemohon, nik, alamat, keperluan, detailDataJson, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, dokumen_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [surat.title, namaPemohon, nik, alamat, keperluan, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, file_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [surat.title, namaPemohon, nik, alamat, keperluan, filePayload, 'pending'],
      },
    ];

    let result: any = null;
    let lastUnknownColumnError: unknown;
    for (const variant of insertVariants) {
      try {
        const [insertResult]: any = await db.execute(variant.query, variant.values);
        result = insertResult;
        break;
      } catch (error: any) {
        if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
          throw error;
        }
        lastUnknownColumnError = error;
      }
    }

    if (!result) {
      throw lastUnknownColumnError || new Error('Gagal menyimpan permohonan ke database');
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

    const baseQuery = `
      SELECT
        p.id,
        p.nik,
        p.jenis_surat,
        p.nomor_surat,
        p.status,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.file_path,
        sk.archived_file_path
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat
      ) sk ON sk.nomor_surat = p.nomor_surat
      WHERE (p.nik = ? OR p.nik = ? OR SUBSTRING_INDEX(p.nik, '_', 1) = ?)
      ORDER BY p.created_at DESC
    `;

    const fallbackQuery = `
      SELECT
        p.id,
        p.nik,
        p.jenis_surat,
        p.nomor_surat,
        p.status,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.dokumen_path AS file_path,
        sk.archived_file_path
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat
      ) sk ON sk.nomor_surat = p.nomor_surat
      WHERE (p.nik = ? OR p.nik = ? OR SUBSTRING_INDEX(p.nik, '_', 1) = ?)
      ORDER BY p.created_at DESC
    `;

    let permohonanRows: any[] = [];
    try {
      const [rows] = await db.execute(baseQuery, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
      permohonanRows = (rows as any[]) || [];
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unknown column')) {
        throw error;
      }
      const [rows] = await db.execute(fallbackQuery, [rawNik || baseNik, baseNik || rawNik, baseNik || rawNik]);
      permohonanRows = (rows as any[]) || [];
    }

    const permohonanData = permohonanRows.map((row) => {
      const archivedFilePath = normalizeFilePath(row.archived_file_path);
      const rawFilePath = normalizeFilePath(row.file_path);
      const normalizedStatus = normalizeWorkflowStatus(row.status, row.nomor_surat);

      const finalFilePath =
        (isGeneratedSuratFile(archivedFilePath) ? archivedFilePath : null) ||
        (isGeneratedSuratFile(rawFilePath) ? rawFilePath : null) ||
        null;

      return {
        ...row,
        status: normalizedStatus,
        file_path: finalFilePath,
        tanggal_selesai:
          ['selesai', 'ditandatangani'].includes(normalizedStatus)
            ? row.tanggal_selesai || row.tanggal_permohonan
            : null,
      };
    });

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
