const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 * Supports SMTP, Gmail, and other providers
 */
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS // Changed from SMTP_PASSWORD to match notificationService
    }
  };

  // If credentials are not configured, log warning and return null
  if (!config.auth.user || !config.auth.pass) {
    console.warn('⚠️  SMTP credentials not configured. Email sending is disabled.');
    console.warn('   Please set SMTP_USER and SMTP_PASS in your .env file');
    return null;
  }

  return nodemailer.createTransporter(config);
};

/**
 * Send invoice email with PDF attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.customerName - Customer name
 * @param {string} options.invoiceNumber - Invoice number
 * @param {number} options.totalAmount - Invoice total amount
 * @param {string} options.dueDate - Invoice due date
 * @param {Buffer} options.pdfBuffer - PDF attachment buffer
 * @param {string} options.fromEmail - Sender email (optional)
 * @param {string} options.fromName - Sender name (optional)
 * @returns {Promise<Object>} Send result
 */
const sendInvoiceEmail = async (options) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email service is not configured. Please set SMTP credentials in .env file.');
  }

  const {
    to,
    customerName,
    invoiceNumber,
    totalAmount,
    dueDate,
    pdfBuffer,
    fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System'
  } = options;

  // Format currency
  const formatCurrency = (amount) => `K ${parseFloat(amount || 0).toFixed(2)}`;

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-PG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Email HTML template
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice ${invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .message {
      font-size: 15px;
      line-height: 1.8;
      color: #4b5563;
      margin-bottom: 30px;
    }
    .invoice-details {
      background-color: #f0fdf4;
      border: 2px solid #059669;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .invoice-details h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #059669;
      font-weight: 700;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #d1fae5;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-top: 15px;
      margin-top: 10px;
      border-top: 2px solid #059669;
    }
    .detail-label {
      font-weight: 600;
      color: #065f46;
    }
    .detail-value {
      font-weight: 700;
      color: #1f2937;
    }
    .detail-row:last-child .detail-value {
      color: #059669;
      font-size: 18px;
    }
    .attachment-notice {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .attachment-notice p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background-color: #059669;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .footer strong {
      color: #374151;
    }
    .compliance-notice {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 15px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tax Invoice</h1>
      <p>Papua New Guinea Green Fees System</p>
    </div>

    <div class="content">
      <div class="greeting">Dear ${customerName},</div>

      <div class="message">
        Thank you for your business. Please find attached your PNG GST-compliant Tax Invoice.
      </div>

      <div class="invoice-details">
        <h2>Invoice Summary</h2>
        <div class="detail-row">
          <span class="detail-label">Invoice Number:</span>
          <span class="detail-value">${invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Date:</span>
          <span class="detail-value">${formatDate(dueDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div class="attachment-notice">
        <p>
          📎 <strong>Attachment:</strong> Your complete tax invoice is attached as a PDF document.
          Please review it carefully and keep it for your records.
        </p>
      </div>

      <div class="message">
        If you have any questions about this invoice, please don't hesitate to contact us.
        We appreciate your prompt payment.
      </div>
    </div>

    <div class="footer">
      <p><strong>PNG Green Fees System</strong></p>
      <p>Papua New Guinea | ${fromEmail}</p>
      <p class="compliance-notice">
        This is a GST-compliant Tax Invoice issued in accordance with Papua New Guinea
        Internal Revenue Commission regulations.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // Plain text version
  const textContent = `
PNG Green Fees System
Tax Invoice ${invoiceNumber}

Dear ${customerName},

Thank you for your business. Please find attached your PNG GST-compliant Tax Invoice.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Due Date: ${formatDate(dueDate)}
- Total Amount: ${formatCurrency(totalAmount)}

The complete tax invoice is attached as a PDF document. Please review it carefully and keep it for your records.

If you have any questions about this invoice, please don't hesitate to contact us. We appreciate your prompt payment.

Best regards,
PNG Green Fees System
Papua New Guinea

---
This is a GST-compliant Tax Invoice issued in accordance with Papua New Guinea Internal Revenue Commission regulations.
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: to,
    subject: `Tax Invoice ${invoiceNumber} - PNG Green Fees`,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        filename: `Invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invoice email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    throw error;
  }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>} True if configured and working
 */
const verifyEmailConfig = async () => {
  const transporter = createTransporter();

  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email service is configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return false;
  }
};

module.exports = {
  sendInvoiceEmail,
  verifyEmailConfig
};
