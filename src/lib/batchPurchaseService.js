/**
 * Batch Purchase Service
 *
 * Isolated service for batch individual voucher purchases.
 * Does NOT modify or interfere with existing services:
 * - individualPurchasesService.js (single purchases)
 * - corporateVouchersService.js (corporate purchases)
 * - Public online purchases (BuyOnline.jsx)
 */

import api from './api/client';
import FEATURE_FLAGS from '@/config/features';

/**
 * Validate batch purchase data
 * @throws {Error} if validation fails
 */
export function validateBatchPurchase(passports) {
  if (!Array.isArray(passports)) {
    throw new Error('Passports must be an array');
  }

  if (passports.length === 0) {
    throw new Error('At least one passport is required');
  }

  if (passports.length > FEATURE_FLAGS.BATCH_PURCHASE_MAX_QUANTITY) {
    throw new Error(
      `Maximum ${FEATURE_FLAGS.BATCH_PURCHASE_MAX_QUANTITY} vouchers allowed per batch`
    );
  }

  // Validate each passport
  passports.forEach((passport, index) => {
    if (!passport.passportNumber || !passport.passportNumber.trim()) {
      throw new Error(`Passport ${index + 1}: Passport number is required`);
    }
    if (!passport.fullName || !passport.fullName.trim()) {
      throw new Error(`Passport ${index + 1}: Full name is required`);
    }
    if (!passport.nationality || !passport.nationality.trim()) {
      throw new Error(`Passport ${index + 1}: Nationality is required`);
    }
  });

  // Check for duplicate passport numbers
  const passportNumbers = passports.map(p => p.passportNumber.toUpperCase());
  const uniqueNumbers = new Set(passportNumbers);

  if (uniqueNumbers.size !== passportNumbers.length) {
    throw new Error('Duplicate passport numbers detected. Each passport must be unique.');
  }

  return true;
}

/**
 * Create batch purchase (1-5 vouchers in single transaction)
 *
 * @param {Array} passports - Array of passport objects
 * @param {Object} paymentInfo - Payment information
 * @returns {Promise<Object>} Batch purchase result
 */
export async function createBatchPurchase(passports, paymentInfo) {
  try {
    // Validate input
    validateBatchPurchase(passports);

    if (!paymentInfo.paymentMethod) {
      throw new Error('Payment method is required');
    }

    const requestData = {
      passports: passports.map(p => ({
        passportNumber: p.passportNumber.trim(),
        fullName: p.fullName.trim(),
        nationality: p.nationality.trim(),
        dateOfBirth: p.dateOfBirth || null,
        gender: p.gender || null,
        passportExpiry: p.passportExpiry || null,
      })),
      paymentMethod: paymentInfo.paymentMethod,
      discount: paymentInfo.discount || 0,
      customerEmail: paymentInfo.customerEmail || null,
    };

    console.log('[BATCH_PURCHASE] Creating batch purchase:', {
      quantity: requestData.passports.length,
      paymentMethod: requestData.paymentMethod,
    });

    const response = await api.post('/individual-purchases/batch', requestData);

    console.log('[BATCH_PURCHASE] Success:', {
      batchId: response.data.batchId,
      quantity: response.data.quantity,
    });

    return response.data;
  } catch (error) {
    console.error('[BATCH_PURCHASE] Error:', error);

    // Provide user-friendly error messages
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create batch purchase');
    }

    throw error;
  }
}

/**
 * Download batch PDF (all vouchers in single PDF)
 *
 * @param {string} batchId - Batch ID
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadBatchPDF(batchId) {
  try {
    console.log('[BATCH_PURCHASE] Downloading PDF for batch:', batchId);

    const response = await api.get(`/individual-purchases/batch/${batchId}/pdf`, {
      responseType: 'blob',
    });

    console.log('[BATCH_PURCHASE] PDF download complete:', {
      batchId,
      size: response.data.size,
    });

    return response.data;
  } catch (error) {
    console.error('[BATCH_PURCHASE] PDF download error:', error);
    throw new Error('Failed to download batch PDF');
  }
}

/**
 * Send batch vouchers via email
 *
 * @param {string} batchId - Batch ID
 * @param {string} email - Recipient email address
 * @returns {Promise<Object>} Email send result
 */
export async function sendBatchEmail(batchId, email) {
  try {
    if (!email || !email.trim()) {
      throw new Error('Email address is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email address');
    }

    console.log('[BATCH_PURCHASE] Sending email for batch:', {
      batchId,
      email: email.trim(),
    });

    const response = await api.post(`/individual-purchases/batch/${batchId}/email`, {
      email: email.trim(),
    });

    console.log('[BATCH_PURCHASE] Email sent successfully');

    return response.data;
  } catch (error) {
    console.error('[BATCH_PURCHASE] Email send error:', error);

    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to send batch email');
    }

    throw error;
  }
}

/**
 * Helper function to trigger PDF download in browser
 *
 * @param {Blob} blob - PDF blob
 * @param {string} batchId - Batch ID for filename
 */
export function triggerPDFDownload(blob, batchId) {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-${batchId}-vouchers.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log('[BATCH_PURCHASE] PDF download triggered');
  } catch (error) {
    console.error('[BATCH_PURCHASE] Download trigger error:', error);
    throw new Error('Failed to trigger PDF download');
  }
}

/**
 * Calculate batch purchase totals
 *
 * @param {number} quantity - Number of vouchers
 * @param {number} discount - Discount amount (default: 0)
 * @returns {Object} Pricing breakdown
 */
export function calculateBatchTotals(quantity, discount = 0) {
  const VOUCHER_PRICE = 50.0; // PGK 50 per voucher

  const subtotal = VOUCHER_PRICE * quantity;
  const discountAmount = Math.max(0, discount);
  const total = Math.max(0, subtotal - discountAmount);

  return {
    voucherPrice: VOUCHER_PRICE,
    quantity,
    subtotal,
    discount: discountAmount,
    total,
  };
}

export default {
  validateBatchPurchase,
  createBatchPurchase,
  downloadBatchPDF,
  sendBatchEmail,
  triggerPDFDownload,
  calculateBatchTotals,
};
