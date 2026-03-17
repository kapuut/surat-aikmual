"use client";

import { FormEvent, useEffect, useState } from 'react';

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
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!nama || !email) {
      setError('Nama dan email wajib diisi');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Password lama wajib diisi untuk mengganti password');
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
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil admin');
      }

      setMessage(data.message || 'Profil admin berhasil diperbarui');
      setCurrentPassword('');
      setNewPassword('');
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil admin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Memuat profil admin...</div>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Admin</h1>
        <p className="text-gray-600 mt-1">Lihat dan perbarui data profil admin.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">{message}</div>}

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <p className="text-sm text-gray-600">Username: <span className="font-semibold text-gray-900">{profile?.username}</span></p>
        <p className="text-sm text-gray-600">Role: <span className="font-semibold text-gray-900">{profile?.role}</span></p>
        <p className="text-sm text-gray-600">Status: <span className="font-semibold text-gray-900">{profile?.status}</span></p>
        <p className="text-sm text-gray-600">Last Login: <span className="font-semibold text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleString('id-ID') : 'Belum pernah'}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama (opsional)</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Isi jika ingin ganti password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru (opsional)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Minimal 8 karakter"
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
    </section>
  );
}
