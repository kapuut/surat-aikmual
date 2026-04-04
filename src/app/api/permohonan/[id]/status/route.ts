import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { createHash, createHmac } from 'crypto';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { generateNomorSurat } from '@/lib/surat-generator/nomor-surat';
import { normalizeSuratSlug } from '@/lib/surat-data';
import type { UserRole } from '@/lib/types';
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

type NormalizedStatus =
  | 'pending'
  | 'diproses'
  | 'dikirim_ke_kepala_desa'
  | 'perlu_revisi'
  | 'ditandatangani'
  | 'selesai'
  | 'ditolak';

type InternalRole = Extract<UserRole, 'admin' | 'sekretaris' | 'kepala_desa'>;

function normalizeStatus(input: unknown): NormalizedStatus | null {
  const value = String(input ?? '').trim().toLowerCase();
  if (['pending', 'menunggu'].includes(value)) return 'pending';
  if (['diproses', 'proses', 'in_progress', 'in-progress'].includes(value)) return 'diproses';
  if (
    [
      'dikirim_ke_kepala_desa',
      'dikirim ke kepala desa',
      'dikirim-kepala-desa',
      'siap tandatangan',
      'siap_tandatangan',
      'terverifikasi',
      'verified',
    ].includes(value)
  ) {
    return 'dikirim_ke_kepala_desa';
  }
  if (['perlu_revisi', 'perlu revisi', 'revisi'].includes(value)) return 'perlu_revisi';
  if (['ditandatangani', 'signed', 'tertanda'].includes(value)) return 'ditandatangani';
  if (['selesai', 'approved', 'disetujui', 'approve'].includes(value)) return 'selesai';
  if (['ditolak', 'rejected', 'tolak', 'reject'].includes(value)) return 'ditolak';
  return null;
}

function statusLabel(status: NormalizedStatus): string {
  const labels: Record<NormalizedStatus, string> = {
    pending: 'Menunggu Verifikasi',
    diproses: 'Diproses',
    dikirim_ke_kepala_desa: 'Dikirim ke Kepala Desa',
    perlu_revisi: 'Perlu Revisi',
    ditandatangani: 'Ditandatangani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
  };

  return labels[status];
}

function canTransitionStatus(
  role: InternalRole,
  currentStatus: NormalizedStatus,
  nextStatus: NormalizedStatus
): boolean {
  if (currentStatus === nextStatus) return true;

  if (role === 'admin' || role === 'sekretaris') {
    if (nextStatus === 'dikirim_ke_kepala_desa') {
      return ['pending', 'diproses', 'perlu_revisi'].includes(currentStatus);
    }
    if (nextStatus === 'ditolak') {
      return ['pending', 'diproses', 'perlu_revisi', 'dikirim_ke_kepala_desa'].includes(currentStatus);
    }
    if (nextStatus === 'diproses') {
      return ['pending', 'perlu_revisi'].includes(currentStatus);
    }
    if (nextStatus === 'pending') {
      return currentStatus === 'perlu_revisi';
    }
    return false;
  }

  if (role === 'kepala_desa') {
    if (nextStatus === 'perlu_revisi') {
      return currentStatus === 'dikirim_ke_kepala_desa';
    }
    if (nextStatus === 'ditandatangani') {
      return currentStatus === 'dikirim_ke_kepala_desa';
    }
    if (nextStatus === 'selesai') {
      return currentStatus === 'ditandatangani';
    }
    return false;
  }

  return false;
}

function isUnknownColumnError(error: unknown): boolean {
  return String((error as any)?.message || '').toLowerCase().includes('unknown column');
}

async function upsertSuratKeluarArchive(
  connection: any,
  params: {
    nomorSurat: string;
    perihal: string;
    tujuan: string;
    filePath: string | null;
    createdBy: number | null;
    tanggal: string;
  }
) {
  const updateVariants: Array<{ query: string; values: unknown[] }> = [
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  status = 'aktif',
                  tanggal = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?`,
      values: [params.perihal, params.tujuan, params.filePath, params.tanggal, params.nomorSurat],
    },
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  status = 'aktif',
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?`,
      values: [params.perihal, params.tujuan, params.filePath, params.nomorSurat],
    },
    {
      query: `UPDATE surat_keluar
              SET perihal = ?,
                  tujuan = ?,
                  file_path = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE nomor_surat = ?`,
      values: [params.perihal, params.tujuan, params.filePath, params.nomorSurat],
    },
  ];

  for (const variant of updateVariants) {
    try {
      const [result]: any = await connection.execute(variant.query, variant.values);
      if (result?.affectedRows > 0) {
        return;
      }
      break;
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }

  const insertVariants: Array<{ query: string; values: unknown[] }> = [
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tanggal, tujuan, perihal, file_path, status, created_by)
              VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tujuan, perihal, file_path, status, created_by)
              VALUES (?, ?, ?, ?, ?, 'aktif', ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
    {
      query: `INSERT INTO surat_keluar
              (nomor_surat, tanggal_surat, tujuan, perihal, file_path, created_by)
              VALUES (?, ?, ?, ?, ?, ?)`,
      values: [
        params.nomorSurat,
        params.tanggal,
        params.tujuan,
        params.perihal,
        params.filePath,
        params.createdBy,
      ],
    },
  ];

  for (const variant of insertVariants) {
    try {
      await connection.execute(variant.query, variant.values);
      return;
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }
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

function getAppBaseUrl(): string {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

function buildVerificationCode(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 16).toUpperCase();
}

function buildIntegrityToken(source: string): string {
  const secret = process.env.QR_SIGN_SECRET || process.env.JWT_SECRET || 'aikmual-signature-secret';
  return createHmac('sha256', secret).update(source).digest('hex').slice(0, 24).toUpperCase();
}

async function createPermohonanQrCode(params: {
  id: number;
  nomorSurat: string;
  nik: string;
  namaPemohon: string;
  jenisSurat: string;
  keperluan: string;
  pembuatSurat: string;
  signedAt: Date;
}): Promise<{ dataUrl: string; verificationCode: string }> {
  const source = [
    params.id,
    params.nomorSurat,
    params.nik,
    params.namaPemohon,
    params.jenisSurat,
    params.keperluan,
    params.pembuatSurat,
  ].join('|');

  const verificationCode = buildVerificationCode(source);
  const integrityToken = buildIntegrityToken(source);
  const verifyUrl = `${getAppBaseUrl()}/verifikasi-surat?permohonan=${params.id}&kode=${verificationCode}&token=${integrityToken}`;

  const qrPayload = [
    'VERIFIKASI SURAT DESA AIKMUAL',
    `Kode: ${verificationCode}`,
    `ID Permohonan: ${params.id}`,
    `Nomor Surat: ${params.nomorSurat}`,
    `Pembuat Surat: ${params.pembuatSurat}`,
    `NIK: ${params.nik}`,
    `Nama Pemohon: ${params.namaPemohon}`,
    `Jenis Surat: ${params.jenisSurat}`,
    `Tujuan/Keperluan: ${params.keperluan}`,
    `Tanggal TTD: ${params.signedAt.toISOString()}`,
    `Token Integritas: ${integrityToken}`,
    `URL Verifikasi: ${verifyUrl}`,
  ].join('\n');

  const dataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    width: 180,
    margin: 1,
  });

  return { dataUrl, verificationCode };
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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await getUser(token);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!['admin', 'sekretaris', 'kepala_desa'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const normalizedStatus = normalizeStatus(payload?.status);
    const catatan = typeof payload?.catatan === 'string' ? payload.catatan.trim() : null;
    const noteByRole =
      authUser.role === 'admin'
        ? 'Admin'
        : authUser.role === 'sekretaris'
          ? 'Sekretaris'
          : 'Kepala Desa';
    const effectiveCatatan = catatan || `Status diperbarui oleh ${noteByRole}`;

    const processedByNumber = Number(authUser.id);
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
    const currentStatus = normalizeStatus(permohonan.status);
    if (!currentStatus) {
      await connection.rollback();
      return NextResponse.json({ error: 'Status saat ini tidak dikenali' }, { status: 400 });
    }

    if (!canTransitionStatus(authUser.role as InternalRole, currentStatus, normalizedStatus)) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Transisi status dari ${statusLabel(currentStatus)} ke ${statusLabel(normalizedStatus)} tidak diizinkan untuk role ${authUser.role}`,
        },
        { status: 403 }
      );
    }

    let nomorSurat = permohonan.nomor_surat;
    let generatedFilePath = permohonan.file_path;

    const shouldGenerateSurat = ['dikirim_ke_kepala_desa', 'ditandatangani', 'selesai'].includes(normalizedStatus);

    if (shouldGenerateSurat) {
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

      const shouldEmbedSignature = ['ditandatangani', 'selesai'].includes(normalizedStatus);
      const shouldRegenerateSurat = !generatedFilePath || shouldEmbedSignature;

      if (shouldRegenerateSurat) {
        let qrCodeDataUrl: string | undefined;
        let verificationCode: string | undefined;

        if (shouldEmbedSignature) {
          const qr = await createPermohonanQrCode({
            id: Number(params.id),
            nomorSurat,
            nik: permohonan.nik,
            namaPemohon: permohonan.nama_pemohon,
            jenisSurat: permohonan.jenis_surat,
            keperluan: permohonan.keperluan,
            pembuatSurat: authUser.nama || noteByRole,
            signedAt: tanggalSurat,
          });
          qrCodeDataUrl = qr.dataUrl;
          verificationCode = qr.verificationCode;
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
            signatureImageUrl: shouldEmbedSignature ? '/images/sample-ttd.png' : undefined,
            qrCodeDataUrl,
            verificationCode,
          },
        };

        const htmlContent = generateSuratTemplate(suratData);
        generatedFilePath = await saveGeneratedSuratHtml(htmlContent, nomorSurat, jenisSurat);
      }
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
      [normalizedStatus, effectiveCatatan, nomorSurat, generatedFilePath, processedBy, params.id]
    );

    if (['ditandatangani', 'selesai'].includes(normalizedStatus) && nomorSurat) {
      const tanggalArsip = new Date().toISOString().split('T')[0];
      const tujuan = permohonan.nama_pemohon || 'Pemohon';
      const perihal = `${permohonan.jenis_surat} - ${permohonan.keperluan}`;

      await upsertSuratKeluarArchive(connection, {
        nomorSurat,
        perihal,
        tujuan,
        filePath: generatedFilePath,
        createdBy: processedBy,
        tanggal: tanggalArsip,
      });
    }

    await connection.commit();

    // Notifikasi email bersifat best-effort agar update status tidak gagal.
    if (typeof permohonan.email === 'string' && permohonan.email.trim()) {
      try {
        await sendNotificationEmail(
          permohonan.email,
          `Update Status Permohonan #${params.id}`,
          `Status permohonan Anda telah diupdate menjadi: ${statusLabel(normalizedStatus)}`
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
