import type { JenisSurat, SuratData } from './types';

function addMonths(baseDate: Date, months: number): Date {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + months, baseDate.getDate());
}

export function buildSampleSuratData(jenisSurat: JenisSurat): SuratData {
  const now = new Date();
  const tanggalLahir = new Date(1990, 4, 12);

  const baseData: Omit<SuratData, 'jenisSurat'> = {
    nomorSurat: '001/Ds.Aml/04/2026',
    tanggalSurat: now,
    tanggalBerlaku: {
      dari: now,
      sampai: addMonths(now, 6),
    },
    nama: 'Ahmad Fauzi',
    nik: '5201121205900001',
    tempatLahir: 'Aikmual',
    tanggalLahir,
    jeniKelamin: 'Laki-laki',
    agama: 'Islam',
    pekerjaan: 'Wiraswasta',
    statusPerkawinan: 'Kawin',
    kewarganegaraan: 'Indonesia',
    alamat: 'Dusun Aikmual Timur, Desa Aikmual, Kecamatan Praya',
    isiSurat: 'Dengan ini menerangkan bahwa nama tersebut di atas adalah benar penduduk Desa Aikmual.',
    kepalaDesa: {
      nama: 'KEPALA DESA AIKMUAL',
    },
  };

  if (jenisSurat === 'surat-kematian') {
    return {
      ...baseData,
      jenisSurat,
      nama: 'Siti Aminah',
      nik: '5201124503600002',
      jeniKelamin: 'Perempuan',
      kematian: {
        namaAlmarhum: 'Siti Aminah',
        nikAlmarhum: '5201124503600002',
        tempatLahirAlmarhum: 'Aikmual',
        tanggalLahirAlmarhum: new Date(1960, 2, 5),
        jenisKelaminAlmarhum: 'Perempuan',
        agamaAlmarhum: 'Islam',
        pekerjaanAlmarhum: 'Ibu Rumah Tangga',
        alamatTerakhir: 'Dusun Aikmual Barat, Desa Aikmual',
        tanggalMeninggal: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        waktuMeninggal: '09:30 Wita',
        tempatMeninggal: 'Rumah',
        sebabKematian: 'Sakit',
        tanggalPemakaman: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        waktuPemakaman: '14:00 Wita',
        tempatPemakaman: 'TPU Desa Aikmual',
      },
    };
  }

  if (jenisSurat === 'surat-cerai') {
    return {
      ...baseData,
      jenisSurat,
      cerai: {
        namaMantan: 'Nurhayati',
        nikPasangan: '5201127108920003',
        tempatLahirPasangan: 'Praya',
        tanggalLahirPasangan: new Date(1992, 7, 31),
        kewarganegaraanPasangan: 'Indonesia',
        agamaPasangan: 'Islam',
        pekerjaanPasangan: 'Karyawan Swasta',
        alamatPasangan: 'Dusun Karang Anyar, Desa Aikmual',
        tanggalCerai: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      },
    };
  }

  if (jenisSurat === 'surat-janda') {
    return {
      ...baseData,
      jenisSurat,
      nama: 'Siti Rahmawati',
      nik: '5201126004950004',
      jeniKelamin: 'Perempuan',
      statusPerkawinan: 'Cerai Mati',
      janda: {
        statusJanda: 'Janda',
        alasanStatus: 'Cerai Mati',
      },
    };
  }

  if (jenisSurat === 'surat-kehilangan') {
    return {
      ...baseData,
      jenisSurat,
      kehilangan: {
        statusPemohon: 'Kawin',
        penyandangCacat: 'Tidak',
        jenisBarang: 'Dokumen',
        barangHilang: 'KTP Elektronik',
        asalBarang: 'Milik Pribadi',
        labelNomorBarang: 'NIK',
        nomorBarang: '5201121205900001',
        lokasiKehilangan: 'Pasar Praya',
        tanggalKehilangan: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
        uraianKehilangan: 'terjatuh saat perjalanan',
      },
    };
  }

  if (jenisSurat === 'surat-penghasilan') {
    return {
      ...baseData,
      jenisSurat,
      penghasilan: {
        pendidikan: 'SMA',
        namaWali: 'Muhammad Ali',
        nikWali: '5201120101650005',
        tempatLahirWali: 'Aikmual',
        tanggalLahirWali: new Date(1965, 0, 1),
        jenisKelaminWali: 'Laki-laki',
        agamaWali: 'Islam',
        sumberPenghasilan: 'Bertani',
        penghasilanPerBulan: '2500000',
        dasarKeterangan: 'Kepala Dusun setempat',
      },
    };
  }

  if (jenisSurat === 'surat-tidak-punya-rumah') {
    return {
      ...baseData,
      jenisSurat,
      rumah: {
        penyandangCacat: 'Tidak',
        alamatTinggalSekarang: 'Dusun Aikmual Timur, menumpang di rumah keluarga',
      },
    };
  }

  if (jenisSurat === 'surat-usaha') {
    return {
      ...baseData,
      jenisSurat,
      usaha: {
        penyandangCacat: 'Tidak',
        mulaiUsaha: '2021',
        jenisUsaha: 'Warung Sembako',
      },
    };
  }

  return {
    ...baseData,
    jenisSurat,
  };
}