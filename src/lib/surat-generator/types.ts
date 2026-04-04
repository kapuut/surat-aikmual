// Type untuk data surat
export interface SuratData {
  jenisSurat: JenisSurat;
  nomorSurat?: string;
  tanggalSurat: Date;
  tanggalBerlaku?: {
    dari: Date;
    sampai: Date;
  };
  
  // Data Pemohon
  nama: string;
  nik: string;
  tempatLahir?: string;
  tanggalLahir?: Date;
  jeniKelamin?: 'Laki-laki' | 'Perempuan';
  agama?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  kewarganegaraan?: string;
  alamat: string;
  
  // Isi Surat
  isiSurat?: string;
  
  // Tanda Tangan
  kepalaDesa?: {
    nama: string;
    nip?: string;
    signatureImageUrl?: string;
    qrCodeDataUrl?: string;
    verificationCode?: string;
  };
}

export type JenisSurat = 
  | 'surat-domisili'
  | 'surat-kematian'
  | 'surat-kepemilikan'
  | 'surat-cerai'
  | 'surat-janda'
  | 'surat-kehilangan'
  | 'surat-penghasilan'
  | 'surat-tidak-punya-rumah'
  | 'surat-usaha';

export interface SuratMetadata {
  jenis: JenisSurat;
  judul: string;
  deskripsi: string;
  fields: string[];
}

export const SURAT_TYPES: Record<JenisSurat, SuratMetadata> = {
  'surat-domisili': {
    jenis: 'surat-domisili',
    judul: 'SURAT KETERANGAN DOMISILI',
    deskripsi: 'Surat keterangan tempat tinggal',
    fields: ['nama', 'nik', 'alamat'],
  },
  'surat-kematian': {
    jenis: 'surat-kematian',
    judul: 'SURAT KETERANGAN KEMATIAN',
    deskripsi: 'Surat keterangan kematian seseorang',
    fields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'alamat'],
  },
  'surat-kepemilikan': {
    jenis: 'surat-kepemilikan',
    judul: 'SURAT KETERANGAN KEPEMILIKAN',
    deskripsi: 'Surat keterangan kepemilikan barang',
    fields: ['nama', 'nik', 'alamat'],
  },
  'surat-cerai': {
    jenis: 'surat-cerai',
    judul: 'SURAT KETERANGAN CERAI',
    deskripsi: 'Surat keterangan status cerai',
    fields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'alamat'],
  },
  'surat-janda': {
    jenis: 'surat-janda',
    judul: 'SURAT KETERANGAN JANDA/DUDA',
    deskripsi: 'Surat keterangan status janda atau duda',
    fields: ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jeniKelamin', 'alamat'],
  },
  'surat-kehilangan': {
    jenis: 'surat-kehilangan',
    judul: 'SURAT KETERANGAN KEHILANGAN',
    deskripsi: 'Surat keterangan kehilangan barang',
    fields: ['nama', 'nik', 'alamat'],
  },
  'surat-penghasilan': {
    jenis: 'surat-penghasilan',
    judul: 'SURAT KETERANGAN PENGHASILAN',
    deskripsi: 'Surat keterangan penghasilan seseorang',
    fields: ['nama', 'nik', 'pekerjaan', 'alamat'],
  },
  'surat-tidak-punya-rumah': {
    jenis: 'surat-tidak-punya-rumah',
    judul: 'SURAT KETERANGAN TIDAK MEMILIKI RUMAH',
    deskripsi: 'Surat keterangan tidak memiliki rumah',
    fields: ['nama', 'nik', 'alamat'],
  },
  'surat-usaha': {
    jenis: 'surat-usaha',
    judul: 'SURAT KETERANGAN USAHA',
    deskripsi: 'Surat keterangan usaha/perdagangan',
    fields: ['nama', 'nik', 'pekerjaan', 'alamat'],
  },
};
