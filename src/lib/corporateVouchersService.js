import { supabase } from './supabaseClient';
import { generateVoucherCode } from './utils';

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
    await supabase.from('transactions').insert([{
      transaction_type: 'corporate',
      reference_id: data.id,
      amount: voucherData.amount,
      payment_method: voucherData.paymentMethod,
      passport_number: voucherData.passportNumber,
      created_by: userId,
    }]);

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
  // Calls Supabase Edge Function: bulk-corporate
  // bulkData: { companyName, count, amount, paymentMethod, validFrom?, validUntil }
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Not authenticated');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-corporate`;
  const payload = {
    company_name: bulkData.companyName,
    count: bulkData.count,
    amount: bulkData.amount, // per-voucher amount
    payment_method: bulkData.paymentMethod,
    valid_from: bulkData.validFrom || new Date().toISOString(),
    valid_until: bulkData.validUntil,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create corporate vouchers');
  }

  const json = await res.json();
  return json.vouchers || [];
};
