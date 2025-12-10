import api from '@/lib/api/client';

/**
 * Cash Reconciliation Service
 * Handles end-of-day cash reconciliation for counter agents
 */

/**
 * Get reconciliation records with optional filtering
 * @param {Object} filters - Optional filters (date_from, date_to, agent_id, status)
 * @returns {Promise<Array>} Array of reconciliation records
 */
export const getReconciliations = async (filters = {}) => {
  try {
    // Build query params
    const params = {};
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.agent_id) params.agent_id = filters.agent_id;
    if (filters.status) params.status = filters.status;

    const response = await api.get('/cash-reconciliations', { params });
    return response.data || response.reconciliations || [];
  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    throw error;
  }
};

/**
 * Get transactions for a specific date and agent
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} agentId - Agent user ID
 * @returns {Promise<Object>} Summary of transactions
 */
export const getTransactionsForReconciliation = async (date, agentId) => {
  try {
    const response = await api.get('/cash-reconciliations/transactions', {
      params: {
        date: date,
        agent_id: agentId
      }
    });

    // Return the summary from response
    return response.summary || response.data || {
      total: 0,
      cash: 0,
      card: 0,
      bankTransfer: 0,
      eftpos: 0,
      transactions: [],
      count: 0,
    };
  } catch (error) {
    console.error('Error fetching transactions for reconciliation:', error);
    throw error;
  }
};

/**
 * Create a new cash reconciliation record
 * @param {Object} reconciliationData - Reconciliation data
 * @returns {Promise<Object>} Created reconciliation record
 */
export const createReconciliation = async (reconciliationData) => {
  try {
    const response = await api.post('/cash-reconciliations', {
      agent_id: reconciliationData.agentId,
      reconciliation_date: reconciliationData.date,
      opening_float: reconciliationData.openingFloat || 0,
      expected_cash: reconciliationData.expectedCash || 0,
      actual_cash: reconciliationData.actualCash || 0,
      variance: reconciliationData.variance || 0,
      cash_denominations: reconciliationData.denominations || {},
      card_transactions: reconciliationData.cardTotal || 0,
      bank_transfers: reconciliationData.bankTransferTotal || 0,
      eftpos_transactions: reconciliationData.eftposTotal || 0,
      total_collected: reconciliationData.totalCollected || 0,
      notes: reconciliationData.notes || '',
      status: 'pending',
    });

    return response.data || response.reconciliation || response;
  } catch (error) {
    console.error('Error creating reconciliation:', error);
    throw error;
  }
};

/**
 * Update reconciliation status (approve/reject)
 * @param {string} reconciliationId - Reconciliation ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @param {string} approvedBy - Approver user ID
 * @param {string} notes - Optional approval/rejection notes
 * @returns {Promise<Object>} Updated reconciliation
 */
export const updateReconciliationStatus = async (reconciliationId, status, approvedBy, notes = '') => {
  try {
    const response = await api.put(`/cash-reconciliations/${reconciliationId}`, {
      status,
      approved_by: approvedBy,
      approval_notes: notes,
    });

    return response.data || response.reconciliation || response;
  } catch (error) {
    console.error('Error updating reconciliation status:', error);
    throw error;
  }
};

/**
 * Calculate variance between expected and actual cash
 * @param {number} expectedCash - Expected cash amount
 * @param {number} actualCash - Actual counted cash
 * @returns {number} Variance (can be positive or negative)
 */
export const calculateVariance = (expectedCash, actualCash) => {
  return actualCash - expectedCash;
};

/**
 * Calculate total from denomination breakdown
 * @param {Object} denominations - Cash denomination breakdown
 * @returns {number} Total amount
 */
export const calculateDenominationTotal = (denominations) => {
  const denoms = {
    100: denominations.hundred || 0,
    50: denominations.fifty || 0,
    20: denominations.twenty || 0,
    10: denominations.ten || 0,
    5: denominations.five || 0,
    2: denominations.two || 0,
    1: denominations.one || 0,
    0.50: denominations.fiftyCents || 0,
    0.20: denominations.twentyCents || 0,
    0.10: denominations.tenCents || 0,
    0.05: denominations.fiveCents || 0,
  };

  return Object.entries(denoms).reduce((total, [value, count]) => {
    return total + (parseFloat(value) * parseInt(count || 0));
  }, 0);
};
