const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * Cash Reconciliation Routes
 * Handles end-of-day cash reconciliation for counter agents
 */

/**
 * GET /api/cash-reconciliations/transactions
 * Get transaction summary for a specific date and agent
 */
router.get('/transactions', async (req, res) => {
  try {
    const { date, agent_id } = req.query;

    if (!date || !agent_id) {
      return res.status(400).json({
        error: 'Date and agent_id are required'
      });
    }

    // Get all transactions for the agent on the specified date
    // Start with individual_purchases (most common)
    let transactions = [];

    // Query 1: Individual purchases
    try {
      const individualQuery = `
        SELECT
          payment_method,
          amount,
          created_at,
          'individual' as source
        FROM individual_purchases
        WHERE DATE(created_at) = $1
        ORDER BY created_at;
      `;
      const individualResult = await pool.query(individualQuery, [date]);
      transactions = transactions.concat(individualResult.rows);
    } catch (err) {
      console.log('Individual purchases query error (non-fatal):', err.message);
    }

    // Query 2: Quotations (if table exists)
    try {
      const quotationQuery = `
        SELECT
          payment_method,
          total_amount as amount,
          created_at,
          'quotation' as source
        FROM quotations
        WHERE DATE(created_at) = $1
          AND status = 'accepted'
        ORDER BY created_at;
      `;
      const quotationResult = await pool.query(quotationQuery, [date]);
      transactions = transactions.concat(quotationResult.rows);
    } catch (err) {
      console.log('Quotations query error (non-fatal):', err.message);
    }

    // Sort all transactions by created_at
    transactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calculate totals by payment method
    let totalCash = 0;
    let totalCard = 0;
    let totalBankTransfer = 0;
    let totalEftpos = 0;
    let totalAmount = 0;

    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      totalAmount += amount;

      const paymentMethod = (txn.payment_method || '').toLowerCase();

      if (paymentMethod.includes('cash')) {
        totalCash += amount;
      } else if (paymentMethod.includes('card') || paymentMethod.includes('credit')) {
        totalCard += amount;
      } else if (paymentMethod.includes('bank') || paymentMethod.includes('transfer')) {
        totalBankTransfer += amount;
      } else if (paymentMethod.includes('eftpos')) {
        totalEftpos += amount;
      }
    });

    res.json({
      success: true,
      summary: {
        date,
        agentId: agent_id,
        total: totalAmount,
        cash: totalCash,
        card: totalCard,
        bankTransfer: totalBankTransfer,
        eftpos: totalEftpos,
        transactions: transactions,
        count: transactions.length,
      }
    });

  } catch (error) {
    console.error('Error fetching transactions for reconciliation:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-reconciliations
 * Get reconciliation records with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { date_from, date_to, agent_id, status } = req.query;

    let query = `
      SELECT
        cr.*,
        u.name as agent_name,
        u.email as agent_email,
        approver.name as approver_name,
        approver.email as approver_email
      FROM cash_reconciliations cr
      LEFT JOIN "User" u ON cr.agent_id::text = u.id::text
      LEFT JOIN "User" approver ON cr.approved_by::text = approver.id::text
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (date_from) {
      query += ` AND cr.reconciliation_date >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND cr.reconciliation_date <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    if (agent_id) {
      query += ` AND cr.agent_id = $${paramCount}`;
      params.push(agent_id);
      paramCount++;
    }

    if (status) {
      query += ` AND cr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY cr.reconciliation_date DESC, cr.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      reconciliations: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    res.status(500).json({
      error: 'Failed to fetch reconciliations',
      message: error.message
    });
  }
});

/**
 * POST /api/cash-reconciliations
 * Create a new cash reconciliation record
 */
router.post('/', async (req, res) => {
  try {
    const {
      agent_id,
      reconciliation_date,
      opening_float,
      expected_cash,
      actual_cash,
      variance,
      cash_denominations,
      card_transactions,
      bank_transfers,
      eftpos_transactions,
      total_collected,
      notes,
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!agent_id || !reconciliation_date) {
      return res.status(400).json({
        error: 'Agent ID and reconciliation date are required'
      });
    }

    const query = `
      INSERT INTO cash_reconciliations (
        agent_id,
        reconciliation_date,
        opening_float,
        expected_cash,
        actual_cash,
        variance,
        cash_denominations,
        card_transactions,
        bank_transfers,
        eftpos_transactions,
        total_collected,
        notes,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;

    const values = [
      agent_id,
      reconciliation_date,
      opening_float || 0,
      expected_cash || 0,
      actual_cash || 0,
      variance || 0,
      JSON.stringify(cash_denominations || {}),
      card_transactions || 0,
      bank_transfers || 0,
      eftpos_transactions || 0,
      total_collected || 0,
      notes || '',
      status
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      reconciliation: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating reconciliation:', error);
    res.status(500).json({
      error: 'Failed to create reconciliation',
      message: error.message
    });
  }
});

/**
 * PUT /api/cash-reconciliations/:id
 * Update reconciliation status (approve/reject)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by, approval_notes } = req.body;

    if (!status || !approved_by) {
      return res.status(400).json({
        error: 'Status and approved_by are required'
      });
    }

    const query = `
      UPDATE cash_reconciliations
      SET
        status = $1,
        approved_by = $2,
        approval_notes = $3,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const values = [status, approved_by, approval_notes || '', id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reconciliation not found'
      });
    }

    res.json({
      success: true,
      reconciliation: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating reconciliation:', error);
    res.status(500).json({
      error: 'Failed to update reconciliation',
      message: error.message
    });
  }
});

/**
 * GET /api/cash-reconciliations/:id
 * Get a specific reconciliation record
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        cr.*,
        u.name as agent_name,
        u.email as agent_email,
        approver.name as approver_name,
        approver.email as approver_email
      FROM cash_reconciliations cr
      LEFT JOIN "User" u ON cr.agent_id::text = u.id::text
      LEFT JOIN "User" approver ON cr.approved_by::text = approver.id::text
      WHERE cr.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Reconciliation not found'
      });
    }

    res.json({
      success: true,
      reconciliation: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({
      error: 'Failed to fetch reconciliation',
      message: error.message
    });
  }
});

module.exports = router;
