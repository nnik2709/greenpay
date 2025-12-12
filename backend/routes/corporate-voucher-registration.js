const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

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
 */
router.get('/voucher/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `SELECT
        id,
        voucher_code,
        company_name,
        amount,
        status,
        passport_number,
        valid_from,
        valid_until,
        created_at
      FROM corporate_vouchers
      WHERE voucher_code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = result.rows[0];

    // Check if already registered
    if (voucher.status === 'active' && voucher.passport_number) {
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
 */
router.post('/register', async (req, res) => {
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
      sex,
      dateOfExpiry
    } = req.body;

    // Validate required fields
    if (!voucherCode || !passportNumber || !surname || !givenName) {
      return res.status(400).json({
        error: 'Missing required fields: voucherCode, passportNumber, surname, givenName'
      });
    }

    // 1. Check if voucher exists and is pending
    const voucherResult = await client.query(
      `SELECT id, status, passport_number, company_name, valid_until
       FROM corporate_vouchers
       WHERE voucher_code = $1`,
      [voucherCode]
    );

    if (voucherResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Voucher not found' });
    }

    const voucher = voucherResult.rows[0];

    // Check if already registered
    if (voucher.status === 'active' && voucher.passport_number) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Voucher already registered',
        passport: voucher.passport_number
      });
    }

    // Check if expired
    if (new Date(voucher.valid_until) < new Date()) {
      await client.query('ROLLBACK');
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
      const newPassport = await client.query(
        `INSERT INTO passports (
          passport_number,
          surname,
          given_name,
          nationality,
          date_of_birth,
          sex,
          date_of_expiry
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          passportNumber,
          surname,
          givenName,
          nationality || 'Unknown',
          dateOfBirth || null,
          sex || 'U',
          dateOfExpiry || null
        ]
      );

      passportId = newPassport.rows[0].id;
    }

    // 3. Update voucher with passport data and set status to 'active'
    const userId = req.user?.id || null; // Get user ID if authenticated

    const updateResult = await client.query(
      `UPDATE corporate_vouchers
       SET
         passport_id = $1,
         passport_number = $2,
         status = 'active',
         registered_at = NOW(),
         registered_by = $3,
         updated_at = NOW()
       WHERE voucher_code = $4
       RETURNING *`,
      [passportId, passportNumber, userId, voucherCode]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Voucher successfully registered to passport',
      voucher: updateResult.rows[0]
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
        const { voucherCode, passportNumber, surname, givenName, nationality, dateOfBirth, sex, dateOfExpiry } = reg;

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
          const newPassport = await client.query(
            `INSERT INTO passports (passport_number, surname, given_name, nationality, date_of_birth, sex, date_of_expiry)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [passportNumber, surname, givenName, nationality || 'Unknown', dateOfBirth || null, sex || 'U', dateOfExpiry || null]
          );
          passportId = newPassport.rows[0].id;
        }

        // Update voucher
        await client.query(
          `UPDATE corporate_vouchers
           SET passport_id = $1, passport_number = $2, status = 'active', registered_at = NOW(), updated_at = NOW()
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
