import { SuratData, SURAT_TYPES } from './types';
import { formatTanggalSurat, generateNomorSurat } from './nomor-surat';

/**
 * Generate HTML template surat resmi Indonesia
 * Format formal dengan Times New Roman, spacing 1.5, margin A4 standar
 */
export function generateSuratTemplate(data: SuratData): string {
  const suratType = SURAT_TYPES[data.jenisSurat];
  const nomorSurat = data.nomorSurat || generateNomorSurat(1, data.tanggalSurat);
  const tanggalSurat = formatTanggalSurat(data.tanggalSurat);
  
  // Konten isi surat berdasarkan jenis surat
  const isiSurat = data.isiSurat || generateIsiSurat(data);

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
      font-family: 'Times New Roman', serif;
      line-height: 1.5;
      color: #000;
      background-color: #fff;
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
      padding: 1.5cm 1.5cm 1rem 1.5cm;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    
    /* Kop Surat */
    .kop-surat {
      border-bottom: 3px double #000;
      padding-bottom: 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .kop-surat .desa-name {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 0.15em;
    }
    
    .kop-surat .alamat-info {
      font-size: 11px;
      margin-top: 0.25rem;
    }
    
    .kop-surat .keterangan {
      font-size: 10px;
      margin-top: 0.25rem;
      font-style: italic;
    }
    
    /* Judul Surat */
    .judul-surat {
      text-align: center;
      margin: 1.5rem 0 0.5rem 0;
      font-size: 13px;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 0.05em;
    }
    
    /* Nomor Surat */
    .nomor-surat {
      text-align: center;
      margin-bottom: 1rem;
      font-size: 11px;
    }
    
    /* Isi Surat - Tabel */
    .isi-surat {
      font-size: 12px;
      margin: 1rem 0 1.5rem 0;
    }
    
    .isi-surat p {
      margin-bottom: 0.5rem;
      text-align: justify;
      text-indent: 1.25cm;
      line-height: 1.5;
    }
    
    .isi-surat table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.5rem 0;
      padding-left: 1.25cm;
    }
    
    .isi-surat td {
      padding: 0.25rem;
      border: none;
    }
    
    .isi-surat .label {
      width: 4cm;
      vertical-align: top;
    }
    
    .isi-surat .nilai {
      vertical-align: top;
    }
    
    /* Penutup */
    .penutup {
      font-size: 12px;
      margin: 1.5rem 0 0.5rem 0;
      text-align: justify;
      text-indent: 1.25cm;
      line-height: 1.5;
    }
    
    /* Tanda Tangan */
    .tanda-tangan {
      margin-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    
    .tanda-tangan .mengetahui,
    .tanda-tangan .pejabat {
      width: 45%;
      text-align: center;
    }
    
    .tanda-tangan .tempat-tanggal {
      width: 50%;
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .tanda-tangan .garis {
      height: 60px;
    }
    
    .tanda-tangan .nama {
      margin-top: 0.5rem;
      font-weight: bold;
      min-height: 1.5rem;
    }
    
    .tanda-tangan .nip {
      font-size: 10px;
      margin-top: 0.25rem;
    }
    
    /* Print Styles */
    @page {
      size: A4;
      margin: 0;
    }
    
    @media print {
      .page {
        width: 100%;
        height: 100%;
        box-shadow: none;
        margin: 0;
        padding: 1.5cm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- KOP SURAT -->
    <div class="kop-surat">
      <div class="desa-name">PEMERINTAH KABUPATEN LOMBOK TENGAH</div>
      <div class="alamat-info">KECAMATAN SUKARARA | DESA AIKMUAL</div>
      <div class="alamat-info">Jalan Raya Desa Aikmual, Lombok Tengah | Telepon (0370) 6XXX</div>
      <div class="keterangan">Kode Pos: 83653</div>
    </div>

    <!-- JUDUL SURAT -->
    <div class="judul-surat">${suratType.judul}</div>

    <!-- NOMOR SURAT -->
    <div class="nomor-surat">Nomor: ${nomorSurat}</div>

    <!-- ISI SURAT -->
    <div class="isi-surat">
      <p>Dengan ini Pemerintah Desa Aikmual menerangkan bahwa:</p>
      
      <table>
        <tr>
          <td class="label">Nama</td>
          <td class="nilai">: ${data.nama}</td>
        </tr>
        <tr>
          <td class="label">NIK</td>
          <td class="nilai">: ${data.nik}</td>
        </tr>
        ${data.tempatLahir ? `
        <tr>
          <td class="label">Tempat, Tgl. Lahir</td>
          <td class="nilai">: ${data.tempatLahir}${data.tanggalLahir ? ', ' + formatTanggalSurat(data.tanggalLahir) : ''}</td>
        </tr>
        ` : ''}
        ${data.jeniKelamin ? `
        <tr>
          <td class="label">Jenis Kelamin</td>
          <td class="nilai">: ${data.jeniKelamin}</td>
        </tr>
        ` : ''}
        ${data.agama ? `
        <tr>
          <td class="label">Agama</td>
          <td class="nilai">: ${data.agama}</td>
        </tr>
        ` : ''}
        ${data.statusPerkawinan ? `
        <tr>
          <td class="label">Status Perkawinan</td>
          <td class="nilai">: ${data.statusPerkawinan}</td>
        </tr>
        ` : ''}
        ${data.pekerjaan ? `
        <tr>
          <td class="label">Pekerjaan</td>
          <td class="nilai">: ${data.pekerjaan}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label">Alamat</td>
          <td class="nilai">: ${data.alamat}</td>
        </tr>
        ${data.tanggalBerlaku ? `
        <tr>
          <td class="label">Berlaku</td>
          <td class="nilai">: ${formatTanggalSurat(data.tanggalBerlaku.dari)} s/d ${formatTanggalSurat(data.tanggalBerlaku.sampai)}</td>
        </tr>
        ` : ''}
      </table>

      <p>${isiSurat}</p>
    </div>

    <!-- PENUTUP -->
    <div class="penutup">
      Demikian surat keterangan ini dibuat untuk keperluan <strong>${suratType.deskripsi}</strong>.
    </div>

    <!-- TANDA TANGAN -->
    <div class="tanda-tangan">
      <div class="tempat-tanggal" style="width: 100%; margin-bottom: 0;">
        Aikmual, ${tanggalSurat}
      </div>
    </div>

    <div class="tanda-tangan">
      <div class="mengetahui">
        <p style="font-size: 10px; margin-bottom: 0.5rem;">MENGETAHUI</p>
        <div class="garis"></div>
        <div class="nama">${data.kepalaDesa?.nama || 'KEPALA DESA AIKMUAL'}</div>
        ${data.kepalaDesa?.nip ? `<div class="nip">NIP: ${data.kepalaDesa.nip}</div>` : ''}
      </div>
    </div>
  </div>
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
    
    'surat-kematian': 
      `Bahwa yang tersebut di atas telah meninggal dunia pada tanggal ${data.tanggalBerlaku?.dari ? formatTanggalSurat(data.tanggalBerlaku.dari) : '___________'} dan telah dilaporkan ke Desa Aikmual sesuai dengan peraturan perundang-undangan yang berlaku.`,
    
    'surat-kepemilikan': 
      `Bahwa yang tersebut di atas adalah pemilik sah dari barang yang dimaksud dan memiliki hak penuh atas barang tersebut sesuai dengan bukti-bukti yang ada.`,
    
    'surat-cerai': 
      `Bahwa yang tersebut di atas telah melakukan perceraian yang sah menurut hukum yang berlaku dan telah tercatat di Desa Aikmual.`,
    
    'surat-janda': 
      `Bahwa yang tersebut di atas memiliki status sebagai janda${data.jeniKelamin === 'Laki-laki' ? '/duda' : ''} dan statusnya tersebut telah tercatat di Desa Aikmual.`,
    
    'surat-kehilangan': 
      `Bahwa yang tersebut di atas telah melaporkan kehilangan barangnya kepada Pemerintah Desa Aikmual dan permohonan ini dibuat untuk keperluan klaim asuransi atau keperluan lainnya.`,
    
    'surat-penghasilan': 
      `Bahwa yang tersebut di atas adalah penduduk Desa Aikmual yang bekerja sebagai ${data.pekerjaan || 'pekerjaan tertentu'} dan penghasilannya dapat diterima sebagai bukti penghasilan untuk keperluan administrasi.`,
    
    'surat-tidak-punya-rumah': 
      `Bahwa yang tersebut di atas tidak memiliki rumah sendiri dan berdasarkan catatan administrasi kami, hal ini adalah benar adanya.`,
    
    'surat-usaha': 
      `Bahwa yang tersebut di atas adalah pengusaha/pedagang yang melakukan usaha di wilayah Desa Aikmual dan telah terdaftar di Desa Aikmual, sehingga berhak mendapatkan surat keterangan usaha ini.`,
  };
  
  return templates[type] || 'Semoga bermanfaat bagi yang membutuhkan.';
}
