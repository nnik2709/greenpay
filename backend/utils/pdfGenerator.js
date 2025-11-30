const PDFDocument = require('pdfkit');

/**
 * Generate PNG GST-compliant Tax Invoice PDF
 * Follows PNG Internal Revenue Commission requirements
 */
const generateInvoicePDF = (invoice, customer, supplier) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Tax Invoice ${invoice.invoice_number}`,
          Author: supplier.name,
          Subject: 'PNG GST-Compliant Tax Invoice'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Helper functions
      const formatCurrency = (amount) => {
        return `K ${parseFloat(amount || 0).toFixed(2)}`;
      };

      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-PG', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      // Colors
      const primaryColor = '#059669'; // Emerald green
      const darkGray = '#374151';
      const lightGray = '#9CA3AF';

      let yPosition = 50;

      // Header - TAX INVOICE title
      doc.fontSize(24)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TAX INVOICE', 50, yPosition, { align: 'center' });

      yPosition += 35;

      // Supplier Information (Left side)
      doc.fontSize(10)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('FROM:', 50, yPosition);

      yPosition += 15;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(supplier.name, 50, yPosition);

      yPosition += 15;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(darkGray);

      if (supplier.address_line1) {
        doc.text(supplier.address_line1, 50, yPosition);
        yPosition += 12;
      }

      if (supplier.address_line2) {
        doc.text(supplier.address_line2, 50, yPosition);
        yPosition += 12;
      }

      const supplierLocation = [supplier.city, supplier.province, supplier.postal_code]
        .filter(Boolean).join(', ');
      if (supplierLocation) {
        doc.text(supplierLocation, 50, yPosition);
        yPosition += 12;
      }

      if (supplier.country) {
        doc.text(supplier.country, 50, yPosition);
        yPosition += 12;
      }

      yPosition += 5;

      if (supplier.tin) {
        doc.font('Helvetica-Bold').text('TIN: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(supplier.tin);
        yPosition += 12;
      }

      if (supplier.phone) {
        doc.font('Helvetica-Bold').text('Phone: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(supplier.phone);
        yPosition += 12;
      }

      if (supplier.email) {
        doc.font('Helvetica-Bold').text('Email: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(supplier.email);
      }

      // Invoice Details (Right side)
      const rightColumnX = 350;
      let rightYPosition = 85;

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(darkGray);

      // Invoice Number
      doc.text('Invoice No:', rightColumnX, rightYPosition)
         .font('Helvetica')
         .text(invoice.invoice_number, rightColumnX + 80, rightYPosition);
      rightYPosition += 15;

      // Invoice Date
      doc.font('Helvetica-Bold')
         .text('Invoice Date:', rightColumnX, rightYPosition)
         .font('Helvetica')
         .text(formatDate(invoice.invoice_date), rightColumnX + 80, rightYPosition);
      rightYPosition += 15;

      // Due Date
      doc.font('Helvetica-Bold')
         .text('Due Date:', rightColumnX, rightYPosition)
         .font('Helvetica')
         .text(formatDate(invoice.due_date), rightColumnX + 80, rightYPosition);
      rightYPosition += 15;

      // PO Reference (Laravel template enhancement)
      if (invoice.purchase_order_reference || invoice.po_reference) {
        doc.font('Helvetica-Bold')
           .text('PO Reference:', rightColumnX, rightYPosition)
           .font('Helvetica')
           .text(invoice.purchase_order_reference || invoice.po_reference, rightColumnX + 80, rightYPosition);
        rightYPosition += 15;
      }

      // Payment Terms
      if (invoice.payment_terms) {
        doc.font('Helvetica-Bold')
           .text('Payment Terms:', rightColumnX, rightYPosition)
           .font('Helvetica')
           .text(invoice.payment_terms, rightColumnX + 80, rightYPosition);
        rightYPosition += 15;
      }

      // Status Badge
      const statusColors = {
        pending: '#F59E0B',
        partial: '#3B82F6',
        paid: '#10B981',
        overdue: '#EF4444',
        cancelled: '#6B7280'
      };
      const statusColor = statusColors[invoice.status] || statusColors.pending;

      doc.roundedRect(rightColumnX, rightYPosition, 90, 22, 3)
         .fillAndStroke(statusColor, statusColor);

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text(invoice.status.toUpperCase(), rightColumnX, rightYPosition + 6, {
           width: 90,
           align: 'center'
         });

      // Customer Information
      yPosition = 220;

      doc.fontSize(10)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, yPosition);

      yPosition += 15;

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(customer.name || invoice.customer_name, 50, yPosition);

      yPosition += 15;

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(darkGray);

      if (customer.address_line1 || invoice.customer_address) {
        const address = customer.address_line1 || invoice.customer_address;
        doc.text(address, 50, yPosition);
        yPosition += 12;
      }

      if (customer.address_line2) {
        doc.text(customer.address_line2, 50, yPosition);
        yPosition += 12;
      }

      const customerLocation = [customer.city, customer.province, customer.postal_code]
        .filter(Boolean).join(', ');
      if (customerLocation) {
        doc.text(customerLocation, 50, yPosition);
        yPosition += 12;
      }

      if (customer.country && customer.country !== 'Papua New Guinea') {
        doc.text(customer.country, 50, yPosition);
        yPosition += 12;
      }

      yPosition += 5;

      const customerTIN = customer.tin || invoice.customer_tin;
      if (customerTIN) {
        doc.font('Helvetica-Bold').text('TIN: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(customerTIN);
        yPosition += 12;
      }

      const customerEmail = customer.email || invoice.customer_email;
      if (customerEmail) {
        doc.font('Helvetica-Bold').text('Email: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(customerEmail);
        yPosition += 12;
      }

      const customerPhone = customer.phone || invoice.customer_phone;
      if (customerPhone) {
        doc.font('Helvetica-Bold').text('Phone: ', 50, yPosition, { continued: true })
           .font('Helvetica').text(customerPhone);
      }

      // Line Items Table
      yPosition = 360;
      const tableTop = yPosition;
      const tableLeft = 50;
      const tableWidth = 495;

      // Table header
      doc.rect(tableLeft, tableTop, tableWidth, 25)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fontSize(9)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold');

      doc.text('Description', tableLeft + 10, tableTop + 8, { width: 240 });
      doc.text('Qty', tableLeft + 260, tableTop + 8, { width: 40, align: 'center' });
      doc.text('Unit Price', tableLeft + 310, tableTop + 8, { width: 75, align: 'right' });
      doc.text('Amount', tableLeft + 395, tableTop + 8, { width: 90, align: 'right' });

      // Table rows
      yPosition = tableTop + 25;
      const items = JSON.parse(invoice.items || '[]');

      doc.fontSize(9)
         .fillColor(darkGray)
         .font('Helvetica');

      items.forEach((item, index) => {
        const rowHeight = 30;
        const isEven = index % 2 === 0;

        if (isEven) {
          doc.rect(tableLeft, yPosition, tableWidth, rowHeight)
             .fillAndStroke('#F9FAFB', '#E5E7EB');
        } else {
          doc.rect(tableLeft, yPosition, tableWidth, rowHeight)
             .stroke('#E5E7EB');
        }

        doc.fillColor(darkGray);
        doc.text(item.description || 'Item', tableLeft + 10, yPosition + 10, {
          width: 240,
          lineBreak: false,
          ellipsis: true
        });
        doc.text(item.quantity || 0, tableLeft + 260, yPosition + 10, { width: 40, align: 'center' });
        doc.text(formatCurrency(item.unitPrice), tableLeft + 310, yPosition + 10, { width: 75, align: 'right' });

        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
        doc.text(formatCurrency(lineTotal), tableLeft + 395, yPosition + 10, { width: 90, align: 'right' });

        yPosition += rowHeight;
      });

      // Totals section
      yPosition += 10;
      const totalsX = 380;

      doc.fontSize(9)
         .fillColor(darkGray)
         .font('Helvetica');

      // Subtotal
      doc.text('Subtotal:', totalsX, yPosition)
         .text(formatCurrency(invoice.subtotal), totalsX + 80, yPosition, { width: 85, align: 'right' });
      yPosition += 18;

      // GST
      doc.font('Helvetica-Bold')
         .text(`GST (${invoice.gst_rate || 10}%):`, totalsX, yPosition)
         .font('Helvetica')
         .text(formatCurrency(invoice.gst_amount), totalsX + 80, yPosition, { width: 85, align: 'right' });
      yPosition += 25;

      // Total
      doc.roundedRect(totalsX - 5, yPosition - 5, 170, 25, 3)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fontSize(11)
         .fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .text('TOTAL:', totalsX, yPosition + 3)
         .text(formatCurrency(invoice.total_amount), totalsX + 80, yPosition + 3, { width: 85, align: 'right' });

      // Payment Information
      yPosition += 40;

      if (invoice.amount_paid && invoice.amount_paid > 0) {
        doc.fontSize(9)
           .fillColor(darkGray)
           .font('Helvetica');

        doc.text('Amount Paid:', totalsX, yPosition)
           .text(formatCurrency(invoice.amount_paid), totalsX + 80, yPosition, { width: 85, align: 'right' });
        yPosition += 18;

        doc.font('Helvetica-Bold')
           .fillColor('#059669')
           .text('Balance Due:', totalsX, yPosition)
           .text(formatCurrency(invoice.amount_due), totalsX + 80, yPosition, { width: 85, align: 'right' });
      }

      // Payment Details Section (Laravel template enhancement)
      yPosition += 30;

      if (invoice.payment_mode || invoice.card_number || invoice.collected_amount || invoice.returned_amount) {
        doc.fontSize(10)
           .fillColor(darkGray)
           .font('Helvetica-Bold')
           .text('PAYMENT DETAILS:', 50, yPosition);

        yPosition += 20;

        doc.fontSize(9)
           .font('Helvetica');

        if (invoice.payment_mode) {
          doc.font('Helvetica-Bold').text('Payment Mode: ', 50, yPosition, { continued: true })
             .font('Helvetica').text(invoice.payment_mode.toUpperCase());
          yPosition += 15;
        }

        if (invoice.card_number && invoice.payment_mode === 'card') {
          const maskedCard = '****' + invoice.card_number.slice(-4);
          doc.font('Helvetica-Bold').text('Card Number: ', 50, yPosition, { continued: true })
             .font('Helvetica').text(maskedCard);
          yPosition += 15;
        }

        if (invoice.card_holder && invoice.payment_mode === 'card') {
          doc.font('Helvetica-Bold').text('Card Holder: ', 50, yPosition, { continued: true })
             .font('Helvetica').text(invoice.card_holder);
          yPosition += 15;
        }

        if (invoice.collected_amount) {
          doc.font('Helvetica-Bold').text('Amount Collected: ', 50, yPosition, { continued: true })
             .font('Helvetica').text(formatCurrency(invoice.collected_amount));
          yPosition += 15;
        }

        if (invoice.returned_amount && invoice.returned_amount > 0) {
          doc.font('Helvetica-Bold').text('Change Given: ', 50, yPosition, { continued: true })
             .font('Helvetica').text(formatCurrency(invoice.returned_amount));
          yPosition += 15;
        }
      }

      // Bank Details Section (Laravel template enhancement)
      yPosition += 10;

      doc.fontSize(10)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('PAYMENT INFORMATION:', 50, yPosition);

      yPosition += 20;

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Bank: ', 50, yPosition, { continued: true })
         .font('Helvetica')
         .text('Bank of Papua New Guinea');
      yPosition += 15;

      doc.font('Helvetica-Bold')
         .text('Account Name: ', 50, yPosition, { continued: true })
         .font('Helvetica')
         .text('Climate Change & Development Authority (CCDA)');
      yPosition += 15;

      doc.font('Helvetica-Bold')
         .text('Account Number: ', 50, yPosition, { continued: true })
         .font('Helvetica')
         .text('1234567890');
      yPosition += 15;

      doc.font('Helvetica-Bold')
         .text('Swift Code: ', 50, yPosition, { continued: true })
         .font('Helvetica')
         .text('BPNGPGPM');

      // Notes section
      if (invoice.notes) {
        yPosition += 30;
        doc.fontSize(9)
           .fillColor(darkGray)
           .font('Helvetica-Bold')
           .text('Notes:', 50, yPosition);

        yPosition += 15;
        doc.font('Helvetica')
           .fontSize(8)
           .text(invoice.notes, 50, yPosition, { width: 495 });
      }

      // Terms & Conditions Section (Laravel template enhancement)
      yPosition += 30;

      doc.fontSize(10)
         .fillColor(darkGray)
         .font('Helvetica-Bold')
         .text('TERMS & CONDITIONS:', 50, yPosition);

      yPosition += 20;

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(darkGray);

      const terms = [
        'Payment is due within 30 days of invoice date unless otherwise specified.',
        'Vouchers are valid for the period specified on each voucher.',
        'Vouchers are non-refundable once issued.',
        'Please contact our office if you have any questions regarding this invoice.',
        'For bank transfers, please include the invoice number as reference.'
      ];

      terms.forEach((term, index) => {
        doc.text(`${index + 1}. ${term}`, 50, yPosition, { width: 495 });
        yPosition += 12;
      });

      // Footer - GST Compliance Notice
      const footerY = 750;

      doc.moveTo(50, footerY)
         .lineTo(545, footerY)
         .stroke(lightGray);

      doc.fontSize(7)
         .fillColor(lightGray)
         .font('Helvetica')
         .text(
           'This is a GST-compliant Tax Invoice issued in accordance with Papua New Guinea Internal Revenue Commission regulations.',
           50,
           footerY + 10,
           { width: 495, align: 'center' }
         );

      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-PG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        50,
        footerY + 25,
        { width: 495, align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
};
