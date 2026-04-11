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
          <FiLock className="text-blue-600" /> Profil Akun
        </h2>
        <p className="text-gray-500 mt-1">
          Kelola keamanan akun Anda dan ubah password secara berkala
        </p>
      </div>

      <div className="max-w-4xl">
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
                    className={`w-full bg-white text-gray-900 placeholder:text-gray-400 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                    className={`w-full bg-white text-gray-900 placeholder:text-gray-400 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                    className={`w-full bg-white text-gray-900 placeholder:text-gray-400 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
    </section>
  );
}
