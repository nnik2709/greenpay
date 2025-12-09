
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
    let query = supabase
      .from('cash_reconciliations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.date_from) {
      query = query.gte('reconciliation_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('reconciliation_date', filters.date_to);
    }
    if (filters.agent_id) {
      query = query.eq('agent_id', filters.agent_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
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
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('created_by', agentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Calculate totals by payment method
    const summary = {
      total: 0,
      cash: 0,
      card: 0,
      bankTransfer: 0,
      eftpos: 0,
      transactions: transactions || [],
      count: transactions?.length || 0,
    };

    (transactions || []).forEach(tx => {
      const amount = parseFloat(tx.amount) || 0;
      summary.total += amount;

      const method = tx.payment_method?.toLowerCase();
      if (method === 'cash') {
        summary.cash += amount;
      } else if (method?.includes('card') || method === 'credit card' || method === 'debit card') {
        summary.card += amount;
      } else if (method === 'bank transfer') {
        summary.bankTransfer += amount;
      } else if (method === 'eftpos') {
        summary.eftpos += amount;
      }
    });

    return summary;
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
    const { data, error } = await supabase
      .from('cash_reconciliations')
      .insert([{
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
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const updateData = {
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.approval_notes = notes;
    }

    const { data, error } = await supabase
      .from('cash_reconciliations')
      .update(updateData)
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
