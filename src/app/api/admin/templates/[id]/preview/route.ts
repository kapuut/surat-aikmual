import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import mammoth from 'mammoth';
import path from 'path';
import { access } from 'fs/promises';
import { DYNAMIC_SURAT_TEMPLATES } from '@/lib/template-surat/templates';
import { renderTemplateWithValues } from '@/lib/template-surat/render-template';
import type { TemplateField } from '@/lib/template-surat/types';
import { generateSuratTemplate } from '@/lib/surat-generator';
import type { JenisSurat } from '@/lib/surat-generator/types';
import { buildSampleSuratData } from '@/lib/surat-generator/sample-data';
import { normalizeSuratSlug } from '@/lib/surat-data';

type JwtPayload = {
  role?: string;
};

type TemplateRow = RowDataPacket & {
  id: number;
  nama: string;
  jenis_surat: string;
  file_name: string;
  file_path: string;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

function renderDocxPreviewPage(title: string, htmlBody: string, notes: string[]): string {
  const noteList = notes
    .map((note) => `<li>${note.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview Template - ${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; color: #0f172a; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
    h1 { margin: 0 0 14px; font-size: 22px; }
    .docx-content { line-height: 1.65; font-size: 15px; }
    .docx-content table { border-collapse: collapse; width: 100%; margin: 14px 0; }
    .docx-content table, .docx-content th, .docx-content td { border: 1px solid #cbd5e1; }
    .docx-content th, .docx-content td { padding: 8px; }
    .notes { margin-top: 16px; background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; border-radius: 8px; padding: 10px 12px; }
    .notes h2 { margin: 0 0 8px; font-size: 14px; }
    .notes ul { margin: 0; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Preview Template: ${title}</h1>
      <div class="docx-content">${htmlBody}</div>
      ${noteList ? `<div class="notes"><h2>Catatan Konversi</h2><ul>${noteList}</ul></div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

function buildSampleValues(fields: TemplateField[]): Record<string, string> {
  const values: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.type === 'date') {
      values[field.name] = new Date().toLocaleDateString('id-ID');
      return;
    }

    if (field.type === 'select') {
      values[field.name] = field.options?.[0]?.value || `[${field.label}]`;
      return;
    }

    values[field.name] = `[${field.label}]`;
  });

  return values;
}

function normalizeJenisValue(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function renderFallbackPlaceholderPage(title: string, jenisSurat: string, renderedHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview Placeholder - ${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; color: #0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
    h1 { margin: 0 0 10px; font-size: 22px; }
    p { margin: 0 0 8px; color: #475569; }
    .warn { margin: 12px 0; border: 1px solid #fdba74; background: #fff7ed; color: #9a3412; border-radius: 8px; padding: 10px 12px; }
    .content { margin-top: 16px; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Preview Template: ${title}</h1>
      <p>Jenis Surat: <strong>${jenisSurat}</strong></p>
      <div class="warn">File template upload tidak ditemukan di server. Preview ditampilkan dari template placeholder default.</div>
      <div class="content">${renderedHtml}</div>
    </div>
  </div>
</body>
</html>`;
}

function tokenizeCandidateText(value: string): string[] {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !['surat', 'template', 'keterangan', 'docx', 'pdf'].includes(item));
}

function scoreFileByKeywords(fileName: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const lowerFileName = fileName.toLowerCase();
  return keywords.reduce((score, keyword) => {
    if (!keyword) return score;
    return lowerFileName.includes(keyword) ? score + 1 : score;
  }, 0);
}

async function findClosestTemplateFile(
  _templatesDir: string,
  _jenisSurat: string,
  _templateName: string,
  _fileName: string
): Promise<string | null> {
  // On Vercel, local filesystem scanning is not available — fallback handled via DB file_path
  return null;
}

function renderFinalStylePreview(jenisSuratRaw: string): string | null {
  const normalizedSlug = normalizeSuratSlug(jenisSuratRaw);
  if (!normalizedSlug) {
    return null;
  }

  const sampleData = buildSampleSuratData(normalizedSlug as JenisSurat);
  return generateSuratTemplate(sampleData, {
    editable: false,
    showToolbar: false,
    logoUrl: '/images/logo-loteng.png',
  });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const requestUrl = new URL(request.url);
    const forceRawView = requestUrl.searchParams.get('view') === 'raw';

    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [rows] = await db.execute<TemplateRow[]>(
      `SELECT id, nama, jenis_surat, file_name, file_path FROM template_surat WHERE id = ? LIMIT 1`,
      [params.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    const template = rows[0];

    if (!forceRawView) {
      const finalStylePreview = renderFinalStylePreview(template.jenis_surat);
      if (finalStylePreview) {
        return new NextResponse(finalStylePreview, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    }

    const filePath = String(template.file_path || '').trim();
    const fileName = String(template.file_name || '').trim();

    if (!filePath || !fileName) {
      return NextResponse.json({ error: 'File template tidak valid' }, { status: 400 });
    }

    const lowerName = fileName.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isDocx = lowerName.endsWith('.docx');

    if (isPdf) {
      const redirectUrl = new URL(filePath.startsWith('/') ? filePath : `/${filePath}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (!isDocx) {
      const redirectUrl = new URL(filePath.startsWith('/') ? filePath : `/${filePath}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Try to get file: if filePath is a blob URL (https://...) fetch it, else use local fs
    let fileBuffer: Buffer | null = null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const res = await fetch(filePath);
        if (res.ok) fileBuffer = Buffer.from(await res.arrayBuffer());
      } catch { /* fall through to fallback */ }
    } else {
      const normalizedRelativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const templatesDir = path.join(process.cwd(), 'public', 'templates');
      const absolutePath = path.join(process.cwd(), 'public', normalizedRelativePath);
      const publicRoot = path.join(process.cwd(), 'public');

      if (!absolutePath.startsWith(publicRoot)) {
        return NextResponse.json({ error: 'Path file tidak diizinkan' }, { status: 400 });
      }

      try {
        await access(absolutePath);
        const fs = await import('fs/promises');
        fileBuffer = Buffer.from(await fs.readFile(absolutePath));
      } catch { /* file not found */ }

      if (!fileBuffer) {
        const closestFileName = await findClosestTemplateFile(templatesDir, template.jenis_surat, template.nama, template.file_name);
        if (closestFileName) {
          const recoveredPath = path.join(templatesDir, closestFileName);
          try {
            await access(recoveredPath);
            const fs = await import('fs/promises');
            fileBuffer = Buffer.from(await fs.readFile(recoveredPath));
          } catch { /* fall through */ }
        }
      }
    }

    if (!fileBuffer) {
      const jenisKey = normalizeJenisValue(template.jenis_surat);
      const fallbackTemplate = DYNAMIC_SURAT_TEMPLATES.find(
        (item) => normalizeJenisValue(item.id) === jenisKey || normalizeJenisValue(item.jenisSurat) === jenisKey
      );

      if (fallbackTemplate) {
        const renderedHtml = renderTemplateWithValues(
          fallbackTemplate.htmlTemplate,
          buildSampleValues(fallbackTemplate.fields)
        );

        return new NextResponse(
          renderFallbackPlaceholderPage(template.nama, template.jenis_surat, renderedHtml),
          {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          }
        );
      }

      return NextResponse.json(
        { error: 'File template tidak ditemukan di server. Silakan upload ulang template ini.' },
        { status: 404 }
      );
    }

    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    const notes = result.messages.map((message) => String(message.message || message.type || 'Informasi konversi'));

    return new NextResponse(renderDocxPreviewPage(template.nama, result.value, notes), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json(
      {
        error: 'Gagal menampilkan preview template',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
