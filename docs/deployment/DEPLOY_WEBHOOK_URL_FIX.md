# Deploy Webhook URL Fix

## Issue Found
The DOKU payment request was missing the `RESPONSEURL` parameter, so DOKU didn't know where to send webhook notifications!

## Fix Applied
Added `RESPONSEURL` parameter to BSPGateway.js payment request (line 272):
```javascript
RESPONSEURL: responseUrl, // Webhook notification URL
```

This tells DOKU to send payment notifications to:
`https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify`

---

## Deployment Steps

### Step 1: Upload Fixed File via CloudPanel

**File to upload:**
```
Source: /Users/nikolay/github/greenpay/backend/services/payment-gateways/BSPGateway.js
Destination: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/payment-gateways/BSPGateway.js
```

### Step 2: Verify File Uploaded (on server)

```bash
# Check file was uploaded
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/payment-gateways/BSPGateway.js

# Should show today's date (Dec 22)

# Verify RESPONSEURL is in the file
grep -n "RESPONSEURL" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/payment-gateways/BSPGateway.js
```

Expected output:
```
272:      RESPONSEURL: responseUrl, // Webhook notification URL
```

### Step 3: Restart Backend

```bash
pm2 restart greenpay-api
sleep 3
pm2 status greenpay-api
```

### Step 4: Test the Fix

```bash
# Create test payment and verify RESPONSEURL is in the parameters
curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "TEST123",
      "surname": "TEST",
      "givenName": "USER",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {"answer": 5, "expected": 5, "timeSpent": 10}
  }' | jq '.data.metadata.formParams.RESPONSEURL'
```

**Expected output:**
```
"https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify"
```

---

## Testing After Deployment

### Monitor Logs in Real-Time

```bash
pm2 logs greenpay-api --lines 0 | grep -i "doku\|webhook"
```

### Test Payment Flow

1. Visit: https://greenpay.eywademo.cloud/buy-online
2. Fill in test data
3. Use DOKU Visa card: 4761349999000039, CVV: 998, Exp: 12/31
4. Click "Proceed to Payment"
5. On DOKU page, enter card details and click Pay
6. **Watch the terminal** - you should now see:

```
[BSP DOKU] Creating payment session
[BSP DOKU] Payment session created successfully
[DOKU NOTIFY] Webhook received at: 2025-12-22T...
[DOKU NOTIFY] Processing payment notification
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] Transaction updated successfully
```

---

## What This Fixes

**Before:**
- ❌ DOKU didn't know where to send webhooks
- ❌ Payments processed but no notification received
- ❌ Transaction status not updated in database

**After:**
- ✅ DOKU knows to send webhooks to our notify endpoint
- ✅ Webhooks received and processed
- ✅ Transaction status updated correctly
- ✅ Payment flow completes successfully

---

## If Payment Still Fails

If payment still declines after this fix, the issue is with the **test card configuration**, not the integration:

1. **Webhook notifications will now be received** (check logs)
2. **Transaction status will update** (even if declined)
3. **You'll see the actual decline reason** in logs

The most likely remaining issue:
- Test cards not activated for Mall ID 11170
- Test cards don't support PGK currency
- Need BSP to configure test cards

But at least you'll know WHY it's declining instead of getting no feedback!

---

## Quick Deployment Commands

```bash
# On server - after uploading file via CloudPanel
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Verify file
grep -n "RESPONSEURL" services/payment-gateways/BSPGateway.js

# Restart
pm2 restart greenpay-api

# Test
curl -s -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment -H "Content-Type: application/json" -d '{"passportData":{"passportNumber":"TEST","surname":"T","givenName":"T","dateOfBirth":"1990-01-01","nationality":"PNG","sex":"M"},"email":"t@t.com","amount":50,"verification":{"answer":5,"expected":5,"timeSpent":10}}' | jq '.data.metadata.formParams.RESPONSEURL'

# Monitor logs
pm2 logs greenpay-api --lines 0
```

Then test payment!

---

**This is the critical missing piece!** Deploy this fix and webhooks should start working.
