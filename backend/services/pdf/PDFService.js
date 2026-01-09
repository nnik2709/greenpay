const PDFDocument = require('pdfkit');
const { addHeader } = require('./components/Header');
const { addFooter } = require('./components/Footer');
const { generateBarcode } = require('./components/Barcode');
const { generateQRCode } = require('./components/QRCode');
const colors = require('./styles/colors');

/**
 * Base PDF Service Class
 *
 * Provides common PDF generation functionality for all document types
 */
class PDFService {
  constructor(options = {}) {
    this.pageWidth = 595.28;  // A4 width in points
    this.pageHeight = 841.89; // A4 height in points
    this.margin = options.margin || 60;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  /**
   * Create new PDF document
   *
   * @param {Object} options - PDF options
   * @returns {PDFDocument} New PDF document instance
   */
  createDocument(options = {}) {
    return new PDFDocument({
      size: 'A4',
      margin: this.margin,
      ...options
    });
  }

  /**
   * Generate PDF as Buffer
   *
   * @param {Function} contentFn - Async function to generate PDF content
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(contentFn) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content using provided function
        await contentFn(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Add standard header
   */
  addHeader(doc, yPos) {
    return addHeader(doc, yPos, {
      pageWidth: this.pageWidth
    });
  }

  /**
   * Add standard footer
   */
  addFooter(doc) {
    addFooter(doc, {
      pageWidth: this.pageWidth,
      pageHeight: this.pageHeight,
      margin: this.margin
    });
  }

  /**
   * Add title
   */
  addTitle(doc, title, yPos, options = {}) {
    const {
      fontSize = 48,
      color = colors.PRIMARY,
      align = 'center'
    } = options;

    doc.fontSize(fontSize)
       .fillColor(color)
       .font('Helvetica')
       .text(title, this.margin, yPos, {
         width: this.contentWidth,
         align
       });

    return yPos + fontSize + 20;
  }

  /**
   * Add horizontal line
   */
  addLine(doc, yPos, options = {}) {
    const {
      color = colors.PRIMARY,
      lineWidth = 3
    } = options;

    doc.moveTo(this.margin, yPos)
       .lineTo(this.pageWidth - this.margin, yPos)
       .lineWidth(lineWidth)
       .stroke(color);

    return yPos + 25;
  }

  /**
   * Add barcode
   */
  async addBarcode(doc, code, yPos) {
    try {
      const barcodeBuffer = await generateBarcode(code);
      const barcodeWidth = 300;
      const barcodeX = (this.pageWidth - barcodeWidth) / 2;

      doc.image(barcodeBuffer, barcodeX, yPos, { width: barcodeWidth });

      return yPos + 100; // Return position below barcode
    } catch (err) {
      console.error('Failed to add barcode:', err);
      return yPos;
    }
  }

  /**
   * Add QR code
   */
  async addQRCode(doc, text, yPos, options = {}) {
    try {
      const { size = 150, align = 'center' } = options;
      const qrBuffer = await generateQRCode(text, size);

      let qrX;
      if (align === 'center') {
        qrX = (this.pageWidth - size) / 2;
      } else if (align === 'left') {
        qrX = this.margin;
      } else {
        qrX = this.pageWidth - this.margin - size;
      }

      doc.image(qrBuffer, qrX, yPos, { width: size });
      return yPos + size + 20; // Return position below QR code
    } catch (err) {
      console.error('Failed to add QR code:', err);
      return yPos;
    }
  }
}

module.exports = PDFService;
