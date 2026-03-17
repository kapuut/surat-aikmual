"use client";

import { useState, useEffect } from 'react';
import { 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiUsers, 
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';

// Interface untuk stats yang akan dibagikan antar dashboard
export interface DashboardStats {
  suratMasuk: {
    total: number;
    bulanIni: number;
    belumDibaca: number;
  };
  suratKeluar: {
    total: number;
    bulanIni: number;
    draft: number;
  };
  permohonan: {
    total: number;
    pending: number;
    disetujui: number;
    ditolak: number;
  };
  users: {
    total: number;
    aktif: number;
    admin: number;
    sekretaris: number;
    kepala_desa: number;
  };
}

// Hook untuk mendapatkan stats dari API
export function useSharedStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Update stats setiap 30 detik untuk real-time sync
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refresh: () => setLoading(true) };
}

// Komponen StatsCard yang dapat digunakan di berbagai dashboard
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon, color, trend, subtitle, onClick }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const iconColorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-6 
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <FiTrendingUp 
                className={`w-4 h-4 mr-1 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`} 
              />
              <span 
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${iconColorClasses[color]} rounded-lg flex items-center justify-center`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
    </div>
  );
}

// Komponen untuk menampilkan stats admin
export function AdminStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Surat Masuk"
        value={stats.suratMasuk.total}
        subtitle={`${stats.suratMasuk.belumDibaca} belum dibaca`}
        icon={<FiInbox className="w-6 h-6" />}
        color="blue"
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Surat Keluar"
        value={stats.suratKeluar.total}
        subtitle={`${stats.suratKeluar.draft} draft`}
        icon={<FiSend className="w-6 h-6" />}
        color="green"
        trend={{ value: 8, isPositive: true }}
      />
      <StatsCard
        title="Permohonan"
        value={stats.permohonan.total}
        subtitle={`${stats.permohonan.pending} menunggu`}
        icon={<FiFileText className="w-6 h-6" />}
        color="yellow"
        trend={{ value: 15, isPositive: true }}
      />
      <StatsCard
        title="Total Users"
        value={stats.users.total}
        subtitle={`${stats.users.aktif} aktif`}
        icon={<FiUsers className="w-6 h-6" />}
        color="purple"
        trend={{ value: 5, isPositive: true }}
      />
    </div>
  );
}

// Komponen untuk menampilkan stats sekretaris
export function SekretarisStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatsCard
        title="Surat Masuk"
        value={stats.suratMasuk.bulanIni}
        subtitle="Bulan ini"
        icon={<FiInbox className="w-6 h-6" />}
        color="blue"
      />
      <StatsCard
        title="Surat Keluar"
        value={stats.suratKeluar.bulanIni}
        subtitle={`${stats.suratKeluar.draft} draft`}
        icon={<FiSend className="w-6 h-6" />}
        color="green"
      />
      <StatsCard
        title="Permohonan"
        value={stats.permohonan.pending}
        subtitle="Perlu diproses"
        icon={<FiClock className="w-6 h-6" />}
        color="yellow"
      />
    </div>
  );
}

// Komponen untuk menampilkan stats kepala desa
export function KepalaDesaStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Permohonan Pending"
        value={stats.permohonan.pending}
        subtitle="Menunggu persetujuan"
        icon={<FiClock className="w-6 h-6" />}
        color="yellow"
      />
      <StatsCard
        title="Disetujui"
        value={stats.permohonan.disetujui}
        subtitle="Bulan ini"
        icon={<FiCheckCircle className="w-6 h-6" />}
        color="green"
      />
      <StatsCard
        title="Surat Masuk"
        value={stats.suratMasuk.bulanIni}
        subtitle="Bulan ini"
        icon={<FiInbox className="w-6 h-6" />}
        color="blue"
      />
      <StatsCard
        title="Total Surat"
        value={stats.suratMasuk.bulanIni + stats.suratKeluar.bulanIni}
        subtitle="Bulan ini"
        icon={<FiFileText className="w-6 h-6" />}
        color="purple"
      />
    </div>
  );
}