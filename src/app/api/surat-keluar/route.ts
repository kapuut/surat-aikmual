import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

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

function normalizeStatus(value: unknown): "Draft" | "Menunggu" | "Terkirim" {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "Terkirim";
  if (["draft", "draf"].includes(text)) return "Draft";
  if (["pending", "menunggu", "proses", "diproses"].includes(text)) return "Menunggu";
  return "Terkirim";
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
      return {
        id: Number((row as any).id),
        nomor_surat: (row as any).nomor_surat || "-",
        tanggal_surat: tanggal,
        tujuan: (row as any).tujuan || "Pemohon",
        perihal: (row as any).perihal || "-",
        file_path: normalizeFilePath((row as any).file_path),
        status: normalizeStatus((row as any).status),
        created_by_name: (row as any).created_by_name || null,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Error fetching surat keluar:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data surat keluar" },
      { status: 500 }
    );
  }
}
