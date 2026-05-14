import type { TemplateField, TemplateFormValues } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createInitialFormValues(fields: TemplateField[]): TemplateFormValues {
  return fields.reduce<TemplateFormValues>((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});
}

export function renderTemplateWithValues(templateHtml: string, values: TemplateFormValues): string {
  return templateHtml.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    const rawValue = values[key] ?? "";
    const escaped = escapeHtml(String(rawValue).toUpperCase());
    if (key.endsWith('_bold')) return `<strong>${escaped}</strong>`;
    return escapeHtml(String(rawValue));
  });
}
