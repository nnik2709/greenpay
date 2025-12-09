
/**
 * Quotation PDF Generation Service
 * Handles PDF generation for quotations
 */

/**
 * Generate PDF for a quotation
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<{success: boolean, pdfUrl?: string, error?: string}>}
 */
export async function generateQuotationPDF(quotationId) {
  if (!quotationId) {
    throw new Error('Quotation ID is required');
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
      body: { quotation_id: quotationId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate PDF');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to generate PDF');
    }

    return {
      success: true,
      pdfUrl: data.pdfUrl,
      htmlUrl: data.htmlUrl,
      filename: data.filename,
      quotation: data.quotation
    };

  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    throw error;
  }
}

/**
 * Download PDF file to user's computer
 * @param {string} pdfUrl - URL of the PDF
 * @param {string} filename - Name for the downloaded file
 */
export async function downloadQuotationPDF(pdfUrl, filename) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'quotation.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Open PDF in new window
 * @param {string} pdfUrl - URL of the PDF
 */
export function viewQuotationPDF(pdfUrl) {
  window.open(pdfUrl, '_blank');
}

/**
 * Send quotation PDF via email
 * @param {string} quotationId - Quotation ID
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function emailQuotationPDF(quotationId, recipientEmail) {
  if (!quotationId || !recipientEmail) {
    throw new Error('Quotation ID and recipient email are required');
  }

  try {
    // First generate the PDF
    const pdfResult = await generateQuotationPDF(quotationId);
    
    if (!pdfResult.success) {
      throw new Error('Failed to generate PDF');
    }

    // Then send via email Edge Function
    const { data, error } = await supabase.functions.invoke('send-quotation', {
      body: {
        quotation_id: quotationId,
        pdf_url: pdfResult.pdfUrl,
        recipient_email: recipientEmail
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to send email');
    }

    return { success: true };

  } catch (error) {
    console.error('Error emailing quotation:', error);
    throw error;
  }
}









