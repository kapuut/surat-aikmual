export const OFFICIAL_DYNAMIC_SURAT_CONTEXT = {
  kota: 'Aikmual',
  namaDesa: 'Aikmual',
  kecamatan: 'Praya',
  kabupaten: 'Lombok Tengah',
  provinsi: 'Nusa Tenggara Barat',
  namaKepalaDesa: 'KEPALA DESA AIKMUAL',
} as const;

export const OFFICIAL_DYNAMIC_OPENING_PARAGRAPH =
  'Yang bertanda tangan di bawah ini Kepala Desa {{nama_desa}} Kecamatan Praya Kabupaten Lombok Tengah menerangkan dengan sebenarnya kepada:';

export const OFFICIAL_DYNAMIC_CLOSING_PARAGRAPH =
  'Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.';

export const OFFICIAL_STANDARD_PROCEDURE = [
  {
    step: 1,
    title: 'Persiapan Dokumen',
    desc: 'Pastikan NIK akun sudah tervalidasi dan siapkan bukti pendukung domisili sesuai kebutuhan',
  },
  {
    step: 2,
    title: 'Isi Form Permohonan',
    desc: 'Lengkapi formulir permohonan dengan data yang benar',
  },
  {
    step: 3,
    title: 'Upload Dokumen',
    desc: 'Unggah dokumen pendukung sesuai jenis permohonan',
  },
  {
    step: 4,
    title: 'Verifikasi Data',
    desc: 'Petugas akan memverifikasi kelengkapan dan kebenaran data',
  },
  {
    step: 5,
    title: 'Proses Persetujuan',
    desc: 'Menunggu persetujuan dari Kepala Desa',
  },
  {
    step: 6,
    title: 'Akses Surat',
    desc: 'Surat dapat diunduh setelah mendapat persetujuan.',
  },
] as const;

export const OFFICIAL_DYNAMIC_PROCEDURE = OFFICIAL_STANDARD_PROCEDURE;

export function buildOfficialDynamicRequirements(requiredFields: string[]): string[] {
  return [
    'NIK terdaftar dan akun sudah tervalidasi admin',
    requiredFields.length > 0
      ? `Lengkapi data wajib dari admin: ${requiredFields.join(', ')}`
      : 'Lengkapi data identitas dasar sesuai formulir yang disediakan',
    'KTP dan KK cukup diunggah sekali saat registrasi akun',
    'Dokumen pendukung tambahan bersifat opsional dan dapat diunggah bila diperlukan',
  ];
}

export function buildOfficialDynamicSystemValues(tanggalSurat: string, nomorSurat: string): Record<string, string> {
  return {
    nomor_surat: nomorSurat,
    tanggal_surat: tanggalSurat,
    kota: OFFICIAL_DYNAMIC_SURAT_CONTEXT.kota,
    nama_desa: OFFICIAL_DYNAMIC_SURAT_CONTEXT.namaDesa,
    kecamatan: OFFICIAL_DYNAMIC_SURAT_CONTEXT.kecamatan,
    kabupaten: OFFICIAL_DYNAMIC_SURAT_CONTEXT.kabupaten,
    provinsi: OFFICIAL_DYNAMIC_SURAT_CONTEXT.provinsi,
    nama_kepala_desa: OFFICIAL_DYNAMIC_SURAT_CONTEXT.namaKepalaDesa,
  };
}
