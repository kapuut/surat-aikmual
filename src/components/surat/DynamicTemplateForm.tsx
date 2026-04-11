import type { TemplateField, TemplateFormValues } from "@/lib/template-surat/types";

type DynamicTemplateFormProps = {
  fields: TemplateField[];
  values: TemplateFormValues;
  onFieldChange: (fieldName: string, value: string) => void;
};

export default function DynamicTemplateForm({ fields, values, onFieldChange }: DynamicTemplateFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const commonClassName =
          "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

        if (field.type === "textarea") {
          return (
            <div key={field.name} className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field.label}
                {field.required ? " *" : ""}
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
            <div key={field.name}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field.label}
                {field.required ? " *" : ""}
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
          <div key={field.name}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required ? " *" : ""}
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
      })}
    </div>
  );
}
