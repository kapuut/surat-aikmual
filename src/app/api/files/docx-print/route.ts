import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import mammoth from "mammoth";

/**
 * GET /api/files/docx-print?path=<file_path>
 *
 * Converts a .doc/.docx file to an HTML page with an auto-print script.
 * Works with:
 *   - Local dev paths: /uploads/surat-masuk/file.docx  → public/uploads/...
 *   - Vercel Blob URLs: https://...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return new NextResponse("Parameter 'path' diperlukan.", { status: 400 });
  }

  try {
    let buffer: Buffer;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Vercel Blob or external URL — fetch it
      const res = await fetch(filePath);
      if (!res.ok) {
        return new NextResponse("File tidak ditemukan.", { status: 404 });
      }
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Local path — must start with /uploads/ to prevent path traversal
      const normalised = filePath.replace(/\\/g, "/");
      if (!normalised.startsWith("/uploads/")) {
        return new NextResponse("Akses file tidak diizinkan.", { status: 403 });
      }
      const localPath = path.join(process.cwd(), "public", normalised);
      buffer = await readFile(localPath);
    }

    const result = await mammoth.convertToHtml({ buffer });
    const bodyHtml = result.value;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cetak Surat</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 2cm;
    }
    p { margin-bottom: 0.5em; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
    td, th { border: 1px solid #000; padding: 4px 8px; }
    img { max-width: 100%; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:10px;right:10px;z-index:9999;">
    <button onclick="window.print()" style="background:#16a34a;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">
      🖨️ Cetak / Simpan PDF
    </button>
  </div>
  ${bodyHtml}
  <script>
    window.addEventListener('load', function() {
      // Give a moment for styles to apply, then trigger print
      setTimeout(function() { window.print(); }, 600);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[docx-print]", err);
    return new NextResponse("Gagal memproses file.", { status: 500 });
  }
}
