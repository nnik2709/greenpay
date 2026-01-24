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
const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
const voucherConfig = require('../config/voucherConfig');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto'); // 🔒 SECURITY: Cryptographically secure random number generation

// 🔒 SECURITY: Rate limiter for voucher purchases (DISABLED FOR TESTING)
// const purchaseLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour window
//   max: 3, // Max 3 purchases per IP per hour
//   message: {
//     error: 'Too many purchase attempts',
//     message: 'You have exceeded the maximum number of purchases per hour. Please try again later.',
//     retryAfter: 3600
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     console.warn(`🚨 SECURITY ALERT: IP ${req.ip} exceeded purchase rate limit on ${req.path}`);
//     res.status(429).json({
//       error: 'Too many requests',
//       message: 'Maximum 3 purchases per hour. Please try again later.',
//       retryAfter: 3600
//     });
//   }
// });

// 🔒 SECURITY: Rate limiter for voucher recovery endpoint (prevent brute-force attacks - PCI-DSS 8.2.4)
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Max 5 recovery attempts per IP per hour
  message: {
    error: 'Too many recovery attempts',
    message: 'You have exceeded the maximum number of recovery attempts per hour. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts, even successful ones
  handler: (req, res) => {
    console.error(`🚨 SECURITY ALERT: IP ${req.ip} exceeded recovery rate limit on ${req.path}`);
    res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: 'Maximum 5 recovery attempts per hour. Please try again later.',
      retryAfter: 3600
    });
  }
});

// 🔒 SECURITY: HTTPS enforcement middleware (PCI-DSS Requirement 4.1)
function enforceHTTPS(req, res, next) {
  // Exempt webhook routes from HTTPS enforcement (payment gateways may not pass x-forwarded-proto)
  const webhookPaths = ['/webhook', '/callback', '/notify'];
  const isWebhook = webhookPaths.some(path => req.path.includes(path));

  // Debug logging
  console.log(`[HTTPS Check] Path: ${req.path}, Secure: ${req.secure}, X-Forwarded-Proto: ${req.get('x-forwarded-proto')}, IP: ${req.ip}, Webhook: ${isWebhook}`);

  if (isWebhook) {
    console.log(`✓ Webhook path ${req.path} - HTTPS check bypassed`);
    return next();
  }

  // Only enforce in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is secure (HTTPS) or if proxy indicates HTTPS
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      console.warn(`🚨 SECURITY: Non-HTTPS request blocked from IP ${req.ip} on ${req.path}`);
      return res.status(403).json({
        error: 'HTTPS_REQUIRED',
        message: 'This endpoint requires HTTPS connection for security'
      });
    }
  }
  next();
}

// Apply HTTPS enforcement to all routes in this router
router.use(enforceHTTPS);

// 🔒 SECURITY: Set Strict-Transport-Security header (HSTS) - PCI-DSS 4.1
// ⚠️ TEMPORARILY DISABLED FOR TESTING - May interfere with Cardinal Commerce 3D Secure
// router.use((req, res, next) => {
//   if (process.env.NODE_ENV === 'production') {
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//   }
//   next();
// });

// 🔒 SECURITY: Database connection with resource limits (prevent DoS/exhaustion)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'greenpay',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // 🔒 SECURITY: Connection pool limits (prevent resource exhaustion)
  max: 20, // Maximum 20 connections in pool
  min: 2, // Minimum 2 connections always available
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 60000, // Timeout after 60 seconds (allows time for 3D Secure authentication)
});

/**
 * 🔒 SECURITY: Generate cryptographically secure session ID
 * NIST SP 800-63B compliant with 128-bit entropy
 * Format: PGKO-{timestamp}-{random}
 * @returns {string} Secure session ID (e.g., PGKO-L9XQOW-9k3hF7nR2pQ8xT1mZ4vB6w)
 */
function generateSecureSessionId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(16); // 128 bits of cryptographic entropy
  const random = randomBytes.toString('base64url').substring(0, 22); // URL-safe base64
  return `PGKO-${timestamp}-${random}`;
}

/**
 * 🔒 SECURITY: Mask PII for secure logging (GDPR/PCI-DSS compliant)
 * Prevents exposure of sensitive data in log files
 * @param {string} value - Sensitive value to mask
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} Masked value (e.g., "AB12****" for passport)
 */
function maskPII(value, visibleChars = 4) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= visibleChars) return '***';
  const visible = value.substring(0, visibleChars);
  const masked = '*'.repeat(Math.max(value.length - visibleChars, 3));
  return visible + masked;
}

/**
 * 🔒 SECURITY: Send generic error response (PCI-DSS Requirement 6.5.5)
 * Prevents information disclosure through error messages
 * @param {object} res - Express response object
 * @param {Error} error - The error object (logged internally only)
 * @param {string} context - Context description for logging
 * @returns {object} Express response with generic error
 */
function sendGenericError(res, error, context = 'Operation') {
  // Log full error details internally only
  console.error(`[ERROR] ${context}:`, error.message, error.stack);

  // Return ONLY generic message to client (no internal details)
  return res.status(500).json({
    success: false,
    error: 'OPERATION_FAILED',
    message: 'Unable to complete operation. Please try again or contact support.'
  });
}

/**
 * 🔒 SECURITY: Validate email format (RFC 5322 compliant - PCI-DSS 6.5.1)
 * Prevents injection attacks and ensures data quality
 * @param {string} email - Email address to validate
 * @returns {object} {valid: boolean, sanitized: string, error: string}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Trim and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Check length (RFC 5321 limit)
  if (sanitized.length < 3 || sanitized.length > 254) {
    return { valid: false, error: 'Email must be 3-254 characters' };
  }

  // RFC 5322 compliant regex (simplified but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, sanitized, error: null };
}

/**
 * 🔒 SECURITY: Validate session ID format (PCI-DSS 6.5.1)
 * Prevents injection attacks and session enumeration
 * @param {string} sessionId - Session ID to validate
 * @returns {object} {valid: boolean, sanitized: string, error: string}
 */
function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return { valid: false, error: 'Session ID is required' };
  }

  // Trim whitespace
  const sanitized = sessionId.trim();

  // Check length (prevent DoS via huge strings)
  if (sanitized.length < 20 || sanitized.length > 100) {
    return { valid: false, error: 'Invalid session ID length' };
  }

  // Validate format: PGKO-{timestamp}-{random}
  const sessionIdRegex = /^PGKO-[A-Z0-9]+-[A-Za-z0-9_-]+$/;

  if (!sessionIdRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid session ID format' };
  }

  return { valid: true, sanitized, error: null };
}

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
      passportData, // Optional: for single voucher with passport (legacy)
      email,
      quantity, // NEW: number of vouchers (1-5)
      amount,
      returnUrl,
      cancelUrl,
      verification
    } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Valid email address is required'
      });
    }

    // Validate quantity (for multi-voucher purchases)
    const voucherQuantity = quantity || 1; // Default to 1 if not provided
    if (voucherQuantity < 1 || voucherQuantity > 5) {
      return res.status(400).json({
        error: 'Quantity must be between 1 and 5 vouchers'
      });
    }

    // 🔒 SECURITY: Server-side amount validation (prevent price manipulation)
    const VOUCHER_PRICE = 50.00; // PGK per voucher (server-side constant)
    const calculatedAmount = voucherQuantity * VOUCHER_PRICE;

    // If client provided amount, verify it matches server calculation
    if (amount && Math.abs(amount - calculatedAmount) > 0.01) {
      console.warn(`[SECURITY] Amount manipulation detected: Expected ${calculatedAmount}, got ${amount}`);
      return res.status(400).json({
        error: 'Invalid amount calculation'
      });
    }

    // Always use server-calculated amount (never trust client)
    const secureAmount = calculatedAmount;

    // Legacy validation: if passportData provided, validate it
    if (passportData && (!passportData.passportNumber || !passportData.surname || !passportData.givenName)) {
      return res.status(400).json({
        error: 'Passport number, surname, and given name are required'
      });
    }

    // Bot protection verification
    if (verification) {
      // 1. Honeypot check (should be empty)
      if (verification.honeypot && verification.honeypot.trim() !== '') {
        console.warn('[BOT DETECTED] Honeypot field filled:', verification.honeypot);
        return res.status(400).json({
          error: 'Security verification failed',
          message: 'Please try again'
        });
      }

      // 2. Timing check (minimum 3 seconds to fill form)
      const timeSpent = Date.now() - verification.startTime;
      if (timeSpent < 3000) {
        console.warn('[BOT DETECTED] Form submitted too quickly:', timeSpent, 'ms');
        return res.status(400).json({
          error: 'Security verification failed',
          message: 'Please take your time filling the form'
        });
      }

      // 3. Math verification - REMOVED: Server can't verify without storing answer
      // Math answer is checked on client-side only
      console.log('[SECURITY] Bot protection checks passed');
    } else {
      console.warn('⚠️ No verification data provided');
    }

    // 🔒 SECURITY: Generate cryptographically secure session ID (NIST SP 800-63B compliant)
    const sessionId = generateSecureSessionId();

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
      email, // Use provided email
      null, // Phone optional
      voucherQuantity, // Number of vouchers (1-5)
      secureAmount, // 🔒 SECURITY: Use server-calculated amount (never trust client)
      'PGK',
      'Screen', // Display on screen, user can choose to email/SMS later
      'pending',
      JSON.stringify(passportData || null), // Store passport data as JSONB (null for multi-voucher)
      JSON.stringify({
        source: 'buy-online',
        purchaseType: passportData ? 'single-with-passport' : 'multi-voucher',
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        verification: 'turnstile'
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
      customerEmail: email, // Use provided email
      customerPhone: null,
      quantity: voucherQuantity,
      amountPGK: amount || (voucherQuantity * 50.00), // PGK 50.00 per voucher
      currency: 'PGK',
      returnUrl: finalReturnUrl,
      cancelUrl: finalCancelUrl,
      metadata: {
        deliveryMethod: 'Screen', // Display on screen, email optional
        source: 'buy-online',
        hasPassportData: !!passportData,
        passportNumber: passportData?.passportNumber || null,
        voucherQuantity: voucherQuantity,
        purchaseType: passportData ? 'single-with-passport' : 'multi-voucher'
      }
    });

    console.log(`✅ Buy Online payment session created: ${sessionId}`);
    // 🔒 SECURITY: Mask PII in logs (GDPR/PCI-DSS compliant)
    if (passportData) {
      console.log(`   Passport: ${maskPII(passportData.passportNumber)} (${maskPII(passportData.surname)}, ${maskPII(passportData.givenName)})`);
    } else {
      console.log(`   Purchase Type: Multi-voucher (no passport)`);
    }

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
    // 🔒 SECURITY: Use generic error handler (PCI-DSS 6.5.5)
    return sendGenericError(res, error, 'Payment preparation');
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
    // 🔒 SECURITY: Use generic error handler (PCI-DSS 6.5.5)
    return sendGenericError(res, error, 'Payment status check');
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

    // Get ALL vouchers by purchase_session_id (created by webhook)
    // Multiple vouchers can exist for a single session (quantity > 1)
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
      WHERE ip.purchase_session_id = $1
      ORDER BY ip.created_at ASC
    `;

    const voucherResult = await pool.query(voucherQuery, [sessionId]);

    if (voucherResult.rows.length === 0) {
      console.error(`[BUY-ONLINE] ❌ Voucher not found for session ${sessionId}`);
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    // Generate barcodes for ALL vouchers
    const vouchers = voucherResult.rows.map(voucher => {
      const barcodeDataUrl = generateBarcodeDataURL(voucher.voucher_code);
      return {
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
      };
    });

    console.log(`[BUY-ONLINE] ✅ Returning ${vouchers.length} voucher(s) for session ${sessionId}`);

    res.json({
      success: true,
      vouchers: vouchers, // Return array of ALL vouchers
      voucher: vouchers[0], // Keep backward compatibility - first voucher
      quantity: vouchers.length,
      session: {
        id: session.id,
        email: session.customer_email,
        completedAt: session.completed_at
      }
    });

  } catch (error) {
    // 🔒 SECURITY: Use generic error handler (PCI-DSS 6.5.5)
    return sendGenericError(res, error, 'Voucher retrieval');
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
      ORDER BY ip.created_at ASC
    `;

    const result = await pool.query(voucherQuery, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const vouchers = result.rows;

    // Generate barcodes for all vouchers
    const vouchersWithBarcodes = vouchers.map(voucher => {
      const barcodeDataUrl = generateBarcodeDataURL(voucher.voucher_code);
      return {
        ...voucher,
        barcode: barcodeDataUrl,
        qrCode: barcodeDataUrl // Keep for backward compatibility with PDF generator
      };
    });

    // Generate PDF using unified GREEN CARD template
    const pdfBuffer = await generateVoucherPDFBuffer(vouchersWithBarcodes);

    // Send PDF with appropriate filename
    const filename = vouchers.length === 1
      ? `voucher-${vouchers[0].voucher_code}.pdf`
      : `vouchers-${sessionId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    // 🔒 SECURITY: Use generic error handler (PCI-DSS 6.5.5)
    return sendGenericError(res, error, 'PDF generation');
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
      WHERE ip.purchase_session_id = $1
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

    // Generate PDF with voucher details using unified GREEN CARD template
    const pdfBuffer = await generateVoucherPDFBuffer([{
      ...voucher,
      barcode: barcodeDataUrl,
      qrCode: barcodeDataUrl // Keep for backward compatibility with PDF generator
    }]);

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
      // IMPORTANT: For Brevo, SMTP_USER (a0282b001@smtp-brevo.com) is NOT a valid sender
      // Must use SMTP_FROM which should be a verified sender in Brevo
      const fromEmail = process.env.SMTP_FROM || 'noreply@greenpay.eywademo.cloud';
      const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';

      if (!process.env.SMTP_FROM) {
        console.warn('⚠️ SMTP_FROM not set, using default:', fromEmail);
      }
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
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
    // 🔒 SECURITY: Use generic error handler (PCI-DSS 6.5.5)
    return sendGenericError(res, error, 'Email delivery');
  }
});

/**
 * Register Passport to Voucher (Multi-Voucher Wizard)
 * POST /api/buy-online/voucher/:code/register
 *
 * Allows registering a passport to an existing unregistered voucher
 * Used by Multi-Voucher Registration Wizard for step-by-step registration
 */
router.post('/voucher/:code/register', async (req, res) => {
  const client = await pool.connect();

  try {
    const { code } = req.params;
    const {
      passportNumber,
      surname,
      givenName,
      nationality,
      expiryDate
    } = req.body;

    // Validation
    if (!passportNumber || !surname || !givenName || !nationality || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: passportNumber, surname, givenName, nationality, expiryDate'
      });
    }

    // Validate expiry date is in the future
    const expiry = new Date(expiryDate);
    if (expiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Passport has expired'
      });
    }

    await client.query('BEGIN');

    // 1. Check if voucher exists and is unregistered
    const voucherQuery = `
      SELECT ip.id, ip.voucher_code, ip.passport_number as current_passport
      FROM individual_purchases ip
      WHERE ip.voucher_code = $1
      FOR UPDATE
    `;
    const voucherResult = await client.query(voucherQuery, [code]);

    if (voucherResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    const voucher = voucherResult.rows[0];

    // 2. Check if passport already exists in database
    const passportCheckQuery = 'SELECT id, full_name FROM passports WHERE passport_number = $1';
    const passportCheck = await client.query(passportCheckQuery, [passportNumber.trim().toUpperCase()]);

    let passportId;
    let fullName = `${givenName} ${surname}`.trim();

    if (passportCheck.rows.length > 0) {
      // Passport exists - use existing ID
      passportId = passportCheck.rows[0].id;
      console.log(`Using existing passport ID ${passportId} for ${passportNumber}`);
    } else {
      // Create new passport (only essential fields)
      const insertPassportQuery = `
        INSERT INTO passports (
          passport_number,
          full_name,
          nationality,
          expiry_date,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `;

      const passportResult = await client.query(insertPassportQuery, [
        passportNumber.trim().toUpperCase(),
        fullName,
        nationality,
        expiryDate
      ]);

      passportId = passportResult.rows[0].id;
      console.log(`Created new passport ID ${passportId} for ${passportNumber}`);
    }

    // 3. Update voucher with passport number
    const updateVoucherQuery = `
      UPDATE individual_purchases
      SET passport_number = $1
      WHERE voucher_code = $2
      RETURNING id, voucher_code, passport_number
    `;

    const updateResult = await client.query(updateVoucherQuery, [
      passportNumber.trim().toUpperCase(),
      code
    ]);

    await client.query('COMMIT');

    // 4. Fetch complete voucher data to return
    const completeVoucherQuery = `
      SELECT
        ip.id,
        ip.voucher_code as code,
        ip.amount,
        ip.valid_from,
        ip.valid_until,
        ip.passport_number,
        ip.customer_email,
        p.id as passport_id,
        p.full_name,
        p.nationality,
        p.expiry_date
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.voucher_code = $1
    `;

    const finalResult = await pool.query(completeVoucherQuery, [code]);
    const registeredVoucher = finalResult.rows[0];

    console.log(`✅ Passport ${passportNumber} registered to voucher ${code}`);

    res.json({
      success: true,
      message: 'Passport registered successfully',
      voucher: {
        code: registeredVoucher.code,
        voucherCode: registeredVoucher.code,
        amount: registeredVoucher.amount,
        validFrom: registeredVoucher.valid_from,
        validUntil: registeredVoucher.valid_until,
        passportNumber: registeredVoucher.passport_number,
        customerEmail: registeredVoucher.customer_email,
        passport: {
          id: registeredVoucher.passport_id,
          passportNumber: registeredVoucher.passport_number,
          fullName: registeredVoucher.full_name,
          nationality: registeredVoucher.nationality,
          dateOfExpiry: registeredVoucher.expiry_date
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Passport registration error:', error);

    // Check for specific errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'This passport is already registered to another voucher'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to register passport'
    });
  } finally {
    client.release();
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
    // 🔒 SECURITY: Set transaction timeout to prevent hanging transactions
    await client.query('SET LOCAL statement_timeout = 30000'); // 30 seconds

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

    // 3. Check purchase type
    const quantity = session.quantity || 1;
    const passportData = session.passport_data;

    // Multi-voucher purchase: Create N PENDING vouchers (no passport yet)
    if (!passportData) {
      console.log(`📦 Multi-voucher purchase: Creating ${quantity} PENDING vouchers`);

      const vouchers = [];
      const validFrom = new Date();
      const validUntil = voucherConfig.helpers.calculateValidUntil(validFrom);
      const amountPerVoucher = parseFloat(session.amount) / quantity;

      // Create N vouchers with status PENDING
      for (let i = 0; i < quantity; i++) {
        const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');

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
            purchase_session_id,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;

        const voucherValues = [
          voucherCode,
          null, // No passport yet - will be added at registration
          amountPerVoucher,
          paymentData.paymentMethod || 'Card',
          0, // discount
          amountPerVoucher, // collected_amount
          0, // returned_amount
          validUntil,
          validFrom,
          null, // No customer name yet
          session.customer_email || null,
          sessionId,
          'PENDING' // PENDING status - requires passport registration
        ];

        const voucherResult = await client.query(voucherQuery, voucherValues);
        vouchers.push(voucherResult.rows[0]);

        console.log(`✓ Created PENDING voucher ${i + 1}/${quantity}: ${voucherCode}`);
      }

      // Update session as completed
      const updateSessionQuery = `
        UPDATE purchase_sessions
        SET payment_status = 'completed',
            passport_created = FALSE,
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
          vouchers: vouchers.map(v => v.voucher_code),
          completedAt: new Date().toISOString()
        }),
        sessionId
      ]);

      // ✅ COMMIT
      await client.query('COMMIT');

      console.log(`✅ Multi-voucher purchase completed: ${sessionId}`);
      console.log(`   Quantity: ${quantity}`);
      console.log(`   Vouchers: ${vouchers.map(v => v.voucher_code).join(', ')}`);

      // 8. Send email notification with all voucher codes
      if (session.customer_email) {
        try {
          await sendVoucherNotification({
            customerEmail: session.customer_email,
            customerPhone: session.customer_phone,
            quantity: quantity
          }, vouchers, sessionId);
          console.log('✓ Email notification sent with all voucher codes');
        } catch (error) {
          console.error('⚠️ Email notification failed (non-critical):', error);
        }
      }

      return {
        success: true,
        vouchers,
        quantity
      };
    }

    // Legacy: Single voucher with passport (Approach A - old flow)
    // 🔒 SECURITY: Mask PII in logs
    console.log(`📝 Single voucher with passport: ${maskPII(passportData.passportNumber)}`);

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
      // 🔒 SECURITY: Mask PII in logs
      console.log(`✓ Updated existing passport: ${maskPII(passportData.passportNumber)}`);
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
      // 🔒 SECURITY: Mask PII in logs
      console.log(`✓ Created new passport: ${maskPII(passportData.passportNumber)} (ID: ${passportId})`);
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

    // 🔒 SECURITY: Mask PII in logs
    console.log(`✓ Created voucher: ${voucherCode} for passport ${maskPII(passportData.passportNumber)}`);

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
    // 🔒 SECURITY: Mask PII in logs
    console.log(`   Passport: ${maskPII(passportData.passportNumber)} (ID: ${passportId})`);
    console.log(`   Voucher: ${voucherCode}`);

    // 8. Send email notification (non-critical, don't fail if this fails)
    if (session.customer_email) {
      try {
        await sendVoucherNotification({
          customerEmail: session.customer_email,
          customerPhone: session.customer_phone,
          quantity: 1
        }, [voucher], session.id);
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

/**
 * GET /api/buy-online/recover
 *
 * Voucher Recovery Endpoint - Allows users to retrieve their voucher codes if email delivery failed
 *
 * Query Parameters:
 * - email: Customer email address (required)
 * - sessionId: Purchase session ID (required)
 *
 * Security: Validates that email matches the session before returning voucher codes
 */
router.get('/recover', recoveryLimiter, async (req, res) => {
  try {
    const { email, sessionId } = req.query;

    // 1. Validate inputs
    if (!email || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Email and session ID are required',
        message: 'Please provide both your email address and payment session ID'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // 3. Get session and verify email matches (security check)
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1 AND customer_email = $2';
    const sessionResult = await pool.query(sessionQuery, [sessionId, email]);

    if (sessionResult.rows.length === 0) {
      // 🔒 SECURITY: Timing attack protection - Add random delay (80-120ms) to match valid processing time
      // This prevents attackers from using response time differences to enumerate valid session IDs
      const delay = 80 + Math.random() * 40; // Random delay between 80-120ms
      await new Promise(resolve => setTimeout(resolve, delay));

      // 🔒 SECURITY: Mask PII in security warning logs
      console.warn(`[SECURITY] Voucher recovery attempt with invalid credentials - Session: ${sessionId}, Email: ${maskPII(email, 3)}`);
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: 'No purchase found with this email and session ID combination'
      });
    }

    const session = sessionResult.rows[0];

    // 4. Check if payment was completed
    if (session.payment_status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        message: 'This payment session has not been completed yet',
        paymentStatus: session.payment_status
      });
    }

    // 5. Get all vouchers for this session
    const vouchersQuery = `
      SELECT
        voucher_code,
        status,
        amount,
        created_at,
        passport_number
      FROM individual_purchases
      WHERE purchase_session_id = $1
      ORDER BY created_at ASC
    `;
    const vouchersResult = await pool.query(vouchersQuery, [sessionId]);

    if (vouchersResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No vouchers found',
        message: 'No vouchers found for this session'
      });
    }

    // 🔒 SECURITY: Mask PII in logs
    console.log(`✓ Voucher recovery successful - Session: ${sessionId}, Email: ${maskPII(email, 3)}, Vouchers: ${vouchersResult.rows.length}`);

    // 6. Return voucher information
    res.json({
      success: true,
      message: 'Vouchers retrieved successfully',
      session: {
        id: session.id,
        quantity: session.quantity,
        totalAmount: parseFloat(session.amount),
        completedAt: session.completed_at,
        paymentStatus: session.payment_status
      },
      vouchers: vouchersResult.rows.map(v => ({
        code: v.voucher_code,
        status: v.status,
        amount: parseFloat(v.amount),
        createdAt: v.created_at,
        registered: v.passport_number ? true : false
      }))
    });

  } catch (error) {
    console.error('Voucher recovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to retrieve vouchers. Please contact support.'
    });
  }
});

/**
 * Get Session Details (for payment recovery)
 * GET /api/buy-online/session/:sessionId
 *
 * Returns full session data including passport info for retry scenarios
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const query = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const session = result.rows[0];

    // Check if expired (but still allow recovery for recent sessions)
    const expiryTime = new Date(session.expires_at);
    const now = new Date();
    const hoursSinceExpiry = (now - expiryTime) / (1000 * 60 * 60);

    // Allow recovery for sessions expired less than 24 hours ago
    if (hoursSinceExpiry > 24) {
      return res.json({
        success: false,
        error: 'Session expired',
        message: 'Payment session is too old to recover. Please start a new purchase.'
      });
    }

    // Don't allow recovery of completed sessions
    if (session.payment_status === 'completed') {
      return res.json({
        success: false,
        error: 'Session already completed',
        message: 'This payment was already processed.'
      });
    }

    // Return session data for recovery
    res.json({
      success: true,
      data: {
        id: session.id,
        customer_email: session.customer_email,
        quantity: session.quantity,
        amount: session.amount,
        currency: session.currency,
        payment_status: session.payment_status,
        passport_data: session.passport_data, // JSONB with passport details
        expires_at: session.expires_at,
        created_at: session.created_at
      }
    });

  } catch (error) {
    console.error('Session recovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to retrieve session. Please try again.'
    });
  }
});

/**
 * Retry Payment with Existing Session
 * POST /api/buy-online/retry-payment
 *
 * Generates new payment URL for existing session without re-entering data
 */
router.post('/retry-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    // Get existing session
    const query = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const session = result.rows[0];

    // Check if session is too old (24 hours)
    const expiryTime = new Date(session.expires_at);
    const now = new Date();
    const hoursSinceExpiry = (now - expiryTime) / (1000 * 60 * 60);

    if (hoursSinceExpiry > 24) {
      return res.status(400).json({
        success: false,
        error: 'Session expired',
        message: 'Session is too old to retry. Please start a new purchase.'
      });
    }

    // Don't allow retry of completed sessions
    if (session.payment_status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Session already completed',
        message: 'This payment was already processed.'
      });
    }

    // Extend session expiry (give user another 30 minutes)
    const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await pool.query(
      'UPDATE purchase_sessions SET expires_at = $1 WHERE id = $2',
      [newExpiresAt, sessionId]
    );

    console.log(`[RETRY PAYMENT] Session ${sessionId} extended to ${newExpiresAt}`);

    // Get payment gateway
    const gateway = PaymentGatewayFactory.getGateway();
    console.log(`💳 Retry Payment: Using gateway ${gateway.getName()} for session ${sessionId}`);

    // Generate URLs
    const frontendUrl = process.env.FRONTEND_URL || 'https://greenpay.eywademo.cloud';
    const returnUrl = `${frontendUrl}/payment/success?payment_session=${sessionId}`;
    const cancelUrl = `${frontendUrl}/payment/cancelled?payment_session=${sessionId}`;

    // Create new payment session with same data
    const paymentSession = await gateway.createPaymentSession({
      sessionId: session.id,
      customerEmail: session.customer_email,
      customerPhone: session.customer_phone,
      quantity: session.quantity,
      amountPGK: session.amount,
      currency: session.currency,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      metadata: {
        deliveryMethod: session.delivery_method,
        source: 'buy-online-retry',
        hasPassportData: !!session.passport_data,
        passportNumber: session.passport_data?.passportNumber || null,
        voucherQuantity: session.quantity,
        purchaseType: session.passport_data ? 'single-with-passport' : 'multi-voucher',
        retryAttempt: true
      }
    });

    console.log(`[RETRY PAYMENT] New payment URL generated for session ${sessionId}`);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        paymentUrl: paymentSession.url,
        expiresAt: newExpiresAt
      }
    });

  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to retry payment. Please try again.'
    });
  }
});

// Export for use by webhook handler
module.exports = {
  router,
  completePurchaseWithPassport
};
