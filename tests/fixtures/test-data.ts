/**
 * Test Data Fixtures
 * Predefined test data for consistent testing
 */

export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'Flex_Admin'
  },
  counterAgent: {
    email: 'agent@example.com',
    password: 'agent123',
    role: 'Counter_Agent'
  },
  financeManager: {
    email: 'finance@example.com',
    password: 'finance123',
    role: 'Finance_Manager'
  },
  itSupport: {
    email: 'it@example.com',
    password: 'it123',
    role: 'IT_Support'
  }
};

export const testPassports = {
  valid: {
    passportNumber: 'TEST123456',
    nationality: 'Australian',
    surname: 'SMITH',
    givenName: 'JOHN',
    dateOfBirth: '1990-01-15',
    sex: 'Male',
    dateOfExpiry: '2030-12-31'
  },
  expiringSoon: {
    passportNumber: 'TEST789012',
    nationality: 'American',
    surname: 'DOE',
    givenName: 'JANE',
    dateOfBirth: '1985-06-20',
    sex: 'Female',
    dateOfExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
  }
};

export const testPayments = {
  cash: {
    mode: 'CASH',
    amount: 50,
    collectedAmount: 100,
    expectedChange: 50
  },
  card: {
    mode: 'CREDIT CARD',
    amount: 50,
    cardNumber: '4111111111111111',
    expiry: '12/25',
    cvc: '123'
  }
};

export const testCorporateVoucher = {
  companyName: 'Acme Corporation',
  quantity: 5,
  voucherValue: 50,
  discount: 10, // 10%
  validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days
};

export const testQuotation = {
  companyName: 'Test Industries Ltd',
  contactPerson: 'John Manager',
  contactEmail: 'manager@testindustries.com',
  contactPhone: '+675 12345678',
  numberOfPassports: 10,
  amountPerPassport: 50,
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
  notes: 'Test quotation for validation'
};

export const testBulkUpload = {
  fileName: 'test-passports.csv',
  records: [
    {
      passportNumber: 'BULK001',
      surname: 'ALPHA',
      givenName: 'ADAM',
      dateOfBirth: '1992-03-10',
      nationality: 'Australian',
      sex: 'Male',
      dateOfExpiry: '2028-03-10'
    },
    {
      passportNumber: 'BULK002',
      surname: 'BETA',
      givenName: 'BARBARA',
      dateOfBirth: '1988-07-25',
      nationality: 'British',
      sex: 'Female',
      dateOfExpiry: '2029-07-25'
    }
  ]
};

export const testCSVContent = `passport_no,surname,given_name,dob,nationality,sex,date_of_expiry
BULK001,ALPHA,ADAM,1992-03-10,Australian,Male,2028-03-10
BULK002,BETA,BARBARA,1988-07-25,British,Female,2029-07-25
BULK003,GAMMA,GEORGE,1995-11-05,Canadian,Male,2027-11-05`;
