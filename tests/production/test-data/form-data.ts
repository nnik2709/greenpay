/**
 * GreenPay Test Data
 * Comprehensive test data for all forms and scenarios
 */

export const TEST_DATA = {

  // ===================
  // CONTACT & EMAIL
  // ===================
  email: {
    primary: 'nnik.area9@gmail.com',  // Use this for all email tests - will be manually verified
    secondary: 'test.user@example.com',
    invalid: 'not-an-email',
  },

  // ===================
  // PERSONAL INFORMATION
  // ===================
  person: {
    firstName: 'John',
    lastName: 'TestUser',
    fullName: 'John TestUser',
    middleName: 'Michael',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    nationality: 'Papua New Guinea',
    placeOfBirth: 'Port Moresby',
  },

  // ===================
  // CONTACT DETAILS
  // ===================
  contact: {
    phone: '+675 7123 4567',
    mobilePhone: '+675 7234 5678',
    workPhone: '+675 323 0111',
    address: '123 Test Street, Port Moresby',
    city: 'Port Moresby',
    state: 'National Capital District',
    postalCode: '111',
    country: 'Papua New Guinea',
  },

  // ===================
  // PASSPORT & DOCUMENTS
  // ===================
  passport: {
    // Individual Purchase Form Fields (matches IndividualPurchase.jsx)
    passportNumber: 'PNG12345678',
    surname: 'TESTUSER',
    givenName: 'JOHN MICHAEL',
    nationality: 'Papua New Guinea',
    dob: '1985-06-15',                    // Field name: dob (not dateOfBirth)
    sex: 'M',                             // Options: M, F
    dateOfExpiry: '2030-01-14',

    // Optional fields (not displayed in form but available in database)
    placeOfBirth: 'Port Moresby',
    dateOfIssue: '2020-01-15',
    placeOfIssue: 'Port Moresby',
    fileNumber: 'FILE12345',
  },

  // ===================
  // FINANCIAL DATA
  // ===================
  financial: {
    voucherValue: '50.00',
    currency: 'PGK',
    amount: '50.00',
    discountPercentage: '10',
    taxRate: '10',
  },

  // ===================
  // QUOTATIONS
  // ===================
  quotation: {
    companyName: 'Test Company Ltd',
    contactPerson: 'John TestUser',
    contactEmail: 'nnik.area9@gmail.com',
    contactPhone: '+675 7123 4567',
    numberOfPassports: '10',
    amountPerPassport: '50.00',
    discount: '10',
    validUntil: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    },
    notes: 'This is an automated test quotation created by Playwright. Please ignore or delete.',
  },

  // ===================
  // INVOICES
  // ===================
  invoice: {
    paymentTerms: 'Net 30 days',
    paymentAmount: '50.00',
    paymentMethod: 'CASH',
    paymentReference: 'TEST-' + Date.now(),
    paymentNotes: 'Automated test payment',
  },

  // ===================
  // SUPPORT TICKETS
  // ===================
  ticket: {
    subject: 'Test Support Ticket - Automated Test',
    description: 'This is an automated test ticket created by Playwright tests. Please ignore or close.',
    category: 'General Inquiry',
    priority: 'Low',
  },

  // ===================
  // COMPANY/ORGANIZATION
  // ===================
  company: {
    companyName: 'Test Company Ltd',
    contactPerson: 'John TestUser',
    email: 'nnik.area9@gmail.com',
    phone: '+675 7123 4567',
    address: '123 Test Street, Port Moresby',
  },

  // ===================
  // DATES
  // ===================
  dates: {
    today: () => new Date().toISOString().split('T')[0],
    tomorrow: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    },
    nextWeek: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    },
    nextMonth: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    },
    nextYear: () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    },
    pastDate: '2020-01-01',
  },

  // ===================
  // PAYMENT MODES
  // ===================
  paymentModes: {
    cash: 'CASH',
    card: 'CARD',
    bsp: 'BSP',
    kinaBank: 'KINA_BANK',
    bankTransfer: 'BANK_TRANSFER',
  },

  // ===================
  // COMMENTS & NOTES
  // ===================
  text: {
    shortComment: 'Test comment',
    longComment: 'This is a longer test comment created by automated testing. It contains multiple sentences to test text area fields properly.',
    description: 'Automated test description - please ignore this entry.',
    notes: 'Created by Playwright automated tests',
    reason: 'Testing purposes',
  },

  // ===================
  // SEARCH & FILTER
  // ===================
  search: {
    validQuery: 'test',
    invalidQuery: 'xyznonexistent123',
    partialMatch: 'gre',  // Should match "green"
  },

  // ===================
  // BULK UPLOAD CSV DATA
  // ===================
  bulkUpload: {
    // CSV Headers (matches BulkPassportUpload.jsx DEFAULT_FIELDS)
    requiredFields: [
      'passportNo',      // Required
      'surname',         // Required
      'givenName',       // Required
      'nationality',     // Required
      'dob',             // Required (format: YYYY-MM-DD)
      'sex',             // Required (Male/Female)
      'dateOfExpiry',    // Required (format: YYYY-MM-DD)
    ],
    optionalFields: [
      'placeOfBirth',    // Optional
      'placeOfIssue',    // Optional
      'dateOfIssue',     // Optional (format: YYYY-MM-DD)
      'fileNumber',      // Optional
      'email',           // Optional
      'phone',           // Optional
    ],

    // Sample CSV row
    sampleRow: {
      passportNo: 'PNG123456789',
      surname: 'DOE',
      givenName: 'JOHN',
      nationality: 'Papua New Guinea',
      dob: '1990-01-01',
      sex: 'Male',
      dateOfExpiry: '2030-01-01',
      placeOfBirth: 'Port Moresby',
      placeOfIssue: 'Port Moresby',
      dateOfIssue: '2020-01-01',
      fileNumber: 'FILE001',
      email: 'john.doe@example.com',
      phone: '+675 1234 5678',
    },
  },
};

/**
 * User credentials for testing
 */
export const USERS = {
  IT_Support: {
    roleName: 'IT_Support',
    username: 'support@greenpay.com',
    password: 'support123',
    description: 'Support tickets access',
  },
  Flex_Admin: {
    roleName: 'Flex_Admin',
    username: 'flexadmin@greenpay.com',
    password: 'test123',
    description: 'Full system access',
  },
  Finance_Manager: {
    roleName: 'Finance_Manager',
    username: 'finance@greenpay.com',
    password: 'test123',
    description: 'Quotations & reports',
  },
  Counter_Agent: {
    roleName: 'Counter_Agent',
    username: 'agent@greenpay.com',
    password: 'test123',
    description: 'Passport purchases & uploads',
  },
};

/**
 * Helper to generate unique test data
 */
export const generateUnique = {
  email: () => `test.${Date.now()}@example.com`,
  reference: () => `REF-${Date.now()}`,
  ticketId: () => `TKT-${Date.now()}`,
  documentNumber: () => `DOC-${Date.now()}`,
  transactionId: () => `TXN-${Date.now()}`,
  passportNumber: () => `PNG${Date.now().toString().slice(-8)}`,
  voucherCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
