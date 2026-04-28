import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { normalizeSuratSlug } from "@/lib/surat-data";
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
const ALLOWED_FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "gif"] as const;

type RouteContext = {
  params: {
    id: string;
  };
};

function isUnknownColumnError(error: unknown): boolean {
  return String((error as { message?: string })?.message || "").toLowerCase().includes("unknown column");
}

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id === 0) {
    return null;
  }

  return id;
}

function normalizeFilePath(rawValue: unknown): string | null {
  if (typeof rawValue !== "string") return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  let candidate: string | null = trimmed;

  if (trimmed.startsWith("[") || trimmed.startsWith("\"")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const first = parsed.find((item) => typeof item === "string" && item.trim());
        candidate = typeof first === "string" ? first.trim() : null;
      } else if (typeof parsed === "string" && parsed.trim()) {
        candidate = parsed.trim();
      }
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  if (!candidate || candidate === "[]") return null;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function normalizeFilePaths(rawValue: unknown): string[] {
  if (typeof rawValue !== "string") return [];
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === "[]") return [];

  let candidates: unknown[] = [trimmed];
  if (trimmed.startsWith("[") || trimmed.startsWith("\"")) {
    try {
      const parsed = JSON.parse(trimmed);
      candidates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Keep original value when JSON parsing fails.
    }
  }

  const normalized = candidates
    .map((item) => normalizeFilePath(item))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
}

function isGeneratedSuratFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  const lowerPath = pathValue.toLowerCase();
  return lowerPath.includes("/generated-surat/") || lowerPath.endsWith(".html") || lowerPath.includes(".html?");
}

function isAttachmentFile(pathValue: string | null): boolean {
  if (!pathValue) return false;
  return pathValue.includes("/uploads/");
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


function isAllowedUploadFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

function isUploadValidationError(message: string): boolean {
  return message.includes("Ukuran file") || message.includes("Format file") || message.includes("wajib diupload");
}

async function saveUploadedSuratKeluar(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");
  }

  if (!isAllowedUploadFile(file)) {
    throw new Error("Format file tidak valid. Gunakan file gambar, PDF, atau Word.");
  }

  const storagePath = uniqueStoragePath("uploads/surat-keluar", file.name || "surat-keluar.pdf");
  const bytes = await file.arrayBuffer();
  return uploadFile(storagePath, Buffer.from(bytes), file.type || undefined);
}

async function authenticateRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const user = await getUser(token);
  if (!user) {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  if (!["admin", "sekretaris", "kepala_desa"].includes(user.role)) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, user };
}

async function findSuratKeluarById(id: number): Promise<RowDataPacket | null> {
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
    WHERE sk.id = ?
    LIMIT 1`,
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
    WHERE sk.id = ?
    LIMIT 1`,
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
    WHERE sk.id = ?
    LIMIT 1`,
  ];

  let lastError: unknown = null;
  for (const query of queryVariants) {
    try {
      const [rows] = await db.query<RowDataPacket[]>(query, [id]);
      return rows[0] || null;
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

  return null;
}

async function findPermohonanOutgoingById(id: number): Promise<RowDataPacket | null> {
  const queryVariants = [
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
    WHERE p.id = ?
      AND p.nomor_surat IS NOT NULL
      AND p.nomor_surat <> ''
    LIMIT 1`,
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
    WHERE p.id = ?
      AND p.nomor_surat IS NOT NULL
      AND p.nomor_surat <> ''
    LIMIT 1`,
  ];

  let lastError: unknown = null;
  for (const query of queryVariants) {
    try {
      const [rows] = await db.query<RowDataPacket[]>(query, [id]);
      return rows[0] || null;
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

  return null;
}

function mapSuratKeluarDetail(row: RowDataPacket) {
  const candidatePaths = normalizeFilePaths((row as { file_path?: unknown }).file_path);
  const generatedPath = candidatePaths.find((pathValue) => isGeneratedSuratFile(pathValue)) || null;
  const primaryPath = generatedPath || candidatePaths[0] || normalizeFilePath((row as { file_path?: unknown }).file_path);
  const attachmentPaths = candidatePaths
    .filter((pathValue) => isAttachmentFile(pathValue))
    .filter((pathValue) => pathValue !== primaryPath);

  const tanggal = (row as { tanggal?: unknown; tanggal_surat?: unknown; created_at?: unknown }).tanggal
    ?? (row as { tanggal_surat?: unknown }).tanggal_surat
    ?? (row as { created_at?: unknown }).created_at;

  return {
    id: Number((row as { id?: unknown }).id),
    nomor_surat: String((row as { nomor_surat?: unknown }).nomor_surat || "-"),
    tanggal_surat: tanggal,
    tujuan: String((row as { tujuan?: unknown }).tujuan || "Pemohon"),
    perihal: String((row as { perihal?: unknown }).perihal || "-"),
    file_path: primaryPath,
    attachment_paths: attachmentPaths,
    status: normalizeStatus((row as { status?: unknown }).status),
    created_by_name: (row as { created_by_name?: unknown }).created_by_name
      ? String((row as { created_by_name?: unknown }).created_by_name)
      : null,
    is_auto_from_permohonan: false,
  };
}

function mapPermohonanToSuratKeluarDetail(row: RowDataPacket) {
  const candidatePaths = normalizeFilePaths((row as { file_path?: unknown }).file_path);
  const generatedPath = candidatePaths.find((pathValue) => isGeneratedSuratFile(pathValue)) || null;
  const primaryPath = generatedPath || candidatePaths[0] || normalizeFilePath((row as { file_path?: unknown }).file_path);
  const attachmentPaths = candidatePaths
    .filter((pathValue) => isAttachmentFile(pathValue))
    .filter((pathValue) => pathValue !== primaryPath);

  const jenisSurat = String((row as { jenis_surat?: unknown }).jenis_surat || "").trim();
  const keperluan = String((row as { keperluan?: unknown }).keperluan || "").trim();
  const perihal = `${jenisSurat || "surat"}${keperluan ? ` - ${keperluan}` : ""}`;
  const tanggal = (row as { updated_at?: unknown; created_at?: unknown }).updated_at
    ?? (row as { created_at?: unknown }).created_at;

  return {
    id: Number((row as { id?: unknown }).id) * -1,
    nomor_surat: String((row as { nomor_surat?: unknown }).nomor_surat || "-"),
    tanggal_surat: tanggal,
    tujuan: String((row as { nama_pemohon?: unknown }).nama_pemohon || "Pemohon"),
    perihal,
    file_path: primaryPath,
    attachment_paths: attachmentPaths,
    status: normalizeStatus((row as { status?: unknown }).status),
    created_by_name: null,
    is_auto_from_permohonan: true,
    jenis_key: normalizeSuratSlug(jenisSurat) || jenisSurat.toLowerCase(),
  };
}

function mapOutgoingStatusToWorkflowStatus(value: string): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "draft") return "diproses";
  if (normalized === "menunggu") return "dikirim_ke_kepala_desa";
  return "selesai";
}

function splitPerihalToJenisAndKeperluan(
  perihal: string,
  fallbackJenis: string,
  fallbackKeperluan: string
): { jenisSurat: string; keperluan: string } {
  const cleaned = String(perihal || "").trim();
  if (!cleaned) {
    return { jenisSurat: fallbackJenis, keperluan: fallbackKeperluan };
  }

  const parts = cleaned.split(" - ").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      jenisSurat: parts[0] || fallbackJenis,
      keperluan: parts.slice(1).join(" - "),
    };
  }

  return {
    jenisSurat: fallbackJenis || parts[0] || "Surat",
    keperluan: fallbackKeperluan || cleaned,
  };
}

async function updatePermohonanFromSuratKeluarPayload(payload: {
  permohonanId: number;
  nomor_surat: string;
  tujuan: string;
  perihal: string;
  status: string;
  file_path: string | null;
}): Promise<boolean> {
  const existing = await findPermohonanOutgoingById(payload.permohonanId);
  if (!existing) {
    return false;
  }

  const fallbackJenis = String((existing as { jenis_surat?: unknown }).jenis_surat || "").trim();
  const fallbackKeperluan = String((existing as { keperluan?: unknown }).keperluan || "").trim();
  const { jenisSurat, keperluan } = splitPerihalToJenisAndKeperluan(payload.perihal, fallbackJenis, fallbackKeperluan);
  const workflowStatus = mapOutgoingStatusToWorkflowStatus(payload.status);

  const updateVariants = [
    {
      query: `UPDATE permohonan_surat
              SET nomor_surat = ?,
                  nama_pemohon = ?,
                  jenis_surat = ?,
                  keperluan = ?,
                  status = ?,
                  file_path = COALESCE(?, file_path),
                  updated_at = NOW()
              WHERE id = ?`,
      params: [payload.nomor_surat, payload.tujuan, jenisSurat, keperluan, workflowStatus, payload.file_path, payload.permohonanId],
    },
    {
      query: `UPDATE permohonan_surat
              SET nomor_surat = ?,
                  nama_pemohon = ?,
                  jenis_surat = ?,
                  keperluan = ?,
                  status = ?,
                  dokumen_path = COALESCE(?, dokumen_path),
                  updated_at = NOW()
              WHERE id = ?`,
      params: [payload.nomor_surat, payload.tujuan, jenisSurat, keperluan, workflowStatus, payload.file_path, payload.permohonanId],
    },
    {
      query: `UPDATE permohonan_surat
              SET nomor_surat = ?,
                  nama_pemohon = ?,
                  jenis_surat = ?,
                  keperluan = ?,
                  file_path = COALESCE(?, file_path),
                  updated_at = NOW()
              WHERE id = ?`,
      params: [payload.nomor_surat, payload.tujuan, jenisSurat, keperluan, payload.file_path, payload.permohonanId],
    },
    {
      query: `UPDATE permohonan_surat
              SET nomor_surat = ?,
                  nama_pemohon = ?,
                  jenis_surat = ?,
                  keperluan = ?,
                  dokumen_path = COALESCE(?, dokumen_path),
                  updated_at = NOW()
              WHERE id = ?`,
      params: [payload.nomor_surat, payload.tujuan, jenisSurat, keperluan, payload.file_path, payload.permohonanId],
    },
  ];

  let updated = false;
  for (const variant of updateVariants) {
    try {
      const [result] = await db.query<ResultSetHeader>(variant.query, variant.params);
      updated = result.affectedRows > 0;
      if (updated) {
        return true;
      }
    } catch (error) {
      if (!isUnknownColumnError(error)) {
        throw error;
      }
    }
  }

  return false;
}

async function deletePermohonanById(permohonanId: number): Promise<boolean> {
  const [result] = await db.query<ResultSetHeader>(`DELETE FROM permohonan_surat WHERE id = ?`, [permohonanId]);
  return result.affectedRows > 0;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const parsedId = parseId(params.id);
    if (!parsedId) {
      return NextResponse.json({ success: false, error: "ID surat keluar tidak valid" }, { status: 400 });
    }

    if (parsedId > 0) {
      const suratKeluar = await findSuratKeluarById(parsedId);
      if (suratKeluar) {
        return NextResponse.json({ success: true, data: mapSuratKeluarDetail(suratKeluar) });
      }
    }

    const permohonan = await findPermohonanOutgoingById(Math.abs(parsedId));
    if (permohonan && isEligiblePermohonanForSuratKeluar((permohonan as { status?: unknown }).status)) {
      return NextResponse.json({ success: true, data: mapPermohonanToSuratKeluarDetail(permohonan) });
    }

    return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching surat keluar detail:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil detail surat keluar" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const parsedId = parseId(params.id);
    if (!parsedId) {
      return NextResponse.json({ success: false, error: "ID surat keluar tidak valid" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    let nomor_surat = "";
    let tanggal_surat = "";
    let tujuan = "";
    let perihal = "";
    let status = "";
    let newFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      nomor_surat = String(formData.get("nomor_surat") || "").trim();
      tanggal_surat = String(formData.get("tanggal_surat") || "").trim();
      tujuan = String(formData.get("tujuan") || "").trim();
      perihal = String(formData.get("perihal") || "").trim();
      status = String(formData.get("status") || "").trim();

      const rawFile = formData.get("file_surat");
      if (rawFile instanceof File && rawFile.size > 0) {
        newFilePath = await saveUploadedSuratKeluar(rawFile);
      }
    } else {
      const body = await request.json();
      nomor_surat = String(body?.nomor_surat || "").trim();
      tanggal_surat = String(body?.tanggal_surat || "").trim();
      tujuan = String(body?.tujuan || "").trim();
      perihal = String(body?.perihal || "").trim();
      status = String(body?.status || "").trim();
      newFilePath = typeof body?.file_path === "string" && body.file_path.trim() ? body.file_path.trim() : null;
    }

    if (!nomor_surat || !tanggal_surat || !tujuan || !perihal) {
      return NextResponse.json({ success: false, error: "Semua field wajib diisi" }, { status: 400 });
    }

    if (parsedId < 0) {
      const updated = await updatePermohonanFromSuratKeluarPayload({
        permohonanId: Math.abs(parsedId),
        nomor_surat,
        tujuan,
        perihal,
        status,
        file_path: newFilePath,
      });

      if (!updated) {
        return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Surat keluar berhasil diperbarui" });
    }

    const safeStatus = status || null;
    const updateVariants = [
      {
        query: `UPDATE surat_keluar
                SET nomor_surat = ?, tanggal_surat = ?, tujuan = ?, perihal = ?, status = COALESCE(?, status), file_path = COALESCE(?, file_path)
                WHERE id = ?`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath, parsedId],
      },
      {
        query: `UPDATE surat_keluar
                SET nomor_surat = ?, tanggal = ?, tujuan = ?, perihal = ?, status = COALESCE(?, status), file_path = COALESCE(?, file_path)
                WHERE id = ?`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, safeStatus, newFilePath, parsedId],
      },
      {
        query: `UPDATE surat_keluar
                SET nomor_surat = ?, tanggal_surat = ?, tujuan = ?, perihal = ?, file_path = COALESCE(?, file_path)
                WHERE id = ?`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath, parsedId],
      },
      {
        query: `UPDATE surat_keluar
                SET nomor_surat = ?, tanggal = ?, tujuan = ?, perihal = ?, file_path = COALESCE(?, file_path)
                WHERE id = ?`,
        params: [nomor_surat, tanggal_surat, tujuan, perihal, newFilePath, parsedId],
      },
    ];

    let result: ResultSetHeader | null = null;
    let lastError: unknown = null;

    for (const variant of updateVariants) {
      try {
        const [updated] = await db.query<ResultSetHeader>(variant.query, variant.params);
        result = updated;
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

    if (!result || result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Surat keluar berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating surat keluar:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui surat keluar";
    return NextResponse.json({ success: false, error: message }, { status: isUploadValidationError(message) ? 400 : 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const parsedId = parseId(params.id);
    if (!parsedId) {
      return NextResponse.json({ success: false, error: "ID surat keluar tidak valid" }, { status: 400 });
    }

    const rawPermohonanId = Number(request.nextUrl.searchParams.get("permohonanId"));
    const sourcePermohonanId = Number.isInteger(rawPermohonanId) && rawPermohonanId > 0
      ? rawPermohonanId
      : parsedId < 0
        ? Math.abs(parsedId)
        : null;

    if (parsedId < 0) {
      if (!sourcePermohonanId) {
        return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
      }

      const deletedPermohonan = await deletePermohonanById(sourcePermohonanId);
      if (!deletedPermohonan) {
        return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Data surat keluar berhasil dihapus" });
    }

    const [result] = await db.query<ResultSetHeader>(`DELETE FROM surat_keluar WHERE id = ?`, [parsedId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Data surat keluar tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Data surat keluar berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting surat keluar:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus data surat keluar" }, { status: 500 });
  }
}