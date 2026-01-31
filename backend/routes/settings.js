const express = require('express');
const { serverError } = require('../utils/apiResponse');
const router = express.Router();
const db = require('../config/database');
const { serverError } = require('../utils/apiResponse');
const { auth, checkRole } = require('../middleware/auth');

// Columns now exist in table schema - no need for ALTER TABLE
const ensureGstColumn = async () => {
  // No-op: gst_enabled column exists in table schema
};

const ensurePolicyColumns = async () => {
  // No-op: policy content columns exist in table schema
};

const getEnvGstEnabled = () => {
  if (process.env.GST_ENABLED === 'false') return false;
  if (process.env.GST_ENABLED === '0') return false;
  return true;
};

/**
 * Public settings (no auth) - expose policy content
 */
router.get('/public', async (req, res) => {
  try {
    await ensureGstColumn();
    await ensurePolicyColumns();

    const result = await db.query(
      'SELECT terms_content, privacy_content, refunds_content FROM settings ORDER BY id DESC LIMIT 1'
    );
    const settings = result.rows[0] || {
      terms_content: '',
      privacy_content: '',
      refunds_content: ''
    };

    res.json({
      type: 'success',
      settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.json({
      type: 'success',
      settings: {
        terms_content: '',
        privacy_content: '',
        refunds_content: ''
      }
    });
  }
});

/**
 * GET /api/settings
 * Get application settings
 * Accessible by all authenticated users
 */
router.get('/', auth, async (req, res) => {
  try {
    await ensureGstColumn();
    await ensurePolicyColumns();

    const result = await db.query(
      'SELECT * FROM settings ORDER BY id DESC LIMIT 1'
    );

    // Return default settings if none exist
    const settings = result.rows[0] || {
      voucher_validity_days: 30,
      default_amount: 50,
      gst_enabled: getEnvGstEnabled(),
      terms_content: '',
      privacy_content: '',
      refunds_content: ''
    };

    if (settings.gst_enabled === null || settings.gst_enabled === undefined) {
      settings.gst_enabled = getEnvGstEnabled();
    }

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
    await ensureGstColumn();
    await ensurePolicyColumns();

    const {
      voucher_validity_days,
      default_amount,
      gst_enabled,
      terms_content,
      privacy_content,
      refunds_content
    } = req.body;

    if (
      voucher_validity_days === undefined &&
      default_amount === undefined &&
      gst_enabled === undefined &&
      terms_content === undefined &&
      privacy_content === undefined &&
      refunds_content === undefined
    ) {
      return res.status(400).json({
        type: 'error',
        message: 'At least one setting is required'
      });
    }

    // Check if settings exist
    const existingResult = await db.query(
      'SELECT id FROM settings ORDER BY id DESC LIMIT 1'
    );

    let settings;

    if (existingResult.rows.length > 0) {
      // Update existing settings (keep previous values when not provided)
      const current = await db.query('SELECT * FROM settings WHERE id = $1', [existingResult.rows[0].id]);
      const prev = current.rows[0] || {};
      const newVoucherDays = voucher_validity_days !== undefined ? voucher_validity_days : prev.voucher_validity_days || 30;
      const newDefaultAmount = default_amount !== undefined ? default_amount : prev.default_amount || 50;
      const newGstEnabled = gst_enabled !== undefined ? gst_enabled : (prev.gst_enabled !== undefined ? prev.gst_enabled : getEnvGstEnabled());
      const newTerms = terms_content !== undefined ? terms_content : (prev.terms_content || '');
      const newPrivacy = privacy_content !== undefined ? privacy_content : (prev.privacy_content || '');
      const newRefunds = refunds_content !== undefined ? refunds_content : (prev.refunds_content || '');

      const updateResult = await db.query(
        `UPDATE settings
         SET voucher_validity_days = $1,
             default_amount = $2,
             gst_enabled = $3,
             terms_content = $4,
             privacy_content = $5,
             refunds_content = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [newVoucherDays, newDefaultAmount, newGstEnabled, newTerms, newPrivacy, newRefunds, existingResult.rows[0].id]
      );
      settings = updateResult.rows[0];
    } else {
      // Insert new settings
      const newVoucherDays = voucher_validity_days !== undefined ? voucher_validity_days : 30;
      const newDefaultAmount = default_amount !== undefined ? default_amount : 50;
      const newGstEnabled = gst_enabled !== undefined ? gst_enabled : getEnvGstEnabled();
      const newTerms = terms_content !== undefined ? terms_content : '';
      const newPrivacy = privacy_content !== undefined ? privacy_content : '';
      const newRefunds = refunds_content !== undefined ? refunds_content : '';

      const insertResult = await db.query(
        `INSERT INTO settings (voucher_validity_days, default_amount, gst_enabled, terms_content, privacy_content, refunds_content)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [newVoucherDays, newDefaultAmount, newGstEnabled, newTerms, newPrivacy, newRefunds]
      );
      settings = insertResult.rows[0];
    }

    res.json({
      type: 'success',
      settings
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return serverError(res, error, ',
      message: ');
  }
});

module.exports = router;
