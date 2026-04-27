import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getDashboardRoute } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { username, nik, password, loginType, expectedRole } = await request.json();
    const loginIdentifier = String(nik || username || '').trim();
    const normalizedPassword = String(password || '').trim();

    console.log('Login attempt for:', loginIdentifier, 'via', loginType || 'default');

    const normalizedLoginType = (loginType as string | undefined)?.toLowerCase() === 'internal'
      ? 'internal'
      : 'public';

    const allowedInternalExpectedRoles = ['admin', 'sekretaris', 'kepala_desa'] as const;
    const normalizedExpectedRole = String(expectedRole || '').trim().toLowerCase();
    const selectedInternalRole = allowedInternalExpectedRoles.find(
      (role) => role === normalizedExpectedRole
    );

    if (!loginIdentifier || !normalizedPassword) {
      return NextResponse.json(
        normalizedLoginType === 'public'
          ? { error: 'NIK dan password wajib diisi' }
          : { error: 'Username/email dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (normalizedLoginType === 'internal' && !selectedInternalRole) {
      return NextResponse.json(
        { error: 'Role login internal tidak valid. Silakan login dari halaman role yang sesuai.' },
        { status: 400 }
      );
    }

    const allowedRoles = normalizedLoginType === 'internal'
      ? ['admin', 'sekretaris', 'kepala_desa']
      : ['masyarakat'];

    const [rows]: any = normalizedLoginType === 'public'
      ? await db.execute(
          'SELECT * FROM users WHERE (SUBSTRING_INDEX(nik, "_", 1) = ? OR email = ?) AND role = "masyarakat" LIMIT 1',
          [loginIdentifier, loginIdentifier]
        )
      : await db.execute(
          'SELECT * FROM users WHERE (username = ? OR email = ?) AND status IN ("aktif", "active") LIMIT 1',
          [loginIdentifier, loginIdentifier]
        );

    console.log('Database query result:', rows);

    if (!rows || rows.length === 0) {
      console.log('User not found or inactive');
      return NextResponse.json(
        normalizedLoginType === 'public'
          ? { error: 'Akun tidak terdaftar' }
          : { error: 'User tidak ditemukan atau nonaktif' },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (normalizedLoginType === 'public' && !['aktif', 'active'].includes(String(user.status || '').toLowerCase())) {
      return NextResponse.json(
        { error: 'Akun sudah terdaftar tetapi belum tervalidasi admin' },
        { status: 403 }
      );
    }

    const userId = user.id ?? user.id_user;
    const idColumn = user.id !== undefined ? 'id' : 'id_user';

    if (!userId) {
      return NextResponse.json(
        { error: 'Data akun tidak valid' },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      console.log('Login rejected due to role mismatch:', user.role, 'for', normalizedLoginType, 'portal');
      return NextResponse.json(
        normalizedLoginType === 'internal'
          ? { error: 'Akun ini tidak memiliki akses ke portal internal. Gunakan portal login masyarakat.' }
          : { error: 'Akun ini tidak memiliki akses ke portal masyarakat. Silakan gunakan portal login internal.' },
        { status: 403 }
      );
    }

    if (normalizedLoginType === 'internal' && selectedInternalRole && user.role !== selectedInternalRole) {
      const roleLabels: Record<string, string> = {
        admin: 'Admin',
        sekretaris: 'Sekretaris',
        kepala_desa: 'Kepala Desa',
      };
      const expectedRoleLabel = roleLabels[selectedInternalRole] || selectedInternalRole;
      return NextResponse.json(
        {
          error: `Akun ini bukan akun ${expectedRoleLabel}. Silakan login melalui halaman login role yang sesuai.`,
        },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      {
        userId,
        username: user.username,
        email: user.email,
        nama: user.nama,
        role: user.role,
        nik: user.nik,
        alamat: user.alamat,
        telepon: user.telepon,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    await db.execute(`UPDATE users SET last_login = NOW() WHERE ${idColumn} = ?`, [userId]);

    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400
    });

    // Determine redirect URL based on role
    const redirectUrl = getDashboardRoute(user.role);
    const responseMessage = normalizedLoginType === 'internal'
      ? 'Login internal berhasil'
      : 'Login berhasil';

    console.log('Login successful for user:', user.username, 'role:', user.role, 'redirectUrl:', redirectUrl);

    return NextResponse.json({
      user: {
        id: userId,
        id_user: userId,
        username: user.username,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nik: user.nik,
        alamat: user.alamat,
        telepon: user.telepon,
      },
      message: responseMessage,
      redirectUrl: redirectUrl
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}