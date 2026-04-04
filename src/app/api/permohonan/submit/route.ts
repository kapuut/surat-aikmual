export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Forward ke endpoint utama permohonan
    const targetUrl = new URL('/api/permohonan', request.url);
    const body = contentType.includes("multipart/form-data")
      ? await request.formData()
      : await request.text();
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
      },
        ...(contentType.includes("multipart/form-data") ? {} : { 'Content-Type': 'application/json' }),
    });

    const bodyText = await response.text();
    return new Response(bodyText, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    const { NextResponse } = await import('next/server');
    return NextResponse.json(
      { error: 'Gagal mengirim permohonan (submit route)' },
      { status: 500 }
    );
  }
}
