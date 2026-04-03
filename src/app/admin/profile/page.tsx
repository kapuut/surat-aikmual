"use client";

import { FormEvent, useEffect, useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

type AdminProfile = {
  id: string;
  username: string;
  nama: string;
  email: string;
  role: string;
  status: string;
  created_at?: string;
  last_login?: string;
};

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<'data' | 'keamanan'>('data');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Data Pribadi State
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Keamanan State
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
  const [secError, setSecError] = useState('');
  const [secMessage, setSecMessage] = useState('');
  const [secLoading, setSecLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/profile', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat profil admin');
      }

      const fetchedProfile = data.profile as AdminProfile;
      setProfile(fetchedProfile);
      setNama(fetchedProfile.nama || '');
      setEmail(fetchedProfile.email || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat profil admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!nama || !email) {
      setError('Nama dan email wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama,
          email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil admin');
      }

      setMessage(data.message || 'Profil admin berhasil diperbarui');
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil admin');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError('');
    setSecMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setSecError('Konfirmasi password tidak cocok');
      return;
    }

    if (!isPasswordStrong) {
      setSecError('Password tidak memenuhi kriteria keamanan');
      return;
    }

    setSecLoading(true);

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

      setSecMessage('Password berhasil diubah!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSecError(err instanceof Error ? err.message : 'Gagal mengubah password');
    } finally {
      setSecLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 flex items-center justify-center min-h-screen">Memuat profil admin...</div>;
  }

  return (
    <section className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'data'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Data Pribadi
        </button>
        <button
          onClick={() => setActiveTab('keamanan')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'keamanan'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Keamanan
        </button>
      </div>

      {/* Tab Content - Data Pribadi */}
      {activeTab === 'data' && (
        <div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}
          {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">{message}</div>}

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 mb-6">
            <p className="text-sm text-gray-600">Username: <span className="font-semibold text-gray-900">{profile?.username}</span></p>
            <p className="text-sm text-gray-600">Role: <span className="font-semibold text-gray-900">{profile?.role}</span></p>
            <p className="text-sm text-gray-600">Status: <span className="font-semibold text-gray-900">{profile?.status}</span></p>
            <p className="text-sm text-gray-600">Last Login: <span className="font-semibold text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleString('id-ID') : 'Belum pernah'}</span></p>
          </div>

          <form onSubmit={handleProfileSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Content - Keamanan */}
      {activeTab === 'keamanan' && (
        <div>
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

          {secMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {secMessage}
            </div>
          )}

          {secError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {secError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 max-w-2xl">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            </div>

            <button
              type="submit"
              disabled={secLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {secLoading ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
