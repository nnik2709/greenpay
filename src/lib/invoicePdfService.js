/**
 * Invoice PDF Service
 * Handles PDF generation, download, and viewing for invoices using backend API
 */

import api from './api/client';
import { API_URL } from '@/config/urls';

/**
 * Download invoice as PDF
 * @param {string|number} invoiceId - Invoice ID
 * @param {string} invoiceNumber - Invoice number (for filename)
 * @returns {Promise<{success: boolean}>}
 */
export async function downloadInvoicePDF(invoiceId, invoiceNumber) {
  try {
    // Get auth token (use the same key as the API client)
    const token = localStorage.getItem('greenpay_auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Fetch PDF from backend
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to download PDF' }));
      throw new Error(errorData.error || 'Failed to download PDF');
    }

    // Get filename from Content-Disposition header or use invoice number
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Invoice_${invoiceNumber || invoiceId}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
}

/**
 * Open invoice PDF in new tab/window
 * @param {string|number} invoiceId - Invoice ID
 * @returns {Promise<void>}
 */
export async function viewInvoicePDF(invoiceId) {
  try {
    const token = localStorage.getItem('greenpay_auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Open PDF in new window
    const pdfUrl = `${API_URL}/invoices/${invoiceId}/pdf`;
    const newWindow = window.open('', '_blank');

    if (!newWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Fetch and display PDF
    const response = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load PDF');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    newWindow.location.href = blobUrl;

  } catch (error) {
    console.error('Error viewing invoice PDF:', error);
    throw error;
  }
}

/**
 * Send invoice PDF via email
 * @param {string|number} invoiceId - Invoice ID
 * @param {string} recipientEmail - Recipient email address (optional, uses invoice email if not provided)
 * @returns {Promise<{success: boolean}>}
 */
export async function emailInvoicePDF(invoiceId, recipientEmail) {
  try {
    const response = await api.post(`/invoices/${invoiceId}/email`, {
      recipientEmail
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Error emailing invoice:', error);
    throw error;
  }
}

// Legacy function names for backward compatibility
export const generateInvoicePDF = downloadInvoicePDF;
export const printInvoicePDF = viewInvoicePDF;
