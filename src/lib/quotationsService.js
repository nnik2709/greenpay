import { supabase } from './supabaseClient';

const generateQuotationNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `QUO-${year}-${timestamp}${random}`;
};

export const getQuotations = async () => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
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

    const { data, error } = await supabase
      .from('quotations')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

export const updateQuotationStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
};

export const updateQuotation = async (id, updates) => {
  try {
    const updateData = {};
    if (updates.companyName) updateData.company_name = updates.companyName;
    if (updates.contactPerson) updateData.contact_person = updates.contactPerson;
    if (updates.contactEmail) updateData.contact_email = updates.contactEmail;
    if (updates.contactPhone) updateData.contact_phone = updates.contactPhone;
    if (updates.numberOfPassports) updateData.number_of_passports = updates.numberOfPassports;
    if (updates.amountPerPassport) updateData.amount_per_passport = updates.amountPerPassport;
    if (updates.validUntil) updateData.valid_until = updates.validUntil;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.status) updateData.status = updates.status;

    if (updateData.number_of_passports && updateData.amount_per_passport) {
      updateData.total_amount = updateData.number_of_passports * updateData.amount_per_passport;
    }

    const { data, error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};
