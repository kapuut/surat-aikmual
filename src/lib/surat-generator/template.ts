import { SuratData, SURAT_TYPES } from './types';
import { formatTanggalSurat, generateNomorSurat } from './nomor-surat';

interface SuratTemplateOptions {
  editable?: boolean;
  showToolbar?: boolean;
  logoUrl?: string;
}

function escapeHtml(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function valueOrDash(value: string | undefined): string {
  const cleaned = (value || '').trim();
  return cleaned ? escapeHtml(cleaned) : '-';
}

function valueOrDashUpper(value: string | undefined): string {
  const cleaned = (value || '').trim();
  return cleaned ? escapeHtml(cleaned.toLocaleUpperCase('id-ID')) : '-';
}

function formatTanggalLahirDisplay(value?: Date): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  const dd = String(value.getDate()).padStart(2, '0');
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const yyyy = value.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatAlamatDisplay(value: string): string {
  const cleaned = (value || '').trim();
  if (!cleaned) {
    return '-';
  }

  return escapeHtml(cleaned).replace(/\r?\n/g, '<br>');
}

function formatHariTanggal(value?: Date): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(value);
  const hariCapitalized = hari.charAt(0).toUpperCase() + hari.slice(1);
  return `${hariCapitalized}, ${formatTanggalSurat(value)}`;
}

function formatWaktu(value?: string): string {
  const cleaned = (value || '').trim();
  if (!cleaned) return '-';

  const compact = cleaned.replace(/\s+/g, ' ');
  if (/wib|wita|wit|wib\.|wita\.|wit\./i.test(compact)) {
    return escapeHtml(compact.replace(':', '.'));
  }

  if (/^\d{1,2}:\d{2}$/.test(compact)) {
    return `${escapeHtml(compact.replace(':', '.'))} Wita`;
  }

  return escapeHtml(compact);
}

function formatNominalRupiah(value?: string): string {
  const cleaned = (value || '').trim();
  if (!cleaned) return '-';

  const onlyDigits = cleaned.replace(/[^\d]/g, '');
  if (!onlyDigits) return escapeHtml(cleaned);

  const nominal = Number(onlyDigits);
  if (Number.isNaN(nominal)) return escapeHtml(cleaned);

  return `Rp ${new Intl.NumberFormat('id-ID').format(nominal)}`;
}

function formatTanggalSuratDisplay(value?: Date): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  return escapeHtml(formatTanggalSurat(value));
}

/**
 * Generate HTML template surat resmi Indonesia
 * Format formal dengan Bookman Old Style, font 12pt, spacing 1.5, margin A4 standar
 */
export function generateSuratTemplate(
  data: SuratData,
  options: SuratTemplateOptions = {}
): string {
  const suratType = SURAT_TYPES[data.jenisSurat];
  const nomorSurat = data.nomorSurat || generateNomorSurat(1, data.tanggalSurat);
  const tanggalSurat = formatTanggalSurat(data.tanggalSurat);
  const editable = Boolean(options.editable);
  const showToolbar = options.showToolbar ?? editable;
  const logoUrl = options.logoUrl || '/images/logo-loteng.png';
  const kepalaDesaName = data.kepalaDesa?.nama || 'Kepala Desa Aikmual';
  const signatureImageUrl = (data.kepalaDesa?.signatureImageUrl || '').trim();
  const qrCodeDataUrl = (data.kepalaDesa?.qrCodeDataUrl || '').trim();
  const hasDigitalSignatureAssets = Boolean(signatureImageUrl || qrCodeDataUrl);
  
  // Konten isi surat berdasarkan jenis surat
  const isiSurat = data.isiSurat || generateIsiSurat(data);

  const tempatTanggalLahir =
    data.tempatLahir || data.tanggalLahir
      ? `${valueOrDash(data.tempatLahir)}${data.tanggalLahir ? `, ${formatTanggalLahirDisplay(data.tanggalLahir)}` : ''}`
      : '-';

  const kematianData = data.kematian || {};
  const ceraiData = data.cerai || {};
  const rumahData = data.rumah || {};
  const usahaData = data.usaha || {};
  const tempatTanggalLahirAlmarhum =
    kematianData.tempatLahirAlmarhum || kematianData.tanggalLahirAlmarhum
      ? `${valueOrDash(kematianData.tempatLahirAlmarhum)}${kematianData.tanggalLahirAlmarhum ? `, ${formatTanggalLahirDisplay(kematianData.tanggalLahirAlmarhum)}` : ''}`
      : '-';

  const masaBerlaku =
    data.tanggalBerlaku && data.tanggalBerlaku.dari && data.tanggalBerlaku.sampai
      ? `${escapeHtml(formatTanggalSurat(data.tanggalBerlaku.dari))} sampai ${escapeHtml(formatTanggalSurat(data.tanggalBerlaku.sampai))}`
      : '-';

  let rows: string[];
  let isiSuratBodyHtml: string;
  const penutupText =
    data.jenisSurat === 'surat-kematian'
      ? 'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'
      : 'Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.';

  if (data.jenisSurat === 'surat-masih-hidup') {
    rows = [
      `<tr><td class="label">Nama</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDash(data.nama)}</td></tr>`,
      `<tr><td class="label">TTL</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">Alamat Terakhir</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
    ];
    isiSuratBodyHtml = `<p>${escapeHtml(isiSurat)}</p>`;
  } else if (data.jenisSurat === 'surat-kematian') {
    rows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(kematianData.namaAlmarhum || data.nama)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(kematianData.nikAlmarhum || data.nik)}</td></tr>`,
      `<tr><td class="label">3. Tempat/Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahirAlmarhum}</td></tr>`,
      `<tr><td class="label">4. Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(kematianData.jenisKelaminAlmarhum || data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">5. Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(kematianData.pekerjaanAlmarhum || data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">6. Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(kematianData.agamaAlmarhum || data.agama)}</td></tr>`,
      `<tr><td class="label">7. Alamat Terakhir</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(kematianData.alamatTerakhir || data.alamat)}</td></tr>`,
    ];

    const detailRows = [
      `<tr><td class="label">1. Hari/Tanggal/Tahun</td><td class="colon">:</td><td class="nilai">${escapeHtml(formatHariTanggal(kematianData.tanggalMeninggal))}</td></tr>`,
      `<tr><td class="label">2. Waktu</td><td class="colon">:</td><td class="nilai">${formatWaktu(kematianData.waktuMeninggal)}</td></tr>`,
      `<tr><td class="label">3. Tempat di</td><td class="colon">:</td><td class="nilai">${valueOrDash(kematianData.tempatMeninggal)}</td></tr>`,
      `<tr><td class="label">4. Hari/Tanggal Pemakaman</td><td class="colon">:</td><td class="nilai">${escapeHtml(formatHariTanggal(kematianData.tanggalPemakaman))}</td></tr>`,
      `<tr><td class="label">5. Waktu Pemakaman</td><td class="colon">:</td><td class="nilai">${formatWaktu(kematianData.waktuPemakaman)}</td></tr>`,
      `<tr><td class="label">6. Tempat Pemakaman</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(kematianData.tempatPemakaman || '')}</td></tr>`,
    ].join('');

    const sebabKematianHtml = kematianData.sebabKematian
      ? `<p>Keterangan sebab kematian: ${escapeHtml(kematianData.sebabKematian)}</p>`
      : '';

    isiSuratBodyHtml = `
      <p>Bahwa yang namanya tersebut di atas menurut Kepala Dusun setempat dan hasil pengecekan kami memang benar telah meninggal dunia pada :</p>
      <table>
        ${detailRows}
      </table>
      ${sebabKematianHtml}
    `;
  } else if (data.jenisSurat === 'surat-cerai') {
    const tempatTanggalLahirPasangan =
      ceraiData.tempatLahirPasangan || ceraiData.tanggalLahirPasangan
        ? `${valueOrDash(ceraiData.tempatLahirPasangan)}${ceraiData.tanggalLahirPasangan ? `, ${formatTanggalLahirDisplay(ceraiData.tanggalLahirPasangan)}` : ''}`
        : '-';

    rows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDash(data.nama)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">3. Tempat / Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">4. Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">5. Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">6. Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">7. Alamat / Tempat Tinggal</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
    ];

    const pasanganRows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDash(ceraiData.namaMantan)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(ceraiData.nikPasangan)}</td></tr>`,
      `<tr><td class="label">3. Tempat / Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahirPasangan}</td></tr>`,
      `<tr><td class="label">4. Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(ceraiData.kewarganegaraanPasangan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">5. Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(ceraiData.agamaPasangan)}</td></tr>`,
      `<tr><td class="label">6. Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(ceraiData.pekerjaanPasangan)}</td></tr>`,
      `<tr><td class="label">7. Alamat / Tempat Tinggal</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(ceraiData.alamatPasangan || '')}</td></tr>`,
    ].join('');

    const tanggalCeraiText = formatTanggalSuratDisplay(ceraiData.tanggalCerai);

    isiSuratBodyHtml = `
      <p>Bahwa yang namanya tersebut di atas memang benar warga kami dan yang bersangkutan telah bercerai pada tanggal ${tanggalCeraiText} dengan pasangan sebagai berikut:</p>
      <table>
        ${pasanganRows}
      </table>
    `;
  } else if (data.jenisSurat === 'surat-janda') {
    const jandaData = data.janda || {};
    const statusJandaDisplay = valueOrDash(jandaData.statusJanda || (data.jeniKelamin === 'Laki-laki' ? 'Duda' : 'Janda'));
    const alasanStatusDisplay = valueOrDash(jandaData.alasanStatus);
    const statusFinalHtml =
      alasanStatusDisplay === '-'
        ? `${statusJandaDisplay}`
        : `${statusJandaDisplay} ( ${alasanStatusDisplay} )`;

    rows = [
      `<tr><td class="label">Nama</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(data.nama)}</td></tr>`,
      `<tr><td class="label">NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">Tempat tgl lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">JenisKelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">Alamat</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
    ];

    isiSuratBodyHtml = `
      <p>Bahwa yang namanya tersebut diatas yang bertempat tinggal di ${formatAlamatDisplay(data.alamat)} memang benar berstatus <strong>${statusFinalHtml}</strong>.</p>
    `;
  } else if (data.jenisSurat === 'surat-penghasilan') {
    const penghasilanData = data.penghasilan || {};
    const tempatTanggalLahirWali =
      penghasilanData.tempatLahirWali || penghasilanData.tanggalLahirWali
        ? `${valueOrDash(penghasilanData.tempatLahirWali)}${penghasilanData.tanggalLahirWali ? `, ${formatTanggalLahirDisplay(penghasilanData.tanggalLahirWali)}` : ''}`
        : '-';
    const dasarKeterangan = (penghasilanData.dasarKeterangan || '').trim();
    const nominalPenghasilan = formatNominalRupiah(penghasilanData.penghasilanPerBulan);

    rows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(data.nama)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">3. Tempat / Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">4. Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">5. Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">6. Status</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.statusPerkawinan)}</td></tr>`,
      `<tr><td class="label">7. Pendidikan</td><td class="colon">:</td><td class="nilai">${valueOrDash(penghasilanData.pendidikan)}</td></tr>`,
      `<tr><td class="label">8. Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">9. Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">10. Alamat</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
    ];

    const waliRows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(penghasilanData.namaWali)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(penghasilanData.nikWali)}</td></tr>`,
      `<tr><td class="label">3. Tempat / Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahirWali}</td></tr>`,
      `<tr><td class="label">4. Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(penghasilanData.jenisKelaminWali)}</td></tr>`,
      `<tr><td class="label">5. Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(penghasilanData.agamaWali)}</td></tr>`,
    ].join('');

    isiSuratBodyHtml = `
      <p>Bahwa nama tersebut di atas adalah benar penduduk Desa Aikmual. Menurut keterangan ${escapeHtml(dasarKeterangan || 'Kepala Dusun setempat')}, yang bersangkutan merupakan anak/tanggungan dari:</p>
      <table>
        ${waliRows}
      </table>
      <p>Wali/orang tua tersebut memiliki penghasilan rata-rata sebesar <strong>${escapeHtml(nominalPenghasilan)}</strong> per bulan yang bersumber dari <strong>${valueOrDash(penghasilanData.sumberPenghasilan)}</strong>.</p>
    `;
  } else if (data.jenisSurat === 'surat-kehilangan') {
    const kehilanganData = data.kehilangan || {};
    const statusPemohon = kehilanganData.statusPemohon || data.statusPerkawinan;
    const penyandangCacat = kehilanganData.penyandangCacat || '-';
    const jenisBarang = (kehilanganData.jenisBarang || '').trim();
    const barangHilangRaw = (kehilanganData.barangHilang || '').trim();
    const asalBarangRaw = (kehilanganData.asalBarang || '').trim();
    const labelNomorBarangRaw = (kehilanganData.labelNomorBarang || 'Nomor').trim() || 'Nomor';
    const nomorBarangRaw = (kehilanganData.nomorBarang || '').trim();
    const ciriBarangRaw = (kehilanganData.ciriBarang || '').trim();
    const uraianKehilanganRaw = (kehilanganData.uraianKehilangan || '').trim();
    const lokasiKehilanganRaw = (kehilanganData.lokasiKehilangan || '').trim();
    const tanggalKehilangan = formatTanggalSuratDisplay(kehilanganData.tanggalKehilangan);
    const objekKehilangan = barangHilangRaw || jenisBarang || 'barang/dokumen penting';
    const uraianAkhir = uraianKehilanganRaw && /[.!?]$/.test(uraianKehilanganRaw) ? '' : '.';

    const berlakuMulai =
      data.tanggalBerlaku && data.tanggalBerlaku.dari && data.tanggalBerlaku.sampai
        ? `${escapeHtml(formatTanggalSurat(data.tanggalBerlaku.dari))} - ${escapeHtml(formatTanggalSurat(data.tanggalBerlaku.sampai))}`
        : '-';

    rows = [
      `<tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(data.nama)}</td></tr>`,
      `<tr><td class="label">2. NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">3. Tempat/Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">4. Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">5. Alamat/Tempat Tinggal</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
      `<tr><td class="label">6. Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">7. Status</td><td class="colon">:</td><td class="nilai">${valueOrDash(statusPemohon)}</td></tr>`,
      `<tr><td class="label">8. Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">9. Penyandang Cacat</td><td class="colon">:</td><td class="nilai">${valueOrDash(penyandangCacat)}</td></tr>`,
      `<tr><td class="label">10. Berlaku mulai</td><td class="colon">:</td><td class="nilai">${berlakuMulai}</td></tr>`,
    ];

    isiSuratBodyHtml = `
      <p>Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, dan telah hilang/jatuh <strong>${escapeHtml(objekKehilangan)}</strong>${jenisBarang ? ` yang tergolong ${escapeHtml(jenisBarang)}` : ''}${asalBarangRaw ? ` milik/berasal dari <strong>${escapeHtml(asalBarangRaw)}</strong>` : ''}${nomorBarangRaw ? ` dengan <strong>${escapeHtml(labelNomorBarangRaw)}: ${escapeHtml(nomorBarangRaw)}</strong>` : ''}${tanggalKehilangan !== '-' ? ` pada tanggal <strong>${tanggalKehilangan}</strong>` : ''}${lokasiKehilanganRaw ? ` di <strong>${escapeHtml(lokasiKehilanganRaw)}</strong>` : ''}.${uraianKehilanganRaw ? ` Menurut keterangan pemohon ${escapeHtml(uraianKehilanganRaw)}${uraianAkhir}` : ''}${ciriBarangRaw ? ` Barang tersebut memiliki ciri-ciri ${escapeHtml(ciriBarangRaw)}.` : ''}</p>
    `;
  } else if (data.jenisSurat === 'surat-tidak-punya-rumah') {
    const penyandangCacat = (rumahData.penyandangCacat || '').trim() || '-';
    const alamatTinggal = rumahData.alamatTinggalSekarang || data.alamat;

    rows = [
      `<tr><td class="label">Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(data.nama)}</td></tr>`,
      `<tr><td class="label">NIK / No KTP</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">Tempat/Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">Alamat/Tempat Tinggal</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(alamatTinggal)}</td></tr>`,
      `<tr><td class="label">Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">Status</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.statusPerkawinan)}</td></tr>`,
      `<tr><td class="label">Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">Penyandang Cacat</td><td class="colon">:</td><td class="nilai">${valueOrDash(penyandangCacat)}</td></tr>`,
      `<tr><td class="label">Masa Berlaku</td><td class="colon">:</td><td class="nilai">${masaBerlaku}</td></tr>`,
    ];

    isiSuratBodyHtml = `
      <p>Orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, dan memang yang bersangkutan <strong>Belum Memiliki Rumah</strong>.</p>
    `;
  } else if (data.jenisSurat === 'surat-usaha') {
    const penyandangCacat = (usahaData.penyandangCacat || '').trim() || '-';
    const mulaiUsaha = (usahaData.mulaiUsaha || '').trim() || '-';
    const jenisUsaha = (usahaData.jenisUsaha || '').trim();

    rows = [
      `<tr><td class="label">Nama Lengkap</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDashUpper(data.nama)}</td></tr>`,
      `<tr><td class="label">NIK / No KTP</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">Tempat/Tanggal Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">Alamat/Tempat Tinggal</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
      `<tr><td class="label">Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">Status</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.statusPerkawinan)}</td></tr>`,
      `<tr><td class="label">Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan || 'Indonesia')}</td></tr>`,
      `<tr><td class="label">Penyandang Cacat</td><td class="colon">:</td><td class="nilai">${valueOrDash(penyandangCacat)}</td></tr>`,
      `<tr><td class="label">Mulai Usaha</td><td class="colon">:</td><td class="nilai">${valueOrDash(mulaiUsaha)}</td></tr>`,
      `<tr><td class="label">Berlaku mulai</td><td class="colon">:</td><td class="nilai">${masaBerlaku}</td></tr>`,
    ];

    isiSuratBodyHtml = `
      <p>Menerangkan bahwa orang tersebut adalah benar-benar warga Desa Aikmual dengan data seperti di atas, yang memiliki usaha <strong>${valueOrDash(jenisUsaha || '-')}</strong>.</p>
    `;
  } else {
    rows = [
      `<tr><td class="label">Nama</td><td class="colon">:</td><td class="nilai nilai-bold">${valueOrDash(data.nama)}</td></tr>`,
      `<tr><td class="label">NIK</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.nik)}</td></tr>`,
      `<tr><td class="label">Tempat&nbsp;Tanggal&nbsp;Lahir</td><td class="colon">:</td><td class="nilai">${tempatTanggalLahir}</td></tr>`,
      `<tr><td class="label">Jenis Kelamin</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.jeniKelamin)}</td></tr>`,
      `<tr><td class="label">Agama</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.agama)}</td></tr>`,
      `<tr><td class="label">Pekerjaan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.pekerjaan)}</td></tr>`,
      `<tr><td class="label">Status</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.statusPerkawinan)}</td></tr>`,
      `<tr><td class="label">Kewarganegaraan</td><td class="colon">:</td><td class="nilai">${valueOrDash(data.kewarganegaraan)}</td></tr>`,
      `<tr><td class="label">Alamat</td><td class="colon">:</td><td class="nilai">${formatAlamatDisplay(data.alamat)}</td></tr>`,
      `<tr><td class="label">Masa Berlaku</td><td class="colon">:</td><td class="nilai">${masaBerlaku}</td></tr>`,
    ];
    isiSuratBodyHtml = `<p>${escapeHtml(isiSurat)}</p>`;
  }

  const toolbarHtml = showToolbar
    ? `
    <div class="editor-toolbar no-print">
      <div class="toolbar-title">Mode Edit Admin</div>
      <div class="toolbar-actions">
        <button type="button" onclick="downloadAsWord()">Simpan Word (.doc)</button>
        <button type="button" onclick="saveAsHtml()">Simpan HTML</button>
        <button type="button" onclick="saveAsPdf()">Simpan PDF / Print</button>
      </div>
    </div>`
    : '';

  const scriptHtml = showToolbar
    ? `
  <script>
    function buildExportHtml() {
      const suratContent = document.getElementById('suratContent');
      const page = suratContent ? suratContent.outerHTML : '';
      const styles = Array.from(document.querySelectorAll('style'))
        .map((styleEl) => styleEl.innerHTML)
        .join('\n');

      return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surat Desa Aikmual</title><style>' + styles + '</style></head><body>' + page + '</body></html>';
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function getBaseFilename() {
      const today = new Date().toISOString().slice(0, 10);
      return 'surat-aikmual-' + today;
    }

    function downloadAsWord() {
      const html = buildExportHtml();
      const blob = new Blob(['\\ufeff', html], { type: 'application/msword' });
      downloadBlob(blob, getBaseFilename() + '.doc');
    }

    function saveAsHtml() {
      const html = buildExportHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      downloadBlob(blob, getBaseFilename() + '.html');
    }

    function saveAsPdf() {
      window.print();
    }
  </script>`
    : '';

  const printScriptHtml = `
  <script>
    (function () {
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('print') === '1') {
          window.addEventListener('load', function () {
            setTimeout(function () {
              window.print();
            }, 180);
          });
        }
      } catch {
        // ignore query parsing errors
      }
    })();
  </script>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${suratType.judul}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Bookman Old Style', 'Book Antiqua', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background-color: #efefef;
      padding: 16px;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    .page {
      width: 21cm;
      height: 29.7cm;
      margin: 0 auto;
      padding: 1.2cm 1.3cm 1.2cm 1.3cm;
      font-size: 12pt;
      line-height: 1.5;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .editor-toolbar {
      width: 21cm;
      margin: 0 auto 10px auto;
      background: #1f2937;
      border-radius: 8px;
      color: #fff;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-family: Arial, sans-serif;
    }

    .toolbar-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .toolbar-actions button {
      border: none;
      background: #f59e0b;
      color: #111827;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .toolbar-actions button:hover {
      background: #fbbf24;
    }
    
    /* Kop Surat */
    .kop-surat {
      margin-bottom: 0.7cm;
      position: relative;
      padding-bottom: 0.15cm;
    }

    .kop-row {
      display: grid;
      grid-template-columns: 98px 1fr;
      column-gap: 10px;
      align-items: center;
    }

    .logo-wrap {
      width: 98px;
      height: 98px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-wrap img {
      width: 88px;
      height: 88px;
      object-fit: contain;
    }

    .kop-text {
      text-align: center;
      padding-right: 98px;
      font-family: 'Times New Roman', serif;
    }

    .kop-text .kabupaten {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .kop-text .kecamatan {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .kop-text .desa {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1px;
    }

    .kop-text .alamat {
      font-size: 9pt;
      border: 1px solid #111;
      padding: 2px 6px;
      display: inline-block;
      min-width: 86%;
      white-space: nowrap;
    }

    .kop-divider {
      margin-top: 4px;
      border-top: 1px solid #000;
      border-bottom: 2px solid #000;
      height: 3px;
    }
    
    /* Judul Surat */
    .judul-surat {
      text-align: center;
      margin: 0.1cm 0 0.02cm 0;
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
    }
    
    /* Nomor Surat */
    .nomor-surat {
      text-align: center;
      margin-bottom: 0.32cm;
      font-size: 12pt;
      line-height: 1.2;
    }
    
    /* Isi Surat - Tabel */
    .isi-surat {
      font-size: 12pt;
      margin: 0.2cm 0 0.6cm 0;
    }
    
    .isi-surat p {
      margin-bottom: 0.35cm;
      text-align: justify;
      text-indent: 1.1cm;
      line-height: 1.5;
    }
    
    .isi-surat table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.15cm 0 0.35cm 1.1cm;
      font-size: 12pt;
    }
    
    .isi-surat td {
      padding: 0.03cm 0;
      border: none;
      vertical-align: top;
    }
    
    .isi-surat .label {
      width: 3.8cm;
      white-space: nowrap;
    }

    .isi-surat .colon {
      width: 0.35cm;
      text-align: center;
    }

    .isi-surat .nilai {
      font-weight: 400;
    }

    .isi-surat .nilai-bold {
      font-weight: 700;
    }
    
    /* Penutup */
    .penutup {
      font-size: 12pt;
      margin: 0.25cm 0 0.6cm 0;
      text-align: justify;
      text-indent: 1.1cm;
      line-height: 1.5;
    }
    
    /* Tanda Tangan */
    .tanda-tangan {
      margin-top: 0.25cm;
      display: flex;
      justify-content: flex-end;
      font-size: 12pt;
    }
    
    .tanda-tangan .pejabat {
      width: 7.4cm;
      text-align: center;
      margin-right: 0.2cm;
    }

    .ttd-assets {
      margin-top: 0.35cm;
      min-height: 2.35cm;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 0.3cm;
      flex-direction: row;
    }

    .ttd-signature {
      width: 3.2cm;
      height: 2.1cm;
      object-fit: contain;
      order: 2;
    }

    .ttd-qr-wrap {
      width: 2.35cm;
      text-align: center;
      order: 1;
    }

    .ttd-qr {
      width: 1.95cm;
      height: 1.95cm;
      object-fit: contain;
      border: 1px solid #111;
      padding: 0.04cm;
      background: #fff;
    }

    .ttd-space {
      height: 2.2cm;
    }
    
    .tanda-tangan .nama {
      margin-top: 2.2cm;
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
    }

    .tanda-tangan .nama.nama-signed {
      margin-top: 0.35cm;
    }
    
    .tanda-tangan .nip {
      font-size: 12pt;
      margin-top: 0.25rem;
    }

    .editable-region[contenteditable="true"] {
      outline: 2px dashed #9ca3af;
      outline-offset: 6px;
      border-radius: 4px;
      min-height: calc(29.7cm - 2.4cm);
    }

    .editable-region[contenteditable="true"]:focus {
      outline-color: #2563eb;
    }

    .no-print {
      display: block;
    }
    
    /* Print Styles */
    @page {
      size: A4;
      margin: 0.9cm;
    }
    
    @media print {
      body {
        background: #fff;
        padding: 0;
      }

      .page {
        width: 100%;
        height: 100%;
        box-shadow: none;
        margin: 0;
        padding: 0;
      }

      .editable-region[contenteditable="true"] {
        outline: none;
      }

      .no-print {
        display: none !important;
      }
    }

    @media (max-width: 900px) {
      body {
        padding: 8px;
      }

      .editor-toolbar,
      .page {
        width: 100%;
      }

      .page {
        height: auto;
        min-height: 29.7cm;
      }

      .kop-row {
        grid-template-columns: 72px 1fr;
      }

      .kop-text {
        padding-right: 0;
      }
    }
  </style>
</head>
<body>
  ${toolbarHtml}
  <div class="page" id="suratContent" ${editable ? 'contenteditable="true"' : ''}>
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="kop-row">
        <div class="logo-wrap">
          <img src="${escapeHtml(logoUrl)}" alt="Logo Lombok Tengah" />
        </div>
        <div class="kop-text">
          <div class="kabupaten">PEMERINTAH KABUPATEN LOMBOK TENGAH</div>
          <div class="kecamatan">KECAMATAN PRAYA</div>
          <div class="desa">DESA AIKMUAL</div>
          <div class="alamat">Alamat : Jln raya Praya – Mantang KM 07 Aikmual Praya Phone 08175726709 / 08175790747 Kode Post 83500</div>
        </div>
      </div>
      <div class="kop-divider"></div>
    </div>

    <!-- JUDUL SURAT -->
    <div class="judul-surat">${escapeHtml(suratType.judul)}</div>

    <!-- NOMOR SURAT -->
    <div class="nomor-surat">Nomor : ${escapeHtml(nomorSurat)}</div>

    <!-- ISI SURAT -->
    <div class="isi-surat">
      <p>Yang bertanda tangan di bawah ini Kepala Desa Aikmual Kecamatan Praya Kabupaten Lombok Tengah menerangkan dengan sebenarnya kepada:</p>
      
      <table>
        ${rows.join('')}
      </table>

      ${isiSuratBodyHtml}
    </div>

    <!-- PENUTUP -->
    <div class="penutup">
      ${escapeHtml(penutupText)}
    </div>

    <!-- TANDA TANGAN -->
    <div class="tanda-tangan">
      <div class="pejabat">
        <div>Aikmual, ${escapeHtml(tanggalSurat)}</div>
        <div>${escapeHtml(kepalaDesaName)}</div>
        ${hasDigitalSignatureAssets
          ? `
        <div class="ttd-assets">
          ${signatureImageUrl ? `<img class="ttd-signature" src="${escapeHtml(signatureImageUrl)}" alt="Tanda tangan Kepala Desa" />` : ''}
          ${qrCodeDataUrl
            ? `<div class="ttd-qr-wrap">
              <img class="ttd-qr" src="${escapeHtml(qrCodeDataUrl)}" alt="QR verifikasi surat" />
            </div>`
            : ''}
        </div>`
          : '<div class="ttd-space"></div>'}
        <div class="nama${hasDigitalSignatureAssets ? ' nama-signed' : ''}">${escapeHtml(kepalaDesaName)}</div>
        ${data.kepalaDesa?.nip ? `<div class="nip">NIP: ${escapeHtml(data.kepalaDesa.nip)}</div>` : ''}
      </div>
    </div>
  </div>
  ${scriptHtml}
  ${printScriptHtml}
</body>
</html>
  `;
}

/**
 * Generate isi surat otomatis berdasarkan jenis surat
 */
function generateIsiSurat(data: SuratData): string {
  const type = data.jenisSurat;
  
  const templates: Record<string, string> = {
    'surat-domisili': 
      `Bahwa yang tersebut di atas benar-benar adalah penduduk sah/berdomisili di Desa Aikmual, Kecamatan Sukarara, Kabupaten Lombok Tengah, dan berdasarkan catatan administrasi kami, adalah benar adanya.`,

    'surat-masih-hidup':
      `Berdasarkan keterangan dari kepala dusun setempat dan penelitian kami bahwa yang namanya tersebut di atas memang benar masih hidup serta berdomisili di desa aikmual kecamatan praya kabupaten lombok tengah.`,
    
    'surat-kematian': 
      `Bahwa yang tersebut di atas telah meninggal dunia pada tanggal ${data.tanggalBerlaku?.dari ? formatTanggalSurat(data.tanggalBerlaku.dari) : '___________'} dan telah dilaporkan ke Desa Aikmual sesuai dengan peraturan perundang-undangan yang berlaku.`,
    
    'surat-kepemilikan': 
      `Bahwa yang tersebut di atas adalah pemilik sah dari barang yang dimaksud dan memiliki hak penuh atas barang tersebut sesuai dengan bukti-bukti yang ada.`,
    
    'surat-cerai': 
      `Bahwa yang tersebut di atas telah melakukan perceraian yang sah menurut hukum yang berlaku dan telah tercatat di Desa Aikmual.`,
    
    'surat-janda': 
      `Bahwa yang tersebut di atas memiliki status sebagai janda${data.jeniKelamin === 'Laki-laki' ? '/duda' : ''} dan statusnya tersebut telah tercatat di Desa Aikmual.`,
    
    'surat-kehilangan': 
      `Bahwa yang tersebut di atas telah melaporkan kehilangan barangnya kepada Pemerintah Desa Aikmual dan permohonan ini dibuat sesuai data kejadian yang disampaikan pemohon.`,
    
    'surat-penghasilan': 
      `Bahwa yang tersebut di atas adalah penduduk Desa Aikmual yang bekerja sebagai ${data.pekerjaan || 'pekerjaan tertentu'} dan penghasilannya dapat diterima sebagai bukti administrasi.`,
    
    'surat-tidak-punya-rumah': 
      `Bahwa yang tersebut di atas tidak memiliki rumah sendiri dan berdasarkan catatan administrasi kami, hal ini adalah benar adanya.`,
    
    'surat-usaha': 
      `Bahwa yang tersebut di atas adalah pengusaha/pedagang yang melakukan usaha di wilayah Desa Aikmual dan telah terdaftar di Desa Aikmual, sehingga berhak mendapatkan surat keterangan usaha ini.`,
  };
  
  return templates[type] || 'Semoga bermanfaat bagi yang membutuhkan.';
}
