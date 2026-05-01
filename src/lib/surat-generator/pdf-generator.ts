import { SuratData } from './types';
import { generateSuratTemplate } from './template';
import { formatTanggalSurat } from './nomor-surat';

/**
 * Generate PDF dari template surat
 * Client-side menggunakan html2canvas + jsPDF
 */
export async function generateSuratPDFClient(
  data: SuratData,
  filename?: string
): Promise<void> {
  // Dynamic import untuk client-side only
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Generate HTML template
  const htmlContent = generateSuratTemplate(data);

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.opacity = '0';
  container.style.position = 'absolute';
  document.body.appendChild(container);

  try {
    // Wait for all images to load
    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // Convert HTML to Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Create PDF from canvas
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Save PDF
    const finalFilename = filename || `surat-${new Date().getTime()}.pdf`;
    pdf.save(finalFilename);
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Generate PDF preview HTML untuk preview sebelum download
 */
export function generateSuratPreviewHTML(data: SuratData): string {
  return generateSuratTemplate(data);
}

/**
 * Export surat sebagai HTML string (untuk printer atau preview)
 */
export function exportSuratAsHTML(data: SuratData): string {
  return generateSuratTemplate(data);
}

/**
 * Get filename yang proper
 */
export function generateSuratFilename(data: SuratData): string {
  const sanatizedNama = data.nama.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const tanggal = formatTanggalSurat(data.tanggalSurat).replace(/\s+/g, '-');
  return `surat-${data.jenisSurat}-${sanatizedNama}-${tanggal}.pdf`;
}
