import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { db } from "@/lib/db";
import type { TemplateField, TemplateFieldType } from "@/lib/template-surat/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const ALLOWED_FIELD_TYPES: TemplateFieldType[] = ["text", "number", "date", "textarea", "select"];
const FIELD_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

type JwtPayload = {
  userId?: string;
  role?: string;
};

type DynamicTemplateRow = {
  id: string;
  nama: string;
  jenis_surat: string;
  deskripsi: string;
  html_template: string;
  fields_json: string;
};

async function ensureAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  try {
    const decoded = verify(token.value, JWT_SECRET) as JwtPayload;
    if (decoded.role !== "admin") {
      return { ok: false as const, status: 403, error: "Forbidden - Admin only" };
    }

    return { ok: true as const, userId: decoded.userId || null };
  } catch {
    return { ok: false as const, status: 401, error: "Token tidak valid" };
  }
}

async function ensureDynamicTemplateTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS dynamic_template_surat (
      id VARCHAR(150) PRIMARY KEY,
      nama VARCHAR(200) NOT NULL,
      jenis_surat VARCHAR(200) NOT NULL,
      deskripsi TEXT NOT NULL,
      html_template LONGTEXT NOT NULL,
      fields_json LONGTEXT NOT NULL,
      status ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
      created_by VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

function sanitizeTemplateId(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "surat-baru";
}

function parseTemplateFields(input: unknown): TemplateField[] {
  if (!Array.isArray(input)) {
    throw new Error("Field placeholder harus berupa array");
  }

  const seenNames = new Set<string>();
  const fields: TemplateField[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const name = String(candidate.name || "").trim();
    const label = String(candidate.label || "").trim();
    const type = String(candidate.type || "text").trim() as TemplateFieldType;
    const required = Boolean(candidate.required);
    const placeholder = String(candidate.placeholder || "").trim();

    if (!name || !label) {
      continue;
    }

    if (!FIELD_NAME_REGEX.test(name)) {
      throw new Error(`Nama field '${name}' tidak valid. Gunakan huruf/angka/underscore dan mulai dengan huruf.`);
    }

    if (!ALLOWED_FIELD_TYPES.includes(type)) {
      throw new Error(`Tipe field '${type}' tidak didukung.`);
    }

    if (seenNames.has(name)) {
      throw new Error(`Nama field '${name}' duplikat.`);
    }
    seenNames.add(name);

    const normalizedField: TemplateField = {
      name,
      label,
      type,
      required,
      placeholder: placeholder || undefined,
    };

    if (type === "select") {
      const rawOptions = Array.isArray(candidate.options) ? candidate.options : [];
      const options = rawOptions
        .map((opt) => {
          if (!opt || typeof opt !== "object") return null;
          const optionObj = opt as Record<string, unknown>;
          const optionLabel = String(optionObj.label || "").trim();
          const optionValue = String(optionObj.value || "").trim();
          if (!optionLabel || !optionValue) return null;
          return { label: optionLabel, value: optionValue };
        })
        .filter((opt): opt is { label: string; value: string } => Boolean(opt));

      if (options.length === 0) {
        throw new Error(`Field select '${name}' wajib memiliki opsi.`);
      }

      normalizedField.options = options;
    }

    fields.push(normalizedField);
  }

  if (fields.length === 0) {
    throw new Error("Minimal satu field placeholder harus diisi.");
  }

  return fields;
}

function parseStoredFields(value: unknown): TemplateField[] {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return parseTemplateFields(parsed);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    await ensureDynamicTemplateTable();
    const [rows] = await db.execute(
      `SELECT id, nama, jenis_surat, deskripsi, html_template, fields_json
       FROM dynamic_template_surat
       WHERE status = 'aktif'
       ORDER BY updated_at DESC`
    );

    const templates = (rows as DynamicTemplateRow[]).map((row) => ({
      id: row.id,
      nama: row.nama,
      jenisSurat: row.jenis_surat,
      deskripsi: row.deskripsi,
      htmlTemplate: row.html_template,
      fields: parseStoredFields(row.fields_json),
    }));

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Dynamic templates GET error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil template dinamis" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const nama = String(body?.nama || "").trim();
    const jenisSurat = String(body?.jenisSurat || "").trim();
    const deskripsi = String(body?.deskripsi || "").trim();
    const htmlTemplate = String(body?.htmlTemplate || "").trim();

    if (!nama || !jenisSurat || !deskripsi || !htmlTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama template, jenis surat, deskripsi, dan isi template wajib diisi.",
        },
        { status: 400 }
      );
    }

    const fields = parseTemplateFields(body?.fields);
    await ensureDynamicTemplateTable();

    const templateId = `custom-${sanitizeTemplateId(jenisSurat)}-${Date.now()}`;

    await db.execute(
      `
        INSERT INTO dynamic_template_surat
        (id, nama, jenis_surat, deskripsi, html_template, fields_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [templateId, nama, jenisSurat, deskripsi, htmlTemplate, JSON.stringify(fields), auth.userId]
    );

    return NextResponse.json({
      success: true,
      message: "Jenis surat dinamis berhasil ditambahkan.",
      template: {
        id: templateId,
        nama,
        jenisSurat,
        deskripsi,
        htmlTemplate,
        fields,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah template dinamis";
    console.error("Dynamic templates POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await ensureAdminAuth();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const templateId = String(body?.id || "").trim();
    const nama = String(body?.nama || "").trim();
    const jenisSurat = String(body?.jenisSurat || "").trim();
    const deskripsi = String(body?.deskripsi || "").trim();
    const htmlTemplate = String(body?.htmlTemplate || "").trim();

    if (!templateId || !nama || !jenisSurat || !deskripsi || !htmlTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: "ID template, nama, jenis surat, deskripsi, dan isi template wajib diisi.",
        },
        { status: 400 }
      );
    }

    const fields = parseTemplateFields(body?.fields);
    await ensureDynamicTemplateTable();

    // UPSERT: handles both default static templates (never in DB) and custom ones
    await db.execute(
      `
        INSERT INTO dynamic_template_surat
          (id, nama, jenis_surat, deskripsi, html_template, fields_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nama = VALUES(nama),
          jenis_surat = VALUES(jenis_surat),
          deskripsi = VALUES(deskripsi),
          html_template = VALUES(html_template),
          fields_json = VALUES(fields_json),
          updated_at = NOW()
      `,
      [templateId, nama, jenisSurat, deskripsi, htmlTemplate, JSON.stringify(fields), auth.userId]
    );

    return NextResponse.json({
      success: true,
      message: "Template dinamis berhasil diperbarui.",
      template: {
        id: templateId,
        nama,
        jenisSurat,
        deskripsi,
        htmlTemplate,
        fields,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui template dinamis";
    console.error("Dynamic templates PUT error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
