import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/email';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, catatan } = await request.json();
    const [permohonan]: any = await db.execute(
      'SELECT * FROM permohonan_surat WHERE id = ?',
      [params.id]
    );

    await db.execute(
      'UPDATE permohonan_surat SET status = ?, catatan = ? WHERE id = ?',
      [status, catatan, params.id]
    );

    // Send email notification
    await sendNotificationEmail(
      permohonan[0].email,
      `Update Status Permohonan #${params.id}`,
      `Status permohonan Anda telah diupdate menjadi: ${status}`
    );

    return NextResponse.json({ message: 'Status berhasil diupdate' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengupdate status' },
      { status: 500 }
    );
  }
}
