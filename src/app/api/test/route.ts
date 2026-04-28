import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET() {
  const result: {
    connected: boolean;
    message: string;
    supabase: {
      connected: boolean;
      message: string;
      error?: string;
      users?: unknown[];
    };
    mysql: {
      connected: boolean;
      message: string;
      error?: string;
      usersCount?: number;
    };
  } = {
    connected: false,
    message: "Pemeriksaan koneksi selesai.",
    supabase: {
      connected: false,
      message: "Belum dicek",
    },
    mysql: {
      connected: false,
      message: "Belum dicek",
    },
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    result.supabase = {
      connected: false,
      message: "Supabase env belum lengkap.",
      error: "Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("users").select("*").limit(5);

      if (error) {
        result.supabase = {
          connected: false,
          message: "Supabase terhubung, tetapi query users gagal.",
          error: error.message,
        };
      } else {
        result.supabase = {
          connected: true,
          message: "Koneksi Supabase berhasil.",
          users: data ?? [],
        };
      }
    } catch (error) {
      result.supabase = {
        connected: false,
        message: "Gagal menghubungkan ke Supabase.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  try {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM users");
    const total = Array.isArray(rows) && rows[0] && typeof (rows[0] as { total?: unknown }).total === "number"
      ? Number((rows[0] as { total: number }).total)
      : undefined;

    result.mysql = {
      connected: true,
      message: "Koneksi MySQL berhasil.",
      usersCount: total,
    };
  } catch (error) {
    result.mysql = {
      connected: false,
      message: "Koneksi MySQL gagal.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  result.connected = result.supabase.connected && result.mysql.connected;
  return NextResponse.json(result, { status: result.connected ? 200 : 500 });
}
