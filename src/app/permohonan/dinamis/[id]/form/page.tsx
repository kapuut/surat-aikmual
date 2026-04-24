"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheckCircle, FiFileText, FiSend, FiUpload } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRequireAuth } from "@/lib/hooks";
import { checkBusinessHours } from "@/lib/utils";
import { createInitialFormValues } from "@/lib/template-surat/render-template";
import type { TemplateField, TemplateFormValues } from "@/lib/template-surat/types";

type DynamicTemplate = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
  fields: TemplateField[];
};

interface DynamicSuratFormPageProps {
  params: {
    id: string;
  };
}

const MANAGED_FIELD_KEYS = new Set([
  "nama",
  "namalengkap",
  "nik",
  "alamat",
  "notelp",
  "nowhatsapp",
  "whatsapp",
]);

const PERSONAL_FIELD_KEYS = new Set([
  "tempatlahir",
  "tanggallahir",
  "jeniskelamin",
  "jenikelamin",
  "agama",
  "pekerjaan",
  "statusperkawinan",
  "kewarganegaraan",
]);

function normalizeSpacing(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeFieldKey(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toTitleCase(value: string): string {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : ""))
    .join(" ");
}

function normalizeAreaValue(value: string, type: "dusun" | "desa" | "kecamatan" | "kabupaten" | "provinsi") {
  const cleaned = normalizeSpacing(value);
  if (!cleaned) return "";

  const patterns = {
    dusun: /^dusun\s+/i,
    desa: /^desa\s+/i,
    kecamatan: /^(kecamatan|kec\.?)+\s+/i,
    kabupaten: /^(kabupaten|kab\.?)+\s+/i,
    provinsi: /^(provinsi|prov\.?)+\s+/i,
  } as const;

  return toTitleCase(cleaned.replace(patterns[type], ""));
}

function composeAddress(dusun: string, desa: string, kecamatan: string, kabupaten: string, provinsi: string) {
  if (!dusun || !desa || !kecamatan || !kabupaten || !provinsi) return "";

  return `Dusun ${dusun}, Desa ${desa}\nKec. ${kecamatan}, Kab. ${kabupaten}\nProvinsi ${provinsi}`;
}

function isManagedField(field: TemplateField): boolean {
  return MANAGED_FIELD_KEYS.has(normalizeFieldKey(field.name));
}

function isPersonalField(field: TemplateField): boolean {
  return PERSONAL_FIELD_KEYS.has(normalizeFieldKey(field.name));
}

function renderField(
  field: TemplateField,
  values: TemplateFormValues,
  onFieldChange: (fieldName: string, value: string) => void
) {
  const key = normalizeFieldKey(field.name);
  const commonClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelClassName = "mb-1 block text-sm font-medium text-gray-700";
  const wrapperClassName =
    field.type === "textarea" || key === "keperluan" ? "md:col-span-2" : "";

  if (field.type === "textarea") {
    return (
      <div key={field.name} className={wrapperClassName}>
        <label className={labelClassName}>
          {field.label} {field.required ? <span className="text-red-500">*</span> : null}
        </label>
        <textarea
          value={values[field.name] ?? ""}
          onChange={(event) => onFieldChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={commonClassName}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div key={field.name} className={wrapperClassName}>
        <label className={labelClassName}>
          {field.label} {field.required ? <span className="text-red-500">*</span> : null}
        </label>
        <select
          value={values[field.name] ?? ""}
          onChange={(event) => onFieldChange(field.name, event.target.value)}
          required={field.required}
          className={commonClassName}
        >
          <option value="">Pilih {field.label}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div key={field.name} className={wrapperClassName}>
      <label className={labelClassName}>
        {field.label} {field.required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={field.type}
        value={values[field.name] ?? ""}
        onChange={(event) => onFieldChange(field.name, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className={commonClassName}
      />
    </div>
  );
}

export default function DynamicSuratFormPage({ params }: DynamicSuratFormPageProps) {
  const router = useRouter();
  const { user, loading: loadingAuth } = useRequireAuth();
  const [template, setTemplate] = useState<DynamicTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [baseData, setBaseData] = useState({
    nama: "",
    noTelp: "",
  });
  const [addressData, setAddressData] = useState({
    dusun: "",
    desa: "Aikmual",
    kecamatan: "Praya",
    kabupaten: "Lombok Tengah",
    provinsi: "Nusa Tenggara Barat",
  });
  const [dynamicValues, setDynamicValues] = useState<TemplateFormValues>({});
  const akunNik = String(user?.nik || "").split("_")[0].trim();

  useEffect(() => {
    const hoursCheck = checkBusinessHours();
    if (!hoursCheck.isAllowed) {
      setError(hoursCheck.message || "Diluar jam kerja");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTemplate = async () => {
      try {
        setLoadingTemplate(true);
        setError(null);
        const response = await fetch("/api/dynamic-templates", { credentials: "include" });
        const data = await response.json();

        if (!response.ok || !data?.success || !Array.isArray(data?.templates)) {
          throw new Error(data?.error || "Gagal mengambil template dinamis");
        }

        const templateId = decodeURIComponent(params.id || "").trim();
        const found = data.templates.find((item: DynamicTemplate) => item.id === templateId) || null;

        if (!cancelled) {
          setTemplate(found);
          setDynamicValues(found ? createInitialFormValues(found.fields) : {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal mengambil template dinamis");
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplate(false);
        }
      }
    };

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const backHref = useMemo(() => {
    const safeId = encodeURIComponent(decodeURIComponent(params.id || "").trim());
    return `/permohonan/dinamis/${safeId}`;
  }, [params.id]);

  const personalFields = useMemo(
    () => (template?.fields ?? []).filter((field) => !isManagedField(field) && isPersonalField(field)),
    [template]
  );

  const additionalFields = useMemo(
    () => (template?.fields ?? []).filter((field) => !isManagedField(field) && !isPersonalField(field)),
    [template]
  );

  const requiredAdminFields = useMemo(
    () => (template?.fields ?? []).filter((field) => field.required && !isManagedField(field)),
    [template]
  );

  const composedAddress = useMemo(
    () =>
      composeAddress(
        normalizeAreaValue(addressData.dusun, "dusun"),
        normalizeAreaValue(addressData.desa, "desa"),
        normalizeAreaValue(addressData.kecamatan, "kecamatan"),
        normalizeAreaValue(addressData.kabupaten, "kabupaten"),
        normalizeAreaValue(addressData.provinsi, "provinsi")
      ),
    [addressData]
  );

  const showFeedback = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleInvalid = () => {
    setSuccessMessage(null);
    setError("Form belum lengkap atau ada data yang belum valid. Cek kembali semua field bertanda *.");
    showFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!akunNik) {
        throw new Error("NIK akun tidak ditemukan. Silakan login ulang lalu coba kembali.");
      }

      const payload = new FormData();
      payload.set("jenisSurat", template.jenisSurat);
      payload.set("dynamicTemplateId", template.id);
      payload.set("nama", toTitleCase(baseData.nama));
      payload.set("nik", akunNik);
      payload.set("dusun", normalizeAreaValue(addressData.dusun, "dusun"));
      payload.set("desa", normalizeAreaValue(addressData.desa, "desa"));
      payload.set("kecamatan", normalizeAreaValue(addressData.kecamatan, "kecamatan"));
      payload.set("kabupaten", normalizeAreaValue(addressData.kabupaten, "kabupaten"));
      payload.set("provinsi", normalizeAreaValue(addressData.provinsi, "provinsi"));
      payload.set("alamat", composedAddress);
      payload.set("noTelp", normalizeSpacing(baseData.noTelp));
      payload.set("keperluan", "-");

      Object.entries(dynamicValues).forEach(([key, value]) => {
        const normalizedKey = normalizeFieldKey(key);
        if (MANAGED_FIELD_KEYS.has(normalizedKey)) {
          return;
        }

        payload.set(key, value);
      });

      const fileInput = event.currentTarget.elements.namedItem("dokumenTambahan") as HTMLInputElement | null;
      if (fileInput?.files) {
        Array.from(fileInput.files).forEach((file) => {
          payload.append("dokumenTambahan", file);
        });
      }

      const response = await fetch("/api/permohonan", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengajukan permohonan surat dinamis");
      }

      setSuccessMessage("Permohonan berhasil diajukan. Anda akan diarahkan ke halaman tracking.");
      showFeedback();
      window.setTimeout(() => {
        router.push("/tracking");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim permohonan");
      showFeedback();
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTemplate) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8 pt-20">
          <div className="mx-auto max-w-4xl px-4 text-center text-gray-600">Memuat formulir surat dinamis...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!template) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8 pt-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Template surat dinamis tidak ditemukan</h1>
            <p className="mt-2 text-gray-600">Template mungkin sudah dinonaktifkan oleh admin.</p>
            <Link href="/permohonan" className="mt-5 inline-block rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
              Kembali ke daftar permohonan
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 pt-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6">
            <Link href={backHref} className="mb-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700">
              <FiArrowLeft /> Kembali
            </Link>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 text-white">
                  <FiFileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Formulir {template.jenisSurat}</h1>
                  <p className="text-gray-600">
                    {template.deskripsi || "Silakan lengkapi formulir di bawah ini dengan data yang benar."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              <FiCheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold">Permohonan Berhasil</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} onInvalidCapture={handleInvalid} className="space-y-6">
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">Data Pribadi</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={baseData.nama}
                    onChange={(event) => setBaseData((prev) => ({ ...prev, nama: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    NIK <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{16}"
                    maxLength={16}
                    value={akunNik}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={loadingAuth ? "Memuat NIK akun..." : "16 digit NIK"}
                  />
                  <p className="mt-1 text-xs text-gray-500">NIK mengikuti akun yang sedang login.</p>
                </div>
                {personalFields.map((field) => renderField(field, dynamicValues, handleFieldChange))}
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-2 border-b pb-2 text-lg font-semibold text-gray-900">Alamat Pemohon (Isi Per Kolom) <span className="text-red-500">*</span></h2>
              <p className="mb-4 text-sm text-gray-500">Alamat lengkap akan digabung otomatis ke format surat saat permohonan dikirim.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Dusun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.dusun}
                    onChange={(event) => setAddressData((prev) => ({ ...prev, dusun: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Darwis"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Desa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.desa}
                    onChange={(event) => setAddressData((prev) => ({ ...prev, desa: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kecamatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.kecamatan}
                    onChange={(event) => setAddressData((prev) => ({ ...prev, kecamatan: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.kabupaten}
                    onChange={(event) => setAddressData((prev) => ({ ...prev, kabupaten: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Provinsi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressData.provinsi}
                    onChange={(event) => setAddressData((prev) => ({ ...prev, provinsi: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </section>

            {additionalFields.length > 0 && (
              <section className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-2 border-b pb-2 text-lg font-semibold text-gray-900">Data Tambahan dari Admin</h2>
                <p className="mb-4 text-sm text-gray-500">
                  Lengkapi field tambahan berikut sesuai kebutuhan surat yang dibuat admin.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {additionalFields.map((field) => renderField(field, dynamicValues, handleFieldChange))}
                </div>
              </section>
            )}

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">Kontak Pemohon</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    No. Telepon / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={baseData.noTelp}
                    onChange={(event) => setBaseData((prev) => ({ ...prev, noTelp: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: 081234567890"
                  />
                  <p className="mt-1 text-xs text-gray-500">Nomor ini digunakan untuk notifikasi proses surat.</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 border-b pb-2 text-lg font-semibold text-gray-900">
                <FiUpload className="text-green-600" />
                Upload Dokumen Pendukung
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Dokumen Pendukung Tambahan (opsional)
                  </label>
                  <input
                    type="file"
                    name="dokumenTambahan"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2"
                  />
                </div>
                <p className="text-xs text-gray-500">Format yang didukung: JPG, PNG, PDF. Upload hanya jika diperlukan.</p>
                {requiredAdminFields.length > 0 && (
                  <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                    <p className="font-semibold">Field wajib dari admin:</p>
                    <p className="mt-1">{requiredAdminFields.map((field) => field.label).join(", ")}</p>
                  </div>
                )}
              </div>
            </section>

            <div className="flex gap-4">
              <Link
                href={backHref}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 transition duration-200 hover:bg-gray-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting || loadingAuth || !akunNik}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-bold text-white transition duration-200 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting || loadingAuth ? (
                  "Mengirim..."
                ) : (
                  <>
                    <FiSend className="h-5 w-5" />
                    Submit Permohonan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
