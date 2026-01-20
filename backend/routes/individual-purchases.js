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
 * POST /api/individual-purchases/batch
 * Create multiple individual purchase vouchers in a single transaction
 * Supports 1-5 vouchers with passport information
 * Requires: Counter_Agent or Flex_Admin role
 */
router.post('/batch', auth, async (req, res) => {
  try {
    const {
      passports,  // Array of passport objects with MRZ data
      paymentMethod,
      cardLastFour,
      discount,
      collectedAmount,
      returnedAmount,
      customerEmail
    } = req.body;

    // Validate required fields
    if (!passports || !Array.isArray(passports) || passports.length === 0) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Missing required field: passports (must be non-empty array)'
      });
    }

    if (passports.length > 5) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Maximum 5 vouchers allowed per batch'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Missing required field: paymentMethod'
      });
    }

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions. Only Counter_Agent, Finance_Manager, and Flex_Admin can create vouchers.'
      });
    }

    // Validate each passport has required fields
    for (let i = 0; i < passports.length; i++) {
      const passport = passports[i];
      if (!passport.passportNumber || !passport.fullName || !passport.nationality) {
        return res.status(400).json({
          type: 'error',
          status: 'error',
          message: `Passport ${i + 1}: Missing required fields (passportNumber, fullName, nationality)`
        });
      }
    }

    // Check for duplicate passport numbers in the batch
    const passportNumbers = passports.map(p => p.passportNumber);
    const uniquePassportNumbers = new Set(passportNumbers);
    if (uniquePassportNumbers.size !== passportNumbers.length) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Duplicate passport numbers detected in batch'
      });
    }

    // Calculate amounts
    const voucherPrice = 50.00; // PGK 50 per voucher
    const quantity = passports.length;
    const subtotal = voucherPrice * quantity;
    const discountAmount = discount || 0;
    const totalAmount = subtotal - discountAmount;

    // Start database transaction
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const createdVouchers = [];
      const createdPassports = [];
      const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Calculate valid_until date (30 days from now)
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 30);

      // Process each passport and create voucher
      for (const passport of passports) {
        // Generate unique voucher code
        const voucherCode = generateVoucherCode('IND');

        // Insert or update passport record
        const passportQuery = `
          INSERT INTO passports (
            passport_number,
            full_name,
            nationality,
            date_of_birth,
            passport_expiry,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (passport_number)
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            nationality = EXCLUDED.nationality,
            date_of_birth = EXCLUDED.date_of_birth,
            passport_expiry = EXCLUDED.passport_expiry
          RETURNING *
        `;

        const passportValues = [
          passport.passportNumber,
          passport.fullName,
          passport.nationality,
          passport.dateOfBirth || null,
          passport.passportExpiry || null
        ];

        const passportResult = await client.query(passportQuery, passportValues);
        createdPassports.push(passportResult.rows[0]);

        // Create individual purchase voucher
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
            batch_id,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12)
          RETURNING *
        `;

        const voucherValues = [
          voucherCode,
          passport.passportNumber,
          voucherPrice,
          paymentMethod,
          discountAmount / quantity, // Distribute discount evenly
          totalAmount / quantity, // Distribute collected amount evenly
          returnedAmount || 0,
          validUntilDate,
          passport.fullName,
          customerEmail || null,
          batchId,
          req.user.id
        ];

        const voucherResult = await client.query(voucherQuery, voucherValues);
        createdVouchers.push(voucherResult.rows[0]);
      }

      // Commit transaction
      await client.query('COMMIT');

      // Return success with all created vouchers
      res.status(201).json({
        type: 'success',
        status: 'success',
        message: `Successfully created ${quantity} vouchers`,
        data: {
          batchId,
          quantity,
          subtotal,
          discount: discountAmount,
          totalAmount,
          vouchers: createdVouchers,
          passports: createdPassports
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }

  } catch (error) {
    console.error('Error creating batch purchase:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to create batch purchase',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/batch/:batchId/pdf
 * Generate a PDF for all vouchers in a batch
 * Requires: Counter_Agent, Finance_Manager, or Flex_Admin role
 */
router.get('/batch/:batchId/pdf', auth, async (req, res) => {
  try {
    const { batchId } = req.params;

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    // Get all vouchers in this batch
    const query = `
      SELECT
        ip.*,
        p.full_name,
        p.nationality,
        p.date_of_birth
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.batch_id = $1
      ORDER BY ip.created_at ASC
    `;

    const result = await db.query(query, [batchId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        status: 'error',
        message: 'No vouchers found for this batch'
      });
    }

    const vouchers = result.rows;

    // Use existing PDF generator (supports multiple vouchers)
    const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateVoucherPDFBuffer(vouchers, `Batch ${batchId}`);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}-vouchers.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating batch PDF:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to generate batch PDF',
      error: error.message
    });
  }
});

/**
 * POST /api/individual-purchases/batch/:batchId/email
 * Send batch vouchers via email with PDF attachment
 * Requires: Counter_Agent, Finance_Manager, or Flex_Admin role
 */
router.post('/batch/:batchId/email', auth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Email address is required'
      });
    }

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    // Get all vouchers in this batch
    const query = `
      SELECT
        ip.*,
        p.full_name,
        p.nationality,
        p.date_of_birth
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.batch_id = $1
      ORDER BY ip.created_at ASC
    `;

    const result = await db.query(query, [batchId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        status: 'error',
        message: 'No vouchers found for this batch'
      });
    }

    const vouchers = result.rows;
    const quantity = vouchers.length;

    // Generate SEPARATE PDF for EACH voucher using standardized template
    const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
    const pdfAttachments = [];
    for (const voucher of vouchers) {
      const pdfBuffer = await generateVoucherPDFBuffer([voucher], `Batch ${batchId}`);
      pdfAttachments.push({
        filename: `voucher-${voucher.voucher_code}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // Send email with SEPARATE PDF attachments
    const { sendEmail } = require('../services/notificationService');

    const subject = `PNG Green Fees - ${quantity} Voucher${quantity > 1 ? 's' : ''} (Batch ${batchId})`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">PNG Green Fees - Batch Voucher Purchase</h2>

        <p>Dear Customer,</p>

        <p>Your batch purchase of <strong>${quantity} green fee voucher${quantity > 1 ? 's' : ''}</strong> has been processed successfully.</p>

        <div style="background: #f9fafb; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Batch ID:</strong> ${batchId}</p>
          <p style="margin: 5px 0 0 0;"><strong>Quantity:</strong> ${quantity} voucher${quantity > 1 ? 's' : ''}</p>
        </div>

        <h3 style="color: #333;">Attached Vouchers (${quantity} separate PDF files):</h3>
        <ul style="list-style: none; padding: 0;">
          ${vouchers.map((v, i) => `
            <li style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 5px;">
              <strong>${i + 1}. ${v.voucher_code}</strong><br>
              <span style="color: #666;">Passport: ${v.passport_number}</span><br>
              <span style="color: #666;">Name: ${v.customer_name || v.full_name || 'N/A'}</span>
            </li>
          `).join('')}
        </ul>

        <p style="margin-top: 20px;">
          Each voucher is attached as a separate PDF file.
          Please print ${quantity > 1 ? 'them' : 'it'} for use at the entry point.
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          This is an automated email from PNG Green Fees System. Please do not reply to this email.
        </p>
      </div>
    `;

    const textBody = `
PNG Green Fees - Batch Voucher Purchase

Dear Customer,

Your batch purchase of ${quantity} green fee voucher${quantity > 1 ? 's' : ''} has been processed successfully.

Batch ID: ${batchId}
Quantity: ${quantity} voucher${quantity > 1 ? 's' : ''}

Attached Vouchers (${quantity} separate PDF files):
${vouchers.map((v, i) => `${i + 1}. ${v.voucher_code} - Passport: ${v.passport_number} - Name: ${v.customer_name || v.full_name || 'N/A'}`).join('\n')}

Each voucher is attached as a separate PDF file. Please print ${quantity > 1 ? 'them' : 'it'} for use at the entry point.

---
This is an automated email from PNG Green Fees System. Please do not reply to this email.
    `;

    await sendEmail(email, subject, htmlBody, textBody, pdfAttachments);

    res.json({
      type: 'success',
      status: 'success',
      message: `Batch vouchers email sent successfully to ${email}`,
      data: {
        batchId,
        email,
        quantity,
        voucherCodes: vouchers.map(v => v.voucher_code)
      }
    });

  } catch (error) {
    console.error('Error sending batch email:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to send batch email',
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

/**
 * POST /api/individual-purchases/batch-simple
 * Create multiple vouchers WITHOUT passports (simplified flow)
 * Passports will be assigned later via /register/:voucherCode page
 * Supports 1-5 vouchers per batch
 * Requires: Counter_Agent, Finance_Manager, or Flex_Admin role
 */
router.post('/batch-simple', auth, async (req, res) => {
  try {
    const { quantity, paymentMethod, collectedAmount, customerEmail } = req.body;
    const agentId = req.user.id;

    // Validate required fields
    if (!quantity || quantity < 1 || quantity > 5) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Quantity must be between 1 and 5'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Payment method is required'
      });
    }

    // Check user role
    if (!['Counter_Agent', 'Finance_Manager', 'Flex_Admin'].includes(req.user.role)) {
      return res.status(403).json({
        type: 'error',
        status: 'error',
        message: 'Insufficient permissions'
      });
    }

    // Generate batch ID
    const batchId = `BATCH-${Date.now()}`;
    const vouchers = [];
    const voucherPrice = 50.00; // PGK 50 per voucher
    const amountPerVoucher = collectedAmount ? (collectedAmount / quantity) : voucherPrice;

    console.log(`[BATCH_SIMPLE] Creating ${quantity} vouchers for batch ${batchId}`);

    // Create vouchers WITHOUT passports
    for (let i = 0; i < quantity; i++) {
      const voucherCode = generateVoucherCode('IND');

      const result = await db.query(
        `INSERT INTO individual_purchases (
          voucher_code,
          amount,
          payment_method,
          collected_amount,
          customer_name,
          customer_email,
          batch_id,
          created_by,
          valid_from,
          valid_until,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '180 days', 'unregistered')
        RETURNING *`,
        [
          voucherCode,
          voucherPrice,
          paymentMethod,
          amountPerVoucher,
          'Walk-in Customer', // Default customer name for individual purchases
          customerEmail || null,
          batchId,
          agentId
        ]
      );

      vouchers.push({
        id: result.rows[0].id,
        voucherCode: result.rows[0].voucher_code,
        amount: parseFloat(result.rows[0].amount),
        status: result.rows[0].status,
        validUntil: result.rows[0].valid_until
      });

      console.log(`[BATCH_SIMPLE] Created voucher ${i + 1}/${quantity}: ${voucherCode}`);
    }

    console.log(`[BATCH_SIMPLE] Successfully created batch ${batchId} with ${vouchers.length} vouchers`);

    res.status(201).json({
      type: 'success',
      status: 'success',
      success: true,
      message: `${quantity} voucher(s) created successfully`,
      batchId,
      vouchers
    });

  } catch (error) {
    console.error('[BATCH_SIMPLE] Error creating batch:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to create vouchers',
      error: error.message
    });
  }
});

/**
 * GET /api/individual-purchases/batch/:batchId
 * Get all vouchers in a batch with passport information (if assigned)
 * Used to display batch voucher list after creation
 */
router.get('/batch/:batchId', auth, async (req, res) => {
  try {
    const { batchId } = req.params;

    console.log(`[BATCH_SIMPLE] Fetching vouchers for batch: ${batchId}`);

    const result = await db.query(
      `SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.status,
        ip.valid_until,
        ip.passport_number,
        ip.created_at,
        p.full_name as passport_name
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.batch_id = $1
      ORDER BY ip.created_at`,
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        type: 'error',
        status: 'error',
        message: 'Batch not found'
      });
    }

    console.log(`[BATCH_SIMPLE] Found ${result.rows.length} vouchers in batch ${batchId}`);

    res.json({
      type: 'success',
      status: 'success',
      success: true,
      batchId,
      vouchers: result.rows.map(row => ({
        id: row.id,
        voucherCode: row.voucher_code,
        amount: parseFloat(row.amount),
        status: row.status,
        validUntil: row.valid_until,
        passportNumber: row.passport_number,
        passportName: row.passport_name,
        createdAt: row.created_at
      }))
    });

  } catch (error) {
    console.error('[BATCH_SIMPLE] Error fetching batch:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch batch vouchers',
      error: error.message
    });
  }
});

module.exports = router;
