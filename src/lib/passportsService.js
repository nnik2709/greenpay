import api from './api/client';

export const getPassports = async () => {
  try {
    const response = await api.passports.getAll();
    const data = response.passports || response.data || response;
    return data;
  } catch (error) {
    console.error('Error loading passports:', error);
    return [];
  }
};

export const getPassportByNumber = async (passportNumber) => {
  try {
    // Use search with exact passport number
    const response = await api.passports.getAll({ passport_number: passportNumber });
    const data = response.passports || response.data || response;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error finding passport:', error);
    return null;
  }
};

export const searchPassports = async (query) => {
  try {
    // Use API search endpoint with query parameter
    const response = await api.passports.getAll({ search: query });
    const data = response.passports || response.data || response;
    return data;
  } catch (error) {
    console.error('Error searching passports:', error);
    return [];
  }
};

export const createPassport = async (passportData, userId) => {
  try {
    const payload = {
      passportNo: passportData.passportNumber,
      nationality: passportData.nationality,
      surname: passportData.surname,
      givenName: passportData.givenName,
      dateOfBirth: passportData.dob,
      sex: passportData.sex,
      dateOfExpiry: passportData.dateOfExpiry,
      createdById: userId,
    };

    const response = await api.passports.create(payload);
    return response.passport || response.data || response;
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

    const response = await api.passports.update(id, updateData);
    return response.passport || response.data || response;
  } catch (error) {
    console.error('Error updating passport:', error);
    throw error;
  }
};
