"use client";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { useState, useEffect } from 'react';
import { AuthUser, UserRole } from '@/lib/types';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiEye,
  FiEyeOff,
  FiSave,
  FiX
} from 'react-icons/fi';

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
  created_at: string;
  last_login?: string;
}

export default function UserManagementPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

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
    fetchUser();
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat data masyarakat');
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert(error instanceof Error ? error.message : 'Gagal memuat data masyarakat');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
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
        role: 'masyarakat',
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
        throw new Error(data.error || 'Gagal menyimpan data masyarakat');
      }

      alert(data.message || (editingUser ? 'Data masyarakat berhasil diupdate!' : 'Data masyarakat berhasil ditambahkan!'));
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data masyarakat!');
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
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Gagal menghapus data masyarakat');
        }
        alert(data.message || 'Data masyarakat berhasil dihapus!');
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus data masyarakat!');
      }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <DashboardLayout user={user}>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiUsers className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Data Masyarakat</h1>
                  <p className="text-gray-600 mt-1">Kelola akun masyarakat yang terdaftar</p>
                </div>
              </div>
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
            </div>
          </div>

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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data user
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userData) => (
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
                              onClick={() => handleEdit(userData)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(userData.id)}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value="Masyarakat"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'nonaktif'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </DashboardLayout>
    </AdminGuard>
  );
}