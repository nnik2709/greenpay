const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all quotations
router.get('/',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { status, customer, from_date, to_date } = req.query;

      let query = `
        SELECT q.*, u.name as created_by_name, i.invoice_number
        FROM quotations q
        LEFT JOIN "User" u ON q.created_by = u.id
        LEFT JOIN invoices i ON q.id = i.quotation_id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (status) {
        query += ` AND q.status = $${paramCount++}`;
        params.push(status);
      }

      if (customer) {
        query += ` AND (q.company_name ILIKE $${paramCount++} OR q.customer_name ILIKE $${paramCount++} OR q.customer_email ILIKE $${paramCount++})`;
        params.push(`%${customer}%`);
        params.push(`%${customer}%`);
        params.push(`%${customer}%`);
        paramCount += 2; // Increment for the extra placeholders
      }

      if (from_date) {
        query += ` AND q.created_at >= $${paramCount++}`;
        params.push(from_date);
      }

      if (to_date) {
        query += ` AND q.created_at <= $${paramCount++}`;
        params.push(to_date);
      }

      query += ' ORDER BY q.created_at DESC';

      const result = await db.query(query, params);
      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get quotations error:', error);
      res.status(500).json({ error: 'Failed to fetch quotations' });
    }
  }
);

// Get single quotation by ID
router.get('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT q.*, u.name as created_by_name, i.invoice_number
         FROM quotations q
         LEFT JOIN "User" u ON q.created_by = u.id
         LEFT JOIN invoices i ON q.id = i.quotation_id
         WHERE q.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Get quotation error:', error);
      res.status(500).json({ error: 'Failed to fetch quotation' });
    }
  }
);

// Create new quotation
router.post('/',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('quotation_number').notEmpty().withMessage('Quotation number is required'),
    body('company_name').notEmpty().withMessage('Company name is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']).withMessage('Invalid status')
  ],
  validate,
  async (req, res) => {
    try {
      const {
        quotation_number,
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        number_of_vouchers,
        unit_price,
        line_total,
        discount_percentage,
        discount_amount,
        amount,
        tax_amount,
        total_amount,
        status,
        valid_until,
        notes,
        items,
        apply_gst,
        gst_rate: provided_gst_rate,
        gst_amount: provided_gst_amount
      } = req.body;

      // Calculate GST fields - OPTIONAL (default: no GST)
      const subtotal = amount;
      const applyGst = apply_gst === true || apply_gst === 'true';
      const gst_rate = applyGst ? (provided_gst_rate || 10.00) : 0;
      const gst_amount = applyGst ? (provided_gst_amount || parseFloat((subtotal * (gst_rate / 100)).toFixed(2))) : 0;
      const final_total = total_amount || (subtotal + gst_amount);

      const result = await db.query(
        `INSERT INTO quotations (
          quotation_number, customer_name, customer_email, description,
          number_of_vouchers, unit_price, line_total, discount_percentage, discount_amount,
          subtotal, tax_percentage, tax_amount, total_amount,
          status, valid_until, gst_rate, gst_amount, payment_terms,
          created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        RETURNING *`,
        [
          quotation_number,
          company_name,
          contact_email || '',
          notes || `Contact: ${contact_person || ''}, Phone: ${contact_phone || ''}`,
          number_of_vouchers || 1,
          unit_price || 50.00,
          line_total || subtotal,
          discount_percentage || 0,
          discount_amount || 0,
          subtotal,
          gst_rate,
          gst_amount,
          final_total,
          status || 'draft',
          valid_until,
          gst_rate,
          gst_amount,
          'Net 30 days',
          req.userId
        ]
      );

      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      console.error('Create quotation error:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Quotation number already exists' });
      }
      res.status(500).json({ error: 'Failed to create quotation' });
    }
  }
);

// Update quotation
router.put('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']).withMessage('Invalid status'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if quotation exists and is not converted to invoice
      const existingQuotation = await db.query(
        'SELECT converted_to_invoice, status FROM quotations WHERE id = $1',
        [id]
      );

      if (existingQuotation.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      if (existingQuotation.rows[0].converted_to_invoice) {
        return res.status(400).json({
          error: 'Cannot edit quotation that has been converted to invoice'
        });
      }

      const {
        company_name,
        contact_person,
        contact_email,
        contact_phone,
        number_of_vouchers,
        unit_price,
        line_total,
        discount_percentage,
        discount_amount,
        amount,
        tax_amount,
        total_amount,
        status,
        valid_until,
        notes,
        items
      } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      // After editing, quotation must be re-sent before conversion
      // Reset status to 'draft' unless explicitly setting to 'sent'
      const newStatus = status === 'sent' ? 'sent' : 'draft';
      updates.push(`status = $${paramCount++}`);
      values.push(newStatus);

      // Map frontend fields to actual database columns
      if (company_name !== undefined) {
        // Update both customer_name and company_name for compatibility
        updates.push(`customer_name = $${paramCount++}`);
        values.push(company_name);
        updates.push(`company_name = $${paramCount++}`);
        values.push(company_name);
      }
      if (contact_email !== undefined) {
        updates.push(`customer_email = $${paramCount++}`);
        values.push(contact_email);
      }
      // Contact person and phone go into description field
      if (contact_person !== undefined || contact_phone !== undefined || notes !== undefined) {
        const contactInfo = `Contact: ${contact_person || ''}, Phone: ${contact_phone || ''}`;
        const fullDescription = notes ? `${notes}\n${contactInfo}` : contactInfo;
        updates.push(`description = $${paramCount++}`);
        values.push(fullDescription);
      }
      if (number_of_vouchers !== undefined) {
        updates.push(`number_of_vouchers = $${paramCount++}`);
        values.push(number_of_vouchers);
      }
      if (unit_price !== undefined) {
        updates.push(`unit_price = $${paramCount++}`);
        values.push(unit_price);
      }
      if (line_total !== undefined) {
        updates.push(`line_total = $${paramCount++}`);
        values.push(line_total);
      }
      if (discount_percentage !== undefined) {
        updates.push(`discount_percentage = $${paramCount++}`);
        values.push(discount_percentage);
      }
      if (discount_amount !== undefined) {
        updates.push(`discount_amount = $${paramCount++}`);
        values.push(discount_amount);
      }
      if (amount !== undefined) {
        updates.push(`subtotal = $${paramCount++}`);
        values.push(amount);
      }
      if (tax_amount !== undefined) {
        // Update both tax_amount and gst_amount (they're the same)
        updates.push(`tax_amount = $${paramCount++}`);
        values.push(tax_amount);
        updates.push(`gst_amount = $${paramCount++}`);
        values.push(tax_amount);
        updates.push(`gst_rate = $${paramCount++}`);
        values.push(10.00); // PNG GST rate
        updates.push(`tax_percentage = $${paramCount++}`);
        values.push(10.00);
      }
      if (total_amount !== undefined) {
        updates.push(`total_amount = $${paramCount++}`);
        values.push(total_amount);
      }
      // Status is already set at the beginning (draft or sent)
      if (valid_until !== undefined) {
        updates.push(`valid_until = $${paramCount++}`);
        values.push(valid_until);
      }
      // notes is already handled above in description field
      if (items !== undefined) {
        updates.push(`items = $${paramCount++}`);
        values.push(JSON.stringify(items));
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `
        UPDATE quotations
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Update quotation error:', error);
      res.status(500).json({ error: 'Failed to update quotation' });
    }
  }
);

// Delete quotation
router.delete('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if quotation exists and is not converted to invoice
      const existingQuotation = await db.query(
        'SELECT converted_to_invoice FROM quotations WHERE id = $1',
        [id]
      );

      if (existingQuotation.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      if (existingQuotation.rows[0].converted_to_invoice) {
        return res.status(400).json({
          error: 'Cannot delete quotation that has been converted to invoice'
        });
      }

      const result = await db.query(
        'DELETE FROM quotations WHERE id = $1 RETURNING id',
        [id]
      );

      res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
      console.error('Delete quotation error:', error);
      res.status(500).json({ error: 'Failed to delete quotation' });
    }
  }
);

// Mark quotation as sent
router.patch('/:id/mark-sent',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE quotations
         SET status = 'sent', sent_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Mark quotation as sent error:', error);
      res.status(500).json({ error: 'Failed to mark quotation as sent' });
    }
  }
);

// Approve quotation
router.patch('/:id/approve',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `UPDATE quotations
         SET status = 'approved', approved_by = $1, approved_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [req.userId, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Approve quotation error:', error);
      res.status(500).json({ error: 'Failed to approve quotation' });
    }
  }
);

// Get quotation statistics
router.get('/stats/summary',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
          COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
          COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
          COALESCE(SUM(total_amount), 0) as total_value,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'converted'), 0) as converted_value,
          CASE
            WHEN COUNT(*) > 0 THEN
              (COUNT(*) FILTER (WHERE status = 'converted')::float / COUNT(*)::float * 100)
            ELSE 0
          END as conversion_rate
        FROM quotations
      `);

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Get quotation statistics error:', error);
      res.status(500).json({ error: 'Failed to fetch quotation statistics' });
    }
  }
);

// Send quotation by email
router.post('/send-email',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('quotationId').notEmpty().withMessage('Quotation ID is required'),
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { quotationId, recipientEmail } = req.body;

      // Get quotation details by quotation_number (not ID)
      const result = await db.query(
        `SELECT q.*, u.name as created_by_name
         FROM quotations q
         LEFT JOIN "User" u ON q.created_by = u.id
         WHERE q.quotation_number = $1`,
        [quotationId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found. Please check the quotation number.' });
      }

      const quotation = result.rows[0];

      // Import email service
      const { sendQuotationEmail } = require('../services/notificationService');

      // Send email
      await sendQuotationEmail(recipientEmail, quotation);

      // Mark as sent
      await db.query(
        `UPDATE quotations
         SET status = 'sent', sent_at = NOW()
         WHERE quotation_number = $1`,
        [quotationId]
      );

      res.json({
        success: true,
        message: 'Quotation sent successfully',
        data: { ...quotation, status: 'sent' }
      });
    } catch (error) {
      console.error('Send quotation email error:', error);
      res.status(500).json({ error: 'Failed to send quotation email' });
    }
  }
);

// Download quotation as PDF
router.get('/:id/pdf',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get quotation details
      const result = await db.query(
        `SELECT q.*, u.name as created_by_name
         FROM quotations q
         LEFT JOIN "User" u ON q.created_by = u.id
         WHERE q.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      const quotation = result.rows[0];

      // Generate PDF using existing PDF generator
      const { generateQuotationPDF } = require('../utils/pdfGenerator');
      const pdfBuffer = await generateQuotationPDF(quotation);

      // Send PDF as download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation_${quotation.quotation_number}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Generate quotation PDF error:', error);
      res.status(500).json({ error: 'Failed to generate quotation PDF' });
    }
  }
);

// Convert quotation to invoice
router.post('/:id/convert-to-invoice',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get quotation details
      const quotation = await db.query(
        'SELECT * FROM quotations WHERE id = $1',
        [id]
      );

      if (quotation.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

      const q = quotation.rows[0];

      // Generate invoice number (could be more sophisticated)
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice from quotation (align to existing invoices schema)
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const customerName = q.customer_name || q.company_name || 'N/A';
      const customerEmail = q.customer_email || q.contact_email || '';
      const customerPhone = q.customer_phone || q.contact_phone || '';

      const itemsArray = q.items
        ? (typeof q.items === 'string' ? JSON.parse(q.items) : q.items)
        : [{
            description: `Green Fee Vouchers - ${q.number_of_vouchers || 1}`,
            quantity: q.number_of_vouchers || 1,
            unitPrice: q.unit_price || 50
          }];
      const items = JSON.stringify(itemsArray);

      const subtotal = Number(q.total_amount || q.amount || (q.number_of_vouchers || 1) * (q.unit_price || 50)) || 0;
      const gstRate = Number(q.gst_rate || 0);
      const gstAmount = Number(q.gst_amount || 0);
      const netAmount = subtotal;
      const totalAmount = subtotal + gstAmount;

      const result = await db.query(
        `INSERT INTO invoices (
          invoice_number,
          customer_name,
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
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16
        )
        RETURNING *`,
        [
          invoiceNumber,
          customerName,
          invoiceDate,
          dueDate,
          'pending',
          items,
          subtotal,
          gstRate,
          gstAmount,
          netAmount,
          totalAmount,
          0,
          totalAmount,
          'Net 30 days',
          `Converted from quotation ${q.quotation_number || 'N/A'}`,
          req.userId
        ]
      );

      // Update quotation status to accepted
      await db.query(
        'UPDATE quotations SET status = $1 WHERE id = $2',
        ['accepted', id]
      );

      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      console.error('Convert quotation error:', error);
      res.status(500).json({ error: 'Failed to convert quotation' });
    }
  }
);

module.exports = router;
