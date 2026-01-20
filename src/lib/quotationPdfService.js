/**
 * Quotation PDF Service
 * Handles PDF generation and download for quotations using backend API
 */

import api from './api/client';
import { API_URL } from '@/config/urls';

/**
 * Download quotation as PDF
 * @param {string|number} quotationId - Quotation ID
 * @param {string} quotationNumber - Quotation number (for filename)
 * @returns {Promise<{success: boolean}>}
 */
export async function downloadQuotationPDF(quotationId, quotationNumber) {
  try {
    // Get auth token (use the same key as the API client)
    const token = localStorage.getItem('greenpay_auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Fetch PDF from backend
    const response = await fetch(`${API_URL}/quotations/${quotationId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to download PDF' }));
      throw new Error(errorData.error || 'Failed to download PDF');
    }

    // Get filename from Content-Disposition header or use quotation number
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Quotation_${quotationNumber || quotationId}.pdf`;

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
    console.error('Error downloading quotation PDF:', error);
    throw error;
  }
}

/**
 * Open quotation PDF in new tab/window
 * @param {string|number} quotationId - Quotation ID
 * @returns {Promise<void>}
 */
export async function viewQuotationPDF(quotationId) {
  try {
    const token = localStorage.getItem('greenpay_auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Open PDF in new window
    const pdfUrl = `${API_URL}/quotations/${quotationId}/pdf`;
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
    console.error('Error viewing quotation PDF:', error);
    throw error;
  }
}

/**
 * Send quotation PDF via email
 * @param {string} quotationId - Quotation number (not ID)
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<{success: boolean}>}
 */
export async function emailQuotationPDF(quotationId, recipientEmail) {
  try {
    const response = await api.post('/quotations/send-email', {
      quotationId,
      recipientEmail
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Error emailing quotation:', error);
    throw error;
  }
}

// Legacy function name for backward compatibility
export const generateQuotationPDF = downloadQuotationPDF;
