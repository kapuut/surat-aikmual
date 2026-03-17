import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function login(username: string, password: string) {
  try {
    const [rows]: any = await db.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND status = "aktif" LIMIT 1',
      [username, username]
    );

    if (!rows || rows.length === 0) {
      throw new Error('User tidak ditemukan atau nonaktif');
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Password salah');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400
    });

    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
  }
}