const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

/**
 * GET /api/settings
 * Get application settings
 * Accessible by all authenticated users
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM settings ORDER BY id DESC LIMIT 1'
    );

    // Return default settings if none exist
    const settings = result.rows[0] || {
      voucher_validity_days: 30,
      default_amount: 50
    };

    res.json({
      type: 'success',
      settings
    });

  } catch (error) {
    console.error('Error fetching settings:', error);

    // Return defaults on error
    res.json({
      type: 'success',
      settings: {
        voucher_validity_days: 30,
        default_amount: 50
      }
    });
  }
});

/**
 * PUT /api/settings
 * Update application settings
 * Only accessible by Flex_Admin
 */
router.put('/', auth, checkRole('Flex_Admin'), async (req, res) => {
  try {
    const { voucher_validity_days, default_amount } = req.body;

    // Validate inputs
    if (!voucher_validity_days || !default_amount) {
      return res.status(400).json({
        type: 'error',
        message: 'voucher_validity_days and default_amount are required'
      });
    }

    // Check if settings exist
    const existingResult = await db.query(
      'SELECT id FROM settings ORDER BY id DESC LIMIT 1'
    );

    let settings;

    if (existingResult.rows.length > 0) {
      // Update existing settings
      const updateResult = await db.query(
        `UPDATE settings
         SET voucher_validity_days = $1,
             default_amount = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [voucher_validity_days, default_amount, existingResult.rows[0].id]
      );
      settings = updateResult.rows[0];
    } else {
      // Insert new settings
      const insertResult = await db.query(
        `INSERT INTO settings (voucher_validity_days, default_amount)
         VALUES ($1, $2)
         RETURNING *`,
        [voucher_validity_days, default_amount]
      );
      settings = insertResult.rows[0];
    }

    res.json({
      type: 'success',
      settings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

module.exports = router;
