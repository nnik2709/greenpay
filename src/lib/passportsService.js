import api from './api/client';

export const getPassports = async () => {
  try {
    // Request all passports (high limit to get all records)
    const response = await api.passports.getAll({ limit: 10000 });
    const data = response.passports || response.data || response;
    return data;
  } catch (error) {
    console.error('Error loading passports:', error);
    return [];
  }
};

export const getPassportById = async (id) => {
  try {
    const response = await api.passports.getById(id);
    return response.passport || response.data || response;
  } catch (error) {
    console.error('Error loading passport:', error);
    throw error;
  }
};

/**
 * Get passport by number only (may return wrong person if same number exists in different countries)
 * @deprecated Use getPassportByNumberAndNationality for accurate lookups
 */
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

/**
 * Get passport by number AND nationality (recommended - globally unique)
 * Passport numbers are only unique within a country, not worldwide.
 * @param {string} passportNumber - The passport number
 * @param {string} nationality - The nationality/country code (e.g., 'DNK', 'PHL', 'PNG')
 * @returns {Object|null} The passport record or null if not found
 */
export const getPassportByNumberAndNationality = async (passportNumber, nationality) => {
  try {
    // Use search with both passport number and nationality
    const response = await api.passports.getAll({
      passport_number: passportNumber,
      nationality: nationality
    });
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
      passport_number: passportData.passportNumber,
      nationality: passportData.nationality,
      surname: passportData.surname,
      given_name: passportData.givenName,
      date_of_birth: passportData.dob,
      sex: passportData.sex,
      date_of_expiry: passportData.dateOfExpiry,
      created_by_id: userId,
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
    // Accept both camelCase and snake_case field names
    const updateData = {};

    // camelCase fields (convert to snake_case)
    if (updates.passportNumber) updateData.passport_number = updates.passportNumber;
    if (updates.givenName) updateData.given_name = updates.givenName;
    if (updates.dob) updateData.date_of_birth = updates.dob;
    if (updates.dateOfExpiry) updateData.date_of_expiry = updates.dateOfExpiry;

    // snake_case fields (pass through directly)
    if (updates.passport_number) updateData.passport_number = updates.passport_number;
    if (updates.given_name) updateData.given_name = updates.given_name;
    if (updates.date_of_birth) updateData.date_of_birth = updates.date_of_birth;
    if (updates.date_of_expiry) updateData.date_of_expiry = updates.date_of_expiry;
    if (updates.place_of_birth) updateData.place_of_birth = updates.place_of_birth;
    if (updates.place_of_issue) updateData.place_of_issue = updates.place_of_issue;
    if (updates.date_of_issue) updateData.date_of_issue = updates.date_of_issue;

    // Fields that work in both formats
    if (updates.nationality) updateData.nationality = updates.nationality;
    if (updates.surname) updateData.surname = updates.surname;
    if (updates.sex) updateData.sex = updates.sex;

    const response = await api.passports.update(id, updateData);

    // Return in format compatible with old service ({ success, data })
    return {
      success: true,
      data: response.passport || response.data || response
    };
  } catch (error) {
    console.error('Error updating passport:', error);
    return {
      success: false,
      error: error.message || 'Failed to update passport'
    };
  }
};
