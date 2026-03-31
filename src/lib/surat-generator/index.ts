/**
 * Export utilities dari surat generator
 * Untuk kemudahan import di component/API routes
 */

export {
  generateSuratTemplate,
} from './template';

export {
  generateSuratFilename,
  generateSuratPDFClient,
  generateSuratPreviewHTML,
  exportSuratAsHTML,
} from './pdf-generator';

export {
  generateNomorSurat,
  formatNomorSurat,
  parseNomorSurat,
  formatTanggalSurat,
} from './nomor-surat';

export {
  SURAT_TYPES,
  type SuratData,
  type JenisSurat,
  type SuratMetadata,
} from './types';
