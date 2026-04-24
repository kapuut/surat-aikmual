import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { db } from '@/lib/db';
import { DYNAMIC_SURAT_TEMPLATES } from '@/lib/template-surat/templates';
import { renderTemplateWithValues } from '@/lib/template-surat/render-template';
import type { DynamicSuratTemplate, TemplateField } from '@/lib/template-surat/types';
import { RowDataPacket } from 'mysql2';
import { generateSuratTemplate } from '@/lib/surat-generator';
import type { JenisSurat } from '@/lib/surat-generator/types';
import { buildSampleSuratData } from '@/lib/surat-generator/sample-data';
import { normalizeSuratSlug } from '@/lib/surat-data';
import { normalizeCustomTemplateHtml } from '@/lib/template-surat/official-layout';
import { buildOfficialDynamicSystemValues } from '@/lib/template-surat/official-defaults';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

type JwtPayload = {
  role?: string;
};

type CustomTemplateRow = RowDataPacket & {
  id: string;
  nama: string;
  jenis_surat: string;
  deskripsi: string;
  html_template: string;
  fields_json: string;
};

async function ensureAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  try {
    const decoded = verify(token.value, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') {
      return { ok: false as const, status: 403, error: 'Forbidden - Admin only' };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, status: 401, error: 'Token tidak valid' };
  }
}

function parseFieldsJson(fieldsJson: string): TemplateField[] {
  try {
    const parsed = JSON.parse(fieldsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as TemplateField);
  } catch {
    return [];
  }
}

function buildSampleValues(fields: TemplateField[]): Record<string, string> {
  const today = new Date();
  const tanggalSurat = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const bulan = String(today.getMonth() + 1).padStart(2, '0');
  const tahun = today.getFullYear();

  // Common/system field values that are always present in every template
  const sampleValues: Record<string, string> = buildOfficialDynamicSystemValues(
    tanggalSurat,
    `001/Ds.Aml/${bulan}.${tahun}`
  );

  fields.forEach((field) => {
    if (field.type === 'date') {
      sampleValues[field.name] = new Date().toLocaleDateString('id-ID');
      return;
    }

    if (field.type === 'select') {
      sampleValues[field.name] = field.options?.[0]?.value || `[${field.label}]`;
      return;
    }

    sampleValues[field.name] = `[${field.label}]`;
  });

  return sampleValues;
}

function renderPreviewPage(template: DynamicSuratTemplate, renderedHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview - ${template.nama}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Bookman Old Style', 'Book Antiqua', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background-color: #efefef;
      padding: 16px;
    }

    .page {
      width: 21cm;
      min-height: 29.7cm;
      height: auto;
      margin: 0 auto;
      padding: 1.2cm 1.3cm 1.2cm 1.3cm;
      font-size: 12pt;
      line-height: 1.5;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    /* Kop Surat */
    .kop-surat {
      margin-bottom: 0.7cm;
      position: relative;
      padding-bottom: 0.15cm;
    }

    .kop-row {
      display: grid;
      grid-template-columns: 98px 1fr;
      column-gap: 10px;
      align-items: center;
    }

    .logo-wrap {
      width: 98px;
      height: 98px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-wrap img {
      width: 88px;
      height: 88px;
      object-fit: contain;
    }

    .kop-text {
      text-align: center;
      padding-right: 98px;
      font-family: 'Times New Roman', serif;
    }

    .kop-text .kabupaten {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .kop-text .kecamatan {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .kop-text .desa {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1px;
    }

    .kop-text .alamat {
      font-size: 9pt;
      border: 1px solid #111;
      padding: 2px 6px;
      display: inline-block;
      min-width: 86%;
      white-space: nowrap;
    }

    .kop-divider {
      margin-top: 4px;
      border-top: 1px solid #000;
      border-bottom: 2px solid #000;
      height: 3px;
    }

    /* Judul Surat */
    .judul-surat {
      text-align: center;
      margin: 0.3cm 0 0.02cm 0;
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
    }

    /* Nomor Surat */
    .nomor-surat {
      text-align: center;
      margin-bottom: 0.32cm;
      font-size: 12pt;
      line-height: 1.2;
    }

    /* Isi Surat */
    .isi-surat, .surat-body {
      font-size: 12pt;
      margin: 0.2cm 0 0.6cm 0;
    }

    .isi-surat p, .surat-body p {
      margin-bottom: 0.35cm;
      line-height: 1.5;
    }

    .isi-surat table, .surat-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.15cm 0 0.35cm 0;
      font-size: 12pt;
    }

    .isi-surat td, .surat-body td {
      padding: 0.03cm 0;
      border: none;
      vertical-align: top;
    }

    .isi-surat .label, .surat-body .label {
      width: 3.8cm;
      white-space: nowrap;
    }

    .isi-surat .colon, .surat-body .colon {
      width: 0.35cm;
      text-align: center;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .page { width: 100%; min-height: auto; box-shadow: none; margin: 0; padding: 0; }
    }

    @media (max-width: 900px) {
      body { padding: 8px; }
      .page { width: 100%; }
      .kop-row { grid-template-columns: 72px 1fr; }
      .kop-text { padding-right: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-row">
        <div class="logo-wrap">
          <img src="/images/logo-loteng.png" alt="Logo Lombok Tengah" />
        </div>
        <div class="kop-text">
          <div class="kabupaten">PEMERINTAH KABUPATEN LOMBOK TENGAH</div>
          <div class="kecamatan">KECAMATAN PRAYA</div>
          <div class="desa">DESA AIKMUAL</div>
          <div class="alamat">Alamat : Jln raya Praya – Mantang KM 07 Aikmual Praya Phone 08175726709 / 08175790747 Kode Post 83500</div>
        </div>
      </div>
      <div class="kop-divider"></div>
    </div>

    <!-- Isi Template -->
    <div class="surat-body">
      ${renderedHtml}
    </div>
  </div>
</body>
</html>`;
}

async function getCustomTemplateById(id: string): Promise<DynamicSuratTemplate | null> {
  try {
    const [rows] = await db.execute<CustomTemplateRow[]>(
      `SELECT id, nama, jenis_surat, deskripsi, html_template, fields_json
       FROM dynamic_template_surat
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      nama: row.nama,
      jenisSurat: row.jenis_surat,
      deskripsi: row.deskripsi,
      htmlTemplate: row.html_template,
      fields: parseFieldsJson(row.fields_json),
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const templateId = decodeURIComponent(params.id || '').trim();
    if (!templateId) {
      return NextResponse.json({ error: 'Template tidak valid' }, { status: 400 });
    }

    const defaultTemplate = DYNAMIC_SURAT_TEMPLATES.find((item) => item.id === templateId);
    const customTemplate = defaultTemplate ? null : await getCustomTemplateById(templateId);
    const template = defaultTemplate || customTemplate;

    if (!template) {
      return NextResponse.json({ error: 'Template placeholder tidak ditemukan' }, { status: 404 });
    }

    const normalizedSlug = normalizeSuratSlug(template.id) || normalizeSuratSlug(template.jenisSurat);
    if (defaultTemplate && normalizedSlug) {
      const html = generateSuratTemplate(buildSampleSuratData(normalizedSlug as JenisSurat), {
        editable: false,
        showToolbar: false,
        logoUrl: '/images/logo-loteng.png',
      });

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    const renderedHtml = renderTemplateWithValues(
      normalizeCustomTemplateHtml(template.htmlTemplate),
      buildSampleValues(template.fields)
    );
    return new NextResponse(renderPreviewPage(template, renderedHtml), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Dynamic template preview error:', error);
    return NextResponse.json({ error: 'Gagal menampilkan preview placeholder' }, { status: 500 });
  }
}
