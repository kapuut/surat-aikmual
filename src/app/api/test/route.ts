import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return NextResponse.json(
        {
          connected: false,
          message: "Supabase env belum lengkap. Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.from("users").select("*").limit(5);

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          message: "Supabase terhubung, tetapi query ke tabel users gagal.",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        connected: true,
        message: "Koneksi Supabase berhasil.",
        users: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        message: "Gagal menghubungkan ke Supabase.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
