"use client";

import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function SekretarisChangePasswordPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });
    
    // Validation
    let hasError = false;
    const newErrors = { oldPassword: "", newPassword: "", confirmPassword: "" };
    
    if (!formData.oldPassword) {
      newErrors.oldPassword = "Password lama harus diisi";
      hasError = true;
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Password baru harus diisi";
      hasError = true;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password baru minimal 6 karakter";
      hasError = true;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password harus diisi";
      hasError = true;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok";
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    // TODO: Call API to change password
    alert("Password berhasil diubah!");
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FiLock className="text-blue-600" /> Ubah Password
        </h2>
        <p className="text-gray-500 mt-1">
          Ubah password akun Anda untuk keamanan yang lebih baik
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              {/* Password Lama */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Lama <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.oldPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.oldPassword}</p>
                )}
              </div>

              {/* Password Baru */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ulangi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ubah Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                    setErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>ℹ️</span> Tips Password Aman
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Minimal 6 karakter</li>
              <li>• Gunakan kombinasi huruf dan angka</li>
              <li>• Hindari kata yang mudah ditebak</li>
              <li>• Jangan gunakan informasi pribadi</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <span>⚠️</span> Peringatan
            </h3>
            <p className="text-sm text-yellow-800">
              Setelah mengubah password, Anda akan diminta login ulang. Pastikan Anda mengingat password baru.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <span>✅</span> Keamanan Akun
            </h3>
            <p className="text-sm text-green-800">
              Ubah password secara berkala untuk menjaga keamanan akun Anda.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
