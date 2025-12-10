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
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header with gradient background (simulated with lines)
      doc.rect(0, 0, 612, 100).fill('#059669');

      // Title
      doc.fillColor('#ffffff')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('PNG Green Fees System', 50, 30, { align: 'center' });

      doc.fontSize(14)
         .font('Helvetica')
         .text('Green Fee Voucher', 50, 65, { align: 'center' });

      // Reset color for body
      doc.fillColor('#000000');

      // Voucher Code Section
      doc.fontSize(12)
         .font('Helvetica')
         .text('Voucher Code', 50, 130);

      doc.fontSize(32)
         .font('Helvetica-Bold')
         .fillColor('#059669')
         .text(voucher.voucher_code || voucher.code, 50, 150);

      // QR Code (if provided as data URL)
      if (voucher.qrCode) {
        try {
          // Extract base64 data from data URL
          const base64Data = voucher.qrCode.replace(/^data:image\/png;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imageBuffer, 400, 130, { width: 150, height: 150 });

          doc.fontSize(9)
             .fillColor('#6b7280')
             .text('Scan at gate', 400, 285, { width: 150, align: 'center' });
        } catch (err) {
          console.error('Error adding QR code to PDF:', err);
        }
      }

      // Reset color
      doc.fillColor('#000000');

      // Details Section
      doc.fontSize(12).font('Helvetica');
      let yPos = 220;

      // Passport Number
      doc.fillColor('#6b7280')
         .fontSize(10)
         .text('Passport Number', 50, yPos);
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(voucher.passport_number || voucher.passportNumber, 50, yPos + 15);

      // Amount
      doc.fillColor('#6b7280')
         .fontSize(10)
         .font('Helvetica')
         .text('Amount Paid', 250, yPos);
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('PGK ' + (voucher.amount || '50.00'), 250, yPos + 15);

      yPos += 50;

      // Valid From
      doc.fillColor('#6b7280')
         .fontSize(10)
         .font('Helvetica')
         .text('Valid From', 50, yPos);
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(voucher.valid_from ? new Date(voucher.valid_from).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), 50, yPos + 15);

      // Valid Until
      doc.fillColor('#6b7280')
         .fontSize(10)
         .font('Helvetica')
         .text('Valid Until', 250, yPos);
      doc.fillColor('#000000')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString('en-GB') : 'N/A', 250, yPos + 15);

      yPos += 60;

      // Instructions Box
      doc.rect(50, yPos, 512, 140).fillAndStroke('#dcfce7', '#10b981');

      doc.fillColor('#065f46')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('How to Use This Voucher', 70, yPos + 20);

      doc.fillColor('#047857')
         .fontSize(11)
         .font('Helvetica')
         .text('1. Present this voucher at the entry checkpoint', 70, yPos + 50)
         .text('2. Show the voucher code or QR code for scanning', 70, yPos + 70)
         .text('3. Keep your passport with you for verification', 70, yPos + 90)
         .text('4. This voucher is valid for a single entry', 70, yPos + 110);

      yPos += 160;

      // Registered Notice
      doc.rect(50, yPos, 512, 60).fillAndStroke('#f0fdf4', '#22c55e');

      doc.fillColor('#166534')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('✓ Your passport is already registered', 70, yPos + 15);

      doc.fillColor('#15803d')
         .fontSize(10)
         .font('Helvetica')
         .text('You\'re all set! Just present this voucher when you travel.', 70, yPos + 35);

      // Footer
      doc.fillColor('#6b7280')
         .fontSize(8)
         .font('Helvetica')
         .text('PNG Green Fees System - Official Voucher', 50, 750, { align: 'center', width: 512 })
         .text('For support, contact: support@greenpay.gov.pg', 50, 765, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePDF, generateVoucherPDF };
