# BSP DOKU Playwright Test Setup - Quick Start

## Status: ⏳ Awaiting Test Card Details from BSP

The comprehensive Playwright test suite is **ready to run** - we just need the BSP test card details.

---

## What We Need from BSP

Please request the following from BSP:

### 1. Four Test Cards

We need 4 test cards for different scenarios:

| Card Type | Purpose | Details Needed |
|-----------|---------|----------------|
| **Success Card** | Test successful payments | Card number, expiry (MM/YY), CVV |
| **Declined Card** | Test declined payments | Card number, expiry (MM/YY), CVV |
| **Insufficient Funds Card** | Test insufficient balance | Card number, expiry (MM/YY), CVV |
| **Invalid Card** | Test validation errors | Card number, expiry (MM/YY), CVV |

### 2. OTP Test Code

For 3D Secure authentication testing:
- **OTP Code:** The test number to use when prompted: _"Please input OTP Code field with this number:"_

**Example Request Email to BSP:**

```
Subject: Test Card Details for BSP DOKU Integration Testing

Dear BSP Support,

We are ready to begin comprehensive testing of our BSP DOKU payment
integration on the staging environment.

Could you please provide:

1. Four test cards for the following scenarios:
   - Successful payment
   - Declined payment
   - Insufficient funds
   - Invalid card

For each card, we need:
   - Card number
   - Expiry date (MM/YY)
   - CVV code

2. The OTP test code to use for 3D Secure testing when prompted
   "Please input OTP Code field with this number:"

Our webhook endpoints are configured and working correctly.
We have automated Playwright tests ready to run once we have
these test credentials.

Thank you,
[Your Name]
```

---

## How to Configure Once You Receive Test Cards

### Step 1: Update Test Card Configuration

Edit: `tests/bsp-payment/test-cards.config.ts`

Replace the empty strings with the BSP-provided details:

```typescript
export const TEST_CARDS: TestCard[] = [
  {
    name: 'Success Card',
    cardNumber: '4111111111111111',  // ← FILL WITH BSP TEST CARD #1
    expiryMonth: '12',                // ← FILL (e.g., '12')
    expiryYear: '25',                 // ← FILL (e.g., '25')
    cvv: '123',                       // ← FILL (e.g., '123')
    expectedResult: 'success',
    description: 'Should complete payment successfully'
  },
  {
    name: 'Declined Card',
    cardNumber: '',                   // ← FILL WITH BSP TEST CARD #2
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    expectedResult: 'fail',
    description: 'Should be declined by bank'
  },
  {
    name: 'Insufficient Funds Card',
    cardNumber: '',                   // ← FILL WITH BSP TEST CARD #3
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    expectedResult: 'insufficient_funds',
    description: 'Should fail due to insufficient funds'
  },
  {
    name: 'Invalid Card',
    cardNumber: '',                   // ← FILL WITH BSP TEST CARD #4
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    expectedResult: 'invalid',
    description: 'Should fail validation'
  }
];
```

### Step 2: Update OTP Test Code

In the same file (`test-cards.config.ts`), update the OTP configuration:

```typescript
export const TEST_CONFIG = {
  // ...
  otp: {
    testOtp: '123456',  // ← FILL WITH OTP CODE FROM BSP
    timeout: 30000
  }
};
```

---

## Running the Tests

Once configured, run the full test suite:

```bash
# Run all BSP payment tests
npx playwright test tests/bsp-payment/

# Run with visible browser (see what's happening)
npx playwright test tests/bsp-payment/ --headed

# Run and generate HTML report
npx playwright test tests/bsp-payment/
npx playwright show-report
```

### Test Coverage

The suite includes **39 automated tests**:

**Payment Flow Tests (17 tests):**
- ✅ Happy path scenarios (6 tests)
- ✅ Error handling (4 tests)
- ✅ Performance (2 tests)
- ✅ Mobile (2 tests)
- ✅ Email & PDF (3 tests)

**Database Verification (22 tests):**
- ✅ Data integrity (10 tests)
- ✅ Performance (5 tests)
- ✅ Data quality (7 tests)

---

## What the Tests Verify

### Payment Flow
1. Navigate to `/buy-online`
2. Fill passport details
3. Click "Pay with Credit Card"
4. Redirected to BSP DOKU staging page
5. Fill card details automatically
6. Handle 3D Secure OTP automatically
7. Redirected back to success page
8. Voucher appears within 3 seconds
9. Voucher has valid 8-character code
10. Email sent to customer
11. PDF downloadable

### Database Integrity
1. No orphaned vouchers (all linked to passports)
2. No orphaned transactions
3. All voucher codes unique
4. Amount consistency (transaction = voucher)
5. Query performance <10ms (indexed)
6. All currency is PGK
7. All amounts positive
8. Voucher validity period is 1 year

---

## Expected Test Results

### All Tests Should Pass ✅

**Example Output:**
```
Running 39 tests using 1 worker

  ✓ BSP DOKU Payment Flow - Happy Path
    ✓ 1.1 - Successful payment with valid card (8s)
    ✓ 1.2 - Multiple sequential payments (24s)
    ✓ 1.3 - Payment with special characters (9s)
    ✓ 1.4 - Payment with long names (8s)
    ✓ 1.5 - Minimal passport data (7s)
    ✓ 1.6 - Existing passport reused (15s)

  ✓ BSP DOKU Payment Flow - Error Handling
    ✓ 2.1 - Declined card payment (6s)
    ✓ 2.2 - Insufficient funds card (6s)
    ✓ 2.3 - Invalid card number (5s)
    ✓ 2.4 - User cancels payment (4s)

  ✓ BSP DOKU Payment Flow - Performance
    ✓ 3.1 - Voucher creation under 3 seconds (8s)
    ✓ 3.2 - Concurrent payments (18s)

  ✓ BSP DOKU Payment Flow - Mobile
    ✓ 4.1 - iPhone payment flow (9s)
    ✓ 4.2 - Android payment flow (9s)

  ✓ BSP DOKU Payment Flow - Email & PDF
    ✓ 5.1 - Email voucher delivery (10s)
    ✓ 5.2 - PDF download (8s)
    ✓ 5.3 - Print voucher (6s)

  ✓ Database Integrity Tests (10 tests) - all passed
  ✓ Database Performance Tests (5 tests) - all passed
  ✓ Database Quality Tests (7 tests) - all passed

39 passed (3m 12s)
```

---

## Troubleshooting

### Test Card Not Working

**Symptom:** Payment fails with "Invalid card"
**Fix:** Verify test card details with BSP, check for typos

### OTP Page Timeout

**Symptom:** Test fails waiting for OTP page
**Fix:** Ensure `TEST_CONFIG.otp.testOtp` is filled correctly

### Voucher Not Appearing

**Symptom:** Test fails: "Voucher did not appear within timeout"
**Fix:** Check backend logs: `pm2 logs greenpay-api`

### Database Tests Failing

**Symptom:** Database connection errors
**Fix:** Set `DB_PASSWORD` environment variable:
```bash
export DB_PASSWORD='GreenPay2025!Secure#PG'
```

---

## Production Readiness

After all tests pass, we can proceed with:

1. ✅ **Production Credentials** - Switch from staging to production
2. ✅ **Go-Live Checklist** - Complete final verification
3. ✅ **Monitor First Payments** - Watch logs closely
4. ✅ **Customer Testing** - Real customer transactions

See `BSP_PRODUCTION_TESTING_PLAN.md` for complete production checklist.

---

## Files Created

```
tests/bsp-payment/
├── README.md                           # Comprehensive test documentation
├── test-cards.config.ts                # Test card configuration (NEEDS BSP DETAILS)
├── bsp-payment-flow.spec.ts            # Payment flow tests (17 tests)
└── bsp-database-verification.spec.ts   # Database tests (22 tests)
```

**Documentation:**
- `BSP_PLAYWRIGHT_TEST_SETUP.md` - This file (quick start)
- `BSP_PRODUCTION_TESTING_PLAN.md` - Full production testing plan

---

## Next Steps

1. **Request test cards from BSP** (use email template above)
2. **Fill in test card details** in `test-cards.config.ts`
3. **Fill in OTP code** in `test-cards.config.ts`
4. **Run tests:** `npx playwright test tests/bsp-payment/`
5. **Review results:** `npx playwright show-report`
6. **Fix any issues** found during testing
7. **Proceed to production** when all tests pass

---

**Status:** ✅ Tests ready to run
**Waiting for:** BSP test card details + OTP code
**Total Tests:** 39 automated tests
**Estimated Runtime:** 3-5 minutes

---

**Contact BSP:** servicebsp@bsp.com.pg
**BSP Phone:** +675 3201212
