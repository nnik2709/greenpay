const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const voucherConfig = require('../config/voucherConfig');

/**
 * Generate a unique voucher code - 8-character alphanumeric
 * Uses centralized config for consistency
 */
function generateVoucherCode(prefix = 'IND') {
  return voucherConfig.helpers.generateVoucherCode(prefix);
}

/**
 * GET /api/individual-purchases
 * Get all individual purchases with pagination and search
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 50, max: 1000)
 *   - search: search term for voucher_code, passport_number, customer_name
 *   - status: filter by status (all, active, used, expired, refunded)
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Parse search params
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status || '';

    // Build WHERE clauses
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      const searchIndex = params.length;
      whereClause += ` AND (
        ip.voucher_code ILIKE $${searchIndex} OR
        ip.passport_number ILIKE $${searchIndex} OR
        ip.customer_name ILIKE $${searchIndex}
      )`;
    }

    if (status && status !== 'all') {
      switch(status) {
        case 'active':
          whereClause += ` AND ip.used_at IS NULL AND ip.valid_until >= NOW() AND ip.refunded_at IS NULL`;
          break;
        case 'used':
          whereClause += ` AND ip.used_at IS NOT NULL`;
          break;
        case 'expired':
          whereClause += ` AND ip.used_at IS NULL AND ip.valid_until < NOW() AND ip.refunded_at IS NULL`;
          break;
        case 'refunded':
          whereClause += ` AND ip.refunded_at IS NOT NULL`;
          break;
      }
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM individual_purchases ip
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    params.push(limit, offset);
    const dataQuery = `
      SELECT
        ip.*,
        p.passport_number as passport_num,
        p.full_name,
        p.nationality,
        p.date_of_birth,
        CASE
          WHEN ip.refunded_at IS NOT NULL THEN 'refunded'
          WHEN ip.used_at IS NOT NULL THEN 'used'
          WHEN ip.valid_until < NOW() THEN 'expired'
          ELSE 'active'
        END as status
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      ${whereClause}
      ORDER BY ip.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(dataQuery, params);

    res.json({
      type: 'success',
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching individual purchases:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch individual purchases',
      error: error.message
    });
  }
});

/**
 * POST /api/individual-purchases
 * Create a new individual purchase voucher
 * Requires: Counter_Agent or Flex_Admin role
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      passportNumber,
      amount,
      paymentMethod,
      cardLastFour,
      discount,
      collectedAmount,
      returnedAmount,
      validUntil,
      nationality
    } = req.body;

    // Validate required fields
    if (!passportNumber || !amount || !paymentMethod) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Missing required fields: passportNumber, amount, paymentMethod'
      });
    }

    // Check user role (Counter_Agent, Finance_Manager, and Flex_Admin can create vouchers)
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions. Only Counter_Agent, Finance_Manager, and Flex_Admin can create vouchers.'
      });
    }

    // Generate voucher code
    const voucherCode = generateVoucherCode('IND');

    // Calculate valid_until date (default 30 days from now)
    let validUntilDate;
    if (validUntil) {
      validUntilDate = new Date(validUntil);
    } else {
      validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 30);
    }

    // Insert into database (matching actual table schema)
    const query = `
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
        customer_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
      RETURNING *
    `;

    const values = [
      voucherCode,
      passportNumber,
      amount,
      paymentMethod,
      discount || 0,
      collectedAmount || amount,
      returnedAmount || 0,
      validUntilDate,
      req.body.customerName || 'Walk-in Customer',
      req.body.customerEmail || null
    ];

    const result = await db.query(query, values);

    // Return created voucher
    res.status(201).json({
      type: 'success',
      status: 'success',
      message: 'Individual purchase voucher created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating individual purchase:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to create individual purchase',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/:id
 * Get a specific individual purchase by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        ip.*,
        p.passport_number as passport_num,
        p.full_name,
        p.nationality,
        p.date_of_birth
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        status: 'error',
        message: 'Individual purchase not found'
      });
    }

    res.json({
      type: 'success',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching individual purchase:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch individual purchase',
      error: error.message
    });
  }
});

/**
 * PATCH /api/individual-purchases/:id
 * Update an individual purchase (for edits/refunds)
 * Requires: Counter_Agent, Finance_Manager, or Flex_Admin role
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      'amount', 'discount', 'collected_amount', 'returned_amount',
      'payment_method', 'valid_until', 'refunded', 'refund_amount',
      'refund_reason', 'refund_method', 'refund_notes', 'refunded_at', 'status'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    values.push(id); // Add ID as last parameter

    const query = `
      UPDATE individual_purchases
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        status: 'error',
        message: 'Individual purchase not found'
      });
    }

    res.json({
      type: 'success',
      status: 'success',
      message: 'Individual purchase updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating individual purchase:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to update individual purchase',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/:id/update-payment-method
 * Update payment method for a purchase
 * Only Flex_Admin and Finance_Manager can update
 */
router.get('/:id/update-payment-method', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.query;

    if (!payment_method) {
      return res.status(400).json({
        type: 'error',
        message: 'payment_method is required'
      });
    }

    const result = await db.query(
      `UPDATE individual_purchases
       SET payment_method = $1
       WHERE id = $2
       RETURNING *`,
      [payment_method, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        message: 'Purchase not found'
      });
    }

    res.json({
      type: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to update payment method',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/:id/refund
 * Process refund for a purchase
 * Only Flex_Admin and Finance_Manager can refund
 */
router.get('/:id/refund', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refund_payment_method } = req.query;

    if (!reason) {
      return res.status(400).json({
        type: 'error',
        message: 'Refund reason is required'
      });
    }

    if (!refund_payment_method) {
      return res.status(400).json({
        type: 'error',
        message: 'Refund payment method is required'
      });
    }

    const result = await db.query(
      `UPDATE individual_purchases
       SET status = 'refunded',
           refund_status = 'pending',
           refund_reason = $1,
           refund_payment_method = $2,
           refunded_at = NOW(),
           refunded_by = $3
       WHERE id = $4
       RETURNING *`,
      [reason, refund_payment_method, req.user.name || req.user.email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        message: 'Purchase not found'
      });
    }

    res.json({
      type: 'success',
      message: 'Refund initiated (status: pending)',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/:id/update-refund-status
 * Update refund status (pending -> completed)
 * Only Flex_Admin and Finance_Manager can update
 */
router.get('/:id/update-refund-status', auth, checkRole('Flex_Admin', 'Finance_Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_status } = req.query;

    if (!refund_status) {
      return res.status(400).json({
        type: 'error',
        message: 'refund_status is required'
      });
    }

    if (!['pending', 'completed'].includes(refund_status)) {
      return res.status(400).json({
        type: 'error',
        message: 'refund_status must be either "pending" or "completed"'
      });
    }

    const result = await db.query(
      `UPDATE individual_purchases
       SET refund_status = $1
       WHERE id = $2
       RETURNING *`,
      [refund_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        message: 'Purchase not found'
      });
    }

    res.json({
      type: 'success',
      message: `Refund status updated to ${refund_status}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to update refund status',
      error: error.message
    });
  }
});

module.exports = router;
