// src/lib/types.ts

// User Types
export type UserRole = 'admin' | 'sekretaris' | 'kepala_desa' | 'masyarakat';

export interface User {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: UserRole;
  status: 'aktif' | 'nonaktif';
  nik?: string;
  alamat?: string;
  telepon?: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: UserRole;
  nik?: string;
  alamat?: string;
  telepon?: string;
}

// Permissions
export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  approve?: boolean;
  print?: boolean;
}

export interface RolePermissions {
  suratMasuk: Permission;
  suratKeluar: Permission;
  permohonan: Permission;
  templateSurat: Permission;
  laporan: Permission;
  approval: Permission;
  userManagement: Permission;
}

export const defaultPermissions: Record<UserRole, RolePermissions> = {
  admin: {
    suratMasuk: { read: true, create: true, update: true, delete: true, approve: true, print: true },
    suratKeluar: { read: true, create: true, update: true, delete: true, approve: true, print: true },
    permohonan: { read: true, create: true, update: true, delete: true, approve: true, print: true },
    templateSurat: { read: true, create: true, update: true, delete: true, print: true },
    laporan: { read: true, create: false, update: false, delete: false, print: true },
    approval: { read: true, create: false, update: true, delete: false, approve: true },
    userManagement: { read: true, create: true, update: true, delete: true }
  },
  sekretaris: {
    suratMasuk: { read: true, create: true, update: true, delete: false, approve: false, print: true },
    suratKeluar: { read: true, create: true, update: true, delete: false, approve: false, print: true },
    permohonan: { read: true, create: false, update: true, delete: false, approve: false, print: true },
    templateSurat: { read: true, create: true, update: true, delete: false, print: true },
    laporan: { read: true, create: false, update: false, delete: false, print: true },
    approval: { read: true, create: false, update: false, delete: false, approve: false },
    userManagement: { read: false, create: false, update: false, delete: false }
  },
  kepala_desa: {
    suratMasuk: { read: true, create: false, update: false, delete: false, approve: true, print: true },
    suratKeluar: { read: true, create: false, update: false, delete: false, approve: true, print: true },
    permohonan: { read: true, create: false, update: false, delete: false, approve: true, print: true },
    templateSurat: { read: true, create: false, update: false, delete: false, print: true },
    laporan: { read: true, create: false, update: false, delete: false, print: true },
    approval: { read: true, create: false, update: true, delete: false, approve: true },
    userManagement: { read: false, create: false, update: false, delete: false }
  },
  masyarakat: {
    suratMasuk: { read: false, create: false, update: false, delete: false, print: false },
    suratKeluar: { read: false, create: false, update: false, delete: false, print: false },
    permohonan: { read: true, create: true, update: false, delete: false, print: true },
    templateSurat: { read: true, create: false, update: false, delete: false, print: false },
    laporan: { read: false, create: false, update: false, delete: false, print: false },
    approval: { read: false, create: false, update: false, delete: false, approve: false },
    userManagement: { read: false, create: false, update: false, delete: false }
  }
};

export interface Surat {
  id: string;
  nomorSurat: string;
  tanggal: Date;
  perihal: string;
  pengirim: string;
  penerima: string;
  jenisSurat: 'masuk' | 'keluar';
  kategori: string;
  isiSingkat?: string;
  filePath?: string;
  fileName?: string;
  status: 'aktif' | 'arsip';
  keterangan?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuratFormData {
  nomorSurat: string;
  tanggal: string;
  perihal: string;
  pengirim: string;
  penerima: string;
  jenisSurat: 'masuk' | 'keluar';
  kategori: string;
  isiSingkat?: string;
  keterangan?: string;
  file?: File | null;
}

export interface FilterSurat {
  jenisSurat?: 'masuk' | 'keluar' | '';
  kategori?: string;
  status?: 'aktif' | 'arsip' | '';
  tanggalMulai?: string;
  tanggalSelesai?: string;
  search?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationData;
}

export interface Statistik {
  totalSurat: number;
  suratMasuk: number;
  suratKeluar: number;
  suratBulanIni: number;
  suratMingguIni: number;
  suratHariIni: number;
}

export interface LaporanFilter {
  bulan?: string;
  tahun?: string;
  jenisSurat?: 'masuk' | 'keluar' | '';
  kategori?: string;
}

export interface LaporanData {
  totalSurat: number;
  suratMasuk: number;
  suratKeluar: number;
  kategoriTerbanyak: string;
  grafikBulanan: Array<{
    bulan: string;
    masuk: number;
    keluar: number;
  }>;
  suratList: Surat[];
}

// Constants
export const KATEGORI_SURAT = [
  'Undangan',
  'Pemberitahuan', 
  'Permohonan',
  'Laporan',
  'Surat Keterangan',
  'Surat Pengantar',
  'Disposisi',
  'Surat Tugas',
  'Surat Keputusan',
  'Lainnya'
] as const;

export const JENIS_SURAT = [
  { value: 'masuk', label: 'Surat Masuk' },
  { value: 'keluar', label: 'Surat Keluar' }
] as const;

export const STATUS_SURAT = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'arsip', label: 'Arsip' }
] as const;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB