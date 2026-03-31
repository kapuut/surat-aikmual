export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Forward to parent POST handler
    const response = await fetch('http://localhost:3000/api/permohonan', {
      method: 'POST',
      headers: request.headers,
      body: request.body,
    });
    return response;
  } catch (error) {
    const { NextResponse } = await import('next/server');
    return NextResponse.json(
      { error: 'Gagal mengirim permohonan' },
      { status: 500 }
    );
  }
}
