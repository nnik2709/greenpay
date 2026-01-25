const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs');
const { getRegistrationUrl } = require('../config/urls');

// Generate a single PDF that contains all vouchers in the array.
// This is used for bulk email/download of corporate vouchers.
const generateVoucherPDFBuffer = async (vouchers, companyName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);

      for (let i = 0; i < vouchers.length; i++) {
        const voucher = vouchers[i];
        if (i > 0) doc.addPage();

        let yPos = margin;

        // Two logos centered at top
        const logoY = margin;
        const logoSize = 90;
        const logoX = (pageWidth - logoSize) / 2; // Center the logo

        // CCDA Logo (centered)
        try {
          const ccdaLogoPath = path.join(__dirname, '../assets/logos/ccda-logo.png');
          if (fs.existsSync(ccdaLogoPath)) {
            doc.image(ccdaLogoPath, logoX, logoY, { width: logoSize });
          }
        } catch (err) {
          console.error('❌ Error loading CCDA logo:', err.message);
        }

        yPos = logoY + logoSize + 30; // Position content below logo

        // GREEN CARD title
        doc.fontSize(48)
           .fillColor('#4CAF50')
           .font('Helvetica')
           .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 65;

        // Green line under title
        doc.moveTo(margin, yPos)
           .lineTo(pageWidth - margin, yPos)
           .lineWidth(3)
           .stroke('#4CAF50');

        yPos += 25;

        // Subtitle: Foreign Passport Holder
        doc.fontSize(20)
           .fillColor('#000000')
           .font('Helvetica')
           .text('Foreign Passport Holder', margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 60;

        // Get the voucher code
        const voucherCode = voucher.voucher_code || voucher.code || 'UNKNOWN';

        // Coupon Number (label on left, value on right)
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica')
           .text('Coupon Number:', margin + 20, yPos);

        doc.fontSize(20)
           .fillColor('#000000')
           .font('Helvetica')
           .text(voucherCode, 0, yPos, { width: pageWidth - margin - 20, align: 'right' });

        yPos += 60;

        // Generate CODE128 barcode for voucher code
        try {
          const barcodePng = await bwipjs.toBuffer({
            bcid: 'code128',
            text: voucherCode,
            scale: 3,
            height: 15,
            includetext: false,
            textxalign: 'center',
            paddingwidth: 10,
            paddingheight: 5
          });

          // Center the barcode
          const barcodeWidth = 350;
          const barcodeHeight = 80;
          const barcodeX = (pageWidth - barcodeWidth) / 2;

          doc.image(barcodePng, barcodeX, yPos, { width: barcodeWidth, height: barcodeHeight, align: 'center' });
          yPos += barcodeHeight + 20;
        } catch (err) {
          console.error('Error adding barcode to PDF:', err);
          yPos += 20;
        }

        // Conditional section: Show passport number OR registration QR code + link
        const passportNumber = voucher.passport_number;
        const hasPassport = passportNumber &&
                           passportNumber !== null &&
                           passportNumber !== 'PENDING' &&
                           passportNumber !== 'pending' &&
                           passportNumber !== '' &&
                           String(passportNumber).trim() !== '';

        if (hasPassport) {
          // REGISTERED PASSPORT SECTION
          yPos += 20;

          // Box with passport info
          const boxY = yPos;
          const boxHeight = 80;

          // Draw green border box
          doc.rect(margin + 20, boxY, contentWidth - 40, boxHeight)
             .lineWidth(2)
             .strokeColor('#4CAF50')
             .stroke();

          // Passport label
          yPos = boxY + 15;
          doc.fontSize(12)
             .fillColor('#4CAF50')
             .font('Helvetica')
             .text('REGISTERED PASSPORT', margin, yPos, { width: contentWidth, align: 'center' });

          // Passport number
          yPos += 25;
          doc.fontSize(20)
             .fillColor('#000000')
             .font('Helvetica')
             .text(passportNumber, margin, yPos, { width: contentWidth, align: 'center' });

          yPos = boxY + boxHeight + 30;
        } else {
          // UNREGISTERED - SHOW QR CODE + REGISTRATION LINK
          yPos += 15;

          // "Scan to Register" heading (smaller)
          doc.fontSize(14)
             .fillColor('#4CAF50')
             .font('Helvetica-Bold')
             .text('Scan to Register Your Passport', margin, yPos, { width: contentWidth, align: 'center' });

          yPos += 25;

          // Generate QR code for registration URL
          const registrationUrl = getRegistrationUrl(voucherCode);

          try {
            const QRCode = require('qrcode');
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

            // Center the QR code (smaller size)
            const qrSize = 120;
            const qrX = (pageWidth - qrSize) / 2;

            doc.image(qrBuffer, qrX, yPos, { width: qrSize, height: qrSize });
            yPos += qrSize + 10;
          } catch (err) {
            console.error('Error generating QR code:', err);
            yPos += 10;
          }

          // Compact registration instructions (no extra box, just text)
          doc.fontSize(9)
             .fillColor('#666666')
             .font('Helvetica')
             .text('Scan QR code OR visit: ', margin, yPos, { width: contentWidth, align: 'center', continued: true })
             .fillColor('#2196F3')
             .text(registrationUrl, { link: registrationUrl, underline: true });

          yPos += 20;

          // Compact 3 options (single line each, no box)
          doc.fontSize(8)
             .fillColor('#666666')
             .font('Helvetica')
             .text('Mobile: Scan QR  •  Desktop: Visit URL  •  Airport: Show voucher + passport', margin + 10, yPos, {
               width: contentWidth - 20,
               align: 'center'
             });

          yPos += 15;
        }

        // Footer with company name (if corporate), authorizing officer, and generation date
        yPos = pageHeight - margin - 60;

        // Horizontal line
        doc.moveTo(margin, yPos)
           .lineTo(pageWidth - margin, yPos)
           .lineWidth(1)
           .stroke('#CCCCCC');

        yPos += 15;

        // Footer text
        if (companyName) {
          doc.fontSize(9)
             .fillColor('#666666')
             .font('Helvetica')
             .text(`Company: ${companyName}`, margin, yPos);
        }

        doc.fontSize(9)
           .fillColor('#666666')
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleString()}`, 0, yPos, { width: pageWidth - margin, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

async function generateInvoicePDF(invoice, customer, supplier) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const margin = 50;
      let yPos = margin;

      // Header - Company Info (Left side)
      doc.fontSize(11)
         .fillColor('#2c5530')
         .font('Helvetica')
         .text('Climate Change and Development Authority', margin, yPos);
      yPos += 14;

      doc.fontSize(9)
         .fillColor('#666666')
         .text('P.O. Box 4017 BOROKO National Capital District', margin, yPos);
      yPos += 12;
      doc.text('Port Moresby, Papua New Guinea', margin, yPos);
      yPos += 12;
      doc.text('Email: png.greenfees@ccda.gov.pg', margin, yPos);
      yPos += 12;
      doc.text('Phone: +675 7700 7513 / +675 7700 7836', margin, yPos);

      // Invoice Title (Right side)
      doc.fontSize(24)
         .fillColor('#2c5530')
         .text('INVOICE', 400, margin, { width: 145, align: 'right' });

      // Invoice Details (Right side)
      const invoiceDetailsY = margin + 35;
      doc.fontSize(9)
         .fillColor('#000000')
         .text('Invoice #: ' + (invoice.invoice_number || 'N/A'), 400, invoiceDetailsY, { width: 145, align: 'right' });

      doc.fillColor('#000000')
         .text('Date: ' + new Date(invoice.invoice_date || Date.now()).toLocaleDateString('en-GB'), 400, invoiceDetailsY + 14, { width: 145, align: 'right' });

      doc.fillColor('#000000')
         .text('Due Date: ' + new Date(invoice.due_date || Date.now()).toLocaleDateString('en-GB'), 400, invoiceDetailsY + 28, { width: 145, align: 'right' });

      if (invoice.po_reference) {
        doc.fillColor('#000000')
           .text('PO Reference: ' + invoice.po_reference, 400, invoiceDetailsY + 42, { width: 145, align: 'right' });
      }

      yPos = 140;

      // Bill To and Payment Details (Two columns)
      const leftColX = margin;
      const rightColX = 305;

      // Bill To Section
      doc.fontSize(11)
         .fillColor('#2c5530')
         .text('Bill To', leftColX, yPos);
      yPos += 18;

      doc.fontSize(9)
         .fillColor('#000000')
         .text(customer.name || invoice.customer_name || 'N/A', leftColX, yPos);
      yPos += 12;

      if (customer.email || invoice.customer_email) {
        doc.fillColor('#666666')
           .text(customer.email || invoice.customer_email, leftColX, yPos);
        yPos += 12;
      }

      if (customer.address_line1 || invoice.customer_address) {
        doc.text(customer.address_line1 || invoice.customer_address, leftColX, yPos);
      }

      // Payment Details Section (Right column)
      const paymentY = 140;
      doc.fontSize(11)
         .fillColor('#2c5530')
         .text('Payment Details', rightColX, paymentY);

      doc.fontSize(9)
         .fillColor('#000000')
         .text('Payment Mode: ' + (invoice.payment_mode || 'N/A'), rightColX, paymentY + 18);

      const amountPaid = parseFloat(invoice.amount_paid || 0);
      doc.fillColor('#000000')
         .text('Amount Paid: PGK ' + amountPaid.toFixed(2), rightColX, paymentY + 32);

      yPos = 220;

      // Table Header with dark green background
      doc.rect(margin, yPos, pageWidth - (margin * 2), 20)
         .fillAndStroke('#2c5530', '#2c5530');

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .text('S.No', margin + 5, yPos + 6, { width: 30 })
         .text('Description', margin + 40, yPos + 6, { width: 250 })
         .text('Quantity', 350, yPos + 6, { width: 60, align: 'center' })
         .text('Unit Price', 420, yPos + 6, { width: 60, align: 'right' })
         .text('Total', 490, yPos + 6, { width: 50, align: 'right' });

      yPos += 20;

      // Table Rows
      let items = [];
      try {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || [];
      } catch (e) {
        items = [];
      }

      let rowNum = 1;
      items.forEach((item) => {
        const desc = item.description || 'Green Fee Vouchers';
        const qty = item.quantity || 1;
        const price = parseFloat(item.unitPrice || item.unit_price || 50);
        const total = qty * price;

        // Light gray background for rows
        if (rowNum % 2 === 0) {
          doc.rect(margin, yPos, pageWidth - (margin * 2), 35)
             .fill('#f9f9f9');
        }

        doc.fontSize(9)
           .fillColor('#000000')
           .text(rowNum.toString(), margin + 5, yPos + 5, { width: 30 })
           .text(desc, margin + 40, yPos + 5, { width: 250 });

        // Add voucher details if available
        if (item.voucher_value) {
          doc.fontSize(7)
             .fillColor('#666666')
             .text('Voucher Value: PGK ' + parseFloat(item.voucher_value).toFixed(2) + ' each', margin + 40, yPos + 16);
        }
        if (item.validity_start && item.validity_end) {
          const startDate = new Date(item.validity_start).toLocaleDateString('en-GB');
          const endDate = new Date(item.validity_end).toLocaleDateString('en-GB');
          doc.text('Validity: ' + startDate + ' - ' + endDate, margin + 40, yPos + 24);
        }

        doc.fontSize(9)
           .fillColor('#000000')
           .text(qty.toString(), 350, yPos + 5, { width: 60, align: 'center' })
           .text('PGK ' + price.toFixed(2), 420, yPos + 5, { width: 60, align: 'right' })
           .text('PGK ' + total.toFixed(2), 490, yPos + 5, { width: 50, align: 'right' });

        yPos += 35;
        rowNum++;
      });

      yPos += 10;

      // Total Amount
      doc.fontSize(10)
         .fillColor('#000000')
         .text('Total Amount:', 420, yPos, { width: 60, align: 'right' })
         .text('PGK ' + parseFloat(invoice.total_amount || 0).toFixed(2), 490, yPos, { width: 50, align: 'right' });

      yPos += 30;

      // Payment Information and Terms & Conditions (Two columns)
      const bottomSectionY = yPos;

      // Payment Information (Left)
      doc.fontSize(11)
         .fillColor('#2c5530')
         .text('Payment Information', leftColX, bottomSectionY);

      doc.fontSize(9)
         .fillColor('#000000')
         .text('Bank: Bank South Pacific (BSP)', leftColX, bottomSectionY + 18);

      doc.fillColor('#000000')
         .text('Account Name: CCDA/DoF Revenue Account', leftColX, bottomSectionY + 32);

      doc.fillColor('#000000')
         .text('Account Number: 7012975186', leftColX, bottomSectionY + 46);

      doc.fillColor('#000000')
         .text('Swift Code: BOSPPGPM', leftColX, bottomSectionY + 60);

      doc.fillColor('#000000')
         .text('BSB: 088-294', leftColX, bottomSectionY + 74);

      // Terms & Conditions (Right)
      doc.fontSize(11)
         .fillColor('#2c5530')
         .text('Terms & Conditions', rightColX, bottomSectionY);

      doc.fontSize(8)
         .fillColor('#666666')
         .text('• Payment is due within 7 days of the invoice date.', rightColX, bottomSectionY + 18, { width: 240 })
         .text('• Quotation sent will be valid from ' + new Date(invoice.invoice_date || Date.now()).toLocaleDateString('en-GB') + ' to ' + new Date(new Date(invoice.invoice_date || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB') + '.', rightColX, bottomSectionY + 32, { width: 240 })
         .text('• No refunds will be provided after voucher generation.', rightColX, bottomSectionY + 58, { width: 240 })
         .text('• For enquiries, contact enquiries.greenfees@ccda.gov.pg', rightColX, bottomSectionY + 72, { width: 240 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Voucher PDF with QR Code - GREEN CARD Template
 * Matches the agreed template with CCDA and PNG logos
 * @param {Object} voucher - Voucher data with QR code
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateVoucherPDF(voucher) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);

      let yPos = margin;

      // Two logos centered at top
      const logoY = margin;
      const logoSize = 90;
      const logoX = (pageWidth - logoSize) / 2; // Center the logo

      // CCDA Logo (centered)
      try {
        const ccdaLogoPath = path.join(__dirname, '../assets/logos/ccda-logo.png');
        if (fs.existsSync(ccdaLogoPath)) {
          doc.image(ccdaLogoPath, logoX, logoY, { width: logoSize });
        }
      } catch (err) {
        console.error('❌ Error loading CCDA logo:', err.message);
      }

      yPos = logoY + logoSize + 30; // Position content below logo

      // GREEN CARD title
      doc.fontSize(48)
         .fillColor('#4CAF50')
         .font('Helvetica')
         .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });

      yPos += 65;

      // Green line under title
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .lineWidth(3)
         .stroke('#4CAF50');

      yPos += 25;

      // Subtitle: Foreign Passport Holder
      doc.fontSize(20)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Foreign Passport Holder', margin, yPos, { width: contentWidth, align: 'center' });

      yPos += 60;

      // Get the voucher code
      const voucherCode = voucher.voucher_code || voucher.code || 'UNKNOWN';

      // Coupon Number (label on left, value on right)
      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Coupon Number:', margin + 20, yPos);

      doc.fontSize(20)
         .fillColor('#000000')
         .font('Helvetica')
         .text(voucherCode, 0, yPos, { width: pageWidth - margin - 20, align: 'right' });

      yPos += 60;

      // Barcode in center
      if (voucher.barcode || voucher.qrCode) {
        try {
          const barcodeData = voucher.barcode || voucher.qrCode;
          const base64Data = barcodeData.replace(/^data:image\/png;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Center the barcode
          const barcodeWidth = 400;
          const barcodeHeight = 100;
          const barcodeX = (pageWidth - barcodeWidth) / 2;

          doc.image(imageBuffer, barcodeX, yPos, { width: barcodeWidth, height: barcodeHeight });
          yPos += barcodeHeight + 20;
        } catch (err) {
          console.error('Error adding barcode to PDF:', err);
          yPos += 20;
        }
      }

      // Conditional section: Show passport number OR registration link
      const passportNumber = voucher.passport_number;
      const hasPassport = passportNumber &&
                         passportNumber !== null &&
                         passportNumber !== 'PENDING' &&
                         passportNumber !== 'pending' &&
                         passportNumber !== '' &&
                         String(passportNumber).trim() !== '';

      if (hasPassport) {
        // Show passport number when attached
        yPos += 20;
        doc.fontSize(14)
           .fillColor('#000000')
           .font('Helvetica')
           .text('Passport Number:', margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 25;
        doc.fontSize(18)
           .fillColor('#000000')
           .font('Helvetica')
           .text(passportNumber, margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 40;
      } else {
        // Show "Scan to Register" with link when no passport
        yPos += 20;
        doc.fontSize(16)
           .fillColor('#000000')
           .font('Helvetica')
           .text('Scan to Register', margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 30;

        // Registration URL
        const registrationUrl = getRegistrationUrl(voucherCode);
        doc.fontSize(10)
           .fillColor('#666666')
           .font('Helvetica')
           .text(registrationUrl, margin, yPos, { width: contentWidth, align: 'center' });

        yPos += 40;
      }

      // Footer separator line
      yPos = pageHeight - 130;
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .lineWidth(1)
         .stroke('#cccccc');

      yPos += 20;

      // Footer content
      // Left side: Authorizing Officer (if available)
      const authorizingOfficer = voucher.created_by_name;
      const showOfficer = authorizingOfficer && authorizingOfficer !== 'AUTHORIZED OFFICER';

      if (showOfficer) {
        doc.fontSize(12)
           .fillColor('#000000')
           .font('Helvetica')
           .text(authorizingOfficer.toUpperCase(), margin, yPos);

        doc.fontSize(10)
           .fillColor('#666666')
           .font('Helvetica')
           .text('Authorizing Officer', margin, yPos + 18);
      }

      // Right side: Generation timestamp
      const generationDate = new Date(voucher.created_at || voucher.issued_date || new Date());
      const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      const dateString = generationDate.toLocaleString('en-US', dateOptions);

      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text(`Generated on ${dateString}`, 0, yPos + 10, {
           width: pageWidth - margin,
           align: 'right'
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Quotation PDF - Matches official template with logos
 * @param {Object} quotation - Quotation data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateQuotationPDF(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const margin = 50;
      let yPos = margin;

      // Header with logos placeholder and title
      doc.fontSize(11)
         .fillColor('#2c5530')
         .font('Helvetica')
         .text('CLIMATE CHANGE and DEVELOPMENT AUTHORITY', margin, yPos, { align: 'center', width: pageWidth - (margin * 2) });

      yPos += 25;

      // Green line under header
      doc.strokeColor('#66b958')
         .lineWidth(2)
         .moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .stroke();

      yPos += 5;

      // QUOTATION title and details (right aligned)
      doc.fontSize(18)
         .fillColor('#2c5530')
         .text('QUOTATION', 320, yPos, { width: 225, align: 'right' });

      doc.fontSize(9)
         .fillColor('#000000')
         .text('Quotation #: ' + (quotation.quotation_number || 'N/A'), 320, yPos + 25, { width: 225, align: 'right' });

      doc.fillColor('#000000')
         .text('Subject: Green Fee Voucher', 320, yPos + 39, { width: 225, align: 'right' });

      doc.fillColor('#000000')
         .text('Date: ' + new Date(quotation.created_at || Date.now()).toLocaleDateString('en-GB'), 320, yPos + 53, { width: 225, align: 'right' });

      yPos = 140;

      // Two columns: QUOTATION FROM and QUOTATION TO
      const leftColX = margin;
      const rightColX = 305;
      const boxWidth = 240;
      const boxHeight = 90;

      // QUOTATION FROM (Left box with green border)
      doc.rect(leftColX, yPos, boxWidth, boxHeight)
         .lineWidth(1)
         .strokeColor('#66b958')
         .stroke();

      doc.fontSize(10)
         .fillColor('#66b958')
         .text('QUOTATION FROM:', leftColX + 10, yPos + 10);

      doc.fontSize(9)
         .fillColor('#000000')
         .text('Climate Change and Development Authority', leftColX + 10, yPos + 28);

      doc.fontSize(8)
         .fillColor('#666666')
         .text('Email: png.greenfees@ccda.gov.pg', leftColX + 10, yPos + 42)
         .text('Phone: +675 7700 7513 / +675 7700 7836', leftColX + 10, yPos + 54);

      if (quotation.created_by_name) {
        doc.fillColor('#000000')
           .text('Contact: ' + quotation.created_by_name, leftColX + 10, yPos + 68);
      }

      // QUOTATION TO (Right box with green border)
      doc.rect(rightColX, yPos, boxWidth, boxHeight)
         .lineWidth(1)
         .strokeColor('#66b958')
         .stroke();

      doc.fontSize(10)
         .fillColor('#66b958')
         .text('QUOTATION TO:', rightColX + 10, yPos + 10);

      doc.fontSize(9)
         .fillColor('#000000')
         .text(quotation.customer_name || quotation.company_name || 'N/A', rightColX + 10, yPos + 28);

      doc.fontSize(8)
         .fillColor('#666666')
         .text(quotation.customer_email || quotation.contact_email || 'N/A', rightColX + 10, yPos + 42);

      doc.fillColor('#000000')
         .text('Quotation Date: ' + new Date(quotation.created_at || Date.now()).toLocaleDateString('en-GB'), rightColX + 10, yPos + 56);

      doc.text('Valid Until: ' + (quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB') : 'N/A'), rightColX + 10, yPos + 68);

      yPos += boxHeight + 20;

      // Table Header with green background
      doc.rect(margin, yPos, pageWidth - (margin * 2), 20)
         .fillAndStroke('#66b958', '#66b958');

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .text('SERVICE DESCRIPTION', margin + 10, yPos + 6, { width: 220 })
         .text('UNIT PRICE', 320, yPos + 6, { width: 70, align: 'center' })
         .text('QUANTITY', 400, yPos + 6, { width: 60, align: 'center' })
         .text('TOTAL', 490, yPos + 6, { width: 50, align: 'right' });

      yPos += 20;

      // Table Row
      const unitPrice = parseFloat(quotation.unit_price || quotation.amount_per_passport || quotation.price_per_passport || 50);
      const quantity = quotation.number_of_vouchers || quotation.number_of_passports || 1;
      const lineTotal = unitPrice * quantity;

      doc.fontSize(9)
         .fillColor('#000000')
         .text('Green Fee Vouchers', margin + 10, yPos + 8, { width: 220 })
         .text('PGK ' + unitPrice.toFixed(2), 320, yPos + 8, { width: 70, align: 'center' })
         .text(quantity.toString(), 400, yPos + 8, { width: 60, align: 'center' })
         .text('PGK ' + lineTotal.toFixed(2), 490, yPos + 8, { width: 50, align: 'right' });

      yPos += 30;

      // Subtotal row with bottom border
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .strokeColor('#66b958')
         .lineWidth(1)
         .stroke();

      yPos += 10;

      const subtotal = parseFloat(quotation.subtotal || lineTotal);
      doc.fontSize(10)
         .fillColor('#000000')
         .text('SUB TOTAL', 400, yPos, { width: 80, align: 'left' })
         .text('PGK ' + subtotal.toFixed(2), 490, yPos, { width: 50, align: 'right' });

      yPos += 20;

      // GST line (only if GST is applied)
      const gstRate = parseFloat(quotation.gst_rate || 0);
      const gstAmount = parseFloat(quotation.gst_amount || 0);

      if (gstAmount > 0) {
        doc.fontSize(10)
           .fillColor('#000000')
           .text(`GST (${gstRate.toFixed(0)}%)`, 400, yPos, { width: 80, align: 'left' })
           .text('PGK ' + gstAmount.toFixed(2), 490, yPos, { width: 50, align: 'right' });

        yPos += 20;

        // GRAND TOTAL (with GST)
        const grandTotal = subtotal + gstAmount;
        doc.fontSize(11)
           .fillColor('#2c5530')
           .font('Helvetica-Bold')
           .text('GRAND TOTAL', 400, yPos, { width: 80, align: 'left' })
           .text('PGK ' + grandTotal.toFixed(2), 490, yPos, { width: 50, align: 'right' })
           .font('Helvetica');

        yPos += 30;
      } else {
        // No GST - just add spacing
        yPos += 10;
      }

      // Payment Information and Terms & Conditions (Two columns)
      const bottomSectionY = yPos;

      // Payment Information (Left box)
      doc.rect(leftColX, bottomSectionY, boxWidth, 90)
         .lineWidth(1)
         .strokeColor('#66b958')
         .stroke();

      doc.fontSize(10)
         .fillColor('#66b958')
         .text('PAYMENT INFORMATION:', leftColX + 10, bottomSectionY + 10);

      doc.fontSize(8)
         .fillColor('#000000')
         .text('Bank: Bank South Pacific (BSP)', leftColX + 10, bottomSectionY + 28);

      doc.fillColor('#000000')
         .text('Account Name: CCDA/DoF Revenue Account', leftColX + 10, bottomSectionY + 40);

      doc.fillColor('#000000')
         .text('Account Number: 7012975186', leftColX + 10, bottomSectionY + 52);

      doc.fillColor('#000000')
         .text('Swift Code: BOSPPGPM', leftColX + 10, bottomSectionY + 64);

      doc.fillColor('#000000')
         .text('BSB: 088-294', leftColX + 10, bottomSectionY + 76);

      // Terms & Conditions (Right box)
      doc.rect(rightColX, bottomSectionY, boxWidth, 90)
         .lineWidth(1)
         .strokeColor('#66b958')
         .stroke();

      doc.fontSize(10)
         .fillColor('#66b958')
         .text('TERMS & CONDITIONS:', rightColX + 10, bottomSectionY + 10);

      doc.fontSize(8)
         .fillColor('#666666')
         .text('• Payment is due within 7 days of the invoice date.', rightColX + 10, bottomSectionY + 28, { width: 220 })
         .text('• Quotation sent will be valid from ' + new Date(quotation.created_at || Date.now()).toLocaleDateString('en-GB') + ' to ' + (quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB') : 'N/A') + '.', rightColX + 10, bottomSectionY + 42, { width: 220 })
         .text('• No refunds will be provided after voucher generation.', rightColX + 10, bottomSectionY + 68, { width: 220 })
         .text('• For enquiries, contact enquiries.greenfees@ccda.gov.pg', rightColX + 10, bottomSectionY + 80, { width: 220 });

      yPos = bottomSectionY + 110;

      // Footer
      doc.fontSize(9)
         .fillColor('#000000')
         .text('Thank you for your business!', margin, yPos, { width: pageWidth - (margin * 2), align: 'center' });

      doc.fontSize(8)
         .fillColor('#666666')
         .text('For any queries, please contact our support team email: png.greenfees@ccda.gov.pg', margin, yPos + 15, { width: pageWidth - (margin * 2), align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a thermal receipt (80mm width) for POS printers like Epson TM-T82II
 * Optimized for thermal printing: compact layout, black/white only, minimal graphics
 */
const generateThermalReceiptPDF = async (voucher) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 80mm = 226.77 points (1mm = 2.83465 points)
      const receiptWidth = 226.77;
      const margin = 10;
      const contentWidth = receiptWidth - (margin * 2);

      const doc = new PDFDocument({
        size: [receiptWidth, 600], // Width fixed, height auto-grows
        margin: margin,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let yPos = margin;

      // Header - Compact logo (if exists)
      try {
        const ccdaLogoPath = path.join(__dirname, '../assets/logos/ccda-logo.png');
        console.log('[Thermal Receipt] Logo path:', ccdaLogoPath);
        console.log('[Thermal Receipt] Logo exists:', fs.existsSync(ccdaLogoPath));

        if (fs.existsSync(ccdaLogoPath)) {
          const logoSize = 30;
          const logoX = (receiptWidth - logoSize) / 2;
          doc.image(ccdaLogoPath, logoX, yPos, { width: logoSize });
          yPos += logoSize + 5;
          console.log('[Thermal Receipt] Logo added successfully');
        } else {
          console.error('[Thermal Receipt] Logo file not found at:', ccdaLogoPath);
        }
      } catch (err) {
        console.error('[Thermal Receipt] Error loading logo:', err.message, err.stack);
      }

      // Title
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 18;

      // Separator line
      doc.moveTo(margin, yPos)
         .lineTo(receiptWidth - margin, yPos)
         .lineWidth(1)
         .stroke('#000000');
      yPos += 8;

      // Subtitle
      doc.fontSize(9)
         .font('Helvetica')
         .text('Foreign Passport Holder', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 15;

      // Voucher Code
      const voucherCode = voucher.voucher_code || voucher.code || 'UNKNOWN';

      doc.fontSize(8)
         .font('Helvetica')
         .text('Voucher:', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(voucherCode, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 18;

      // Barcode (compact version for thermal)
      try {
        const barcodePng = await bwipjs.toBuffer({
          bcid: 'code128',
          text: voucherCode,
          scale: 2,
          height: 10,
          includetext: false,
          paddingwidth: 5,
          paddingheight: 3
        });

        // Center and fit barcode to receipt width
        const barcodeWidth = contentWidth - 10;
        const barcodeHeight = 40;
        const barcodeX = (receiptWidth - barcodeWidth) / 2;

        doc.image(barcodePng, barcodeX, yPos, { width: barcodeWidth, height: barcodeHeight });
        yPos += barcodeHeight + 10;
      } catch (err) {
        console.error('Error adding barcode to thermal receipt:', err);
        yPos += 10;
      }

      // Passport Section
      const passportNumber = voucher.passport_number;
      const hasPassport = passportNumber &&
                         passportNumber !== null &&
                         passportNumber !== 'PENDING' &&
                         passportNumber !== 'pending' &&
                         passportNumber !== '' &&
                         String(passportNumber).trim() !== '';

      if (hasPassport) {
        // Registered passport
        doc.fontSize(8)
           .font('Helvetica')
           .text('REGISTERED PASSPORT', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 12;

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(passportNumber, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 15;

        // Customer name if available
        if (voucher.customer_name) {
          doc.fontSize(8)
             .font('Helvetica')
             .text(voucher.customer_name, margin, yPos, { width: contentWidth, align: 'center' });
          yPos += 12;
        }
      } else {
        // Not registered - show registration instructions
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .text('REGISTER YOUR PASSPORT', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 12;

        doc.fontSize(7)
           .font('Helvetica')
           .text('Scan barcode or visit:', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        const registrationUrl = getRegistrationUrl(voucherCode);
        doc.fontSize(6)
           .font('Helvetica')
           .text(registrationUrl, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 15;
      }

      // Separator
      doc.moveTo(margin, yPos)
         .lineTo(receiptWidth - margin, yPos)
         .lineWidth(1)
         .stroke('#000000');
      yPos += 8;

      // Amount and validity
      doc.fontSize(8)
         .font('Helvetica')
         .text('Amount: PGK 50.00', margin, yPos, { width: contentWidth, align: 'left' });
      yPos += 10;

      if (voucher.valid_until) {
        const validDate = new Date(voucher.valid_until).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        doc.fontSize(8)
           .text(`Valid Until: ${validDate}`, margin, yPos, { width: contentWidth, align: 'left' });
        yPos += 10;
      }

      // Footer
      yPos += 5;
      doc.fontSize(6)
         .font('Helvetica')
         .text('Climate Change & Development Authority', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 8;

      doc.fontSize(6)
         .text('png.greenfees@ccda.gov.pg', margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 8;

      doc.fontSize(6)
         .text(`Printed: ${new Date().toLocaleString()}`, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 10;

      // Separator at bottom
      doc.moveTo(margin, yPos)
         .lineTo(receiptWidth - margin, yPos)
         .lineWidth(1)
         .stroke('#000000');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateVoucherPDF,
  generateQuotationPDF,
  generateVoucherPDFBuffer,
  generateThermalReceiptPDF
};
