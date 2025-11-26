const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

/**
 * Generate a unique voucher code
 * Format: IND-YYYYMMDD-XXXXX (IND = Individual)
 */
function generateVoucherCode(prefix = 'IND') {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * GET /api/individual-purchases
 * Get all individual purchases (with optional filters)
 */
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT
        ip.*,
        p."passportNo" as passport_num,
        p.nationality,
        p.surname,
        p."givenName" as given_name,
        p.dob,
        p.sex
      FROM individual_purchases ip
      LEFT JOIN "Passport" p ON ip.passport_number = p."passportNo"
      ORDER BY ip.created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      type: 'success',
      data: result.rows
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

    // Check user role (only Counter_Agent and Flex_Admin can create vouchers)
    if (!['Counter_Agent', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions. Only Counter_Agent and Flex_Admin can create vouchers.'
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
        p."passportNo" as passport_num,
        p.nationality,
        p.surname,
        p."givenName" as given_name,
        p.dob,
        p.sex
      FROM individual_purchases ip
      LEFT JOIN "Passport" p ON ip.passport_number = p."passportNo"
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

module.exports = router;
