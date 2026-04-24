"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiSave, FiUpload } from "react-icons/fi";

type AlertType = "success" | "error";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
const ALLOWED_FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "gif"] as const;

function isAllowedUploadedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_MIME_TYPES.includes(file.type as (typeof ALLOWED_FILE_MIME_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

export default function TambahSuratMasukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }

    if (!isAllowedUploadedFile(file)) {
      setAlert({
        type: "error",
        message: "Format file tidak valid. Gunakan file gambar, PDF, DOC, atau DOCX.",
      });
      setFileName("");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAlert({
        type: "error",
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
      });
      setFileName("");
      e.target.value = "";
      return;
    }

    setAlert(null);
    setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;

    // Trigger native browser validation tooltip for any required field including file input.
    if (!formElement.reportValidity()) {
      return;
    }

    const formData = new FormData(formElement);
    const selectedFile = formData.get("file_surat");

    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      return;
    }

    if (!isAllowedUploadedFile(selectedFile)) {
      setAlert({
        type: "error",
        message: "Format file tidak valid. Gunakan file gambar, PDF, DOC, atau DOCX.",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setAlert({
        type: "error",
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch("/api/admin/surat-masuk", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan surat masuk");
      }

      setAlert({
        type: "success",
        message: "Surat masuk berhasil ditambahkan! Mengalihkan ke daftar surat masuk...",
      });

      setTimeout(() => {
        router.push("/admin/surat-masuk");
      }, 1200);
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/surat-masuk"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <FiArrowLeft /> Kembali ke Daftar Surat Masuk
        </Link>
      </div>

      {alert && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 ${
            alert.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? <FiCheckCircle className="h-4 w-4" /> : <FiAlertCircle className="h-4 w-4" />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b pb-3">
            Informasi Surat Masuk
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nomor Surat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomor_surat"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: 001/DISDIK/2025"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nomor surat sesuai yang tertera di dokumen
              </p>
            </div>

            {/* Asal Surat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asal Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="asal_surat"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Dinas Pendidikan NTB"
              />
              <p className="text-xs text-gray-500 mt-1">
                Instansi/lembaga pengirim surat
              </p>
            </div>

            {/* Tanggal Surat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_surat"
                required
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tanggal pembuatan surat (sesuai dokumen)
              </p>
            </div>

            {/* Tanggal Terima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Diterima <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_terima"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tanggal surat diterima di kantor desa
              </p>
            </div>

            {/* Urgensi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat Urgensi <span className="text-red-500">*</span>
              </label>
              <select
                name="urgensi"
                required
                defaultValue="sedang"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tinggi">Tinggi</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Digunakan untuk menandai prioritas penanganan surat
              </p>
            </div>

            {/* Perihal */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perihal/Isi Singkat <span className="text-red-500">*</span>
              </label>
              <textarea
                name="perihal"
                required
                rows={4}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jelaskan perihal atau isi singkat dari surat..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Ringkasan isi surat untuk memudahkan pencarian
              </p>
            </div>

            {/* Upload File */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File Surat <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="relative flex-1 cursor-pointer">
                  <div className="w-full px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <FiUpload className="w-5 h-5" />
                      <span className="text-sm">
                        {fileName || "Pilih file atau drag & drop di sini"}
                      </span>
                    </div>
                    {fileName && (
                      <p className="text-xs text-center text-green-600 mt-2">
                        ✓ File terpilih: {fileName}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    name="file_surat"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Format: gambar, PDF, DOC, DOCX. Maksimal 5MB. File wajib diupload dan akan disimpan di arsip digital.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/admin/surat-masuk"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <FiSave />
                Simpan Surat Masuk
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
