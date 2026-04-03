import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateNomorSurat } from '@/lib/surat-generator/nomor-surat';
import { normalizeSuratSlug } from '@/lib/surat-data';
import type { JenisSurat, SuratData } from '@/lib/surat-generator/types';

export const runtime = 'nodejs';

type PermohonanRow = {
  id: number;
  nama_pemohon: string;
  nik: string;
  alamat: string;
  jenis_surat: string;
  keperluan: string;
  status: string;
  catatan: string | null;
  nomor_surat: string | null;
  file_path: string | null;
  email?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | Date | null;
  jenis_kelamin?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  status_perkawinan?: string | null;
  kewarganegaraan?: string | null;
  masa_berlaku_dari?: string | Date | null;
  masa_berlaku_sampai?: string | Date | null;
};

type NormalizedStatus = 'pending' | 'diproses' | 'selesai' | 'ditolak';

function normalizeStatus(input: unknown): NormalizedStatus | null {
  const value = String(input ?? '').trim().toLowerCase();
  if (['pending', 'menunggu'].includes(value)) return 'pending';
  if (['diproses', 'proses', 'in_progress', 'in-progress'].includes(value)) return 'diproses';
  if (['selesai', 'approved', 'disetujui', 'approve'].includes(value)) return 'selesai';
  if (['ditolak', 'rejected', 'tolak', 'reject'].includes(value)) return 'ditolak';
  return null;
}

function toJenisSurat(value: string): JenisSurat | null {
  const slug = normalizeSuratSlug(value);
  return slug ? (slug as JenisSurat) : null;
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned || undefined;
}

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const dateValue = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

function normalizeGender(value: unknown): 'Laki-laki' | 'Perempuan' | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const lowered = text.toLowerCase();
  if (lowered.includes('laki')) return 'Laki-laki';
  if (lowered.includes('perempuan')) return 'Perempuan';
  return undefined;
}

async function getNextNomorSuratWithLock(connection: any, tanggal: Date): Promise<string> {
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const tahun = String(tanggal.getFullYear());
  const suffix = `/${bulan}.${tahun}`;
  const lockName = `permohonan_surat_nomor_${bulan}_${tahun}`;

  await connection.execute('SELECT GET_LOCK(?, 10)', [lockName]);
  try {
    const [rows]: any = await connection.execute(
      `SELECT nomor_surat
       FROM permohonan_surat
       WHERE nomor_surat LIKE ?
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [`%${suffix}`]
    );

    let nomorUrut = 1;
    if (rows?.length > 0 && typeof rows[0].nomor_surat === 'string') {
      const parsed = parseInt(String(rows[0].nomor_surat).split('/')[0], 10);
      nomorUrut = Number.isFinite(parsed) ? parsed + 1 : 1;
    }

    return generateNomorSurat(nomorUrut, tanggal);
  } finally {
    await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

async function saveGeneratedSuratHtml(
  htmlContent: string,
  nomorSurat: string,
  jenisSurat: JenisSurat
): Promise<string> {
  const outputDir = path.join(process.cwd(), 'public', 'generated-surat');
  await mkdir(outputDir, { recursive: true });

  const safeNomor = nomorSurat.replace(/[^a-zA-Z0-9.-]+/g, '-');
  const fileName = `${safeNomor}-${jenisSurat}.html`;
  const absolutePath = path.join(outputDir, fileName);

  await writeFile(absolutePath, htmlContent, 'utf-8');
  return `/generated-surat/${fileName}`;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await db.getConnection();
  try {
    const payload = await request.json();
    const normalizedStatus = normalizeStatus(payload?.status);
    const catatan = typeof payload?.catatan === 'string' ? payload.catatan.trim() : null;

    const processedByRaw = payload?.processed_by ?? payload?.processedBy;
    const processedByNumber = Number(processedByRaw);
    const processedBy = Number.isFinite(processedByNumber) && processedByNumber > 0
      ? processedByNumber
      : null;

    if (!normalizedStatus) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [permohonanRows]: any = await connection.execute(
      'SELECT * FROM permohonan_surat WHERE id = ? FOR UPDATE',
      [params.id]
    );

    if (!permohonanRows || permohonanRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Permohonan tidak ditemukan' }, { status: 404 });
    }

    const permohonan = permohonanRows[0] as PermohonanRow;
    let nomorSurat = permohonan.nomor_surat;
    let generatedFilePath = permohonan.file_path;

    if (normalizedStatus === 'selesai') {
      const jenisSurat = toJenisSurat(permohonan.jenis_surat);
      if (!jenisSurat) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Jenis surat pada permohonan tidak dikenali' },
          { status: 400 }
        );
      }

      const tanggalSurat = new Date();
      const masaBerlakuDari = asDate(permohonan.masa_berlaku_dari) || tanggalSurat;
      const masaBerlakuSampai =
        asDate(permohonan.masa_berlaku_sampai) ||
        new Date(masaBerlakuDari.getFullYear(), masaBerlakuDari.getMonth() + 5, masaBerlakuDari.getDate());

      if (!nomorSurat) {
        nomorSurat = await getNextNomorSuratWithLock(connection, tanggalSurat);
      }

      const suratData: SuratData = {
        jenisSurat,
        nomorSurat,
        tanggalSurat,
        nama: permohonan.nama_pemohon,
        nik: permohonan.nik,
        tempatLahir: asText(permohonan.tempat_lahir),
        tanggalLahir: asDate(permohonan.tanggal_lahir),
        jeniKelamin: normalizeGender(permohonan.jenis_kelamin),
        agama: asText(permohonan.agama),
        pekerjaan: asText(permohonan.pekerjaan),
        statusPerkawinan: asText(permohonan.status_perkawinan),
        kewarganegaraan: asText(permohonan.kewarganegaraan) || 'Indonesia',
        tanggalBerlaku: {
          dari: masaBerlakuDari,
          sampai: masaBerlakuSampai,
        },
        alamat: permohonan.alamat,
        isiSurat: `Dengan ini menerangkan bahwa nama yang di atas tersebut memang benar penduduk Desa Aikmual yang bertempat tinggal di ${permohonan.alamat}. Surat keterangan ini dipergunakan untuk keperluan ${permohonan.keperluan}.`,
        kepalaDesa: {
          nama: 'KEPALA DESA AIKMUAL',
        },
      };

      const htmlContent = generateSuratTemplate(suratData);
      generatedFilePath = await saveGeneratedSuratHtml(htmlContent, nomorSurat, jenisSurat);
    }

    await connection.execute(
      `UPDATE permohonan_surat
       SET status = ?,
           catatan = COALESCE(?, catatan),
           nomor_surat = COALESCE(?, nomor_surat),
           file_path = COALESCE(?, file_path),
           processed_by = COALESCE(?, processed_by),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [normalizedStatus, catatan, nomorSurat, generatedFilePath, processedBy, params.id]
    );

    await connection.commit();

    // Notifikasi email bersifat best-effort agar update status tidak gagal.
    if (typeof permohonan.email === 'string' && permohonan.email.trim()) {
      try {
        await sendNotificationEmail(
          permohonan.email,
          `Update Status Permohonan #${params.id}`,
          `Status permohonan Anda telah diupdate menjadi: ${normalizedStatus}`
        );
      } catch (emailError) {
        console.error('Gagal kirim email notifikasi:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Status berhasil diupdate',
      data: {
        id: Number(params.id),
        status: normalizedStatus,
        nomor_surat: nomorSurat,
        file_path: generatedFilePath,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    console.error('Gagal mengupdate status permohonan:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate status' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
