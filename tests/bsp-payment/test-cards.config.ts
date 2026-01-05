/**
 * BSP DOKU Test Card Configuration
 *
 * IMPORTANT: Fill in the test card details provided by BSP
 * These are STAGING/TEST cards only - do not use real cards!
 */

export interface TestCard {
  name: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  expectedResult: 'success' | 'fail' | 'insufficient_funds' | 'invalid';
  description: string;
}

export const TEST_CARDS: TestCard[] = [
  {
    name: 'Success Card #1',
    cardNumber: '4761349999000039',
    expiryMonth: '12',
    expiryYear: '31',
    cvv: '998',
    expectedResult: 'success',
    description: 'BSP test card #1 - Should complete payment successfully'
  },
  {
    name: 'Success Card #2',
    cardNumber: '557381011111101',
    expiryMonth: '01',
    expiryYear: '28',
    cvv: '123',
    expectedResult: 'success',
    description: 'BSP test card #2 - Should complete payment successfully'
  },
  {
    name: 'BSP Visa Platinum',
    cardNumber: '4889750100103462',
    expiryMonth: '04',
    expiryYear: '27',
    cvv: '921',
    expectedResult: 'success',
    description: 'BSP Visa Platinum - Should complete payment successfully'
  },
  {
    name: 'BSP Visa Silver',
    cardNumber: '4889730100994185',
    expiryMonth: '04',
    expiryYear: '27',
    cvv: '061',
    expectedResult: 'success',
    description: 'BSP Visa Silver - Should complete payment successfully'
  }
];

// Test passport data for different scenarios
export const TEST_PASSPORTS = {
  valid: {
    passportNumber: 'TEST123456',
    surname: 'Smith',
    givenName: 'John',
    nationality: 'AUS',
    dateOfBirth: '1990-01-15',
    sex: 'M',
    expiryDate: '2030-12-31',
    issuingCountry: 'AUS'
  },
  specialChars: {
    passportNumber: 'TEST789012',
    surname: "O'Brien",
    givenName: 'José María',
    nationality: 'ESP',
    dateOfBirth: '1985-06-20',
    sex: 'M',
    expiryDate: '2029-06-30',
    issuingCountry: 'ESP'
  },
  longName: {
    passportNumber: 'TEST345678',
    surname: 'Van der Westhuizen-Johannesburg',
    givenName: 'Alexander Christopher',
    nationality: 'ZAF',
    dateOfBirth: '1992-03-10',
    sex: 'M',
    expiryDate: '2028-03-31',
    issuingCountry: 'ZAF'
  },
  minimal: {
    passportNumber: 'TEST901234',
    surname: 'Doe',
    givenName: 'Jane',
    nationality: '', // Empty optional field
    dateOfBirth: '', // Empty optional field
    sex: 'F',
    expiryDate: '', // Empty optional field
    issuingCountry: ''
  }
};

// Test environment configuration
export const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://greenpay.eywademo.cloud',
  timeout: {
    payment: 60000, // 60 seconds for payment completion
    webhook: 5000,  // 5 seconds for webhook to arrive
    voucher: 3000   // 3 seconds for voucher to appear
  },
  retries: {
    voucherCheck: 10,
    voucherInterval: 2000 // 2 seconds between checks
  },
  // 3D Secure / OTP configuration
  otp: {
    // BSP provides OTP test number - fill this in when BSP provides it
    testOtp: '', // e.g., '123456' or whatever BSP provides for testing
    timeout: 30000 // 30 seconds to wait for OTP page
  }
};
