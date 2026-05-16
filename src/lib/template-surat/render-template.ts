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

function normalizeLookupKey(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildValueLookup(values: TemplateFormValues): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const [key, raw] of Object.entries(values)) {
    const text = String(raw ?? "");
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    lookup.set(trimmedKey.toLowerCase(), text);

    const normalized = normalizeLookupKey(trimmedKey);
    if (normalized) {
      lookup.set(normalized, text);
    }
  }

  return lookup;
}

function resolveRawValue(token: string, lookup: Map<string, string>): string {
  const lower = token.toLowerCase();
  if (lookup.has(lower)) return lookup.get(lower) || "";

  const normalized = normalizeLookupKey(token);
  if (normalized && lookup.has(normalized)) {
    return lookup.get(normalized) || "";
  }

  // Fallback: {{nama_bold}} should still render when only nama/nama_lengkap exists.
  if (lower.endsWith("_bold")) {
    const withoutBold = lower.replace(/_bold$/i, "");
    const withoutBoldNormalized = normalizeLookupKey(withoutBold);

    if (lookup.has(withoutBold)) return lookup.get(withoutBold) || "";
    if (withoutBoldNormalized && lookup.has(withoutBoldNormalized)) {
      return lookup.get(withoutBoldNormalized) || "";
    }
  }

  return "";
}

export function renderTemplateWithValues(templateHtml: string, values: TemplateFormValues): string {
  const lookup = buildValueLookup(values);

  const moustacheRendered = templateHtml.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    const rawValue = resolveRawValue(key, lookup);
    if (key.endsWith("_bold")) {
      return `<strong>${escapeHtml(String(rawValue).toUpperCase())}</strong>`;
    }
    return escapeHtml(String(rawValue));
  });

  // Backward compatibility: support legacy bracket placeholders like [Nama Lengkap], [NIK], [Alamat].
  return moustacheRendered.replace(/\[\s*([^\[\]]+?)\s*\]/g, (match, label: string) => {
    const resolved = resolveRawValue(label, lookup);
    if (!resolved) return match;
    return escapeHtml(String(resolved));
  });
}
