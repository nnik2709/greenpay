/**
 * DOKU Payment Gateway Webhook Handler
 *
 * Handles webhook notifications from BSP DOKU payment gateway
 * Security: PCI-DSS compliant webhook processing
 *
 * DOKU sends two types of webhooks:
 * 1. Notify - Real-time payment status notification (server-to-server)
 * 2. Redirect - Customer redirect after payment (browser redirect)
 */

const express = require('express');
const router = express.Router();
const PaymentGatewayFactory = require('../services/payment-gateways/PaymentGatewayFactory');
const db = require('../config/database');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const voucherConfig = require('../config/voucherConfig');
const { sendVoucherNotification } = require('../services/notificationService');

// Rate limiting for webhook endpoints (prevent abuse)
const webhookCallCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_CALLS_PER_WINDOW = 100;

/**
 * Check rate limit for IP address
 * @param {string} ip - Client IP address
 * @returns {boolean} True if within rate limit
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `${ip}-${Math.floor(now / RATE_LIMIT_WINDOW)}`;

  const count = webhookCallCounts.get(key) || 0;
  if (count >= MAX_CALLS_PER_WINDOW) {
    return false;
  }

  webhookCallCounts.set(key, count + 1);

  // Clean up old entries
  for (const [k, v] of webhookCallCounts.entries()) {
    if (!k.startsWith(`${ip}-${Math.floor(now / RATE_LIMIT_WINDOW)}`)) {
      webhookCallCounts.delete(k);
    }
  }

  return true;
}

/**
 * Validate DOKU IP addresses (optional but recommended)
 * Add allowed IPs from BSP_DOKU_INTEGRATION_DETAILS.md
 */
const ALLOWED_DOKU_IPS = [
  '103.10.130.75',      // Staging/Test IP 1
  '147.139.130.145',    // Staging/Test IP 2
  '103.10.130.35',      // Production IP 1
  '147.139.129.160',    // Production IP 2
  '127.0.0.1',          // Localhost for testing
  '::1',                // IPv6 localhost
  '::ffff:127.0.0.1',   // IPv6-mapped IPv4 localhost
];

/**
 * Check if request is from allowed DOKU IP
 * @param {string} ip - Client IP address
 * @returns {boolean} True if allowed
 */
function isAllowedIp(ip) {
  // In development/test mode, allow all IPs
  if (process.env.BSP_DOKU_MODE !== 'production') {
    return true;
  }

  // In production, check against whitelist
  return ALLOWED_DOKU_IPS.includes(ip);
}

/**
 * Generate Barcode (CODE-128) as Data URL
 * @param {string} code - Voucher code
 * @returns {string} Base64 data URL of barcode image
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
    console.error('[DOKU] Barcode generation error:', error.message);
    return null;
  }
}

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Create voucher after successful payment
 * This mirrors the voucher creation logic from buy-online.js
 *
 * @param {string} sessionId - Payment session ID (TRANSIDMERCHANT)
 * @param {Object} paymentData - Payment details from DOKU
 * @returns {Promise<Object>} Created voucher
 */
async function createVoucherFromPayment(sessionId, paymentData) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    console.log('[DOKU VOUCHER] Starting voucher creation for session:', sessionId);

    // 1. Get purchase session with passport data
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1 FOR UPDATE';
    const sessionResult = await client.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      throw new Error('Purchase session not found');
    }

    const session = sessionResult.rows[0];

    // 2. Check if already completed (idempotency - prevent duplicate vouchers)
    if (session.payment_status === 'completed') {
      console.log('[DOKU VOUCHER] Session already completed - checking for existing voucher');
      const existingVoucher = await client.query(
        'SELECT * FROM individual_purchases WHERE purchase_session_id = $1',
        [sessionId]
      );

      if (existingVoucher.rows.length > 0) {
        console.log('[DOKU VOUCHER] Existing voucher found - returning:', existingVoucher.rows[0].voucher_code);
        await client.query('COMMIT');
        return existingVoucher.rows[0];
      }

      // Voucher doesn't exist yet - continue with creation
      console.log('[DOKU VOUCHER] No voucher found - creating new voucher despite completed status');
    }

    // 3. Extract passport data from session
    const passportData = session.passport_data;
    if (!passportData) {
      throw new Error('No passport data in session');
    }

    console.log('[DOKU VOUCHER] Passport data:', passportData.passportNumber);

    // 4. Check if passport already exists
    let passportId;
    const existingPassport = await client.query(
      'SELECT id FROM passports WHERE passport_number = $1',
      [passportData.passportNumber]
    );

    if (existingPassport.rows.length > 0) {
      passportId = existingPassport.rows[0].id;
      console.log('[DOKU VOUCHER] Using existing passport ID:', passportId);
    } else {
      // Create new passport record
      // Combine surname and given name into full_name
      const fullName = `${passportData.surname}, ${passportData.givenName}`;

      const newPassport = await client.query(
        `INSERT INTO passports (
          passport_number, full_name, nationality,
          date_of_birth, expiry_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [
          passportData.passportNumber,
          fullName,
          passportData.nationality || null,
          passportData.dateOfBirth || null, // Convert empty string to null
          passportData.expiryDate || null    // Convert empty string to null
        ]
      );
      passportId = newPassport.rows[0].id;
      console.log('[DOKU VOUCHER] Created new passport ID:', passportId);
    }

    // 5. Generate voucher code (8-char alphanumeric)
    const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
    const validFrom = new Date();
    const validUntil = voucherConfig.helpers.calculateValidUntil(validFrom);

    console.log('[DOKU VOUCHER] Generated voucher code:', voucherCode);

    // 6. Create voucher (linked via passport_number)
    const voucherQuery = `
      INSERT INTO individual_purchases (
        voucher_code,
        passport_number,
        amount,
        payment_mode,
        discount,
        collected_amount,
        returned_amount,
        valid_until,
        valid_from,
        customer_name,
        customer_email,
        purchase_session_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const voucherValues = [
      voucherCode,
      passportData.passportNumber,
      session.amount,
      'BSP DOKU Card', // Payment mode
      0, // discount
      session.amount, // collected_amount (full amount for online payment)
      0, // returned_amount
      validUntil,
      validFrom,
      `${passportData.surname}, ${passportData.givenName}`,
      session.customer_email || null,
      sessionId, // Link voucher to purchase session
      'active' // status
    ];

    const voucherResult = await client.query(voucherQuery, voucherValues);
    const voucher = voucherResult.rows[0];

    console.log('[DOKU VOUCHER] Created voucher:', voucherCode, 'for passport', passportData.passportNumber);

    // 8. Update session as completed
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
      paymentData.approvalCode || paymentData.responseCode || null,
      JSON.stringify(paymentData),
      sessionId
    ]);

    console.log('[DOKU VOUCHER] Updated session as completed');

    // 9. Send email notification (async, don't wait)
    if (session.customer_email) {
      console.log('[DOKU VOUCHER] Sending email notification to:', session.customer_email);
      sendVoucherNotification(
        {
          customerEmail: session.customer_email,
          customerPhone: null,
          quantity: 1
        },
        [voucher] // Pass as array
      ).catch(err => {
        console.error('[DOKU VOUCHER] Email notification failed:', err.message);
        // Don't fail the transaction if email fails
      });
    }

    await client.query('COMMIT');
    console.log('[DOKU VOUCHER] ✅ Voucher creation completed successfully');

    return voucher;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DOKU VOUCHER] ❌ Error creating voucher:', error.message);
    console.error('[DOKU VOUCHER] Stack:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * DOKU Notify Webhook
 * Server-to-server notification of payment status
 * Merchant must respond with "CONTINUE"
 *
 * SECURITY: Critical endpoint - validates all requests
 */
router.post('/notify', async (req, res) => {
  const clientIp = getClientIp(req);
  const timestamp = new Date().toISOString();

  try {
    console.log('='.repeat(80));
    console.log('[DOKU NOTIFY] Webhook received at:', timestamp);
    console.log('[DOKU NOTIFY] Client IP:', clientIp);
    console.log('[DOKU NOTIFY] Transaction ID:', req.body.TRANSIDMERCHANT);

    // SECURITY: IP whitelisting check
    if (!isAllowedIp(clientIp)) {
      console.error('[DOKU NOTIFY] SECURITY: Unauthorized IP address:', clientIp);
      return res.status(403).send('STOP');
    }

    // SECURITY: Rate limiting
    if (!checkRateLimit(clientIp)) {
      console.error('[DOKU NOTIFY] SECURITY: Rate limit exceeded for IP:', clientIp);
      return res.status(429).send('STOP');
    }

    // Validate request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('[DOKU NOTIFY] SECURITY: Empty request body');
      return res.status(400).send('STOP');
    }

    // Get BSP gateway instance
    const gateway = PaymentGatewayFactory.getGateway('bsp');

    // SECURITY: Verify WORDS signature with constant-time comparison
    try {
      gateway.verifyWebhookSignature(req.body);
      console.log('[DOKU NOTIFY] Signature verified successfully');
    } catch (error) {
      console.error('[DOKU NOTIFY] SECURITY: Signature verification failed:', error.message);
      console.error('[DOKU NOTIFY] Payload:', JSON.stringify(req.body, null, 2));
      return res.status(400).send('STOP');
    }

    // Process webhook event
    const result = await gateway.processWebhookEvent(req.body);

    if (!result.success) {
      console.error('[DOKU NOTIFY] Webhook processing failed');
      return res.status(400).send('STOP');
    }

    // Extract transaction details
    const { sessionId, status, data } = result;

    console.log('[DOKU NOTIFY] Processing transaction update');
    console.log('[DOKU NOTIFY] Session ID:', sessionId);
    console.log('[DOKU NOTIFY] Status:', status);
    console.log('[DOKU NOTIFY] Response Code:', data.responseCode);

    // Update purchase session status in database with proper error handling
    try {
      const updateResult = await db.query(
        `UPDATE purchase_sessions
         SET
           payment_status = $1::text,
           payment_gateway_ref = $2::text,
           completed_at = CASE WHEN $1::text = 'completed' THEN NOW() ELSE completed_at END
         WHERE id = $3::text
         RETURNING id, payment_status`,
        [status, data.approvalCode || data.responseCode || null, sessionId]
      );

      if (updateResult.rowCount === 0) {
        console.warn('[DOKU NOTIFY] WARNING: Purchase session not found in database:', sessionId);
        // Still return CONTINUE to avoid DOKU retries
      } else {
        console.log('[DOKU NOTIFY] ✅ Purchase session updated successfully');
        console.log('[DOKU NOTIFY] Session ID:', updateResult.rows[0].id);
        console.log('[DOKU NOTIFY] New status:', updateResult.rows[0].payment_status);
      }

    } catch (dbError) {
      console.error('[DOKU NOTIFY] ❌ Database update error:', dbError.message);
      console.error('[DOKU NOTIFY] SQL State:', dbError.code);
      // Still return CONTINUE to avoid DOKU retries causing duplicate notifications
    }

    // Create voucher if payment was successful
    if (status === 'completed') {
      console.log('[DOKU NOTIFY] Payment successful - creating voucher');
      try {
        const voucher = await createVoucherFromPayment(sessionId, data);
        console.log('[DOKU NOTIFY] ✅ Voucher created successfully:', voucher.voucher_code);
      } catch (voucherError) {
        console.error('[DOKU NOTIFY] ❌ Voucher creation failed:', voucherError.message);
        console.error('[DOKU NOTIFY] Stack:', voucherError.stack);
        // IMPORTANT: Still return CONTINUE to DOKU even if voucher creation fails
        // This prevents DOKU from retrying the webhook
        // The transaction is marked as completed, so customer can contact support
        console.warn('[DOKU NOTIFY] WARNING: Payment successful but voucher creation failed');
        console.warn('[DOKU NOTIFY] WARNING: Customer should contact support with session ID:', sessionId);
      }
    } else {
      console.log('[DOKU NOTIFY] Payment status:', status, '- no voucher created');
    }

    // Must respond with "CONTINUE" for DOKU to complete the transaction
    console.log('[DOKU NOTIFY] Responding with CONTINUE');
    console.log('='.repeat(80));
    res.send('CONTINUE');

  } catch (error) {
    console.error('[DOKU NOTIFY] ❌ Unexpected error:', error.message);
    console.error('[DOKU NOTIFY] Stack trace:', error.stack);
    console.log('='.repeat(80));
    res.status(500).send('STOP');
  }
});

/**
 * DOKU Redirect Webhook
 * Customer is redirected here after payment (success or failure)
 *
 * SECURITY: Less critical than Notify (customer-facing), but still validated
 */
router.post('/redirect', async (req, res) => {
  const clientIp = getClientIp(req);
  const timestamp = new Date().toISOString();

  try {
    console.log('='.repeat(80));
    console.log('[DOKU REDIRECT] Webhook received at:', timestamp);
    console.log('[DOKU REDIRECT] Client IP:', clientIp);
    console.log('[DOKU REDIRECT] Transaction ID:', req.body.TRANSIDMERCHANT);

    // Extract response parameters
    const {
      TRANSIDMERCHANT,
      STATUSCODE,
      RESULTMSG,
      WORDS,
      AMOUNT,
      SESSIONID
    } = req.body;

    // Validate required parameters
    if (!TRANSIDMERCHANT || !STATUSCODE) {
      console.error('[DOKU REDIRECT] Missing required parameters');
      return res.redirect('https://greenpay.eywademo.cloud/payment/failure?error=Invalid+response');
    }

    console.log('[DOKU REDIRECT] Status Code:', STATUSCODE);
    console.log('[DOKU REDIRECT] Result:', RESULTMSG);

    // Redirect to appropriate page based on status
    const isSuccess = STATUSCODE === '0000';

    if (isSuccess) {
      console.log('[DOKU REDIRECT] ✅ Payment successful - redirecting to success page');
      console.log('='.repeat(80));
      // Redirect to success page with transaction ID
      res.redirect(`https://greenpay.eywademo.cloud/payment/success?session=${encodeURIComponent(TRANSIDMERCHANT)}`);
    } else {
      console.log('[DOKU REDIRECT] ❌ Payment failed - redirecting to failure page');
      console.log('='.repeat(80));
      // Redirect to failure page with error message
      const errorMsg = RESULTMSG || 'Payment failed';
      res.redirect(`https://greenpay.eywademo.cloud/payment/failure?session=${encodeURIComponent(TRANSIDMERCHANT)}&error=${encodeURIComponent(errorMsg)}`);
    }

  } catch (error) {
    console.error('[DOKU REDIRECT] ❌ Error processing redirect:', error.message);
    console.log('='.repeat(80));
    res.redirect('https://greenpay.eywademo.cloud/payment/failure?error=System+error');
  }
});

module.exports = router;
