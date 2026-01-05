# BSP DOKU Currency Testing Deployment

**Date:** December 19, 2024
**Purpose:** Deploy currency testing capability to diagnose DOKU payment rejection

---

## Summary

Added `BSP_DOKU_TEST_CURRENCY` environment variable to allow testing with IDR (Indonesian Rupiah, code 360) instead of PGK (Papua New Guinea Kina, code 598) to diagnose whether DOKU rejection is due to:
1. Merchant credentials not being activated, OR
2. PGK currency not being supported in DOKU test environment

---

## Files to Deploy

### 1. Backend Payment Gateway (REQUIRED)

**File:** `backend/services/payment-gateways/BSPGateway.js`

**Change:** Line 236
```javascript
// BEFORE:
const currencyCode = '598';

// AFTER:
const currencyCode = process.env.BSP_DOKU_TEST_CURRENCY || '598';
```

**Impact:** Allows currency to be configured via environment variable for testing

---

### 2. Environment Variable Documentation (RECOMMENDED)

**File:** `.env.example`

**Change:** Lines 53-56
```bash
# Currency Testing (ISO 3166 numeric codes):
# BSP_DOKU_TEST_CURRENCY=360  # IDR (Indonesian Rupiah) - for testing DOKU integration
# BSP_DOKU_TEST_CURRENCY=598  # PGK (Papua New Guinea Kina) - production default
# Default: 598 (PGK) if not specified
```

**Impact:** Documents the testing capability for future reference

---

### 3. Testing Script (RECOMMENDED)

**File:** `test-bsp-doku-idr.sh` (NEW)

**Purpose:** Automated script to:
- Backup current `.env`
- Set `BSP_DOKU_TEST_CURRENCY=360`
- Restart service
- Test payment creation
- Display results
- Provide restoration instructions

**Impact:** Makes testing easy and repeatable

---

### 4. Documentation (RECOMMENDED)

**File:** `BSP_DOKU_CURRENCY_TESTING.md` (NEW)

**Purpose:** Complete guide covering:
- Problem statement
- Root cause analysis
- Testing strategy
- Implementation details
- Testing procedures
- Expected results
- Restoration steps
- BSP contact templates

**Impact:** Provides comprehensive testing guidance

---

**File:** `BSP_DOKU_DEPLOYMENT_READY.md`

**Change:** Added "Currency Testing (Optional)" section with manual and automated testing instructions

**Impact:** Integrates currency testing into main deployment guide

---

## Deployment Steps

### Quick Deployment (Git)

```bash
# Add files for currency testing
git add backend/services/payment-gateways/BSPGateway.js
git add .env.example
git add test-bsp-doku-idr.sh
git add BSP_DOKU_CURRENCY_TESTING.md
git add BSP_DOKU_DEPLOYMENT_READY.md

# Commit
git commit -m "Add BSP DOKU currency testing capability for diagnosing payment rejections

- Added BSP_DOKU_TEST_CURRENCY environment variable support
- Defaults to 598 (PGK) if not specified
- Can be set to 360 (IDR) for testing DOKU integration
- Includes automated test script and comprehensive documentation"

# Push to GitHub
git push origin main
```

### Deploy to Server

```bash
# Connect to server
ssh root@165.22.52.100

# Navigate to application
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Pull latest changes
git pull origin main

# Restart backend (required for BSPGateway.js changes)
pm2 restart greenpay-api

# Verify
pm2 status
pm2 logs greenpay-api --lines 50 | grep "BSP DOKU"
```

---

## Testing Procedure

### Option 1: Automated Test (Recommended)

```bash
cd /Users/nikolay/github/greenpay
./test-bsp-doku-idr.sh
```

### Option 2: Manual Test

**Step 1: Set Currency to IDR**

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
echo "BSP_DOKU_TEST_CURRENCY=360" >> .env
pm2 restart greenpay-api
```

**Step 2: Test Payment**

Visit: https://greenpay.eywademo.cloud/buy-online

1. Enter quantity and customer details
2. Click "Proceed to Payment"
3. Check DOKU response

**Step 3: Check Currency in Form**

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

Expected output: `"360"` (IDR)

---

## Expected Results

### Scenario 1: Both IDR and PGK Fail

**Conclusion:** Merchant credentials (Mall ID 11170) not activated

**Action:** Contact BSP to activate test credentials
- Email: servicebsp@bsp.com.pg
- Reference: Mall ID 11170
- See `BSP_DOKU_CURRENCY_TESTING.md` for email template

### Scenario 2: IDR Works, PGK Fails

**Conclusion:** PGK currency not supported in DOKU test environment

**Action:** Contact BSP to enable PGK in test environment, or proceed to production testing only
- Email: servicebsp@bsp.com.pg
- See `BSP_DOKU_CURRENCY_TESTING.md` for email template

---

## Restoration

### Restore PGK Currency

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
sed -i 's/^BSP_DOKU_TEST_CURRENCY=.*/BSP_DOKU_TEST_CURRENCY=598/' .env
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

## Notes

- This change is **backward compatible** - defaults to PGK (598) if environment variable not set
- No changes to frontend required
- Only backend restart needed after deployment
- Can be safely deployed without immediate testing
- Test script requires SSH access to server

---

## Related Documentation

- `BSP_DOKU_CURRENCY_TESTING.md` - Complete testing guide
- `BSP_DOKU_DEPLOYMENT_READY.md` - Main deployment guide
- `BSP_DOKU_SECURITY_AUDIT.md` - Security audit
- `BSP_DOKU_INTEGRATION_DETAILS.md` - DOKU API specification

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
**Status:** Ready for Deployment
