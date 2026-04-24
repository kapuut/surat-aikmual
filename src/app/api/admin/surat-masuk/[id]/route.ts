import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { access, mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
const ALLOWED_FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "gif"] as const;
const SURAT_MASUK_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "surat-masuk");

type UrgensiLevel = "rendah" | "sedang" | "tinggi";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function sanitizeFileName(originalName: string): string {
  const normalized = path.basename(originalName || "surat-masuk")
    .replace(/[^a-zA-Z0-9_.()\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "surat-masuk";
}

async function getAvailableFileName(fileName: string): Promise<string> {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  let candidate = fileName;
  let index = 1;

  while (true) {
    try {
      await access(path.join(SURAT_MASUK_UPLOAD_DIR, candidate));
      candidate = `${baseName} (${index})${extension}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

function isAllowedUploadFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

function isUploadValidationError(message: string): boolean {
  return message.includes("Ukuran file") || message.includes("Format file") || message.includes("wajib diupload");
}

function isDuplicateColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("duplicate column") || message.includes("already exists");
}

function normalizeUrgensi(rawValue: unknown): UrgensiLevel {
  const value = String(rawValue || "").trim().toLowerCase();

  if (["tinggi", "high", "urgent", "darurat"].includes(value)) {
    return "tinggi";
  }

  if (["rendah", "low"].includes(value)) {
    return "rendah";
  }

  return "sedang";
}

async function ensureSuratMasukUrgensiColumn() {
  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN urgensi VARCHAR(20) NOT NULL DEFAULT 'sedang' AFTER perihal`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }
}

async function saveUploadedSuratMasuk(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");
  }

  if (!isAllowedUploadFile(file)) {
    throw new Error("Format file tidak valid. Gunakan file gambar, PDF, atau Word.");
  }

  await mkdir(SURAT_MASUK_UPLOAD_DIR, { recursive: true });

  const safeFileName = sanitizeFileName(file.name || "surat-masuk.pdf");
  const storedFileName = await getAvailableFileName(safeFileName);
  const absolutePath = path.join(SURAT_MASUK_UPLOAD_DIR, storedFileName);

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return `/uploads/surat-masuk/${storedFileName}`;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSuratMasukUrgensiColumn();

    const suratId = parseId(params.id);
    if (!suratId) {
      return NextResponse.json(
        { success: false, error: "ID surat masuk tidak valid" },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        sm.*,
        u.nama AS created_by_name
      FROM surat_masuk sm
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.id = ?
      LIMIT 1`,
      [suratId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Data surat masuk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching surat masuk detail:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail surat masuk" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSuratMasukUrgensiColumn();

    const suratId = parseId(params.id);
    if (!suratId) {
      return NextResponse.json(
        { success: false, error: "ID surat masuk tidak valid" },
        { status: 400 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let nomor_surat = "";
    let tanggal_surat = "";
    let tanggal_terima = "";
    let asal_surat = "";
    let perihal = "";
    let urgensi: UrgensiLevel = "sedang";
    let newFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      nomor_surat = String(formData.get("nomor_surat") || "").trim();
      tanggal_surat = String(formData.get("tanggal_surat") || "").trim();
      tanggal_terima = String(formData.get("tanggal_terima") || "").trim();
      asal_surat = String(formData.get("asal_surat") || "").trim();
      perihal = String(formData.get("perihal") || "").trim();
      urgensi = normalizeUrgensi(formData.get("urgensi"));

      const rawFile = formData.get("file_surat");
      if (rawFile instanceof File && rawFile.size > 0) {
        newFilePath = await saveUploadedSuratMasuk(rawFile);
      }
    } else {
      const body = await request.json();
      nomor_surat = String(body?.nomor_surat || "").trim();
      tanggal_surat = String(body?.tanggal_surat || "").trim();
      tanggal_terima = String(body?.tanggal_terima || "").trim();
      asal_surat = String(body?.asal_surat || "").trim();
      perihal = String(body?.perihal || "").trim();
      urgensi = normalizeUrgensi(body?.urgensi);
      newFilePath = typeof body?.file_path === "string" && body.file_path.trim() ? body.file_path.trim() : null;
    }

    if (!nomor_surat || !tanggal_surat || !tanggal_terima || !asal_surat || !perihal) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE surat_masuk
       SET nomor_surat = ?, tanggal_surat = ?, tanggal_terima = ?, asal_surat = ?, perihal = ?, urgensi = ?, file_path = COALESCE(?, file_path)
       WHERE id = ?`,
      [nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, urgensi, newFilePath, suratId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Data surat masuk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Surat masuk berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating surat masuk:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui surat masuk";
    return NextResponse.json(
      { success: false, error: message },
      { status: isUploadValidationError(message) ? 400 : 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const suratId = parseId(params.id);
    if (!suratId) {
      return NextResponse.json(
        { success: false, error: "ID surat masuk tidak valid" },
        { status: 400 }
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      `DELETE FROM surat_masuk WHERE id = ?`,
      [suratId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Data surat masuk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Surat masuk berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting surat masuk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus surat masuk" },
      { status: 500 }
    );
  }
}
