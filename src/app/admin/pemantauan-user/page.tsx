"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiActivity, FiClock, FiRefreshCw, FiUser } from "react-icons/fi";

interface User {
  id: number;
  username: string;
  nama: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline: boolean;
}

interface UsersData {
  users: User[];
  totalActive: number;
  totalUsers: number;
}

export default function PemantauanUserPage() {
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/active-users", {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users data");
      }

      const data = await response.json();
      setUsersData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "sekretaris":
        return "bg-blue-100 text-blue-800";
      case "kepala_desa":
        return "bg-purple-100 text-purple-800";
      case "masyarakat":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      admin: "Administrator",
      sekretaris: "Sekretaris",
      kepala_desa: "Kepala Desa",
      masyarakat: "Masyarakat"
    };
    return labels[role] || role;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Belum pernah login";
    
    const now = new Date().getTime();
    const loginTime = new Date(dateString).getTime();
    const diff = now - loginTime;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  const filteredUsers = usersData?.users.filter(user => {
    const roleMatch = filterRole === "all" || user.role === filterRole;
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "online" && user.isOnline) ||
      (filterStatus === "offline" && !user.isOnline);
    return roleMatch && statusMatch;
  }) || [];

  if (loading && !usersData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data user...</p>
        </div>
      </div>
    );
  }

  if (error && !usersData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FiUsers className="text-blue-600" /> Pemantauan User
            </h2>
            <p className="text-gray-500 mt-1">
              Pantau aktivitas dan status login user dalam sistem
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total User Aktif</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usersData?.totalUsers || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">User Online</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{usersData?.totalActive || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Aktif dalam 30 menit terakhir</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiActivity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">User Offline</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {(usersData?.totalUsers || 0) - (usersData?.totalActive || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tidak aktif</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FiClock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="sekretaris">Sekretaris</option>
              <option value="kepala_desa">Kepala Desa</option>
              <option value="masyarakat">Masyarakat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="ml-auto flex items-end">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredUsers.length} dari {usersData?.totalUsers || 0} user
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Login Terakhir</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada user yang sesuai filter
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          user.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      ></div>
                      <span className={`text-xs font-medium ${
                        user.isOnline ? "text-green-600" : "text-gray-600"
                      }`}>
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.nama}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(user.lastLogin)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Auto Refresh Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          <FiRefreshCw className="inline w-3 h-3 mr-1" />
          Data diperbarui otomatis setiap 30 detik
        </p>
      </div>
    </section>
  );
}
