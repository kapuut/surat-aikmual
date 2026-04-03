export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Forward ke origin aktif (mis. localhost:3002), jangan hardcoded port.
    const targetUrl = new URL('/api/permohonan', request.url);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
      },
      body: await request.text(),
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
