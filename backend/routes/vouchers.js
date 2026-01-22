const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const {
  voucherValidationLimiter,
  suspiciousActivityDetector
} = require('../middleware/rateLimiter');
const { body, param } = require('express-validator');
const validate = require('../middleware/validator');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const archiver = require('archiver');
const voucherConfig = require('../config/voucherConfig');

// Email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
};

// Generate voucher PDF (one voucher per page)
// Uses new unified PDF service with smart voucher types
const generateVouchersPDF = async (vouchers, companyName) => {
  // Use old PDF generator temporarily for bulk vouchers (multi-page)
  // TODO: Optimize VoucherTemplate for batch generation
  const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
  return generateVoucherPDFBuffer(vouchers, companyName);
};

/**
 * GET /api/vouchers/corporate-vouchers
 * Get all corporate vouchers with pagination and search
 * Requires: Authentication
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 50, max: 1000)
 *   - search: search term for voucher_code, company_name, passport_number
 *   - status: filter by status (all, pending, active, used)
 */
router.get('/corporate-vouchers', auth, async (req, res) => {
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
        cv.voucher_code ILIKE $${searchIndex} OR
        cv.company_name ILIKE $${searchIndex} OR
        cv.passport_number ILIKE $${searchIndex}
      )`;
    }

    if (status && status !== 'all') {
      switch(status) {
        case 'pending':
          whereClause += ` AND cv.passport_number IS NULL`;
          break;
        case 'active':
          whereClause += ` AND cv.passport_number IS NOT NULL AND cv.redeemed_date IS NULL`;
          break;
        case 'used':
          whereClause += ` AND cv.redeemed_date IS NOT NULL`;
          break;
      }
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM corporate_vouchers cv
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    params.push(limit, offset);
    const dataQuery = `
      SELECT
        cv.*,
        inv.invoice_number,
        u.name as created_by_name,
        CASE
          WHEN cv.redeemed_date IS NOT NULL THEN 'used'
          WHEN cv.passport_number IS NULL THEN 'pending'
          ELSE 'active'
        END as status
      FROM corporate_vouchers cv
      LEFT JOIN invoices inv ON inv.id = cv.invoice_id
      LEFT JOIN "User" u ON u.id = cv.created_by
      ${whereClause}
      ORDER BY cv.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(dataQuery, params);

    res.json({
      type: 'success',
      vouchers: result.rows,
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
    console.error('Error fetching corporate vouchers:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch corporate vouchers',
      error: error.message
    });
  }
});

/**
 * Validate a voucher code (PUBLIC - no auth required for customer self-registration)
 * GET /api/vouchers/validate/:code
 * PROTECTED: Rate limited to prevent brute force enumeration
 */
router.get('/validate/:code',
  suspiciousActivityDetector,
  voucherValidationLimiter,
  async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({
        type: 'error',
        status: 'error',
        message: 'Voucher code is required.'
      });
    }

    const trimmedCode = code.trim();

    // Try individual purchases first
    const individualResult = await db.query(
      `SELECT
        id,
        voucher_code,
        passport_number,
        customer_name as full_name,
        valid_until,
        used_at,
        created_at,
        amount,
        CASE
          WHEN used_at IS NOT NULL THEN 'used'
          WHEN valid_until < NOW() THEN 'expired'
          WHEN passport_number IS NULL
            OR passport_number = ''
            OR UPPER(TRIM(passport_number)) IN ('PENDING', 'NA', 'N/A', 'NONE') THEN 'pending_passport'
          ELSE 'active'
        END as computed_status
      FROM individual_purchases
      WHERE voucher_code = $1`,
      [trimmedCode]
    );

    // Try corporate vouchers if not found in individual purchases
    // Note: corporate_vouchers uses redeemed_date instead of used_at
    const corporateResult = await db.query(
      `SELECT
        cv.id,
        cv.voucher_code,
        cv.company_name,
        cv.passport_number,
        cv.valid_until,
        cv.redeemed_date as used_at,
        cv.amount,
        p.full_name,
        p.nationality,
        CASE
          WHEN cv.redeemed_date IS NOT NULL THEN 'used'
          WHEN cv.valid_until < NOW() THEN 'expired'
          WHEN cv.passport_number IS NOT NULL THEN 'active'
          WHEN cv.passport_number IS NULL THEN 'pending_passport'
          ELSE 'invalid'
        END as computed_status
      FROM corporate_vouchers cv
      LEFT JOIN passports p ON cv.passport_id = p.id
      WHERE cv.voucher_code = $1`,
      [trimmedCode]
    );

    const voucherData = individualResult.rows[0] || corporateResult.rows[0];
    const voucherType = individualResult.rows[0] ? 'Individual' : corporateResult.rows[0] ? 'Corporate' : null;

    if (!voucherData) {
      return res.json({
        type: 'error',
        status: 'error',
        message: 'INVALID - Voucher code not found'
      });
    }

    // Debug logging
    console.log('[Voucher Validation]', {
      code: trimmedCode,
      type: voucherType,
      voucherData: {
        id: voucherData.id,
        passport_number: voucherData.passport_number,
        valid_until: voucherData.valid_until,
        used_at: voucherData.used_at,
        computed_status: voucherData.computed_status
      }
    });

    const actualStatus = voucherData.computed_status;

    // ONLY "active" status is valid - all others trigger error sound

    // 1. Check if already used
    if (actualStatus === 'used' || voucherData.used_at) {
      const usedDate = new Date(voucherData.used_at).toLocaleDateString();
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `INVALID - Already used on ${usedDate}`,
        data: { ...voucherData, voucherType, actualStatus }
      });
    }

    // 2. Check if expired by date
    if (actualStatus === 'expired') {
      const expiryDate = new Date(voucherData.valid_until).toLocaleDateString();
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `INVALID - Expired on ${expiryDate}`,
        data: { ...voucherData, voucherType, actualStatus }
      });
    }

    // 3. Check if pending passport registration
    if (actualStatus === 'pending_passport' || !voucherData.passport_number) {
      return res.json({
        type: 'voucher',
        status: 'error',
        message: 'INVALID - Passport registration required. Please register your passport to this voucher before use.',
        data: { ...voucherData, voucherType, actualStatus, requiresRegistration: true }
      });
    }

    // 4. Check if status is anything other than "active"
    if (actualStatus !== 'active') {
      const statusMsg = actualStatus || 'undefined';
      return res.json({
        type: 'voucher',
        status: 'error',
        message: `INVALID - Status: ${statusMsg}`,
        data: { ...voucherData, voucherType, actualStatus: statusMsg }
      });
    }

    // 5. VALID: Status is "active" - Mark as used and return success
    try {
      // Mark voucher as used in the appropriate table
      if (voucherType === 'Individual') {
        await db.query(
          `UPDATE individual_purchases
           SET used_at = NOW()
           WHERE voucher_code = $1 AND used_at IS NULL`,
          [trimmedCode]
        );
      } else if (voucherType === 'Corporate') {
        // Corporate vouchers use redeemed_date instead of used_at
        await db.query(
          `UPDATE corporate_vouchers
           SET redeemed_date = NOW()
           WHERE voucher_code = $1 AND redeemed_date IS NULL`,
          [trimmedCode]
        );
      }

      // Return success response
      return res.json({
        type: 'voucher',
        status: 'success',
        message: '✅ VALID - Entry approved',
        data: {
          ...voucherData,
          voucherType,
          actualStatus,
          markedAsUsed: true,
          usedAt: new Date().toISOString(),
          passportInfo: {
            passportNumber: voucherData.passport_number,
            fullName: voucherData.full_name,
            nationality: voucherData.nationality
          }
        }
      });
    } catch (error) {
      console.error('Error marking voucher as used:', error);
      // Even if marking fails, return the validation result
      return res.json({
        type: 'voucher',
        status: 'success',
        message: '✅ VALID - Entry approved (mark failed)',
        data: {
          ...voucherData,
          voucherType,
          actualStatus,
          markedAsUsed: false,
          passportInfo: {
            passportNumber: voucherData.passport_number,
            fullName: voucherData.full_name,
            nationality: voucherData.nationality
          }
        }
      });
    }

  } catch (error) {
    console.error('Voucher validation error:', error);
    return res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Error validating voucher. Please try again.'
    });
  }
});

/**
 * Mark voucher as used
 * POST /api/vouchers/mark-used/:code
 */
router.post('/mark-used/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Voucher code is required.' });
    }

    const trimmedCode = code.trim();

    // Try to update individual purchase
    const individualResult = await db.query(
      `UPDATE individual_purchases
       SET used_at = NOW()
       WHERE voucher_code = $1 AND used_at IS NULL
       RETURNING id, voucher_code`,
      [trimmedCode]
    );

    if (individualResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Individual voucher marked as used.',
        voucher: individualResult.rows[0]
      });
    }

    // Try to update corporate voucher
    const corporateResult = await db.query(
      `UPDATE corporate_vouchers
       SET redeemed_date = NOW()
       WHERE voucher_code = $1 AND redeemed_date IS NULL
       RETURNING id, voucher_code`,
      [trimmedCode]
    );

    if (corporateResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Corporate voucher marked as used.',
        voucher: corporateResult.rows[0]
      });
    }

    // Voucher not found or already used
    return res.status(404).json({
      error: 'Voucher not found or already used.'
    });

  } catch (error) {
    console.error('Mark voucher used error:', error);
    return res.status(500).json({
      error: 'Error marking voucher as used. Please try again.'
    });
  }
});

/**
 * Create bulk corporate vouchers (Ad hoc generation)
 * POST /api/vouchers/bulk-corporate
 * 
 * Flow: Payment → Vouchers Generated → Invoice Created (marked as paid)
 * 
 * For Finance_Manager and Flex_Admin: Creates invoice after vouchers are generated
 * For Counter_Agent: Just creates vouchers (no invoice)
 */
router.post('/bulk-corporate', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      company_name,
      count,
      amount,
      valid_from,
      valid_until,
      payment_method,
      discount,
      collected_amount
    } = req.body;

    // Validation
    if (!company_name || !count || !amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Missing required fields: company_name, count, amount'
      });
    }

    if (count < 1 || count > 1000) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Count must be between 1 and 1000'
      });
    }

    const userRole = req.user.role;
    // Invoice creation is now handled via invoice-first flow (/api/invoices/corporate)
    const shouldCreateInvoice = false;

    // Generate vouchers
    const vouchers = [];
    const validFrom = valid_from || new Date().toISOString();
    const validUntil = valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    // Note: production schema for corporate_vouchers does not include payment_method column
    const paymentMethod = payment_method || 'Cash';
    const discountAmount = discount || 0;
    const voucherAmount = parseFloat(amount);

    for (let i = 0; i < count; i++) {
      // Generate unique voucher code (8-char alphanumeric)
      const voucherCode = voucherConfig.helpers.generateVoucherCode('CORP');

      const result = await client.query(
        `INSERT INTO corporate_vouchers (
          voucher_code,
          company_name,
          amount,
          valid_from,
          valid_until,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          voucherCode,
          company_name,
          voucherAmount,
          validFrom,
          validUntil,
          'pending_passport' // Requires passport registration
        ]
      );

      vouchers.push(result.rows[0]);

      // Small delay to ensure unique timestamps
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // For Finance_Manager and Flex_Admin: Create invoice after vouchers are generated
    // (disabled; handled via /api/invoices/corporate)
    let invoice = null;
    if (shouldCreateInvoice) {
      // Helper functions for invoice generation (inline to avoid circular dependency)
      const generateInvoiceNumber = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = 'INV';
        const yearMonth = `${year}${month}`;

        const result = await client.query(
          `SELECT invoice_number FROM invoices
           WHERE invoice_number LIKE $1
           ORDER BY invoice_number DESC
           LIMIT 1`,
          [`${prefix}-${yearMonth}-%`]
        );

        let nextNumber = 1;
        if (result.rows.length > 0) {
          const lastNumber = result.rows[0].invoice_number.split('-')[2];
          nextNumber = parseInt(lastNumber) + 1;
        }

        const paddedNumber = String(nextNumber).padStart(4, '0');
        return `${prefix}-${yearMonth}-${paddedNumber}`;
      };

      const calculateGST = (subtotal, gstRate = 10.00) => {
        return parseFloat((subtotal * (gstRate / 100)).toFixed(2));
      };
      
      // Calculate invoice totals
      const subtotal = count * voucherAmount;
      const discountValue = subtotal * (discountAmount / 100);
      const subtotalAfterDiscount = subtotal - discountValue;
      const gstRate = 10.00; // PNG GST rate
      const gstAmount = calculateGST(subtotalAfterDiscount, gstRate);
      const totalAmount = subtotalAfterDiscount + gstAmount;
      const amountPaid = collected_amount || totalAmount; // Use collected amount or total

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();

      // Create invoice items
      const items = [{
        description: `Green Fee Vouchers - ${count} voucher${count > 1 ? 's' : ''}`,
        quantity: count,
        unitPrice: voucherAmount,
        gstApplicable: true
      }];

      // Create invoice (marked as paid since payment already received)
      const invoiceDate = new Date();
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // Net 30 days

      // Check if customer exists to get their details
      let customerAddress = null;
      let customerEmail = null;
      let customerPhone = null;
      let customerTin = null;

      if (req.body.customer_id) {
        const customerResult = await client.query(
          'SELECT address, email, phone, tin FROM customers WHERE id = $1',
          [req.body.customer_id]
        );
        if (customerResult.rows.length > 0) {
          customerAddress = customerResult.rows[0].address;
          customerEmail = customerResult.rows[0].email;
          customerPhone = customerResult.rows[0].phone;
          customerTin = customerResult.rows[0].tin;
        }
      }

      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          invoice_number,
          customer_name,
          customer_address,
          customer_tin,
          customer_email,
          customer_phone,
          invoice_date,
          due_date,
          status,
          items,
          subtotal,
          gst_rate,
          gst_amount,
          net_amount,
          total_amount,
          amount_paid,
          amount_due,
          payment_terms,
          notes,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          invoiceNumber,
          company_name,
          customerAddress || null,
          customerTin || null,
          customerEmail || null,
          customerPhone || null,
          invoiceDate,
          dueDate,
          'paid', // Mark as paid since payment already received
          JSON.stringify(items),
          subtotalAfterDiscount,
          gstRate,
          gstAmount,
          subtotalAfterDiscount,
          totalAmount,
          amountPaid,
          0, // amount_due is 0 since already paid
          'Net 30 days',
          `Ad hoc voucher generation - ${count} vouchers${discountAmount > 0 ? ` (${discountAmount}% discount applied)` : ''}`,
          req.user.id
        ]
      );

      invoice = invoiceResult.rows[0];

      // Record payment transaction in invoice_payments table
      await client.query(
        `INSERT INTO invoice_payments (
          invoice_id,
          payment_date,
          amount,
          payment_method,
          reference_number,
          notes,
          recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          invoice.id,
          invoiceDate,
          amountPaid,
          paymentMethod,
          `ADHOC-${Date.now()}`, // Reference number for ad hoc generation
          `Payment received for ad hoc voucher generation`,
          req.user.id
        ]
      );
    }

    await client.query('COMMIT');

    const response = {
      success: true,
      message: `Successfully created ${vouchers.length} corporate vouchers${invoice ? ' and invoice' : ''}`,
      vouchers
    };

    if (invoice) {
      response.invoice = invoice;
      response.invoice_number = invoice.invoice_number;
    }

    res.json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk corporate voucher creation error:', error);
    return res.status(500).json({
      error: 'Error creating bulk corporate vouchers',
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Email corporate vouchers to customer
 * POST /api/vouchers/email-vouchers
 * ENHANCED: Sends each voucher as a separate PDF attachment
 */
router.post('/email-vouchers', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { voucher_ids, company_name, recipient_email } = req.body;

    // Validation
    if (!voucher_ids || !Array.isArray(voucher_ids) || voucher_ids.length === 0) {
      return res.status(400).json({ error: 'Voucher IDs are required' });
    }

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Get vouchers
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE id = ANY($1) ORDER BY voucher_code',
      [voucher_ids]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found' });
    }

    const vouchers = result.rows;
    const companyName = company_name || vouchers[0].company_name;

    // Generate SEPARATE PDF for EACH voucher using standardized template
    const pdfAttachments = [];
    for (const voucher of vouchers) {
      // Use generateVoucherPDFBuffer for standardized template
      const pdfBuffer = await generateVouchersPDF([voucher], companyName);
      pdfAttachments.push({
        filename: `voucher-${voucher.voucher_code}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings need to be configured'
      });
    }

    // Email HTML - Updated to mention separate PDFs
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .voucher-list { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
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
      <p>Dear ${companyName},</p>

      <div class="message">
        <p>Your ${vouchers.length} passport voucher${vouchers.length > 1 ? 's are' : ' is'} attached to this email as separate PDF files.</p>
      </div>

      <div class="voucher-list">
        <p style="margin-top: 0;"><strong>Attached Vouchers (${vouchers.length} files):</strong></p>
        <ul style="margin-bottom: 0;">
          ${vouchers.map(v => `<li><strong>${v.voucher_code}</strong> - ${v.passport_number || 'Unregistered'}</li>`).join('\n          ')}
        </ul>
      </div>

      <div class="message">
        <p style="margin-top: 0;"><strong>How to Use Your Vouchers:</strong></p>
        <ol style="margin-bottom: 0;">
          <li>Each voucher is attached as a separate PDF file</li>
          <li>Present your voucher at the counter</li>
          <li>Show valid identification</li>
          <li>Your passport details are already linked</li>
          <li>Complete your transaction</li>
        </ol>
      </div>

      <div class="important">
        <p style="margin-top: 0;"><strong>Important:</strong></p>
        <ul style="margin-bottom: 0;">
          <li>Keep your vouchers safe</li>
          <li>Each voucher can only be used once</li>
          <li>Bring valid ID when using vouchers</li>
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

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient_email,
      subject: `${companyName} - Airport Exit Vouchers (${vouchers.length} voucher${vouchers.length > 1 ? 's' : ''})`,
      html: htmlContent,
      attachments: pdfAttachments // Each voucher as separate PDF
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `${vouchers.length} voucher${vouchers.length > 1 ? 's' : ''} emailed successfully to ${recipient_email} as separate PDF files`,
      voucher_count: vouchers.length
    });

  } catch (error) {
    console.error('Error emailing vouchers:', error);
    res.status(500).json({ error: 'Failed to email vouchers' });
  }
});

/**
 * Download single voucher PDF by ID
 * GET /api/vouchers/download/:id
 * Used by voucher registration success page
 */
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get voucher from corporate_vouchers table with Finance Manager name
    const result = await db.query(
      `SELECT cv.*, p.full_name, p.nationality, u.name as created_by_name
       FROM corporate_vouchers cv
       LEFT JOIN passports p ON cv.passport_id = p.id
       LEFT JOIN "User" u ON cv.created_by = u.id
       WHERE cv.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];
    const companyName = voucher.company_name || 'Company';

    // Generate PDF for single voucher
    const pdfBuffer = await generateVouchersPDF([voucher], companyName);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="voucher-${voucher.voucher_code}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading voucher:', error);
    res.status(500).json({ error: 'Failed to download voucher PDF' });
  }
});

/**
 * Email single voucher PDF by ID
 * POST /api/vouchers/email-single/:id
 * Used by voucher registration success page
 */
router.post('/email-single/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_email } = req.body;

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get voucher from corporate_vouchers table with Finance Manager name
    const result = await db.query(
      `SELECT cv.*, p.full_name, p.nationality, u.name as created_by_name
       FROM corporate_vouchers cv
       LEFT JOIN passports p ON cv.passport_id = p.id
       LEFT JOIN "User" u ON cv.created_by = u.id
       WHERE cv.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];
    const companyName = voucher.company_name || 'Company';

    // Generate PDF for single voucher
    const pdfBuffer = await generateVouchersPDF([voucher], companyName);

    // Create transporter
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Send email with PDF attachment
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient_email,
      subject: `Your GREEN CARD Voucher - ${voucher.voucher_code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Your GREEN CARD Voucher is Ready!</h2>

          <p>Dear Customer,</p>

          <p>Your GREEN CARD voucher has been successfully registered and is now active.</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Voucher Code:</strong> ${voucher.voucher_code}</p>
            <p style="margin: 5px 0;"><strong>Passport Number:</strong> ${voucher.passport_number || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> PGK ${voucher.amount}</p>
            <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${new Date(voucher.valid_until).toLocaleDateString()}</p>
          </div>

          <p><strong>Important Information:</strong></p>
          <ul>
            <li>Present your voucher code at the entry checkpoint</li>
            <li>Keep your passport with you for verification</li>
            <li>This voucher is valid for single-use entry</li>
          </ul>

          <p>Your voucher PDF is attached to this email.</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from PNG Green Fees System.<br>
            For assistance, please contact your organization administrator.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `voucher-${voucher.voucher_code}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Voucher emailed successfully to ${recipient_email}`
    });
  } catch (error) {
    console.error('Error emailing single voucher:', error);
    res.status(500).json({ error: 'Failed to email voucher' });
  }
});

/**
 * Download batch as ZIP file
 * GET /api/vouchers/download-batch/:batchId
 */
router.get('/download-batch/:batchId', auth, checkRole('Flex_Admin', 'Finance_Manager', 'IT_Support', 'Counter_Agent'), async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get all vouchers in the batch
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE batch_id = $1 ORDER BY voucher_code',
      [batchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found in this batch' });
    }

    const vouchers = result.rows;
    const companyName = vouchers[0].company_name || 'Company';
    const batchName = `${companyName.replace(/\s+/g, '_')}_Batch_${batchId}`;

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${batchName}.zip"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Error creating ZIP archive' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Generate and add each voucher as a separate PDF
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];
      const pdfBuffer = await generateVouchersPDF([voucher], companyName);

      // Add PDF to archive with voucher code as filename
      archive.append(pdfBuffer, {
        name: `Voucher_${voucher.voucher_code}.pdf`
      });
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Error downloading batch:', error);
    res.status(500).json({ error: 'Failed to download batch' });
  }
});

/**
 * Email entire batch to company
 * POST /api/vouchers/email-batch
 */
router.post('/email-batch', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { batch_id, recipient_email } = req.body;

    // Validation
    if (!batch_id) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    if (!recipient_email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Get all vouchers in the batch
    const result = await db.query(
      'SELECT * FROM corporate_vouchers WHERE batch_id = $1 ORDER BY voucher_code',
      [batch_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found in this batch' });
    }

    const vouchers = result.rows;
    const companyName = vouchers[0].company_name || 'Company';

    // Generate single PDF with all vouchers
    const pdfBuffer = await generateVouchersPDF(vouchers, companyName);

    // Send email
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP settings need to be configured'
      });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .voucher-summary { background: white; padding: 20px; border-left: 4px solid #059669; margin: 20px 0; }
    .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PNG Green Fees</h1>
      <p>Corporate Airport Exit Vouchers - Batch ${batch_id}</p>
    </div>

    <div class="content">
      <h2>Dear ${companyName},</h2>
      <p>Your corporate airport exit vouchers batch is ready! Please find all vouchers attached as a single PDF document.</p>

      <div class="voucher-summary">
        <strong>Batch Summary:</strong><br>
        Batch ID: ${batch_id}<br>
        Total Vouchers: ${vouchers.length}<br>
        Valid Until: ${new Date(vouchers[0].valid_until).toLocaleDateString()}<br>
        Amount per Voucher: PGK ${parseFloat(vouchers[0].amount).toFixed(2)}<br>
        Total Value: PGK ${(parseFloat(vouchers[0].amount) * vouchers.length).toFixed(2)}
      </div>

      <div class="important">
        <strong>⚠️ Important Instructions:</strong>
        <ol>
          <li><strong>Print the attached PDF</strong> - Each voucher is on a separate page with a large QR code</li>
          <li><strong>Distribute to employees</strong> - Give each employee their voucher page</li>
          <li><strong>Present at airport exit</strong> - Show voucher QR code for scanning</li>
          <li><strong>One-time use only</strong> - Each voucher can only be used ONCE</li>
          <li><strong>Cannot be reused</strong> - Once scanned, the voucher is permanently deactivated</li>
        </ol>
      </div>

      <p><strong>How to Use:</strong></p>
      <ul>
        <li>Employee presents voucher at airport exit checkpoint</li>
        <li>Airport staff scans the QR code</li>
        <li>System validates the voucher (checks if not already used and not expired)</li>
        <li>If valid, exit is approved and voucher is marked as used</li>
      </ul>

      <p>If you have any questions, please contact our support team.</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PNG Green Fees System. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient_email,
      subject: `${companyName} - Batch ${batch_id} Airport Exit Vouchers (${vouchers.length} vouchers)`,
      html: htmlContent,
      attachments: [
        {
          filename: `${companyName.replace(/\s+/g, '_')}_Batch_${batch_id}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Batch ${batch_id} emailed successfully to ${recipient_email}`,
      voucher_count: vouchers.length
    });

  } catch (error) {
    console.error('Error emailing batch:', error);
    res.status(500).json({ error: 'Failed to email batch' });
  }
});

// GET /api/vouchers/by-passport/:passportNumber endpoint removed - feature deprecated

/**
 * POST /api/vouchers/bulk-email
 * Email multiple individual vouchers
 * Requires: Authentication
 */
router.post('/bulk-email',
  auth,
  [
    body('voucherIds')
      .isArray({ min: 1 })
      .withMessage('At least one voucher ID required'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address required')
  ],
  validate,
  async (req, res) => {
  try {
    const { voucherIds, email } = req.body;

    // Find vouchers in individual_purchases table
    const result = await db.query(`
      SELECT ip.*
      FROM individual_purchases ip
      WHERE ip.id = ANY($1)
      ORDER BY ip.created_at
    `, [voucherIds]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found' });
    }

    const vouchers = result.rows;

    // Create email transporter
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Generate separate PDF for each voucher
    const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
    const pdfAttachments = [];

    for (const voucher of vouchers) {
      const pdfBuffer = await generateVoucherPDFBuffer([voucher], voucher.customer_name || 'Individual');
      pdfAttachments.push({
        filename: `voucher-${voucher.voucher_code}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // Send email with all voucher PDFs
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `PNG Green Fee Vouchers (${vouchers.length} vouchers)`,
      html: `
        <h2>PNG Green Fee Vouchers</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your ${vouchers.length} PNG Green Fee voucher(s).</p>
        <ul>
          ${vouchers.map(v => `
            <li><strong>${v.voucher_code}</strong> - PGK ${parseFloat(v.amount || 0).toFixed(2)}${v.passport_number ? ` (Passport: ${v.passport_number})` : ''}</li>
          `).join('')}
        </ul>
        <p>Please present these vouchers at the airport.</p>
        <p>Thank you,<br>PNG Green Fees Team</p>
      `,
      attachments: pdfAttachments
    });

    console.log(`Bulk email sent successfully to ${email} with ${vouchers.length} vouchers`);

    res.json({
      success: true,
      message: `${vouchers.length} voucher(s) sent to ${email}`,
      vouchers_sent: vouchers.length
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      error: 'Failed to send bulk email',
      message: error.message
    });
  }
});

/**
 * POST /api/vouchers/bulk-download
 * Download multiple vouchers as a ZIP file
 * Requires: Authentication
 */
router.post('/bulk-download',
  auth,
  [
    body('voucherIds')
      .isArray({ min: 1 })
      .withMessage('At least one voucher ID required')
  ],
  validate,
  async (req, res) => {
  try {
    const { voucherIds } = req.body;

    // Find vouchers in individual_purchases table
    const result = await db.query(`
      SELECT ip.*
      FROM individual_purchases ip
      WHERE ip.id = ANY($1)
      ORDER BY ip.created_at
    `, [voucherIds]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No vouchers found' });
    }

    const vouchers = result.rows;

    // Generate PDFs for each voucher
    const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="vouchers-${Date.now()}.zip"`);

    // Pipe archive to response
    archive.pipe(res);

    // Add each voucher PDF to the ZIP
    for (const voucher of vouchers) {
      const pdfBuffer = await generateVoucherPDFBuffer([voucher], voucher.customer_name || 'Individual');
      archive.append(pdfBuffer, { name: `voucher-${voucher.voucher_code}.pdf` });
    }

    // Finalize the archive
    await archive.finalize();

    console.log(`Bulk download generated for ${vouchers.length} vouchers`);

  } catch (error) {
    console.error('Bulk download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate bulk download',
        message: error.message
      });
    }
  }
});

/**
 * POST /api/vouchers/:voucherCode/email
 * Email a single voucher by voucher code
 * Requires: Authentication
 */
router.post('/:voucherCode/email',
  auth,
  [
    param('voucherCode')
      .trim()
      .matches(/^[A-Z0-9]{8}$/)
      .withMessage('Invalid voucher code format'),
    body('recipient_email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address required')
      .isLength({ max: 254 })
      .withMessage('Email address too long')
  ],
  validate,
  async (req, res) => {
  try {
    const { voucherCode } = req.params;
    const { recipient_email } = req.body;

    // Find voucher in individual_purchases table
    const result = await db.query(`
      SELECT
        ip.*
      FROM individual_purchases ip
      WHERE ip.voucher_code = $1
    `, [voucherCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];

    // Create email transporter
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Generate voucher PDF using working pdfGenerator
    const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateVoucherPDFBuffer([voucher], voucher.customer_name || 'Individual');

    // Send email with voucher PDF
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipient_email,
      subject: `PNG Green Fee Voucher - ${voucherCode}`,
      html: `
        <h2>PNG Green Fee Voucher</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your PNG Green Fee voucher.</p>
        <p><strong>Voucher Code:</strong> ${voucherCode}</p>
        ${voucher.passport_number ? `<p><strong>Passport:</strong> ${voucher.passport_number}</p>` : ''}
        <p><strong>Amount:</strong> PGK ${parseFloat(voucher.amount || 0).toFixed(2)}</p>
        <p>Please present this voucher at the airport.</p>
        <p>Thank you,<br>PNG Green Fees Team</p>
      `,
      attachments: [{
        filename: `voucher-${voucherCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    console.log(`Email sent successfully to ${recipient_email} for voucher ${voucherCode}`);

    res.json({
      success: true,
      message: `Voucher ${voucherCode} emailed successfully to ${recipient_email}`
    });

  } catch (error) {
    console.error('Error emailing voucher:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * GET /api/vouchers/code/:voucherCode
 * Get voucher details by code (for print page)
 * Includes passport data if available
 */
router.get('/code/:voucherCode', auth, async (req, res) => {
  try {
    const { voucherCode } = req.params;

    // Try individual purchases first (with passport JOIN)
    const individualResult = await db.query(
      `SELECT ip.*,
              p.id as passport_id,
              p.passport_number as passport_passport_number,
              p.full_name as passport_full_name,
              p.nationality as passport_nationality,
              p.date_of_birth as passport_date_of_birth,
              p.expiry_date as passport_expiry_date
       FROM individual_purchases ip
       LEFT JOIN passports p ON ip.passport_number = p.passport_number
       WHERE ip.voucher_code = $1`,
      [voucherCode]
    );

    if (individualResult.rows.length > 0) {
      const row = individualResult.rows[0];
      const voucher = { ...row };

      // Extract passport data if exists
      if (row.passport_id) {
        voucher.passport = {
          id: row.passport_id,
          passport_number: row.passport_passport_number,
          full_name: row.passport_full_name,
          nationality: row.passport_nationality,
          date_of_birth: row.passport_date_of_birth,
          expiry_date: row.passport_expiry_date
        };
        // Remove passport_ prefixed fields from voucher root
        delete voucher.passport_id;
        delete voucher.passport_passport_number;
        delete voucher.passport_full_name;
        delete voucher.passport_nationality;
        delete voucher.passport_date_of_birth;
        delete voucher.passport_expiry_date;
      }

      return res.json({
        success: true,
        voucher: voucher,
        type: 'individual'
      });
    }

    // Try corporate vouchers (with passport JOIN)
    const corporateResult = await db.query(
      `SELECT cv.*,
              p.id as passport_id,
              p.passport_number as passport_passport_number,
              p.full_name as passport_full_name,
              p.nationality as passport_nationality,
              p.date_of_birth as passport_date_of_birth,
              p.expiry_date as passport_expiry_date
       FROM corporate_vouchers cv
       LEFT JOIN passports p ON cv.passport_number = p.passport_number
       WHERE cv.voucher_code = $1`,
      [voucherCode]
    );

    if (corporateResult.rows.length > 0) {
      const row = corporateResult.rows[0];
      const voucher = { ...row };

      // Extract passport data if exists
      if (row.passport_id) {
        voucher.passport = {
          id: row.passport_id,
          passport_number: row.passport_passport_number,
          full_name: row.passport_full_name,
          nationality: row.passport_nationality,
          date_of_birth: row.passport_date_of_birth,
          expiry_date: row.passport_expiry_date
        };
        // Remove passport_ prefixed fields from voucher root
        delete voucher.passport_id;
        delete voucher.passport_passport_number;
        delete voucher.passport_full_name;
        delete voucher.passport_nationality;
        delete voucher.passport_date_of_birth;
        delete voucher.passport_expiry_date;
      }

      return res.json({
        success: true,
        voucher: voucher,
        type: 'corporate'
      });
    }

    // Not found
    return res.status(404).json({
      success: false,
      error: 'Voucher not found'
    });

  } catch (error) {
    console.error('Error fetching voucher by code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch voucher'
    });
  }
});

/**
 * GET /api/vouchers/:voucherCode/thermal-receipt
 * Generate thermal receipt PDF for POS printers (80mm width)
 * Optimized for Epson TM-T82II and similar thermal printers
 */
router.get('/:voucherCode/thermal-receipt', auth, async (req, res) => {
  try {
    const { voucherCode } = req.params;
    const { generateThermalReceiptPDF } = require('../utils/pdfGenerator');

    // Try to find voucher in individual_purchases first
    let voucher = null;
    let source = null;

    const individualResult = await db.query(
      'SELECT * FROM individual_purchases WHERE voucher_code = $1',
      [voucherCode]
    );

    if (individualResult.rows.length > 0) {
      voucher = individualResult.rows[0];
      source = 'individual';
    } else {
      // Try corporate_vouchers
      const corporateResult = await db.query(
        'SELECT * FROM corporate_vouchers WHERE voucher_code = $1',
        [voucherCode]
      );

      if (corporateResult.rows.length > 0) {
        voucher = corporateResult.rows[0];
        source = 'corporate';
      }
    }

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Generate thermal receipt PDF
    const pdfBuffer = await generateThermalReceiptPDF(voucher);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${voucherCode}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

    console.log(`Thermal receipt generated for voucher ${voucherCode} (${source})`);

  } catch (error) {
    console.error('Error generating thermal receipt:', error);
    res.status(500).json({ error: 'Failed to generate thermal receipt' });
  }
});

module.exports = router;
