const PDFService = require('../PDFService');
const colors = require('../styles/colors');
const { generateBarcode } = require('../components/Barcode');

/**
 * Voucher PDF Template
 *
 * Generates green fee voucher PDFs with consistent formatting
 * Supports two types:
 * 1. Unregistered vouchers (no passport) - shows QR + URL for registration
 * 2. Registered vouchers (with passport) - shows passport details
 */
class VoucherTemplate extends PDFService {
  /**
   * Generate voucher PDF
   *
   * @param {Object} voucher - Voucher data
   * @param {string} voucher.voucher_code - Voucher code
   * @param {string} [voucher.passport_number] - Passport number (if registered)
   * @param {string} [voucher.customer_name] - Customer full name (if registered)
   * @param {string} [voucher.nationality] - Nationality (if registered)
   * @param {string} [voucher.full_name] - Alternative field for full name
   * @param {Object} [options] - Generation options
   * @param {string} [options.baseUrl] - Base URL for registration (default: https://pnggreenfees.gov.pg)
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateVoucher(voucher, options = {}) {
    const { baseUrl = 'https://pnggreenfees.gov.pg' } = options;
    const hasPassport = Boolean(voucher.passport_number);
    const registrationUrl = `${baseUrl}/voucher/register/${voucher.voucher_code}`;

    return this.generatePDF(async (doc) => {
      let yPos = this.margin;

      // Add header with logo
      yPos = this.addHeader(doc, yPos);

      yPos += 30;

      // Green box with Voucher Code and Barcode
      const boxY = yPos;
      const boxHeight = 200;
      const boxPadding = 20;

      // Draw green border box
      doc.rect(this.margin, boxY, this.contentWidth, boxHeight)
         .lineWidth(2)
         .stroke(colors.PRIMARY);

      yPos = boxY + boxPadding;

      // "Voucher Code" label
      doc.fontSize(14)
         .fillColor(colors.TEXT_LIGHT)
         .font('Helvetica')
         .text('Voucher Code', this.margin + boxPadding, yPos, {
           width: this.contentWidth - (boxPadding * 2),
           align: 'left'
         });

      yPos += 30;

      // Voucher code value in green
      doc.fontSize(28)
         .fillColor(colors.PRIMARY)
         .font('Helvetica-Bold')
         .text(voucher.voucher_code, this.margin + boxPadding, yPos, {
           width: this.contentWidth - (boxPadding * 2),
           align: 'left'
         });

      doc.fontSize(11)
         .fillColor(colors.TEXT_LIGHT)
         .font('Helvetica')
         .text('Present this code at the gate for entry', this.margin + boxPadding, yPos + 35, {
           width: this.contentWidth - (boxPadding * 2),
           align: 'left'
         });

      // Barcode on the right side - single row with code underneath
      const barcodeWidth = 220;
      const barcodeX = this.pageWidth - this.margin - barcodeWidth - boxPadding;
      const barcodeY = boxY + boxPadding + 20;

      try {
        const barcodeBuffer = await generateBarcode(voucher.voucher_code, barcodeWidth, 50);
        doc.image(barcodeBuffer, barcodeX, barcodeY, { width: barcodeWidth });

        // Voucher code underneath barcode (not "Scan barcode at gate")
        doc.fontSize(14)
           .fillColor(colors.TEXT)
           .font('Helvetica-Bold')
           .text(voucher.voucher_code, barcodeX, barcodeY + 60, {
             width: barcodeWidth,
             align: 'center'
           });

        // "Scan barcode at gate" text
        doc.fontSize(10)
           .fillColor(colors.TEXT_LIGHT)
           .font('Helvetica')
           .text('Scan barcode at gate', barcodeX, barcodeY + 80, {
             width: barcodeWidth,
             align: 'center'
           });
      } catch (err) {
        console.error('Failed to generate barcode:', err);
      }

      yPos = boxY + boxHeight + 40;

      // Information grid (2 columns x 2 rows)
      const leftColX = this.margin;
      const rightColX = this.pageWidth / 2;
      const colWidth = this.contentWidth / 2 - 20;

      // Row 1: Passport Number | Amount Paid
      doc.fontSize(14)
         .fillColor(colors.TEXT_LIGHT)
         .font('Helvetica')
         .text('Passport Number', leftColX, yPos);

      doc.text('Amount Paid', rightColX, yPos);

      yPos += 25;

      // Values
      const passportNumber = voucher.passport_number || 'N/A';
      const amountPaid = voucher.amount ? `K ${parseFloat(voucher.amount).toFixed(2)}` : 'K 0.00';

      doc.fontSize(20)
         .fillColor(colors.TEXT)
         .font('Helvetica-Bold')
         .text(passportNumber, leftColX, yPos);

      doc.text(amountPaid, rightColX, yPos);

      yPos += 40;

      // Registration section for unregistered vouchers (no passport)
      if (!hasPassport) {
        // Add QR code and registration instructions
        const QRCode = require('qrcode');

        try {
          // Generate QR code for registration URL
          const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(qrBase64, 'base64');

          // Center the QR code
          const qrSize = 120;
          const qrX = (this.pageWidth - qrSize) / 2;

          // "Register Your Passport" heading
          doc.fontSize(16)
             .fillColor(colors.PRIMARY)
             .font('Helvetica-Bold')
             .text('Register Your Passport', this.margin, yPos, {
               width: this.contentWidth,
               align: 'center'
             });

          yPos += 30;

          doc.image(qrBuffer, qrX, yPos, { width: qrSize });
          yPos += qrSize + 15;

          // Instructions text
          doc.fontSize(10)
             .fillColor(colors.TEXT_LIGHT)
             .font('Helvetica')
             .text('Scan this QR code or visit:', this.margin, yPos, {
               width: this.contentWidth,
               align: 'center'
             });

          yPos += 18;

          // Registration URL
          doc.fontSize(9)
             .fillColor(colors.PRIMARY)
             .font('Helvetica')
             .text(registrationUrl, this.margin, yPos, {
               width: this.contentWidth,
               align: 'center',
               link: registrationUrl,
               underline: true
             });

          yPos += 25;
        } catch (err) {
          console.error('Error generating QR code:', err);
          yPos += 15;
        }
      }

      // Footer with Issue Date and Valid Until
      const issueDate = voucher.created_at || new Date().toISOString();
      const validUntil = voucher.valid_until || voucher.expiry_date;

      const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      };

      const footerY = this.pageHeight - this.margin - 60;

      doc.fontSize(10)
         .fillColor(colors.TEXT_LIGHT)
         .font('Helvetica')
         .text(`Issue Date: ${formatDate(issueDate)}`, this.margin, footerY, {
           width: this.contentWidth,
           align: 'center'
         });

      doc.text(`Valid Until: ${formatDate(validUntil)}`, this.margin, footerY + 15, {
        width: this.contentWidth,
        align: 'center'
      });
    });
  }
}

module.exports = VoucherTemplate;
