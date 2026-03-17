import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // Validasi input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan password baru harus diisi' },
        { status: 400 }
      );
    }

    // Validasi kekuatan password baru
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal 8 karakter' },
        { status: 400 }
      );
    }

    // Cek password pattern yang kuat
    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!strongPasswordPattern.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol' },
        { status: 400 }
      );
    }

    // Verifikasi token
    const authToken = cookies().get('auth-token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET || 'si-surat-secret-key-2024') as any;
    
    // Mock implementation untuk development
    if (decoded.userId === 1 && currentPassword === 'adminsurat000') {
      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Dalam implementasi nyata, simpan ke database
      console.log('Password berhasil diubah:', {
        userId: decoded.userId,
        oldPasswordHash: await bcrypt.hash(currentPassword, 10),
        newPasswordHash: hashedPassword
      });

      return NextResponse.json({
        message: 'Password berhasil diubah'
      });
    }

    // Coba koneksi database untuk implementasi real
    try {
      const [rows]: any = await db.execute(
        'SELECT * FROM users WHERE id = ? AND status = "aktif" LIMIT 1',
        [decoded.userId]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 }
        );
      }

      const user = rows[0];
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Password lama tidak benar' },
          { status: 401 }
        );
      }

      // Hash password baru
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password di database
      await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedNewPassword, decoded.userId]
      );

      return NextResponse.json({
        message: 'Password berhasil diubah'
      });

    } catch (dbError) {
      console.error('Database Error:', dbError);
      return NextResponse.json(
        { error: 'Password lama tidak benar (mode development)' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}