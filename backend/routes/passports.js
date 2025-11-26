const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');

// Get all passports
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', passport_number } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.name as created_by_name
      FROM "Passport" p
      LEFT JOIN "User" u ON p."createdById" = u.id
      WHERE 1=1
    `;
    const params = [];

    // Search by passport number (exact match for lookups)
    if (passport_number) {
      query += ` AND p."passportNo" = $${params.length + 1}`;
      params.push(passport_number);
    }
    // General search
    else if (search) {
      query += ` AND (p."passportNo" ILIKE $${params.length + 1} OR p.surname ILIKE $${params.length + 1} OR p."givenName" ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      passports: result.rows,
      total: result.rows.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get passports error:', error);
    res.status(500).json({ error: 'Failed to fetch passports' });
  }
});

// Get passport by ID
router.get('/:id', auth, param('id').isInt(), validate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM "Passport" WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get passport error:', error);
    res.status(500).json({ error: 'Failed to fetch passport' });
  }
});

// Create passport
router.post('/',
  auth,
  checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent'),
  [
    body('passportNo').notEmpty().withMessage('Passport number is required')
    // All other fields are optional
  ],
  validate,
  async (req, res) => {
    try {
      const fields = req.body;

      // Filter out undefined, null, and empty string values
      const cleanFields = {};
      Object.keys(fields).forEach(key => {
        if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
          cleanFields[key] = fields[key];
        }
      });

      cleanFields.createdById = req.userId;

      const columns = Object.keys(cleanFields).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(cleanFields).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(cleanFields);

      const result = await db.query(
        `INSERT INTO "Passport" (${columns}, "createdAt", "updatedAt") VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
        values
      );

      res.status(201).json({
        passport: result.rows[0],
        message: 'Passport created successfully'
      });
    } catch (error) {
      console.error('Create passport error:', error);
      res.status(500).json({ error: 'Failed to create passport' });
    }
  }
);

// Update passport
router.put('/:id',
  auth,
  checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent'),
  param('id').isInt(),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const fields = req.body;

      delete fields.id;
      delete fields.createdAt;
      delete fields.createdById;

      // Filter out undefined, null, and empty values
      const cleanFields = {};
      Object.keys(fields).forEach(key => {
        if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
          cleanFields[key] = fields[key];
        }
      });

      const updates = Object.keys(cleanFields).map((key, i) => `"${key}" = $${i + 1}`);
      updates.push('"updatedAt" = CURRENT_TIMESTAMP');
      const values = [...Object.values(cleanFields), id];

      const result = await db.query(
        `UPDATE "Passport" SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Passport not found' });
      }

      res.json({
        passport: result.rows[0],
        message: 'Passport updated successfully'
      });
    } catch (error) {
      console.error('Update passport error:', error);
      res.status(500).json({ error: 'Failed to update passport' });
    }
  }
);

// Delete passport
router.delete('/:id',
  auth,
  checkRole('Admin', 'Flex_Admin'),
  param('id').isInt(),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('DELETE FROM "Passport" WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Passport not found' });
      }

      res.json({
        message: 'Passport deleted successfully',
        passport: result.rows[0]
      });
    } catch (error) {
      console.error('Delete passport error:', error);
      res.status(500).json({ error: 'Failed to delete passport' });
    }
  }
);

module.exports = router;
