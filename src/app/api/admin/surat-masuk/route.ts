import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf"];
const SURAT_MASUK_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "surat-masuk");

function isTableMissingError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("doesn't exist") || message.includes("unknown table");
}

function isDuplicateColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("duplicate column") || message.includes("already exists");
}

function sanitizeFileName(originalName: string): string {
  return originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function saveUploadedSuratMasuk(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("Format file tidak valid. Gunakan file PDF.");
  }

  await mkdir(SURAT_MASUK_UPLOAD_DIR, { recursive: true });

  const safeFileName = sanitizeFileName(file.name || "surat-masuk.pdf");
  const storedFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${safeFileName}`;
  const absolutePath = path.join(SURAT_MASUK_UPLOAD_DIR, storedFileName);

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return `/uploads/surat-masuk/${storedFileName}`;
}

async function ensureSuratMasukFilePathColumn() {
  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN file_path VARCHAR(255) NULL AFTER perihal`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }
}

async function ensureDisposisiTable() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS disposisi_surat_masuk (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      surat_masuk_id VARCHAR(64) NOT NULL,
      tujuan_role VARCHAR(50) NOT NULL,
      tujuan_label VARCHAR(120) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'didisposisikan',
      catatan TEXT NULL,
      disposed_by_id VARCHAR(64) NULL,
      disposed_by_name VARCHAR(191) NULL,
      disposed_by_role VARCHAR(50) NULL,
      disposed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_disposisi_surat_masuk_id (surat_masuk_id),
      INDEX idx_disposisi_tujuan_role (tujuan_role),
      INDEX idx_disposisi_disposed_at (disposed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );

  try {
    await db.query(`ALTER TABLE disposisi_surat_masuk ADD COLUMN tujuan_label VARCHAR(120) NULL AFTER tujuan_role`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }
}

// GET - Ambil semua surat masuk
export async function GET(request: NextRequest) {
  try {
    try {
      await ensureDisposisiTable();
    } catch (error) {
      console.warn("Warning: unable to ensure disposisi_surat_masuk table", error);
    }

    let rows: RowDataPacket[] = [];

    try {
      const [result] = await db.query<RowDataPacket[]>(
        `SELECT 
          sm.*,
          u.nama as created_by_name,
          ds.tujuan_role as latest_disposisi_tujuan,
          ds.tujuan_label as latest_disposisi_tujuan_label,
          ds.status as latest_disposisi_status,
          ds.catatan as latest_disposisi_catatan,
          ds.disposed_at as latest_disposisi_at,
          ds.disposed_by_name as latest_disposisi_by,
          ds.disposed_by_role as latest_disposisi_by_role
        FROM surat_masuk sm
        LEFT JOIN users u ON sm.created_by = u.id
        LEFT JOIN disposisi_surat_masuk ds ON ds.id = (
          SELECT d2.id
          FROM disposisi_surat_masuk d2
          WHERE d2.surat_masuk_id = CAST(sm.id AS CHAR)
          ORDER BY d2.disposed_at DESC, d2.id DESC
          LIMIT 1
        )
        ORDER BY sm.tanggal_terima DESC, sm.created_at DESC`
      );

      rows = result;
    } catch (error) {
      if (!isTableMissingError(error)) {
        throw error;
      }

      const [fallbackRows] = await db.query<RowDataPacket[]>(
        `SELECT 
          sm.*,
          u.nama as created_by_name
        FROM surat_masuk sm
        LEFT JOIN users u ON sm.created_by = u.id
        ORDER BY sm.tanggal_terima DESC, sm.created_at DESC`
      );

      rows = fallbackRows;
    }

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching surat masuk:", error);
    const debugDetail =
      process.env.NODE_ENV === "development"
        ? String((error as { message?: string })?.message || error)
        : undefined;

    return NextResponse.json(
      { success: false, error: "Gagal mengambil data surat masuk", detail: debugDetail },
      { status: 500 }
    );
  }
}

// POST - Tambah surat masuk baru
export async function POST(request: NextRequest) {
  try {
    await ensureSuratMasukFilePathColumn();

    const contentType = request.headers.get("content-type") || "";
    let nomor_surat = "";
    let tanggal_surat = "";
    let tanggal_terima = "";
    let asal_surat = "";
    let perihal = "";
    let filePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      nomor_surat = String(formData.get("nomor_surat") || "").trim();
      tanggal_surat = String(formData.get("tanggal_surat") || "").trim();
      tanggal_terima = String(formData.get("tanggal_terima") || "").trim();
      asal_surat = String(formData.get("asal_surat") || "").trim();
      perihal = String(formData.get("perihal") || "").trim();

      const rawFile = formData.get("file_surat");
      if (rawFile instanceof File && rawFile.size > 0) {
        filePath = await saveUploadedSuratMasuk(rawFile);
      } else {
        return NextResponse.json(
          { success: false, error: "Dokumen surat wajib diupload dalam format PDF" },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      nomor_surat = String(body?.nomor_surat || "").trim();
      tanggal_surat = String(body?.tanggal_surat || "").trim();
      tanggal_terima = String(body?.tanggal_terima || "").trim();
      asal_surat = String(body?.asal_surat || "").trim();
      perihal = String(body?.perihal || "").trim();
      filePath = typeof body?.file_path === "string" && body.file_path.trim() ? body.file_path.trim() : null;
    }

    // Validasi input
    if (!nomor_surat || !tanggal_surat || !tanggal_terima || !asal_surat || !perihal) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session/token
    // Untuk sementara, gunakan ID 1 (admin default)
    const created_by = 1;

    // Insert ke database
    const [result] = await db.query(
      `INSERT INTO surat_masuk 
       (nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, file_path, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, filePath, created_by]
    );

    return NextResponse.json({
      success: true,
      message: "Surat masuk berhasil ditambahkan",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating surat masuk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan surat masuk" },
      { status: 500 }
    );
  }
}
