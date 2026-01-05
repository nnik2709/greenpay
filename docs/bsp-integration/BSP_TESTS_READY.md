# BSP DOKU Playwright Tests - READY TO RUN ✅

## Status: Test Cards Configured

All 4 BSP test cards have been configured and the test suite is ready to run.

---

## Configured Test Cards

✅ **Card 1:** 4761349999000039 (CVV: 998, Exp: 12/31)
✅ **Card 2:** 557381011111101 (CVV: 123, Exp: 01/28)
✅ **Card 3:** BSP Visa Platinum 4889750100103462 (CVV: 921, Exp: 04/27)
✅ **Card 4:** BSP Visa Silver 4889730100994185 (CVV: 061, Exp: 04/27)

---

## ⚠️ One Item Still Needed: OTP Test Code

The tests need the **3D Secure OTP test number** that BSP provides.

When the payment page shows: _"Please input OTP Code field with this number:"_

**What to do:**
1. Ask BSP: "What OTP code should we use for testing?"
2. Fill it into `tests/bsp-payment/test-cards.config.ts`:

```typescript
export const TEST_CONFIG = {
  // ...
  otp: {
    testOtp: '123456',  // ← PUT BSP OTP TEST CODE HERE
    timeout: 30000
  }
};
```

**Note:** The tests will still work if OTP is not required for test cards, but if BSP prompts for OTP and it's not configured, tests will timeout.

---

## Quick Start - Run Tests Now

### Option 1: Interactive Menu (Recommended)

```bash
./tests/bsp-payment/run-tests.sh
```

This shows a menu:
```
1) All BSP Tests (39 tests, ~3-5 min)
2) Payment Flow Tests Only (17 tests, ~2-3 min)
3) Database Verification Tests Only (22 tests, ~1 min)
4) Happy Path Tests Only (6 tests, ~1 min)
5) Single Test - Success Payment (1 test, ~10 sec)
6) Run with Browser Visible (headed mode)
7) Run in Debug Mode (step through tests)
```

### Option 2: Run All Tests Directly

```bash
npx playwright test tests/bsp-payment/
```

### Option 3: Run Single Test First

Start with just one payment to verify everything works:

```bash
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "1.1"
```

This will:
1. Navigate to `/buy-online`
2. Fill passport details
3. Click "Pay with Credit Card"
4. Fill card details on BSP page
5. Handle OTP (if required)
6. Verify voucher appears within 3 seconds

---

## What to Expect

### Successful Test Run

```
Running 17 tests using 1 worker

  ✓ BSP DOKU Payment Flow - Happy Path
    ✓ 1.1 - Successful payment with valid card (8s)
    ✓ Voucher appeared after 1847ms
    ✓ 1.2 - Multiple sequential payments (24s)
    ✓ 1.3 - Payment with special characters (9s)
    ✓ 1.4 - Payment with long names (8s)
    ✓ 1.5 - Minimal passport data (7s)
    ✓ 1.6 - Existing passport reused (15s)

  ✓ BSP DOKU Payment Flow - Error Handling
    ... (if you have declined/error test cards)

  ✓ BSP DOKU Payment Flow - Performance
    ✓ 3.1 - Voucher creation under 3 seconds (8s)
    ✓ 3.2 - Concurrent payments (18s)

  ✓ BSP DOKU Payment Flow - Mobile
    ✓ 4.1 - iPhone payment flow (9s)
    ✓ 4.2 - Android payment flow (9s)

17 passed (2m 8s)
```

### View HTML Report

```bash
npx playwright show-report
```

Opens interactive report with:
- Screenshots of each step
- Performance timings
- Error traces (if any)
- Network requests

---

## Test Coverage

### Payment Flow Tests (17 tests)

**Happy Path (6 tests):**
- ✅ Successful payment with valid card
- ✅ Multiple sequential payments (no duplicate vouchers)
- ✅ Special characters in names (O'Brien, José)
- ✅ Long names (50+ chars)
- ✅ Minimal data (optional fields empty)
- ✅ Existing passport reused

**Error Handling (4 tests):**
- 🔄 Declined card (if you have declined test card)
- 🔄 Insufficient funds (if you have this test card)
- 🔄 Invalid card (if you have this test card)
- ✅ User cancels payment

**Performance (2 tests):**
- ✅ Voucher creation under 3 seconds
- ✅ Concurrent payments (3 simultaneous)

**Mobile (2 tests):**
- ✅ iPhone payment flow
- ✅ Android payment flow

**Email & PDF (3 tests):**
- ✅ Email voucher delivery
- ✅ PDF download
- ✅ Print voucher

### Database Tests (22 tests)

**Integrity (10 tests):**
- ✅ No orphaned vouchers
- ✅ No orphaned transactions
- ✅ Unique voucher codes
- ✅ Amount consistency
- ✅ Valid date ranges
- ✅ Payment status distribution
- ✅ Recent transactions processed

**Performance (5 tests):**
- ✅ Voucher lookup <10ms (indexed)
- ✅ Passport lookup <10ms (indexed)
- ✅ Transaction lookup <10ms (indexed)
- ✅ Database connections <20
- ✅ Table sizes reasonable

**Data Quality (7 tests):**
- ✅ Valid voucher status
- ✅ Valid gateway names
- ✅ Voucher code format (8-char alphanumeric)
- ✅ Completed transactions have timestamp
- ✅ Valid email formats
- ✅ Positive amounts
- ✅ Currency is PGK

---

## Troubleshooting

### Test fails: "Voucher did not appear"

**Check backend logs:**
```bash
pm2 logs greenpay-api --lines 100
```

Look for:
```
[DOKU NOTIFY] Webhook received
[DOKU NOTIFY] Signature verified
[DOKU VOUCHER] Created voucher: ABC12345
```

### Test fails: "OTP timeout"

1. Check if OTP is required for your test cards
2. If yes, configure `TEST_CONFIG.otp.testOtp` in test config
3. If no, tests should skip OTP step automatically

### Test fails: "Database connection"

Set database password:
```bash
export DB_PASSWORD='GreenPay2025!Secure#PG'
```

### Card details rejected by BSP

1. Verify card numbers are correct (no typos)
2. Verify expiry dates in MM/YY format
3. Check BSP staging environment is active
4. Contact BSP if cards don't work

---

## Monitor Backend During Tests

In a separate terminal, watch backend logs in real-time:

```bash
pm2 logs greenpay-api --lines 50
```

You should see:
```
[DOKU NOTIFY] Webhook received
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] Payment successful - creating voucher
[DOKU VOUCHER] Starting voucher creation
[DOKU VOUCHER] Generated voucher code: ABC12345
[DOKU VOUCHER] ✅ Voucher creation completed successfully
```

---

## Database Verification

After running payment tests, verify data integrity:

```bash
npx playwright test tests/bsp-payment/bsp-database-verification.spec.ts
```

This checks:
- No orphaned records
- All indexes working
- Query performance
- Data quality

---

## Next Steps After Tests Pass

1. ✅ **Review Results** - Check HTML report for any warnings
2. ✅ **Verify Emails** - Check if voucher emails arrive
3. ✅ **Check PDFs** - Open downloaded PDFs to verify formatting
4. ✅ **Database Check** - Run database verification tests
5. ✅ **Performance Review** - Ensure voucher creation <3 seconds
6. 🚀 **Production Readiness** - Move to production environment

---

## Production Deployment

After all tests pass in staging, prepare for production:

1. **Switch to Production Credentials:**
   ```bash
   # In backend .env file:
   BSP_DOKU_MODE=production
   BSP_DOKU_MALL_ID=your-production-mall-id
   BSP_DOKU_SHARED_KEY=your-production-shared-key
   BSP_DOKU_CHAIN_MERCHANT=your-production-chain-merchant
   ```

2. **Verify Webhook URLs:**
   - Confirm BSP has production webhook URLs configured
   - Test with small real payment first

3. **Monitor First Payments:**
   ```bash
   pm2 logs greenpay-api --lines 200
   ```

4. **Follow Production Testing Plan:**
   - See `BSP_PRODUCTION_TESTING_PLAN.md` for complete checklist

---

## Files Overview

```
tests/bsp-payment/
├── run-tests.sh                        # Interactive test runner ✅
├── test-cards.config.ts                # Test cards configured ✅
├── bsp-payment-flow.spec.ts            # 17 payment flow tests ✅
├── bsp-database-verification.spec.ts   # 22 database tests ✅
└── README.md                           # Full documentation ✅
```

**Documentation:**
- `BSP_TESTS_READY.md` - This file (ready to run)
- `BSP_PLAYWRIGHT_TEST_SETUP.md` - Setup guide
- `BSP_PRODUCTION_TESTING_PLAN.md` - Production checklist

---

## Run Your First Test Now!

```bash
# Start with single test (10 seconds)
npx playwright test tests/bsp-payment/bsp-payment-flow.spec.ts -g "1.1" --headed

# Or use interactive menu
./tests/bsp-payment/run-tests.sh
```

---

**Status:** ✅ Ready to run (OTP optional)
**Test Cards:** ✅ All 4 configured
**Total Tests:** 39 automated tests
**Estimated Time:** 3-5 minutes for all tests

**Questions?** Check `tests/bsp-payment/README.md` for detailed documentation.
