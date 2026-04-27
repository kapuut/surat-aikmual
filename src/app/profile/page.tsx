'use client';

import { useRequireAuth } from '@/lib/useAuth';
import { useState, FormEvent, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiSave, FiEye, FiEyeOff, FiMail, FiMapPin, FiPhone, FiShield, FiUser } from 'react-icons/fi';
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
      <SimpleLayout useSidebar>
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
      const response = await fetch('/api/auth/change-password', {
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
          message: data.message || 'Password berhasil diubah! Silakan login kembali dengan password baru.',
        });
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/login';
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
    <SimpleLayout useSidebar>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
                {(formData.nama || user.nama || 'MS')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join('') || 'MS'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Kelola Profil</h1>
                <p className="text-sm text-slate-600">Semua pengaturan akun dan password ada di halaman ini.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">NIK / Username</p>
              <p className="mt-1 font-semibold text-slate-900">{user.username || '-'}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <FiMail className="h-3.5 w-3.5" /> Email
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800 break-all">{formData.email || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <FiPhone className="h-3.5 w-3.5" /> Telepon
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formData.telepon || '-'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <FiMapPin className="h-3.5 w-3.5" /> Alamat
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{formData.alamat || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Informasi Profil</h2>
              <p className="mt-1 text-sm text-slate-600">Perbarui data pribadi agar layanan administrasi tetap akurat.</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {alert && (
                  <div
                    className={`rounded-lg p-3 flex items-center gap-3 ${
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

                <div className="pb-4 border-b border-slate-200">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Identitas Akun</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{user.username}</p>
                </div>

                <div>
                  <label htmlFor="nama" className="mb-1 block text-sm font-medium text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Masukkan email"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="telepon" className="mb-1 block text-sm font-medium text-slate-700">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="telepon"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleChange}
                    placeholder="Masukkan nomor telepon"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="alamat" className="mb-1 block text-sm font-medium text-slate-700">
                    Alamat
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-slate-400"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Keamanan Akun</h2>
              <p className="mt-1 text-sm text-slate-600">Ubah password secara berkala agar akun tetap aman.</p>
            </div>

            <div className="p-6">
              {passwordAlert && (
                <div
                  className={`rounded-lg p-3 flex items-center gap-3 mb-4 ${
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

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-4">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <FiShield className="h-4 w-4 mt-0.5" />
                  Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang lebih kuat.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="mb-1 block text-sm font-medium text-slate-700">
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
                      className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 ${
                        passwordErrors.oldPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                    >
                      {showPasswords.old ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.oldPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
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
                      className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 ${
                        passwordErrors.newPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                    >
                      {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
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
                      className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 ${
                        passwordErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                    >
                      {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-500"
                  >
                    <FiShield className="w-4 h-4" />
                    {savingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">Setelah password berhasil diubah, Anda akan diarahkan ke halaman login.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}
