import { supabase } from './supabaseClient';

/**
 * Quotation Workflow Service
 * Handles quotation lifecycle: draft → sent → approved → converted
 */

/**
 * Mark quotation as sent
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markQuotationAsSent(quotationId) {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', quotationId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error marking quotation as sent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Approve quotation
 * @param {string} quotationId - Quotation ID
 * @param {string} approvedBy - User ID who approved
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function approveQuotation(quotationId, approvedBy) {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', quotationId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error approving quotation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convert quotation to corporate voucher batch
 * @param {string} quotationId - Quotation ID
 * @param {object} paymentDetails - Payment information
 * @returns {Promise<{success: boolean, batchId?: string, vouchers?: array, error?: string}>}
 */
export async function convertQuotationToVoucherBatch(quotationId, paymentDetails) {
  try {
    // Fetch quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (quotationError) throw quotationError;

    // Verify quotation is approved
    if (quotation.status !== 'approved') {
      throw new Error('Only approved quotations can be converted');
    }

    // Generate batch ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate amounts
    const totalAmount = quotation.total_amount;
    const discountAmount = quotation.discount_amount || 0;
    const amountAfterDiscount = quotation.amount_after_discount || totalAmount - discountAmount;

    const collectedAmount = parseFloat(paymentDetails.collectedAmount);
    const returnedAmount = collectedAmount - amountAfterDiscount;

    // Generate voucher codes
    const vouchers = [];
    const vouchersToInsert = [];

    for (let i = 0; i < quotation.number_of_passports; i++) {
      const voucherCode = `VCH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const voucher = {
        voucher_code: voucherCode,
        passport_number: 'PENDING', // Will be filled during public registration
        company_name: quotation.company_name,
        quantity: 1,
        amount: quotation.amount_per_passport,
        payment_method: paymentDetails.paymentMethod,
        valid_from: new Date().toISOString(),
        valid_until: quotation.valid_until,
        quotation_id: quotationId,
        batch_id: batchId,
        created_by: paymentDetails.createdBy
      };

      vouchers.push({ ...voucher, voucherCode });
      vouchersToInsert.push(voucher);
    }

    // Insert all vouchers in a batch
    const { data: insertedVouchers, error: voucherError } = await supabase
      .from('corporate_vouchers')
      .insert(vouchersToInsert)
      .select();

    if (voucherError) throw voucherError;

    // Update quotation status to converted
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString()
      })
      .eq('id', quotationId);

    if (updateError) throw updateError;

    return {
      success: true,
      batchId,
      vouchers: insertedVouchers,
      quotation
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
    const { data, error } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        notes: reason
      })
      .eq('id', quotationId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get quotation statistics
 * @returns {Promise<object>}
 */
export async function getQuotationStatistics() {
  try {
    const { data, error } = await supabase
      .from('quotation_statistics')
      .select('*')
      .single();

    if (error) throw error;

    return data;
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
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<array>}
 */
export async function getQuotationVouchers(quotationId) {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
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

