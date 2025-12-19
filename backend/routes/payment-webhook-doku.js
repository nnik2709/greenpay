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
const pool = require('../config/database');

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

    // Update transaction status in database with proper error handling
    try {
      const updateResult = await pool.query(
        `UPDATE payment_gateway_transactions
         SET
           status = $1,
           gateway_response = $2,
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
         WHERE session_id = $3
         RETURNING id, status`,
        [status, JSON.stringify(data), sessionId]
      );

      if (updateResult.rowCount === 0) {
        console.warn('[DOKU NOTIFY] WARNING: Transaction not found in database:', sessionId);
        // Still return CONTINUE to avoid DOKU retries
      } else {
        console.log('[DOKU NOTIFY] ✅ Transaction updated successfully');
        console.log('[DOKU NOTIFY] Record ID:', updateResult.rows[0].id);
        console.log('[DOKU NOTIFY] New status:', updateResult.rows[0].status);
      }

    } catch (dbError) {
      console.error('[DOKU NOTIFY] ❌ Database update error:', dbError.message);
      console.error('[DOKU NOTIFY] SQL State:', dbError.code);
      // Still return CONTINUE to avoid DOKU retries causing duplicate notifications
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
