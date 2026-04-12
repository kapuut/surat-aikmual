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
  const sampleValues: Record<string, string> = {};

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
  <title>Preview Placeholder - ${template.nama}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; color: #0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
    h1 { margin: 0 0 10px; font-size: 22px; }
    p { margin: 0 0 8px; color: #475569; }
    .content { margin-top: 16px; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${template.nama}</h1>
      <p>Jenis Surat: <strong>${template.jenisSurat}</strong></p>
      <p>${template.deskripsi}</p>
      <div class="content">${renderedHtml}</div>
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

    const renderedHtml = renderTemplateWithValues(template.htmlTemplate, buildSampleValues(template.fields));
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
