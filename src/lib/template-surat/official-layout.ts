import {
  OFFICIAL_DYNAMIC_CLOSING_PARAGRAPH,
  OFFICIAL_DYNAMIC_OPENING_PARAGRAPH,
} from './official-defaults';

const LEGACY_ROOT_STYLE = "font-family: 'Times New Roman', serif; line-height: 1.7; color: #111827;";
const MODERN_ROOT_STYLE = "font-family: 'Bookman Old Style', 'Book Antiqua', serif; font-size: 12pt; line-height: 1.5; color: #000;";

const LEGACY_TITLE_STYLE = 'text-align:center; margin-bottom: 0;';
const MODERN_TITLE_STYLE = 'text-align: center; margin: 0.1cm 0 0.02cm 0; font-size: 12pt; font-weight: bold; text-decoration: underline; text-transform: uppercase;';

const LEGACY_NUMBER_STYLE = 'text-align:center; margin-top: 4px;';
const MODERN_NUMBER_STYLE = 'text-align: center; margin-bottom: 0.32cm; font-size: 12pt; line-height: 1.2;';

const LEGACY_TABLE_STYLE = 'width:100%; margin: 12px 0 16px; border-collapse: collapse;';
const MODERN_TABLE_STYLE = 'width: 100%; border-collapse: collapse; margin: 0.15cm 0 0.35cm 1.1cm; font-size: 12pt;';

const LEGACY_SIGNATURE_BLOCK = `<div style="margin-top: 32px; text-align:right;">
        <p>{{kota}}, {{tanggal_surat}}</p>
        <p>Kepala Desa {{nama_desa}}</p>
        <br /><br /><br />
        <p><b>{{nama_kepala_desa}}</b></p>
      </div>`;

const UPDATED_SIGNATURE_BLOCK = `<div style="width: 100%; margin-top: 0.5cm; display: flex; justify-content: flex-end;">
        <div style="width: 7.4cm; text-align: center;">
          <p style="margin: 0; text-align: center; text-indent: 0;">{{kota}}, {{tanggal_surat}}</p>
          <p style="margin: 0; text-align: center; text-indent: 0;">Kepala Desa {{nama_desa}}</p>
          <div style="height: 2.2cm;"></div>
          <p style="margin: 0; text-align: center; text-indent: 0; font-weight: bold; text-transform: uppercase; text-decoration: underline;">{{nama_kepala_desa}}</p>
        </div>
      </div>`;

const OFFICIAL_SIGNATURE_BLOCK = `<div style="margin-top: 0.25cm; display: flex; justify-content: flex-end; font-size: 12pt; break-inside: avoid; page-break-inside: avoid;">
        <div style="width: 7.4cm; text-align: center; margin-right: 0.2cm;">
          <div>{{kota}}, {{tanggal_surat}}</div>
          <div style="text-transform: uppercase;">Kepala Desa {{nama_desa}}</div>
          <div style="height: 2.2cm;"></div>
          <div style="font-weight: bold; text-transform: uppercase; text-decoration: underline;">{{nama_kepala_desa}}</div>
        </div>
      </div>`;

const LEGACY_OPENING_TEXT =
  'Yang bertanda tangan di bawah ini, Kepala Desa {{nama_desa}}, menerangkan dengan sebenarnya kepada:';

const OFFICIAL_OPENING_TEXT = OFFICIAL_DYNAMIC_OPENING_PARAGRAPH;

const LEGACY_CLOSING_TEXT =
  'Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.';

const OFFICIAL_CLOSING_TEXT = OFFICIAL_DYNAMIC_CLOSING_PARAGRAPH;

function normalizeIdentityNamePlaceholder(templateHtml: string): string {
  let normalized = templateHtml;

  // Auto-upgrade common name placeholders to bold variant, but only in identity table rows.
  normalized = normalized.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, (rowHtml) => {
    const plainRow = rowHtml.toLowerCase();
    const hasNameLabel = /nama(\s+lengkap|\s+pemohon)?/i.test(plainRow);
    if (!hasNameLabel) return rowHtml;

    return rowHtml.replace(
      /{{\s*(nama|nama_lengkap|namalengkap|namaLengkap|nama_pemohon|namaPemohon)\s*}}/gi,
      '{{nama_bold}}'
    );
  });

  // Fallback for non-table identity blocks like: <p>Nama Lengkap : {{nama}}</p>
  normalized = normalized.replace(
    /(<p\b[^>]*>\s*(?:\d+\.?\s*)?nama(?:\s+lengkap|\s+pemohon)?\s*:\s*){{\s*(nama|nama_lengkap|namalengkap|namaLengkap|nama_pemohon|namaPemohon)\s*}}(\s*<\/p>)/gi,
    '$1{{nama_bold}}$3'
  );

  return normalized;
}

export function normalizeCustomTemplateHtml(templateHtml: string): string {
  let normalized = String(templateHtml || '').trim();

  if (!normalized) {
    return normalized;
  }

  normalized = normalized
    .replace(LEGACY_ROOT_STYLE, MODERN_ROOT_STYLE)
    .replace(LEGACY_TITLE_STYLE, MODERN_TITLE_STYLE)
    .replace(LEGACY_NUMBER_STYLE, MODERN_NUMBER_STYLE)
    .replace(LEGACY_TABLE_STYLE, MODERN_TABLE_STYLE)
    .replace(LEGACY_SIGNATURE_BLOCK, OFFICIAL_SIGNATURE_BLOCK)
    .replace(UPDATED_SIGNATURE_BLOCK, OFFICIAL_SIGNATURE_BLOCK)
    .replaceAll(LEGACY_OPENING_TEXT, OFFICIAL_OPENING_TEXT)
    .replaceAll(LEGACY_CLOSING_TEXT, OFFICIAL_CLOSING_TEXT)
    .replace(
      '<p style="text-align:center; margin-top: 4px;">Nomor: {{nomor_surat}}</p>',
      `<div style="${MODERN_NUMBER_STYLE}">Nomor : {{nomor_surat}}</div>`
    )
    .replaceAll('Nomor: {{nomor_surat}}', 'Nomor : {{nomor_surat}}')
    .replace(/margin: 0 0 12px; text-align: justify;/g, 'margin: 0 0 0.35cm; text-align: justify; text-indent: 1.1cm; line-height: 1.5;')
    .replace(/margin: 20px 0 0; text-align: justify;/g, 'margin: 0.25cm 0 0.6cm 0; text-align: justify; text-indent: 1.1cm; line-height: 1.5;');

  normalized = normalizeIdentityNamePlaceholder(normalized);

  return normalized;
}

/**
 * Post-process rendered surat-janda HTML to replace "JANDA/DUDA" in the title
 * with a gender-specific label based on the pemohon's jenis_kelamin.
 */
export function adaptJandaDudaTitle(html: string, jenisKelamin: string): string {
  const jk = (jenisKelamin || '').trim().toLowerCase();
  if (jk === 'laki-laki') {
    return html.replace(/SURAT\s+KETERANGAN\s+JANDA\/DUDA/gi, 'SURAT KETERANGAN DUDA');
  }
  if (jk === 'perempuan') {
    return html.replace(/SURAT\s+KETERANGAN\s+JANDA\/DUDA/gi, 'SURAT KETERANGAN JANDA');
  }
  return html;
}