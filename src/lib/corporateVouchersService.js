import { supabase } from './supabaseClient';
import { generateVoucherCode } from './utils';
import api from './api/client';

export const getCorporateVouchers = async () => {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .select(`
        *,
        passport:passports(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading corporate vouchers:', error);
    return [];
  }
};

export const createCorporateVoucher = async (voucherData, userId) => {
  try {
    const voucherCode = generateVoucherCode('CORP');

    const { data, error } = await supabase
      .from('corporate_vouchers')
      .insert([{
        voucher_code: voucherCode,
        passport_id: voucherData.passportId,
        passport_number: voucherData.passportNumber,
        company_name: voucherData.companyName,
        quantity: voucherData.quantity || 1,
        amount: voucherData.amount,
        payment_method: voucherData.paymentMethod,
        discount: voucherData.discount || 0,
        collected_amount: voucherData.collectedAmount,
        returned_amount: voucherData.returnedAmount || 0,
        valid_from: voucherData.validFrom || new Date().toISOString(),
        valid_until: voucherData.validUntil,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;

    // Create transaction record
    // TODO: Migrate to PostgreSQL API endpoint /api/transactions
    // await supabase.from('transactions').insert([{
    //   transaction_type: 'corporate',
    //   reference_id: data.id,
    //   amount: voucherData.amount,
    //   payment_method: voucherData.paymentMethod,
    //   passport_number: voucherData.passportNumber,
    //   created_by: userId,
    // }]);

    return data;
  } catch (error) {
    console.error('Error creating corporate voucher:', error);
    throw error;
  }
};

export const validateCorporateVoucher = async (voucherCode) => {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .select(`
        *,
        passport:passports(*)
      `)
      .eq('voucher_code', voucherCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { valid: false, message: 'Voucher not found' };

    if (data.used_at) {
      return { valid: false, message: 'Voucher already used', data };
    }

    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);
    const now = new Date();

    if (now < validFrom) {
      return { valid: false, message: 'Voucher not yet valid', data };
    }

    if (now > validUntil) {
      return { valid: false, message: 'Voucher expired', data };
    }

    return { valid: true, message: 'Voucher is valid', data };
  } catch (error) {
    console.error('Error validating corporate voucher:', error);
    return { valid: false, message: 'Error validating voucher' };
  }
};

export const markCorporateVoucherAsUsed = async (voucherCode) => {
  try {
    const { data, error } = await supabase
      .from('corporate_vouchers')
      .update({ used_at: new Date().toISOString() })
      .eq('voucher_code', voucherCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking voucher as used:', error);
    throw error;
  }
};

export const createBulkCorporateVouchers = async (bulkData) => {
  // Calls PostgreSQL backend API: POST /api/vouchers/bulk-corporate
  // bulkData: { companyName, count, amount, paymentMethod, validFrom?, validUntil }
  try {
    const payload = {
      company_name: bulkData.companyName,
      count: bulkData.count,
      amount: bulkData.amount, // per-voucher amount
      payment_method: bulkData.paymentMethod,
      valid_from: bulkData.validFrom || new Date().toISOString(),
      valid_until: bulkData.validUntil,
    };

    const response = await api.post('/vouchers/bulk-corporate', payload);
    return response.vouchers || [];
  } catch (error) {
    console.error('Error creating bulk corporate vouchers:', error);
    throw error;
  }
};

export const emailCorporateVouchers = async (emailData) => {
  // Calls PostgreSQL backend API: POST /api/vouchers/email-vouchers
  // emailData: { voucherIds, companyName, recipientEmail }
  try {
    const payload = {
      voucher_ids: emailData.voucherIds,
      company_name: emailData.companyName,
      recipient_email: emailData.recipientEmail,
    };

    const response = await api.post('/vouchers/email-vouchers', payload);
    return response;
  } catch (error) {
    console.error('Error emailing corporate vouchers:', error);
    throw error;
  }
};
