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

function isDuplicateColumnError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || "").toLowerCase();
  return message.includes("duplicate column") || message.includes("already exists");
}

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

async function ensurePenangananColumns() {
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

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN ditangani_by_id VARCHAR(64) NULL AFTER ditangani_at`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      throw error;
    }
  }

  try {
    await db.query(`ALTER TABLE surat_masuk ADD COLUMN ditangani_by_name VARCHAR(191) NULL AFTER ditangani_by_id`);
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
        { success: false, error: "Hanya Kepala Desa yang dapat melakukan konfirmasi" },
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
    const catatanRaw = typeof body?.catatan === "string" ? body.catatan.trim() : "";
    const catatan = (catatanRaw || "Surat telah dibaca dan dikonfirmasi selesai oleh Kepala Desa.").slice(0, 1000);

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

    await ensurePenangananColumns();

    await db.query(
      `UPDATE surat_masuk
       SET status_penanganan = 'selesai',
           ditangani_at = NOW(),
           ditangani_by_id = ?,
           ditangani_by_name = ?,
           catatan_penanganan = ?
       WHERE id = ?`,
      [user.id || null, user.nama || "Kepala Desa", catatan, suratMasukId]
    );

    return NextResponse.json({
      success: true,
      message: "Surat berhasil ditandai selesai ditangani.",
      data: {
        surat_masuk_id: suratMasukId,
        status_penanganan: "selesai",
        ditangani_by_name: user.nama || "Kepala Desa",
        catatan,
      },
    });
  } catch (error) {
    console.error("Error konfirmasi surat masuk kepala desa:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengonfirmasi surat masuk" },
      { status: 500 }
    );
  }
}
