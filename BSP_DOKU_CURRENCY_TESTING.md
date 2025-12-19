# BSP DOKU Currency Testing Guide

**Date:** December 19, 2024
**Purpose:** Diagnose DOKU payment rejection by testing with different currencies

---

## Problem Statement

After implementing the BSP DOKU payment gateway integration, all technical aspects are working correctly:
- ✅ Form parameters generated correctly
- ✅ WORDS signature calculated properly
- ✅ POST form submission to DOKU working
- ✅ All required DOKU parameters present

However, DOKU continues to reject payments with:
> "We are sorry that we could not process your request. Please try again or contact the merchant. Thank you."

---

## Root Cause Analysis

The rejection could be caused by:

1. **Merchant Credentials Not Activated**
   - Mall ID 11170 may not be activated on DOKU staging environment
   - Shared key may be incorrect or changed
   - BSP may need to activate the test credentials

2. **Currency Not Supported in Test Mode**
   - PGK (Papua New Guinea Kina, code 598) may not be available in DOKU test environment
   - DOKU is an Indonesian payment gateway
   - Test environment may only support IDR (Indonesian Rupiah, code 360)

---

## Testing Strategy

To isolate the issue, test with IDR currency (360) instead of PGK (598):

### Scenario 1: Both IDR and PGK Fail
**Conclusion:** Merchant credentials (Mall ID 11170) need activation by BSP
**Action:** Contact BSP Digital Testing Team to activate test credentials

### Scenario 2: IDR Works, PGK Fails
**Conclusion:** PGK currency not supported in DOKU test environment
**Action:** Request BSP to enable PGK in test environment, or test in production only

---

## Implementation

### Code Changes

**File:** `backend/services/payment-gateways/BSPGateway.js` (line 236)

```javascript
// BEFORE (hardcoded):
const currencyCode = '598'; // PGK only

// AFTER (configurable):
const currencyCode = process.env.BSP_DOKU_TEST_CURRENCY || '598';
```

**File:** `.env.example` (lines 53-56)

```bash
# Currency Testing (ISO 3166 numeric codes):
# BSP_DOKU_TEST_CURRENCY=360  # IDR (Indonesian Rupiah) - for testing DOKU integration
# BSP_DOKU_TEST_CURRENCY=598  # PGK (Papua New Guinea Kina) - production default
# Default: 598 (PGK) if not specified
```

---

## Testing Procedure

### Option 1: Automated Test Script

Run the provided test script:

```bash
cd /Users/nikolay/github/greenpay
./test-bsp-doku-idr.sh
```

The script will:
1. Backup current `.env` file
2. Add `BSP_DOKU_TEST_CURRENCY=360` to server `.env`
3. Restart backend service
4. Create test payment with IDR currency
5. Display form parameters for verification
6. Provide next steps based on results

### Option 2: Manual Testing

**Step 1: Update Environment Variable**

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
```

Add line:
```bash
BSP_DOKU_TEST_CURRENCY=360
```

**Step 2: Restart Service**

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50 | grep "BSP DOKU"
```

**Step 3: Test Payment**

Visit: https://greenpay.eywademo.cloud/buy-online

1. Enter quantity and customer details
2. Click "Proceed to Payment"
3. Observe DOKU response

**Step 4: Check Currency in Form**

```bash
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "TEST123456",
      "surname": "TESTUSER",
      "givenName": "TEST",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {"answer": 5, "expected": 5, "timeSpent": 10}
  }' | jq '.data.metadata.formParams.CURRENCY'
```

Expected output: `"360"`

---

## WORDS Signature Differences

The WORDS signature changes based on currency:

### IDR (360) - Default Currency
```javascript
wordsString = `${amount}${mallId}${sharedKey}${transactionId}`;
```

Example:
```
50.0011170ywSd48uOfypNPGKO-1766154753691-LP5E7H3UY
```

### Non-IDR Currencies (e.g., PGK 598)
```javascript
wordsString = `${amount}${mallId}${sharedKey}${transactionId}${currency}`;
```

Example:
```
50.0011170ywSd48uOfypNPGKO-1766154753691-LP5E7H3UY598
```

**Note:** The BSPGateway implementation handles both correctly per DOKU API specification v1.29.

---

## Expected Results

### Test with IDR (360)

**Form Parameters:**
```json
{
  "CURRENCY": "360",
  "PURCHASECURRENCY": "360",
  "AMOUNT": "50.00",
  "MALLID": "11170",
  "WORDS": "...", // Different signature
  "TRANSIDMERCHANT": "PGKO-..."
}
```

**If Successful:**
- DOKU accepts payment
- Redirects to payment page successfully
- Customer can enter card details

**If Failed:**
- Same rejection message as PGK
- Indicates merchant credentials need activation

### Test with PGK (598) - Original

**Form Parameters:**
```json
{
  "CURRENCY": "598",
  "PURCHASECURRENCY": "598",
  "AMOUNT": "50.00",
  "MALLID": "11170",
  "WORDS": "...", // Different signature
  "TRANSIDMERCHANT": "PGKO-..."
}
```

---

## Restoration

### Restore PGK Currency

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
sed -i 's/^BSP_DOKU_TEST_CURRENCY=.*/BSP_DOKU_TEST_CURRENCY=598/' .env
pm2 restart greenpay-api
```

### Restore Original Environment

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cp .env.backup-before-idr-test .env
pm2 restart greenpay-api
```

### Remove Test Variable (Production)

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
sed -i '/^BSP_DOKU_TEST_CURRENCY=/d' .env
pm2 restart greenpay-api
```

---

## Contact BSP

If testing confirms the issue, contact BSP Digital Testing Team:

**Email:** servicebsp@bsp.com.pg
**Phone:** +675 3201212
**Reference:** Climate Change Dev Authority - GreenPay Integration
**Mall ID:** 11170 (test)

### Scenario 1: Both Currencies Fail

**Subject:** Test Merchant Credentials Activation Required

**Message:**
```
Dear BSP Digital Testing Team,

We have completed the technical implementation of the DOKU payment gateway integration for GreenPay (Climate Change Dev Authority).

We are experiencing payment rejections with the test credentials:
- Mall ID: 11170
- Shared Key: ywSd48uOfypN

We have tested with both IDR (360) and PGK (598) currencies, and both are being rejected by DOKU with the error:
"We are sorry that we could not process your request."

All technical parameters are correct:
- WORDS signature generation verified
- Form parameters complete and correct
- POST submission working

Could you please verify that the test credentials (Mall ID 11170) are activated on the DOKU staging environment?

Integration URLs:
- Test Website: https://greenpay.eywademo.cloud/buy-online
- Notify Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
- Redirect Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect

Thank you,
GreenPay Development Team
```

### Scenario 2: IDR Works, PGK Fails

**Subject:** PGK Currency Support Required in Test Environment

**Message:**
```
Dear BSP Digital Testing Team,

We have completed the technical implementation of the DOKU payment gateway integration for GreenPay.

Our testing shows:
✅ IDR (360) currency: Accepted by DOKU
❌ PGK (598) currency: Rejected by DOKU

Since our production system requires PGK (Papua New Guinea Kina), could you please:
1. Enable PGK currency (code 598) in the DOKU test environment, OR
2. Confirm we should proceed directly to production testing with PGK

Test credentials: Mall ID 11170

Integration URLs:
- Test Website: https://greenpay.eywademo.cloud/buy-online
- Notify Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
- Redirect Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect

Thank you,
GreenPay Development Team
```

---

## Currency Codes Reference

| Currency | Code | Country | Notes |
|----------|------|---------|-------|
| PGK | 598 | Papua New Guinea | Production requirement |
| IDR | 360 | Indonesia | DOKU default, testing only |
| USD | 840 | United States | Common alternative |
| AUD | 036 | Australia | Regional currency |

**Source:** ISO 3166 Numeric Currency Codes

---

## Files Modified

1. **backend/services/payment-gateways/BSPGateway.js**
   - Line 236: Added `BSP_DOKU_TEST_CURRENCY` environment variable support
   - Defaults to 598 (PGK) if not specified

2. **.env.example**
   - Lines 53-56: Documented currency testing options

3. **test-bsp-doku-idr.sh** (NEW)
   - Automated testing script for IDR currency

4. **BSP_DOKU_DEPLOYMENT_READY.md**
   - Added currency testing section

5. **BSP_DOKU_CURRENCY_TESTING.md** (THIS FILE)
   - Complete testing guide

---

## Deployment

To deploy these changes:

```bash
# Local development
cd /Users/nikolay/github/greenpay
git add backend/services/payment-gateways/BSPGateway.js
git add .env.example
git add test-bsp-doku-idr.sh
git add BSP_DOKU_DEPLOYMENT_READY.md
git add BSP_DOKU_CURRENCY_TESTING.md
git commit -m "Add BSP DOKU currency testing capability for diagnosing payment rejections"
git push

# Production server
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git pull
cd backend
pm2 restart greenpay-api
```

---

## Conclusion

This currency testing capability allows us to:
1. Diagnose whether DOKU rejection is due to credentials or currency support
2. Test the integration with DOKU's native currency (IDR)
3. Provide BSP with concrete evidence of the issue
4. Determine the correct path forward for BSP testing

**Next Step:** Run `./test-bsp-doku-idr.sh` to test with IDR currency.

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
**Status:** Ready for Testing
