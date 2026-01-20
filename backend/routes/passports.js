const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const db = require('../config/database');
const validate = require('../middleware/validator');
const { auth, checkRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

/**
 * GET /api/passports
 * Get all passports with pagination and search
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: records per page (default: 50, max: 1000)
 *   - search: search term for passport_number, full_name, nationality
 *   - passport_number: exact passport number lookup (overrides search)
 *   - nationality: filter by nationality (use with passport_number for unique lookup)
 */
router.get('/', auth, async (req, res) => {
  try {
    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Parse search params
    const search = req.query.search ? req.query.search.trim() : '';
    const passport_number = req.query.passport_number ? req.query.passport_number.trim() : '';
    const nationality = req.query.nationality ? req.query.nationality.trim() : '';

    // Build WHERE clauses
    let whereClause = 'WHERE 1=1';
    const params = [];

    // Search by passport number (exact match for lookups)
    if (passport_number) {
      params.push(passport_number);
      const passportIndex = params.length;
      whereClause += ` AND p.passport_number = $${passportIndex}`;
    }

    // Filter by nationality (for unique lookup when combined with passport_number)
    if (nationality) {
      params.push(nationality);
      const nationalityIndex = params.length;
      whereClause += ` AND p.nationality = $${nationalityIndex}`;
    }

    // General search (only if no exact filters)
    if (!passport_number && !nationality && search) {
      params.push(`%${search}%`);
      const searchIndex = params.length;
      whereClause += ` AND (
        p.passport_number ILIKE $${searchIndex} OR
        p.full_name ILIKE $${searchIndex} OR
        p.nationality ILIKE $${searchIndex}
      )`;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM passports p
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    params.push(limit, offset);
    const dataQuery = `
      SELECT
        p.id,
        p.passport_number,
        p.full_name,
        p.nationality,
        p.date_of_birth,
        p.issue_date,
        p.expiry_date,
        p.passport_type,
        p.created_by,
        p.created_at,
        p.updated_at,
        u.name as created_by_name
      FROM passports p
      LEFT JOIN "User" u ON p.created_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
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
    console.error('Get passports error:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch passports',
      error: error.message
    });
  }
});

// Get passport by ID
router.get('/:id', auth, param('id').isInt(), validate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM passports WHERE id = $1', [id]);

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
  checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent', 'Finance_Manager'),
  [
    body('passport_number').notEmpty().withMessage('Passport number is required'),
    body('full_name').optional(),
    body('nationality').optional(),
    body('date_of_birth').optional(),
    body('issue_date').optional(),
    body('expiry_date').optional(),
    body('passport_type').optional()
  ],
  validate,
  async (req, res) => {
    try {
      const {
        passport_number,
        full_name,
        nationality,
        date_of_birth,
        issue_date,
        expiry_date,
        passport_type
      } = req.body;

      // Build dynamic INSERT with only provided fields
      const fields = { passport_number };
      const columnNames = ['passport_number'];
      const values = [passport_number];

      if (full_name) {
        fields.full_name = full_name;
        columnNames.push('full_name');
        values.push(full_name);
      } else {
        // Database requires full_name to be NOT NULL, so provide empty string if not given
        fields.full_name = '';
        columnNames.push('full_name');
        values.push('');
      }
      if (nationality) {
        fields.nationality = nationality;
        columnNames.push('nationality');
        values.push(nationality);
      }
      if (date_of_birth) {
        fields.date_of_birth = date_of_birth;
        columnNames.push('date_of_birth');
        values.push(date_of_birth);
      }
      if (issue_date) {
        fields.issue_date = issue_date;
        columnNames.push('issue_date');
        values.push(issue_date);
      }
      if (expiry_date) {
        fields.expiry_date = expiry_date;
        columnNames.push('expiry_date');
        values.push(expiry_date);
      }
      if (passport_type) {
        fields.passport_type = passport_type;
        columnNames.push('passport_type');
        values.push(passport_type);
      }

      // Add created_by
      columnNames.push('created_by');
      values.push(req.userId);

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const result = await db.query(
        `INSERT INTO passports (${columnNames.join(', ')}, created_at, updated_at)
         VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        values
      );

      res.status(201).json({
        passport: result.rows[0],
        message: 'Passport created successfully'
      });
    } catch (error) {
      console.error('Create passport error:', error);
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Passport number already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create passport' });
      }
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
      const {
        passport_number,
        full_name,
        nationality,
        date_of_birth,
        issue_date,
        expiry_date,
        passport_type
      } = req.body;

      // Build dynamic UPDATE with only provided fields
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (passport_number !== undefined) {
        updates.push(`passport_number = $${paramIndex++}`);
        values.push(passport_number);
      }
      if (full_name !== undefined) {
        updates.push(`full_name = $${paramIndex++}`);
        values.push(full_name);
      }
      if (nationality !== undefined) {
        updates.push(`nationality = $${paramIndex++}`);
        values.push(nationality);
      }
      if (date_of_birth !== undefined) {
        updates.push(`date_of_birth = $${paramIndex++}`);
        values.push(date_of_birth);
      }
      if (issue_date !== undefined) {
        updates.push(`issue_date = $${paramIndex++}`);
        values.push(issue_date);
      }
      if (expiry_date !== undefined) {
        updates.push(`expiry_date = $${paramIndex++}`);
        values.push(expiry_date);
      }
      if (passport_type !== undefined) {
        updates.push(`passport_type = $${paramIndex++}`);
        values.push(passport_type);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Add updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Add id as final parameter
      values.push(id);

      const result = await db.query(
        `UPDATE passports SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
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
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Passport number already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update passport' });
      }
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
      const result = await db.query('DELETE FROM passports WHERE id = $1 RETURNING *', [id]);

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

// Rate limiter for passport lookup endpoint
// Prevents passport enumeration attacks
const passportLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many passport lookup requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/passports/lookup/:passportNumber
 * PUBLIC endpoint - No auth required (but rate-limited)
 * Lookup passport by number for auto-fill in PublicRegistration page
 * Used to reduce data entry and improve accuracy
 *
 * Rate limit: 20 requests per 15 minutes per IP
 */
router.get('/lookup/:passportNumber', passportLookupLimiter, async (req, res) => {
  try {
    const { passportNumber } = req.params;

    if (!passportNumber || passportNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Passport number is required'
      });
    }

    // Search for passport in database
    const query = `
      SELECT
        passport_number,
        full_name,
        date_of_birth,
        nationality,
        passport_type,
        issue_date,
        expiry_date
      FROM passports
      WHERE passport_number = $1
      LIMIT 1
    `;

    const result = await db.query(query, [passportNumber.toUpperCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Passport not found'
      });
    }

    return res.json({
      success: true,
      passport: result.rows[0]
    });

  } catch (error) {
    console.error('Passport lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to lookup passport'
    });
  }
});

module.exports = router;
