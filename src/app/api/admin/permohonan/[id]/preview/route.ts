import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { readFile } from 'fs/promises';
import path from 'path';
import { generateSuratTemplate } from '@/lib/surat-generator/template';
import { normalizeSuratSlug } from '@/lib/surat-data';
import type { JenisSurat, SuratData } from '@/lib/surat-generator/types';

type PermohonanRow = RowDataPacket & {
  id: number;
  nama_pemohon: string;
  nik: string;
  alamat: string;
  jenis_surat: string;
  keperluan: string;
  status?: string | null;
  file_path?: string | null;
  nomor_surat: string | null;
  data_detail?: string | null;
  created_at: string;
  updated_at: string;
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

type DetailData = Record<string, unknown>;

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
      // Keep original value when JSON parsing fails.
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

function normalizeGender(value: unknown): 'Laki-laki' | 'Perempuan' | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const lowered = text.toLowerCase();
  if (lowered.includes('laki')) return 'Laki-laki';
  if (lowered.includes('perempuan')) return 'Perempuan';
  return undefined;
}

function parseDetailData(value: unknown): DetailData {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as DetailData;
  }

  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as DetailData;
    }
    return {};
  } catch {
    return {};
  }
}

function getTextWithDetail(primaryValue: unknown, detailData: DetailData, keys: string[]): string | undefined {
  const fromPrimary = asText(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = asText(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

function getDateWithDetail(primaryValue: unknown, detailData: DetailData, keys: string[]): Date | undefined {
  const fromPrimary = asDate(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = asDate(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

function getGenderWithDetail(
  primaryValue: unknown,
  detailData: DetailData,
  keys: string[]
): 'Laki-laki' | 'Perempuan' | undefined {
  const fromPrimary = normalizeGender(primaryValue);
  if (fromPrimary) return fromPrimary;

  for (const key of keys) {
    const fromDetail = normalizeGender(detailData[key]);
    if (fromDetail) return fromDetail;
  }

  return undefined;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestUrl = new URL(request.url);
    const mode = String(requestUrl.searchParams.get('mode') || '').toLowerCase();
    const download = String(requestUrl.searchParams.get('download') || '').toLowerCase();
    const wantsDoc = download === 'doc';
    const printFlag = requestUrl.searchParams.get('print') === '1';

    const [rows] = await db.query<PermohonanRow[]>(
      `SELECT *
       FROM permohonan_surat
       WHERE id = ?
       LIMIT 1`,
      [params.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Permohonan tidak ditemukan' }, { status: 404 });
    }

    const permohonan = rows[0];
    const normalizedStatus = String(permohonan.status || '').trim().toLowerCase();
    const normalizedFilePath = normalizeFilePath(permohonan.file_path);

    // If the letter is already finalized/signed, show the final generated HTML directly.
    if (
      ['ditandatangani', 'selesai'].includes(normalizedStatus) &&
      isGeneratedSuratFile(normalizedFilePath)
    ) {
      if (wantsDoc) {
        try {
          const absolutePath = path.join(process.cwd(), 'public', String(normalizedFilePath).replace(/^\//, ''));
          const finalHtml = await readFile(absolutePath, 'utf-8');
          const fileBaseName = (permohonan.nomor_surat || `surat-${params.id}`).replace(/[^a-zA-Z0-9.-]+/g, '-');

          return new NextResponse(`\ufeff${finalHtml}`, {
            headers: {
              'Content-Type': 'application/msword; charset=utf-8',
              'Content-Disposition': `attachment; filename="${fileBaseName}.doc"`,
            },
          });
        } catch {
          // Fall through to generated preview document when final HTML cannot be read.
        }
      }

      if (mode !== 'admin') {
        const targetUrl = new URL(normalizedFilePath as string, request.url);
        if (printFlag) {
          targetUrl.searchParams.set('print', '1');
        }
        return NextResponse.redirect(targetUrl);
      }
    }

    const detailData = parseDetailData(permohonan.data_detail);
    const suratSlug = normalizeSuratSlug(permohonan.jenis_surat);

    if (!suratSlug) {
      return NextResponse.json({ error: 'Jenis surat tidak valid untuk preview' }, { status: 400 });
    }

    const tanggalSurat = new Date(permohonan.updated_at || permohonan.created_at || Date.now());
    const tempatLahir = getTextWithDetail(permohonan.tempat_lahir, detailData, [
      'tempat_lahir',
      'tempatLahir',
      'tempat_lahir_pemohon',
      'tempatLahirPemohon',
    ]);
    const tanggalLahir = getDateWithDetail(permohonan.tanggal_lahir, detailData, [
      'tanggal_lahir',
      'tanggalLahir',
      'tanggal_lahir_pemohon',
      'tanggalLahirPemohon',
    ]);
    const jenisKelamin = getGenderWithDetail(permohonan.jenis_kelamin, detailData, [
      'jenis_kelamin',
      'jenisKelamin',
      'jenis_kelamin_pemohon',
      'jenisKelaminPemohon',
    ]);
    const agama = getTextWithDetail(permohonan.agama, detailData, ['agama']);
    const pekerjaan = getTextWithDetail(permohonan.pekerjaan, detailData, [
      'pekerjaan',
      'pekerjaan_pemohon',
      'pekerjaanPemohon',
    ]);
    const statusPerkawinan = getTextWithDetail(permohonan.status_perkawinan, detailData, [
      'status_perkawinan',
      'statusPerkawinan',
      'status_perkawinan_pemohon',
      'statusPerkawinanPemohon',
      'status',
    ]);
    const kewarganegaraan =
      getTextWithDetail(permohonan.kewarganegaraan, detailData, ['kewarganegaraan']) || 'Indonesia';

    const masaBerlakuDari =
      getDateWithDetail(permohonan.masa_berlaku_dari, detailData, ['masa_berlaku_dari', 'masaBerlakuDari']) ||
      tanggalSurat;
    const masaBerlakuSampai =
      getDateWithDetail(permohonan.masa_berlaku_sampai, detailData, ['masa_berlaku_sampai', 'masaBerlakuSampai']) ||
      new Date(masaBerlakuDari.getFullYear(), masaBerlakuDari.getMonth() + 5, masaBerlakuDari.getDate());

    const suratData: SuratData = {
      jenisSurat: suratSlug as JenisSurat,
      nomorSurat: permohonan.nomor_surat || undefined,
      tanggalSurat,
      nama: permohonan.nama_pemohon,
      nik: permohonan.nik,
      tempatLahir,
      tanggalLahir,
      jeniKelamin: jenisKelamin,
      agama,
      pekerjaan,
      statusPerkawinan,
      kewarganegaraan,
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

    const html = generateSuratTemplate(suratData, {
      editable: true,
      showToolbar: true,
      logoUrl: '/images/logo-loteng.png',
    });

    if (wantsDoc) {
      const fileBaseName = (permohonan.nomor_surat || `surat-${params.id}`).replace(/[^a-zA-Z0-9.-]+/g, '-');
      return new NextResponse(`\ufeff${html}`, {
        headers: {
          'Content-Type': 'application/msword; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileBaseName}.doc"`,
        },
      });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ error: 'Gagal membuat preview surat' }, { status: 500 });
  }
}
