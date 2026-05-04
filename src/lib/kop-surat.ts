/**
 * Shared kop surat (letterhead) module.
 *
 * Edit THIS file to update the letterhead across ALL letter types in the system.
 * All surat templates import getKopSuratStyles() and getKopSuratHtml() from here.
 */

export const KOP_SURAT_LOGO_URL = '/images/logo-loteng.png';

/**
 * Returns the CSS block for the kop surat.
 * Inject this string inside a <style> tag.
 */
export function getKopSuratStyles(): string {
  return `
    /* ===== KOP SURAT (shared — edit src/lib/kop-surat.ts) ===== */
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

    @media (max-width: 900px) {
      .kop-row { grid-template-columns: 72px 1fr; }
      .kop-text { padding-right: 0; }
    }
    /* ===================================================== */
  `;
}

/**
 * Returns the HTML markup for the kop surat.
 *
 * @param logoUrl  URL of the logo image. Defaults to /images/logo-loteng.png.
 * @param options.crossOrigin  Add crossorigin="anonymous" to the <img> (needed for canvas export).
 */
export function getKopSuratHtml(
  logoUrl: string = KOP_SURAT_LOGO_URL,
  options?: { crossOrigin?: boolean }
): string {
  const crossOriginAttr = options?.crossOrigin ? ' crossorigin="anonymous"' : '';
  return `
    <div class="kop-surat">
      <div class="kop-row">
        <div class="logo-wrap">
          <img src="${logoUrl}" alt="Logo Lombok Tengah"${crossOriginAttr} />
        </div>
        <div class="kop-text">
          <div class="kabupaten">PEMERINTAH KABUPATEN LOMBOK TENGAH</div>
          <div class="kecamatan">KECAMATAN PRAYA</div>
          <div class="desa">DESA AIKMUAL</div>
          <div class="alamat">Alamat : Jln raya Praya &ndash; Mantang KM 07 Aikmual Praya Phone 08175726709 / 08175790747 Kode Post 83500</div>
        </div>
      </div>
      <div class="kop-divider"></div>
    </div>`;
}
