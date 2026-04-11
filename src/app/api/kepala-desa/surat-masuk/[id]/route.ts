import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

type AuthUser = {
  id: string;
  nama: string;
  role: string;
};

async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
  );

  return {
    id: String(verified.payload.userId || ""),
    nama: String(verified.payload.nama || ""),
    role: String(verified.payload.role || ""),
  };
}

function isDuplicateColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("duplicate column") || message.includes("already exists");
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

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "kepala_desa") {
      return NextResponse.json(
        { success: false, error: "Hanya Kepala Desa yang dapat mengakses detail surat ini" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const suratId = parseId(String(id || ""));

    if (!suratId) {
      return NextResponse.json(
        { success: false, error: "ID surat masuk tidak valid" },
        { status: 400 }
      );
    }

    await ensureDisposisiTable();

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        sm.*,
        u.nama AS created_by_name,
        ds.tujuan_role AS latest_disposisi_tujuan,
        ds.tujuan_label AS latest_disposisi_tujuan_label,
        ds.status AS latest_disposisi_status,
        ds.catatan AS latest_disposisi_catatan,
        ds.disposed_at AS latest_disposisi_at,
        ds.disposed_by_name AS latest_disposisi_by,
        ds.disposed_by_role AS latest_disposisi_by_role
      FROM surat_masuk sm
      LEFT JOIN users u ON sm.created_by = u.id
      LEFT JOIN disposisi_surat_masuk ds ON ds.id = (
        SELECT d2.id
        FROM disposisi_surat_masuk d2
        WHERE d2.surat_masuk_id = CAST(sm.id AS CHAR)
        ORDER BY d2.disposed_at DESC, d2.id DESC
        LIMIT 1
      )
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
    console.error("Error fetching kepala desa surat masuk detail:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail surat masuk" },
      { status: 500 }
    );
  }
}
