/**
 * Shared type definitions untuk dashboard stats
 * Digunakan oleh berbagai dashboard dan hook
 */

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
    menunggu_tanda_tangan?: number;
    selesai_ditandatangani?: number;
  };
  users: {
    total: number;
    aktif: number;
    admin: number;
    sekretaris: number;
    kepala_desa: number;
  };
}

export type StatsCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

export interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: StatsCardColor;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}
