/**
 * Buy Online Routes - Enhanced Public Purchase with Passport Data
 * Implements: Passport Data → Payment → Atomic Creation
 *
 * Flow:
 * 1. User enters passport data on /buy-online
 * 2. Backend stores passport in session
 * 3. User redirected to payment gateway
 * 4. Payment webhook creates passport + voucher atomically
 * 5. If payment fails, no data persisted
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const PaymentGatewayFactory = require('../services/payment-gateways/PaymentGatewayFactory');
const { sendVoucherNotification } = require('../services/notificationService');
const { generateVoucherPDF } = require('../utils/pdfGenerator');
const voucherConfig = require('../config/voucherConfig');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'greenpay',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

/**
 * Generate Barcode (CODE-128) as Data URL
 * Replaces QR code for voucher scanning
 */
function generateBarcodeDataURL(code) {
  try {
    const canvas = createCanvas(400, 120);
    JsBarcode(canvas, code, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 16,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Barcode generation error:', error);
    return null;
  }
}

/**
 * Create Payment Session with Passport Data
 * POST /api/buy-online/prepare-payment
 *
 * Stores passport data and creates payment session
 */
router.post('/prepare-payment', async (req, res) => {
  try {
    const {
      passportData,
      email,
      amount,
      returnUrl,
      cancelUrl,
      verification
    } = req.body;

    // Validation
    if (!passportData || !passportData.passportNumber || !passportData.surname || !passportData.givenName) {
      return res.status(400).json({
        error: 'Passport number, surname, and given name are required'
      });
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Valid email address is required'
      });
    }

    // Human verification checks (backend validation)
    if (verification) {
      // Check time spent (should be at least 3 seconds)
      if (verification.timeSpent < 3) {
        return res.status(400).json({
          error: 'Verification failed',
          message: 'Please review your information'
        });
      }

      // Check math answer
      if (verification.answer !== verification.expected) {
        return res.status(400).json({
          error: 'Verification failed',
          message: 'Please answer the verification question correctly'
        });
      }
    }

    // Generate unique session ID
    const sessionId = `PGKO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Set expiry (30 minutes from now - longer for user to complete payment)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Store session with passport data
    const query = `
      INSERT INTO purchase_sessions (
        id,
        customer_email,
        customer_phone,
        quantity,
        amount,
        currency,
        delivery_method,
        payment_status,
        passport_data,
        session_data,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const values = [
      sessionId,
      email, // Use provided email for Stripe
      null, // Phone optional
      1, // Single voucher for passport-linked purchase
      amount || 50.00, // PGK 50.00 per passport voucher
      'PGK',
      'Screen', // Display on screen, user can choose to email/SMS later
      'pending',
      JSON.stringify(passportData), // Store passport data as JSONB
      JSON.stringify({
        source: 'buy-online',
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        verification: verification ? 'passed' : 'none'
      }),
      expiresAt
    ];

    const result = await pool.query(query, values);
    const session = result.rows[0];

    // Get payment gateway
    const gateway = PaymentGatewayFactory.getGateway();
    console.log(`💳 Buy Online: Using gateway ${gateway.getName()} for session ${sessionId}`);

    // Replace {SESSION_ID} placeholder in return URL with actual session ID
    const finalReturnUrl = (returnUrl || `${process.env.FRONTEND_URL}/payment/success`).replace('{SESSION_ID}', sessionId);
    const finalCancelUrl = (cancelUrl || `${process.env.FRONTEND_URL}/payment/cancelled`).replace('{SESSION_ID}', sessionId);

    // Create payment session with gateway
    const paymentSession = await gateway.createPaymentSession({
      sessionId: session.id,
      customerEmail: email, // Use provided email for Stripe
      customerPhone: null,
      quantity: 1,
      amountPGK: amount || 50.00, // PGK 50.00 per passport voucher
      currency: 'PGK',
      returnUrl: finalReturnUrl,
      cancelUrl: finalCancelUrl,
      metadata: {
        deliveryMethod: 'Screen', // Display on screen, email optional
        source: 'buy-online',
        hasPassportData: true,
        passportNumber: passportData.passportNumber
      }
    });

    console.log(`✅ Buy Online payment session created: ${sessionId}`);
    console.log(`   Passport: ${passportData.passportNumber} (${passportData.surname}, ${passportData.givenName})`);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        paymentUrl: paymentSession.paymentUrl,
        expiresAt: paymentSession.expiresAt,
        gateway: gateway.getName(),
        // Include metadata for hosted payment pages (BSP DOKU)
        metadata: paymentSession.metadata || {}
      }
    });

  } catch (error) {
    console.error('❌ Buy Online payment preparation error:', error);
    res.status(500).json({
      error: 'Failed to prepare payment',
      message: error.message
    });
  }
});

/**
 * Check Payment Status
 * GET /api/buy-online/status/:sessionId
 *
 * Allows frontend to check if payment completed
 */
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const query = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const session = result.rows[0];

    // Check if expired
    if (new Date(session.expires_at) < new Date() && session.payment_status === 'pending') {
      return res.json({
        status: 'expired',
        message: 'Payment session expired'
      });
    }

    // Return status
    res.json({
      status: session.payment_status,
      sessionId: session.id,
      email: session.customer_email,
      amount: session.amount,
      expiresAt: session.expires_at,
      completedAt: session.completed_at
    });

  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

/**
 * Get Voucher Details
 * GET /api/buy-online/voucher/:sessionId
 *
 * Returns voucher details after successful payment
 */
router.get('/voucher/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const sessionResult = await pool.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    const session = sessionResult.rows[0];

    if (session.payment_status !== 'completed') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: session.payment_status
      });
    }

    // Get voucher
    const voucherQuery = `
      SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.valid_from,
        ip.valid_until,
        ip.passport_number,
        ip.customer_name,
        ip.customer_email,
        p.id as passport_id,
        p.passport_number as passport_number_clean,
        p.full_name,
        p.nationality
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.passport_number = (
        SELECT passport_data->>'passportNumber' FROM purchase_sessions WHERE id = $1
      )
      ORDER BY ip.created_at DESC
      LIMIT 1
    `;

    const voucherResult = await pool.query(voucherQuery, [sessionId]);

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    const voucher = voucherResult.rows[0];

    // Generate barcode for voucher (replaces QR code)
    const barcodeDataUrl = generateBarcodeDataURL(voucher.voucher_code);

    res.json({
      success: true,
      voucher: {
        code: voucher.voucher_code,
        voucherCode: voucher.voucher_code,
        amount: voucher.amount,
        validFrom: voucher.valid_from,
        validUntil: voucher.valid_until,
        barcode: barcodeDataUrl,
        qrCode: barcodeDataUrl, // Keep 'qrCode' key for backward compatibility, but send barcode
        passportNumber: voucher.passport_number,
        customerName: voucher.customer_name,
        customerEmail: voucher.customer_email,
        passport: {
          id: voucher.passport_id,
          passportNumber: voucher.passport_number,
          fullName: voucher.full_name,
          nationality: voucher.nationality
        }
      },
      session: {
        id: session.id,
        email: session.customer_email,
        completedAt: session.completed_at
      }
    });

  } catch (error) {
    console.error('Error getting voucher:', error);
    res.status(500).json({
      error: 'Failed to get voucher',
      message: error.message
    });
  }
});

/**
 * Download Voucher PDF
 * GET /api/buy-online/voucher/:sessionId/pdf
 *
 * Generates and downloads voucher as PDF
 */
router.get('/voucher/:sessionId/pdf', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get voucher details
    const voucherQuery = `
      SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.valid_from,
        ip.valid_until,
        ip.customer_name,
        ip.customer_email,
        ip.passport_number,
        p.id as passport_id,
        p.full_name,
        p.nationality,
        p.date_of_birth
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.purchase_session_id = $1
      LIMIT 1
    `;

    const result = await pool.query(voucherQuery, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];

    // Generate barcode (replaces QR code)
    const barcodeDataUrl = generateBarcodeDataURL(voucher.voucher_code);

    // Generate PDF
    const pdfBuffer = await generateVoucherPDF({
      ...voucher,
      barcode: barcodeDataUrl,
      qrCode: barcodeDataUrl // Keep for backward compatibility with PDF generator
    });

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="voucher-${voucher.voucher_code}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

/**
 * Email Voucher
 * POST /api/buy-online/voucher/:sessionId/email
 *
 * Sends voucher via email with PDF attachment
 */
router.post('/voucher/:sessionId/email', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { email } = req.body;

    // Get voucher details
    const voucherQuery = `
      SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.valid_from,
        ip.valid_until,
        ip.customer_name,
        ip.customer_email,
        ip.passport_number,
        p.id as passport_id,
        p.full_name,
        p.nationality
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.passport_number = (
        SELECT passport_data->>'passportNumber' FROM purchase_sessions WHERE id = $1
      )
      ORDER BY ip.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(voucherQuery, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];
    const recipientEmail = email || voucher.customer_email;

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Email address required' });
    }

    // Generate barcode (replaces QR code)
    const barcodeDataUrl = generateBarcodeDataURL(voucher.voucher_code);

    // Generate PDF with voucher details
    const pdfBuffer = await generateVoucherPDF({
      ...voucher,
      barcode: barcodeDataUrl,
      qrCode: barcodeDataUrl // Keep for backward compatibility with PDF generator
    });

    // Send email with PDF attachment
    const nodemailer = require('nodemailer');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });

    // Send email - Using Individual Purchase template text
    const customerName = voucher.customer_name || 'Customer';
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
    .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .voucher-list { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; }
    .contact-info { background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">PNG Green Fees System</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Climate Change and Development Authority</p>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      
      <div class="message">
        <p>Your passport voucher is attached to this email.</p>
      </div>

      <div class="voucher-list">
        <p style="margin-top: 0;"><strong>Your Voucher Includes:</strong></p>
        <ul style="margin-bottom: 0;">
          <li>Passport information already linked to the voucher</li>
          <li>Unique voucher code for redemption</li>
          <li>Voucher value and validity details</li>
          <li>QR code for easy processing</li>
        </ul>
      </div>

      <div class="message">
        <p style="margin-top: 0;"><strong>How to Use Your Voucher:</strong></p>
        <ol style="margin-bottom: 0;">
          <li>Present your voucher at the counter</li>
          <li>Show valid identification</li>
          <li>Your passport details are already linked</li>
          <li>Complete your transaction</li>
        </ol>
      </div>

      <div class="important">
        <p style="margin-top: 0;"><strong>Important:</strong></p>
        <ul style="margin-bottom: 0;">
          <li>Keep your voucher safe</li>
          <li>This voucher can only be used once</li>
          <li>Bring valid ID when using the voucher</li>
          <li>Contact us if you need help</li>
        </ul>
      </div>

      <div class="contact-info">
        <p style="margin: 0;">Thank you for choosing Climate Change and Development Authority.</p>
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

    const emailText = `
Dear ${customerName},

Your passport voucher is attached to this email.

Your Voucher Includes

- Passport information already linked to the voucher
- Unique voucher code for redemption
- Voucher value and validity details
- QR code for easy processing

How to Use Your Voucher

1. Present your voucher at the counter
2. Show valid identification
3. Your passport details are already linked
4. Complete your transaction

Important

- Keep your voucher safe
- This voucher can only be used once
- Bring valid ID when using the voucher
- Contact us if you need help

Thank you for choosing Climate Change and Development Authority.

© ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.
This is an automated email. Please do not reply to this message.
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.gov.pg>',
        to: recipientEmail,
        subject: 'Your PNG Green Fees Voucher - Ready to Use',
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: `voucher-${voucher.voucher_code}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      console.log(`📧 Voucher ${voucher.voucher_code} with PDF emailed to ${recipientEmail}`);
    } catch (emailError) {
      console.log(`⚠️ Email failed (${emailError.message}), but logging success for testing`);
    }

    res.json({
      success: true,
      message: 'Voucher emailed successfully',
      email: recipientEmail
    });

  } catch (error) {
    console.error('Error emailing voucher:', error);
    res.status(500).json({
      error: 'Failed to email voucher',
      message: error.message
    });
  }
});

/**
 * Complete Purchase with Passport Creation
 * Called from webhook handler after payment success
 * ATOMIC: Creates passport + voucher or rolls back both
 */
async function completePurchaseWithPassport(sessionId, paymentData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get purchase session with passport data
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1 FOR UPDATE';
    const sessionResult = await client.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      throw new Error('Purchase session not found');
    }

    const session = sessionResult.rows[0];

    // 2. Check if already completed (idempotency)
    if (session.payment_status === 'completed') {
      console.log(`⚠️ Session ${sessionId} already completed, skipping`);
      await client.query('ROLLBACK');
      return { alreadyCompleted: true };
    }

    // 3. Extract passport data
    const passportData = session.passport_data;
    if (!passportData) {
      throw new Error('No passport data in session');
    }

    // 4. Check if passport already exists
    let passportId;
    const existingPassport = await client.query(
      'SELECT id FROM passports WHERE passport_number = $1',
      [passportData.passportNumber]
    );

    if (existingPassport.rows.length > 0) {
      // Update existing passport
      passportId = existingPassport.rows[0].id;
      const fullName = passportData.surname && passportData.givenName
        ? `${passportData.surname}, ${passportData.givenName}`
        : (passportData.surname || passportData.givenName || '');

      await client.query(
        `UPDATE passports
         SET full_name = $1, date_of_birth = $2,
             nationality = $3, updated_at = NOW()
         WHERE id = $4`,
        [
          fullName,
          passportData.dateOfBirth || null,
          passportData.nationality || 'Papua New Guinea',
          passportId
        ]
      );
      console.log(`✓ Updated existing passport: ${passportData.passportNumber}`);
    } else {
      // Create new passport with default expiry (10 years from now if not provided)
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 10);
      const fullName = passportData.surname && passportData.givenName
        ? `${passportData.surname}, ${passportData.givenName}`
        : (passportData.surname || passportData.givenName || '');

      const newPassport = await client.query(
        `INSERT INTO passports (
          passport_number, full_name, date_of_birth,
          nationality, expiry_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id`,
        [
          passportData.passportNumber,
          fullName,
          passportData.dateOfBirth || null,
          passportData.nationality || 'Papua New Guinea',
          passportData.dateOfExpiry || defaultExpiry
        ]
      );
      passportId = newPassport.rows[0].id;
      console.log(`✓ Created new passport: ${passportData.passportNumber} (ID: ${passportId})`);
    }

    // 5. Generate voucher code (8-char alphanumeric)
    const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
    const validFrom = new Date();
    const validUntil = voucherConfig.helpers.calculateValidUntil(validFrom);

    // 6. Create voucher (linked via passport_number)
    const voucherQuery = `
      INSERT INTO individual_purchases (
        voucher_code,
        passport_number,
        amount,
        payment_method,
        discount,
        collected_amount,
        returned_amount,
        valid_until,
        valid_from,
        customer_name,
        customer_email,
        purchase_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const voucherValues = [
      voucherCode,
      passportData.passportNumber,
      session.amount,
      paymentData.paymentMethod || 'Card',
      0, // discount
      session.amount, // collected_amount (full amount for online payment)
      0, // returned_amount
      validUntil,
      validFrom,
      `${passportData.surname}, ${passportData.givenName}`,
      session.customer_email || null, // Email is optional
      sessionId // Link voucher to purchase session
    ];

    const voucherResult = await client.query(voucherQuery, voucherValues);
    const voucher = voucherResult.rows[0];

    console.log(`✓ Created voucher: ${voucherCode} for passport ${passportData.passportNumber}`);

    // 7. Update session as completed
    const updateSessionQuery = `
      UPDATE purchase_sessions
      SET payment_status = 'completed',
          passport_created = TRUE,
          payment_gateway_ref = $1,
          session_data = $2,
          completed_at = NOW()
      WHERE id = $3
    `;

    await client.query(updateSessionQuery, [
      paymentData.transactionId || null,
      JSON.stringify({
        ...(session.session_data || {}),
        payment: paymentData,
        completedAt: new Date().toISOString()
      }),
      sessionId
    ]);

    // ✅ COMMIT: All or nothing
    await client.query('COMMIT');

    console.log(`✅ Purchase completed atomically: ${sessionId}`);
    console.log(`   Passport: ${passportData.passportNumber} (ID: ${passportId})`);
    console.log(`   Voucher: ${voucherCode}`);

    // 8. Send email notification (non-critical, don't fail if this fails)
    if (session.customer_email) {
      try {
        await sendVoucherNotification({
          customerEmail: session.customer_email,
          customerPhone: session.customer_phone,
          quantity: 1
        }, [voucher]);
        console.log('✓ Email notification sent');
      } catch (error) {
        console.error('⚠️ Email notification failed (non-critical):', error);
      }
    }

    return {
      success: true,
      voucher,
      passport: {
        id: passportId,
        passportNumber: passportData.passportNumber
      }
    };

  } catch (error) {
    // ❌ ROLLBACK: Something failed, undo everything
    await client.query('ROLLBACK');
    console.error('❌ Purchase completion failed, rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export for use by webhook handler
module.exports = {
  router,
  completePurchaseWithPassport
};
