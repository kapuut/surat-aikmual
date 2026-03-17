"use client";

import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validasi kekuatan password
  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.newPassword);
  const isPasswordStrong = Object.values(passwordChecks).every(check => check);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password tidak memenuhi kriteria keamanan');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah password');
      }

      setMessage('Password berhasil diubah!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ubah Password</h1>
          
          {/* Alert Keamanan */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FiLock className="text-blue-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Tips Keamanan Password</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Gunakan password yang kuat untuk melindungi akun Anda. Disarankan mengganti password secara berkala.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Lama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword.current ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword.new ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              {/* Indikator Kekuatan Password */}
              {formData.newPassword && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Kriteria Password:</p>
                  <div className="space-y-1">
                    {[
                      { key: 'length', label: 'Minimal 8 karakter' },
                      { key: 'uppercase', label: 'Mengandung huruf besar (A-Z)' },
                      { key: 'lowercase', label: 'Mengandung huruf kecil (a-z)' },
                      { key: 'number', label: 'Mengandung angka (0-9)' },
                      { key: 'symbol', label: 'Mengandung simbol (@$!%*?&)' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center text-sm">
                        {passwordChecks[key as keyof typeof passwordChecks] ? (
                          <FiCheck className="text-green-500 mr-2" size={16} />
                        ) : (
                          <FiX className="text-red-500 mr-2" size={16} />
                        )}
                        <span className={passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-700' : 'text-red-700'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword.confirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">Password tidak cocok</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong || formData.newPassword !== formData.confirmPassword}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Mengubah Password...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}