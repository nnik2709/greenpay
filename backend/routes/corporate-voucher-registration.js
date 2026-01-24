const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const {
  voucherLookupLimiter,
  voucherRegistrationLimiter,
  suspiciousActivityDetector
} = require('../middleware/rateLimiter');

/**
 * CORPORATE VOUCHER REGISTRATION ROUTES
 *
 * Purpose: Allow corporate users to register passports to their vouchers
 * Flow:
 * 1. Corporate customer receives bulk vouchers (status: pending_passport)
 * 2. Customer accesses registration page
 * 3. Customer enters voucher code + passport data
 * 4. System validates and assigns passport to voucher
 * 5. Voucher status changes to 'active'
 */

/**
 * GET /api/corporate-voucher-registration/voucher/:code
 * Get voucher details by code (for registration page)
 * PROTECTED: Rate limited to prevent enumeration attacks
 */
router.get('/voucher/:code',
  suspiciousActivityDetector,
  voucherLookupLimiter,
  async (req, res) => {
  try {
    const { code } = req.params;

    // First, try corporate_vouchers table
    let result = await db.query(
      `SELECT
        id,
        voucher_code,
        company_name,
        amount,
        status,
        passport_number,
        valid_from,
        valid_until,
        issued_date,
        'corporate' as voucher_type
      FROM corporate_vouchers
      WHERE voucher_code = $1`,
      [code]
    );

    // If not found in corporate_vouchers, try individual_purchases table
    if (result.rows.length === 0) {
      result = await db.query(
        `SELECT
          id,
          voucher_code,
          customer_name as company_name,
          amount,
          status,
          passport_number,
          valid_from,
          valid_until,
          purchased_at as issued_date,
          'individual' as voucher_type
        FROM individual_purchases
        WHERE voucher_code = $1`,
        [code]
      );
    }

    // If still not found, try vouchers table (legacy)
    if (result.rows.length === 0) {
      result = await db.query(
        `SELECT
          id,
          voucher_code,
          NULL as company_name,
          amount,
          status,
          issued_to as passport_number,
          valid_from,
          valid_until,
          issued_date,
          'individual' as voucher_type
        FROM vouchers
        WHERE voucher_code = $1`,
        [code]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];

    // Check if already registered (different status values for different types)
    const isRegistered = (voucher.voucher_type === 'corporate' && voucher.status === 'active' && voucher.passport_number) ||
                         (voucher.voucher_type === 'individual' && voucher.status === 'registered');

    if (isRegistered) {
      return res.json({
        voucher,
        alreadyRegistered: true,
        message: 'This voucher is already registered to a passport'
      });
    }

    // Check if expired
    if (new Date(voucher.valid_until) < new Date()) {
      return res.json({
        voucher,
        expired: true,
        message: 'This voucher has expired'
      });
    }

    res.json({ voucher });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({ error: 'Failed to fetch voucher' });
  }
});

/**
 * POST /api/corporate-voucher-registration/register
 * Register passport to a corporate voucher
 * PROTECTED: Rate limited to prevent abuse
 */
router.post('/register',
  suspiciousActivityDetector,
  voucherRegistrationLimiter,
  async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const {
      voucherCode,
      passportNumber,
      surname,
      givenName,
      nationality,
      dateOfBirth,
      dateOfExpiry
    } = req.body;

    // Validate required fields
    if (!voucherCode || !passportNumber || !surname || !givenName) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        error: 'Missing required fields: voucherCode, passportNumber, surname, givenName'
      });
    }

    // 1. Check if voucher exists - try all three tables
    let voucherResult;
    let voucherType;
    let voucherTableName;

    // First, try corporate_vouchers table
    voucherResult = await client.query(
      `SELECT id, status, passport_number, company_name, valid_until
       FROM corporate_vouchers
       WHERE voucher_code = $1`,
      [voucherCode]
    );

    if (voucherResult.rows.length > 0) {
      voucherType = 'corporate';
      voucherTableName = 'corporate_vouchers';
    } else {
      // Try individual_purchases table
      voucherResult = await client.query(
        `SELECT id, status, passport_number, customer_name as company_name, valid_until
         FROM individual_purchases
         WHERE voucher_code = $1`,
        [voucherCode]
      );

      if (voucherResult.rows.length > 0) {
        voucherType = 'individual';
        voucherTableName = 'individual_purchases';
      } else {
        // Try vouchers table (legacy)
        voucherResult = await client.query(
          `SELECT id, status, issued_to as passport_number, NULL as company_name, valid_until
           FROM vouchers
           WHERE voucher_code = $1`,
          [voucherCode]
        );

        if (voucherResult.rows.length > 0) {
          voucherType = 'legacy';
          voucherTableName = 'vouchers';
        }
      }
    }

    // If not found in any table
    if (voucherResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = voucherResult.rows[0];

    // Check if already registered (different logic for different voucher types)
    const isRegistered = (voucherType === 'corporate' && voucher.status === 'active' && voucher.passport_number) ||
                         (voucherType === 'individual' && voucher.status === 'registered') ||
                         (voucherType === 'legacy' && voucher.status === 'registered');

    if (isRegistered) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        error: 'Voucher already registered',
        passport: voucher.passport_number
      });
    }

    // Check if expired
    if (new Date(voucher.valid_until) < new Date()) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Voucher has expired' });
    }

    // 2. Check if passport already exists
    let passportId;
    const existingPassport = await client.query(
      'SELECT id FROM passports WHERE passport_number = $1',
      [passportNumber]
    );

    if (existingPassport.rows.length > 0) {
      // Passport exists, use existing ID
      passportId = existingPassport.rows[0].id;
    } else {
      // Create new passport record
      // Production schema uses full_name, expiry_date (not surname/given_name, date_of_expiry)
      const fullName = `${surname} ${givenName}`.trim();

      const newPassport = await client.query(
        `INSERT INTO passports (
          passport_number,
          full_name,
          nationality,
          date_of_birth,
          expiry_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [
          passportNumber,
          fullName,
          nationality || null,
          dateOfBirth || null,
          dateOfExpiry || null
        ]
      );

      passportId = newPassport.rows[0].id;
    }

    // 3. Update voucher with passport data - handle different table types
    const userId = req.user?.id || null; // Get user ID if authenticated
    let updateResult;

    if (voucherType === 'corporate') {
      // Update corporate_vouchers table
      updateResult = await client.query(
        `UPDATE corporate_vouchers
         SET
           passport_id = $1,
           passport_number = $2,
           status = 'active',
           registered_at = NOW(),
           registered_by = $3
         WHERE voucher_code = $4
         RETURNING *`,
        [passportId, passportNumber, userId, voucherCode]
      );
    } else if (voucherType === 'individual') {
      // Update individual_purchases table
      updateResult = await client.query(
        `UPDATE individual_purchases
         SET
           passport_number = $1,
           status = 'registered'
         WHERE voucher_code = $2
         RETURNING *`,
        [passportNumber, voucherCode]
      );
    } else if (voucherType === 'legacy') {
      // Update vouchers table (legacy)
      updateResult = await client.query(
        `UPDATE vouchers
         SET
           issued_to = $1,
           status = 'registered'
         WHERE voucher_code = $2
         RETURNING *`,
        [passportNumber, voucherCode]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Voucher successfully registered to passport',
      voucher: updateResult.rows[0],
      voucherType
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering voucher:', error);
    res.status(500).json({ error: 'Failed to register voucher' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/corporate-voucher-registration/company/:companyName
 * Get all vouchers for a company (admin/company portal)
 */
router.get('/company/:companyName', auth, checkRole(['Flex_Admin', 'Finance_Manager', 'Counter_Agent']), async (req, res) => {
  try {
    const { companyName } = req.params;
    const { status } = req.query; // Optional status filter

    let query = `
      SELECT
        v.id,
        v.voucher_code,
        v.company_name,
        v.amount,
        v.status,
        v.passport_number,
        v.valid_from,
        v.valid_until,
        v.registered_at,
        v.used_at,
        v.created_at,
        p.surname,
        p.given_name,
        p.nationality
      FROM corporate_vouchers v
      LEFT JOIN passports p ON v.passport_id = p.id
      WHERE v.company_name ILIKE $1
    `;

    const params = [`%${companyName}%`];

    if (status) {
      query += ` AND v.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY v.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      vouchers: result.rows,
      total: result.rows.length,
      pending: result.rows.filter(v => v.status === 'pending_passport').length,
      active: result.rows.filter(v => v.status === 'active').length
    });
  } catch (error) {
    console.error('Error fetching company vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch company vouchers' });
  }
});

/**
 * POST /api/corporate-voucher-registration/bulk-register
 * Bulk register multiple vouchers (CSV upload)
 */
router.post('/bulk-register', async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { registrations } = req.body; // Array of { voucherCode, passportNumber, surname, givenName, ... }

    if (!Array.isArray(registrations) || registrations.length === 0) {
      return res.status(400).json({ error: 'Invalid registrations array' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const reg of registrations) {
      try {
        const { voucherCode, passportNumber, surname, givenName, nationality, dateOfBirth, dateOfExpiry } = reg;

        // Validate required fields
        if (!voucherCode || !passportNumber || !surname || !givenName) {
          results.errors.push({
            voucherCode,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check voucher
        const voucherResult = await client.query(
          'SELECT id, status, passport_number FROM corporate_vouchers WHERE voucher_code = $1',
          [voucherCode]
        );

        if (voucherResult.rows.length === 0) {
          results.errors.push({ voucherCode, error: 'Voucher not found' });
          continue;
        }

        const voucher = voucherResult.rows[0];

        if (voucher.status === 'active' && voucher.passport_number) {
          results.errors.push({ voucherCode, error: 'Already registered' });
          continue;
        }

        // Check/create passport
        let passportId;
        const existingPassport = await client.query(
          'SELECT id FROM passports WHERE passport_number = $1',
          [passportNumber]
        );

        if (existingPassport.rows.length > 0) {
          passportId = existingPassport.rows[0].id;
        } else {
          // Production schema uses full_name, expiry_date
          const fullName = `${surname} ${givenName}`.trim();
          const newPassport = await client.query(
            `INSERT INTO passports (passport_number, full_name, nationality, date_of_birth, expiry_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [passportNumber, fullName, nationality || null, dateOfBirth || null, dateOfExpiry || null]
          );
          passportId = newPassport.rows[0].id;
        }

        // Update voucher
        await client.query(
          `UPDATE corporate_vouchers
           SET passport_id = $1, passport_number = $2, status = 'active', registered_at = NOW()
           WHERE voucher_code = $3`,
          [passportId, passportNumber, voucherCode]
        );

        results.success.push({ voucherCode, passportNumber });

      } catch (error) {
        results.errors.push({
          voucherCode: reg.voucherCode,
          error: error.message
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Registered ${results.success.length} vouchers, ${results.errors.length} errors`,
      results
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk registering vouchers:', error);
    res.status(500).json({ error: 'Failed to bulk register vouchers' });
  } finally {
    client.release();
  }
});

module.exports = router;
