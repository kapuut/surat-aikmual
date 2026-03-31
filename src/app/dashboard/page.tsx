'use client';

import { useRequireAuth } from '@/lib/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiFileText, FiCheckCircle, FiClock, FiXCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import UserNavbar from '@/components/UserNavbar';

interface PermohonanSummary {
  id: string;
  jenis_surat: string;
  status: string;
  tanggal_dibuat: string;
  nomor_surat?: string;
}

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useRequireAuth();
  const [permohonan, setPermohonan] = useState<PermohonanSummary[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPermohonanData();
    }
  }, [isAuthenticated, user]);

  const fetchPermohonanData = async () => {
    try {
      const response = await fetch('/api/permohonan/summary', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPermohonan(data.permohonan || []);
        setStats(data.stats || { total: 0, diproses: 0, selesai: 0, ditolak: 0 });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via middleware
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'text-green-600';
      case 'diproses':
        return 'text-blue-600';
      case 'ditolak':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selesai':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'diproses':
        return <FiClock className="w-5 h-5" />;
      case 'ditolak':
        return <FiXCircle className="w-5 h-5" />;
      default:
        return <FiRefreshCw className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat datang, {user.nama}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Kelola permohonan dan lacak status surat Anda di sini</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={<FiFileText className="w-6 h-6" />}
            label="Total Permohonan"
            value={stats.total}
            color="blue"
          />
          <StatsCard
            icon={<FiClock className="w-6 h-6" />}
            label="Sedang Diproses"
            value={stats.diproses}
            color="yellow"
          />
          <StatsCard
            icon={<FiCheckCircle className="w-6 h-6" />}
            label="Selesai"
            value={stats.selesai}
            color="green"
          />
          <StatsCard
            icon={<FiXCircle className="w-6 h-6" />}
            label="Ditolak"
            value={stats.ditolak}
            color="red"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/permohonan"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
            >
              <div>
                <p className="font-semibold text-gray-900">Buat Permohonan Baru</p>
                <p className="text-sm text-gray-600">Mulai pengajuan surat</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-blue-600" />
            </Link>

            <Link
              href="/tracking"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition border border-green-200"
            >
              <div>
                <p className="font-semibold text-gray-900">Lacak Surat</p>
                <p className="text-sm text-gray-600">Lihat status permohonan</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-green-600" />
            </Link>

            <Link
              href="/profile"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition border border-purple-200"
            >
              <div>
                <p className="font-semibold text-gray-900">Kelola Akun</p>
                <p className="text-sm text-gray-600">Edit profil Anda</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-purple-600" />
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Permohonan Terbaru</h2>
            {!dataLoading && (
              <button
                onClick={fetchPermohonanData}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Refresh
              </button>
            )}
          </div>

          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : permohonan.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Anda belum memiliki permohonan</p>
              <Link href="/permohonan" className="text-blue-600 hover:underline mt-2 inline-block">
                Buat permohonan pertama Anda →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Jenis Surat</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Tanggal</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {permohonan.slice(0, 5).map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{item.jenis_surat}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-2 ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {new Date(item.tanggal_dibuat).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tracking/${item.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Lihat Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {permohonan.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/tracking" className="text-blue-600 hover:underline font-medium">
                Lihat semua permohonan →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatsCard({ icon, label, value, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}
