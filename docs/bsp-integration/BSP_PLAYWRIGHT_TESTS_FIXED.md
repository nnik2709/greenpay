# BSP DOKU Playwright Tests - Fixed and Working

## Issues Fixed

### 1. ✅ Authentication Setup Errors
**Problem:** Global Playwright config required authentication setup files that were failing
**Solution:** Created separate `playwright.config.bsp.ts` for BSP tests without auth dependencies

### 2. ✅ Form Field Selectors
**Problem:** Tests used incorrect field selectors (name attributes)
**Solution:** Updated to use ID selectors matching actual BuyOnline.jsx form:
- `#passportNumber`
- `#surname`
- `#givenName`
- `#dateOfBirth`
- `#email`
- `#verification`

### 3. ✅ Anti-Bot Verification
**Problem:** Math verification question not being solved
**Solution:** Added verification solver that:
- Finds text "Please solve: What is X + Y?"
- Extracts numbers and calculates answer
- Fills verification input

### 4. ✅ "Slow Down" Check
**Problem:** Form submitted too fast, triggering bot detection
**Solution:** Added human-like delays:
- 500ms between each field
- 3 second wait before clicking submit button

### 5. ✅ BSP DOKU Form Fields
**Problem:** BSP payment form fields couldn't be found by placeholder text
**Solution:** Used position-based selectors:
- Get all visible inputs
- Index 0 = Card Number
- Index 1 = Expiry Date
- Index 2 = CVV
- Index 3 = Name On Card
- Index 4 = Phone

### 6. ✅ Phone Number Field
**Problem:** Phone field initially being skipped, then filled into wrong field (Name)
**Solution:** Correctly identified phone as 5th input field (index 4)

### 7. ✅ Payment Processing Timeout
**Problem:** BSP processing takes time, causing navigation timeouts
**Solution:** Increased navigation timeout to 90 seconds for BSP processing page

## Test Files Updated

1. **`playwright.config.bsp.ts`** - New config file for BSP tests only
2. **`tests/bsp-payment/test-cards.config.ts`** - All 4 BSP test cards configured
3. **`tests/bsp-payment/bsp-payment-flow.spec.ts`** - Complete E2E payment flow test
4. **`tests/bsp-payment/run-tests.sh`** - Updated to use BSP config

## Current Test Flow

The test now successfully:

1. ✅ Navigates to /buy-online
2. ✅ Fills passport details with delays
3. ✅ Fills email address
4. ✅ Solves math verification (anti-bot)
5. ✅ Waits 3 seconds (anti-bot timing)
6. ✅ Clicks "Continue to Payment"
7. ✅ Redirects to BSP DOKU staging page
8. ✅ Fills card number: 4761349999000039
9. ✅ Fills expiry date: 12/31
10. ✅ Fills CVV: 998
11. ✅ Fills Name On Card: Customer
12. ✅ Fills Phone: 71234567
13. ⏳ Clicks "Pay" button
14. ⏳ BSP processes payment
15. ⏳ Redirects back to success page
16. ⏳ Verifies voucher appears

## Running Tests

### Quick Start
```bash
npx playwright test --config=playwright.config.bsp.ts tests/bsp-payment/bsp-payment-flow.spec.ts -g "1.1" --headed
```

### Interactive Menu
```bash
./tests/bsp-payment/run-tests.sh
```

## Test Cards Configured

1. **4761349999000039** - CVV: 998, Exp: 12/31
2. **557381011111101** - CVV: 123, Exp: 01/28
3. **BSP Visa Platinum 4889750100103462** - CVV: 921, Exp: 04/27
4. **BSP Visa Silver 4889730100994185** - CVV: 061, Exp: 04/27

## Next Steps

1. **Get OTP test code from BSP** - Fill into `TEST_CONFIG.otp.testOtp`
2. **Complete final test run** - Verify full payment flow end-to-end
3. **Check backend logs** - Confirm webhook creates voucher
4. **Verify voucher appears** - Success page shows voucher within 3 seconds

## Known Limitations

- OTP/3D Secure code not yet configured (waiting for BSP)
- Only testing with Card #1 so far (other 3 cards ready)
- Database verification tests not yet run
- Need to verify actual payment completion and voucher creation

## Files Modified

- `playwright.config.bsp.ts` (NEW)
- `tests/bsp-payment/test-cards.config.ts` (UPDATED - all 4 cards)
- `tests/bsp-payment/bsp-payment-flow.spec.ts` (FIXED - all selectors)
- `tests/bsp-payment/run-tests.sh` (UPDATED - uses BSP config)
- `BSP_TESTS_READY.md` (UPDATED)

---

**Status:** Tests running successfully through BSP payment form ✅
**Next:** Wait for BSP to process and verify complete payment flow
