/**
 * Centralized URL configuration for backend
 * Single source of truth for all domain URLs
 */

// Get URLs from environment variables with fallbacks
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://greenpay.eywademo.cloud';
const API_URL = process.env.API_URL || 'https://greenpay.eywademo.cloud/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://greenpay.eywademo.cloud';

/**
 * Build a public registration URL
 * @param {string} voucherCode - The voucher code
 * @returns {string} Full registration URL
 */
const getRegistrationUrl = (voucherCode) => {
  return `${PUBLIC_URL}/register/${voucherCode}`;
};

/**
 * Build a payment callback URL
 * @param {string} path - The callback path
 * @returns {string} Full callback URL
 */
const getPaymentCallbackUrl = (path) => {
  return `${FRONTEND_URL}/payment/${path}`;
};

/**
 * Build an app URL
 * @param {string} path - The app path (e.g., '/tickets', '/dashboard')
 * @returns {string} Full app URL
 */
const getAppUrl = (path) => {
  return `${PUBLIC_URL}/app${path}`;
};

module.exports = {
  PUBLIC_URL,
  API_URL,
  FRONTEND_URL,
  getRegistrationUrl,
  getPaymentCallbackUrl,
  getAppUrl,
};
