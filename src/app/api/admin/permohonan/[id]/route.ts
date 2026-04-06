import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    if (!['admin', 'sekretaris', 'kepala_desa'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'ID permohonan tidak valid' }, { status: 400 });
    }

    const [existingRows]: any = await db.execute(
      'SELECT id, status, nomor_surat FROM permohonan_surat WHERE id = ? LIMIT 1',
      [id]
    );

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Data permohonan tidak ditemukan' }, { status: 404 });
    }

    await db.execute('DELETE FROM permohonan_surat WHERE id = ? LIMIT 1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Permohonan berhasil dihapus dari daftar',
    });
  } catch (error) {
    console.error('Error deleting permohonan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus permohonan' },
      { status: 500 }
    );
  }
}
