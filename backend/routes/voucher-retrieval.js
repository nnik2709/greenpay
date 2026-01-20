/**
 * Voucher Retrieval Endpoint
 *
 * Safety net for customers who:
 * - Lost their email with vouchers
 * - Had voucher generation fail after successful payment
 * - Need to retrieve their vouchers again
 *
 * Security: Email verification required to prevent unauthorized access
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendVoucherNotification } = require('../services/notificationService');

// Import the voucher creation function from webhook
const { createVoucherFromPayment } = require('./payment-webhook-doku');

// Rate limiting for retrieval endpoint (prevent brute force)
const retrievalAttempts = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Check rate limit for IP + email combination
 * @param {string} ip - Client IP address
 * @param {string} email - Email address
 * @returns {boolean} True if within rate limit
 */
function checkRateLimit(ip, email) {
  const now = Date.now();
  const key = `${ip}-${email}-${Math.floor(now / RATE_LIMIT_WINDOW)}`;

  const count = retrievalAttempts.get(key) || 0;
  if (count >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  retrievalAttempts.set(key, count + 1);

  // Clean up old entries
  for (const [k, v] of retrievalAttempts.entries()) {
    if (!k.includes(`-${Math.floor(now / RATE_LIMIT_WINDOW)}`)) {
      retrievalAttempts.delete(k);
    }
  }

  return true;
}

/**
 * POST /api/voucher-retrieval/retrieve
 *
 * Retrieve vouchers for a completed payment session
 *
 * Body:
 * - sessionId: Payment session ID (e.g., PGKO-XXX-XXX)
 * - email: Email address used for purchase
 */
router.post('/retrieve', async (req, res) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    console.log('[VOUCHER RETRIEVAL] Request received from IP:', clientIp);

    // 1. Extract and validate inputs
    const { sessionId, email } = req.body;

    if (!sessionId || !email) {
      console.log('[VOUCHER RETRIEVAL] ❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Session ID and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[VOUCHER RETRIEVAL] ❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check rate limit
    if (!checkRateLimit(clientIp, email)) {
      console.log('[VOUCHER RETRIEVAL] ❌ Rate limit exceeded for:', email);
      return res.status(429).json({
        success: false,
        error: 'Too many retrieval attempts. Please try again in 5 minutes.'
      });
    }

    console.log('[VOUCHER RETRIEVAL] Looking up session:', sessionId);

    // 2. Get payment session from database
    const sessionQuery = `
      SELECT
        id,
        customer_email,
        customer_phone,
        payment_status,
        amount,
        quantity,
        passport_data,
        payment_gateway_ref,
        vouchers_generated,
        vouchers_generation_attempts,
        created_at
      FROM purchase_sessions
      WHERE id = $1
    `;

    const sessionResult = await db.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      console.log('[VOUCHER RETRIEVAL] ❌ Session not found:', sessionId);

      // Timing attack protection - same delay whether session exists or not
      const elapsed = Date.now() - startTime;
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
      }

      return res.status(404).json({
        success: false,
        error: 'Payment session not found. Please check your session ID.'
      });
    }

    const session = sessionResult.rows[0];
    console.log('[VOUCHER RETRIEVAL] Session found, payment status:', session.payment_status);

    // 3. Verify email matches (case-insensitive)
    if (session.customer_email.toLowerCase() !== email.toLowerCase()) {
      console.log('[VOUCHER RETRIEVAL] ❌ Email mismatch');

      // Timing attack protection
      const elapsed = Date.now() - startTime;
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
      }

      return res.status(403).json({
        success: false,
        error: 'Email address does not match the payment session.'
      });
    }

    // 4. Check payment status
    if (session.payment_status !== 'completed') {
      console.log('[VOUCHER RETRIEVAL] ❌ Payment not completed:', session.payment_status);
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Current status: ${session.payment_status}`,
        status: session.payment_status
      });
    }

    console.log('[VOUCHER RETRIEVAL] ✅ Payment completed, checking for vouchers');

    // 5. Get existing vouchers
    const vouchersQuery = `
      SELECT
        voucher_code,
        passport_number,
        amount,
        status,
        customer_name,
        customer_email,
        created_at,
        valid_from,
        valid_until
      FROM individual_purchases
      WHERE purchase_session_id = $1
      ORDER BY created_at ASC
    `;

    const vouchersResult = await db.query(vouchersQuery, [sessionId]);

    if (vouchersResult.rows.length === 0) {
      // Payment completed but NO vouchers exist - CRITICAL ERROR RECOVERY
      console.log('[VOUCHER RETRIEVAL] ⚠️ Payment successful but no vouchers found - attempting recovery');

      try {
        // Attempt to generate vouchers now
        console.log('[VOUCHER RETRIEVAL] Calling createVoucherFromPayment for recovery');

        const newVouchers = await createVoucherFromPayment(sessionId, {
          approvalCode: session.payment_gateway_ref || 'MANUAL_RECOVERY'
        });

        console.log('[VOUCHER RETRIEVAL] ✅ Successfully generated', newVouchers.length, 'voucher(s) during recovery');

        // Update session tracking
        await db.query(`
          UPDATE purchase_sessions
          SET
            vouchers_generated = TRUE,
            vouchers_generation_attempts = vouchers_generation_attempts + 1,
            last_generation_attempt = NOW()
          WHERE id = $1
        `, [sessionId]);

        // Send email notification
        console.log('[VOUCHER RETRIEVAL] Sending email notification with recovered vouchers');
        await sendVoucherNotification(
          {
            customerEmail: email,
            customerPhone: session.customer_phone,
            quantity: newVouchers.length
          },
          newVouchers,
          sessionId
        );

        return res.json({
          success: true,
          message: 'Vouchers generated successfully',
          vouchers: newVouchers,
          recovered: true,
          emailSent: true
        });

      } catch (err) {
        console.error('[VOUCHER RETRIEVAL] ❌ Failed to generate vouchers during recovery:', err.message);

        // Update failed attempt tracking
        await db.query(`
          UPDATE purchase_sessions
          SET
            vouchers_generation_attempts = vouchers_generation_attempts + 1,
            last_generation_attempt = NOW()
          WHERE id = $1
        `, [sessionId]);

        return res.status(500).json({
          success: false,
          error: 'Unable to generate vouchers. Please contact support.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined,
          sessionId: sessionId
        });
      }
    }

    // 6. Vouchers exist - return them and resend email
    console.log('[VOUCHER RETRIEVAL] ✅ Found', vouchersResult.rows.length, 'existing voucher(s)');

    const vouchers = vouchersResult.rows;

    // Resend email notification
    try {
      console.log('[VOUCHER RETRIEVAL] Resending email notification');
      await sendVoucherNotification(
        {
          customerEmail: email,
          customerPhone: session.customer_phone,
          quantity: vouchers.length
        },
        vouchers,
        sessionId
      );
      console.log('[VOUCHER RETRIEVAL] ✅ Email sent successfully');
    } catch (emailErr) {
      console.error('[VOUCHER RETRIEVAL] ⚠️ Email notification failed:', emailErr.message);
      // Don't fail the request if email fails - vouchers are still returned
    }

    return res.json({
      success: true,
      message: 'Vouchers retrieved successfully',
      vouchers: vouchers,
      recovered: false,
      emailSent: true
    });

  } catch (err) {
    console.error('[VOUCHER RETRIEVAL] ❌ Unexpected error:', err);

    return res.status(500).json({
      success: false,
      error: 'An error occurred while retrieving your vouchers. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/voucher-retrieval/check-session/:sessionId
 *
 * Check if a session exists and its payment status (without email verification)
 * Used by frontend to provide better error messages
 */
router.get('/check-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const result = await db.query(`
      SELECT
        payment_status,
        created_at,
        vouchers_generated
      FROM purchase_sessions
      WHERE id = $1
    `, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        exists: false
      });
    }

    const session = result.rows[0];

    return res.json({
      success: true,
      exists: true,
      paymentStatus: session.payment_status,
      vouchersGenerated: session.vouchers_generated,
      createdAt: session.created_at
    });

  } catch (err) {
    console.error('[VOUCHER RETRIEVAL] Error checking session:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to check session status'
    });
  }
});

module.exports = router;
