const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all payment modes
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "PaymentMode" ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get payment modes error:', error);
    res.status(500).json({ error: 'Failed to get payment modes' });
  }
});

// Get active payment modes only
router.get('/active', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "PaymentMode" WHERE active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get active payment modes error:', error);
    res.status(500).json({ error: 'Failed to get active payment modes' });
  }
});

// Get payment mode by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM "PaymentMode" WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment mode not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get payment mode error:', error);
    res.status(500).json({ error: 'Failed to get payment mode' });
  }
});

// Create payment mode (Admin only)
router.post('/',
  auth,
  checkRole('Admin', 'Flex_Admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('collectCardDetails').isBoolean().withMessage('collectCardDetails must be boolean'),
    body('active').optional().isBoolean().withMessage('active must be boolean')
  ],
  validate,
  async (req, res) => {
    try {
      const { name, collectCardDetails, active = true } = req.body;

      const result = await db.query(
        `INSERT INTO "PaymentMode" (name, "collectCardDetails", active, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [name, collectCardDetails, active]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create payment mode error:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Payment mode name already exists' });
      }
      res.status(500).json({ error: 'Failed to create payment mode' });
    }
  }
);

// Update payment mode (Admin only)
router.put('/:id',
  auth,
  checkRole('Admin', 'Flex_Admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('collectCardDetails').optional().isBoolean().withMessage('collectCardDetails must be boolean'),
    body('active').optional().isBoolean().withMessage('active must be boolean')
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, collectCardDetails, active } = req.body;

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (collectCardDetails !== undefined) {
        updates.push(`"collectCardDetails" = $${paramCount++}`);
        values.push(collectCardDetails);
      }
      if (active !== undefined) {
        updates.push(`active = $${paramCount++}`);
        values.push(active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`"updatedAt" = NOW()`);
      values.push(id);

      const result = await db.query(
        `UPDATE "PaymentMode" SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment mode not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update payment mode error:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Payment mode name already exists' });
      }
      res.status(500).json({ error: 'Failed to update payment mode' });
    }
  }
);

// Delete payment mode (Admin only)
router.delete('/:id',
  auth,
  checkRole('Admin', 'Flex_Admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM "PaymentMode" WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment mode not found' });
      }

      res.json({ message: 'Payment mode deleted successfully' });
    } catch (error) {
      console.error('Delete payment mode error:', error);
      res.status(500).json({ error: 'Failed to delete payment mode' });
    }
  }
);

module.exports = router;
