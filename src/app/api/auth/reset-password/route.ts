import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { token, email, newPassword, confirmPassword } = await request.json();

    // Validasi input
    if (!token || !email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password tidak cocok' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Hash token untuk perbandingan
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Cari reset token yang masih berlaku
    const [tokens]: any = await db.execute(
      `SELECT rt.id, rt.user_id, u.id as uid, u.email 
       FROM password_reset_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = ? 
       AND rt.expires_at > NOW()
       AND rt.used_at IS NULL
       AND u.email = ?
       LIMIT 1`,
      [hashedToken, email.toLowerCase()]
    );

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Link reset password tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    const tokenRecord = tokens[0];
    const userId = tokenRecord.user_id || tokenRecord.uid;

    // Hash password baru
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password user
    await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // Mark token sebagai sudah digunakan
    await db.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
      [tokenRecord.id]
    );

    return NextResponse.json(
      { message: 'Password berhasil direset. Silakan login dengan password baru Anda.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}

// GET endpoint untuk validasi token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token dan email tidak ditemukan' },
        { status: 400 }
      );
    }

    // Hash token untuk perbandingan
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Validasi token
    const [tokens]: any = await db.execute(
      `SELECT rt.id, rt.expires_at,rt.user_id, u.nama 
       FROM password_reset_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = ? 
       AND rt.expires_at > NOW()
       AND rt.used_at IS NULL
       AND u.email = ?
       LIMIT 1`,
      [hashedToken, email.toLowerCase()]
    );

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { isValid: false, error: 'Link tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    const tokenRecord = tokens[0];

    return NextResponse.json(
      { 
        isValid: true,
        expiresAt: tokenRecord.expires_at,
        userName: tokenRecord.nama
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
