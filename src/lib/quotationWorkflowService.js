import api from './api/client';

/**
 * Quotation Workflow Service
 * Handles quotation lifecycle: draft → sent → approved → converted
 * Migrated from Supabase to REST API
 */

/**
 * Mark quotation as sent (does NOT send email, just updates status)
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markQuotationAsSent(quotationId) {
  try {
    const response = await api.patch(`/quotations/${quotationId}/mark-sent`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error marking quotation as sent:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Send quotation email to recipient
 * @param {string} quotationId - Quotation number (not ID!)
 * @param {string} recipientEmail - Email address to send to
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendQuotationEmail(quotationId, recipientEmail) {
  try {
    const response = await api.post('/quotations/send-email', {
      quotationId,
      recipientEmail
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending quotation email:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Approve quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} approvedBy - User ID who approved (not used in API, comes from auth token)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function approveQuotation(quotationId, approvedBy) {
  try {
    const response = await api.patch(`/quotations/${quotationId}/approve`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error approving quotation:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Convert quotation to corporate voucher batch
 * NOTE: This function still uses Supabase for corporate_vouchers table
 * TODO: Migrate to REST API when corporate vouchers backend is ready
 * @param {string} quotationId - Quotation ID
 * @param {object} paymentDetails - Payment information
 * @returns {Promise<{success: boolean, batchId?: string, vouchers?: array, error?: string}>}
 */
export async function convertQuotationToVoucherBatch(quotationId, paymentDetails) {
  try {
    // This functionality requires backend implementation for corporate vouchers
    // For now, return a placeholder error
    console.error('convertQuotationToVoucherBatch not yet migrated to REST API');
    return {
      success: false,
      error: 'Corporate voucher conversion not yet available. Please use "Convert to Invoice" instead.'
    };
  } catch (error) {
    console.error('Error converting quotation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function rejectQuotation(quotationId, reason) {
  try {
    // Update status to rejected with reason in notes
    const response = await api.put(`/quotations/${quotationId}`, {
      status: 'rejected',
      notes: reason
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Get quotation statistics
 * @returns {Promise<object>}
 */
export async function getQuotationStatistics() {
  try {
    const response = await api.get('/quotations/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching quotation statistics:', error);
    return {
      draft_count: 0,
      sent_count: 0,
      approved_count: 0,
      converted_count: 0,
      expired_count: 0,
      rejected_count: 0,
      total_count: 0,
      converted_value: 0,
      total_value: 0,
      conversion_rate: 0
    };
  }
}

/**
 * Get vouchers for a quotation
 * NOTE: This function still needs backend implementation
 * TODO: Migrate to REST API when corporate vouchers backend is ready
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<array>}
 */
export async function getQuotationVouchers(quotationId) {
  try {
    // This functionality requires backend implementation
    console.warn('getQuotationVouchers not yet implemented in REST API');
    return [];
  } catch (error) {
    console.error('Error fetching quotation vouchers:', error);
    return [];
  }
}

/**
 * Check if quotation can be converted
 * @param {object} quotation - Quotation object
 * @returns {boolean}
 */
export function canConvertQuotation(quotation) {
  if (!quotation) return false;

  // Must be approved
  if (quotation.status !== 'approved') return false;

  // Must not be already converted
  if (quotation.converted_at) return false;

  // Must not be expired
  const today = new Date().toISOString().split('T')[0];
  if (today > quotation.valid_until) return false;

  return true;
}

/**
 * Check if quotation can be approved
 * @param {object} quotation - Quotation object
 * @returns {boolean}
 */
export function canApproveQuotation(quotation) {
  if (!quotation) return false;

  // Must be sent or pending
  if (!['sent', 'pending'].includes(quotation.status)) return false;

  // Must not be already approved
  if (quotation.approved_at) return false;

  return true;
}
