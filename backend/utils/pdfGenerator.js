const PDFDocument = require('pdfkit');

async function generateInvoicePDF(invoice, customer, supplier) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Company header
      doc.fontSize(20).text(supplier.name || 'PNG Green Fees System', 50, 50);
      doc.fontSize(10)
         .text(supplier.address_line1 || '', 50, 75)
         .text((supplier.city || '') + ' ' + (supplier.province || ''), 50, 90)
         .text(supplier.country || 'Papua New Guinea', 50, 105);

      if (supplier.tin) doc.text('TIN: ' + supplier.tin, 50, 120);
      if (supplier.phone) doc.text('Phone: ' + supplier.phone, 50, 135);
      if (supplier.email) doc.text('Email: ' + supplier.email, 50, 150);

      // Invoice title
      doc.fontSize(24).text('TAX INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(12)
         .text('Invoice #: ' + invoice.invoice_number, 400, 80, { align: 'right' })
         .text('Date: ' + new Date(invoice.invoice_date).toLocaleDateString(), 400, 95, { align: 'right' })
         .text('Due Date: ' + new Date(invoice.due_date).toLocaleDateString(), 400, 110, { align: 'right' });

      // Customer info
      doc.fontSize(12).text('Bill To:', 50, 180);
      doc.fontSize(10)
         .text(customer.name || invoice.customer_name, 50, 200)
         .text(customer.address_line1 || invoice.customer_address || '', 50, 215);

      if (customer.tin || invoice.customer_tin) {
        doc.text('TIN: ' + (customer.tin || invoice.customer_tin), 50, 230);
      }
      if (customer.email || invoice.customer_email) {
        doc.text('Email: ' + (customer.email || invoice.customer_email), 50, 245);
      }

      // Table
      const tableTop = 290;
      doc.fontSize(10);
      doc.text('Description', 50, tableTop, { width: 250 });
      doc.text('Qty', 310, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price', 370, tableTop, { width: 70, align: 'right' });
      doc.text('Amount', 450, tableTop, { width: 90, align: 'right' });
      doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

      let items = [];
      try {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || [];
      } catch (e) {
        items = [];
      }

      let yPos = tableTop + 25;
      items.forEach((item) => {
        const desc = item.description || 'Item';
        const qty = item.quantity || 1;
        const price = parseFloat(item.unitPrice || item.unit_price || 0);
        const amt = qty * price;

        doc.text(desc, 50, yPos, { width: 250 });
        doc.text(qty.toString(), 310, yPos, { width: 50, align: 'right' });
        doc.text('K ' + price.toFixed(2), 370, yPos, { width: 70, align: 'right' });
        doc.text('K ' + amt.toFixed(2), 450, yPos, { width: 90, align: 'right' });
        yPos += 20;
      });

      // Totals
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(540, yPos).stroke();
      yPos += 15;

      const subtotal = parseFloat(invoice.subtotal || 0);
      const gstRate = parseFloat(invoice.gst_rate || 10);
      const gstAmount = parseFloat(invoice.gst_amount || 0);
      const totalAmount = parseFloat(invoice.total_amount || 0);

      doc.text('Subtotal:', 370, yPos, { width: 70, align: 'right' });
      doc.text('K ' + subtotal.toFixed(2), 450, yPos, { width: 90, align: 'right' });
      yPos += 20;

      doc.text('GST (' + gstRate + '%):', 370, yPos, { width: 70, align: 'right' });
      doc.text('K ' + gstAmount.toFixed(2), 450, yPos, { width: 90, align: 'right' });
      yPos += 20;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total:', 370, yPos, { width: 70, align: 'right' });
      doc.text('K ' + totalAmount.toFixed(2), 450, yPos, { width: 90, align: 'right' });
      doc.font('Helvetica').fontSize(10);

      // Payment status
      yPos += 30;
      const amountPaid = parseFloat(invoice.amount_paid || 0);
      const amountDue = parseFloat(invoice.amount_due || totalAmount);

      if (amountPaid > 0) {
        doc.text('Amount Paid:', 370, yPos, { width: 70, align: 'right' });
        doc.text('K ' + amountPaid.toFixed(2), 450, yPos, { width: 90, align: 'right' });
        yPos += 20;
      }

      if (amountDue > 0) {
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Amount Due:', 370, yPos, { width: 70, align: 'right' });
        doc.text('K ' + amountDue.toFixed(2), 450, yPos, { width: 90, align: 'right' });
        doc.font('Helvetica').fontSize(10);
      }

      // Notes
      yPos += 40;
      if (invoice.payment_terms) {
        doc.text('Payment Terms:', 50, yPos);
        doc.text(invoice.payment_terms, 50, yPos + 15, { width: 490 });
        yPos += 40;
      }

      if (invoice.notes) {
        doc.text('Notes:', 50, yPos);
        doc.text(invoice.notes, 50, yPos + 15, { width: 490 });
      }

      // Footer
      doc.fontSize(8).text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Voucher PDF with QR Code
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

      // Logo placeholders (circles at top)
      const logoY = 80;
      const logoRadius = 50;
      const logoSpacing = 120;
      const leftLogoX = (pageWidth / 2) - logoSpacing;
      const rightLogoX = (pageWidth / 2) + logoSpacing;

      // Left logo placeholder
      doc.circle(leftLogoX, logoY, logoRadius)
         .lineWidth(1)
         .dash(5, { space: 3 })
         .stroke('#cccccc');

      doc.fontSize(8)
         .fillColor('#999999')
         .font('Helvetica')
         .text('PNG Govt Logo', leftLogoX - 30, logoY - 5, { width: 60, align: 'center' });

      // Right logo placeholder
      doc.circle(rightLogoX, logoY, logoRadius)
         .lineWidth(1)
         .dash(5, { space: 3 })
         .stroke('#cccccc');

      doc.fontSize(8)
         .fillColor('#999999')
         .font('Helvetica')
         .text('National Emblem', rightLogoX - 30, logoY - 5, { width: 60, align: 'center' });

      // Reset dash
      doc.undash();

      // GREEN CARD title
      let yPos = 200;
      doc.fontSize(44)
         .fillColor('#4CAF50')
         .font('Helvetica-Bold')
         .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });

      // Green line under title
      yPos += 60;
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .lineWidth(3)
         .stroke('#4CAF50');

      // Subtitle: Foreign Passport Holder
      yPos += 30;
      doc.fontSize(22)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Foreign Passport Holder', margin, yPos, { width: contentWidth, align: 'center' });

      // Coupon Number (label on left, value on right)
      yPos += 60;
      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Coupon Number:', margin + 20, yPos, { continued: false });

      // Get the voucher code
      const voucherCode = voucher.voucher_code || voucher.code || 'UNKNOWN';

      doc.fontSize(22)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(voucherCode, 0, yPos, { width: pageWidth - margin - 20, align: 'right' });

      // Barcode (if provided as data URL)
      yPos += 60;
      if (voucher.barcode) {
        try {
          // Extract base64 data from data URL
          const base64Data = voucher.barcode.replace(/^data:image\/png;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Center the barcode
          const barcodeWidth = 350;
          const barcodeX = (pageWidth - barcodeWidth) / 2;
          doc.image(imageBuffer, barcodeX, yPos, { width: barcodeWidth, height: 90 });

          yPos += 110;
        } catch (err) {
          console.error('Error adding barcode to PDF:', err);
          yPos += 20;
        }
      } else {
        yPos += 20;
      }

      // "Scan to Register" instruction
      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Scan to Register', margin, yPos, { width: contentWidth, align: 'center' });

      // Registration URL
      yPos += 30;
      const registrationUrl = `https://pnggreenfees.gov.pg/voucher/register/${voucherCode}`;
      doc.fontSize(12)
         .fillColor('#666666')
         .font('Helvetica')
         .text(registrationUrl, margin, yPos, { width: contentWidth, align: 'center' });

      // Footer separator line
      yPos = pageHeight - 130;
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .lineWidth(1)
         .stroke('#cccccc');

      // Footer content
      yPos += 20;

      // Left side: Authorizing Officer
      const authorizingOfficer = voucher.created_by_name || 'AUTHORIZED OFFICER';
      doc.fontSize(14)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(authorizingOfficer.toUpperCase(), margin, yPos);

      doc.fontSize(11)
         .fillColor('#666666')
         .font('Helvetica')
         .text('Authorizing Officer', margin, yPos + 18);

      // Right side: Generation timestamp
      const generationDate = new Date(voucher.created_at || new Date());
      const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      const dateString = generationDate.toLocaleString('en-US', dateOptions);

      doc.fontSize(10)
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

module.exports = { generateInvoicePDF, generateVoucherPDF };
