import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { uploadFile, uniqueStoragePath } from "@/lib/storage";

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
const ALLOWED_FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "gif"] as const

function isTableMissingError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("doesn't exist") || message.includes("unknown table");
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

function isAllowedUploadFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

function isUploadValidationError(message: string): boolean {
  return message.includes("Ukuran file") || message.includes("Format file") || message.includes("wajib diupload");
}

async function saveUploadedSuratMasuk(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");
  }

  if (!isAllowedUploadFile(file)) {
    throw new Error("Format file tidak valid. Gunakan file gambar, PDF, atau Word.");
  }

  const storagePath = uniqueStoragePath("uploads/surat-masuk", file.name || "surat-masuk.pdf");
  const bytes = await file.arrayBuffer();
  return uploadFile(storagePath, Buffer.from(bytes), file.type || undefined);
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

async function ensureSuratMasukUrgensiColumn() {
  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN urgensi VARCHAR(20) NOT NULL DEFAULT 'sedang' AFTER perihal`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }
}

async function ensureSuratMasukPenangananColumns() {
  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN status_penanganan VARCHAR(30) NOT NULL DEFAULT 'belum_ditangani' AFTER urgensi`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN ditangani_at DATETIME NULL AFTER status_penanganan`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  // Railway can already have this column as NOT NULL from older schema.
  // Ensure it is nullable so initial insert without handling metadata still works.
  try {
    await db.query(`ALTER TABLE surat_masuk MODIFY COLUMN ditangani_at DATETIME NULL`);
  } catch {
    // Ignore: some engines may reject no-op MODIFY depending on existing definition.
  }

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN ditangani_by_name VARCHAR(191) NULL AFTER ditangani_at`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN ditangani_by_id VARCHAR(64) NULL AFTER ditangani_at`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN catatan_penanganan TEXT NULL AFTER ditangani_by_name`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  // Normalize legacy strict schemas so initial insert is accepted on Railway.
  try {
    await db.query(`ALTER TABLE surat_masuk MODIFY COLUMN ditangani_by_id VARCHAR(64) NULL`);
  } catch {
    // Ignore no-op / engine-specific behavior.
  }

  try {
    await db.query(`ALTER TABLE surat_masuk MODIFY COLUMN ditangani_by_name VARCHAR(191) NULL`);
  } catch {
    // Ignore no-op / engine-specific behavior.
  }

  try {
    await db.query(`ALTER TABLE surat_masuk MODIFY COLUMN catatan_penanganan TEXT NULL`);
  } catch {
    // Ignore no-op / engine-specific behavior.
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
      urgensi VARCHAR(20) NOT NULL DEFAULT 'sedang',
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

  try {
    await db.query(`ALTER TABLE disposisi_surat_masuk ADD COLUMN urgensi VARCHAR(20) NOT NULL DEFAULT 'sedang' AFTER status`);
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
      await ensureSuratMasukUrgensiColumn();
    } catch (error) {
      console.warn("Warning: unable to ensure urgensi column on surat_masuk", error);
    }

    try {
      await ensureSuratMasukPenangananColumns();
    } catch (error) {
      console.warn("Warning: unable to ensure penanganan columns on surat_masuk", error);
    }

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
          sm.status_penanganan,
          sm.ditangani_at,
          sm.ditangani_by_name,
          u.nama as created_by_name,
          ds.tujuan_role as latest_disposisi_tujuan,
          ds.tujuan_label as latest_disposisi_tujuan_label,
          ds.status as latest_disposisi_status,
          ds.urgensi as latest_disposisi_urgensi,
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
    await ensureSuratMasukUrgensiColumn();

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Dokumen surat wajib diupload melalui form yang valid" },
        { status: 400 }
      );
    }

    let nomor_surat = "";
    let tanggal_surat = "";
    let tanggal_terima = "";
    let asal_surat = "";
    let perihal = "";
    let urgensi: UrgensiLevel = "sedang";
    let filePath: string | null = null;

    const formData = await request.formData();
    nomor_surat = String(formData.get("nomor_surat") || "").trim();
    tanggal_surat = String(formData.get("tanggal_surat") || "").trim();
    tanggal_terima = String(formData.get("tanggal_terima") || "").trim();
    asal_surat = String(formData.get("asal_surat") || "").trim();
    perihal = String(formData.get("perihal") || "").trim();
    urgensi = normalizeUrgensi(formData.get("urgensi"));

    const rawFile = formData.get("file_surat");
    if (rawFile instanceof File && rawFile.size > 0) {
      filePath = await saveUploadedSuratMasuk(rawFile);
    } else {
      return NextResponse.json(
        { success: false, error: "Dokumen surat wajib diupload sebelum data bisa disimpan" },
        { status: 400 }
      );
    }

    // Validasi input
    if (!nomor_surat || !tanggal_surat || !tanggal_terima || !asal_surat || !perihal) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "Dokumen surat wajib diupload sebelum data bisa disimpan" },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session/token
    // Untuk sementara, gunakan ID 1 (admin default)
    const created_by = 1;

    // Insert ke database
    const [result] = await db.query(
      `INSERT INTO surat_masuk 
       (nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, urgensi, file_path, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, urgensi, filePath, created_by]
    );

    return NextResponse.json({
      success: true,
      message: "Surat masuk berhasil ditambahkan",
      data: { id: (result as any).insertId },
    });
  } catch (error) {
    console.error("Error creating surat masuk:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan surat masuk";
    return NextResponse.json(
      { success: false, error: message },
      { status: isUploadValidationError(message) ? 400 : 500 }
    );
  }
}
