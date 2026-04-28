"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";
import DynamicTemplateForm from "@/components/surat/DynamicTemplateForm";
import { createInitialFormValues } from "@/lib/template-surat/render-template";
import { DYNAMIC_SURAT_TEMPLATES } from "@/lib/template-surat/templates";
import {
  OFFICIAL_DYNAMIC_CLOSING_PARAGRAPH,
  OFFICIAL_DYNAMIC_OPENING_PARAGRAPH,
} from "@/lib/template-surat/official-defaults";
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

const HIDDEN_SURAT_SLUGS = new Set(["surat-kepemilikan"]);
const AVAILABLE_SURAT_TYPES = ALLOWED_SURAT_TYPES.filter(
  (item) => !HIDDEN_SURAT_SLUGS.has(item.slug)
);

type EditableTemplateField = {
  name: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
  placeholder: string;
  optionsText: string;
  includeInIdentity: boolean;
};

type TemplateFormatMode = "dengan_tabel";
type ParagraphTarget = "opening" | "body" | "closing";

type FieldPreset = {
  name: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  optionsText?: string;
};

const EMPTY_FIELD: EditableTemplateField = {
  name: "",
  label: "",
  type: "text",
  required: true,
  placeholder: "",
  optionsText: "",
  includeInIdentity: true,
};

const FIELD_PRESETS: FieldPreset[] = [
  { name: "nama", label: "Nama Lengkap", type: "text", required: true },
  { name: "nik", label: "NIK", type: "text", required: true },
  { name: "alamat", label: "Alamat", type: "textarea", required: true },
  { name: "tujuan", label: "Tujuan", type: "text", required: false },
  { name: "tempat_tanggal_lahir", label: "Tempat / Tanggal Lahir", type: "text", required: false },
  { name: "agama", label: "Agama", type: "text", required: false },
  { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: false, optionsText: "Laki-laki, Perempuan" },
  { name: "status_perkawinan", label: "Status", type: "select", required: false, optionsText: "Belum Kawin, Kawin, Cerai Hidup, Cerai Mati" },
  { name: "kewarganegaraan", label: "Kewarganegaraan", type: "text", required: false, placeholder: "Indonesia" },
  { name: "pekerjaan", label: "Pekerjaan", type: "text", required: false },
  { name: "masa_berlaku", label: "Masa Berlaku", type: "text", required: false, placeholder: "Contoh: 27 Februari 2023 sampai 31 Juli 2023" },
  { name: "keperluan", label: "Keperluan", type: "textarea", required: false },
];

const SECOND_PARTY_FIELD_PRESETS: FieldPreset[] = [
  { name: "nama_pihak_2", label: "Nama Pihak 2", type: "text", required: false },
  { name: "nik_pihak_2", label: "NIK Pihak 2", type: "text", required: false },
  { name: "tempat_tanggal_lahir_pihak_2", label: "Tempat / Tanggal Lahir Pihak 2", type: "text", required: false },
  { name: "agama_pihak_2", label: "Agama Pihak 2", type: "text", required: false },
  { name: "status_pihak_2", label: "Status Pihak 2", type: "text", required: false },
  { name: "pekerjaan_pihak_2", label: "Pekerjaan Pihak 2", type: "text", required: false },
  { name: "alamat_pihak_2", label: "Alamat Pihak 2", type: "textarea", required: false },
];

const QUICK_PARAGRAPH_FIELD_NAMES = ["nama", "nik", "alamat", "tujuan", "keperluan"] as const;

const DEFAULT_OPENING_PARAGRAPH = OFFICIAL_DYNAMIC_OPENING_PARAGRAPH;

const DEFAULT_CLOSING_PARAGRAPH = OFFICIAL_DYNAMIC_CLOSING_PARAGRAPH;

function toEditableFieldFromPreset(preset: FieldPreset): EditableTemplateField {
  return {
    name: preset.name,
    label: preset.label,
    type: preset.type,
    required: preset.required ?? true,
    placeholder: preset.placeholder ?? "",
    optionsText: preset.optionsText ?? "",
    includeInIdentity: true,
  };
}

function toTemplateFieldFromEditable(field: EditableTemplateField): TemplateField {
  const options =
    field.type === "select"
      ? field.optionsText
          .split(",")
          .map((opt) => {
            const [label, value] = opt.includes(":") ? opt.split(":", 2) : [opt.trim(), opt.trim()];
            return { label: label.trim(), value: value.trim() };
          })
          .filter((opt) => opt.label && opt.value)
      : undefined;
  return {
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder || undefined,
    options: options && options.length > 0 ? options : undefined,
  };
}

type EditBlueprint = {
  opening: string;
  body: string;
  closing: string;
  fields: FieldPreset[];
};

const BLUEPRINT_FIELDS = {
  nama: { name: "nama", label: "Nama Lengkap", type: "text", required: true } as FieldPreset,
  nik: { name: "nik", label: "NIK", type: "text", required: true } as FieldPreset,
  ttl: { name: "tempat_tanggal_lahir", label: "Tempat / Tanggal Lahir", type: "text", required: false } as FieldPreset,
  jenisKelamin: {
    name: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    required: false,
    optionsText: "Laki-laki, Perempuan",
  } as FieldPreset,
  agama: { name: "agama", label: "Agama", type: "text", required: false } as FieldPreset,
  status: {
    name: "status_perkawinan",
    label: "Status",
    type: "select",
    required: false,
    optionsText: "Belum Kawin, Kawin, Cerai Hidup, Cerai Mati",
  } as FieldPreset,
  kewarganegaraan: { name: "kewarganegaraan", label: "Kewarganegaraan", type: "text", required: false } as FieldPreset,
  pekerjaan: { name: "pekerjaan", label: "Pekerjaan", type: "text", required: false } as FieldPreset,
  alamat: { name: "alamat", label: "Alamat", type: "textarea", required: true } as FieldPreset,
  pendidikan: { name: "pendidikan", label: "Pendidikan", type: "text", required: false } as FieldPreset,
  sumberPenghasilan: { name: "sumber_penghasilan", label: "Sumber Penghasilan", type: "text", required: false } as FieldPreset,
  penghasilanPerBulan: { name: "penghasilan_per_bulan", label: "Penghasilan Per Bulan", type: "text", required: false } as FieldPreset,
  dasarKeterangan: { name: "dasar_keterangan", label: "Dasar Keterangan", type: "text", required: false } as FieldPreset,
};

const DEFAULT_EDIT_BLUEPRINTS: Record<string, EditBlueprint> = {
  "surat-domisili": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Dengan ini menerangkan bahwa {{nama}} dengan NIK {{nik}} benar berdomisili di {{alamat}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [BLUEPRINT_FIELDS.nama, BLUEPRINT_FIELDS.nik, BLUEPRINT_FIELDS.alamat],
  },
  "surat-masih-hidup": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Dengan ini menerangkan bahwa nama tersebut di atas adalah benar penduduk Desa {{nama_desa}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.alamat,
    ],
  },
  "surat-kematian": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Bahwa yang namanya tersebut di atas menurut Kepala Dusun setempat memang benar telah meninggal dunia. Surat ini dibuat untuk dipergunakan sebagaimana mestinya.",
    closing: "Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.",
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.pekerjaan,
      { name: "alamat_terakhir", label: "Alamat Terakhir", type: "textarea", required: false },
      { name: "tanggal_meninggal", label: "Tanggal Meninggal", type: "date", required: false },
      { name: "tempat_meninggal", label: "Tempat Meninggal", type: "text", required: false },
      { name: "sebab_kematian", label: "Sebab Kematian", type: "textarea", required: false },
    ],
  },
  "surat-cerai": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Bahwa yang namanya tersebut di atas memang benar warga kami dan telah bercerai pada tanggal {{tanggal_cerai}} dengan pasangan sebagai berikut:\n\nNama: {{nama_pihak_2}}\nNIK: {{nik_pihak_2}}\nTempat / Tanggal Lahir: {{tempat_tanggal_lahir_pihak_2}}\nAgama: {{agama_pihak_2}}\nPekerjaan: {{pekerjaan_pihak_2}}\nAlamat: {{alamat_pihak_2}}",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.kewarganegaraan,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.alamat,
      { name: "tanggal_cerai", label: "Tanggal Cerai", type: "date", required: false },
      ...SECOND_PARTY_FIELD_PRESETS,
    ],
  },
  "surat-janda": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Bahwa yang namanya tersebut diatas yang bertempat tinggal di {{alamat}} memang benar berstatus {{status_perkawinan}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.kewarganegaraan,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.alamat,
      BLUEPRINT_FIELDS.status,
    ],
  },
  "surat-kehilangan": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Menerangkan bahwa orang tersebut adalah benar-benar warga Desa {{nama_desa}} dengan data seperti di atas, dan telah hilang/jatuh {{barang_hilang}} pada tanggal {{tanggal_kehilangan}} di {{lokasi_kehilangan}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.alamat,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.status,
      BLUEPRINT_FIELDS.kewarganegaraan,
      { name: "barang_hilang", label: "Barang Hilang", type: "text", required: false },
      { name: "lokasi_kehilangan", label: "Lokasi Kehilangan", type: "text", required: false },
      { name: "tanggal_kehilangan", label: "Tanggal Kehilangan", type: "date", required: false },
    ],
  },
  "surat-penghasilan": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Bahwa nama tersebut di atas adalah benar penduduk Desa {{nama_desa}}. Menurut keterangan {{dasar_keterangan}}, yang bersangkutan merupakan anak/tanggungan dari:\n\nNama Wali: {{nama_wali}}\nNIK Wali: {{nik_wali}}\nTempat / Tanggal Lahir Wali: {{tempat_tanggal_lahir_wali}}\nJenis Kelamin Wali: {{jenis_kelamin_wali}}\nAgama Wali: {{agama_wali}}\n\nWali/orang tua tersebut memiliki penghasilan rata-rata sebesar {{penghasilan_per_bulan}} per bulan yang bersumber dari {{sumber_penghasilan}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.status,
      BLUEPRINT_FIELDS.pendidikan,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.kewarganegaraan,
      BLUEPRINT_FIELDS.alamat,
      { name: "nama_wali", label: "Nama Wali", type: "text", required: false },
      { name: "nik_wali", label: "NIK Wali", type: "text", required: false },
      { name: "tempat_tanggal_lahir_wali", label: "Tempat / Tanggal Lahir Wali", type: "text", required: false },
      { name: "jenis_kelamin_wali", label: "Jenis Kelamin Wali", type: "select", required: false, optionsText: "Laki-laki, Perempuan" },
      { name: "agama_wali", label: "Agama Wali", type: "text", required: false },
      BLUEPRINT_FIELDS.sumberPenghasilan,
      BLUEPRINT_FIELDS.penghasilanPerBulan,
      BLUEPRINT_FIELDS.dasarKeterangan,
    ],
  },
  "surat-tidak-punya-rumah": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Orang tersebut adalah benar-benar warga Desa {{nama_desa}} dengan data seperti di atas, dan memang yang bersangkutan belum memiliki rumah.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.alamat,
      BLUEPRINT_FIELDS.agama,
      BLUEPRINT_FIELDS.status,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.kewarganegaraan,
      { name: "penyandang_cacat", label: "Penyandang Cacat", type: "text", required: false },
      { name: "masa_berlaku", label: "Masa Berlaku", type: "text", required: false },
    ],
  },
  "surat-usaha": {
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "Menerangkan bahwa orang tersebut adalah benar-benar warga Desa {{nama_desa}} dengan data seperti di atas, yang memiliki usaha {{jenis_usaha}}.",
    closing: DEFAULT_CLOSING_PARAGRAPH,
    fields: [
      BLUEPRINT_FIELDS.nama,
      BLUEPRINT_FIELDS.nik,
      BLUEPRINT_FIELDS.ttl,
      BLUEPRINT_FIELDS.jenisKelamin,
      BLUEPRINT_FIELDS.alamat,
      BLUEPRINT_FIELDS.pekerjaan,
      BLUEPRINT_FIELDS.status,
      BLUEPRINT_FIELDS.kewarganegaraan,
      { name: "penyandang_cacat", label: "Penyandang Cacat", type: "text", required: false },
      { name: "mulai_usaha", label: "Mulai Usaha", type: "text", required: false },
      { name: "jenis_usaha", label: "Jenis Usaha", type: "text", required: false },
      { name: "masa_berlaku", label: "Masa Berlaku", type: "text", required: false },
    ],
  },
};

function normalizeFieldName(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "field_baru";
}

function escapeSimpleHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlPreservingPlaceholders(value: string): string {
  const placeholders: string[] = [];
  const markerText = value.replace(/{{\s*[a-zA-Z0-9_]+\s*}}/g, (match) => {
    const marker = `__PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(match);
    return marker;
  });

  const escaped = escapeSimpleHtml(markerText);
  return escaped.replace(/__PLACEHOLDER_(\d+)__/g, (_, indexText: string) => {
    const index = Number(indexText);
    return placeholders[index] || "";
  });
}

function buildSimpleTemplateHtml({
  jenisSurat,
  formatMode,
  openingParagraph,
  bodyText,
  closingParagraph,
  identityFields,
}: {
  jenisSurat: string;
  formatMode: TemplateFormatMode;
  openingParagraph: string;
  bodyText: string;
  closingParagraph: string;
  identityFields: Array<Pick<EditableTemplateField, "name" | "label" | "includeInIdentity">>;
}): string {
  const normalizedParagraphs = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const withBreakLines = paragraph
        .split("\n")
        .map((line) => escapeHtmlPreservingPlaceholders(line))
        .join("<br />");
      return `<p style="margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;">${withBreakLines}</p>`;
    })
    .join("\n");

  const normalizedOpeningParagraph = openingParagraph.trim();
  const openingHtml = normalizedOpeningParagraph
    ? `<p style="margin: 0 0 12px; text-align: justify; text-indent: 1.1cm; line-height: 1.5;">${escapeHtmlPreservingPlaceholders(normalizedOpeningParagraph)}</p>`
    : "";

  const normalizedClosingParagraph = closingParagraph.trim();
  const closingHtml = normalizedClosingParagraph
    ? `<p style="margin: 20px 0 0; text-align: justify; text-indent: 1.1cm; line-height: 1.5;">${escapeHtmlPreservingPlaceholders(normalizedClosingParagraph)}</p>`
    : "";

  const identityRows = identityFields
    .filter((field) => field.name.trim() && field.label.trim() && field.includeInIdentity)
    .map((field) => {
      const safeLabel = escapeSimpleHtml(field.label.trim());
      const safeName = field.name.trim();
      return `<tr><td style="width: 3.8cm; white-space: nowrap; vertical-align: top;">${safeLabel}</td><td style="width: 0.35cm; text-align: center; vertical-align: top;">:</td><td style="vertical-align: top;">{{${safeName}}}</td></tr>`;
    })
    .join("\n");

  const identityTableHtml = identityRows
    ? `<table style="width: 100%; border-collapse: collapse; margin: 0.15cm 0 0.35cm 1.1cm; font-size: 12pt;">${identityRows}</table>`
    : "";

  const bodySectionHtml =
    formatMode === "dengan_tabel"
      ? `${openingHtml}${identityTableHtml}${normalizedParagraphs}`
      : `${openingHtml}${normalizedParagraphs}`;

  return `
    <div style="font-family: 'Bookman Old Style', 'Book Antiqua', serif; font-size: 12pt; line-height: 1.5; color: #000;">
      <div style="text-align: center; margin: 0.1cm 0 0.02cm 0; font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${escapeSimpleHtml(jenisSurat.toUpperCase())}</div>
      <div style="text-align: center; margin-bottom: 0.32cm; font-size: 12pt; line-height: 1.2;">Nomor : {{nomor_surat}}</div>

      ${bodySectionHtml}

      ${closingHtml}

      <div style="margin-top: 0.25cm; display: flex; justify-content: flex-end; font-size: 12pt; break-inside: avoid; page-break-inside: avoid;">
        <div style="width: 7.4cm; text-align: center; margin-right: 0.2cm;">
          <div>{{kota}}, {{tanggal_surat}}</div>
          <div style="text-transform: uppercase;">Kepala Desa {{nama_desa}}</div>
          <div style="height: 2.2cm;"></div>
          <div style="font-weight: bold; text-transform: uppercase; text-decoration: underline;">{{nama_kepala_desa}}</div>
        </div>
      </div>
    </div>
  `.trim();
}

function extractTemplatePlaceholders(text: string): string[] {
  const placeholders = String(text || "").match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
  return placeholders
    .map((token) => token.replace(/[{}\s]/g, ""))
    .filter(Boolean);
}

function htmlParagraphToText(paragraphHtml: string): string {
  return String(paragraphHtml || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractParagraphsFromTemplateHtml(htmlTemplate: string): {
  opening: string;
  body: string;
  closing: string;
} {
  const paragraphBlocks = String(htmlTemplate || "").match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];

  const paragraphs = paragraphBlocks
    .map((block) => htmlParagraphToText(block))
    .filter(Boolean)
    .filter((text) => {
      const normalized = text.toLowerCase();
      if (normalized.includes("{{kota}}") || normalized.includes("{{tanggal_surat}}")) return false;
      if (normalized.includes("{{nama_kepala_desa}}")) return false;
      if (normalized.startsWith("surat keterangan")) return false;
      if (normalized.startsWith("nomor")) return false;
      if (normalized.startsWith("kepala desa ")) return false;
      return true;
    });

  if (paragraphs.length === 0) {
    return {
      opening: DEFAULT_OPENING_PARAGRAPH,
      body: "",
      closing: DEFAULT_CLOSING_PARAGRAPH,
    };
  }

  if (paragraphs.length === 1) {
    return {
      opening: paragraphs[0],
      body: "",
      closing: DEFAULT_CLOSING_PARAGRAPH,
    };
  }

  const openingIndex = paragraphs.findIndex((paragraph) => {
    const normalized = paragraph.toLowerCase();
    return normalized.includes("yang bertanda tangan") || normalized.includes("menerangkan");
  });

  const closingIndex = paragraphs.findIndex((paragraph) => {
    const normalized = paragraph.toLowerCase();
    return normalized.includes("demikian surat") || normalized.includes("dipergunakan sebagaimana mestinya");
  });

  if (openingIndex >= 0 && closingIndex >= 0 && closingIndex > openingIndex) {
    return {
      opening: paragraphs[openingIndex],
      body: paragraphs.slice(openingIndex + 1, closingIndex).join("\n\n"),
      closing: paragraphs[closingIndex],
    };
  }

  return {
    opening: paragraphs[0] || DEFAULT_OPENING_PARAGRAPH,
    body: paragraphs.slice(1, -1).join("\n\n"),
    closing: paragraphs[paragraphs.length - 1] || DEFAULT_CLOSING_PARAGRAPH,
  };
}

const SYSTEM_PLACEHOLDERS = [
  "nomor_surat",
  "tanggal_surat",
  "kota",
  "nama_desa",
  "kecamatan",
  "kabupaten",
  "provinsi",
  "nama_kepala_desa",
];

const SYSTEM_TOKEN_LABELS: Record<string, string> = {
  nomor_surat: "Nomor Surat",
  tanggal_surat: "Tanggal Surat",
  kota: "Kota",
  nama_desa: "Nama Desa",
  kecamatan: "Kecamatan",
  kabupaten: "Kabupaten",
  provinsi: "Provinsi",
  nama_kepala_desa: "Nama Kepala Desa",
};

export default function TemplateSuratPage() {
  const initialTemplateId = DYNAMIC_SURAT_TEMPLATES[0]?.id ?? "";
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [customDynamicTemplates, setCustomDynamicTemplates] = useState<DynamicSuratTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingCustomDynamic, setSubmittingCustomDynamic] = useState(false);
  const [dynamicMessage, setDynamicMessage] = useState("");
  const [dynamicError, setDynamicError] = useState("");
  const [selectedDynamicTemplateId, setSelectedDynamicTemplateId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<"preview" | "edit">("preview");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingFields, setEditingFields] = useState<EditableTemplateField[]>([]);
  const [editingParagraphs, setEditingParagraphs] = useState({
    opening: DEFAULT_OPENING_PARAGRAPH,
    body: "",
    closing: DEFAULT_CLOSING_PARAGRAPH,
  });
  const [dynamicValues, setDynamicValues] = useState<TemplateFormValues>(() => {
    if (!selectedDynamicTemplateId) return {};
    const initialTemplate = DYNAMIC_SURAT_TEMPLATES.find((item) => item.id === selectedDynamicTemplateId);
    if (!initialTemplate) return {};
    return createInitialFormValues(initialTemplate.fields);
  });
  const [newDynamicTemplate, setNewDynamicTemplate] = useState({
    nama: "",
    jenisSurat: "",
    deskripsi: "",
  });
  const [openingParagraph, setOpeningParagraph] = useState(DEFAULT_OPENING_PARAGRAPH);
  const [simpleTemplateText, setSimpleTemplateText] = useState("");
  const [closingParagraph, setClosingParagraph] = useState(DEFAULT_CLOSING_PARAGRAPH);
  const [activeParagraphTarget, setActiveParagraphTarget] = useState<ParagraphTarget>("body");
  const [customCreateFieldLabel, setCustomCreateFieldLabel] = useState("");
  const [newDynamicFields, setNewDynamicFields] = useState<EditableTemplateField[]>([EMPTY_FIELD]);
  const openingRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const closingRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeEditParagraphTarget, setActiveEditParagraphTarget] = useState<ParagraphTarget>("body");
  const [customEditFieldLabel, setCustomEditFieldLabel] = useState("");
  const editOpeningRef = useRef<HTMLTextAreaElement | null>(null);
  const editBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const editClosingRef = useRef<HTMLTextAreaElement | null>(null);
  const dynamicTemplateOptions = useMemo(() => {
    // DB-saved templates take precedence over static defaults with the same ID
    const customIds = new Set(customDynamicTemplates.map((t) => t.id));
    const staticOnly = DYNAMIC_SURAT_TEMPLATES.filter((t) => !customIds.has(t.id));
    return [...staticOnly, ...customDynamicTemplates];
  }, [customDynamicTemplates]);

  const selectedDynamicTemplate = useMemo(() => {
    if (!selectedDynamicTemplateId) return undefined;
    return dynamicTemplateOptions.find((item) => item.id === selectedDynamicTemplateId);
  }, [dynamicTemplateOptions, selectedDynamicTemplateId]);

  const availablePlaceholderTokens = useMemo(() => {
    return newDynamicFields
      .map((field) => ({
        name: field.name.trim(),
        label: field.label.trim(),
      }))
      .filter((field) => field.name);
  }, [newDynamicFields]);

  const identityFieldTokens = useMemo(() => {
    return newDynamicFields
      .filter((field) => field.includeInIdentity)
      .map((field) => ({
        name: field.name.trim(),
        label: field.label.trim(),
      }))
      .filter((field) => field.name && field.label);
  }, [newDynamicFields]);

  const allAvailableTokens = useMemo(() => {
    const dynamicTokens = availablePlaceholderTokens
      .map((field) => ({
        name: field.name.trim(),
        label: field.label.trim() || field.name.trim(),
      }))
      .filter((field) => field.name);

    const systemTokens = SYSTEM_PLACEHOLDERS.map((token) => ({
      name: token,
      label: SYSTEM_TOKEN_LABELS[token] || token,
    }));

    return [...systemTokens, ...dynamicTokens].filter(
      (token, index, array) => array.findIndex((item) => item.name === token.name) === index
    );
  }, [availablePlaceholderTokens]);

  const editAvailableTokens = useMemo(() => {
    const dynamicTokens = editingFields
      .map((field) => ({
        name: field.name.trim(),
        label: field.label.trim() || field.name.trim(),
      }))
      .filter((field) => field.name);

    const systemTokens = SYSTEM_PLACEHOLDERS.map((token) => ({
      name: token,
      label: SYSTEM_TOKEN_LABELS[token] || token,
    }));

    return [...systemTokens, ...dynamicTokens].filter(
      (token, index, array) => array.findIndex((item) => item.name === token.name) === index
    );
  }, [editingFields]);

  const insertPlaceholderToActiveParagraph = (token: string) => {
    const placeholder = `{{${token}}}`;

    const applyAppend = (
      currentValue: string,
      setValue: (next: string | ((prev: string) => string)) => void
    ) => {
      setValue((prev) => {
        const base = String(prev || currentValue || "");
        if (!base.trim()) {
          return placeholder;
        }
        return `${base} ${placeholder}`;
      });
    };

    if (activeParagraphTarget === "opening") {
      if (openingRef.current && document.activeElement === openingRef.current) {
        const textarea = openingRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = openingParagraph;
        const next = `${value.slice(0, start)}${placeholder}${value.slice(end)}`;
        setOpeningParagraph(next);
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + placeholder.length;
          textarea.setSelectionRange(pos, pos);
        });
        return;
      }

      applyAppend(openingParagraph, setOpeningParagraph);
      return;
    }

    if (activeParagraphTarget === "closing") {
      if (closingRef.current && document.activeElement === closingRef.current) {
        const textarea = closingRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = closingParagraph;
        const next = `${value.slice(0, start)}${placeholder}${value.slice(end)}`;
        setClosingParagraph(next);
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + placeholder.length;
          textarea.setSelectionRange(pos, pos);
        });
        return;
      }

      applyAppend(closingParagraph, setClosingParagraph);
      return;
    }

    if (bodyRef.current && document.activeElement === bodyRef.current) {
      const textarea = bodyRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = simpleTemplateText;
      const next = `${value.slice(0, start)}${placeholder}${value.slice(end)}`;
      setSimpleTemplateText(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + placeholder.length;
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    applyAppend(simpleTemplateText, setSimpleTemplateText);
  };

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
      setDynamicError(err instanceof Error ? err.message : "Gagal mengambil daftar template");
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

  const moveNewDynamicField = (index: number, direction: "up" | "down") => {
    setNewDynamicFields((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const addPresetField = (preset: FieldPreset) => {
    setNewDynamicFields((prev) => {
      if (prev.some((field) => field.name.trim() === preset.name)) {
        return prev;
      }

      const mappedPreset: EditableTemplateField = {
        name: preset.name,
        label: preset.label,
        type: preset.type,
        required: preset.required ?? true,
        placeholder: preset.placeholder ?? "",
        optionsText: preset.optionsText ?? "",
        includeInIdentity: true,
      };

      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].label.trim()) {
        return [mappedPreset];
      }

      return [...prev, mappedPreset];
    });
  };

  const addSecondPartyPresetFields = () => {
    setNewDynamicFields((prev) => {
      const existingNames = new Set(prev.map((field) => field.name.trim()));
      const additional = SECOND_PARTY_FIELD_PRESETS
        .filter((preset) => !existingNames.has(preset.name))
        .map((preset) => ({
          name: preset.name,
          label: preset.label,
          type: preset.type,
          required: preset.required ?? false,
          placeholder: preset.placeholder ?? "",
          optionsText: preset.optionsText ?? "",
          includeInIdentity: true,
        } satisfies EditableTemplateField));

      if (additional.length === 0) return prev;
      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].label.trim()) {
        return additional;
      }

      return [...prev, ...additional];
    });
  };

  const ensureNewFieldByName = (fieldName: string) => {
    const preset = FIELD_PRESETS.find((item) => item.name === fieldName);
    if (!preset) return;
    addPresetField(preset);
  };

  const quickInsertToCreateParagraph = (fieldName: string) => {
    ensureNewFieldByName(fieldName);
    insertPlaceholderToActiveParagraph(fieldName);
  };

  const handleAddCustomCreateField = () => {
    const label = customCreateFieldLabel.trim();
    if (!label) return;

    const fieldName = normalizeFieldName(label);

    setNewDynamicFields((prev) => {
      if (prev.some((field) => field.name.trim() === fieldName)) {
        return prev;
      }

      const customField: EditableTemplateField = {
        name: fieldName,
        label,
        type: "text",
        required: false,
        placeholder: "",
        optionsText: "",
        includeInIdentity: true,
      };

      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].label.trim()) {
        return [customField];
      }

      return [...prev, customField];
    });

    insertPlaceholderToActiveParagraph(fieldName);
    setCustomCreateFieldLabel("");
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

    if (!simpleTemplateText.trim()) {
      setDynamicError("Isi paragraf surat wajib diisi pada Mode Mudah.");
      return;
    }

    if (!nama || !jenisSurat || !deskripsi) {
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

    const allowedTokens = new Set([
      ...SYSTEM_PLACEHOLDERS,
      ...normalizedFields.map((field) => field.name),
    ]);
    const usedTokens = [
      ...extractTemplatePlaceholders(openingParagraph),
      ...extractTemplatePlaceholders(simpleTemplateText),
      ...extractTemplatePlaceholders(closingParagraph),
    ];
    const invalidTokens = Array.from(new Set(usedTokens.filter((token) => !allowedTokens.has(token))));

    if (invalidTokens.length > 0) {
      setDynamicError(
        `Placeholder tidak dikenali: ${invalidTokens.join(", ")}. Gunakan hanya placeholder dari daftar token agar aman.`
      );
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

    const htmlTemplate = buildSimpleTemplateHtml({
      jenisSurat,
      formatMode: "dengan_tabel",
      openingParagraph,
      bodyText: simpleTemplateText.trim(),
      closingParagraph,
      identityFields: normalizedFields,
    });

    if (!htmlTemplate) {
      setDynamicError("Format template gagal dibuat. Coba periksa isian paragraf.");
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
      setNewDynamicTemplate({ nama: "", jenisSurat: "", deskripsi: "" });
      setOpeningParagraph(DEFAULT_OPENING_PARAGRAPH);
      setSimpleTemplateText("");
      setClosingParagraph(DEFAULT_CLOSING_PARAGRAPH);
      setNewDynamicFields([{ ...EMPTY_FIELD }]);
    } catch (err) {
      setDynamicError(err instanceof Error ? err.message : "Gagal menambah jenis surat dinamis");
    } finally {
      setSubmittingCustomDynamic(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    const shouldDelete = window.confirm("Hapus template ini?");
    if (!shouldDelete) return;

    try {
      setDynamicError("");
      setDynamicMessage("");
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus template");
      }

      setDynamicMessage(data.message || "Template berhasil dihapus");
      await fetchTemplates();
    } catch (err) {
      setDynamicError(err instanceof Error ? err.message : "Gagal menghapus template");
    }
  };

  const handleEditTemplate = (templateId: string) => {
    const template = dynamicTemplateOptions.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedDynamicTemplateId(templateId);

    const blueprint = DEFAULT_EDIT_BLUEPRINTS[templateId];
    if (blueprint) {
      setEditingFields(blueprint.fields.map((field) => toEditableFieldFromPreset(field)));
      setEditingParagraphs({
        opening: blueprint.opening,
        body: blueprint.body,
        closing: blueprint.closing,
      });
    } else {
      setEditingFields(
        template.fields.map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required ?? true,
          placeholder: f.placeholder ?? "",
          optionsText: f.options?.map((o) => `${o.label}:${o.value}`).join(", ") ?? "",
          includeInIdentity: true,
        }))
      );

      const parsedParagraphs = extractParagraphsFromTemplateHtml(template.htmlTemplate || "");
      setEditingParagraphs(parsedParagraphs);
    }

    setActiveEditParagraphTarget("body");
    
    setIsEditModalOpen(true);
    setEditModalTab("preview");
    setDynamicError("");
  };

  const insertPlaceholderToEditParagraph = (token: string) => {
    const placeholder = `{{${token}}}`;

    const applyAppend = (
      currentValue: string,
      updater: (next: string | ((prev: string) => string)) => void
    ) => {
      updater((prev) => {
        const base = String(prev || currentValue || "");
        if (!base.trim()) return placeholder;
        return `${base} ${placeholder}`;
      });
    };

    if (activeEditParagraphTarget === "opening") {
      if (editOpeningRef.current && document.activeElement === editOpeningRef.current) {
        const textarea = editOpeningRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = `${editingParagraphs.opening.slice(0, start)}${placeholder}${editingParagraphs.opening.slice(end)}`;
        setEditingParagraphs((prev) => ({ ...prev, opening: next }));
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + placeholder.length;
          textarea.setSelectionRange(pos, pos);
        });
        return;
      }

      applyAppend(editingParagraphs.opening, (value) =>
        setEditingParagraphs((prev) => ({
          ...prev,
          opening: typeof value === "function" ? value(prev.opening) : value,
        }))
      );
      return;
    }

    if (activeEditParagraphTarget === "closing") {
      if (editClosingRef.current && document.activeElement === editClosingRef.current) {
        const textarea = editClosingRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const next = `${editingParagraphs.closing.slice(0, start)}${placeholder}${editingParagraphs.closing.slice(end)}`;
        setEditingParagraphs((prev) => ({ ...prev, closing: next }));
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + placeholder.length;
          textarea.setSelectionRange(pos, pos);
        });
        return;
      }

      applyAppend(editingParagraphs.closing, (value) =>
        setEditingParagraphs((prev) => ({
          ...prev,
          closing: typeof value === "function" ? value(prev.closing) : value,
        }))
      );
      return;
    }

    if (editBodyRef.current && document.activeElement === editBodyRef.current) {
      const textarea = editBodyRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = `${editingParagraphs.body.slice(0, start)}${placeholder}${editingParagraphs.body.slice(end)}`;
      setEditingParagraphs((prev) => ({ ...prev, body: next }));
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + placeholder.length;
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    applyAppend(editingParagraphs.body, (value) =>
      setEditingParagraphs((prev) => ({
        ...prev,
        body: typeof value === "function" ? value(prev.body) : value,
      }))
    );
  };

  const ensureEditFieldByName = (fieldName: string) => {
    const preset = FIELD_PRESETS.find((item) => item.name === fieldName);
    if (!preset) return;

    setEditingFields((prev) => {
      if (prev.some((field) => field.name.trim() === fieldName)) {
        return prev;
      }

      return [
        ...prev,
        {
          name: preset.name,
          label: preset.label,
          type: preset.type,
          required: preset.required ?? true,
          placeholder: preset.placeholder ?? "",
          optionsText: preset.optionsText ?? "",
          includeInIdentity: true,
        },
      ];
    });
  };

  const quickInsertToEditParagraph = (fieldName: string) => {
    ensureEditFieldByName(fieldName);
    insertPlaceholderToEditParagraph(fieldName);
  };

  const handleAddCustomEditField = () => {
    const label = customEditFieldLabel.trim();
    if (!label) return;

    const fieldName = normalizeFieldName(label);

    setEditingFields((prev) => {
      if (prev.some((field) => field.name.trim() === fieldName)) {
        return prev;
      }

      return [
        ...prev,
        {
          name: fieldName,
          label,
          type: "text",
          required: false,
          placeholder: "",
          optionsText: "",
          includeInIdentity: true,
        },
      ];
    });

    insertPlaceholderToEditParagraph(fieldName);
    setCustomEditFieldLabel("");
  };

  const updateEditField = (index: number, updates: Partial<EditableTemplateField>) => {
    setEditingFields((prev) =>
      prev.map((field, idx) => (idx === index ? { ...field, ...updates } : field))
    );
  };

  const addEditField = () => {
    setEditingFields((prev) => [...prev, { ...EMPTY_FIELD }]);
  };

  const addSecondPartyEditFields = () => {
    setEditingFields((prev) => {
      const existingNames = new Set(prev.map((field) => field.name.trim()));
      const additional = SECOND_PARTY_FIELD_PRESETS
        .filter((preset) => !existingNames.has(preset.name))
        .map((preset) => ({
          name: preset.name,
          label: preset.label,
          type: preset.type,
          required: preset.required ?? false,
          placeholder: preset.placeholder ?? "",
          optionsText: preset.optionsText ?? "",
          includeInIdentity: true,
        } satisfies EditableTemplateField));

      if (additional.length === 0) return prev;
      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].label.trim()) {
        return additional;
      }

      return [...prev, ...additional];
    });
  };

  const moveEditField = (index: number, direction: "up" | "down") => {
    setEditingFields((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeEditField = (index: number) => {
    setEditingFields((prev) => {
      const nextFields = prev.filter((_, idx) => idx !== index);
      return nextFields.length > 0 ? nextFields : [{ ...EMPTY_FIELD }];
    });
  };

  const handleSaveEditedTemplate = async () => {
    if (!selectedDynamicTemplate) return;

    const normalizedFields = editingFields
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

    if (!editingParagraphs.body.trim()) {
      setDynamicError("Paragraf isi utama wajib diisi agar isi surat terbentuk jelas.");
      return;
    }

    const allowedTokens = new Set([
      ...SYSTEM_PLACEHOLDERS,
      ...normalizedFields.map((field) => field.name),
    ]);
    const usedTokens = [
      ...extractTemplatePlaceholders(editingParagraphs.opening),
      ...extractTemplatePlaceholders(editingParagraphs.body),
      ...extractTemplatePlaceholders(editingParagraphs.closing),
    ];
    const invalidTokens = Array.from(new Set(usedTokens.filter((token) => !allowedTokens.has(token))));

    if (invalidTokens.length > 0) {
      setDynamicError(
        `Placeholder tidak dikenali: ${invalidTokens.join(", ")}. Gunakan token dari daftar agar aman.`
      );
      return;
    }

    const generatedHtmlTemplate = buildSimpleTemplateHtml({
      jenisSurat: selectedDynamicTemplate.jenisSurat,
      formatMode: "dengan_tabel",
      openingParagraph: editingParagraphs.opening,
      bodyText: editingParagraphs.body,
      closingParagraph: editingParagraphs.closing,
      identityFields: normalizedFields,
    });

    if (!generatedHtmlTemplate) {
      setDynamicError("Format template gagal dibuat. Coba periksa isian paragraf.");
      return;
    }

    setIsSavingEdit(true);
    setDynamicError("");
    setDynamicMessage("");

    try {
      const response = await fetch("/api/admin/dynamic-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: selectedDynamicTemplate.id,
          nama: selectedDynamicTemplate.nama,
          jenisSurat: selectedDynamicTemplate.jenisSurat,
          deskripsi: selectedDynamicTemplate.deskripsi,
          htmlTemplate: generatedHtmlTemplate,
          fields: payloadFields,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Gagal memperbarui template");
      }

      await fetchDynamicTemplates();
      setDynamicMessage("Template berhasil diperbarui!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedDynamicTemplateId("");
      }, 1500);
    } catch (err) {
      setDynamicError(err instanceof Error ? err.message : "Gagal memperbarui template");
    } finally {
      setIsSavingEdit(false);
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

        <form onSubmit={handleCreateCustomDynamicTemplate} className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
          <h3 className="text-lg font-semibold text-emerald-900">Tambah Jenis Surat Dinamis Baru</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Isi nama surat, tulis kalimat surat, lalu pilih data warga apa saja yang ingin dimasukkan otomatis ke surat.
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Paragraf Pembuka</label>
              <textarea
                ref={openingRef}
                value={openingParagraph}
                onChange={(event) => setOpeningParagraph(event.target.value)}
                onFocus={() => setActiveParagraphTarget("opening")}
                rows={2}
                placeholder="Contoh: Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan dengan sebenarnya kepada:"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Header surat tetap sama. Bagian ini hanya untuk kalimat pembuka isi surat.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Paragraf Isi Utama</label>
              <textarea
                ref={bodyRef}
                value={simpleTemplateText}
                onChange={(event) => setSimpleTemplateText(event.target.value)}
                onFocus={() => setActiveParagraphTarget("body")}
                rows={8}
                placeholder={"Contoh:\nDengan ini menerangkan bahwa {{nama}} dengan NIK {{nik}} benar berdomisili di {{alamat}}.\n\nSurat ini dibuat untuk keperluan {{keperluan}}."}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-xs font-medium text-emerald-800">Cara memasukkan data otomatis ke paragraf:</p>
                <p className="mt-1 text-xs text-emerald-700">1. Pilih bagian surat yang aktif (Pembuka / Isi Utama / Penutup).</p>
                <p className="text-xs text-emerald-700">2. Klik tombol data di bawah seperti Nama Lengkap, NIK, atau Alamat.</p>
                <p className="text-xs text-emerald-700">3. Ulangi klik beberapa data jika ingin menggabungkan beberapa informasi dalam satu kalimat.</p>
                <div className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-white p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveParagraphTarget("opening")}
                    className={`rounded-md px-2 py-1 ${activeParagraphTarget === "opening" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    Pembuka
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveParagraphTarget("body")}
                    className={`rounded-md px-2 py-1 ${activeParagraphTarget === "body" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    Isi Utama
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveParagraphTarget("closing")}
                    className={`rounded-md px-2 py-1 ${activeParagraphTarget === "closing" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    Penutup
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_PARAGRAPH_FIELD_NAMES.map((fieldName) => {
                    const preset = FIELD_PRESETS.find((item) => item.name === fieldName);
                    if (!preset) return null;
                    return (
                      <button
                        key={`quick-create-${fieldName}`}
                        type="button"
                        onClick={() => quickInsertToCreateParagraph(fieldName)}
                        className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                      >
                        + {preset.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={customCreateFieldLabel}
                    onChange={(event) => setCustomCreateFieldLabel(event.target.value)}
                    placeholder="Tambah data lain (contoh: Nomor KK, RT, RW)"
                    className="w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCreateField}
                    className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                  >
                    + Tambah Data Lain
                  </button>
                </div>
                {availablePlaceholderTokens.length === 0 && (
                  <p className="mt-2 text-xs text-emerald-700">Tambahkan dulu field isian warga di bagian bawah agar pilihan data untuk paragraf muncul di sini.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Paragraf Penutup</label>
              <textarea
                ref={closingRef}
                value={closingParagraph}
                onChange={(event) => setClosingParagraph(event.target.value)}
                onFocus={() => setActiveParagraphTarget("closing")}
                rows={2}
                placeholder="Contoh: Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Bagian ini biasanya berisi kalimat penutup surat.
              </p>

              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                <p className="text-xs font-medium text-emerald-800">Field yang masuk blok data warga:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {identityFieldTokens.length > 0 ? (
                    identityFieldTokens.map((field) => (
                      <span key={`identity-${field.name}`} className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700">
                        {field.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700">Belum ada field yang dipilih untuk blok data warga.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Daftar Field Isian Warga</h4>
              <button
                type="button"
                onClick={addNewDynamicField}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                + Tambah Field
              </button>
            </div>

            <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-gray-700 space-y-1">
              <p>Tentukan data apa saja yang harus diisi warga. Data inilah yang nanti bisa Anda masukkan otomatis ke isi surat.</p>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-gray-700">Tambah cepat dari contoh umum:</p>
              <div className="flex flex-wrap gap-2">
                {FIELD_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addPresetField(preset)}
                    className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    + {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addSecondPartyPresetFields}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                >
                  + Paket Data Pihak 2 (Cerai/Penghasilan)
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Jika surat butuh dua orang, klik paket Pihak 2 lalu gunakan token seperti {'{{nama_pihak_2}}'}, {'{{nik_pihak_2}}'} di paragraf isi.
              </p>
            </div>

            <div className="space-y-3">
              {newDynamicFields.map((field, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    {/* Nomor urut */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 space-y-3">
                      {/* Row 1: Nama Isian + Tipe + Wajib + Hapus */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-5">
                          <label className="mb-1 block text-xs font-medium text-slate-900">
                            Nama Isian <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(event) => {
                              const nextLabel = event.target.value;
                              const autoName = normalizeFieldName(nextLabel);
                              updateNewField(index, { label: nextLabel, name: autoName });
                            }}
                            placeholder="Contoh: Nama Lengkap, NIK, Alamat"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-1 block text-xs font-medium text-slate-900">Jenis Input</label>
                          <select
                            value={field.type}
                            onChange={(event) => updateNewField(index, { type: event.target.value as TemplateFieldType })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="text">Teks Pendek</option>
                            <option value="number">Angka</option>
                            <option value="date">Tanggal</option>
                            <option value="textarea">Teks Panjang</option>
                            <option value="select">Pilihan</option>
                          </select>
                        </div>

                        <div className="flex items-end md:col-span-2">
                          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-slate-900">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(event) => updateNewField(index, { required: event.target.checked })}
                              className="h-4 w-4 rounded"
                            />
                            Wajib
                          </label>
                        </div>

                        <div className="flex items-end md:col-span-2">
                          <div className="grid w-full grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => moveNewDynamicField(index, "up")}
                              disabled={index === 0}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Naik
                            </button>
                            <button
                              type="button"
                              onClick={() => moveNewDynamicField(index, "down")}
                              disabled={index === newDynamicFields.length - 1}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Turun
                            </button>
                            <button
                              type="button"
                              onClick={() => removeNewDynamicField(index)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Contoh Isian + Opsi Select */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Contoh Isian untuk Warga (Opsional)</label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(event) => updateNewField(index, { placeholder: event.target.value })}
                            placeholder="Contoh teks yang muncul di form"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {field.type === "select" && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">
                              Daftar Pilihan <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={field.optionsText}
                              onChange={(event) => updateNewField(index, { optionsText: event.target.value })}
                              placeholder="Contoh: Laki-laki, Perempuan"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="mt-1 text-xs text-slate-500">Pisahkan setiap pilihan dengan koma</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
                  <button
                    type="button"
                    onClick={() => handleEditTemplate(template.id)}
                    className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700 hover:bg-amber-100"
                  >
                    Edit
                  </button>
                  <a
                    href={uploaded ? `/api/admin/templates/${uploaded.id}/preview` : `/api/admin/dynamic-templates/preview/${encodeURIComponent(template.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-blue-600 hover:bg-blue-100"
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

        {/* Modal Edit Template */}
        {isEditModalOpen && selectedDynamicTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Template: {selectedDynamicTemplate.nama}
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDynamicTemplateId("");
                  }}
                  className="rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50 px-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setEditModalTab("preview")}
                    className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      editModalTab === "preview"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Preview Form
                  </button>
                  <button
                    onClick={() => setEditModalTab("edit")}
                    className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      editModalTab === "edit"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Edit Field & Template
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Messages */}
                {dynamicMessage && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {dynamicMessage}
                  </div>
                )}
                {dynamicError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {dynamicError}
                  </div>
                )}

                {/* Preview Tab */}
                {editModalTab === "preview" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-1 font-semibold text-slate-900">Form Dinamis Berdasarkan Field</h4>
                      <p className="mb-3 text-sm text-slate-700">
                        Lihat bagaimana form ini akan terlihat saat pengguna mengisinya.
                      </p>
                      <DynamicTemplateForm
                        fields={editingFields
                          .filter((f) => f.name.trim() && f.label.trim())
                          .map(toTemplateFieldFromEditable)}
                        values={dynamicValues}
                        onFieldChange={handleDynamicFieldChange}
                      />
                    </div>
                  </div>
                )}

                {/* Edit Tab */}
                {editModalTab === "edit" && (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                      <h4 className="mb-2 font-semibold text-slate-900">Masukkan Data Otomatis ke Surat</h4>
                      <p className="mb-3 text-xs text-slate-700">
                        Pilih bagian surat yang ingin diisi, lalu klik nama data agar otomatis masuk ke kalimat.
                      </p>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveEditParagraphTarget("opening")}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            activeEditParagraphTarget === "opening"
                              ? "bg-emerald-600 text-white"
                              : "border border-emerald-200 bg-white text-emerald-700"
                          }`}
                        >
                          Paragraf Pembuka
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditParagraphTarget("body")}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            activeEditParagraphTarget === "body"
                              ? "bg-emerald-600 text-white"
                              : "border border-emerald-200 bg-white text-emerald-700"
                          }`}
                        >
                          Paragraf Isi Utama
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditParagraphTarget("closing")}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            activeEditParagraphTarget === "closing"
                              ? "bg-emerald-600 text-white"
                              : "border border-emerald-200 bg-white text-emerald-700"
                          }`}
                        >
                          Paragraf Penutup
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="mb-1 w-full">
                          <p className="text-xs text-slate-700">Perlu data lain di luar daftar? Ketik nama datanya di sini:</p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="text"
                              value={customEditFieldLabel}
                              onChange={(event) => setCustomEditFieldLabel(event.target.value)}
                              placeholder="Contoh: Nomor KK, RT, RW"
                              className="w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomEditField}
                              className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                            >
                              + Tambah Data Lain
                            </button>
                          </div>
                        </div>
                        {QUICK_PARAGRAPH_FIELD_NAMES.map((fieldName) => {
                          const preset = FIELD_PRESETS.find((item) => item.name === fieldName);
                          if (!preset) return null;
                          return (
                            <button
                              key={`quick-edit-${fieldName}`}
                              type="button"
                              onClick={() => quickInsertToEditParagraph(fieldName)}
                              className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                            >
                              + {preset.label}
                            </button>
                          );
                        })}
                        {editAvailableTokens.map((token) => (
                          <button
                            key={`edit-token-${token}`}
                            type="button"
                            onClick={() => insertPlaceholderToEditParagraph(token.name)}
                            className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                          >
                            {token.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-600">
                        Contoh: Dengan ini menerangkan bahwa <span className="font-mono">{"{{nama}}"}</span> beralamat di <span className="font-mono">{"{{alamat}}"}</span>.
                      </p>
                    </div>

                    {/* Edit Paragraf Pembuka */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                      <h4 className="mb-2 font-semibold text-slate-900">Paragraf Pembuka</h4>
                      <p className="mb-3 text-xs text-slate-700">
                        Kalimat pembuka surat sebelum data warga ditampilkan.
                      </p>
                      <textarea
                        ref={editOpeningRef}
                        value={editingParagraphs.opening}
                        onFocus={() => setActiveEditParagraphTarget("opening")}
                        onChange={(e) =>
                          setEditingParagraphs((prev) => ({ ...prev, opening: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Contoh: Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan..."
                      />
                    </div>

                    {/* Edit Paragraf Isi Utama */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                      <h4 className="mb-2 font-semibold text-slate-900">Paragraf Isi Utama</h4>
                      <p className="mb-3 text-xs text-slate-700">
                        Tulis inti surat di sini. Jika ingin memasukkan data warga, klik nama data pada kotak hijau di atas.
                      </p>
                      <textarea
                        ref={editBodyRef}
                        value={editingParagraphs.body}
                        onFocus={() => setActiveEditParagraphTarget("body")}
                        onChange={(e) =>
                          setEditingParagraphs((prev) => ({ ...prev, body: e.target.value }))
                        }
                        rows={5}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Contoh: Berdasarkan data yang ada, dengan ini menerangkan bahwa {{nama}} dengan NIK {{nik}} benar berdomisili di {{alamat}}."
                      />
                    </div>

                    {/* Edit Paragraf Penutup */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                      <h4 className="mb-2 font-semibold text-slate-900">Paragraf Penutup</h4>
                      <p className="mb-3 text-xs text-slate-700">
                        Kalimat penutup surat setelah tanda tangan.
                      </p>
                      <textarea
                        ref={editClosingRef}
                        value={editingParagraphs.closing}
                        onFocus={() => setActiveEditParagraphTarget("closing")}
                        onChange={(e) =>
                          setEditingParagraphs((prev) => ({ ...prev, closing: e.target.value }))
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Contoh: Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya."
                      />
                    </div>

                    {/* Edit Fields */}
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900">Data Warga (Field Isian)</h4>
                          <p className="mt-1 text-xs text-slate-700">
                            Field yang akan ditampilkan dalam tabel data warga pada surat.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addEditField}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          + Tambah Field
                        </button>
                      </div>

                      {/* Preset Fields */}
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-slate-900">Atau gunakan field siap pakai:</p>
                        <div className="flex flex-wrap gap-2">
                          {FIELD_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                const alreadyExists = editingFields.some((f) => f.name.trim() === preset.name);
                                if (!alreadyExists) {
                                  setEditingFields((prev) => [
                                    ...prev,
                                    {
                                      name: preset.name,
                                      label: preset.label,
                                      type: preset.type,
                                      required: preset.required ?? true,
                                      placeholder: preset.placeholder ?? "",
                                      optionsText: preset.optionsText ?? "",
                                      includeInIdentity: true,
                                    },
                                  ]);
                                }
                              }}
                              className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              + {preset.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={addSecondPartyEditFields}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100"
                          >
                            + Paket Data Pihak 2 (Cerai/Penghasilan)
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          Untuk surat yang butuh dua data orang, tambahkan paket Pihak 2 lalu masukkan token pihak kedua ke paragraf.
                        </p>
                      </div>

                      {/* Field List */}
                      <div className="space-y-3">
                        {editingFields.map((field, index) => (
                          <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                              {/* Nomor urut */}
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                {index + 1}
                              </div>

                              {/* Main content */}
                              <div className="flex-1 space-y-3">
                                {/* Row 1: Nama Isian + Tipe + Wajib */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                  <div className="md:col-span-5">
                                    <label className="mb-1 block text-xs font-medium text-slate-900">
                                      Nama Isian <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => {
                                        const nextLabel = e.target.value;
                                        const autoName = normalizeFieldName(nextLabel);
                                        updateEditField(index, { label: nextLabel, name: autoName });
                                      }}
                                      placeholder="Contoh: Nama Lengkap, NIK, Alamat"
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>

                                  <div className="md:col-span-3">
                                    <label className="mb-1 block text-xs font-medium text-slate-900">Jenis Input</label>
                                    <select
                                      value={field.type}
                                      onChange={(e) => updateEditField(index, { type: e.target.value as TemplateFieldType })}
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                      <option value="text">Teks Pendek</option>
                                      <option value="number">Angka</option>
                                      <option value="date">Tanggal</option>
                                      <option value="textarea">Teks Panjang</option>
                                      <option value="select">Pilihan</option>
                                    </select>
                                  </div>

                                  <div className="flex items-end md:col-span-2">
                                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-slate-900">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateEditField(index, { required: e.target.checked })}
                                        className="h-4 w-4 rounded"
                                      />
                                      Wajib
                                    </label>
                                  </div>

                                  <div className="flex items-end md:col-span-2">
                                    <div className="grid w-full grid-cols-3 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => moveEditField(index, "up")}
                                        disabled={index === 0}
                                        className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Naik
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveEditField(index, "down")}
                                        disabled={index === editingFields.length - 1}
                                        className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Turun
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeEditField(index)}
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 2: Placeholder + Opsi Select (jika perlu) */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">Contoh Isian (Opsional)</label>
                                    <input
                                      type="text"
                                      value={field.placeholder}
                                      onChange={(e) => updateEditField(index, { placeholder: e.target.value })}
                                      placeholder="Contoh teks yang muncul di form"
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>

                                  {field.type === "select" && (
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-slate-700">
                                        Daftar Pilihan <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={field.optionsText}
                                        onChange={(e) => updateEditField(index, { optionsText: e.target.value })}
                                        placeholder="Contoh: Laki-laki, Perempuan"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                      <p className="mt-1 text-xs text-slate-500">Pisahkan setiap pilihan dengan koma</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                      <button
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setSelectedDynamicTemplateId("");
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveEditedTemplate}
                        disabled={isSavingEdit}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
  );
}
