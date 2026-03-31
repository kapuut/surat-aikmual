import { InputHTMLAttributes, ReactNode } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  helpText,
  required,
  className,
  id,
  ...props
}: FormInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 border rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        } ${className || ''}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormSelect({
  label,
  options,
  error,
  helpText,
  required,
  className,
  id,
  ...props
}: FormSelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 border rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        } ${className || ''}`}
        {...props}
      >
        <option value="">-- Pilih {label} --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormTextarea({
  label,
  error,
  helpText,
  required,
  className,
  id,
  ...props
}: FormTextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <textarea
        id={textareaId}
        className={`w-full px-4 py-2.5 border rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        } ${className || ''}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}
