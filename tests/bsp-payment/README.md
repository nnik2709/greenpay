# BSP DOKU Payment Integration Tests

Comprehensive Playwright test suite for BSP DOKU payment gateway integration.

## Overview

This test suite covers:
- ✅ **Payment Flow Tests** (17 tests) - E2E payment scenarios
- ✅ **Database Verification Tests** (22 tests) - Data integrity and performance
- ✅ **3D Secure/OTP Handling** - Automated OTP code entry
- ✅ **Mobile Testing** - iOS and Android payment flows
- ✅ **Error Handling** - Declined cards, insufficient funds, invalid cards
- ✅ **Performance Testing** - Voucher creation speed, concurrent payments

## Prerequisites

1. **BSP Test Cards** - 4 test cards from BSP (fill into `test-cards.config.ts`)
2. **OTP Test Code** - OTP number provided by BSP for 3D Secure testing
3. **Database Access** - PostgreSQL credentials for database verification tests
4. **Test Environment** - Staging environment with BSP webhooks enabled

## Setup Instructions

### 1. Fill in Test Card Details

Edit `tests/bsp-payment/test-cards.config.ts` and fill in the BSP test cards:

```typescript
export const TEST_CARDS: TestCard[] = [
  {
    name: 'Success Card',
    cardNumber: '4111111111111111', // ← Fill with BSP test card #1
    expiryMonth: '12',               // ← Fill with expiry month
    expiryYear: '25',                // ← Fill with expiry year
    cvv: '123',                      // ← Fill with CVV
    expectedResult: 'success',
    description: 'Should complete payment successfully'
  },
  // ... fill other 3 cards
];
```

### 2. Configure OTP Test Code

When BSP provides the OTP test number, add it to `TEST_CONFIG`:

```typescript
export const TEST_CONFIG = {
  // ...
  otp: {
    testOtp: '123456', // ← Fill with OTP provided by BSP
    timeout: 30000
  }
};
```

The OTP page shows text: **"Please input OTP Code field with this number:"**
The test will automatically:
1. Detect the OTP page
2. Enter the test OTP code
3. Submit the form

### 3. Configure Database Credentials

Set database password for verification tests:

```bash
export DB_PASSWORD='your-database-password'
```

Or set in `.env`:
```
DB_PASSWORD=GreenPay2025!Secure#PG
```

### 4. Install Dependencies

```bash
npm install
npx playwright install chromium
```

## Running Tests

### Run All Payment Tests

```bash
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts
```

### Run Database Verification Tests

```bash
npx playwright test tests/bsp-payment/bsp-database-verification.spec.ts
```

### Run All BSP Tests

```bash
npx playwright test tests/bsp-payment/
```

### Run Specific Test Suite

```bash
# Happy path only
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "Happy Path"

# Error handling only
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "Error Handling"

# Performance tests only
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "Performance"

# Mobile tests only
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "Mobile"
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test tests/bsp-payment/ --headed
```

### Debug Mode (Step Through Tests)

```bash
npx playwright test tests/bsp-payment/ --debug
```

## Test Structure

### Payment Flow Tests (`bsp-payment-flow.spec.ts`)

#### 1. Happy Path Tests (6 tests)
- **1.1** - Successful payment with valid card
- **1.2** - Multiple sequential payments (3 payments)
- **1.3** - Special characters in name (O'Brien, José)
- **1.4** - Long names (50+ characters)
- **1.5** - Minimal passport data (optional fields empty)
- **1.6** - Existing passport reused (no duplicate)

#### 2. Error Handling Tests (4 tests)
- **2.1** - Declined card payment
- **2.2** - Insufficient funds card
- **2.3** - Invalid card number
- **2.4** - User cancels payment

#### 3. Performance Tests (2 tests)
- **3.1** - Voucher creation time under 3 seconds
- **3.2** - Concurrent payments (3 simultaneous)

#### 4. Mobile Tests (2 tests)
- **4.1** - iPhone payment flow
- **4.2** - Android payment flow

#### 5. Email & PDF Tests (3 tests)
- **5.1** - Email voucher delivery
- **5.2** - PDF download
- **5.3** - Print voucher

### Database Verification Tests (`bsp-database-verification.spec.ts`)

#### 1. Database Integrity (10 tests)
- **DB.1** - No orphaned vouchers
- **DB.2** - No orphaned sessions
- **DB.3** - No orphaned transactions
- **DB.4** - Unique voucher codes
- **DB.5** - Unique session IDs
- **DB.6** - Amount consistency
- **DB.7** - Valid date ranges
- **DB.8** - Voucher validity period (1 year)
- **DB.9** - Payment status distribution
- **DB.10** - Recent transactions processed

#### 2. Database Performance (5 tests)
- **PERF.1** - Voucher lookup (indexed, <10ms)
- **PERF.2** - Passport lookup (indexed, <10ms)
- **PERF.3** - Transaction lookup (indexed, <10ms)
- **PERF.4** - Database connection count (<20)
- **PERF.5** - Table sizes (<100MB)

#### 3. Data Quality (7 tests)
- **DQ.1** - Valid voucher status
- **DQ.2** - Valid gateway names
- **DQ.3** - Voucher code format (8-char alphanumeric)
- **DQ.4** - Completed transactions have timestamp
- **DQ.5** - Valid email formats
- **DQ.6** - All amounts positive
- **DQ.7** - Currency is PGK

## 3D Secure / OTP Flow

The BSP DOKU payment gateway uses 3D Secure authentication with OTP.

**Test Flow:**
1. Fill card details on BSP page
2. Click "Pay" button
3. **OTP page appears** with text: "Please input OTP Code field with this number:"
4. Test automatically enters OTP from `TEST_CONFIG.otp.testOtp`
5. Test submits OTP
6. Payment completes and redirects to success page

**Important:** The OTP test number is provided by BSP specifically for testing. Do not use real OTP codes.

## Test Artifacts

Tests generate screenshots and downloads in:

```
test-screenshots/       # Screenshots of successful payments
test-downloads/         # Downloaded PDF vouchers
```

## Viewing Test Results

### HTML Report

```bash
npx playwright show-report
```

Opens interactive HTML report with:
- Test execution timeline
- Screenshots and videos
- Error traces
- Performance metrics

### JUnit XML Report

Results are saved to `reports/junit.xml` for CI/CD integration.

## Expected Results

### Success Criteria

**Payment Flow Tests:**
- ✅ Voucher appears within 3 seconds
- ✅ Voucher code is 8-character alphanumeric
- ✅ All payments create unique voucher codes
- ✅ Concurrent payments handled correctly
- ✅ Mobile flows work on iOS and Android

**Database Tests:**
- ✅ No orphaned records (vouchers, sessions, transactions)
- ✅ All voucher codes unique
- ✅ Query performance <10ms with indexes
- ✅ Database connections <20
- ✅ All amounts positive, currency PGK

### Common Issues

#### Issue: OTP timeout
**Cause:** OTP test code not configured
**Fix:** Set `TEST_CONFIG.otp.testOtp` in `test-cards.config.ts`

#### Issue: Database connection failed
**Cause:** Database password not set
**Fix:** Set `DB_PASSWORD` environment variable

#### Issue: Test cards not working
**Cause:** Invalid test card details
**Fix:** Verify test cards with BSP, ensure correct format

#### Issue: Webhook not creating voucher
**Cause:** Backend not deployed or crashed
**Fix:** Check `pm2 logs greenpay-api` for errors

## Integration with Production Testing Plan

These Playwright tests cover the following sections from `BSP_PRODUCTION_TESTING_PLAN.md`:

- ✅ **Phase 1: Functional Testing** (Tests 1-10)
- ✅ **Phase 3: Performance Testing** (Tests 17-19)
- ✅ **Phase 4: Reliability Testing** (Tests 24-25)
- ✅ **Phase 5: PNG-Specific Testing** (Test 28 - Mobile)
- ✅ **Phase 7: Integration Testing** (Test 38 - Database consistency)

**Manual Testing Still Required:**
- Security testing (webhook signature validation)
- BSP coordination tests
- Network resilience tests
- Email delivery verification (check inbox)

## Troubleshooting

### Enable Playwright Trace

```bash
npx playwright test tests/bsp-payment/ --trace on
```

View trace:
```bash
npx playwright show-trace trace.zip
```

### Enable Verbose Logging

```bash
DEBUG=pw:api npx playwright test tests/bsp-payment/
```

### Take Screenshot on Failure

Tests automatically take screenshots on failure. Find them in:
```
test-results/
```

## CI/CD Integration

Add to GitHub Actions / Jenkins:

```yaml
- name: Run BSP Payment Tests
  env:
    PLAYWRIGHT_BASE_URL: https://greenpay.eywademo.cloud
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  run: |
    npx playwright test tests/bsp-payment/
    npx playwright show-report
```

## Contact

For issues with:
- **Test failures**: Check `pm2 logs greenpay-api` and database
- **BSP integration**: Contact servicebsp@bsp.com.pg
- **OTP issues**: Verify OTP test code with BSP

---

**Last Updated:** 2025-12-31
**Test Coverage:** 39 tests (17 E2E + 22 database)
**Status:** ✅ Ready for BSP test card details
