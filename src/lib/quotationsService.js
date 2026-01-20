import api from './api/client';

const generateQuotationNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `QUO-${year}-${timestamp}${random}`;
};

export const getQuotations = async (filters = {}) => {
  try {
    const response = await api.quotations.getAll(filters);
    return response.data || [];
  } catch (error) {
    console.error('Error loading quotations:', error);
    return [];
  }
};

export const createQuotation = async (quotationData, userId) => {
  try {
    const quotationNumber = generateQuotationNumber();
    const unitPrice = quotationData.amountPerPassport || 50; // Default PGK 50 per voucher
    const quantity = quotationData.numberOfPassports || 1;
    const totalAmount = quantity * unitPrice;
    const discountPercentage = quotationData.discount || 0;
    const discountAmount = quotationData.discountAmount || 0;
    const amountAfterDiscount = quotationData.amountAfterDiscount || (totalAmount - discountAmount);

    // Calculate GST (10% for PNG)
    const subtotal = amountAfterDiscount;
    const gstRate = 10.00;
    const gstAmount = parseFloat((subtotal * (gstRate / 100)).toFixed(2));
    const totalWithGst = subtotal + gstAmount;

    const insertData = {
      quotation_number: quotationNumber,
      company_name: quotationData.companyName,
      contact_person: quotationData.contactPerson,
      contact_email: quotationData.contactEmail,
      contact_phone: quotationData.contactPhone || '',
      number_of_vouchers: quantity,
      unit_price: unitPrice,
      line_total: totalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      amount: subtotal,
      tax_amount: gstAmount,
      total_amount: totalWithGst,
      status: 'draft',
      valid_until: quotationData.validUntil,
      notes: quotationData.notes || '',
      created_by: userId,
    };

    console.log('Creating quotation via API:', insertData);

    const response = await api.quotations.create(insertData);
    console.log('API response:', response);

    return response.data || response;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

export const updateQuotationStatus = async (id, status) => {
  try {
    const response = await api.get(`/quotations/${id}/status`, {
      params: { status }
    });
    return response.data || response;
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
};

export const updateQuotation = async (id, quotationData, userId) => {
  try {
    const unitPrice = quotationData.amountPerPassport || 50;
    const quantity = quotationData.numberOfPassports || 1;
    const totalAmount = quantity * unitPrice;
    const discountPercentage = quotationData.discount || 0;
    const discountAmount = quotationData.discountAmount || 0;
    const amountAfterDiscount = quotationData.amountAfterDiscount || (totalAmount - discountAmount);

    // Calculate GST (10% for PNG)
    const subtotal = amountAfterDiscount;
    const gstRate = 10.00;
    const gstAmount = parseFloat((subtotal * (gstRate / 100)).toFixed(2));
    const totalWithGst = subtotal + gstAmount;

    const updateData = {
      company_name: quotationData.companyName,
      contact_person: quotationData.contactPerson,
      contact_email: quotationData.contactEmail,
      contact_phone: quotationData.contactPhone || '',
      number_of_vouchers: quantity,
      unit_price: unitPrice,
      line_total: totalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      amount: subtotal,
      tax_amount: gstAmount,
      total_amount: totalWithGst,
      valid_until: quotationData.validUntil,
      notes: quotationData.notes || '',
    };

    console.log('Updating quotation via API:', updateData);

    const response = await api.quotations.update(id, updateData);
    console.log('API response:', response);

    return response.data || response;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};

export const deleteQuotation = async (id) => {
  try {
    await api.quotations.delete(id);
  } catch (error) {
    console.error('Error deleting quotation:', error);
    throw error;
  }
};

export const sendQuotationEmail = async (id) => {
  try {
    const response = await api.get(`/quotations/${id}/send`);
    return response.data || response;
  } catch (error) {
    console.error('Error sending quotation email:', error);
    throw error;
  }
};
