/**
 * Notification Service for PNG Green Fees
 * Sends voucher codes via SMS and Email
 */

/**
 * Send SMS via Digicel/Bmobile PNG SMS Gateway
 *
 * For production, integrate with:
 * - Digicel PNG SMS API
 * - Bmobile PNG SMS API
 * - Twilio (international fallback)
 */
async function sendSMS(phoneNumber, message) {
  console.log('📱 Sending SMS to:', phoneNumber);
  console.log('📝 Message:', message);

  // TODO: Integrate with PNG SMS gateway
  // Example integration:
  //
  // const response = await fetch('https://sms.digicel.com.pg/api/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.DIGICEL_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     to: phoneNumber,
  //     message: message,
  //     sender_id: 'GreenFees'
  //   })
  // });

  // For development/testing, just log
  console.log('✅ SMS would be sent in production');

  return {
    success: true,
    provider: 'mock',
    messageId: `sms_${Date.now()}`
  };
}

/**
 * Send Email via SMTP or Email Service
 *
 * For production, use:
 * - PNG government email server (SMTP)
 * - AWS SES (Asia Pacific region)
 * - SendGrid
 */
async function sendEmail(to, subject, htmlBody, textBody) {
  console.log('📧 Sending email to:', to);
  console.log('📝 Subject:', subject);

  // Check if SMTP is configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = require('nodemailer');

      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ SMTP connection verified');

      // Send email
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.gov.pg>',
        to: to,
        subject: subject,
        text: textBody,
        html: htmlBody
      });

      console.log('✅ Email sent successfully:', info.messageId);

      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ SMTP email failed:', error.message);
      throw error;
    }
  }

  // Fallback to mock mode if SMTP not configured
  console.log('⚠️ SMTP not configured - using mock mode');
  console.log('📄 Email content preview:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body (text):', textBody.substring(0, 200) + '...');

  return {
    success: true,
    provider: 'mock',
    messageId: `email_${Date.now()}`
  };
}

/**
 * Send voucher notification via SMS and Email
 * Called after successful payment
 */
async function sendVoucherNotification(customerData, vouchers) {
  const { customerEmail, customerPhone, quantity } = customerData;

  // Format voucher codes for messaging
  const voucherCodes = vouchers.map(v => v.voucher_code).join(', ');
  const voucherList = vouchers.map((v, i) =>
    `${i + 1}. ${v.voucher_code} (Valid until ${new Date(v.valid_until).toLocaleDateString('en-GB')})`
  ).join('\n');

  const registrationUrl = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';

  // SMS Message (160 characters max per SMS)
  const smsMessage = `PNG Green Fees: Your voucher code${quantity > 1 ? 's' : ''}: ${voucherCodes}. Register at ${registrationUrl}/register/[CODE]. Valid 30 days.`;

  // Email Message
  const emailSubject = `Your PNG Green Fees Voucher Code${quantity > 1 ? 's' : ''} - Payment Confirmed`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .voucher-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .voucher-code { font-size: 24px; font-weight: bold; color: #059669; font-family: monospace; letter-spacing: 2px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 PNG Green Fees System</h1>
      <p>Payment Confirmed - Voucher Code${quantity > 1 ? 's' : ''} Issued</p>
    </div>
    <div class="content">
      <h2>Thank you for your payment!</h2>
      <p>Your voucher code${quantity > 1 ? 's have' : ' has'} been successfully generated.</p>

      ${vouchers.map((v, i) => `
      <div class="voucher-box">
        <p><strong>Voucher ${quantity > 1 ? (i + 1) + ' of ' + quantity : ''}</strong></p>
        <p class="voucher-code">${v.voucher_code}</p>
        <p>
          <strong>Value:</strong> PGK ${v.amount}<br>
          <strong>Valid Until:</strong> ${new Date(v.valid_until).toLocaleDateString('en-GB')}<br>
          <strong>Status:</strong> Ready to use
        </p>
        <a href="${registrationUrl}/register/${v.voucher_code}" class="button">Register Passport Now</a>
      </div>
      `).join('')}

      <h3>Next Steps:</h3>
      <ol>
        <li>Keep this voucher code safe</li>
        <li>Click the button above or visit: <strong>${registrationUrl}/register/[YOUR-CODE]</strong></li>
        <li>Enter your passport details</li>
        <li>Your exit pass will be processed within 24 hours</li>
      </ol>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p><strong>⚠️ Important:</strong></p>
        <ul>
          <li>Vouchers are valid for 30 days from purchase date</li>
          <li>Each voucher is for one traveler only</li>
          <li>You must register passport details before traveling</li>
        </ul>
      </div>

      <div class="footer">
        <p>This is an automated message from PNG Green Fees System</p>
        <p>For support, contact: support@greenpay.gov.pg | +675 XXX XXXX</p>
        <p>© 2025 PNG Green Fees System. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
PNG GREEN FEES SYSTEM
Payment Confirmed - Voucher Code${quantity > 1 ? 's' : ''} Issued

Thank you for your payment!

YOUR VOUCHER CODE${quantity > 1 ? 'S' : ''}:
${voucherList}

REGISTRATION:
Visit ${registrationUrl}/register/[YOUR-CODE] to register your passport details.

Each voucher is valid for 30 days and can be used for one traveler.

Need help? Contact support@greenpay.gov.pg or +675 XXX XXXX

© 2025 PNG Green Fees System
  `;

  const results = {
    sms: null,
    email: null
  };

  // Send SMS if phone provided
  if (customerPhone) {
    try {
      results.sms = await sendSMS(customerPhone, smsMessage);
    } catch (error) {
      console.error('❌ SMS delivery failed:', error);
      results.sms = { success: false, error: error.message };
    }
  }

  // Send Email if email provided
  if (customerEmail) {
    try {
      results.email = await sendEmail(customerEmail, emailSubject, emailHtml, emailText);
    } catch (error) {
      console.error('❌ Email delivery failed:', error);
      results.email = { success: false, error: error.message };
    }
  }

  console.log('📤 Notification results:', results);
  return results;
}

/**
 * Send quotation email to customer
 * Called when user requests to email a quotation
 */
async function sendQuotationEmail(recipientEmail, quotation) {
  const {
    quotation_number,
    customer_name,
    customer_email,
    description,
    number_of_vouchers,
    unit_price,
    line_total,
    discount_percentage,
    discount_amount,
    subtotal,
    tax_percentage,
    tax_amount,
    gst_rate,
    gst_amount,
    total_amount,
    valid_until,
    payment_terms,
    created_by_name
  } = quotation;

  const publicUrl = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';

  // Email subject
  const emailSubject = `Quotation ${quotation_number} from PNG Green Fees`;

  // Email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .quotation-header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .quotation-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .items-table { width: 100%; background: white; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; }
    .items-table th { background: #059669; color: white; padding: 12px; text-align: left; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals-table { width: 100%; max-width: 400px; margin-left: auto; background: white; padding: 15px; border-radius: 8px; }
    .totals-table tr td { padding: 8px; }
    .totals-table tr.total td { font-weight: bold; font-size: 18px; border-top: 2px solid #059669; padding-top: 12px; }
    .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 PNG Green Fees System</h1>
      <p>Official Quotation</p>
    </div>
    <div class="content">
      <div class="quotation-header">
        <h2 style="margin: 0 0 20px 0; color: #059669;">Quotation ${quotation_number}</h2>
        <div class="quotation-info">
          <div>
            <strong>To:</strong> ${customer_name || 'Valued Customer'}<br>
            ${customer_email ? `<strong>Email:</strong> ${customer_email}<br>` : ''}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}<br>
            ${valid_until ? `<strong>Valid Until:</strong> ${new Date(valid_until).toLocaleDateString('en-GB')}<br>` : ''}
            ${created_by_name ? `<strong>Prepared By:</strong> ${created_by_name}` : ''}
          </div>
        </div>
        ${description ? `<p style="margin-top: 15px;"><strong>Description:</strong> ${description}</p>` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Green Fee Vouchers</td>
            <td style="text-align: center;">${number_of_vouchers || 1}</td>
            <td style="text-align: right;">K ${parseFloat(unit_price || 0).toFixed(2)}</td>
            <td style="text-align: right;">K ${parseFloat(line_total || subtotal || 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right;">K ${parseFloat(subtotal || 0).toFixed(2)}</td>
        </tr>
        ${discount_amount > 0 ? `
        <tr>
          <td>Discount (${discount_percentage || 0}%):</td>
          <td style="text-align: right; color: #dc2626;">-K ${parseFloat(discount_amount).toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>GST (${gst_rate || tax_percentage || 10}%):</td>
          <td style="text-align: right;">K ${parseFloat(gst_amount || tax_amount || 0).toFixed(2)}</td>
        </tr>
        <tr class="total">
          <td>Total Amount:</td>
          <td style="text-align: right; color: #059669;">K ${parseFloat(total_amount || 0).toFixed(2)}</td>
        </tr>
      </table>

      ${payment_terms ? `
      <div class="highlight">
        <p><strong>Payment Terms:</strong> ${payment_terms}</p>
      </div>
      ` : ''}

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #059669; margin-top: 0;">What's Included:</h3>
        <ul style="line-height: 2;">
          <li>${number_of_vouchers || 1} Green Fee Voucher${(number_of_vouchers || 1) > 1 ? 's' : ''}</li>
          <li>Valid for ${valid_until ? `use until ${new Date(valid_until).toLocaleDateString('en-GB')}` : '30 days from purchase'}</li>
          <li>Online passport registration portal access</li>
          <li>Email confirmation for each voucher</li>
          <li>Customer support throughout the process</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${publicUrl}/buy-voucher" class="button">Purchase Online Now</a>
      </div>

      <div class="highlight">
        <p><strong>Questions about this quotation?</strong></p>
        <p>Contact us at support@greenpay.gov.pg or call +675 XXX XXXX</p>
      </div>

      <div class="footer">
        <p><strong>PNG Green Fees System</strong></p>
        <p>Papua New Guinea Immigration & Citizenship Authority</p>
        <p>This quotation was sent to: ${recipientEmail}</p>
        <p style="margin-top: 10px;">© 2025 PNG Green Fees System. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Email plain text version
  const emailText = `
PNG GREEN FEES SYSTEM
Official Quotation

QUOTATION: ${quotation_number}
DATE: ${new Date().toLocaleDateString('en-GB')}
${valid_until ? `VALID UNTIL: ${new Date(valid_until).toLocaleDateString('en-GB')}` : ''}

TO: ${customer_name || 'Valued Customer'}
${customer_email ? `EMAIL: ${customer_email}` : ''}

${description ? `\nDESCRIPTION:\n${description}\n` : ''}

ITEMS:
- Green Fee Vouchers × ${number_of_vouchers || 1}
  Unit Price: K ${parseFloat(unit_price || 0).toFixed(2)}
  Amount: K ${parseFloat(line_total || subtotal || 0).toFixed(2)}

SUMMARY:
Subtotal: K ${parseFloat(subtotal || 0).toFixed(2)}
${discount_amount > 0 ? `Discount (${discount_percentage || 0}%): -K ${parseFloat(discount_amount).toFixed(2)}\n` : ''}GST (${gst_rate || tax_percentage || 10}%): K ${parseFloat(gst_amount || tax_amount || 0).toFixed(2)}
TOTAL AMOUNT: K ${parseFloat(total_amount || 0).toFixed(2)}

${payment_terms ? `\nPAYMENT TERMS: ${payment_terms}\n` : ''}

To purchase online, visit: ${publicUrl}/buy-voucher

Questions? Contact support@greenpay.gov.pg or call +675 XXX XXXX

© 2025 PNG Green Fees System
  `;

  // Send the email
  try {
    const result = await sendEmail(recipientEmail, emailSubject, emailHtml, emailText);
    console.log('✅ Quotation email sent successfully to:', recipientEmail);
    return result;
  } catch (error) {
    console.error('❌ Failed to send quotation email:', error);
    throw error;
  }
}

/**
 * Send invoice email with PDF attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.customerName - Customer name
 * @param {string} options.invoiceNumber - Invoice number
 * @param {number} options.totalAmount - Total amount
 * @param {string} options.dueDate - Due date
 * @param {Buffer} options.pdfBuffer - PDF attachment
 */
const sendInvoiceEmail = async (options) => {
  const { to, customerName, invoiceNumber, totalAmount, dueDate, pdfBuffer } = options;

  console.log('📧 Sending invoice email to:', to);
  console.log('📝 Invoice:', invoiceNumber);

  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('Email service not configured');
  }

  const nodemailer = require('nodemailer');

  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Verify connection
  await transporter.verify();
  console.log('✅ SMTP connection verified');

  const publicUrl = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.gov.pg>',
    to,
    subject: `Invoice ${invoiceNumber} - PNG Green Fees`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-weight: 500; }
          .value { color: #111827; font-weight: 600; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🟢 PNG Green Fees</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice</p>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Please find attached your invoice for PNG Green Fee vouchers.</p>

            <div class="invoice-details">
              <div class="detail-row">
                <span class="label">Invoice Number:</span>
                <span class="value">${invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Due:</span>
                <span class="value">PGK ${parseFloat(totalAmount).toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Due Date:</span>
                <span class="value">${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <p>The invoice has been attached to this email as a PDF document.</p>

            <div style="text-align: center;">
              <a href="${publicUrl}/invoices" class="button">View Invoice Online</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              <strong>Payment Instructions:</strong><br>
              Please remit payment by the due date to avoid any late fees.
              If you have any questions about this invoice, please contact us.
            </p>

            <div class="footer">
              <p><strong>PNG Green Fees System</strong></p>
              <p>Papua New Guinea Government</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Invoice email sent successfully to:', to);
    return result;
  } catch (error) {
    console.error('❌ Failed to send invoice email:', error);
    throw error;
  }
}

/**
 * Send email with attachments (for vouchers, invoices, etc.)
 */
async function sendEmailWithAttachments(options) {
  const { to, subject, html, attachments } = options;

  console.log('📧 Sending email with attachments to:', to);
  console.log('📝 Subject:', subject);

  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP not configured');
  }

  try {
    const nodemailer = require('nodemailer');

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send email with attachments
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.gov.pg>',
      to,
      subject,
      html,
      attachments
    });

    console.log('✅ Email with attachments sent successfully:', info.messageId);

    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Email with attachments failed:', error.message);
    throw error;
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  sendEmailWithAttachments,
  sendVoucherNotification,
  sendQuotationEmail,
  sendInvoiceEmail
};
