// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'dd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: id });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMMM yyyy, HH:mm');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateNomorSurat(jenis: 'masuk' | 'keluar', urutan: number): string {
  const tahun = new Date().getFullYear();
  const bulan = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = jenis === 'masuk' ? 'SM' : 'SK';
  const nomorUrut = String(urutan).padStart(3, '0');
  
  return `${nomorUrut}/${prefix}/${bulan}/${tahun}`;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Ukuran file terlalu besar. Maksimal 5MB.'
    };
  }
  
  return { valid: true };
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value && value.trim() !== '') {
      params[key] = value;
    }
  });
  return params;
}

export function createSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams;
}

export function downloadFile(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function checkBusinessHours(): { isAllowed: boolean; message?: string } {
  // Get current time in WITA (UTC+8)
  const now = new Date();
  const wita = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  
  const dayOfWeek = wita.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = wita.getUTCHours();
  const minutes = wita.getUTCMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes for easier comparison
  
  // Weekend check (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isAllowed: false,
      message: 'Maaf, permohonan surat hanya dapat diajukan pada hari kerja (Senin-Jumat). Silakan ajukan permohonan Anda pada hari Senin.',
    };
  }
  
  // Check if after 15:00 (3 PM) on weekdays
  // 15:00 = 15 * 60 = 900 minutes
  if (currentTime >= 15 * 60) {
    return {
      isAllowed: false,
      message: 'Maaf, batas waktu pengajuan permohonan adalah jam 15.00 WITA. Silakan ajukan permohonan Anda besok.',
    };
  }
  
  return { isAllowed: true };
}

export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    monthStr: String(now.getMonth() + 1).padStart(2, '0'),
    yearStr: String(now.getFullYear())
  };
}