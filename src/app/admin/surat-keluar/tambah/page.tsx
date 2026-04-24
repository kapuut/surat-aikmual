"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSave, FiUpload } from "react-icons/fi";

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

interface SuratKeluarForm {
  nomor_surat: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  status: "Draft" | "Menunggu" | "Terkirim";
}

function isAllowedUploadedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_MIME_TYPES.includes(file.type as (typeof ALLOWED_FILE_MIME_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

export default function TambahSuratKeluarPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [formData, setFormData] = useState<SuratKeluarForm>({
    nomor_surat: "",
    tanggal_surat: new Date().toISOString().split("T")[0],
    tujuan: "",
    perihal: "",
    status: "Terkirim",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }

    if (!isAllowedUploadedFile(file)) {
      setAlert({
        type: "error",
        message: "Format file tidak valid. Gunakan foto/gambar, PDF, DOC, atau DOCX.",
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

    // Trigger native browser tooltip for required fields, including file upload.
    if (!formElement.reportValidity()) {
      return;
    }

    const payload = new FormData(formElement);
    const selectedFile = payload.get("file_surat");

    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      return;
    }

    if (!isAllowedUploadedFile(selectedFile)) {
      setAlert({
        type: "error",
        message: "Format file tidak valid. Gunakan foto/gambar, PDF, DOC, atau DOCX.",
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

    try {
      setSaving(true);
      setAlert(null);

      const response = await fetch("/api/surat-keluar", {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan data surat keluar");
      }

      setAlert({
        type: "success",
        message: "Data surat keluar fisik berhasil disimpan. Mengalihkan ke daftar...",
      });

      setTimeout(() => {
        router.push("/admin/surat-keluar");
      }, 1200);
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <Link
          href="/admin/surat-keluar"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali ke Data Surat Keluar
        </Link>
      </div>

      {alert && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            alert.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Input Arsip Surat Keluar Fisik</h2>
          <p className="mb-6 text-sm text-gray-600">
            Isi data surat keluar yang sudah dibuat secara fisik oleh kantor desa. Web ini hanya untuk pendataan arsip.
          </p>

          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="mb-2 font-medium">Data wajib diisi:</p>
            <ul className="list-disc pl-5">
              <li>Nomor Surat</li>
              <li>Tanggal Kirim</li>
              <li>Tujuan</li>
              <li>Perihal</li>
              <li>Dokumen Surat (foto/gambar atau Word)</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nomor Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nomor_surat"
                value={formData.nomor_surat}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tujuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tujuan"
                value={formData.tujuan}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Kirim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_surat"
                value={formData.tanggal_surat}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Terkirim">Terkirim</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Perihal <span className="text-red-500">*</span>
              </label>
              <textarea
                name="perihal"
                value={formData.perihal}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Dokumen Surat (Foto/Gambar/Word) <span className="text-red-500">*</span>
              </label>
              <label className="relative block cursor-pointer">
                <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 transition-colors hover:border-blue-400">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <FiUpload className="h-5 w-5" />
                    <span className="text-sm">{fileName || "Pilih file .jpg/.jpeg/.png/.webp/.gif/.doc/.docx/.pdf"}</span>
                  </div>
                </div>
                <input
                  type="file"
                  name="file_surat"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.pdf,image/*"
                  onChange={handleFileChange}
                  required
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/surat-keluar"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiSave className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Data Arsip"}
          </button>
        </div>
      </form>
    </section>
  );
}
