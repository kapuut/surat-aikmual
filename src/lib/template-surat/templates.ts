import { ALLOWED_SURAT_TYPES } from "@/lib/surat-data";
import { SURAT_TYPES, type JenisSurat } from "@/lib/surat-generator/types";
import type { DynamicSuratTemplate, TemplateField } from "./types";

type TemplateOverride = {
  additionalFields?: TemplateField[];
  removeFields?: string[];
  labelOverrides?: Record<string, string>;
};

const TEMPLATE_OVERRIDES: Partial<Record<JenisSurat, TemplateOverride>> = {
  // Contoh jika butuh field tambahan khusus satu surat:
  // "surat-masih-hidup": {
  //   additionalFields: [
  //     { name: "nama_ayah", label: "Nama Ayah", type: "text", required: false },
  //   ],
  // },
};

const COMMON_FIELDS: TemplateField[] = [
  { name: "nomor_surat", label: "Nomor Surat", type: "text", required: true, placeholder: "001/Ds-AIK/IV/2026" },
  { name: "nama_desa", label: "Nama Desa", type: "text", required: true, placeholder: "Aikmual" },
  { name: "kota", label: "Kota", type: "text", required: true, placeholder: "Praya" },
  { name: "tanggal_surat", label: "Tanggal Surat", type: "date", required: true },
  { name: "nama_kepala_desa", label: "Nama Kepala Desa", type: "text", required: true },
];

const FIELD_MAP: Record<string, Omit<TemplateField, "name">> = {
  nama: { label: "Nama", type: "text", required: true, placeholder: "Nama lengkap pemohon" },
  nik: { label: "NIK", type: "text", required: true, placeholder: "Nomor Induk Kependudukan" },
  tempatLahir: { label: "Tempat Lahir", type: "text", required: true },
  tanggalLahir: { label: "Tanggal Lahir", type: "date", required: true },
  jeniKelamin: {
    label: "Jenis Kelamin",
    type: "select",
    required: true,
    options: [
      { label: "Laki-laki", value: "Laki-laki" },
      { label: "Perempuan", value: "Perempuan" },
    ],
  },
  agama: { label: "Agama", type: "text", required: true },
  pekerjaan: { label: "Pekerjaan", type: "text", required: true },
  statusPerkawinan: {
    label: "Status Perkawinan",
    type: "select",
    required: true,
    options: [
      { label: "Belum Kawin", value: "Belum Kawin" },
      { label: "Kawin", value: "Kawin" },
      { label: "Cerai Hidup", value: "Cerai Hidup" },
      { label: "Cerai Mati", value: "Cerai Mati" },
    ],
  },
  kewarganegaraan: { label: "Kewarganegaraan", type: "text", required: true, placeholder: "Indonesia" },
  alamat: { label: "Alamat", type: "textarea", required: true },
};

function toReadableLabel(fieldName: string): string {
  const withSpaces = fieldName.replace(/([A-Z])/g, " $1").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function buildField(fieldName: string): TemplateField {
  const config = FIELD_MAP[fieldName];
  if (!config) {
    return {
      name: fieldName,
      label: toReadableLabel(fieldName),
      type: "text",
      required: true,
    };
  }

  return {
    name: fieldName,
    ...config,
  };
}

function mergeTemplateFields(baseFields: TemplateField[], override?: TemplateOverride): TemplateField[] {
  const removeFieldSet = new Set(override?.removeFields ?? []);

  const normalizedBase = baseFields
    .filter((field) => !removeFieldSet.has(field.name))
    .map((field) => {
      const labelOverride = override?.labelOverrides?.[field.name];
      if (!labelOverride) return field;
      return { ...field, label: labelOverride };
    });

  const additional = (override?.additionalFields ?? []).filter(
    (field) => !removeFieldSet.has(field.name)
  );

  return [...normalizedBase, ...additional].filter(
    (field, index, arr) => arr.findIndex((other) => other.name === field.name) === index
  );
}

function buildTemplateHtml(judul: string, bodyFields: TemplateField[]): string {
  const rowsHtml = bodyFields
    .map((field) => `<tr><td style="width:220px; vertical-align: top;">${field.label}</td><td>: {{${field.name}}}</td></tr>`)
    .join("\n");

  return `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.7; color: #111827;">
      <h2 style="text-align:center; margin-bottom: 0;">${judul}</h2>
      <p style="text-align:center; margin-top: 4px;">Nomor: {{nomor_surat}}</p>

      <p>Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan bahwa:</p>
      <table style="width:100%; margin: 12px 0; border-collapse: collapse;">
        ${rowsHtml}
      </table>

      <p>Surat ini dibuat berdasarkan data dan dokumen pendukung yang telah diverifikasi.</p>

      <div style="margin-top: 32px; text-align:right;">
        <p>{{kota}}, {{tanggal_surat}}</p>
        <p>Kepala Desa {{nama_desa}}</p>
        <br /><br /><br />
        <p><b>{{nama_kepala_desa}}</b></p>
      </div>
    </div>
  `.trim();
}

export const DYNAMIC_SURAT_TEMPLATES: DynamicSuratTemplate[] = ALLOWED_SURAT_TYPES.map((suratType) => {
  const metadata = SURAT_TYPES[suratType.slug as JenisSurat];
  const override = TEMPLATE_OVERRIDES[suratType.slug as JenisSurat];
  const metadataFields = mergeTemplateFields(
    metadata.fields.map((fieldName) => buildField(fieldName)),
    override
  );
  const allFields = [...metadataFields, ...COMMON_FIELDS].filter(
    (field, index, arr) => arr.findIndex((other) => other.name === field.name) === index
  );

  return {
    id: suratType.slug,
    nama: `Template ${suratType.title}`,
    jenisSurat: suratType.title,
    deskripsi: "",
    htmlTemplate: buildTemplateHtml(metadata.judul, metadataFields),
    fields: allFields,
  };
}).filter((template) => template.id !== 'surat-kepemilikan');

export function getTemplateById(templateId: string): DynamicSuratTemplate | undefined {
  return DYNAMIC_SURAT_TEMPLATES.find((item) => item.id === templateId);
}
