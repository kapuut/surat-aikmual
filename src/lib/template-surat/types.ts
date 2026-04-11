export type TemplateFieldType = "text" | "number" | "date" | "textarea" | "select";

export type TemplateFieldOption = {
  label: string;
  value: string;
};

export type TemplateField = {
  name: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[];
};

export type DynamicSuratTemplate = {
  id: string;
  nama: string;
  jenisSurat: string;
  deskripsi: string;
  htmlTemplate: string;
  fields: TemplateField[];
};

export type TemplateFormValues = Record<string, string>;
