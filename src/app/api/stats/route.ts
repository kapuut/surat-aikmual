import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Surat Masuk Stats
    const [suratMasukTotal]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif"'
    );
    
    const [suratMasukBulanIni]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif" AND tanggal >= ? AND tanggal <= ?',
      [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    const [suratMasukBelumDibaca]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_masuk WHERE status = "aktif" AND is_read = 0'
    );

    // Surat Keluar Stats
    const [suratKeluarTotal]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_keluar WHERE status = "aktif"'
    );
    
    const [suratKeluarBulanIni]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_keluar WHERE status = "aktif" AND tanggal >= ? AND tanggal <= ?',
      [monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    const [suratKeluarDraft]: any = await db.execute(
      'SELECT COUNT(*) as count FROM surat_keluar WHERE status = "draft"'
    );

    // Permohonan Stats
    const [permohonanTotal]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat'
    );

    const [permohonanPending]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE status = "pending"'
    );

    const [permohonanDisetujui]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE status = "disetujui"'
    );

    const [permohonanDitolak]: any = await db.execute(
      'SELECT COUNT(*) as count FROM permohonan_surat WHERE status = "ditolak"'
    );

    // Users Stats (only accessible for admin)
    let usersStats = {
      total: 0,
      aktif: 0,
      admin: 0,
      sekretaris: 0,
      kepala_desa: 0
    };

    if (user.role === 'admin') {
      const [usersTotal]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users'
      );

      const [usersAktif]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE status = "aktif"'
      );

      const [usersAdmin]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );

      const [usersSekretaris]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "sekretaris"'
      );

      const [usersKepalaDesa]: any = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "kepala_desa"'
      );

      usersStats = {
        total: usersTotal[0].count,
        aktif: usersAktif[0].count,
        admin: usersAdmin[0].count,
        sekretaris: usersSekretaris[0].count,
        kepala_desa: usersKepalaDesa[0].count
      };
    }

    const stats = {
      suratMasuk: {
        total: suratMasukTotal[0].count,
        bulanIni: suratMasukBulanIni[0].count,
        belumDibaca: suratMasukBelumDibaca[0].count
      },
      suratKeluar: {
        total: suratKeluarTotal[0].count,
        bulanIni: suratKeluarBulanIni[0].count,
        draft: suratKeluarDraft[0].count
      },
      permohonan: {
        total: permohonanTotal[0].count,
        pending: permohonanPending[0].count,
        disetujui: permohonanDisetujui[0].count,
        ditolak: permohonanDitolak[0].count
      },
      users: usersStats
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    );
  }
}
