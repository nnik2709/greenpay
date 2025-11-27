const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all invoices
router.get('/',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;

      let query = `
        SELECT i.*, u.name as created_by_name
        FROM invoices i
        LEFT JOIN "User" u ON i.created_by = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (status) {
        query += ` AND i.status = $${paramCount++}`;
        params.push(status);
      }

      if (startDate) {
        query += ` AND i.created_at >= $${paramCount++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND i.created_at <= $${paramCount++}`;
        params.push(endDate);
      }

      query += ' ORDER BY i.created_at DESC';

      const result = await db.query(query, params);
      res.json({ data: result.rows });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }
);

// Get single invoice by ID
router.get('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT i.*, u.name as created_by_name
         FROM invoices i
         LEFT JOIN "User" u ON i.created_by = u.id
         WHERE i.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  }
);

// Create new invoice
router.post('/',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('invoice_number').notEmpty().withMessage('Invoice number is required'),
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('status').isIn(['draft', 'pending', 'paid', 'cancelled']).withMessage('Invalid status')
  ],
  validate,
  async (req, res) => {
    try {
      const {
        invoice_number,
        customer_name,
        customer_email,
        customer_phone,
        amount,
        tax_amount,
        total_amount,
        status,
        due_date,
        notes,
        items
      } = req.body;

      const result = await db.query(
        `INSERT INTO invoices (
          invoice_number, customer_name, customer_email, customer_phone,
          amount, tax_amount, total_amount, status, due_date, notes,
          items, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          invoice_number,
          customer_name,
          customer_email,
          customer_phone,
          amount,
          tax_amount || 0,
          total_amount || amount,
          status || 'draft',
          due_date,
          notes,
          JSON.stringify(items || []),
          req.userId
        ]
      );

      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      console.error('Create invoice error:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Invoice number already exists' });
      }
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
);

// Update invoice
router.put('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('status').optional().isIn(['draft', 'pending', 'paid', 'cancelled']).withMessage('Invalid status'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        customer_name,
        customer_email,
        customer_phone,
        amount,
        tax_amount,
        total_amount,
        status,
        due_date,
        notes,
        items,
        paid_at
      } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (customer_name !== undefined) {
        updates.push(`customer_name = $${paramCount++}`);
        values.push(customer_name);
      }
      if (customer_email !== undefined) {
        updates.push(`customer_email = $${paramCount++}`);
        values.push(customer_email);
      }
      if (customer_phone !== undefined) {
        updates.push(`customer_phone = $${paramCount++}`);
        values.push(customer_phone);
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
      if (due_date !== undefined) {
        updates.push(`due_date = $${paramCount++}`);
        values.push(due_date);
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }
      if (items !== undefined) {
        updates.push(`items = $${paramCount++}`);
        values.push(JSON.stringify(items));
      }
      if (paid_at !== undefined) {
        updates.push(`paid_at = $${paramCount++}`);
        values.push(paid_at);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const query = `
        UPDATE invoices
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }
);

// Delete invoice
router.delete('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM invoices WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }
);

module.exports = router;
