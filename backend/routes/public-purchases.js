const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const PaymentGatewayFactory = require('../services/payment-gateways/PaymentGatewayFactory');
const { sendVoucherNotification } = require('../services/notificationService');
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
 * PUBLIC PURCHASE ROUTES
 * NO AUTHENTICATION REQUIRED
 * For online voucher purchasing by end customers
 *
 * Uses payment gateway abstraction - can switch between:
 * - Stripe (for testing/POC)
 * - BSP Bank (production)
 * - Kina Bank (production alternative)
 */

/**
 * Create Payment Session (Gateway Abstraction)
 * POST /api/public-purchases/create-payment-session
 * Creates purchase session and redirects to payment gateway
 * Works with any configured gateway (Stripe, BSP, Kina)
 */
router.post('/create-payment-session', async (req, res) => {
  try {
    const {
      customerEmail,
      customerPhone,
      quantity,
      amount,
      deliveryMethod,
      currency,
      returnUrl,
      cancelUrl,
      passportData // 🆕 NEW: Optional passport data
    } = req.body;

    // Validation
    if (!customerPhone && !customerEmail) {
      return res.status(400).json({
        error: 'At least one contact method (email or phone) is required'
      });
    }

    if (!quantity || quantity < 1 || quantity > 20) {
      return res.status(400).json({
        error: 'Quantity must be between 1 and 20'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    if (!returnUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Return URL and Cancel URL are required'
      });
    }

    // Generate unique session ID
    const sessionId = `PGKB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Set expiry (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Insert purchase session
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
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const values = [
      sessionId,
      customerEmail || null,
      customerPhone || null,
      quantity,
      amount,
      currency || 'PGK',
      deliveryMethod || 'Email',
      'pending',
      passportData ? JSON.stringify(passportData) : null, // 🆕 Store passport data if provided
      expiresAt
    ];

    const result = await pool.query(query, values);
    const session = result.rows[0];

    // Get payment gateway
    const gateway = PaymentGatewayFactory.getGateway();
    console.log(`💳 Using payment gateway: ${gateway.getName()}`);
    if (passportData) {
      console.log(`📋 Passport data included: ${passportData.passportNumber} (${passportData.surname}, ${passportData.givenName})`);
    }

    // Create payment session with gateway
    const paymentSession = await gateway.createPaymentSession({
      sessionId: session.id,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      quantity: quantity,
      amountPGK: amount,
      currency: currency || 'PGK',
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      metadata: {
        deliveryMethod: deliveryMethod,
      }
    });

    console.log(`✅ Payment session created: ${session.id} via ${gateway.getName()}`);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        paymentUrl: paymentSession.paymentUrl,
        expiresAt: paymentSession.expiresAt,
        gateway: gateway.getName(),
        metadata: paymentSession.metadata
      }
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message
    });
  }
});

/**
 * Create Purchase Session (Legacy endpoint for backwards compatibility)
 * POST /api/public-purchases/create-session
 * Creates a new purchase session before payment
 */
router.post('/create-session', async (req, res) => {
  try {
    const {
      customerEmail,
      customerPhone,
      quantity,
      amount,
      deliveryMethod,
      currency
    } = req.body;

    // Validation
    if (!customerPhone && !customerEmail) {
      return res.status(400).json({
        error: 'At least one contact method (email or phone) is required'
      });
    }

    if (!quantity || quantity < 1 || quantity > 20) {
      return res.status(400).json({
        error: 'Quantity must be between 1 and 20'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    // Generate unique session ID
    const sessionId = `PGKB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Set expiry (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Insert purchase session
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
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const values = [
      sessionId,
      customerEmail || null,
      customerPhone || null,
      quantity,
      amount,
      currency || 'PGK',
      deliveryMethod || 'Email',
      'pending',
      expiresAt
    ];

    const result = await pool.query(query, values);
    const session = result.rows[0];

    console.log('Purchase session created:', sessionId);

    res.json({
      success: true,
      data: {
        id: session.id,
        customerEmail: session.customer_email,
        customerPhone: session.customer_phone,
        quantity: session.quantity,
        amount: session.amount,
        currency: session.currency,
        deliveryMethod: session.delivery_method,
        expiresAt: session.expires_at,
        createdAt: session.created_at
      }
    });

  } catch (error) {
    console.error('Error creating purchase session:', error);
    res.status(500).json({
      error: 'Failed to create purchase session',
      message: error.message
    });
  }
});

/**
 * Complete Purchase Session
 * POST /api/public-purchases/complete
 * Completes purchase after successful payment and generates vouchers
 */
router.post('/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId, paymentData } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    await client.query('BEGIN');

    // Get purchase session
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const sessionResult = await client.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Purchase session not found' });
    }

    const session = sessionResult.rows[0];

    // Check if already completed
    if (session.payment_status === 'completed') {
      // Return existing vouchers
      const vouchersQuery = 'SELECT * FROM individual_purchases WHERE purchase_session_id = $1';
      const vouchersResult = await client.query(vouchersQuery, [sessionId]);

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Purchase already completed',
        data: {
          session: session,
          vouchers: vouchersResult.rows
        }
      });
    }

    // Check if expired
    if (new Date() > new Date(session.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Purchase session has expired' });
    }

    // Generate vouchers
    const vouchers = [];
    for (let i = 0; i < session.quantity; i++) {
      const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
      const validFrom = new Date();
      const validUntil = voucherConfig.helpers.calculateValidUntil(validFrom);

      const voucherQuery = `
        INSERT INTO individual_purchases (
          customer_name,
          customer_email,
          customer_phone,
          voucher_code,
          passport_number,
          amount,
          payment_mode,
          payment_method,
          valid_from,
          valid_until,
          status,
          purchase_session_id,
          payment_gateway_ref
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const voucherValues = [
        session.customer_email || session.customer_phone || 'Online Customer', // customer_name (required)
        session.customer_email,
        session.customer_phone,
        voucherCode,
        'PENDING', // Passport to be registered later
        50.00, // PGK 50 per voucher
        'BSP IPG', // payment_mode
        paymentData?.paymentMethod || 'VISA', // payment_method
        validFrom,
        validUntil,
        'active',
        sessionId,
        paymentData?.bspTransactionId || null
      ];

      const voucherResult = await client.query(voucherQuery, voucherValues);
      vouchers.push(voucherResult.rows[0]);
    }

    // Update session as completed
    const updateSessionQuery = `
      UPDATE purchase_sessions
      SET payment_status = 'completed',
          payment_gateway_ref = $1,
          session_data = $2,
          completed_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const updateValues = [
      paymentData?.bspTransactionId || null,
      JSON.stringify(paymentData || {}),
      sessionId
    ];

    const updatedSessionResult = await client.query(updateSessionQuery, updateValues);
    const updatedSession = updatedSessionResult.rows[0];

    await client.query('COMMIT');

    console.log(`Purchase completed: ${sessionId}, ${vouchers.length} voucher(s) generated`);

    // TODO: Send vouchers via SMS and Email
    // This would call the SMS and email notification services
    if (session.customer_email || session.customer_phone) {
      console.log('TODO: Send voucher codes via SMS/Email to:', {
        email: session.customer_email,
        phone: session.customer_phone,
        vouchers: vouchers.map(v => v.voucher_code)
      });

      // Placeholder for actual SMS/Email sending
      // await sendVoucherNotifications(session, vouchers);
    }

    res.json({
      success: true,
      message: `${vouchers.length} voucher(s) generated successfully`,
      data: {
        session: {
          id: updatedSession.id,
          customerEmail: updatedSession.customer_email,
          customerPhone: updatedSession.customer_phone,
          quantity: updatedSession.quantity,
          amount: updatedSession.amount,
          paymentStatus: updatedSession.payment_status,
          completedAt: updatedSession.completed_at
        },
        vouchers: vouchers.map(v => ({
          voucher_code: v.voucher_code,
          amount: v.amount,
          valid_from: v.valid_from,
          valid_until: v.valid_until,
          status: v.status,
          payment_method: v.payment_method
        }))
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing purchase:', error);
    res.status(500).json({
      error: 'Failed to complete purchase',
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Validate Voucher Code
 * GET /api/public-purchases/validate/:voucherCode
 * Check if voucher is valid for registration
 */
router.get('/validate/:voucherCode', async (req, res) => {
  try {
    const { voucherCode } = req.params;

    const query = `
      SELECT
        id,
        voucher_code,
        customer_name,
        customer_email,
        customer_phone,
        passport_number,
        amount,
        payment_mode,
        payment_method,
        status,
        valid_from,
        valid_until,
        purchased_at,
        used_at
      FROM individual_purchases
      WHERE voucher_code = $1
    `;

    const result = await pool.query(query, [voucherCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found'
      });
    }

    const voucher = result.rows[0];

    res.json({
      success: true,
      data: voucher
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    res.status(500).json({
      error: 'Failed to validate voucher',
      message: error.message
    });
  }
});

/**
 * Register Passport with Voucher
 * POST /api/public-purchases/register-passport
 * Links passport number to voucher code
 */
router.post('/register-passport', async (req, res) => {
  try {
    const {
      voucherCode,
      passportNumber,
      surname,
      givenName,
      dateOfBirth,
      nationality,
      sex
    } = req.body;

    // Validate required fields
    if (!voucherCode || !passportNumber) {
      return res.status(400).json({
        error: 'Voucher code and passport number are required'
      });
    }

    // Get voucher
    const voucherQuery = `
      SELECT * FROM individual_purchases
      WHERE voucher_code = $1
    `;
    const voucherResult = await pool.query(voucherQuery, [voucherCode]);

    if (voucherResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voucher not found'
      });
    }

    const voucher = voucherResult.rows[0];

    // Check if voucher is already registered
    if (voucher.passport_number && voucher.passport_number !== 'PENDING') {
      return res.status(400).json({
        error: 'This voucher has already been registered with a passport'
      });
    }

    // Check if voucher is used
    if (voucher.used_at) {
      return res.status(400).json({
        error: 'This voucher has already been used'
      });
    }

    // Update voucher with passport information
    const updateQuery = `
      UPDATE individual_purchases
      SET passport_number = $1,
          customer_name = $2
      WHERE voucher_code = $3
      RETURNING *
    `;

    const customerName = surname && givenName
      ? `${surname} ${givenName}`.toUpperCase()
      : passportNumber;

    const updateValues = [
      passportNumber.toUpperCase(),
      customerName,
      voucherCode
    ];

    const updateResult = await pool.query(updateQuery, updateValues);

    console.log(`Passport registered: ${passportNumber} with voucher ${voucherCode}`);

    res.json({
      success: true,
      message: 'Passport registered successfully',
      data: {
        voucherCode: voucherCode,
        passportNumber: passportNumber,
        customerName: customerName
      }
    });

  } catch (error) {
    console.error('Error registering passport:', error);
    res.status(500).json({
      error: 'Failed to register passport',
      message: error.message
    });
  }
});

/**
 * Get Purchase Session by Stripe Session ID
 * GET /api/public-purchases/session-by-stripe/:stripeSessionId
 * Find internal session by Stripe checkout session ID
 */
router.get('/session-by-stripe/:stripeSessionId', async (req, res) => {
  try {
    const { stripeSessionId } = req.params;

    // Find session by Stripe session ID (stored in payment_gateway_ref for now)
    // Or by checking session_data JSON field
    const query = `
      SELECT * FROM purchase_sessions
      WHERE payment_gateway_ref = $1
         OR stripe_session_id = $1
         OR session_data::text LIKE $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [stripeSessionId, `%${stripeSessionId}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Get associated vouchers if completed
    let vouchers = [];
    if (session.payment_status === 'completed') {
      const vouchersQuery = 'SELECT * FROM individual_purchases WHERE purchase_session_id = $1';
      const vouchersResult = await pool.query(vouchersQuery, [session.id]);
      vouchers = vouchersResult.rows;
    }

    // Return in format expected by frontend (direct data, not wrapped)
    res.json({
      session: {
        id: session.id,
        customerEmail: session.customer_email,
        customerPhone: session.customer_phone,
        quantity: session.quantity,
        amount: session.amount,
        currency: session.currency,
        paymentStatus: session.payment_status,
        expiresAt: session.expires_at,
        completedAt: session.completed_at,
        createdAt: session.created_at
      },
      vouchers: vouchers.map(v => ({
        voucher_code: v.voucher_code,
        amount: v.amount,
        valid_from: v.valid_from,
        valid_until: v.valid_until,
        status: v.status
      })),
      paymentDetails: session.payment_status === 'completed' ? {
        gateway: 'stripe',
        status: 'completed'
      } : null
    });

  } catch (error) {
    console.error('Error fetching session by Stripe ID:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error.message
    });
  }
});

/**
 * Get Purchase Session Status
 * GET /api/public-purchases/session/:sessionId
 * Check status of a purchase session
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const query = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Get associated vouchers if completed
    let vouchers = [];
    if (session.payment_status === 'completed') {
      const vouchersQuery = 'SELECT * FROM individual_purchases WHERE purchase_session_id = $1';
      const vouchersResult = await pool.query(vouchersQuery, [sessionId]);
      vouchers = vouchersResult.rows;
    }

    // Return in format expected by frontend (direct data, not wrapped)
    res.json({
      session: {
        id: session.id,
        customerEmail: session.customer_email,
        customerPhone: session.customer_phone,
        quantity: session.quantity,
        amount: session.amount,
        currency: session.currency,
        paymentStatus: session.payment_status,
        expiresAt: session.expires_at,
        completedAt: session.completed_at,
        createdAt: session.created_at
      },
      vouchers: vouchers.map(v => ({
        voucher_code: v.voucher_code,
        amount: v.amount,
        valid_from: v.valid_from,
        valid_until: v.valid_until,
        status: v.status
      })),
      paymentDetails: session.payment_status === 'completed' ? {
        gateway: 'stripe',
        status: 'completed'
      } : null
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error.message
    });
  }
});

/**
 * BSP Webhook Handler (Mock)
 * POST /api/public-purchases/webhook/bsp
 * Receives payment notifications from BSP
 */
router.post('/webhook/bsp', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('BSP Webhook received:', webhookData);

    // TODO: Verify BSP webhook signature
    // const signature = req.headers['x-bsp-signature'];
    // const isValid = verifyBSPSignature(webhookData, signature);
    // if (!isValid) {
    //   return res.status(403).json({ error: 'Invalid signature' });
    // }

    const {
      merchant_reference,
      transaction_id,
      status,
      amount,
      payment_method
    } = webhookData;

    // Update session and generate vouchers if payment successful
    if (status === 'completed' || status === 'success') {
      // Complete purchase automatically
      const completeResponse = await fetch(`${req.protocol}://${req.get('host')}/api/public-purchases/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: merchant_reference,
          paymentData: {
            bspTransactionId: transaction_id,
            paymentMethod: payment_method,
            status: 'completed'
          }
        })
      });

      console.log('Webhook triggered purchase completion');
    }

    // Acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still acknowledge to prevent retries
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Universal Webhook Handler (Gateway Abstraction)
 * POST /api/public-purchases/webhook
 * Handles webhooks from any configured payment gateway
 * Gateway detected from query param: ?gateway=stripe|bsp|kina
 *
 * IMPORTANT: This route uses raw body parser (configured in server.js)
 * req.body will be a Buffer, not a parsed JSON object
 */
router.post('/webhook', async (req, res) => {
  try {
    // Detect gateway from query param or auto-detect
    const gatewayName = req.query.gateway || process.env.PAYMENT_GATEWAY || 'stripe';
    const gateway = PaymentGatewayFactory.getGateway(gatewayName);

    console.log(`📥 Webhook received for gateway: ${gateway.getName()}`);

    // Get signature from headers (different gateways use different header names)
    const signature = req.headers['stripe-signature'] ||
                     req.headers['x-bsp-signature'] ||
                     req.headers['x-webhook-signature'];

    // Get raw body (Buffer) for signature verification
    // Convert Buffer to string for Stripe
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;

    // Verify webhook signature
    let event;
    try {
      event = gateway.verifyWebhookSignature(
        rawBody,
        signature,
        process.env[`${gateway.getName().toUpperCase()}_WEBHOOK_SECRET`]
      );
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process the webhook event
    const result = await gateway.processWebhookEvent(event);

    if (result.success && result.status === 'completed') {
      // Complete the purchase and generate vouchers
      const { sessionId, data } = result;

      // Check if session has passport data (Buy Online flow)
      const sessionCheck = await pool.query(
        'SELECT passport_data FROM purchase_sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].passport_data) {
        // Buy Online flow: Create passport + voucher atomically
        const { completePurchaseWithPassport } = require('./buy-online');
        await completePurchaseWithPassport(sessionId, data);
        console.log(`✅ Webhook processed (Buy Online) for session: ${sessionId}`);
      } else {
        // Legacy flow: Just generate voucher
        await completeVoucherPurchase(sessionId, data);
        console.log(`✅ Webhook processed (Legacy) for session: ${sessionId}`);
      }
    }

    // Always acknowledge webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still acknowledge to prevent retries
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Helper function to complete voucher purchase
 * Called from webhook or manual completion
 */
async function completeVoucherPurchase(sessionId, paymentData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get purchase session
    const sessionQuery = 'SELECT * FROM purchase_sessions WHERE id = $1';
    const sessionResult = await client.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      throw new Error('Purchase session not found');
    }

    const session = sessionResult.rows[0];

    // Check if already completed
    if (session.payment_status === 'completed') {
      console.log(`⚠️ Session ${sessionId} already completed, skipping`);
      await client.query('ROLLBACK');
      return { alreadyCompleted: true };
    }

    // Generate vouchers
    const vouchers = [];
    for (let i = 0; i < session.quantity; i++) {
      const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
      const validFrom = new Date();
      const validUntil = voucherConfig.helpers.calculateValidUntil(validFrom);

      const voucherQuery = `
        INSERT INTO individual_purchases (
          customer_name,
          customer_email,
          customer_phone,
          voucher_code,
          passport_number,
          amount,
          payment_mode,
          payment_method,
          valid_from,
          valid_until,
          status,
          purchase_session_id,
          payment_gateway_ref
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const voucherValues = [
        session.customer_email || session.customer_phone || 'Online Customer',
        session.customer_email,
        session.customer_phone,
        voucherCode,
        'PENDING',
        50.00,
        paymentData.gateway || 'Online',
        paymentData.paymentMethod || 'Card',
        validFrom,
        validUntil,
        'active',
        sessionId,
        paymentData.transactionId || null
      ];

      const voucherResult = await client.query(voucherQuery, voucherValues);
      vouchers.push(voucherResult.rows[0]);
    }

    // Update session as completed
    const updateSessionQuery = `
      UPDATE purchase_sessions
      SET payment_status = 'completed',
          payment_gateway_ref = $1,
          session_data = $2,
          completed_at = NOW()
      WHERE id = $3
    `;

    await client.query(updateSessionQuery, [
      paymentData.transactionId || null,
      JSON.stringify(paymentData || {}),
      sessionId
    ]);

    await client.query('COMMIT');

    console.log(`✅ Purchase completed: ${sessionId}, ${vouchers.length} voucher(s) generated`);

    // Send vouchers via SMS and Email
    if (session.customer_email || session.customer_phone) {
      try {
        console.log('📤 Sending voucher notifications...');
        const notificationResult = await sendVoucherNotification({
          customerEmail: session.customer_email,
          customerPhone: session.customer_phone,
          quantity: session.quantity
        }, vouchers);

        console.log('✅ Notifications sent:', notificationResult);
      } catch (error) {
        console.error('⚠️ Notification delivery failed (non-critical):', error);
        // Don't fail the purchase if notifications fail
      }
    }

    return { vouchers };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Cleanup Expired Sessions
 * POST /api/public-purchases/cleanup-expired
 * Clean up expired sessions (call via cron job)
 */
router.post('/cleanup-expired', async (req, res) => {
  try {
    const query = `
      DELETE FROM purchase_sessions
      WHERE expires_at < NOW()
        AND payment_status = 'pending'
      RETURNING id
    `;

    const result = await pool.query(query);

    console.log(`Cleaned up ${result.rowCount} expired sessions`);

    res.json({
      success: true,
      message: `Cleaned up ${result.rowCount} expired session(s)`
    });

  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

module.exports = router;
