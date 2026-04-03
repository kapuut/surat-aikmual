"use client";

import { memo } from 'react';
import {
  FiInbox,
  FiSend,
  FiFileText,
  FiUsers,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { StatsCard } from './StatsCard';
import type { DashboardStats } from '@/lib/hooks';

/**
 * Komponen untuk menampilkan stats admin
 * Memoized untuk menghindari re-render yang tidak perlu
 */
export const AdminStats = memo(function AdminStats({ stats }: { stats: DashboardStats }) {
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
});

/**
 * Komponen untuk menampilkan stats sekretaris
 * Memoized untuk menghindari re-render yang tidak perlu
 */
export const SekretarisStats = memo(function SekretarisStats({ stats }: { stats: DashboardStats }) {
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
});

/**
 * Komponen untuk menampilkan stats kepala desa
 * Memoized untuk menghindari re-render yang tidak perlu
 */
export const KepalaDesaStats = memo(function KepalaDesaStats({ stats }: { stats: DashboardStats }) {
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
});