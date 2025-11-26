import api from './api/client';

// Helper to make direct fetch calls for individual purchases
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';
const getToken = () => localStorage.getItem('greenpay_auth_token');

const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    console.error('API Error Response:', error);
    throw new Error(error.message || error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const getIndividualPurchases = async () => {
  try {
    const response = await fetchAPI('/individual-purchases');
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

    const response = await fetchAPI('/individual-purchases', {
      method: 'POST',
      body: JSON.stringify({
        passportNumber: purchaseData.passportNumber,
        amount: purchaseData.amount,
        paymentMethod: purchaseData.paymentMethod,
        cardLastFour: purchaseData.cardLastFour,
        discount: purchaseData.discount || 0,
        collectedAmount: purchaseData.collectedAmount,
        returnedAmount: purchaseData.returnedAmount || 0,
        validUntil: validUntil.toISOString(),
        nationality: purchaseData.nationality
      })
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
