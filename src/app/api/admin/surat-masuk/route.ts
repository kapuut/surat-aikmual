import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

// GET - Ambil semua surat masuk
export async function GET(request: NextRequest) {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        sm.*,
        u.nama as created_by_name
      FROM surat_masuk sm
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.tanggal_terima DESC, sm.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching surat masuk:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data surat masuk" },
      { status: 500 }
    );
  }
}

// POST - Tambah surat masuk baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal } = body;

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
       (nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nomor_surat, tanggal_surat, tanggal_terima, asal_surat, perihal, created_by]
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
