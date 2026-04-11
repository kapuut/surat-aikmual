import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

type AuthUser = {
  id: string;
  nama: string;
  role: string;
};

const FIXED_TUJUAN_ROLE = "sekretaris";
const FIXED_TUJUAN_LABEL = "Sekretaris Desa";

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

export async function POST(
  request: NextRequest,
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
        { success: false, error: "Hanya Kepala Desa yang dapat melakukan disposisi" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const suratMasukId = String(id || "").trim();

    if (!suratMasukId) {
      return NextResponse.json(
        { success: false, error: "ID surat masuk tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tujuanLanjutanRaw = typeof body?.tujuan_lanjutan === "string" ? body.tujuan_lanjutan : "";
    const tujuanLanjutan = tujuanLanjutanRaw.trim().slice(0, 120);
    const catatanRaw = typeof body?.catatan === "string" ? body.catatan : "";
    const catatanFromInput = catatanRaw.trim();
    const catatanCombined = [catatanFromInput, tujuanLanjutan ? `Arahan tujuan lanjutan: ${tujuanLanjutan}` : ""]
      .filter(Boolean)
      .join("\n");
    const catatan = catatanCombined.slice(0, 1000);

    const [suratRows] = await db.query(
      `SELECT id FROM surat_masuk WHERE id = ? LIMIT 1`,
      [suratMasukId]
    );

    if (!Array.isArray(suratRows) || suratRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data surat masuk tidak ditemukan" },
        { status: 404 }
      );
    }

    await ensureDisposisiTable();

    const [result] = await db.query(
      `INSERT INTO disposisi_surat_masuk (
        surat_masuk_id,
        tujuan_role,
        tujuan_label,
        status,
        catatan,
        disposed_by_id,
        disposed_by_name,
        disposed_by_role
      ) VALUES (?, ?, ?, 'didisposisikan', ?, ?, ?, ?)`,
      [
        suratMasukId,
        FIXED_TUJUAN_ROLE,
        FIXED_TUJUAN_LABEL,
        catatan || null,
        user.id || null,
        user.nama || "Kepala Desa",
        user.role,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Surat masuk berhasil didisposisikan ke ${FIXED_TUJUAN_LABEL}`,
      data: {
        id: (result as { insertId?: number })?.insertId,
        surat_masuk_id: suratMasukId,
        tujuan_role: FIXED_TUJUAN_ROLE,
        tujuan_label: FIXED_TUJUAN_LABEL,
        status: "didisposisikan",
        catatan,
      },
    });
  } catch (error) {
    console.error("Error disposisi surat masuk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal melakukan disposisi surat masuk" },
      { status: 500 }
    );
  }
}
