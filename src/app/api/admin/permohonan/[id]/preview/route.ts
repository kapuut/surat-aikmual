import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
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
  nomor_surat: string | null;
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    const suratSlug = normalizeSuratSlug(permohonan.jenis_surat);

    if (!suratSlug) {
      return NextResponse.json({ error: 'Jenis surat tidak valid untuk preview' }, { status: 400 });
    }

    const tanggalSurat = new Date(permohonan.updated_at || permohonan.created_at || Date.now());
    const masaBerlakuDari = asDate(permohonan.masa_berlaku_dari) || tanggalSurat;
    const masaBerlakuSampai =
      asDate(permohonan.masa_berlaku_sampai) ||
      new Date(masaBerlakuDari.getFullYear(), masaBerlakuDari.getMonth() + 5, masaBerlakuDari.getDate());

    const suratData: SuratData = {
      jenisSurat: suratSlug as JenisSurat,
      nomorSurat: permohonan.nomor_surat || undefined,
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

    const html = generateSuratTemplate(suratData, {
      editable: true,
      showToolbar: true,
      logoUrl: '/images/logo-loteng.png',
    });

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
