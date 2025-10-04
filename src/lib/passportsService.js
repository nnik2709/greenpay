import { supabase } from './supabaseClient';

export const getPassports = async () => {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading passports:', error);
    return [];
  }
};

export const getPassportByNumber = async (passportNumber) => {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('passport_number', passportNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding passport:', error);
    return null;
  }
};

export const searchPassports = async (query) => {
  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .or(`passport_number.ilike.%${query}%,surname.ilike.%${query}%,given_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching passports:', error);
    return [];
  }
};

export const createPassport = async (passportData, userId) => {
  try {
    const { data, error } = await supabase
      .from('passports')
      .insert([{
        passport_number: passportData.passportNumber,
        nationality: passportData.nationality,
        surname: passportData.surname,
        given_name: passportData.givenName,
        date_of_birth: passportData.dob,
        sex: passportData.sex,
        date_of_expiry: passportData.dateOfExpiry,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating passport:', error);
    throw error;
  }
};

export const updatePassport = async (id, updates) => {
  try {
    const updateData = {};
    if (updates.passportNumber) updateData.passport_number = updates.passportNumber;
    if (updates.nationality) updateData.nationality = updates.nationality;
    if (updates.surname) updateData.surname = updates.surname;
    if (updates.givenName) updateData.given_name = updates.givenName;
    if (updates.dob) updateData.date_of_birth = updates.dob;
    if (updates.sex) updateData.sex = updates.sex;
    if (updates.dateOfExpiry) updateData.date_of_expiry = updates.dateOfExpiry;

    const { data, error } = await supabase
      .from('passports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating passport:', error);
    throw error;
  }
};
