import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// GET - Ambil stats password reset attempts (untuk monitoring)
export async function GET(request: Request) {
  try {
    // Validasi admin access (optional - sesuaikan dengan auth system Anda)
    // const token = request.headers.get('authorization');
    // if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7'; // default 7 hari

    // Stats: berapa banyak reset request dalam range
    const [stats]: any = await db.execute(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) as completed_resets,
        SUM(CASE WHEN expires_at < NOW() AND used_at IS NULL THEN 1 ELSE 0 END) as expired_tokens,
        SUM(CASE WHEN used_at IS NULL AND expires_at > NOW() THEN 1 ELSE 0 END) as pending_tokens
       FROM password_reset_tokens 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [parseInt(timeRange) || 7]
    );

    // Recent reset requests
    const [recent]: any = await db.execute(
      `SELECT 
        prt.id,
        prt.user_id,
        u.username,
        u.email,
        u.nama,
        prt.created_at,
        prt.expires_at,
        prt.used_at,
        CASE 
          WHEN prt.used_at IS NOT NULL THEN 'completed'
          WHEN prt.expires_at < NOW() THEN 'expired'
          ELSE 'pending'
        END as status
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY prt.created_at DESC
       LIMIT 50`,
      [parseInt(timeRange) || 7]
    );

    return NextResponse.json({
      timeRange: `${timeRange} hari terakhir`,
      stats: stats[0] || {
        total_requests: 0,
        completed_resets: 0,
        expired_tokens: 0,
        pending_tokens: 0,
      },
      recent: recent || [],
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

// DELETE - Cleanup expired tokens (jalankan via cron job)
export async function DELETE(request: Request) {
  try {
    // Optional: Add authentication check for admin only
    
    const result: any = await db.execute(
      `DELETE FROM password_reset_tokens 
       WHERE expires_at < NOW() 
       OR (used_at IS NOT NULL AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
    );

    return NextResponse.json({
      message: 'Cleanup berhasil',
      deletedCount: result.affectedRows || 0,
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan cleanup' },
      { status: 500 }
    );
  }
}
