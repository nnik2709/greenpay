const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/customers - Get all customers
router.get('/', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        name ILIKE $${paramCount} OR
        company_name ILIKE $${paramCount} OR
        email ILIKE $${paramCount} OR
        tin ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', auth, checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers - Create new customer
router.post('/',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager', 'Counter_Agent'),
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('address_line1').trim().notEmpty().withMessage('Address is required for PNG Tax Invoices'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('tin').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const {
        name,
        company_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
        country,
        tin,
        is_gst_registered,
        contact_person,
        notes
      } = req.body;

      const result = await db.query(
        `INSERT INTO customers (
          name, company_name, email, phone,
          address_line1, address_line2, city, province, postal_code, country,
          tin, is_gst_registered, contact_person, notes,
          created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          name,
          company_name || null,
          email || null,
          phone || null,
          address_line1,
          address_line2 || null,
          city || null,
          province || null,
          postal_code || null,
          country || 'Papua New Guinea',
          tin || null,
          is_gst_registered || false,
          contact_person || null,
          notes || null,
          req.user.id,
          'active'
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        customer: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

// PUT /api/customers/:id - Update customer
router.put('/:id',
  auth,
  checkRole('Flex_Admin', 'Finance_Manager'),
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { id } = req.params;
      const {
        name,
        company_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
        country,
        tin,
        is_gst_registered,
        contact_person,
        notes,
        status
      } = req.body;

      const result = await db.query(
        `UPDATE customers SET
          name = COALESCE($1, name),
          company_name = COALESCE($2, company_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          address_line1 = COALESCE($5, address_line1),
          address_line2 = COALESCE($6, address_line2),
          city = COALESCE($7, city),
          province = COALESCE($8, province),
          postal_code = COALESCE($9, postal_code),
          country = COALESCE($10, country),
          tin = COALESCE($11, tin),
          is_gst_registered = COALESCE($12, is_gst_registered),
          contact_person = COALESCE($13, contact_person),
          notes = COALESCE($14, notes),
          status = COALESCE($15, status),
          updated_at = NOW()
        WHERE id = $16
        RETURNING *`,
        [
          name, company_name, email, phone,
          address_line1, address_line2, city, province, postal_code, country,
          tin, is_gst_registered, contact_person, notes, status,
          id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        customer: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }
);

// DELETE /api/customers/:id - Delete (soft delete) customer
router.delete('/:id', auth, checkRole('Flex_Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting status to inactive
    const result = await db.query(
      'UPDATE customers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['inactive', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
