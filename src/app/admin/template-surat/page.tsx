"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";
import DynamicTemplateForm from "@/components/surat/DynamicTemplateForm";
import { createInitialFormValues } from "@/lib/template-surat/render-template";
import { DYNAMIC_SURAT_TEMPLATES } from "@/lib/template-surat/templates";
import type {
  DynamicSuratTemplate,
  TemplateField,
  TemplateFieldType,
  TemplateFormValues,
} from "@/lib/template-surat/types";

type TemplateItem = {
  id: number;
  nama: string;
  deskripsi: string | null;
  jenis_surat: string;
  file_name: string;
  file_path: string;
  status: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
};

type EditableTemplateField = {
  name: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
  placeholder: string;
  optionsText: string;
};

const EMPTY_FIELD: EditableTemplateField = {
  name: "",
  label: "",
  type: "text",
  required: true,
  placeholder: "",
  optionsText: "",
};

export default function TemplateSuratPage() {
  const initialTemplateId = DYNAMIC_SURAT_TEMPLATES[0]?.id ?? "";
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [customDynamicTemplates, setCustomDynamicTemplates] = useState<DynamicSuratTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingCustomDynamic, setSubmittingCustomDynamic] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dynamicMessage, setDynamicMessage] = useState("");
  const [dynamicError, setDynamicError] = useState("");
  const [selectedDynamicTemplateId, setSelectedDynamicTemplateId] = useState<string>(initialTemplateId);
  const [dynamicValues, setDynamicValues] = useState<TemplateFormValues>(() => {
    const initialTemplate = DYNAMIC_SURAT_TEMPLATES.find((item) => item.id === initialTemplateId);
    if (!initialTemplate) return {};
    return createInitialFormValues(initialTemplate.fields);
  });
  const [newDynamicTemplate, setNewDynamicTemplate] = useState({
    nama: "",
    jenisSurat: "",
    deskripsi: "",
    htmlTemplate: "",
  });
  const [newDynamicFields, setNewDynamicFields] = useState<EditableTemplateField[]>([EMPTY_FIELD]);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    jenisSurat: ALLOWED_SURAT_TYPES[0]?.title || "",
    file: null as File | null,
  });

  const dynamicTemplateOptions = useMemo(
    () => [...DYNAMIC_SURAT_TEMPLATES, ...customDynamicTemplates],
    [customDynamicTemplates]
  );

  const selectedDynamicTemplate = useMemo(() => {
    if (!selectedDynamicTemplateId) return undefined;
    return dynamicTemplateOptions.find((item) => item.id === selectedDynamicTemplateId);
  }, [dynamicTemplateOptions, selectedDynamicTemplateId]);

  const fetchDynamicTemplates = async () => {
    try {
      const response = await fetch("/api/admin/dynamic-templates", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal mengambil template dinamis kustom");
      }

      setCustomDynamicTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (err) {
      setDynamicError(
        err instanceof Error ? err.message : "Gagal mengambil template dinamis kustom"
      );
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/templates", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil daftar template");
      }

      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil daftar template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchDynamicTemplates();
  }, []);

  useEffect(() => {
    if (dynamicTemplateOptions.length === 0) {
      if (selectedDynamicTemplateId !== "") {
        setSelectedDynamicTemplateId("");
      }
      return;
    }

    const exists = dynamicTemplateOptions.some((item) => item.id === selectedDynamicTemplateId);
    if (!exists) {
      setSelectedDynamicTemplateId(dynamicTemplateOptions[0].id);
    }
  }, [dynamicTemplateOptions, selectedDynamicTemplateId]);

  useEffect(() => {
    if (!selectedDynamicTemplate) {
      setDynamicValues({});
      return;
    }

    setDynamicValues(createInitialFormValues(selectedDynamicTemplate.fields));
  }, [selectedDynamicTemplate]);

  const handleDynamicFieldChange = (fieldName: string, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const updateNewField = (index: number, updates: Partial<EditableTemplateField>) => {
    setNewDynamicFields((prev) =>
      prev.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...updates } : field))
    );
  };

  const addNewDynamicField = () => {
    setNewDynamicFields((prev) => [...prev, { ...EMPTY_FIELD }]);
  };

  const removeNewDynamicField = (index: number) => {
    setNewDynamicFields((prev) => {
      const nextFields = prev.filter((_, fieldIndex) => fieldIndex !== index);
      return nextFields.length > 0 ? nextFields : [{ ...EMPTY_FIELD }];
    });
  };

  const handleCreateCustomDynamicTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDynamicError("");
    setDynamicMessage("");

    const nama = newDynamicTemplate.nama.trim();
    const jenisSurat = newDynamicTemplate.jenisSurat.trim();
    const deskripsi = newDynamicTemplate.deskripsi.trim();
    const htmlTemplate = newDynamicTemplate.htmlTemplate.trim();

    if (!nama || !jenisSurat || !deskripsi || !htmlTemplate) {
      setDynamicError("Nama surat, jenis surat, deskripsi, dan isi template wajib diisi.");
      return;
    }

    const normalizedFields = newDynamicFields
      .map((field) => ({
        ...field,
        name: field.name.trim(),
        label: field.label.trim(),
        placeholder: field.placeholder.trim(),
        optionsText: field.optionsText.trim(),
      }))
      .filter((field) => field.name && field.label);

    if (normalizedFields.length === 0) {
      setDynamicError("Minimal satu field placeholder harus diisi.");
      return;
    }

    const payloadFields: TemplateField[] = normalizedFields.map((field) => {
      const options =
        field.type === "select"
          ? field.optionsText
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean)
              .map((option) => {
                const [label, value] = option.includes(":")
                  ? option.split(":", 2)
                  : [option, option];
                return {
                  label: label.trim(),
                  value: value.trim(),
                };
              })
          : undefined;

      return {
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || undefined,
        options: options && options.length > 0 ? options : undefined,
      };
    });

    const hasSelectWithoutOptions = payloadFields.some(
      (field) => field.type === "select" && (!field.options || field.options.length === 0)
    );

    if (hasSelectWithoutOptions) {
      setDynamicError("Field bertipe select wajib memiliki pilihan opsi.");
      return;
    }

    setSubmittingCustomDynamic(true);
    try {
      const response = await fetch("/api/admin/dynamic-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nama,
          jenisSurat,
          deskripsi,
          htmlTemplate,
          fields: payloadFields,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal menambah jenis surat dinamis");
      }

      const createdId = String(data?.template?.id || "");
      await fetchDynamicTemplates();
      if (createdId) {
        setSelectedDynamicTemplateId(createdId);
      }

      setDynamicMessage("Jenis surat dinamis berhasil ditambahkan.");
      setNewDynamicTemplate({ nama: "", jenisSurat: "", deskripsi: "", htmlTemplate: "" });
      setNewDynamicFields([{ ...EMPTY_FIELD }]);
    } catch (err) {
      setDynamicError(err instanceof Error ? err.message : "Gagal menambah jenis surat dinamis");
    } finally {
      setSubmittingCustomDynamic(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file: selected }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.nama || !formData.jenisSurat || !formData.file) {
      setError("Nama template, jenis surat, dan file wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("nama", formData.nama);
      payload.append("deskripsi", formData.deskripsi);
      payload.append("jenisSurat", formData.jenisSurat);
      payload.append("file", formData.file);

      const response = await fetch("/api/admin/templates", {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupload template");
      }

      setMessage(data.message || "Template berhasil diupload");
      setFormData({
        nama: "",
        deskripsi: "",
        jenisSurat: ALLOWED_SURAT_TYPES[0]?.title || "",
        file: null,
      });
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupload template");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    const shouldDelete = window.confirm("Hapus template ini?");
    if (!shouldDelete) return;

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus template");
      }

      setMessage(data.message || "Template berhasil dihapus");
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus template");
    }
  };

  const uploadedTemplateByJenis = useMemo(() => {
    const byJenis = new Map<string, TemplateItem>();

    templates.forEach((item) => {
      const key = String(item.jenis_surat || "").trim().toLowerCase();
      if (key && !byJenis.has(key)) {
        byJenis.set(key, item);
      }
    });

    return byJenis;
  }, [templates]);

  const placeholderTemplateCards = useMemo(() => {
    return dynamicTemplateOptions.map((template) => {
      const slugKey = String(template.id || "").trim().toLowerCase();
      const titleKey = String(template.jenisSurat || "").trim().toLowerCase();
      const uploaded = uploadedTemplateByJenis.get(slugKey) || uploadedTemplateByJenis.get(titleKey);

      return {
        template,
        uploaded,
      };
    });
  }, [dynamicTemplateOptions, uploadedTemplateByJenis]);

  return (
    <section>
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <h3 className="text-lg font-semibold text-blue-900">Template Surat Dinamis (Placeholder)</h3>
          <p className="mt-1 text-sm text-blue-800">
            Template disimpan sebagai HTML string dengan placeholder seperti {"{{nama}}"}, {"{{nik}}"}, {"{{alamat}}"}, dan dirender otomatis dari field schema.
          </p>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Pilih Template Dinamis</label>
            <select
              value={selectedDynamicTemplateId}
              onChange={(event) => setSelectedDynamicTemplateId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dynamicTemplateOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.nama}
                  {template.id.startsWith("custom-") ? " (Custom)" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedDynamicTemplate && (
            <>
              <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                <h4 className="font-semibold text-gray-800">Metadata Template</h4>
                <p className="mt-1 text-sm text-gray-600">{selectedDynamicTemplate.deskripsi}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Jenis Surat: <span className="font-medium text-gray-800">{selectedDynamicTemplate.jenisSurat}</span>
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-gray-800">Form Dinamis Berdasarkan Field</h4>
                <DynamicTemplateForm
                  fields={selectedDynamicTemplate.fields}
                  values={dynamicValues}
                  onFieldChange={handleDynamicFieldChange}
                />
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleCreateCustomDynamicTemplate} className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
          <h3 className="text-lg font-semibold text-emerald-900">Tambah Jenis Surat Dinamis Baru</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Admin bisa menentukan jenis surat baru, isi kalimat template, dan field placeholder yang wajib/opsional.
          </p>

          {dynamicMessage && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {dynamicMessage}
            </div>
          )}
          {dynamicError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {dynamicError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama Template Surat</label>
              <input
                type="text"
                value={newDynamicTemplate.nama}
                onChange={(event) =>
                  setNewDynamicTemplate((prev) => ({ ...prev, nama: event.target.value }))
                }
                placeholder="Contoh: Template Surat Keterangan Domisili Pendatang"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Surat</label>
              <input
                type="text"
                value={newDynamicTemplate.jenisSurat}
                onChange={(event) =>
                  setNewDynamicTemplate((prev) => ({ ...prev, jenisSurat: event.target.value }))
                }
                placeholder="Contoh: Surat Keterangan Domisili Pendatang"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea
                value={newDynamicTemplate.deskripsi}
                onChange={(event) =>
                  setNewDynamicTemplate((prev) => ({ ...prev, deskripsi: event.target.value }))
                }
                rows={2}
                placeholder="Contoh: Template untuk surat domisili pendatang sementara."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Isi Template (HTML + Placeholder)</label>
              <textarea
                value={newDynamicTemplate.htmlTemplate}
                onChange={(event) =>
                  setNewDynamicTemplate((prev) => ({ ...prev, htmlTemplate: event.target.value }))
                }
                rows={7}
                placeholder="Contoh: &lt;p&gt;Yang bertanda tangan ... {{nama}} ... {{alamat}} ...&lt;/p&gt;"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Gunakan placeholder format <span className="font-medium">{"{{nama_field}}"}</span> sesuai nama field di bawah.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Daftar Field Placeholder</h4>
              <button
                type="button"
                onClick={addNewDynamicField}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                + Tambah Field
              </button>
            </div>

            <p className="mb-3 text-xs text-gray-500">
              Kamu bisa tambah field apa saja sesuai kebutuhan surat (misalnya: rt, rw, nama_ayah, nomor_kk, dll).
              Nama field gunakan huruf/angka/underscore, contoh: <span className="font-medium">nama_ayah</span>.
            </p>

            <div className="space-y-3">
              {newDynamicFields.map((field, index) => (
                <div key={`${index}-${field.name}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Nama Field</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(event) => updateNewField(index, { name: event.target.value })}
                        placeholder="contoh: nama_ayah"
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(event) => updateNewField(index, { label: event.target.value })}
                        placeholder="Nama Lengkap"
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Tipe</label>
                      <select
                        value={field.type}
                        onChange={(event) => updateNewField(index, { type: event.target.value as TemplateFieldType })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="date">date</option>
                        <option value="textarea">textarea</option>
                        <option value="select">select</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder}
                        onChange={(event) => updateNewField(index, { placeholder: event.target.value })}
                        placeholder="Opsional"
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) => updateNewField(index, { required: event.target.checked })}
                        />
                        Wajib
                      </label>
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeNewDynamicField(index)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {field.type === "select" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Opsi Select</label>
                      <input
                        type="text"
                        value={field.optionsText}
                        onChange={(event) => updateNewField(index, { optionsText: event.target.value })}
                        placeholder="Contoh: Laki-laki, Perempuan atau Laki-laki:L, Perempuan:P"
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={submittingCustomDynamic}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submittingCustomDynamic ? "Menyimpan..." : "Simpan Jenis Surat Dinamis"}
            </button>
          </div>
        </form>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Upload Template Surat</h3>

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Template Surat Domisili"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat</label>
              <select
                value={formData.jenisSurat}
                onChange={(e) => setFormData((prev) => ({ ...prev, jenisSurat: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {ALLOWED_SURAT_TYPES.map((item) => (
                  <option key={item.slug} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">File Template (.docx/.pdf)</label>
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? "Mengupload..." : "Upload Template"}
          </button>
        </form>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Kategori Resmi</option>
              <option>Keterangan</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Semua Status</option>
              <option>Aktif</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Unduh Semua Template
            </button>
          </div>
        </div>

        {/* Grid Template Cards */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Memuat template...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderTemplateCards.map(({ template, uploaded }) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg w-12 h-12 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700">TMPL</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    uploaded?.status === 'aktif' || !uploaded
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {uploaded ? (uploaded.status === 'aktif' ? 'Aktif' : 'Nonaktif') : 'Placeholder'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {template.nama}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {template.deskripsi || '-'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jenis Surat:</span>
                    <span className="font-medium">{template.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">File:</span>
                    {uploaded ? (
                      <a href={uploaded.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{uploaded.file_name}</a>
                    ) : (
                      <span className="font-medium text-gray-500">Belum upload file</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Terakhir diubah:</span>
                    <span className="font-medium">
                      {uploaded
                        ? new Date(uploaded.updated_at).toLocaleDateString('id-ID')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Field:</span>
                    <span className="font-medium">{template.fields.length}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <a
                    href={uploaded ? `/api/admin/templates/${uploaded.id}/preview` : `/api/admin/dynamic-templates/preview/${encodeURIComponent(template.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 text-center"
                  >
                    Preview
                  </a>
                  {uploaded && (
                    <button
                      onClick={() => handleDelete(uploaded.id)}
                      className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
  );
}
