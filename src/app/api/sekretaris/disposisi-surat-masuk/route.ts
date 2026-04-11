import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

type AuthUser = {
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
    role: String(verified.payload.role || ""),
  };
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
    const message = String((error as { message?: string })?.message || "").toLowerCase();
    if (!message.includes("duplicate column") && !message.includes("already exists")) {
      throw error;
    }
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!["sekretaris", "admin", "kepala_desa"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki akses" },
        { status: 403 }
      );
    }

    await ensureDisposisiTable();

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
        d.id,
        d.surat_masuk_id,
        d.tujuan_role,
        d.tujuan_label,
        d.status,
        d.catatan,
        d.disposed_at,
        d.disposed_by_name,
        d.disposed_by_role,
        sm.nomor_surat,
        sm.tanggal_surat,
        sm.tanggal_terima,
        sm.asal_surat,
        sm.perihal,
        sm.file_path
      FROM disposisi_surat_masuk d
      LEFT JOIN surat_masuk sm ON CAST(sm.id AS CHAR) = d.surat_masuk_id
      WHERE (
        LOWER(TRIM(COALESCE(d.tujuan_role, ''))) LIKE '%sekretaris%'
        OR LOWER(TRIM(COALESCE(d.tujuan_label, ''))) LIKE '%sekretaris%'
      )
        AND d.id = (
          SELECT d2.id
          FROM disposisi_surat_masuk d2
          WHERE d2.surat_masuk_id = d.surat_masuk_id
            AND (
              LOWER(TRIM(COALESCE(d2.tujuan_role, ''))) LIKE '%sekretaris%'
              OR LOWER(TRIM(COALESCE(d2.tujuan_label, ''))) LIKE '%sekretaris%'
            )
          ORDER BY d2.disposed_at DESC, d2.id DESC
          LIMIT 1
        )
      ORDER BY d.disposed_at DESC, d.id DESC`
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching disposisi surat masuk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data disposisi surat masuk" },
      { status: 500 }
    );
  }
}
