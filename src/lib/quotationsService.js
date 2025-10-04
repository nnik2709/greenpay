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

    const { data, error } = await supabase
      .from('quotations')
      .insert([{
        quotation_number: quotationNumber,
        company_name: quotationData.companyName,
        contact_person: quotationData.contactPerson,
        contact_email: quotationData.contactEmail,
        contact_phone: quotationData.contactPhone,
        number_of_passports: quotationData.numberOfPassports,
        amount_per_passport: quotationData.amountPerPassport,
        total_amount: totalAmount,
        valid_until: quotationData.validUntil,
        notes: quotationData.notes,
        status: 'pending',
        created_by: userId,
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
