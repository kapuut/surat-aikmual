import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, createHmac } from "crypto";
import { RowDataPacket } from "mysql2";

function buildVerificationCode(source: string): string {
  return createHash("sha256").update(source).digest("hex").slice(0, 16).toUpperCase();
}

function buildIntegrityToken(source: string): string {
  const secret = process.env.QR_SIGN_SECRET || process.env.JWT_SECRET || "aikmual-signature-secret";
  return createHmac("sha256", secret).update(source).digest("hex").slice(0, 24).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const permohonanId = Number(searchParams.get("permohonan"));
    const kode = String(searchParams.get("kode") || "").trim().toUpperCase();
    const token = String(searchParams.get("token") || "").trim().toUpperCase();

    if (!Number.isFinite(permohonanId) || permohonanId <= 0 || !kode || !token) {
      return NextResponse.json(
        { success: false, valid: false, error: "Parameter verifikasi tidak lengkap" },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
        p.id,
        p.nomor_surat,
        p.nik,
        p.nama_pemohon,
        p.jenis_surat,
        p.keperluan,
        p.status,
        p.updated_at,
        p.processed_by,
        p.file_path,
        u.nama AS processed_by_name,
        u.role AS processed_by_role
      FROM permohonan_surat p
      LEFT JOIN users u ON p.processed_by = u.id
      WHERE p.id = ?
      LIMIT 1`,
      [permohonanId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, valid: false, error: "Data permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    const row = rows[0] as any;

    if (!["ditandatangani", "selesai"].includes(String(row.status || ""))) {
      return NextResponse.json(
        { success: true, valid: false, error: "Surat belum berstatus ditandatangani/selesai" },
        { status: 200 }
      );
    }

    if (!row.nomor_surat) {
      return NextResponse.json(
        { success: true, valid: false, error: "Nomor surat tidak tersedia" },
        { status: 200 }
      );
    }

    const pembuatSurat = String(row.processed_by_name || "").trim() || "Petugas Desa";
    const suratUntuk = `${String(row.nama_pemohon || "-")} (${String(row.nik || "-")})`;

    const source = [
      String(row.id),
      String(row.nomor_surat),
      String(row.nik || ""),
      String(row.nama_pemohon || ""),
      String(row.jenis_surat || ""),
      String(row.keperluan || ""),
      suratUntuk,
      pembuatSurat,
    ].join("|");

    const expectedKode = buildVerificationCode(source);
    const expectedToken = buildIntegrityToken(source);
    const valid = expectedKode === kode && expectedToken === token;

    if (!valid) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "Kode verifikasi tidak cocok (indikasi manipulasi)",
      });
    }

    return NextResponse.json({
      success: true,
      valid,
      data: {
        id: Number(row.id),
        nomor_surat: String(row.nomor_surat || "-"),
        nama_pemohon: String(row.nama_pemohon || "-"),
        nik: String(row.nik || "-"),
        surat_untuk: suratUntuk,
        jenis_surat: String(row.jenis_surat || "-"),
        keperluan: String(row.keperluan || "-"),
        pembuat_surat: pembuatSurat,
        jabatan_penanda_tangan: row.processed_by_role === "kepala_desa" ? "Kepala Desa" : "Petugas Desa",
        status: String(row.status || "-"),
        tanggal_ttd: row.updated_at,
        file_path: row.file_path || null,
      },
      reason: "Kode verifikasi dan token integritas cocok",
    });
  } catch (error) {
    console.error("Error verifikasi surat:", error);
    return NextResponse.json(
      { success: false, valid: false, error: "Gagal memverifikasi surat" },
      { status: 500 }
    );
  }
}
