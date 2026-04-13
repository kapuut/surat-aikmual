import { db } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
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

type DynamicTemplateLookupRow = {
  id: string;
  jenis_surat: string;
  status: string;
};

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

function normalizeSpacing(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return '';

  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ''))
    .join(' ');
}

function getGenderValue(value: string): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return '';

  const lowered = cleaned.toLowerCase();
  if (lowered.includes('laki')) return 'Laki-laki';
  if (lowered.includes('perempuan') || lowered.includes('wanita')) return 'Perempuan';
  return toTitleCase(cleaned);
}

function normalizeAreaValue(value: string, prefix: 'dusun' | 'desa' | 'kecamatan' | 'kabupaten' | 'provinsi'): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return '';

  const patterns: Record<'dusun' | 'desa' | 'kecamatan' | 'kabupaten' | 'provinsi', RegExp> = {
    dusun: /^dusun\s+/i,
    desa: /^desa\s+/i,
    kecamatan: /^(kecamatan|kec\.?)+\s+/i,
    kabupaten: /^(kabupaten|kab\.?)+\s+/i,
    provinsi: /^(provinsi|prov\.?)+\s+/i,
  };

  return toTitleCase(cleaned.replace(patterns[prefix], ''));
}

function buildStructuredAddress(parts: {
  dusun?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
}): string {
  const dusun = normalizeAreaValue(parts.dusun || '', 'dusun');
  const desa = normalizeAreaValue(parts.desa || '', 'desa');
  const kecamatan = normalizeAreaValue(parts.kecamatan || '', 'kecamatan');
  const kabupaten = normalizeAreaValue(parts.kabupaten || '', 'kabupaten');
  const provinsi = normalizeAreaValue(parts.provinsi || '', 'provinsi');

  if (!dusun || !desa || !kecamatan || !kabupaten) {
    return '';
  }

  const baseAddress = `Dusun ${dusun}, Desa ${desa}\nKec. ${kecamatan}, Kab. ${kabupaten}`;
  return provinsi ? `${baseAddress}\nProvinsi ${provinsi}` : baseAddress;
}

function normalizeDateValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateYmd(parsed);
}

function formatDateYmd(value: Date): string {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addMonths(value: Date, months: number): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  result.setMonth(result.getMonth() + months);
  return result;
}

function isValidWhatsAppNumber(value: string): boolean {
  const normalized = value.replace(/[^0-9+]/g, '').trim();
  return /^(\+62|62|0|8)\d{8,13}$/.test(normalized);
}

function normalizeNikValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.split('_')[0].trim();
}

function hasUploadedFileValue(value: unknown): boolean {
  return value instanceof File && value.size > 0;
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

function inferStatusFromNote(note: unknown): WorkflowStatus | null {
  const text = String(note || '').trim().toLowerCase();
  if (!text) return null;

  if (text.includes('ditolak') || text.includes('tolak')) return 'ditolak';
  if (text.includes('revisi')) return 'perlu_revisi';
  if (text.includes('kepala desa') && (text.includes('dikirim') || text.includes('tanda tangan'))) {
    return 'dikirim_ke_kepala_desa';
  }
  if (text.includes('ditandatangani')) return 'ditandatangani';
  if (text.includes('selesai') || text.includes('final')) return 'selesai';

  return null;
}

function normalizeWorkflowStatus(rawStatus: unknown, nomorSurat: unknown, note?: unknown): WorkflowStatus {
  const normalized = String(rawStatus || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
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

  const inferredFromNote = inferStatusFromNote(note);
  if (inferredFromNote) return inferredFromNote;

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
    'dynamicTemplateId',
    'dynamic_template_id',
    'nama_pemohon',
    'nama_lengkap',
    'nama',
    'nama_anak',
    'nik',
    'alamat',
    'alamatSekarang',
    'alamat_saat_ini',
    'dusun',
    'desa',
    'kecamatan',
    'kabupaten',
    'provinsi',
    'dusun_pemohon',
    'desa_pemohon',
    'kecamatan_pemohon',
    'kabupaten_pemohon',
    'provinsi_pemohon',
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
    'statusJanda',
    'status_janda',
    'alasanStatus',
    'alasan_status',
    'alasanStatusJanda',
    'alasan_status_janda',
    'sebabStatus',
    'sebab_status',
    'namaPasangan',
    'nama_pasangan',
    'tanggalKejadian',
    'tanggal_kejadian',
    'namaMantan',
    'nama_mantan',
    'nikPasangan',
    'nik_pasangan',
    'nikMantan',
    'nik_mantan',
    'tempatLahirPasangan',
    'tempat_lahir_pasangan',
    'tanggalLahirPasangan',
    'tanggal_lahir_pasangan',
    'agamaPasangan',
    'agama_pasangan',
    'pekerjaanPasangan',
    'pekerjaan_pasangan',
    'kewarganegaraanPasangan',
    'kewarganegaraan_pasangan',
    'alamatPasangan',
    'alamat_pasangan',
    'dusunPasangan',
    'desaPasangan',
    'kecamatanPasangan',
    'kabupatenPasangan',
    'provinsiPasangan',
    'dusun_pasangan',
    'desa_pasangan',
    'kecamatan_pasangan',
    'kabupaten_pasangan',
    'provinsi_pasangan',
    'dusunAlmarhum',
    'dusun_almarhum',
    'desaAlmarhum',
    'desa_almarhum',
    'kecamatanAlmarhum',
    'kecamatan_almarhum',
    'kabupatenAlmarhum',
    'kabupaten_almarhum',
    'provinsiAlmarhum',
    'provinsi_almarhum',
    'tanggalCerai',
    'tanggal_cerai',
    'nomorAktaCerai',
    'nomor_akta_cerai',
    'tempatCerai',
    'tempat_cerai',
    'kewarganegaraan',
    'masaBerlakuDari',
    'masa_berlaku_dari',
    'masaBerlakuSampai',
    'masa_berlaku_sampai',
    'penyandangCacat',
    'penyandang_cacat',
    'jenisBarang',
    'jenis_barang',
    'barangHilang',
    'barang_hilang',
    'asalBarang',
    'asal_barang',
    'labelNomorBarang',
    'label_nomor_barang',
    'nomorBarang',
    'nomor_barang',
    'ciriBarang',
    'ciri_barang',
    'keteranganKehilangan',
    'keterangan_kehilangan',
    'uraianKehilangan',
    'uraian_kehilangan',
    'keluhanPemohon',
    'keluhan_pemohon',
    'tanggalKehilangan',
    'tanggal_kehilangan',
    'lokasiKehilangan',
    'lokasi_kehilangan',
    'pendidikan',
    'pendidikanTerakhir',
    'pendidikan_terakhir',
    'namaWali',
    'nama_wali',
    'nikWali',
    'nik_wali',
    'tempatLahirWali',
    'tempat_lahir_wali',
    'tanggalLahirWali',
    'tanggal_lahir_wali',
    'jenisKelaminWali',
    'jenis_kelamin_wali',
    'agamaWali',
    'agama_wali',
    'penghasilanPerBulan',
    'penghasilan_per_bulan',
    'nominalPenghasilan',
    'nominal_penghasilan',
    'sumberPenghasilan',
    'sumber_penghasilan',
    'dasarKeterangan',
    'dasar_keterangan',
    'statusTempatTinggal',
    'status_tempat_tinggal',
    'namaPemilikRumah',
    'nama_pemilik_rumah',
    'hubunganDenganPemilik',
    'hubungan_dengan_pemilik',
    'alamatTinggalSekarang',
    'alamat_tinggal_sekarang',
    'lamaMenempati',
    'lama_menempati',
    'jumlahTanggungan',
    'jumlah_tanggungan',
    'alasanTidakMemiliki',
    'alasan_tidak_memiliki',
    'mulaiUsaha',
    'mulai_usaha',
    'jenisUsaha',
    'jenis_usaha',
    'namaUsaha',
    'nama_usaha',
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

async function findActiveDynamicTemplate(
  dynamicTemplateId: string,
  jenisSurat: string
): Promise<DynamicTemplateLookupRow | null> {
  try {
    const trimmedId = dynamicTemplateId.trim();
    if (trimmedId) {
      const [rows] = await db.execute(
        `SELECT id, jenis_surat, status
         FROM dynamic_template_surat
         WHERE id = ? AND status = 'aktif'
         LIMIT 1`,
        [trimmedId]
      );

      const matched = (rows as DynamicTemplateLookupRow[])[0];
      if (matched) return matched;
    }

    const trimmedJenisSurat = jenisSurat.trim();
    if (!trimmedJenisSurat) return null;

    const [rows] = await db.execute(
      `SELECT id, jenis_surat, status
       FROM dynamic_template_surat
       WHERE LOWER(TRIM(jenis_surat)) = LOWER(TRIM(?))
         AND status = 'aktif'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [trimmedJenisSurat]
    );

    return ((rows as DynamicTemplateLookupRow[])[0] || null);
  } catch (error: unknown) {
    const message = String((error as { message?: unknown })?.message || '').toLowerCase();
    if (message.includes("doesn't exist") || message.includes('does not exist')) {
      return null;
    }
    throw error;
  }
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
      const fileKeys = ['dokumen', 'dokumenKTP', 'dokumenKK', 'dokumenAktaCerai', 'dokumenTambahan'];
      const fileList = fileKeys
        .flatMap((key) => formData.getAll(key))
        .filter((item): item is File => item instanceof File && item.size > 0);
      uploadedFiles = await saveUploadedFiles(fileList);
    }

    const rawJenisSurat = getFirstStringValue(payload, ['jenis_surat', 'jenisSurat', 'jenis']);
    const dynamicTemplateId = getFirstStringValue(payload, ['dynamicTemplateId', 'dynamic_template_id']);
    const suratSlug = normalizeSuratSlug(rawJenisSurat);
    const customTemplate = suratSlug
      ? null
      : await findActiveDynamicTemplate(dynamicTemplateId, rawJenisSurat);

    if (!suratSlug && !customTemplate) {
      return NextResponse.json(
        { error: 'Jenis surat tidak tersedia' },
        { status: 400 }
      );
    }

    if (suratSlug === 'surat-cerai' && !hasUploadedFileValue(payload.dokumenAktaCerai)) {
      return NextResponse.json(
        { error: 'Upload Akta Cerai wajib untuk permohonan surat cerai' },
        { status: 400 }
      );
    }

    const surat = suratSlug ? getSuratBySlug(suratSlug) : null;
    const resolvedJenisSurat = surat?.title || customTemplate?.jenis_surat || rawJenisSurat;
    const namaPemohon = toTitleCase(getFirstStringValue(payload, ['nama_pemohon', 'nama_lengkap', 'nama', 'nama_anak']));
    const nikInput = getFirstStringValue(payload, ['nik']);
    const alamatRaw = getFirstStringValue(payload, ['alamat', 'alamatSekarang', 'alamat_saat_ini', 'alamatTerakhir', 'alamat_terakhir']);
    const keperluan = normalizeSpacing(getFirstStringValue(payload, ['keperluan'])) || '-';
    const teleponInput = getFirstStringValue(payload, [
      'telepon',
      'noTelp',
      'no_telp',
      'nomor_hp',
      'no_hp',
      'nomor_wa',
      'no_wa',
      'whatsapp',
    ]);
    const tempatLahir = toTitleCase(getFirstStringValue(payload, [
      'tempatLahir',
      'tempat_lahir',
      'tempatLahirPemohon',
      'tempat_lahir_pemohon',
      'tempatLahirAlmarhum',
      'tempat_lahir_almarhum',
    ]));
    const tanggalLahirRaw = getFirstStringValue(payload, [
      'tanggalLahir',
      'tanggal_lahir',
      'tanggalLahirPemohon',
      'tanggal_lahir_pemohon',
      'tanggalLahirAlmarhum',
      'tanggal_lahir_almarhum',
    ]);
    const jenisKelamin = getFirstStringValue(payload, [
      'jenisKelamin',
      'jenis_kelamin',
      'jenisKelaminPemohon',
      'jenis_kelamin_pemohon',
      'jenisKelaminAlmarhum',
      'jenis_kelamin_almarhum',
    ]);
    const agama = toTitleCase(getFirstStringValue(payload, ['agama', 'agamaAlmarhum', 'agama_almarhum']));
    const pekerjaan = toTitleCase(getFirstStringValue(payload, [
      'pekerjaan',
      'pekerjaanPemohon',
      'pekerjaan_pemohon',
      'pekerjaanAlmarhum',
      'pekerjaan_almarhum',
    ]));
    const statusPerkawinan = getFirstStringValue(payload, [
      'statusPerkawinan',
      'status_perkawinan',
      'statusPerkawinanPemohon',
      'status_perkawinan_pemohon',
      'status',
    ]);
    const statusJanda = toTitleCase(getFirstStringValue(payload, ['statusJanda', 'status_janda']));
    const alasanStatusJanda = toTitleCase(getFirstStringValue(payload, [
      'alasanStatusJanda',
      'alasan_status_janda',
      'alasanStatus',
      'alasan_status',
      'sebabStatus',
      'sebab_status',
    ]));
    const namaPasanganJanda = toTitleCase(getFirstStringValue(payload, ['namaPasangan', 'nama_pasangan']));
    const tanggalKejadianJandaRaw = getFirstStringValue(payload, ['tanggalKejadian', 'tanggal_kejadian']);
    const kewarganegaraan = toTitleCase(getFirstStringValue(payload, ['kewarganegaraan']) || 'Indonesia');
    const pendidikan = normalizeSpacing(getFirstStringValue(payload, ['pendidikan', 'pendidikanTerakhir', 'pendidikan_terakhir'])).toUpperCase();
    const namaWali = toTitleCase(getFirstStringValue(payload, ['namaWali', 'nama_wali']));
    const nikWali = getFirstStringValue(payload, ['nikWali', 'nik_wali']);
    const tempatLahirWali = toTitleCase(getFirstStringValue(payload, ['tempatLahirWali', 'tempat_lahir_wali']));
    const tanggalLahirWaliRaw = getFirstStringValue(payload, ['tanggalLahirWali', 'tanggal_lahir_wali']);
    const jenisKelaminWali = getGenderValue(getFirstStringValue(payload, ['jenisKelaminWali', 'jenis_kelamin_wali']));
    const agamaWali = toTitleCase(getFirstStringValue(payload, ['agamaWali', 'agama_wali']));
    const sumberPenghasilan = toTitleCase(getFirstStringValue(payload, ['sumberPenghasilan', 'sumber_penghasilan']));
    const penghasilanPerBulan = normalizeSpacing(getFirstStringValue(payload, [
      'penghasilanPerBulan',
      'penghasilan_per_bulan',
      'nominalPenghasilan',
      'nominal_penghasilan',
    ]));
    const dasarKeterangan = normalizeSpacing(getFirstStringValue(payload, ['dasarKeterangan', 'dasar_keterangan']));
    const statusTempatTinggal = toTitleCase(getFirstStringValue(payload, ['statusTempatTinggal', 'status_tempat_tinggal']));
    const namaPemilikRumah = toTitleCase(getFirstStringValue(payload, ['namaPemilikRumah', 'nama_pemilik_rumah']));
    const hubunganDenganPemilik = toTitleCase(getFirstStringValue(payload, ['hubunganDenganPemilik', 'hubungan_dengan_pemilik']));
    const alamatTinggalSekarang = toTitleCase(
      getFirstStringValue(payload, ['alamatTinggalSekarang', 'alamat_tinggal_sekarang'])
    );
    const lamaMenempati = normalizeSpacing(getFirstStringValue(payload, ['lamaMenempati', 'lama_menempati']));
    const jumlahTanggungan = normalizeSpacing(getFirstStringValue(payload, ['jumlahTanggungan', 'jumlah_tanggungan']));
    const alasanTidakMemiliki = normalizeSpacing(
      getFirstStringValue(payload, ['alasanTidakMemiliki', 'alasan_tidak_memiliki'])
    );
    const mulaiUsaha = normalizeSpacing(getFirstStringValue(payload, ['mulaiUsaha', 'mulai_usaha']));
    const jenisUsaha = toTitleCase(
      getFirstStringValue(payload, ['jenisUsaha', 'jenis_usaha', 'namaUsaha', 'nama_usaha'])
    );
    const masaBerlakuDariRaw = getFirstStringValue(payload, ['masaBerlakuDari', 'masa_berlaku_dari']);
    const masaBerlakuSampaiRaw = getFirstStringValue(payload, ['masaBerlakuSampai', 'masa_berlaku_sampai']);
    const penyandangCacat = toTitleCase(getFirstStringValue(payload, ['penyandangCacat', 'penyandang_cacat']));
    const jenisBarang = toTitleCase(getFirstStringValue(payload, ['jenisBarang', 'jenis_barang', 'kategoriBarang', 'kategori_barang']));
    const barangHilang = toTitleCase(getFirstStringValue(payload, ['barangHilang', 'barang_hilang', 'namaBarang', 'nama_barang', 'objekKehilangan', 'objek_kehilangan']));
    const asalBarang = toTitleCase(getFirstStringValue(payload, ['asalBarang', 'asal_barang', 'instansiBarang', 'instansi_barang']));
    const labelNomorBarang = toTitleCase(getFirstStringValue(payload, ['labelNomorBarang', 'label_nomor_barang'])) || 'Nomor';
    const nomorBarang = normalizeSpacing(getFirstStringValue(payload, ['nomorBarang', 'nomor_barang']));
    const ciriBarang = toTitleCase(getFirstStringValue(payload, ['ciriBarang', 'ciri_barang', 'deskripsiBarang', 'deskripsi_barang']));
    const uraianKehilangan = normalizeSpacing(getFirstStringValue(payload, [
      'keteranganKehilangan',
      'keterangan_kehilangan',
      'uraianKehilangan',
      'uraian_kehilangan',
      'keluhanPemohon',
      'keluhan_pemohon',
    ]));
    const tanggalKehilanganRaw = getFirstStringValue(payload, ['tanggalKehilangan', 'tanggal_kehilangan']);
    const lokasiKehilangan = toTitleCase(getFirstStringValue(payload, ['lokasiKehilangan', 'lokasi_kehilangan']));
    const hubunganPelapor = toTitleCase(getFirstStringValue(payload, [
      'hubunganDenganAlmarhum',
      'hubungan_dengan_almarhum',
      'hubunganPelapor',
      'hubungan_pelapor',
    ]));
    const namaAlmarhum = toTitleCase(getFirstStringValue(payload, ['namaAlmarhum', 'nama_almarhum']));
    const nikAlmarhum = getFirstStringValue(payload, ['nikAlmarhum', 'nik_almarhum']);
    const tempatLahirAlmarhum = toTitleCase(getFirstStringValue(payload, ['tempatLahirAlmarhum', 'tempat_lahir_almarhum']));
    const tanggalLahirAlmarhumRaw = getFirstStringValue(payload, [
      'tanggalLahirAlmarhum',
      'tanggal_lahir_almarhum',
    ]);
    const jenisKelaminAlmarhum = getFirstStringValue(payload, [
      'jenisKelaminAlmarhum',
      'jenis_kelamin_almarhum',
      'jenisKelamin',
      'jenis_kelamin',
    ]);
    const agamaAlmarhum = toTitleCase(getFirstStringValue(payload, ['agamaAlmarhum', 'agama_almarhum', 'agama']));
    const pekerjaanAlmarhum = toTitleCase(getFirstStringValue(payload, [
      'pekerjaanAlmarhum',
      'pekerjaan_almarhum',
      'pekerjaan',
    ]));
    const alamatTerakhirRaw = getFirstStringValue(payload, [
      'alamatTerakhir',
      'alamat_terakhir',
      'alamatAlmarhum',
      'alamat_almarhum',
    ]);
    const tanggalMeninggalRaw = getFirstStringValue(payload, ['tanggalMeninggal', 'tanggal_meninggal']);
    const waktuMeninggal = getFirstStringValue(payload, ['waktuMeninggal', 'waktu_meninggal']);
    const tempatMeninggal = toTitleCase(getFirstStringValue(payload, ['tempatMeninggal', 'tempat_meninggal']));
    const sebabKematian = normalizeSpacing(getFirstStringValue(payload, ['sebabKematian', 'sebab_kematian', 'sebabMeninggal']));
    const tanggalPemakamanRaw = getFirstStringValue(payload, ['tanggalPemakaman', 'tanggal_pemakaman']);
    const waktuPemakaman = getFirstStringValue(payload, ['waktuPemakaman', 'waktu_pemakaman']);
    const tempatPemakaman = toTitleCase(getFirstStringValue(payload, ['tempatPemakaman', 'tempat_pemakaman']));
    const namaMantan = toTitleCase(getFirstStringValue(payload, ['namaMantan', 'nama_mantan']));
    const nikPasangan = getFirstStringValue(payload, [
      'nikPasangan',
      'nik_pasangan',
      'nikMantan',
      'nik_mantan',
    ]);
    const tempatLahirPasangan = toTitleCase(getFirstStringValue(payload, [
      'tempatLahirPasangan',
      'tempat_lahir_pasangan',
      'tempatLahirMantan',
      'tempat_lahir_mantan',
    ]));
    const tanggalLahirPasanganRaw = getFirstStringValue(payload, [
      'tanggalLahirPasangan',
      'tanggal_lahir_pasangan',
      'tanggalLahirMantan',
      'tanggal_lahir_mantan',
    ]);
    const kewarganegaraanPasangan = toTitleCase(
      getFirstStringValue(payload, ['kewarganegaraanPasangan', 'kewarganegaraan_pasangan']) || 'Indonesia'
    );
    const agamaPasangan = toTitleCase(getFirstStringValue(payload, ['agamaPasangan', 'agama_pasangan', 'agamaMantan', 'agama_mantan']));
    const pekerjaanPasangan = toTitleCase(getFirstStringValue(payload, [
      'pekerjaanPasangan',
      'pekerjaan_pasangan',
      'pekerjaanMantan',
      'pekerjaan_mantan',
    ]));
    const alamatPasanganRaw = getFirstStringValue(payload, [
      'alamatPasangan',
      'alamat_pasangan',
      'alamatMantan',
      'alamat_mantan',
    ]);
    const tanggalCeraiRaw = getFirstStringValue(payload, ['tanggalCerai', 'tanggal_cerai']);
    const nomorAktaCerai = getFirstStringValue(payload, [
      'nomorAktaCerai',
      'nomor_akta_cerai',
      'noAktaCerai',
      'no_akta_cerai',
    ]);
    const tempatCerai = toTitleCase(getFirstStringValue(payload, ['tempatCerai', 'tempat_cerai', 'pengadilanCerai']));

    const dusunPemohon = normalizeAreaValue(getFirstStringValue(payload, ['dusun', 'dusun_pemohon']), 'dusun');
    const desaPemohon = normalizeAreaValue(getFirstStringValue(payload, ['desa', 'desa_pemohon']), 'desa');
    const kecamatanPemohon = normalizeAreaValue(getFirstStringValue(payload, ['kecamatan', 'kecamatan_pemohon']), 'kecamatan');
    const kabupatenPemohon = normalizeAreaValue(getFirstStringValue(payload, ['kabupaten', 'kabupaten_pemohon']), 'kabupaten');
    const provinsiPemohon = normalizeAreaValue(getFirstStringValue(payload, ['provinsi', 'provinsi_pemohon']), 'provinsi');

    const dusunPasangan = normalizeAreaValue(getFirstStringValue(payload, ['dusunPasangan', 'dusun_pasangan']), 'dusun');
    const desaPasangan = normalizeAreaValue(getFirstStringValue(payload, ['desaPasangan', 'desa_pasangan']), 'desa');
    const kecamatanPasangan = normalizeAreaValue(getFirstStringValue(payload, ['kecamatanPasangan', 'kecamatan_pasangan']), 'kecamatan');
    const kabupatenPasangan = normalizeAreaValue(getFirstStringValue(payload, ['kabupatenPasangan', 'kabupaten_pasangan']), 'kabupaten');
    const provinsiPasangan = normalizeAreaValue(getFirstStringValue(payload, ['provinsiPasangan', 'provinsi_pasangan']), 'provinsi');

    const dusunAlmarhum = normalizeAreaValue(getFirstStringValue(payload, ['dusunAlmarhum', 'dusun_almarhum']), 'dusun');
    const desaAlmarhum = normalizeAreaValue(getFirstStringValue(payload, ['desaAlmarhum', 'desa_almarhum']), 'desa');
    const kecamatanAlmarhum = normalizeAreaValue(getFirstStringValue(payload, ['kecamatanAlmarhum', 'kecamatan_almarhum']), 'kecamatan');
    const kabupatenAlmarhum = normalizeAreaValue(getFirstStringValue(payload, ['kabupatenAlmarhum', 'kabupaten_almarhum']), 'kabupaten');
    const provinsiAlmarhum = normalizeAreaValue(getFirstStringValue(payload, ['provinsiAlmarhum', 'provinsi_almarhum']), 'provinsi');

    const alamat =
      buildStructuredAddress({
        dusun: dusunPemohon,
        desa: desaPemohon,
        kecamatan: kecamatanPemohon,
        kabupaten: kabupatenPemohon,
        provinsi: provinsiPemohon,
      }) || toTitleCase(alamatRaw);
    const alamatTerakhir =
      buildStructuredAddress({
        dusun: dusunAlmarhum,
        desa: desaAlmarhum,
        kecamatan: kecamatanAlmarhum,
        kabupaten: kabupatenAlmarhum,
        provinsi: provinsiAlmarhum,
      }) || toTitleCase(alamatTerakhirRaw);
    const alamatPasangan =
      buildStructuredAddress({
        dusun: dusunPasangan,
        desa: desaPasangan,
        kecamatan: kecamatanPasangan,
        kabupaten: kabupatenPasangan,
        provinsi: provinsiPasangan,
      }) || toTitleCase(alamatPasanganRaw);

    const tanggalLahir = normalizeDateValue(tanggalLahirRaw);
    let masaBerlakuDari = normalizeDateValue(masaBerlakuDariRaw);
    let masaBerlakuSampai = normalizeDateValue(masaBerlakuSampaiRaw);
    const tanggalKehilangan = normalizeDateValue(tanggalKehilanganRaw);
    if (suratSlug === 'surat-kehilangan') {
      const mulai = new Date();
      const mulaiTanggal = new Date(mulai.getFullYear(), mulai.getMonth(), mulai.getDate());
      masaBerlakuDari = formatDateYmd(mulaiTanggal);
      masaBerlakuSampai = formatDateYmd(addMonths(mulaiTanggal, 6));
    }
    const tanggalLahirAlmarhum = normalizeDateValue(tanggalLahirAlmarhumRaw);
    const tanggalMeninggal = normalizeDateValue(tanggalMeninggalRaw);
    const tanggalPemakaman = normalizeDateValue(tanggalPemakamanRaw);
    const tanggalLahirPasangan = normalizeDateValue(tanggalLahirPasanganRaw);
    const tanggalLahirWali = normalizeDateValue(tanggalLahirWaliRaw);
    const tanggalCerai = normalizeDateValue(tanggalCeraiRaw);
    const tanggalKejadianJanda = normalizeDateValue(tanggalKejadianJandaRaw);

    const normalizedStatusPerkawinan =
      statusPerkawinan || (statusJanda ? `${statusJanda}${alasanStatusJanda ? ` (${alasanStatusJanda})` : ''}` : '');

    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value || cookieStore.get('token')?.value;
    const authUser = authToken ? await getUser(authToken) : null;
    const nikUser = typeof authUser?.nik === 'string' ? normalizeNikValue(authUser.nik) : '';
    const teleponUser = typeof authUser?.telepon === 'string' ? authUser.telepon.trim() : '';
    const isMasyarakat = authUser?.role === 'masyarakat';
    const nik = isMasyarakat && nikUser ? nikUser : nikInput;
    const effectiveTelepon = teleponInput || teleponUser;

    const detailData: Record<string, unknown> = {
      dynamic_template_id: customTemplate?.id || dynamicTemplateId || undefined,
      tempat_lahir: tempatLahir || undefined,
      tanggal_lahir: tanggalLahir || undefined,
      jenis_kelamin: jenisKelamin || undefined,
      agama: agama || undefined,
      pekerjaan: pekerjaan || undefined,
      status_perkawinan: normalizedStatusPerkawinan || undefined,
      status_janda: statusJanda || undefined,
      alasan_status_janda: alasanStatusJanda || undefined,
      nama_pasangan: namaPasanganJanda || undefined,
      tanggal_kejadian: tanggalKejadianJanda || undefined,
      kewarganegaraan: kewarganegaraan || undefined,
      dusun_pemohon: dusunPemohon || undefined,
      desa_pemohon: desaPemohon || undefined,
      kecamatan_pemohon: kecamatanPemohon || undefined,
      kabupaten_pemohon: kabupatenPemohon || undefined,
      provinsi_pemohon: provinsiPemohon || undefined,
      alamat_pemohon: alamat || undefined,
      telepon: effectiveTelepon || undefined,
      nik_input: nikInput || undefined,
      pendidikan: pendidikan || undefined,
      nama_wali: namaWali || undefined,
      nik_wali: nikWali || undefined,
      tempat_lahir_wali: tempatLahirWali || undefined,
      tanggal_lahir_wali: tanggalLahirWali || undefined,
      jenis_kelamin_wali: jenisKelaminWali || undefined,
      agama_wali: agamaWali || undefined,
      sumber_penghasilan: sumberPenghasilan || undefined,
      penghasilan_per_bulan: penghasilanPerBulan || undefined,
      dasar_keterangan: dasarKeterangan || undefined,
      status_tempat_tinggal: statusTempatTinggal || undefined,
      nama_pemilik_rumah: namaPemilikRumah || undefined,
      hubungan_dengan_pemilik: hubunganDenganPemilik || undefined,
      alamat_tinggal_sekarang: alamatTinggalSekarang || undefined,
      lama_menempati: lamaMenempati || undefined,
      jumlah_tanggungan: jumlahTanggungan || undefined,
      alasan_tidak_memiliki: alasanTidakMemiliki || undefined,
      mulai_usaha: mulaiUsaha || undefined,
      jenis_usaha: jenisUsaha || undefined,
      masa_berlaku_dari: masaBerlakuDari || undefined,
      masa_berlaku_sampai: masaBerlakuSampai || undefined,
      penyandang_cacat: penyandangCacat || undefined,
      jenis_barang: jenisBarang || undefined,
      barang_hilang: barangHilang || undefined,
      asal_barang: asalBarang || undefined,
      label_nomor_barang: nomorBarang ? (labelNomorBarang || 'Nomor') : undefined,
      nomor_barang: nomorBarang || undefined,
      ciri_barang: ciriBarang || undefined,
      uraian_kehilangan: uraianKehilangan || undefined,
      tanggal_kehilangan: tanggalKehilangan || undefined,
      lokasi_kehilangan: lokasiKehilangan || undefined,
      nama_almarhum: namaAlmarhum || undefined,
      nik_almarhum: nikAlmarhum || undefined,
      tempat_lahir_almarhum: tempatLahirAlmarhum || undefined,
      tanggal_lahir_almarhum: tanggalLahirAlmarhum || undefined,
      jenis_kelamin_almarhum: jenisKelaminAlmarhum || undefined,
      agama_almarhum: agamaAlmarhum || undefined,
      pekerjaan_almarhum: pekerjaanAlmarhum || undefined,
      alamat_terakhir: alamatTerakhir || undefined,
      hubungan_pelapor: hubunganPelapor || undefined,
      tanggal_meninggal: tanggalMeninggal || undefined,
      waktu_meninggal: waktuMeninggal || undefined,
      tempat_meninggal: tempatMeninggal || undefined,
      sebab_kematian: sebabKematian || undefined,
      tanggal_pemakaman: tanggalPemakaman || undefined,
      waktu_pemakaman: waktuPemakaman || undefined,
      tempat_pemakaman: tempatPemakaman || undefined,
      nama_mantan: namaMantan || undefined,
      nik_pasangan: nikPasangan || undefined,
      tempat_lahir_pasangan: tempatLahirPasangan || undefined,
      tanggal_lahir_pasangan: tanggalLahirPasangan || undefined,
      kewarganegaraan_pasangan: kewarganegaraanPasangan || undefined,
      agama_pasangan: agamaPasangan || undefined,
      pekerjaan_pasangan: pekerjaanPasangan || undefined,
      dusun_pasangan: dusunPasangan || undefined,
      desa_pasangan: desaPasangan || undefined,
      kecamatan_pasangan: kecamatanPasangan || undefined,
      kabupaten_pasangan: kabupatenPasangan || undefined,
      provinsi_pasangan: provinsiPasangan || undefined,
      alamat_pasangan: alamatPasangan || undefined,
      dusun_almarhum: dusunAlmarhum || undefined,
      desa_almarhum: desaAlmarhum || undefined,
      kecamatan_almarhum: kecamatanAlmarhum || undefined,
      kabupaten_almarhum: kabupatenAlmarhum || undefined,
      provinsi_almarhum: provinsiAlmarhum || undefined,
      tanggal_cerai: tanggalCerai || undefined,
      nomor_akta_cerai: nomorAktaCerai || undefined,
      tempat_cerai: tempatCerai || undefined,
      ...collectAdditionalDetailFields(payload),
    };

    const detailDataJson = JSON.stringify(detailData);

    if (!namaPemohon || !nik || !alamat) {
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

    const [registeredUsers]: any = await db.execute(
      'SELECT role, status FROM users WHERE SUBSTRING_INDEX(nik, "_", 1) = ? LIMIT 5',
      [nik]
    );
    const masyarakatUsers = Array.isArray(registeredUsers)
      ? registeredUsers.filter((row: any) => String(row?.role || '').toLowerCase() === 'masyarakat')
      : [];

    if (masyarakatUsers.length === 0) {
      return NextResponse.json(
        { error: 'NIK tidak terdaftar. Silakan registrasi akun terlebih dahulu.' },
        { status: 404 }
      );
    }

    const isValidatedNik = masyarakatUsers.some((row: any) =>
      ['aktif', 'active'].includes(String(row?.status || '').toLowerCase())
    );

    if (!isValidatedNik) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar tetapi belum tervalidasi admin.' },
        { status: 403 }
      );
    }

    if (!effectiveTelepon || !isValidWhatsAppNumber(effectiveTelepon)) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp aktif wajib diisi dan harus valid untuk notifikasi proses surat' },
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

    if (suratSlug === 'surat-masih-hidup') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!agama) missingFields.push('Agama');
      if (!alamat) missingFields.push('Alamat terakhir');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan masih hidup belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-kematian') {
      const missingFields: string[] = [];
      if (!namaAlmarhum) missingFields.push('Nama almarhum/almarhumah');
      if (!nikAlmarhum) missingFields.push('NIK almarhum/almarhumah');
      if (!tempatLahirAlmarhum) missingFields.push('Tempat lahir almarhum/almarhumah');
      if (!tanggalLahirAlmarhum) missingFields.push('Tanggal lahir almarhum/almarhumah');
      if (!jenisKelaminAlmarhum) missingFields.push('Jenis kelamin almarhum/almarhumah');
      if (!agamaAlmarhum) missingFields.push('Agama almarhum/almarhumah');
      if (!pekerjaanAlmarhum) missingFields.push('Pekerjaan almarhum/almarhumah');
      if (!alamatTerakhir) missingFields.push('Alamat terakhir almarhum/almarhumah');
      if (!hubunganPelapor) missingFields.push('Hubungan pelapor dengan almarhum/almarhumah');
      if (!tanggalMeninggal) missingFields.push('Tanggal meninggal');
      if (!waktuMeninggal) missingFields.push('Waktu meninggal');
      if (!tempatMeninggal) missingFields.push('Tempat meninggal');
      if (!tanggalPemakaman) missingFields.push('Tanggal pemakaman');
      if (!waktuPemakaman) missingFields.push('Waktu pemakaman');
      if (!tempatPemakaman) missingFields.push('Tempat pemakaman');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan kematian belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }

      if (!nikRegex.test(nikAlmarhum)) {
        return NextResponse.json(
          { error: 'NIK almarhum/almarhumah harus 16 digit angka' },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-cerai') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!kewarganegaraan) missingFields.push('Kewarganegaraan');
      if (!agama) missingFields.push('Agama');
      if (!pekerjaan) missingFields.push('Pekerjaan');
      if (!namaMantan) missingFields.push('Nama pasangan cerai');
      if (!dusunPemohon) missingFields.push('Dusun pemohon');
      if (!desaPemohon) missingFields.push('Desa pemohon');
      if (!kecamatanPemohon) missingFields.push('Kecamatan pemohon');
      if (!kabupatenPemohon) missingFields.push('Kabupaten pemohon');
      if (!provinsiPemohon) missingFields.push('Provinsi pemohon');
      if (!nikPasangan) missingFields.push('NIK pasangan cerai');
      if (!tempatLahirPasangan) missingFields.push('Tempat lahir pasangan cerai');
      if (!tanggalLahirPasangan) missingFields.push('Tanggal lahir pasangan cerai');
      if (!kewarganegaraanPasangan) missingFields.push('Kewarganegaraan pasangan cerai');
      if (!agamaPasangan) missingFields.push('Agama pasangan cerai');
      if (!pekerjaanPasangan) missingFields.push('Pekerjaan pasangan cerai');
      if (!dusunPasangan) missingFields.push('Dusun pasangan cerai');
      if (!desaPasangan) missingFields.push('Desa pasangan cerai');
      if (!kecamatanPasangan) missingFields.push('Kecamatan pasangan cerai');
      if (!kabupatenPasangan) missingFields.push('Kabupaten pasangan cerai');
      if (!provinsiPasangan) missingFields.push('Provinsi pasangan cerai');
      if (!alamatPasangan) missingFields.push('Alamat pasangan cerai');
      if (!tanggalCerai) missingFields.push('Tanggal cerai');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan cerai belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }

      if (!nikRegex.test(nikPasangan)) {
        return NextResponse.json(
          { error: 'NIK pasangan cerai harus 16 digit angka' },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-janda') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!agama) missingFields.push('Agama');
      if (!pekerjaan) missingFields.push('Pekerjaan');
      if (!kewarganegaraan) missingFields.push('Kewarganegaraan');
      if (!dusunPemohon) missingFields.push('Dusun pemohon');
      if (!desaPemohon) missingFields.push('Desa pemohon');
      if (!kecamatanPemohon) missingFields.push('Kecamatan pemohon');
      if (!kabupatenPemohon) missingFields.push('Kabupaten pemohon');
      if (!provinsiPemohon) missingFields.push('Provinsi pemohon');
      if (!statusJanda) missingFields.push('Status janda/duda');
      if (!alasanStatusJanda) missingFields.push('Alasan status (Cerai Hidup/Mati)');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan janda/duda belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-penghasilan') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir pemohon');
      if (!tanggalLahir) missingFields.push('Tanggal lahir pemohon');
      if (!jenisKelamin) missingFields.push('Jenis kelamin pemohon');
      if (!agama) missingFields.push('Agama pemohon');
      if (!statusPerkawinan) missingFields.push('Status pemohon');
      if (!pendidikan) missingFields.push('Pendidikan pemohon');
      if (!pekerjaan) missingFields.push('Pekerjaan pemohon');
      if (!dusunPemohon) missingFields.push('Dusun pemohon');
      if (!desaPemohon) missingFields.push('Desa pemohon');
      if (!kecamatanPemohon) missingFields.push('Kecamatan pemohon');
      if (!kabupatenPemohon) missingFields.push('Kabupaten pemohon');
      if (!provinsiPemohon) missingFields.push('Provinsi pemohon');
      if (!namaWali) missingFields.push('Nama lengkap wali');
      if (!nikWali) missingFields.push('NIK wali');
      if (!tempatLahirWali) missingFields.push('Tempat lahir wali');
      if (!tanggalLahirWali) missingFields.push('Tanggal lahir wali');
      if (!jenisKelaminWali) missingFields.push('Jenis kelamin wali');
      if (!agamaWali) missingFields.push('Agama wali');
      if (!sumberPenghasilan) missingFields.push('Sumber penghasilan');
      if (!penghasilanPerBulan) missingFields.push('Penghasilan per bulan');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan penghasilan belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }

      if (!nikRegex.test(nikWali)) {
        return NextResponse.json(
          { error: 'NIK wali harus 16 digit angka' },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-tidak-punya-rumah') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!agama) missingFields.push('Agama');
      if (!statusPerkawinan) missingFields.push('Status');
      if (!pekerjaan) missingFields.push('Pekerjaan');
      if (!kewarganegaraan) missingFields.push('Kewarganegaraan');
      if (!statusTempatTinggal) missingFields.push('Status tempat tinggal saat ini');
      if (!alamatTinggalSekarang) missingFields.push('Alamat tempat tinggal saat ini');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan tidak memiliki rumah belum lengkap: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (suratSlug === 'surat-usaha') {
      const missingFields: string[] = [];
      if (!tempatLahir) missingFields.push('Tempat lahir');
      if (!tanggalLahir) missingFields.push('Tanggal lahir');
      if (!jenisKelamin) missingFields.push('Jenis kelamin');
      if (!agama) missingFields.push('Agama');
      if (!statusPerkawinan) missingFields.push('Status');
      if (!pekerjaan) missingFields.push('Pekerjaan');
      if (!kewarganegaraan) missingFields.push('Kewarganegaraan');
      if (!dusunPemohon) missingFields.push('Dusun');
      if (!desaPemohon) missingFields.push('Desa');
      if (!kecamatanPemohon) missingFields.push('Kecamatan');
      if (!kabupatenPemohon) missingFields.push('Kabupaten');
      if (!provinsiPemohon) missingFields.push('Provinsi');
      if (!mulaiUsaha) missingFields.push('Mulai usaha');
      if (!jenisUsaha) missingFields.push('Jenis usaha');

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Data surat keterangan usaha belum lengkap: ${missingFields.join(', ')}`,
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
          resolvedJenisSurat,
          namaPemohon,
          nik,
          alamat,
          keperluan,
          tempatLahir || null,
          tanggalLahir,
          jenisKelamin || null,
          agama || null,
          pekerjaan || null,
          normalizedStatusPerkawinan || null,
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
        values: [resolvedJenisSurat, namaPemohon, nik, alamat, keperluan, detailDataJson, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, data_detail, file_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [resolvedJenisSurat, namaPemohon, nik, alamat, keperluan, detailDataJson, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, dokumen_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [resolvedJenisSurat, namaPemohon, nik, alamat, keperluan, filePayload, 'pending'],
      },
      {
        query: `INSERT INTO permohonan_surat 
         (jenis_surat, nama_pemohon, nik, alamat, keperluan, file_path, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [resolvedJenisSurat, namaPemohon, nik, alamat, keperluan, filePayload, 'pending'],
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
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development'
        ? { error: 'Gagal mengirim permohonan', detail }
        : { error: 'Gagal mengirim permohonan' },
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
        p.catatan,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.file_path,
        sk.archived_file_path
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, perihal, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat, perihal
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
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
        p.catatan,
        p.created_at AS tanggal_permohonan,
        CASE WHEN p.status IN ('selesai', 'ditandatangani') THEN p.updated_at ELSE NULL END AS tanggal_selesai,
        CASE WHEN p.status IN ('ditolak', 'perlu_revisi') THEN p.catatan ELSE NULL END AS alasan_penolakan,
        p.dokumen_path AS file_path,
        sk.archived_file_path
      FROM permohonan_surat p
      LEFT JOIN (
        SELECT nomor_surat, perihal, MAX(file_path) AS archived_file_path
        FROM surat_keluar
        GROUP BY nomor_surat, perihal
        ) sk ON sk.nomor_surat = p.nomor_surat
          AND LOWER(TRIM(sk.perihal)) LIKE CONCAT(LOWER(TRIM(p.jenis_surat)), '%')
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
      const normalizedStatus = normalizeWorkflowStatus(row.status, row.nomor_surat, row.catatan);

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
