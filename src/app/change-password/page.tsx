'use client';

import { useRequireAuth } from '@/lib/hooks';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import UserNavbar from '@/components/UserNavbar';

interface FormData {
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

export default function ChangePasswordPage() {
  const { loading, isAuthenticated } = useRequireAuth();
  const [formData, setFormData] = useState<FormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = 'Password lama harus diisi';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password baru minimal 6 karakter';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dengan password lama';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({
          type: 'success',
          message: 'Password berhasil diubah!',
        });
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        // Reset untuk ke dashboard setelah 2 detik
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: data.error || 'Gagal mengubah password',
        });
        setErrors({
          general: data.error || 'Gagal mengubah password',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat mengubah password',
      });
      setErrors({
        general: 'Terjadi kesalahan saat mengubah password',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ganti Password</h1>
            <p className="text-gray-600 mt-1">Perbarui password akun Anda</p>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
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
            <p className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Gunakan password yang kuat: kombinasi huruf besar, huruf kecil, angka, dan simbol.
            </p>
          </div>

          {/* Password Lama */}
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showPasswords.old ? 'text' : 'password'}
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Masukkan password lama"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  errors.oldPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords(prev => ({
                    ...prev,
                    old: !prev.old,
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.old ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.oldPassword}</p>
            )}
          </div>

          {/* Password Baru */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Masukkan password baru"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  errors.newPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords(prev => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
            )}
            {formData.newPassword && !errors.newPassword && (
              <p className="text-green-600 text-sm mt-1">✓ Password memenuhi persyaratan</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password baru"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords(prev => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
            {formData.confirmPassword &&
              formData.newPassword === formData.confirmPassword &&
              !errors.confirmPassword && (
                <p className="text-green-600 text-sm mt-1">✓ Password cocok</p>
              )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              <FiLock className="w-5 h-5" />
              {saving ? 'Mengubah...' : 'Ubah Password'}
            </button>
            <Link
              href="/"
              className="flex-1 bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium text-center"
            >
              Batal
            </Link>
          </div>
        </form>

        {/* Security Tips */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Tips Keamanan Password</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Gunakan minimum 8 karakter</li>
            <li>✓ Kombinasikan huruf besar dan kecil</li>
            <li>✓ Tambahkan angka dan simbol (!@#$%)</li>
            <li>✓ Jangan gunakan informasi pribadi (nama, tanggal lahir)</li>
            <li>✓ Buatkan password yang unik dan tidak mudah ditebak</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
