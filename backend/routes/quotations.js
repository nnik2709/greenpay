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
      const { status, startDate, endDate } = req.query;

      let query = `
        SELECT q.*, u.name as created_by_name
        FROM quotations q
        LEFT JOIN "User" u ON q.created_by = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (status) {
        query += ` AND q.status = $${paramCount++}`;
        params.push(status);
      }

      if (startDate) {
        query += ` AND q.created_at >= $${paramCount++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND q.created_at <= $${paramCount++}`;
        params.push(endDate);
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
        `SELECT q.*, u.name as created_by_name
         FROM quotations q
         LEFT JOIN "User" u ON q.created_by = u.id
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
        amount,
        tax_amount,
        total_amount,
        status,
        valid_until,
        notes,
        items
      } = req.body;

      // Calculate GST fields
      const subtotal = amount;
      const gst_rate = 10.00;
      const gst_amount = tax_amount || parseFloat((subtotal * (gst_rate / 100)).toFixed(2));
      const final_total = total_amount || (subtotal + gst_amount);

      const result = await db.query(
        `INSERT INTO quotations (
          quotation_number, customer_name, customer_email, description,
          subtotal, tax_percentage, tax_amount, total_amount,
          status, valid_until, gst_rate, gst_amount, payment_terms,
          created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          quotation_number,
          company_name,
          contact_email || '',
          notes || `Contact: ${contact_person || ''}, Phone: ${contact_phone || ''}`,
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
      const {
        company_name,
        contact_person,
        contact_email,
        contact_phone,
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

      if (company_name !== undefined) {
        updates.push(`company_name = $${paramCount++}`);
        values.push(company_name);
      }
      if (contact_person !== undefined) {
        updates.push(`contact_person = $${paramCount++}`);
        values.push(contact_person);
      }
      if (contact_email !== undefined) {
        updates.push(`contact_email = $${paramCount++}`);
        values.push(contact_email);
      }
      if (contact_phone !== undefined) {
        updates.push(`contact_phone = $${paramCount++}`);
        values.push(contact_phone);
      }
      if (amount !== undefined) {
        updates.push(`amount = $${paramCount++}`);
        values.push(amount);
      }
      if (tax_amount !== undefined) {
        updates.push(`tax_amount = $${paramCount++}`);
        values.push(tax_amount);
      }
      if (total_amount !== undefined) {
        updates.push(`total_amount = $${paramCount++}`);
        values.push(total_amount);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }
      if (valid_until !== undefined) {
        updates.push(`valid_until = $${paramCount++}`);
        values.push(valid_until);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }
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

      const result = await db.query(
        'DELETE FROM quotations WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }

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

      // Create invoice from quotation
      const result = await db.query(
        `INSERT INTO invoices (
          invoice_number, customer_name, customer_email, customer_phone,
          amount, tax_amount, total_amount, status, notes, items,
          created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *`,
        [
          invoiceNumber,
          q.company_name,
          q.contact_email,
          q.contact_phone,
          q.amount,
          q.tax_amount,
          q.total_amount,
          'pending',
          `Converted from quotation ${q.quotation_number}`,
          q.items,
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
