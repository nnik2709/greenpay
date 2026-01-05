const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

/**
 * GET /api/transactions
 * Get all transactions (aggregates individual purchases and corporate vouchers)
 * Used for dashboard analytics
 */
router.get('/', auth, async (req, res) => {
  try {
    // Query to get individual purchases
    const individualQuery = `
      SELECT
        ip.id,
        ip.voucher_code,
        ip.amount,
        ip.payment_method,
        ip.created_at,
        ip.valid_from,
        'individual' as transaction_type,
        COALESCE(p.nationality, 'Unknown') as nationality
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.status != 'refunded' OR ip.status IS NULL
    `;

    // Query to get corporate vouchers (if table exists)
    const corporateQuery = `
      SELECT
        cv.id,
        cv.voucher_code,
        cv.amount,
        cv.payment_method,
        cv.created_at,
        cv.valid_from,
        'corporate' as transaction_type,
        COALESCE(cv.nationality, 'Unknown') as nationality
      FROM corporate_vouchers cv
      WHERE cv.status != 'refunded' OR cv.status IS NULL
    `;

    // Try to fetch both types of transactions
    let allTransactions = [];

    // Get individual purchases
    const individualResult = await db.query(individualQuery);
    allTransactions = individualResult.rows;

    // Try to get corporate vouchers (table may not exist yet)
    try {
      const corporateResult = await db.query(corporateQuery);
      allTransactions = [...allTransactions, ...corporateResult.rows];
    } catch (error) {
      // Corporate vouchers table doesn't exist yet - that's okay
      console.log('Corporate vouchers table not found (this is okay if not implemented yet)');
    }

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      type: 'success',
      transactions: allTransactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

/**
 * GET /api/transactions/:id
 * Get a specific transaction by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Try individual purchases first
    const individualQuery = `
      SELECT
        ip.*,
        'individual' as transaction_type,
        p.full_name,
        p.nationality
      FROM individual_purchases ip
      LEFT JOIN passports p ON ip.passport_number = p.passport_number
      WHERE ip.id = $1
    `;

    const individualResult = await db.query(individualQuery, [id]);

    if (individualResult.rows.length > 0) {
      return res.json({
        type: 'success',
        data: individualResult.rows[0]
      });
    }

    // Try corporate vouchers
    try {
      const corporateQuery = `
        SELECT
          cv.*,
          'corporate' as transaction_type
        FROM corporate_vouchers cv
        WHERE cv.id = $1
      `;

      const corporateResult = await db.query(corporateQuery, [id]);

      if (corporateResult.rows.length > 0) {
        return res.json({
          type: 'success',
          data: corporateResult.rows[0]
        });
      }
    } catch (error) {
      // Corporate table doesn't exist
    }

    // Transaction not found
    return res.status(404).json({
      type: 'error',
      status: 'error',
      message: 'Transaction not found'
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      type: 'error',
      status: 'error',
      message: 'Failed to fetch transaction',
      error: error.message
    });
  }
});

module.exports = router;
