import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendNotificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email wajib diisi' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const [users]: any = await db.execute(
      'SELECT id, username, nama, email FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );

    if (!users || users.length === 0) {
      // Jangan reveal apakah email terdaftar atau tidak (security best practice)
      return NextResponse.json(
        { message: 'Jika email terdaftar, link reset password akan dikirim dalam beberapa menit.' },
        { status: 200 }
      );
    }

    const user = users[0];

    // Generate reset token (32 bytes random hex)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token berlaku selama 1 jam (3600 detik)
    const expiresAt = new Date(Date.now() + 3600000);

    // Hapus token lama yang belum digunakan
    await db.execute(
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );

    // Simpan token reset (hash untuk keamanan)
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt]
    );

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Siapkan email HTML
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Password Anda</h2>
        <p>Halo ${user.nama},</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Atau salin link ini ke browser Anda:</strong><br/>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Link ini hanya berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.<br/>
          Jangan bagikan link ini kepada siapa pun.
        </p>
        
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #ccc;">
        <p style="color: #666; font-size: 12px;">
          © ${new Date().getFullYear()} Sistem Informasi Surat. All rights reserved.
        </p>
      </div>
    `;

    try {
      await sendNotificationEmail(
        user.email,
        'Reset Password Akun Anda',
        emailHTML
      );
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      // Jangan return error ke client, hanya log
      // Ini untuk keamanan (jangan reveal apakah email terkirim atau tidak)
    }

    return NextResponse.json(
      { message: 'Jika email terdaftar, link reset password akan dikirim dalam beberapa menit.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}
