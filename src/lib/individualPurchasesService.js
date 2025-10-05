import { supabase } from './supabaseClient';

const generateVoucherCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IND-${timestamp}-${random}`;
};

export const getIndividualPurchases = async () => {
  try {
    const { data, error } = await supabase
      .from('individual_purchases')
      .select(`
        *,
        passport:passports(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading individual purchases:', error);
    return [];
  }
};

export const createIndividualPurchase = async (purchaseData, userId) => {
  try {
    const voucherCode = generateVoucherCode();

    // Use custom validity if provided, otherwise default to 30 days
    let validUntil;
    if (purchaseData.validUntil) {
      validUntil = new Date(purchaseData.validUntil);
    } else {
      validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
    }

    const { data, error } = await supabase
      .from('individual_purchases')
      .insert([{
        voucher_code: voucherCode,
        passport_id: purchaseData.passportId,
        passport_number: purchaseData.passportNumber,
        amount: purchaseData.amount,
        payment_method: purchaseData.paymentMethod,
        card_last_four: purchaseData.cardLastFour,
        valid_until: validUntil.toISOString(),
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;

    // Create transaction record
    await supabase.from('transactions').insert([{
      transaction_type: 'individual',
      reference_id: data.id,
      amount: purchaseData.amount,
      payment_method: purchaseData.paymentMethod,
      passport_number: purchaseData.passportNumber,
      nationality: purchaseData.nationality,
      created_by: userId,
    }]);

    return data;
  } catch (error) {
    console.error('Error creating individual purchase:', error);
    throw error;
  }
};

export const validateVoucher = async (voucherCode) => {
  try {
    const { data, error } = await supabase
      .from('individual_purchases')
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

    const validUntil = new Date(data.valid_until);
    if (validUntil < new Date()) {
      return { valid: false, message: 'Voucher expired', data };
    }

    return { valid: true, message: 'Voucher is valid', data };
  } catch (error) {
    console.error('Error validating voucher:', error);
    return { valid: false, message: 'Error validating voucher' };
  }
};

export const markVoucherAsUsed = async (voucherCode) => {
  try {
    const { data, error } = await supabase
      .from('individual_purchases')
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
