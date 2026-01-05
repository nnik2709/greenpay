import api from './api/client';

export const getIndividualPurchases = async () => {
  try {
    const response = await api.get('/individual-purchases');
    return response.data || [];
  } catch (error) {
    console.error('Error loading individual purchases:', error);
    return [];
  }
};

export const createIndividualPurchase = async (purchaseData, userId) => {
  try {
    // Use custom validity if provided, otherwise default to 30 days
    let validUntil;
    if (purchaseData.validUntil) {
      validUntil = new Date(purchaseData.validUntil);
    } else {
      validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
    }

    const response = await api.post('/individual-purchases', {
      passportNumber: purchaseData.passportNumber,
      amount: purchaseData.amount,
      paymentMethod: purchaseData.paymentMethod,
      cardLastFour: purchaseData.cardLastFour,
      discount: purchaseData.discount || 0,
      collectedAmount: purchaseData.collectedAmount,
      returnedAmount: purchaseData.returnedAmount || 0,
      validUntil: validUntil.toISOString(),
      nationality: purchaseData.nationality
    });

    return response.data;
  } catch (error) {
    console.error('Error creating individual purchase:', error);
    throw error;
  }
};

export const validateVoucher = async (voucherCode) => {
  try {
    const response = await api.vouchers.validate(voucherCode);
    return response;
  } catch (error) {
    console.error('Error validating voucher:', error);
    return { valid: false, message: 'Error validating voucher' };
  }
};

export const markVoucherAsUsed = async (voucherCode) => {
  try {
    const response = await api.vouchers.markUsed(voucherCode);
    return response.data;
  } catch (error) {
    console.error('Error marking voucher as used:', error);
    throw error;
  }
};

// getVouchersByPassport function removed - feature deprecated
