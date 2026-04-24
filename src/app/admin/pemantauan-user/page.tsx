"use client";

import { useState, useEffect } from "react";
import { FiUsers, FiActivity, FiClock, FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiSave, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { AuthUser, UserRole } from "@/lib/types";
import Notification from "@/components/shared/Notification";

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

interface UserData {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: UserRole;
  status: 'aktif' | 'nonaktif';
  nik?: string;
  alamat?: string;
  telepon?: string;
  dokumen_ktp_path?: string | null;
  dokumen_kk_path?: string | null;
  created_at: string;
  last_login?: string;
}

type NotificationState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

export default function PemantauanUserPage() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'hakakses'>('monitoring');
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedVerificationUser, setSelectedVerificationUser] = useState<UserData | null>(null);
  const [approveLoadingUserId, setApproveLoadingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nama: '',
    role: 'masyarakat' as UserRole,
    status: 'aktif' as 'aktif' | 'nonaktif',
    nik: '',
    alamat: '',
    telepon: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchUsersMonitoring();
      const interval = setInterval(fetchUsersMonitoring, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!notification) return;

    const timeout = window.setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const fetchUsersMonitoring = async () => {
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat data pengguna');
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showNotification('error', error instanceof Error ? error.message : 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsersMonitoring = usersData?.users.filter(user => {
    const roleMatch = filterRole === "all" || user.role === filterRole;
    return roleMatch;
  }) || [];

  const filteredUsersAccess = users.filter(u => {
    const matchesSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const endpoint = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';

      const method = editingUser ? 'PUT' : 'POST';
      const payload = {
        ...formData,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan data pengguna');
      }

      showNotification('success', data.message || (editingUser ? 'Data pengguna berhasil diupdate!' : 'Data pengguna berhasil ditambahkan!'));
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data pengguna!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (userData: UserData) => {
    setEditingUser(userData);
    setFormData({
      username: userData.username,
      email: userData.email,
      nama: userData.nama,
      role: userData.role,
      status: userData.status,
      nik: userData.nik || '',
      alamat: userData.alamat || '',
      telepon: userData.telepon || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    setPendingDeleteUserId(userId);
  };

  const openDocument = (path?: string | null) => {
    if (!path) {
      showNotification('warning', 'Dokumen belum tersedia');
      return;
    }

    window.open(path, '_blank', 'noopener,noreferrer');
  };

  const normalizeNik = (nik?: string) => {
    if (!nik) return '-';
    return String(nik).split('_')[0] || '-';
  };

  const handleApproveUser = async (userData: UserData) => {
    if (
      userData.role === 'masyarakat' &&
      (!userData.dokumen_ktp_path || !userData.dokumen_kk_path)
    ) {
      showNotification('warning', 'Dokumen KTP dan KK harus tersedia sebelum akun masyarakat di-ACC.');
      return;
    }

    try {
      setApproveLoadingUserId(userData.id);

      const payload = {
        username: userData.username,
        nama: userData.nama,
        email: userData.email,
        nik: userData.nik || '',
        role: userData.role,
        alamat: userData.alamat || '',
        telepon: userData.telepon || '',
        status: 'aktif',
      };

      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengaktifkan akun pengguna');
      }

      showNotification('success', 'Akun berhasil diaktifkan (ACC)');
      setSelectedVerificationUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      showNotification('error', error instanceof Error ? error.message : 'Gagal mengaktifkan akun pengguna');
    } finally {
      setApproveLoadingUserId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteUserId) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/users/${pendingDeleteUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus data pengguna');
      }

      showNotification('success', data.message || 'Data pengguna berhasil dihapus!');
      setPendingDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus data pengguna!');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      nama: '',
      role: 'masyarakat',
      status: 'aktif',
      nik: '',
      alamat: '',
      telepon: '',
      password: ''
    });
  };

  if (loading && !usersData && !users.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data user...</p>
        </div>
      </div>
    );
  }

  return (
    <section>
      {notification && (
        <div className="fixed top-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm">
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-end">
          {activeTab === 'monitoring' && (
            <button
              onClick={fetchUsersMonitoring}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
          {activeTab === 'hakakses' && (
            <button
              onClick={() => {
                resetForm();
                setEditingUser(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Tambah User</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'monitoring'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pemantauan Aktivitas
        </button>
        <button
          onClick={() => setActiveTab('hakakses')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'hakakses'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Hak Akses Pengguna
        </button>
      </div>

      {/* Tab Content - Monitoring */}
      {activeTab === 'monitoring' && (
        <div>
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
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Administrator</option>
                  <option value="sekretaris">Sekretaris</option>
                  <option value="kepala_desa">Kepala Desa</option>
                  <option value="masyarakat">Masyarakat</option>
                </select>
              </div>

              <div className="ml-auto flex items-end">
                <p className="text-sm text-gray-600">
                  Menampilkan {filteredUsersMonitoring.length} dari {usersData?.totalUsers || 0} user
                </p>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Login Terakhir</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsersMonitoring.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada user yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredUsersMonitoring.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
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
        </div>
      )}

      {/* Tab Content - Hak Akses */}
      {activeTab === 'hakakses' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="sekretaris">Sekretaris</option>
                <option value="kepala_desa">Kepala Desa</option>
                <option value="masyarakat">Masyarakat</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredUsersAccess.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data user
                      </td>
                    </tr>
                  ) : (
                    filteredUsersAccess.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userData.nama}</div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                            <div className="text-xs text-gray-400">@{userData.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : userData.role === 'sekretaris'
                              ? 'bg-blue-100 text-blue-800'
                              : userData.role === 'kepala_desa'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userData.role === 'kepala_desa' ? 'kepala desa' : userData.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userData.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userData.last_login ? new Date(userData.last_login).toLocaleDateString('id-ID') : 'Belum pernah'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedVerificationUser(userData)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100"
                              title="Verifikasi Data"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {userData.status === 'nonaktif' && (
                              <button
                                onClick={() => handleApproveUser(userData)}
                                disabled={approveLoadingUserId === userData.id}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100 disabled:text-green-300 disabled:cursor-not-allowed"
                                title="ACC & Aktifkan"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(userData)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(userData.id.toString())}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                              title="Hapus"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedVerificationUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Verifikasi Data Pendaftar</h2>
              <button
                onClick={() => setSelectedVerificationUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama</p>
                <p className="font-medium text-gray-900">{selectedVerificationUser.nama || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">NIK</p>
                <p className="font-medium text-gray-900">{normalizeNik(selectedVerificationUser.nik)}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{selectedVerificationUser.email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Telepon</p>
                <p className="font-medium text-gray-900">{selectedVerificationUser.telepon || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Alamat</p>
                <p className="font-medium text-gray-900 whitespace-pre-line">{selectedVerificationUser.alamat || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Status Akun</p>
                <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedVerificationUser.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedVerificationUser.status === 'aktif' ? 'Aktif' : 'Menunggu ACC Admin'}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Tanggal Daftar</p>
                <p className="font-medium text-gray-900">{selectedVerificationUser.created_at ? new Date(selectedVerificationUser.created_at).toLocaleString('id-ID') : '-'}</p>
              </div>
            </div>

            <div className="mt-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Dokumen Verifikasi Warga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openDocument(selectedVerificationUser.dokumen_ktp_path)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
                >
                  <p className="font-medium text-gray-900">Lihat Dokumen KTP</p>
                  <p className="text-xs text-gray-500 mt-1">Klik untuk buka dokumen KTP</p>
                </button>
                <button
                  type="button"
                  onClick={() => openDocument(selectedVerificationUser.dokumen_kk_path)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
                >
                  <p className="font-medium text-gray-900">Lihat Dokumen KK</p>
                  <p className="text-xs text-gray-500 mt-1">Klik untuk buka dokumen Kartu Keluarga</p>
                </button>
              </div>
              {(!selectedVerificationUser.dokumen_ktp_path || !selectedVerificationUser.dokumen_kk_path) && (
                <p className="text-xs text-amber-700 mt-3">
                  Dokumen KTP/KK belum lengkap. Pastikan data pendaftar valid sebelum akun diaktifkan.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedVerificationUser(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
              {selectedVerificationUser.status !== 'aktif' && (
                <button
                  type="button"
                  onClick={() => handleApproveUser(selectedVerificationUser)}
                  disabled={approveLoadingUserId === selectedVerificationUser.id}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>{approveLoadingUserId === selectedVerificationUser.id ? 'Memproses...' : 'ACC & Aktifkan Akun'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="masyarakat">Masyarakat</option>
                  <option value="admin">Administrator</option>
                  <option value="sekretaris">Sekretaris</option>
                  <option value="kepala_desa">Kepala Desa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'nonaktif'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK (opsional)
                </label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={(e) => setFormData({...formData, nik: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  maxLength={16}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat (opsional)
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon (opsional)
                </label>
                <input
                  type="tel"
                  value={formData.telepon}
                  onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(kosongkan jika tidak diubah)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{submitLoading ? 'Menyimpan...' : (editingUser ? 'Update' : 'Simpan')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteUserId && (
        <div className="modal-backdrop">
          <div className="modal animate-slideUp">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            <div className="modal-body">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus user ini?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setPendingDeleteUserId(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
