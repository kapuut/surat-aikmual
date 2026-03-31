'use client';

import { useRequireAuth } from '@/lib/useAuth';
import { useState, FormEvent, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import SimpleLayout from '@/components/layout/SimpleLayout';

interface ProfileFormData {
  nama: string;
  email: string;
  alamat: string;
  telepon: string;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

type AlertType = 'success' | 'error' | null;

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useRequireAuth();
  
  // Profile Form State
  const [formData, setFormData] = useState<ProfileFormData>({
    nama: '',
    email: '',
    alamat: '',
    telepon: '',
  });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<{ type: AlertType; message: string } | null>(null);

  // Initialize form data ketika user loaded
  useEffect(() => {
    if (user) {
      setFormData({
        nama: user.nama || '',
        email: user.email || '',
        alamat: user.alamat || '',
        telepon: user.telepon || '',
      });
    }
  }, [user]);

  if (loading) {
    return (
      <SimpleLayout>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </SimpleLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Profile Form Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Profil berhasil diperbarui!',
        });
      } else {
        setAlert({
          type: 'error',
          message: data.error || 'Gagal memperbarui profil',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat menyimpan data',
      });
    } finally {
      setSaving(false);
    }
  };

  // Password Form Handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name as keyof FormErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!passwordForm.oldPassword.trim()) {
      newErrors.oldPassword = 'Password lama harus diisi';
    }

    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password baru minimal 6 karakter';
    }

    if (!passwordForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dengan password lama';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setSavingPassword(true);
    setPasswordAlert(null);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordAlert({
          type: 'success',
          message: 'Password berhasil diubah! Silakan login kembali dengan password baru.',
        });
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        // Optional: redirect to login after success
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setPasswordAlert({
          type: 'error',
          message: data.error || 'Gagal mengubah password',
        });
      }
    } catch (error) {
      setPasswordAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat mengubah password',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-white py-12">
        {/* Container */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Akun</h1>
            <p className="text-gray-600">Kelola informasi dan keamanan akun Anda dengan aman</p>
          </div>

          {/* Profil Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow mb-8">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Profil</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Alert */}
                {alert && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      alert.type === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {alert.type === 'success' ? (
                      <FiCheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
                    ) : (
                      <FiAlertCircle className="text-red-600 w-5 h-5 flex-shrink-0" />
                    )}
                    <p className={alert.type === 'success' ? 'text-green-800 text-sm' : 'text-red-800 text-sm'}>
                      {alert.message}
                    </p>
                  </div>
                )}

                <div className="pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Username / ID</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{user.username}</p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Masukkan email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition"
                    required
                  />
                </div>

                {/* Alamat */}
                <div>
                  <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition"
                  ></textarea>
                </div>

                {/* Telepon */}
                <div>
                  <label htmlFor="telepon" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="telepon"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    placeholder="Masukkan nomor telepon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition text-sm font-medium"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Ganti Password Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Ganti Password</h2>
            </div>
            
            <div className="p-6">
              {/* Alert */}
              {passwordAlert && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-3 mb-4 ${
                    passwordAlert.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {passwordAlert.type === 'success' ? (
                    <FiCheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
                  ) : (
                    <FiAlertCircle className="text-red-600 w-5 h-5 flex-shrink-0" />
                  )}
                  <p className={passwordAlert.type === 'success' ? 'text-green-800 text-sm' : 'text-red-800 text-sm'}>
                    {passwordAlert.message}
                  </p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Password Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    Password harus minimal 6 karakter dan terdiri dari kombinasi huruf, angka, dan simbol.
                  </p>
                </div>

                {/* Password Lama */}
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password Lama
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.old ? 'text' : 'password'}
                      id="oldPassword"
                      name="oldPassword"
                      value={passwordForm.oldPassword}
                      onChange={handlePasswordChange}
                      placeholder="Masukkan password lama"
                      className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-1 focus:border-transparent pr-10 transition text-sm ${
                        passwordErrors.oldPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    >
                      {showPasswords.old ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.oldPassword}</p>
                  )}
                </div>

                {/* Password Baru */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-1 focus:border-transparent pr-10 transition text-sm ${
                        passwordErrors.newPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    >
                      {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Konfirmasi password baru"
                      className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-1 focus:border-transparent pr-10 transition text-sm ${
                        passwordErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                    >
                      {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition text-sm font-medium"
                  >
                    <FiSave className="w-4 h-4" />
                    {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}
