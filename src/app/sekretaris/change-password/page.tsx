"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";

type SekretarisProfile = {
  id: string | number;
  username: string;
  nama: string;
  email: string;
  role: string;
  status?: string;
  nik?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  last_login?: string | null;
};

export default function SekretarisChangePasswordPage() {
  const router = useRouter();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<SekretarisProfile | null>(null);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError("");

      const response = await fetch("/api/auth/verify", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data?.user) {
        throw new Error(data?.error || "Gagal memuat profil");
      }

      const user = data.user as SekretarisProfile;
      setProfile(user);
      setNama(String(user.nama || ""));
      setEmail(String(user.email || ""));
      setAlamat(String(user.alamat || ""));
      setTelepon(String(user.telepon || ""));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Gagal memuat profil");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    if (!nama.trim() || !email.trim()) {
      setProfileError("Nama dan email wajib diisi.");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama,
          email,
          alamat,
          telepon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal menyimpan profil");
      }

      setProfileMessage(data?.message || "Profil berhasil diperbarui.");
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nama,
          email,
          alamat,
          telepon,
        };
      });
      window.dispatchEvent(new Event("profile-updated"));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Gagal menyimpan profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Semua field password wajib diisi.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setSavingPassword(true);
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengubah password");
      }

      setPasswordMessage(data?.message || "Password berhasil diubah. Silakan login kembali.");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => {
        router.replace(data?.redirectUrl || "/sekretaris/login");
      }, 1200);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return <div className="text-gray-500">Memuat profil akun...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p className="text-gray-600">Username: <span className="font-semibold text-gray-900">{profile?.username || "-"}</span></p>
          <p className="text-gray-600">Role: <span className="font-semibold text-gray-900">{profile?.role || "-"}</span></p>
          <p className="text-gray-600">Status: <span className="font-semibold text-gray-900">{profile?.status || "-"}</span></p>
          <p className="text-gray-600">NIK: <span className="font-semibold text-gray-900">{profile?.nik || "-"}</span></p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ubah Profil</h3>

        {profileError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-start gap-2">
            <FiAlertCircle className="mt-0.5" /> {profileError}
          </div>
        )}

        {profileMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm flex items-start gap-2">
            <FiCheckCircle className="mt-0.5" /> {profileMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {savingProfile ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiLock className="text-blue-600" /> Ubah Password
        </h3>

        {passwordError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-start gap-2">
            <FiAlertCircle className="mt-0.5" /> {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm flex items-start gap-2">
            <FiCheckCircle className="mt-0.5" /> {passwordMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <div className="relative">
              <input
                type={showPassword.old ? "text" : "password"}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => ({ ...prev, old: !prev.old }))}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword.old ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword.next ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword.next ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {savingPassword ? "Memproses..." : "Ubah Password"}
        </button>
      </form>
    </section>
  );
}
