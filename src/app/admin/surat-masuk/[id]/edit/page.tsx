"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

interface SuratMasukForm {
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  urgensi: "rendah" | "sedang" | "tinggi";
  perihal: string;
}

interface SuratMasukDetail extends SuratMasukForm {
  id: number;
  file_path?: string | null;
}

function normalizeUrgensi(rawValue: unknown): "rendah" | "sedang" | "tinggi" {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "tinggi") return "tinggi";
  if (value === "rendah") return "rendah";
  return "sedang";
}

function isAllowedUploadedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_FILE_MIME_TYPES.includes(file.type as (typeof ALLOWED_FILE_MIME_TYPES)[number])
    || ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

function toDateInput(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

export default function EditSuratMasukPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const suratId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : (rawId || "");
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
  const [formData, setFormData] = useState<SuratMasukForm>({
    nomor_surat: "",
    tanggal_surat: "",
    tanggal_terima: "",
    asal_surat: "",
    urgensi: "sedang",
    perihal: "",
  });

  useEffect(() => {
    const fetchDetail = async () => {
      if (!suratId) {
        setAlert({ type: "error", message: "ID surat masuk tidak valid" });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAlert(null);

        const response = await fetch(`/api/admin/surat-masuk/${encodeURIComponent(suratId)}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal memuat data surat masuk");
        }

        const data = result.data as SuratMasukDetail;
        setFormData({
          nomor_surat: data.nomor_surat || "",
          tanggal_surat: toDateInput(data.tanggal_surat),
          tanggal_terima: toDateInput(data.tanggal_terima),
          asal_surat: data.asal_surat || "",
          urgensi: normalizeUrgensi(data.urgensi),
          perihal: data.perihal || "",
        });
        setSelectedFile(null);
        setFileName("");
        setExistingFilePath(data.file_path || null);
      } catch (err) {
        setAlert({
          type: "error",
          message: err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data surat masuk",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [suratId]);

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
      setSelectedFile(null);
      setFileName("");
      return;
    }

    if (!isAllowedUploadedFile(file)) {
      setAlert({
        type: "error",
        message: "Format file tidak valid. Gunakan file gambar, PDF, DOC, atau DOCX.",
      });
      setSelectedFile(null);
      setFileName("");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAlert({
        type: "error",
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
      });
      setSelectedFile(null);
      setFileName("");
      e.target.value = "";
      return;
    }

    setAlert(null);
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSaving(true);
      setAlert(null);

      const payload = new FormData();
      payload.set("nomor_surat", formData.nomor_surat);
      payload.set("tanggal_surat", formData.tanggal_surat);
      payload.set("tanggal_terima", formData.tanggal_terima);
      payload.set("asal_surat", formData.asal_surat);
      payload.set("urgensi", formData.urgensi);
      payload.set("perihal", formData.perihal);

      if (selectedFile) {
        payload.set("file_surat", selectedFile);
      }

      const response = await fetch(`/api/admin/surat-masuk/${encodeURIComponent(suratId)}`, {
        method: "PUT",
        credentials: "include",
        body: payload,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memperbarui surat masuk");
      }

      setAlert({
        type: "success",
        message: "Surat masuk berhasil diperbarui. Mengalihkan ke daftar surat masuk...",
      });
      setSelectedFile(null);
      setFileName("");

      setTimeout(() => {
        router.push("/admin/surat-masuk");
      }, 1200);
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui surat masuk",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <Link
          href={suratId ? `/admin/surat-masuk/${suratId}` : "/admin/surat-masuk"}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft className="h-4 w-4" /> Kembali
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

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Memuat data surat masuk...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Edit Surat Masuk</h2>

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
                  Asal Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="asal_surat"
                  value={formData.asal_surat}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tanggal Surat <span className="text-red-500">*</span>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tanggal Diterima <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_terima"
                  value={formData.tanggal_terima}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tingkat Urgensi <span className="text-red-500">*</span>
                </label>
                <select
                  name="urgensi"
                  value={formData.urgensi}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tinggi">Tinggi</option>
                  <option value="sedang">Sedang</option>
                  <option value="rendah">Rendah</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Perihal/Isi Singkat <span className="text-red-500">*</span>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Dokumen Surat (Gambar/PDF/Word)</label>
                <label className="block cursor-pointer">
                  <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 transition-colors hover:border-blue-400">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <FiUpload className="h-5 w-5" />
                      <span className="text-sm">{fileName || "Pilih file gambar/PDF/Word untuk mengganti dokumen (opsional)"}</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    name="file_surat"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {existingFilePath ? (
                  <p className="mt-2 text-xs text-gray-500">
                    File saat ini: <a href={suratId ? `/admin/surat-masuk/${suratId}/preview` : existingFilePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat dokumen</a>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">Belum ada dokumen tersimpan. Anda bisa menambahkan file gambar, PDF, DOC, atau DOCX di sini.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={suratId ? `/admin/surat-masuk/${suratId}` : "/admin/surat-masuk"}
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
