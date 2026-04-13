import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { TemplateField } from "@/lib/template-surat/types";

type DynamicTemplateRow = {
  id: string;
  nama: string;
  jenis_surat: string;
  deskripsi: string;
  fields_json: string;
};

function parseFieldsJson(value: unknown): TemplateField[] {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => item as TemplateField);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [rows] = await db.execute(
      `SELECT id, nama, jenis_surat, deskripsi, fields_json
       FROM dynamic_template_surat
       WHERE status = 'aktif'
       ORDER BY updated_at DESC`
    );

    const templates = (rows as DynamicTemplateRow[]).map((row) => ({
      id: row.id,
      nama: row.nama,
      jenisSurat: row.jenis_surat,
      deskripsi: row.deskripsi,
      fields: parseFieldsJson(row.fields_json),
    }));

    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    const message = String((error as { message?: unknown })?.message || "").toLowerCase();

    // If table does not exist yet, return an empty list instead of failing the page.
    if (message.includes("doesn't exist") || message.includes("does not exist")) {
      return NextResponse.json({ success: true, templates: [] });
    }

    console.error("Public dynamic templates GET error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil template dinamis" },
      { status: 500 }
    );
  }
}
