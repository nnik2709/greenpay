# BSP Test Card Investigation Summary

## Date: January 5, 2026

## Executive Summary

Investigated 3 BSP/DOKU test cards to determine compatibility with Mall ID 11170. Found that only 2 out of 4 provided test cards are functional with the staging environment.

## Test Cards Analyzed

| Card # | Card Number | Type | Result | Reason |
|--------|-------------|------|--------|--------|
| 0 | 4761349999000039 | DOKU Visa | ❌ FAILED | BSP Error Code 0098 |
| 1 | 5573810111111101 | DOKU MasterCard | ❌ FAILED | Invalid Luhn checksum |
| 2 | 4889750100103462 | BSP Visa Platinum | ✅ SUCCESS | Previously confirmed working |
| 3 | 4889730100994185 | BSP Visa Silver | ✅ SUCCESS | Proceeds to 3D Secure OTP |

## Detailed Findings

### Card 0: DOKU Visa (4761...0039)

**Status:** Server-side rejection

**Evidence:**
- ✅ Valid Luhn checksum (passes mathematical validation)
- ✅ Client-side validation passed
- ✅ Form submitted successfully to BSP
- ❌ BSP server rejected with error code 0098

**Server Logs:**
```
[BSP DOKU] Processing webhook event
  Transaction ID: PGKO-1767610715890-R0EPCQS1D
  Result: FAILED
  Response Code: 0098
```

**Screenshot:** `card-0039-PENDING.png` - Shows "Transaction Failed" page

**Card BIN Analysis:**
- BIN: 476134 (generic DOKU test card)
- Working BSP cards use BIN: 48897x
- Suggests BIN-level restriction for Mall ID 11170

### Card 1: DOKU MasterCard (5573...1101)

**Status:** Invalid card number

**Evidence:**
- ❌ **Invalid Luhn checksum** - fails mathematical validation
- ❌ Client-side validation failure
- ❌ Never submitted to server

**Luhn Validation Results:**
```javascript
Card Number: 5573810111111101
Luhn Valid: false

// Comparison:
DOKU Visa (4761349999000039): true ✅
BSP Visa Silver (4889730100994185): true ✅
DOKU MasterCard (5573810111111101): false ❌
```

**Screenshot:** `card-1101-PENDING.png` - Shows error "The card number is not a valid credit card number"

### Card 3: BSP Visa Silver (4889...4185)

**Status:** ✅ SUCCESS

**Evidence:**
- ✅ Valid Luhn checksum
- ✅ Passed client-side validation
- ✅ Passed server-side validation
- ✅ Proceeded to 3D Secure OTP page

**Screenshot:** `card-4185-PENDING.png` - Shows OTP page with code 431994

**Card BIN:** 488973 (BSP-specific)

## Root Causes

### 1. BSP Error Code 0098 (Card 0)

**Probable causes (in order of likelihood):**

1. **Card BIN Not Configured for Mall ID 11170** (Most Likely)
   - Mall ID appears to only accept BSP-issued cards (BIN 48897x)
   - DOKU generic test cards (BIN 476134) not whitelisted

2. **Currency Mismatch**
   - Transaction shows different currencies (IDR vs PGK)
   - May reject certain test cards for currency conversions

3. **Staging Environment Limitations**
   - DOKU generic test cards might only work with DOKU Mall IDs
   - BSP Mall IDs may require BSP-specific test cards

### 2. Invalid Luhn Checksum (Card 1)

The card number 5573810111111101 is **mathematically invalid** and fails the Luhn algorithm, which is industry-standard for credit card validation. This is likely an error in the test card data provided by DOKU/BSP.

## Technical Investigation Details

### Test Infrastructure

**Fixed Issues:**
1. Playwright test selector excluded password-type inputs (CVV field)
2. Conditional logic prevented field filling when only 5 fields found
3. Screenshot paths had double-path issue

**Solution:**
- Updated selector to: `input[type="text"], input[type="password"], input:not([type="hidden"])`
- Removed faulty conditional check
- Added comprehensive debug logging
- Properly mapped field indexes: [0]=card, [1]=expiry, [2]=CVV, [5]=phone

### Database Investigation

Checked `payment_gateway_transactions` table on production server:
- **Result:** Table is empty - transactions not being persisted
- **Implication:** PM2 logs are the only source of error details

### Server Logs Analysis

Key finding from PM2 logs:
```
[DOKU NOTIFY] WARNING: Transaction not found in database: PGKO-1767610715890-R0EPCQS1D
[BSP DOKU] Processing webhook event
  Result: FAILED
  Response Code: 0098
```

## Recommendations

### Immediate Actions

1. **Contact BSP Technical Support** with:
   - **Mall ID:** 11170
   - **Error Code:** 0098
   - **Transaction ID:** PGKO-1767610715890-R0EPCQS1D
   - **Question:** "What does response code 0098 mean, and which test card BINs are authorized for our staging Mall ID?"

2. **Request Valid Test Cards**
   - Card 1 (MasterCard 5573810111111101) has invalid Luhn checksum
   - Request corrected MasterCard test credentials from BSP

3. **Verify Mall ID Configuration**
   - Confirm which card BINs are whitelisted for Mall ID 11170
   - Request BSP to whitelist DOKU test cards (BIN 476134) if needed

### Documentation Updates

1. Update test card list to indicate only BSP Visa cards (BIN 48897x) work
2. Document error code 0098 once BSP provides clarification
3. Add Luhn validation check to test suite

## Files & Artifacts

### Test Results
- `/tests/bsp-payment/results/test-cards-fixed.log` - Full test execution log
- `/test-screenshots/card-test-results/` - Payment form screenshots

### Investigation Scripts
- `/tests/bsp-payment/investigation/luhn_check.js` - Card validation script
- `/tests/bsp-payment/investigation/investigate-bsp-logs.sh` - PM2 log queries
- `/tests/bsp-payment/investigation/sql/` - Database investigation queries

### Documentation
- `/tests/bsp-payment/documentation/BSP_IPG_INTEGRATION_GUIDE.md`
- `/tests/bsp-payment/documentation/BSP_TESTING_REQUEST_EMAIL.md`
- `/tests/bsp-payment/documentation/BSP_Compliance_Audit_Report.docx`

## Conclusion

**Working Test Cards for Mall ID 11170:**
- ✅ BSP Visa Platinum (4889750100103462)
- ✅ BSP Visa Silver (4889730100994185)

**Non-Working Test Cards:**
- ❌ DOKU Visa (4761349999000039) - Error Code 0098
- ❌ DOKU MasterCard (5573810111111101) - Invalid card number

**Next Steps:**
Contact BSP support to clarify error code 0098 and obtain valid test cards for comprehensive testing.

---

**Investigation conducted by:** Claude Code
**Date:** January 5, 2026
**Environment:** Staging (Mall ID 11170)
