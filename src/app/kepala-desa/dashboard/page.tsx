"use client";

import { useState, useEffect, useMemo } from 'react';
import { AuthUser } from '@/lib/types';
import { useSharedStats } from "@/components/dashboard/SharedStats";
import { 
  FiInbox, 
  FiSend, 
  FiFileText, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiActivity,
  FiCalendar,
  FiArrowRight,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';

export default function HeadVillageDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { stats, loading: statsLoading } = useSharedStats();

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const pendingApproval = stats?.permohonan.pending ?? 0;
  const pendingSignature = 5; // Placeholder

  // Dummy data for pending approvals
  const [pendingApprovals] = useState([
    { id: 'P-001/2025', jenisSurat: 'Surat Keterangan Tidak Mampu', pemohon: 'Budi Santoso', tanggal: '2025-01-10', priority: 'high' },
    { id: 'P-002/2025', jenisSurat: 'Surat Keterangan Domisili', pemohon: 'Ani Wijaya', tanggal: '2025-01-09', priority: 'normal' },
    { id: 'P-003/2025', jenisSurat: 'Surat Pengantar KTP', pemohon: 'Citra Dewi', tanggal: '2025-01-08', priority: 'normal' }
  ]);

  // Dummy data for recent approvals
  const [recentApprovals] = useState([
    { id: 'P-098/2024', jenisSurat: 'Surat Keterangan Usaha', pemohon: 'Dedi Hartono', tglDisetujui: '2025-01-09', status: 'Disetujui' },
    { id: 'P-099/2024', jenisSurat: 'Surat Keterangan Domisili', pemohon: 'Eka Putri', tglDisetujui: '2025-01-08', status: 'Disetujui' },
    { id: 'P-100/2024', jenisSurat: 'Surat Pengantar Nikah', pemohon: 'Fajar Ramadhan', tglDisetujui: '2025-01-07', status: 'Disetujui' }
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  if (statsLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Kepala Desa</h1>
            <p className="text-gray-600 mt-1">Selamat datang, {user.nama}</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FiCalendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Alert */}
      {pendingApproval > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 text-orange-400 mr-3" />
            <div>
              <p className="text-orange-800 font-medium">
                Ada {pendingApproval} permohonan yang menunggu persetujuan Anda
              </p>
              <p className="text-orange-700 text-sm mt-1">
                Silakan periksa dan berikan persetujuan segera.
              </p>
            </div>
            <a 
              href="/kepala-desa/approval" 
              className="ml-auto bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
            >
              Lihat Permohonan
            </a>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Permohonan Pending */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Menunggu Persetujuan</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pendingApproval}</p>
              <div className="flex items-center text-sm text-orange-600">
                <FiClock className="w-4 h-4 mr-1" />
                <span>Perlu tindakan</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Permohonan Disetujui */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Telah Disetujui</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats?.permohonan.disetujui ?? 0}</p>
              <div className="flex items-center text-sm text-green-600">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Surat Perlu Tanda Tangan */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Perlu Tanda Tangan</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pendingSignature}</p>
              <div className="flex items-center text-sm text-blue-600">
                <FiFileText className="w-4 h-4 mr-1" />
                <span>Siap ditandatangani</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Surat Bulan Ini */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Surat</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{(stats?.suratMasuk.bulanIni ?? 0) + (stats?.suratKeluar.bulanIni ?? 0)}</p>
              <div className="flex items-center text-sm text-purple-600">
                <FiActivity className="w-4 h-4 mr-1" />
                <span>Bulan ini</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiSend className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiClock className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Menunggu Persetujuan</h3>
              </div>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                {pendingApprovals.length} item
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{item.id}</p>
                        {item.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.jenisSurat}</p>
                      <p className="text-xs text-gray-500 mt-1">Pemohon: {item.pemohon}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">{item.tanggal}</span>
                      <div className="mt-1">
                        <button className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors">
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="/kepala-desa/approval" className="text-orange-600 text-sm hover:underline flex items-center">
                Lihat semua permohonan
                <FiArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Recent Approvals */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Persetujuan Terbaru</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentApprovals.map((item) => (
                <div key={item.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{item.id}</p>
                      <p className="text-sm text-gray-600">{item.jenisSurat}</p>
                      <p className="text-xs text-gray-500 mt-1">Pemohon: {item.pemohon}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Disetujui: {item.tglDisetujui}</span>
                      <div className="mt-1">
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a href="/kepala-desa/laporan" className="text-green-600 text-sm hover:underline flex items-center">
                Lihat laporan lengkap
                <FiArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}