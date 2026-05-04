"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUpload,
} from "react-icons/fi";

type KepalaDesaProfile = {
  id: string;
  username: string;
  nama: string;
  email: string;
  role: string;
  status: string;
  nik?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  signature_url?: string | null;
  last_login?: string | null;
};

export default function KepalaDesaProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<KepalaDesaProfile | null>(null);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    next: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState("");
  const [signatureMessage, setSignatureMessage] = useState("");
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kepala-desa/profile", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Gagal memuat profil");
      }

      const fetchedProfile = data.profile as KepalaDesaProfile;
      setProfile(fetchedProfile);
      setNama(fetchedProfile.nama || "");
      setEmail(fetchedProfile.email || "");
      setAlamat(String(fetchedProfile.alamat || ""));
      setTelepon(String(fetchedProfile.telepon || ""));
      setSignaturePreviewUrl(fetchedProfile.signature_url ? `${fetchedProfile.signature_url}?t=${Date.now()}` : "");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Gagal memuat profil");
    } finally {
      setLoading(false);
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

    setSavingProfile(true);
    try {
      const response = await fetch("/api/kepala-desa/profile", {
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
      await fetchProfile();
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Gagal menyimpan profil");
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

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    setSavingPassword(true);
    try {
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
        window.location.href = data?.redirectUrl || "/kepala-desa/login";
      }, 1200);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignatureUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignatureError("");
    setSignatureMessage("");

    if (!signatureFile) {
      setSignatureError("Pilih file tanda tangan terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("signature", signatureFile);

    setUploadingSignature(true);
    try {
      const response = await fetch("/api/kepala-desa/profile/signature", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Gagal upload tanda tangan");
      }

      setSignatureMessage(data?.message || "File tanda tangan berhasil diunggah.");
      setSignaturePreviewUrl(String(data?.signature_url || ""));
      setSignatureFile(null);
    } catch (err) {
      setSignatureError(err instanceof Error ? err.message : "Gagal upload tanda tangan");
    } finally {
      setUploadingSignature(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Memuat profil akun...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p className="text-gray-600">Username: <span className="font-semibold text-gray-900">{profile?.username}</span></p>
          <p className="text-gray-600">Role: <span className="font-semibold text-gray-900">{profile?.role}</span></p>
          <p className="text-gray-600">Status: <span className="font-semibold text-gray-900">{profile?.status}</span></p>
          <p className="text-gray-600">Login Terakhir: <span className="font-semibold text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleString("id-ID") : "Belum pernah"}</span></p>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60"
        >
          {savingProfile ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiLock className="text-purple-600" /> Ubah Password
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60"
        >
          {savingPassword ? "Memproses..." : "Ubah Password"}
        </button>
      </form>

      <form onSubmit={handleSignatureUpload} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiUpload className="text-purple-600" /> Upload File Tanda Tangan
        </h3>

        <p className="text-sm text-gray-600">
          Upload hanya file tanda tangan. QR code akan dibuat otomatis oleh sistem saat surat diverifikasi dan ditandatangani.
        </p>

        {signatureError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-start gap-2">
            <FiAlertCircle className="mt-0.5" /> {signatureError}
          </div>
        )}

        {signatureMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm flex items-start gap-2">
            <FiCheckCircle className="mt-0.5" /> {signatureMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File TTD (PNG/JPG/WEBP, max 2MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
            />
            <button
              type="submit"
              disabled={uploadingSignature}
              className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60"
            >
              {uploadingSignature ? "Mengunggah..." : "Upload TTD"}
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview TTD Aktif</p>
            {signaturePreviewUrl ? (
              <img
                src={signaturePreviewUrl}
                alt="Preview tanda tangan Kepala Desa"
                className="h-36 w-full object-contain border border-gray-200 rounded-lg bg-gray-50"
              />
            ) : (
              <div className="h-36 w-full border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                Belum ada file tanda tangan diupload
              </div>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
