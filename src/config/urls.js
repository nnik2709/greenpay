/**
 * Centralized URL configuration
 * Single source of truth for all domain URLs
 */

// Get public URL from environment variable
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'https://greenpay.eywademo.cloud';

// Get API base URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL || 'https://greenpay.eywademo.cloud/api';

/**
 * Build a public registration URL
 * @param {string} voucherCode - The voucher code
 * @returns {string} Full registration URL
 */
export const getRegistrationUrl = (voucherCode) => {
  return `${PUBLIC_URL}/register/${voucherCode}`;
};

/**
 * Build a payment callback URL
 * @param {string} path - The callback path
 * @returns {string} Full callback URL
 */
export const getPaymentCallbackUrl = (path) => {
  return `${PUBLIC_URL}/payment/${path}`;
};
