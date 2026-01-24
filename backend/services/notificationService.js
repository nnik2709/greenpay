/**
 * Notification Service for PNG Green Fees
 * Sends voucher codes via SMS and Email
 */

const { PUBLIC_URL, getAppUrl } = require('../config/urls');

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
async function sendEmail(to, subject, htmlBody, textBody, attachments = []) {
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
      // IMPORTANT: For Brevo, SMTP_USER (a0282b001@smtp-brevo.com) is NOT a valid sender
      // Must use SMTP_FROM which should be a verified sender in Brevo
      const fromEmail = process.env.SMTP_FROM || 'noreply@greenpay.eywademo.cloud';
      const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';

      if (!process.env.SMTP_FROM) {
        console.warn('⚠️ SMTP_FROM not set, using default:', fromEmail);
      }

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: to,
        subject: subject,
        text: textBody,
        html: htmlBody,
        attachments
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
 * ENHANCED: Sends each voucher as a separate PDF attachment
 */
async function sendVoucherNotification(customerData, vouchers, sessionId = null) {
  const { customerEmail, customerPhone, quantity } = customerData;

  // Format voucher codes for messaging
  const voucherCodes = vouchers.map(v => v.voucher_code).join(', ');
  const voucherList = vouchers.map((v, i) =>
    `${i + 1}. ${v.voucher_code} (Valid until ${new Date(v.valid_until).toLocaleDateString('en-GB')})`
  ).join('\n');

  // Generate SEPARATE PDF for EACH voucher using standardized template
  const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
  const pdfAttachments = [];
  for (const voucher of vouchers) {
    const pdfBuffer = await generateVoucherPDFBuffer([voucher], 'Online Purchase');
    pdfAttachments.push({
      filename: `voucher-${voucher.voucher_code}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  const registrationUrl = process.env.PUBLIC_URL || 'https://pnggreenfees.gov.pg';
  const policyLinks = `
    <p style="margin-top:16px;font-size:12px;color:#4b5563;">
      Policies:
      <a href="${registrationUrl}/terms" style="color:#047857;text-decoration:underline;">Terms &amp; Conditions</a> •
      <a href="${registrationUrl}/privacy" style="color:#047857;text-decoration:underline;">Privacy Policy</a> •
      <a href="${registrationUrl}/refunds" style="color:#047857;text-decoration:underline;">Refund / Return Policy</a>
    </p>
  `;

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

      <h3>How to Register Your Passport:</h3>
      <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Option 1: Mobile Device (Recommended)</strong></p>
        <p style="margin: 5px 0; padding-left: 20px;">📱 Scan the QR code on the PDF attachment with your phone</p>

        <p style="margin: 10px 0; margin-top: 20px;"><strong>Option 2: Desktop/Laptop</strong></p>
        <p style="margin: 5px 0; padding-left: 20px;">💻 Click the "Register Passport Now" button above, or visit: <br><code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${registrationUrl}/register/[YOUR-CODE]</code></p>

        <p style="margin: 10px 0; margin-top: 20px;"><strong>Option 3: At the Airport</strong></p>
        <p style="margin: 5px 0; padding-left: 20px;">✈️ Present your printed voucher and passport to the airport agent</p>
      </div>

      <p><strong>After registration:</strong></p>
      <ol>
        <li>Your passport will be linked to your voucher</li>
        <li>Your exit pass will be processed within 24 hours</li>
        <li>Keep your voucher code safe for travel</li>
      </ol>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p><strong>⚠️ Important:</strong></p>
        <ul>
          <li>Vouchers are valid for 30 days from purchase date</li>
          <li>Each voucher is for one traveler only</li>
          <li>You must register passport details before traveling</li>
        </ul>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <p><strong>📧 Lost this email?</strong></p>
        <p>You can retrieve your vouchers anytime using your payment session ID and email address:</p>
        ${sessionId ? `<p style="margin: 10px 0;"><strong>Payment Session ID:</strong> <code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${sessionId}</code></p>` : ''}
        <p style="margin: 10px 0;">
          <a href="${registrationUrl}/retrieve-vouchers" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Retrieve Your Vouchers</a>
        </p>
      </div>

      <div class="footer">
        <p>This is an automated message from PNG Green Fees System</p>
        <p>For support, contact: support@greenpay.gov.pg | +675 XXX XXXX</p>
        ${policyLinks}
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

  // Send Email if email provided (with PDF attachments)
  if (customerEmail) {
    try {
      results.email = await sendEmail(customerEmail, emailSubject, emailHtml, emailText, pdfAttachments);
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
    company_name,
    contact_person,
    contact_email,
    description,
    number_of_vouchers,
    number_of_passports,
    unit_price,
    amount_per_passport,
    price_per_passport,
    line_total,
    discount_percentage,
    discount,
    discount_amount,
    subtotal,
    tax_percentage,
    tax_amount,
    gst_rate,
    gst_amount,
    total_amount,
    amount_after_discount,
    valid_until,
    payment_terms,
    created_by_name
  } = quotation;

  // Use the client name from the quotation
  const clientName = customer_name || company_name || contact_person || 'Valued Customer';

  // Generate PDF attachment
  const { generateQuotationPDF } = require('../utils/pdfGenerator');
  let pdfBuffer;
  try {
    pdfBuffer = await generateQuotationPDF(quotation);
    console.log('✅ Quotation PDF generated successfully');
  } catch (error) {
    console.error('⚠️ Failed to generate quotation PDF:', error);
    // Continue without PDF if generation fails
    pdfBuffer = null;
  }

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

  // Email subject
  const emailSubject = `Quotation ${quotation_number} - Climate Change and Development Authority`;

  // Email HTML - Using template text from Share Quotation document
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; }
    .contact-info { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">PNG Green Fees System</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Climate Change and Development Authority</p>
    </div>
    <div class="content">
      <p>Dear ${clientName},</p>
      
      <div class="message">
        <p>Thank you for your interest in our services. Please find attached your quotation for your review.</p>
        
        <p>This quotation includes all the details regarding the services requested, pricing information, terms and conditions, and validity period.</p>
        
        <p>Please review the attached document carefully. If you have any questions or require any modifications, please don't hesitate to contact us.</p>
        
        <p>We look forward to the opportunity to serve you and appreciate your consideration of our services.</p>
        
        <p>Thank you for your business.</p>
      </div>

      <div class="contact-info">
        <p style="margin: 0;"><strong>Best regards,</strong></p>
        <p style="margin: 5px 0 0 0;"><strong>Climate Change and Development Authority</strong></p>
        <p style="margin: 10px 0 0 0;">
          Email: <a href="mailto:enquiries@ccda.gov.pg">enquiries@ccda.gov.pg</a> / <a href="mailto:png.greenfees@ccda.gov.pg">png.greenfees@ccda.gov.pg</a><br>
          Phone: +675 7700 7513 / +675 7700 7836
        </p>
      </div>

      <div class="footer">
        <p><strong>PNG Green Fees System</strong></p>
        <p>Climate Change and Development Authority</p>
        <p style="margin-top: 10px;">© ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Email plain text version
  const emailText = `
Dear ${clientName},

Thank you for your interest in our services. Please find attached your quotation for your review.

This quotation includes all the details regarding the services requested, pricing information, terms and conditions, and validity period.

Please review the attached document carefully. If you have any questions or require any modifications, please don't hesitate to contact us.

We look forward to the opportunity to serve you and appreciate your consideration of our services.

Thank you for your business.

Best regards,
Climate Change and Development Authority
Email: enquiries@ccda.gov.pg / png.greenfees@ccda.gov.pg
Phone: +675 7700 7513 / +675 7700 7836

© ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.
This is an automated email. Please do not reply to this message.
  `;

  // Prepare mail options
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: recipientEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml
  };

  // Add PDF attachment if generated
  if (pdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `Quotation_${quotation_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];
  }

  // Send the email
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Quotation email sent successfully to:', recipientEmail);
    return {
      success: true,
      provider: 'smtp',
      messageId: result.messageId
    };
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

  const publicUrl = PUBLIC_URL;

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
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
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
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

/**
 * Send ticket creation notification to IT Support
 * Called when a new support ticket is created
 */
async function sendTicketNotification(ticketData, createdByUser) {
  const {
    id,
    ticket_number,
    title,
    description,
    category,
    priority,
    created_at
  } = ticketData;

  const {
    name: userName,
    email: userEmail
  } = createdByUser;

  // IT Support email - use environment variable or fallback to hardcoded
  const itSupportEmail = process.env.IT_SUPPORT_EMAIL || 'meghana@vflex.com.pg';

  console.log('📧 Sending ticket notification to IT Support:', itSupportEmail);
  console.log('📝 Ticket:', ticket_number);

  // Format category for display
  const categoryLabels = {
    'technical': 'Technical',
    'billing': 'Billing',
    'feature_request': 'Feature Request',
    'other': 'Other'
  };
  const categoryLabel = categoryLabels[category] || category;

  // Format priority for display with color
  const priorityLabels = {
    'low': { label: 'Low', color: '#10b981' },
    'medium': { label: 'Medium', color: '#f59e0b' },
    'high': { label: 'High', color: '#ef4444' },
    'urgent': { label: 'Urgent', color: '#dc2626' }
  };
  const priorityInfo = priorityLabels[priority] || { label: priority, color: '#6b7280' };

  // Email subject
  const emailSubject = `New Ticket Created: ${title} [${ticket_number}]`;

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
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .ticket-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-weight: 500; width: 140px; flex-shrink: 0; }
    .value { color: #111827; font-weight: 600; flex: 1; }
    .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; font-weight: 600; font-size: 12px; }
    .description-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎫 New Support Ticket</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">PNG Green Fees System</p>
    </div>
    <div class="content">
      <p>A new support ticket has been created and requires your attention.</p>

      <div class="ticket-box">
        <h2 style="margin-top: 0; color: #059669;">${title}</h2>

        <div class="detail-row">
          <span class="label">Ticket Number:</span>
          <span class="value">${ticket_number}</span>
        </div>

        <div class="detail-row">
          <span class="label">Submitted By:</span>
          <span class="value">${userName} (${userEmail})</span>
        </div>

        <div class="detail-row">
          <span class="label">Category:</span>
          <span class="value">${categoryLabel}</span>
        </div>

        <div class="detail-row">
          <span class="label">Priority:</span>
          <span class="value">
            <span class="priority-badge" style="background-color: ${priorityInfo.color};">${priorityInfo.label}</span>
          </span>
        </div>

        <div class="detail-row">
          <span class="label">Submitted:</span>
          <span class="value">${new Date(created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div class="description-box">
        <p style="margin: 0 0 10px 0;"><strong>Description:</strong></p>
        <p style="margin: 0; white-space: pre-wrap;">${description}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${getAppUrl('/tickets')}" class="button">View Ticket</a>
      </div>

      <div class="footer">
        <p><strong>PNG Green Fees System</strong></p>
        <p>Support Ticket Notification</p>
        <p style="margin-top: 10px;">© ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
        <p>This is an automated email notification.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Email plain text version
  const emailText = `
NEW SUPPORT TICKET CREATED

Ticket Number: ${ticket_number}
Title: ${title}

Submitted By: ${userName} (${userEmail})
Category: ${categoryLabel}
Priority: ${priorityInfo.label}
Submitted: ${new Date(created_at).toLocaleString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

DESCRIPTION:
${description}

View this ticket at: ${getAppUrl('/tickets')}

---
PNG Green Fees System
Support Ticket Notification
© ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.
This is an automated email notification.
  `;

  // Send email
  try {
    const result = await sendEmail(itSupportEmail, emailSubject, emailHtml, emailText);
    console.log('✅ Ticket notification sent successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to send ticket notification:', error);
    // Don't throw error - ticket creation should succeed even if email fails
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  sendEmailWithAttachments,
  sendVoucherNotification,
  sendQuotationEmail,
  sendInvoiceEmail,
  sendTicketNotification
};
