
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const today = new Date();

export const corporateVouchers = [
  {
    code: 'CORP-VALID-123',
    used_at: null,
    valid_from: addDays(today, -30),
    valid_until: addDays(today, 30),
    passport_no: 'P1234567',
  },
  {
    code: 'CORP-USED-456',
    used_at: addDays(today, -5),
    valid_from: addDays(today, -60),
    valid_until: addDays(today, 60),
    passport_no: 'A9876543',
  },
  {
    code: 'CORP-EXPIRED-789',
    used_at: null,
    valid_from: addDays(today, -90),
    valid_until: addDays(today, -1),
    passport_no: 'G2468135',
  },
];

export const individualPayments = [
  {
    voucher_code: 'IND-VALID-ABC',
    used_at: null,
    created_at: addDays(today, -10),
    passport_no: 'F1357924',
  },
  {
    voucher_code: 'IND-USED-DEF',
    used_at: addDays(today, -2),
    created_at: addDays(today, -20),
    passport_no: 'P7654321',
  },
];
