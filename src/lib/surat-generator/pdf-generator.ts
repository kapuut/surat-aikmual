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
  // Generate HTML template
  const htmlContent = generateSuratTemplate(data);
  const finalFilename = filename || generateSuratFilename(data);
  
  return generatePDFFromHTML(htmlContent, finalFilename);
}

/**
 * Shared logic untuk generate PDF dari HTML string dengan kualitas HD
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  filename: string
): Promise<void> {
  // Dynamic import untuk client-side only
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  
  // Style container agar tidak merusak layout utama tapi tetap bisa di-render
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '21cm'; // A4 Width
  container.style.backgroundColor = '#ffffff';
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

    // Wait a bit for layout stabilization
    await new Promise(r => setTimeout(r, 500));

    // Convert HTML to Canvas with HD Quality settings
    const canvas = await html2canvas(container, {
      scale: 3, // HD quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794, // Force A4 width (210mm at 96dpi)
      imageTimeout: 0,
    });

    // Create PDF from canvas
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate dimensions to fit A4
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  } finally {
    // Cleanup
    if (container.parentNode) {
      document.body.removeChild(container);
    }
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

