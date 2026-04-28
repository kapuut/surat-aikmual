import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { normalizeSuratSlug } from "@/lib/surat-data";
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
const SURAT_KELUAR_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "surat-keluar");

function isUnknownColumnError(error: unknown): boolean {
  return String((error as any)?.message || "").toLowerCase().includes("unknown column");
}

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== "string") return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function isGeneratedSuratFile(filePath: string | null): boolean {
  if (!filePath) return false;
  const normalized = filePath.toLowerCase();
  return normalized.includes("/generated-surat/") || normalized.endsWith(".html") || normalized.includes(".html?");
}

function sanitizeFileName(originalName: string): string {
  const normalized = path.basename(originalName || "surat-keluar")
    .replace(/[^a-zA-Z0-9_.()\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "surat-keluar";
}

function isAllowedUploadFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

function isUploadValidationError(message: string): boolean {
  return message.includes("Ukuran file") || message.includes("Format file") || message.includes("wajib diupload");
}

async function getAvailableFileName(fileName: string): Promise<string> {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  let candidate = fileName;
  let index = 1;

  while (true) {
    try {
      await access(path.join(SURAT_KELUAR_UPLOAD_DIR, candidate));
      candidate = `${baseName} (${index})${extension}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

async function saveUploadedSuratKeluar(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");
  }

  if (!isAllowedUploadFile(file)) {
    throw new Error("Format file tidak valid. Gunakan file gambar, PDF, atau Word.");
  }

  await mkdir(SURAT_KELUAR_UPLOAD_DIR, { recursive: true });

  const safeFileName = sanitizeFileName(file.name || "surat-keluar.pdf");
  const storedFileName = await getAvailableFileName(safeFileName);
  const absolutePath = path.join(SURAT_KELUAR_UPLOAD_DIR, storedFileName);

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return `/uploads/surat-keluar/${storedFileName}`;
}

function normalizeStatus(value: unknown): "Draft" | "Menunggu" | "Terkirim" {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "Terkirim";
  if (["draft", "draf"].includes(text)) return "Draft";
  if (["pending", "menunggu", "proses", "diproses"].includes(text)) return "Menunggu";
  return "Terkirim";
}

function normalizeWorkflowStatusValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isEligiblePermohonanForSuratKeluar(status: unknown): boolean {
  const normalizedStatus = normalizeWorkflowStatusValue(status);
  if (!normalizedStatus) return true;

  const excludedStatuses = new Set([
    "pending",
    "diproses",
    "dikirim_ke_kepala_desa",
    "perlu_revisi",
    "ditolak",
  ]);

  return !excludedStatuses.has(normalizedStatus);
}

function getJenisKeyFromPerihal(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "unknown";

  const head = text.split(" - ")[0]?.trim() || text;
  const normalized = normalizeSuratSlug(head) || normalizeSuratSlug(text);
  return normalized || head.toLowerCase();
}

function normalizeSyncSegment(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePerihalDetail(value: unknown): string {
  const normalized = normalizeSyncSegment(value)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .trim();

  if (!normalized) return "";
  if (/^-+$/.test(normalized)) return "";
  if (["-", "--", "null", "undefined", "n/a", "na"].includes(normalized)) return "";

  return normalized;
}

function getDetailKeyFromPerihal(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const parts = text.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return "";

  return normalizePerihalDetail(parts.slice(1).join(" - "));
}

function createSyncKey(nomorSurat: unknown, jenisValue: unknown, detailValue: unknown = ""): string {
  const nomor = normalizeSyncSegment(nomorSurat);
  const jenis = normalizeSyncSegment(jenisValue);
  const detail = normalizePerihalDetail(detailValue);
  return `${nomor}||${jenis}||${detail}`;
}

function createSyncKeyPrefix(nomorSurat: unknown, jenisValue: unknown): string {
  const nomor = normalizeSyncSegment(nomorSurat);
  const jenis = normalizeSyncSegment(jenisValue);
  return `${nomor}||${jenis}||`;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    if (!["admin", "sekretaris", "kepala_desa"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const queryVariants = [
      `SELECT
        sk.id,
        sk.nomor_surat,
        sk.tanggal,
        sk.tanggal_surat,
        sk.tujuan,
        sk.perihal,
        sk.file_path,
        sk.status,
        sk.created_by,
        sk.created_at,
        u.nama AS created_by_name
      FROM surat_keluar sk
      LEFT JOIN users u ON sk.created_by = u.id
      ORDER BY sk.created_at DESC`,
      `SELECT
        sk.id,
        sk.nomor_surat,
        sk.tanggal_surat,
        sk.tujuan,
        sk.perihal,
        sk.file_path,
        sk.status,
        sk.created_by,
        sk.created_at,
        u.nama AS created_by_name
      FROM surat_keluar sk
      LEFT JOIN users u ON sk.created_by = u.id
      ORDER BY sk.created_at DESC`,
      `SELECT
        sk.id,
        sk.nomor_surat,
        sk.tanggal_surat,
        sk.tujuan,
        sk.perihal,
        sk.file_path,
        sk.created_by,
        sk.created_at,
        u.nama AS created_by_name
      FROM surat_keluar sk
      LEFT JOIN users u ON sk.created_by = u.id
      ORDER BY sk.created_at DESC`,
    ];

    let rows: RowDataPacket[] = [];
    let lastError: unknown = null;

    for (const query of queryVariants) {
      try {
        const [result] = await db.query<RowDataPacket[]>(query);
        rows = result;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isUnknownColumnError(error)) {
          throw error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    const data = rows.map((row) => {
      const tanggal = (row as any).tanggal ?? (row as any).tanggal_surat ?? (row as any).created_at;
      const normalizedFilePath = normalizeFilePath((row as any).file_path);
      return {
        id: Number((row as any).id),
        nomor_surat: (row as any).nomor_surat || "-",
        tanggal_surat: tanggal,
        tujuan: (row as any).tujuan || "Pemohon",
        perihal: (row as any).perihal || "-",
        file_path: normalizedFilePath,
        status: normalizeStatus((row as any).status),
        created_by_name: (row as any).created_by_name || null,
        source_type: (isGeneratedSuratFile(normalizedFilePath) ? "permohonan" : "manual") as const,
      };
    });

    const permohonanQueryVariants = [
      `SELECT
        p.id,
        p.nomor_surat,
        p.jenis_surat,
        p.keperluan,
        p.nama_pemohon,
        p.file_path,
        p.status,
        p.updated_at,
        p.created_at
      FROM permohonan_surat p
      WHERE p.nomor_surat IS NOT NULL
        AND p.nomor_surat <> ''`,
      `SELECT
        p.id,
        p.nomor_surat,
        p.jenis_surat,
        p.keperluan,
        p.nama_pemohon,
        p.dokumen_path AS file_path,
        p.status,
        p.updated_at,
        p.created_at
      FROM permohonan_surat p
      WHERE p.nomor_surat IS NOT NULL
        AND p.nomor_surat <> ''`,
    ];

    let permohonanRows: RowDataPacket[] = [];
    let permohonanError: unknown = null;

    for (const query of permohonanQueryVariants) {
      try {
        const [result] = await db.query<RowDataPacket[]>(query);
        permohonanRows = result;
        permohonanError = null;
        break;
      } catch (error) {
        permohonanError = error;
        if (!isUnknownColumnError(error)) {
          throw error;
        }
      }
    }

    if (permohonanError && !permohonanRows.length) {
      throw permohonanError;
    }

    const merged = new Map<string, {
      id: number;
      nomor_surat: string;
      tanggal_surat: unknown;
      tujuan: string;
      perihal: string;
      file_path: string | null;
      status: "Draft" | "Menunggu" | "Terkirim";
      created_by_name: string | null;
      source_type: "manual" | "permohonan";
      source_permohonan_id: number | null;
    }>();

    data.forEach((item) => {
      const jenisKey = getJenisKeyFromPerihal(item.perihal);
      const detailKey = getDetailKeyFromPerihal(item.perihal);
      const key = createSyncKey(item.nomor_surat, jenisKey, detailKey);
      merged.set(key, {
        ...item,
        source_permohonan_id: null,
      });
    });

    permohonanRows.forEach((row) => {
      const nomorSurat = String((row as any).nomor_surat || "").trim();
      if (!nomorSurat) return;
      if (!isEligiblePermohonanForSuratKeluar((row as any).status)) return;

      const jenisSurat = String((row as any).jenis_surat || "").trim();
      const keperluan = String((row as any).keperluan || "").trim();
      const normalizedKeperluan = normalizePerihalDetail(keperluan);
      const displayKeperluan = normalizedKeperluan || "";
      const perihal = `${jenisSurat || "surat"}${displayKeperluan ? ` - ${displayKeperluan}` : ""}`;
      const filePath = normalizeFilePath((row as any).file_path);
      const tujuan = String((row as any).nama_pemohon || "Pemohon").trim() || "Pemohon";
      const tanggal = (row as any).updated_at ?? (row as any).created_at ?? null;
      const key = createSyncKey(
        nomorSurat,
        normalizeSuratSlug(jenisSurat) || jenisSurat.toLowerCase(),
        normalizedKeperluan
      );

      const fallbackItem = {
        id: Number((row as any).id) * -1,
        nomor_surat: nomorSurat,
        tanggal_surat: tanggal,
        tujuan,
        perihal,
        file_path: filePath,
        status: normalizeStatus((row as any).status),
        created_by_name: null,
        source_type: "permohonan" as const,
        source_permohonan_id: Number((row as any).id) || null,
      };

      let existing = merged.get(key);
      if (!existing) {
        const fallbackPrefix = createSyncKeyPrefix(
          nomorSurat,
          normalizeSuratSlug(jenisSurat) || jenisSurat.toLowerCase()
        );
        const matchedKey = Array.from(merged.keys()).find((existingKey) => existingKey.startsWith(fallbackPrefix));
        if (matchedKey) {
          existing = merged.get(matchedKey);
        }
      }

      if (!existing) {
        merged.set(key, fallbackItem);
        return;
      }

      existing.source_type = "permohonan";
      existing.source_permohonan_id = Number((row as any).id) || existing.source_permohonan_id;

      if (!existing.file_path && fallbackItem.file_path) {
        existing.file_path = fallbackItem.file_path;
      }

      if (existing.status !== "Terkirim" && fallbackItem.status === "Terkirim") {
        existing.status = "Terkirim";
      }

      if (!existing.tanggal_surat && fallbackItem.tanggal_surat) {
        existing.tanggal_surat = fallbackItem.tanggal_surat;
      }

      merged.set(key, existing);
    });

    const mergedData = Array.from(merged.values()).sort((a, b) => {
      const timeA = new Date(String(a.tanggal_surat || "1970-01-01")).getTime();
      const timeB = new Date(String(b.tanggal_surat || "1970-01-01")).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      data: mergedData,
      total: mergedData.length,
    });
  } catch (error) {
    console.error("Error fetching surat keluar:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data surat keluar" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    if (![
      "admin",
      "sekretaris",
      "kepala_desa",
    ].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let nomor_surat = "";
    let tanggal_surat = "";
    let tujuan = "";
    let perihal = "";
    let status = "Terkirim";
    let newFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      nomor_surat = String(formData.get("nomor_surat") || "").trim();
      tanggal_surat = String(formData.get("tanggal_surat") || "").trim();
      tujuan = String(formData.get("tujuan") || "").trim();
      perihal = String(formData.get("perihal") || "").trim();
      status = String(formData.get("status") || "Terkirim").trim() || "Terkirim";

      const rawFile = formData.get("file_surat");
      if (!(rawFile instanceof File) || rawFile.size === 0) {
        throw new Error("Dokumen surat wajib diupload sebelum disimpan.");
      }
      newFilePath = await saveUploadedSuratKeluar(rawFile);
    } else {
      const body = await request.json();
      nomor_surat = String(body?.nomor_surat || "").trim();
      tanggal_surat = String(body?.tanggal_surat || "").trim();
      tujuan = String(body?.tujuan || "").trim();
      perihal = String(body?.perihal || "").trim();
      status = String(body?.status || "Terkirim").trim() || "Terkirim";
      newFilePath = normalizeFilePath(body?.file_path);
      if (!newFilePath) {
        throw new Error("Dokumen surat wajib diupload sebelum disimpan.");
      }
    }

    if (!nomor_surat || !tanggal_surat || !tujuan || !perihal) {
      return NextResponse.json({ success: false, error: "Semua field wajib diisi" }, { status: 400 });
    }

    const allowedStatus = new Set(["Draft", "Menunggu", "Terkirim"]);
    const safeStatus = allowedStatus.has(status) ? status : "Terkirim";
    const createdBy = Number((user as any)?.id) || null;
    const insertVariants = [
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal_surat, tujuan, perihal, status, file_path, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath, createdBy],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal, tujuan, perihal, status, file_path, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath, createdBy],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal_surat, tujuan, perihal, file_path, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath, createdBy],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal, tujuan, perihal, file_path, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath, createdBy],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal_surat, tujuan, perihal, status, file_path)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal, tujuan, perihal, status, file_path)
                VALUES (?, ?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal_surat, tujuan, perihal, file_path)
                VALUES (?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath],
      },
      {
        query: `INSERT INTO surat_keluar (nomor_surat, tanggal, tujuan, perihal, file_path)
                VALUES (?, ?, ?, ?, ?)`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath],
      },
    ];

    let result: ResultSetHeader | null = null;
    let lastError: unknown = null;

    for (const variant of insertVariants) {
      try {
        const [inserted] = await db.query<ResultSetHeader>(variant.query, variant.params);
        result = inserted;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isUnknownColumnError(error)) {
          throw error;
        }
      }
    }

    if (lastError && !result) {
      throw lastError;
    }

    return NextResponse.json({
      success: true,
      message: "Data surat keluar fisik berhasil disimpan",
      data: {
        id: result?.insertId || null,
      },
    });
  } catch (error) {
    console.error("Error creating surat keluar:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan surat keluar";
    return NextResponse.json({ success: false, error: message }, { status: isUploadValidationError(message) ? 400 : 500 });
  }
}
