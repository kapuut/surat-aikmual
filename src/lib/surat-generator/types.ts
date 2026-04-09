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

  // Detail khusus surat keterangan kematian
  kematian?: {
    namaAlmarhum?: string;
    nikAlmarhum?: string;
    tempatLahirAlmarhum?: string;
    tanggalLahirAlmarhum?: Date;
    jenisKelaminAlmarhum?: 'Laki-laki' | 'Perempuan';
    agamaAlmarhum?: string;
    pekerjaanAlmarhum?: string;
    alamatTerakhir?: string;
    hubunganPelapor?: string;
    tanggalMeninggal?: Date;
    waktuMeninggal?: string;
    tempatMeninggal?: string;
    sebabKematian?: string;
    tanggalPemakaman?: Date;
    waktuPemakaman?: string;
    tempatPemakaman?: string;
  };

  // Detail khusus surat keterangan cerai
  cerai?: {
    namaMantan?: string;
    nikPasangan?: string;
    tempatLahirPasangan?: string;
    tanggalLahirPasangan?: Date;
    kewarganegaraanPasangan?: string;
    agamaPasangan?: string;
    pekerjaanPasangan?: string;
    alamatPasangan?: string;
    tanggalCerai?: Date;
    nomorAktaCerai?: string;
    tempatCerai?: string;
    teleponPemohon?: string;
  };

  // Detail khusus surat keterangan janda/duda
  janda?: {
    statusJanda?: string;
    alasanStatus?: string;
    namaPasangan?: string;
    tanggalKejadian?: Date;
  };

  // Detail khusus surat keterangan kehilangan
  kehilangan?: {
    statusPemohon?: string;
    penyandangCacat?: string;
    jenisBarang?: string;
    barangHilang?: string;
    asalBarang?: string;
    labelNomorBarang?: string;
    nomorBarang?: string;
    ciriBarang?: string;
    uraianKehilangan?: string;
    lokasiKehilangan?: string;
    tanggalKehilangan?: Date;
    keperluan?: string;
  };

  // Detail khusus surat keterangan penghasilan
  penghasilan?: {
    pendidikan?: string;
    namaWali?: string;
    nikWali?: string;
    tempatLahirWali?: string;
    tanggalLahirWali?: Date;
    jenisKelaminWali?: 'Laki-laki' | 'Perempuan';
    agamaWali?: string;
    sumberPenghasilan?: string;
    penghasilanPerBulan?: string;
    dasarKeterangan?: string;
  };

  // Detail khusus surat keterangan tidak memiliki rumah
  rumah?: {
    keperluan?: string;
    penyandangCacat?: string;
    statusTempatTinggal?: string;
    namaPemilikRumah?: string;
    hubunganDenganPemilik?: string;
    alamatTinggalSekarang?: string;
    lamaMenempati?: string;
    jumlahTanggungan?: string;
    alasanTidakMemiliki?: string;
  };

  // Detail khusus surat keterangan usaha
  usaha?: {
    keperluan?: string;
    penyandangCacat?: string;
    mulaiUsaha?: string;
    jenisUsaha?: string;
  };
  
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
  | 'surat-masih-hidup'
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
  'surat-masih-hidup': {
    jenis: 'surat-masih-hidup',
    judul: 'SURAT KETERANGAN MASIH HIDUP',
    deskripsi: 'Surat keterangan bahwa seseorang masih hidup',
    fields: ['nama', 'tempatLahir', 'tanggalLahir', 'jeniKelamin', 'agama', 'alamat'],
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
