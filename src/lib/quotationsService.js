import api from './api/client';

const generateQuotationNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `QUO-${year}-${timestamp}${random}`;
};

export const getQuotations = async () => {
  try {
    const response = await api.get('/quotations');
    return response.data || [];
  } catch (error) {
    console.error('Error loading quotations:', error);
    return [];
  }
};

export const createQuotation = async (quotationData, userId) => {
  try {
    const quotationNumber = generateQuotationNumber();
    const totalAmount = quotationData.numberOfPassports * quotationData.amountPerPassport;
    const discountAmount = quotationData.discountAmount || 0;
    const amountAfterDiscount = quotationData.amountAfterDiscount || totalAmount;

    // Calculate GST (10% for PNG)
    const subtotal = amountAfterDiscount;
    const gstRate = 10.00;
    const gstAmount = parseFloat((subtotal * (gstRate / 100)).toFixed(2));
    const totalWithGst = subtotal + gstAmount;

    const insertData = {
      quotation_number: quotationNumber,
      customer_name: quotationData.companyName,
      customer_email: quotationData.contactEmail,
      description: `Quotation for ${quotationData.numberOfPassports} passport(s) - Contact: ${quotationData.contactPerson}${quotationData.contactPhone ? ', Phone: ' + quotationData.contactPhone : ''}${quotationData.notes ? '\nNotes: ' + quotationData.notes : ''}`,
      subtotal: subtotal,
      tax_percentage: gstRate,
      tax_amount: gstAmount,
      total_amount: totalWithGst,
      status: 'draft',
      valid_until: quotationData.validUntil,
      created_by: userId,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      payment_terms: 'Net 30 days',
    };

    console.log('Creating quotation via API:', insertData);

    const response = await api.post('/quotations', insertData);
    console.log('API response:', response);

    return response.data;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

export const updateQuotationStatus = async (id, status) => {
  try {
    const response = await api.patch(`/quotations/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
};

export const deleteQuotation = async (id) => {
  try {
    await api.delete(`/quotations/${id}`);
  } catch (error) {
    console.error('Error deleting quotation:', error);
    throw error;
  }
};

export const sendQuotationEmail = async (id) => {
  try {
    const response = await api.post(`/quotations/${id}/send`);
    return response.data;
  } catch (error) {
    console.error('Error sending quotation email:', error);
    throw error;
  }
};
