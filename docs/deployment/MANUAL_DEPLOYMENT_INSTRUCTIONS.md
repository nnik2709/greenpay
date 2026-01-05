# Manual Deployment Instructions - BSP DOKU Currency Testing

**Date:** December 19, 2024
**Status:** Changes committed to GitHub (commit f0d4a3d)

---

## Files to Update Manually on Production Server

After running `git pull` on the server, you only need to update **ONE file** to enable currency testing:

### File to Update on Server

**Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/payment-gateways/BSPGateway.js`

**Line 236 - Change:**

```javascript
// BEFORE:
const currencyCode = '598';

// AFTER:
const currencyCode = process.env.BSP_DOKU_TEST_CURRENCY || '598';
```

---

## Complete Manual Deployment Steps

### Step 1: Connect to Server

```bash
ssh root@165.22.52.100
```

### Step 2: Navigate to Application

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
```

### Step 3: Pull Latest Changes from GitHub

```bash
git pull origin main
```

This will update:
- ✅ `backend/services/payment-gateways/BSPGateway.js` (currency testing support)
- ✅ `.env.example` (documentation)
- ✅ `test-bsp-doku-idr.sh` (automated test script)
- ✅ `BSP_DOKU_CURRENCY_TESTING.md` (testing guide)
- ✅ `BSP_DOKU_DEPLOYMENT_READY.md` (updated)
- ✅ `DEPLOY_BSP_CURRENCY_TESTING.md` (deployment guide)

### Step 4: Restart Backend Service

```bash
pm2 restart greenpay-api
```

### Step 5: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs for BSP DOKU initialization
pm2 logs greenpay-api --lines 50 --nostream | grep "BSP DOKU"
```

You should see:
```
[BSP DOKU] TEST MODE - Using staging environment
  Mall ID: 11170
  Endpoint: https://staging.doku.com
```

---

## No Manual File Editing Required

If `git pull` completed successfully, **you don't need to manually edit any files**. The changes are already in place.

However, if for any reason you need to manually verify or edit:

### Manual Verification (Optional)

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/payment-gateways

# Check line 236 contains the currency variable
grep -n "process.env.BSP_DOKU_TEST_CURRENCY" BSPGateway.js
```

Expected output:
```
236:    const currencyCode = process.env.BSP_DOKU_TEST_CURRENCY || '598';
```

If this line is present, deployment is complete!

---

## Testing the Currency Switch

### Test with IDR Currency (360)

```bash
# While connected to server:
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Add currency test variable to .env
echo "" >> .env
echo "# Currency Testing - IDR (Indonesian Rupiah)" >> .env
echo "BSP_DOKU_TEST_CURRENCY=360" >> .env

# Restart service
pm2 restart greenpay-api

# Test payment creation
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "IDR123456",
      "surname": "TESTUSER",
      "givenName": "TEST",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {
      "answer": 5,
      "expected": 5,
      "timeSpent": 10
    }
  }' | jq '.data.metadata.formParams.CURRENCY'
```

Expected output: `"360"` (IDR)

### Restore PGK Currency (598)

```bash
# While connected to server:
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Change currency back to PGK
sed -i 's/^BSP_DOKU_TEST_CURRENCY=.*/BSP_DOKU_TEST_CURRENCY=598/' .env

# Or remove the variable entirely
sed -i '/^BSP_DOKU_TEST_CURRENCY=/d' .env

# Restart service
pm2 restart greenpay-api
```

---

## Alternative: Automated Testing Script

If you prefer automated testing from your local machine:

```bash
# From local machine (not server):
cd /Users/nikolay/github/greenpay
./test-bsp-doku-idr.sh
```

This script will:
1. Backup current `.env`
2. Set `BSP_DOKU_TEST_CURRENCY=360`
3. Restart service
4. Test payment creation
5. Display results
6. Provide restoration instructions

---

## Summary

**Minimal Manual Steps:**

```bash
# 1. Connect
ssh root@165.22.52.100

# 2. Pull changes
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git pull origin main

# 3. Restart
pm2 restart greenpay-api

# 4. Verify
pm2 logs greenpay-api --lines 50 --nostream | grep "BSP DOKU"
```

**That's it!** The currency testing capability is now deployed and ready to use.

To actually test with IDR, you'll need to add `BSP_DOKU_TEST_CURRENCY=360` to the `.env` file as shown in the "Testing the Currency Switch" section above.

---

## What This Deployment Enables

After this deployment, you can:

1. **Test with IDR currency** by setting `BSP_DOKU_TEST_CURRENCY=360`
2. **Test with PGK currency** by setting `BSP_DOKU_TEST_CURRENCY=598` (or not setting it at all)
3. **Diagnose the DOKU rejection** by comparing IDR vs PGK results
4. **Provide BSP with evidence** of whether the issue is credentials or currency support

---

## Next Steps After Deployment

1. Run the IDR currency test
2. Compare results with PGK test
3. Contact BSP with findings (see `BSP_DOKU_CURRENCY_TESTING.md` for email templates)
4. Wait for BSP to activate credentials or enable PGK currency
5. Re-test once BSP confirms changes

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
**Git Commit:** f0d4a3d
