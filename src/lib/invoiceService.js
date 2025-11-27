import api from './api/client';

/**
 * Get all invoices with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of invoices
 */
export const getInvoices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.customer) params.append('customer', filters.customer);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);

    const response = await api.get(`/invoices?${params.toString()}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

/**
 * Get single invoice by ID with payment history
 * @param {number} id - Invoice ID
 * @returns {Promise<Object>} Invoice details
 */
export const getInvoice = async (id) => {
  try {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

/**
 * Convert quotation to invoice
 * @param {Object} data - Conversion data
 * @returns {Promise<Object>} Created invoice
 */
export const convertQuotationToInvoice = async (data) => {
  try {
    const response = await api.post('/invoices/from-quotation', data);
    return response.data;
  } catch (error) {
    console.error('Error converting quotation to invoice:', error);
    throw error;
  }
};

/**
 * Record payment for invoice
 * @param {number} invoiceId - Invoice ID
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} Payment record
 */
export const recordPayment = async (invoiceId, paymentData) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Get payment history for invoice
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<Array>} List of payments
 */
export const getPaymentHistory = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}/payments`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

/**
 * Generate vouchers (green passes) for fully paid invoice
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<Object>} Generated vouchers
 */
export const generateVouchers = async (invoiceId) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/generate-vouchers`);
    return response.data;
  } catch (error) {
    console.error('Error generating vouchers:', error);
    throw error;
  }
};

/**
 * Get invoice statistics
 * @returns {Promise<Object>} Invoice statistics
 */
export const getInvoiceStatistics = async () => {
  try {
    const response = await api.get('/invoices/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    throw error;
  }
};

/**
 * Check if quotation can be converted to invoice
 * @param {Object} quotation - Quotation object
 * @returns {boolean} True if can be converted
 */
export const canConvertToInvoice = (quotation) => {
  if (!quotation) return false;
  if (quotation.converted_to_invoice) return false;
  if (quotation.status !== 'approved' && quotation.status !== 'sent') return false;
  return true;
};

/**
 * Check if invoice can have payment recorded
 * @param {Object} invoice - Invoice object
 * @returns {boolean} True if can record payment
 */
export const canRecordPayment = (invoice) => {
  if (!invoice) return false;
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  return true;
};

/**
 * Check if vouchers can be generated
 * @param {Object} invoice - Invoice object
 * @returns {boolean} True if can generate vouchers
 */
export const canGenerateVouchers = (invoice) => {
  if (!invoice) return false;
  if (invoice.status !== 'paid') return false;
  if (invoice.vouchers_generated) return false;
  return true;
};

/**
 * Download invoice as PDF
 * @param {number} invoiceId - Invoice ID
 * @param {string} invoiceNumber - Invoice number for filename
 * @returns {Promise<void>}
 */
export const downloadInvoicePDF = async (invoiceId, invoiceNumber) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};
