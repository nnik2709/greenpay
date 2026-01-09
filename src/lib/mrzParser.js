/**
 * MRZ (Machine Readable Zone) Parser
 * Parses passport MRZ data according to ICAO Document 9303 standard
 *
 * MRZ Format (2 lines, 44 characters each = 88 total):
 * Line 1: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<<<<<<
 * Line 2: PASSPORTNUMBER<NATIONALITY<DOBYYMMDDSEXEXPIRYYYMMDD<<<<<<<<<<<<<CHECKDIGITS
 *
 * @module mrzParser
 */

import { convertCountryCodeToNationality } from './countryCodeMapper';

/**
 * Validates if a string is a valid MRZ format
 * @param {string} input - The input string to validate
 * @returns {boolean} - True if valid MRZ format
 */
export const isMrzFormat = (input) => {
  if (!input || typeof input !== 'string') return false;

  const cleaned = input.replace(/\s/g, '');

  // Must be exactly 88 characters
  if (cleaned.length !== 88) return false;

  // Must start with P< (passport identifier)
  if (!cleaned.startsWith('P<')) return false;

  // Should contain mostly uppercase letters, numbers, and <
  const validChars = /^[A-Z0-9<]+$/;
  if (!validChars.test(cleaned)) return false;

  return true;
};

/**
 * Parse MRZ data from passport scan
 * @param {string} mrzString - The 88-character MRZ string
 * @returns {Object} Parsed passport data or error
 */
export const parseMrz = (mrzString) => {
  try {
    const cleanedMrz = mrzString.replace(/\s/g, '');

    // Validate length
    if (cleanedMrz.length < 88) {
      throw new Error(`MRZ length is too short (${cleanedMrz.length} chars, expected 88).`);
    }

    // Split into two lines
    const line1 = cleanedMrz.substring(0, 44);
    const line2 = cleanedMrz.substring(44, 88);

    // === LINE 1 PARSING ===
    // Format: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<<<<<

    // Extract document type and issuing country
    const documentType = line1.substring(0, 2); // Should be "P<"
    const issuingCountry = line1.substring(2, 5);

    // Extract names (rest of line 1, split by <<)
    const namesSection = line1.substring(5);
    const names = namesSection.split('<<');
    const surname = names[0].replace(/</g, ' ').trim();
    const givenName = names.slice(1).join(' ').replace(/</g, ' ').trim();

    // === LINE 2 PARSING ===
    // Format: PASSPORTNUMBER<NATIONALITY<DOBYYMMDDSEXEXPIRYYYMMDD<<<<<<<<<<<<<CHECKDIGITS

    // Passport number (9 chars)
    const passportNumber = line2.substring(0, 9).replace(/</g, '').trim();
    const passportCheckDigit = line2.substring(9, 10);

    // Nationality (3 chars)
    const nationalityCode = line2.substring(10, 13);
    const nationality = convertCountryCodeToNationality(nationalityCode);

    // Date of birth (6 chars: YYMMDD)
    const dobRaw = line2.substring(13, 19);
    let dobYear = parseInt(dobRaw.substring(0, 2), 10);
    // Year conversion: if YY > current year's YY, it's 1900s, else 2000s
    const currentYear = new Date().getFullYear() % 100;
    dobYear += (dobYear > currentYear) ? 1900 : 2000;
    const dobMonth = dobRaw.substring(2, 4);
    const dobDay = dobRaw.substring(4, 6);
    const dob = `${dobYear}-${dobMonth}-${dobDay}`;
    const dobCheckDigit = line2.substring(19, 20);

    // Sex (1 char: M/F/<)
    const sexRaw = line2.substring(20, 21);
    const sex = sexRaw === 'M' ? 'Male' : sexRaw === 'F' ? 'Female' : 'Other';

    // Expiry date (6 chars: YYMMDD)
    const expiryRaw = line2.substring(21, 27);
    let expiryYear = parseInt(expiryRaw.substring(0, 2), 10);
    // Year conversion: if YY > 50, it's 1900s, else 2000s (expiry dates are usually near future)
    expiryYear += (expiryYear > 50) ? 1900 : 2000;
    const expiryMonth = expiryRaw.substring(2, 4);
    const expiryDay = expiryRaw.substring(4, 6);
    const expiryDate = `${expiryYear}-${expiryMonth}-${expiryDay}`;
    const expiryCheckDigit = line2.substring(27, 28);

    // Personal number / Optional data (14 chars)
    const personalNumber = line2.substring(28, 42).replace(/</g, '').trim();
    const personalNumberCheckDigit = line2.substring(42, 43);

    // Final composite check digit
    const compositeCheckDigit = line2.substring(43, 44);

    // Return parsed data
    return {
      success: true,
      type: 'mrz',
      raw: cleanedMrz,
      documentType: documentType,
      issuingCountry: issuingCountry,
      passportNumber: passportNumber,
      surname: surname,
      givenName: givenName,
      nationality: nationality, // Full nationality name (e.g., "Australian")
      nationalityCode: nationalityCode, // 3-letter code (e.g., "AUS")
      dob: dob,
      sex: sex,
      dateOfExpiry: expiryDate,
      personalNumber: personalNumber,
      // Include check digits for validation if needed
      checkDigits: {
        passportNumber: passportCheckDigit,
        dob: dobCheckDigit,
        expiry: expiryCheckDigit,
        personalNumber: personalNumberCheckDigit,
        composite: compositeCheckDigit
      },
      message: 'Passport MRZ parsed successfully.'
    };
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: error.message || 'Invalid MRZ format.',
      error: error
    };
  }
};

/**
 * Format passport data for display
 * @param {Object} parsedData - Parsed MRZ data
 * @returns {Object} Formatted display data
 */
export const formatMrzForDisplay = (parsedData) => {
  if (!parsedData.success) return null;

  return {
    'Passport Number': parsedData.passportNumber,
    'Full Name': `${parsedData.givenName} ${parsedData.surname}`,
    'Nationality': parsedData.nationality,
    'Date of Birth': parsedData.dob,
    'Sex': parsedData.sex,
    'Expiry Date': parsedData.dateOfExpiry,
    'Issuing Country': parsedData.issuingCountry
  };
};

/**
 * Validate MRZ check digits (optional, for future enhancement)
 * @param {string} data - The data to validate
 * @param {string} checkDigit - The check digit
 * @returns {boolean} True if valid
 */
export const validateCheckDigit = (data, checkDigit) => {
  // ICAO check digit algorithm
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value;

    if (char === '<') {
      value = 0;
    } else if (char >= '0' && char <= '9') {
      value = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else {
      return false; // Invalid character
    }

    sum += value * weights[i % 3];
  }

  const calculatedDigit = (sum % 10).toString();
  return calculatedDigit === checkDigit;
};

export default {
  parseMrz,
  isMrzFormat,
  formatMrzForDisplay,
  validateCheckDigit
};
