import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../../../../lib/db';

type ColumnMeta = {
  Field: string;
};

async function getIdField() {
  const [columnsRaw] = await db.query('SHOW COLUMNS FROM users');
  const columns = (columnsRaw as ColumnMeta[]) || [];
  const columnSet = new Set(columns.map((item) => item.Field));
  return columnSet.has('id') ? 'id' : 'id_user';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const oldPassword = String(body?.oldPassword ?? body?.currentPassword ?? '').trim();
    const newPassword = String(body?.newPassword ?? '').trim();
    
    // Validasi input - accept both oldPassword and currentPassword
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan password baru harus diisi' },
        { status: 400 }
      );
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: 'Password baru harus berbeda dari password lama' },
        { status: 400 }
      );
    }

    // Validasi kekuatan password baru (minimum 6 karakter)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Verifikasi token
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET || 'si-surat-secret-key-2024') as any;
    
    const idField = await getIdField();
    const [rows]: any = await db.execute(
      `SELECT * FROM users WHERE ${idField} = ? AND status IN ("aktif", "active") LIMIT 1`,
      [decoded.userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = rows[0];
    const isCurrentPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Password lama tidak benar' },
        { status: 401 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const [updateResult]: any = await db.execute(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE ${idField} = ?`,
      [hashedNewPassword, decoded.userId]
    );

    if (!updateResult || updateResult.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Gagal memperbarui password. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    const role = String(decoded?.role || '').toLowerCase();
    const loginRedirectByRole: Record<string, string> = {
      admin: '/admin/login',
      sekretaris: '/sekretaris/login',
      kepala_desa: '/kepala-desa/login',
      masyarakat: '/login',
    };
    const redirectUrl = loginRedirectByRole[role] || '/login';

    const response = NextResponse.json({
      message: 'Password berhasil diubah. Silakan login kembali dengan password baru.',
      redirectUrl,
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('user-session', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}