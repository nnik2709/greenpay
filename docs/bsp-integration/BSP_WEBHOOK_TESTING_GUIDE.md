# BSP DOKU Webhook Testing Guide

**Date**: 2025-12-30
**Status**: Ready for Testing
**BSP Status**: Webhooks enabled by BSP, ready to test

---

## Webhook Endpoints

BSP needs to configure these webhook URLs in their system:

### 1. Notify Webhook (Server-to-Server)
**URL**: `https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify`
**Method**: POST
**Purpose**: Real-time payment status notification
**Response**: Must return "CONTINUE" to complete transaction

### 2. Redirect Webhook (Browser Redirect)
**URL**: `https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect`
**Method**: POST
**Purpose**: Customer redirect after payment
**Response**: HTTP redirect to success/failure page

---

## Webhook Security Features

✅ **IP Whitelisting**: Only accepts requests from BSP DOKU IPs
- Staging: 103.10.130.75, 147.139.130.145
- Production: 103.10.130.35, 147.139.129.160

✅ **Signature Verification**: Validates WORDS signature using SHA1
- Formula: `SHA1(AMOUNT + MALLID + SHAREDKEY + TRANSIDMERCHANT + RESULTMSG + VERIFYSTATUS)`
- Uses constant-time comparison to prevent timing attacks

✅ **Rate Limiting**: Max 100 requests per minute per IP

✅ **Request Validation**: Checks all required fields present

---

## Testing Checklist

### Before Testing with BSP

- [x] Webhook endpoints deployed on production server
- [x] Database table `payment_gateway_transactions` exists
- [x] Environment variables configured:
  - BSP_DOKU_MALL_ID
  - BSP_DOKU_SHARED_KEY
  - BSP_DOKU_MODE (set to 'test' or 'production')
- [x] Backend server running on production
- [x] SSL certificate valid (HTTPS required)

### Testing Steps

#### Step 1: Verify Webhook Endpoints Are Accessible

Run this command to check endpoint health:

```bash
# Test Notify endpoint (should return error about missing fields, but shows it's reachable)
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response: "STOP" (because of missing fields)
# This confirms the endpoint is accessible
```

#### Step 2: Monitor Server Logs During Test Payment

**On production server**, run:

```bash
# Watch backend logs in real-time
pm2 logs greenpay-api --lines 100 --raw

# Look for these log patterns:
# [DOKU NOTIFY] Webhook received at: 2025-12-30...
# [DOKU NOTIFY] Client IP: xxx.xxx.xxx.xxx
# [DOKU NOTIFY] Transaction ID: GreenPay_xxx
# [DOKU NOTIFY] Signature verified successfully
# [DOKU NOTIFY] ✅ Transaction updated successfully
# [DOKU NOTIFY] Responding with CONTINUE
```

#### Step 3: Make Test Payment

1. Go to: https://greenpay.eywademo.cloud/public/buy
2. Fill in passport details
3. Click "Pay with Credit Card (BSP DOKU)"
4. Complete payment on BSP DOKU page
5. Watch the logs for webhook notifications

#### Step 4: Verify Database Update

After payment, check database:

```sql
-- Check latest payment transaction
SELECT
  id,
  session_id,
  amount,
  currency,
  status,
  gateway_response,
  created_at,
  completed_at
FROM payment_gateway_transactions
ORDER BY created_at DESC
LIMIT 5;

-- Expected status after successful payment: 'completed'
```

---

## Expected Webhook Flow

### Successful Payment

1. **Customer completes payment on BSP DOKU page**

2. **DOKU sends Notify webhook** (server-to-server):
```json
{
  "TRANSIDMERCHANT": "GreenPay_1234567890",
  "AMOUNT": "50.00",
  "STATUSCODE": "0000",
  "RESULTMSG": "SUCCESS",
  "VERIFYSTATUS": "000",
  "WORDS": "abc123...",
  "SESSIONID": "session_xyz",
  "CURRENCY": "598"
}
```

3. **Our backend processes webhook**:
   - ✅ Verifies IP is from DOKU
   - ✅ Verifies WORDS signature
   - ✅ Updates database status to 'completed'
   - ✅ Responds with "CONTINUE"

4. **DOKU redirects customer** (browser redirect):
   - Sends POST to /redirect endpoint
   - Backend redirects to: `/payment/success?session=GreenPay_xxx`

5. **Customer sees success page**

### Failed Payment

Same flow, but:
- STATUSCODE != "0000"
- Backend updates status to 'failed'
- Redirects to `/payment/failure?error=...`

---

## Webhook Payload Examples

### Notify Webhook (Success)

```json
{
  "TRANSIDMERCHANT": "GreenPay_1735564800000",
  "AMOUNT": "50.00",
  "STATUSCODE": "0000",
  "RESULTMSG": "SUCCESS",
  "VERIFYSTATUS": "000",
  "WORDS": "a1b2c3d4e5f6...",
  "SESSIONID": "doku_session_xyz",
  "PAYMENTCHANNEL": "15",
  "CURRENCY": "598",
  "PURCHASECURRENCY": "598",
  "MCPAYMENTID": "123456789"
}
```

### Notify Webhook (Failed)

```json
{
  "TRANSIDMERCHANT": "GreenPay_1735564800000",
  "AMOUNT": "50.00",
  "STATUSCODE": "5501",
  "RESULTMSG": "INSUFFICIENT FUNDS",
  "VERIFYSTATUS": "001",
  "WORDS": "x1y2z3...",
  "SESSIONID": "doku_session_xyz",
  "PAYMENTCHANNEL": "15",
  "CURRENCY": "598"
}
```

---

## Troubleshooting

### Issue: Webhook not received

**Possible causes:**
1. BSP hasn't configured webhook URLs yet
2. Firewall blocking BSP IP addresses
3. SSL certificate issue
4. Wrong webhook URL provided to BSP

**Debug steps:**
```bash
# Check if endpoint is accessible from internet
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify

# Check backend logs for any errors
pm2 logs greenpay-api --err

# Verify DNS resolves correctly
nslookup greenpay.eywademo.cloud

# Check SSL certificate
curl -vI https://greenpay.eywademo.cloud
```

### Issue: Signature verification fails

**Logs will show:**
```
[DOKU NOTIFY] SECURITY: Signature verification failed
```

**Possible causes:**
1. Wrong SHARED_KEY in environment variables
2. Amount precision mismatch (should be X.XX format)
3. Currency code not matching

**Debug steps:**
```bash
# Check environment variables on server
ssh root@165.22.52.100
cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/.env | grep BSP_DOKU

# Verify SHARED_KEY matches what BSP provided
```

### Issue: Database not updating

**Logs will show:**
```
[DOKU NOTIFY] ❌ Database update error
```

**Debug steps:**
```bash
# Check if table exists
psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT * FROM payment_gateway_transactions LIMIT 1;"

# Check if session_id exists
psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT * FROM payment_gateway_transactions WHERE session_id = 'GreenPay_xxx';"
```

### Issue: Customer not redirected

**Logs will show:**
```
[DOKU REDIRECT] Webhook received
```

**Check:**
1. Redirect URL is correct in logs
2. Browser console for errors
3. Network tab shows redirect happening

---

## What to Provide to BSP

**Email to BSP:**

```
Subject: BSP DOKU Webhook URLs for GreenPay Integration

Dear BSP Team,

Thank you for enabling the webhook URLs. Please configure the following endpoints for our GreenPay integration:

**Merchant Details:**
- Merchant Name: GreenPay
- Mall ID: [BSP_DOKU_MALL_ID from .env]

**Webhook URLs:**

1. Notify URL (Server-to-Server):
   https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify

   Method: POST
   Response: Text "CONTINUE"

2. Redirect URL (Browser Redirect):
   https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect

   Method: POST
   Response: HTTP 302 Redirect

**Testing:**
We are ready to test immediately. Please confirm when webhooks are configured so we can run a test transaction.

**Contact:**
[Your contact information]

Best regards,
GreenPay Team
```

---

## Success Criteria

✅ **Notify webhook received and processed**
- Backend logs show webhook received
- Signature verified successfully
- Database updated with correct status
- Response "CONTINUE" sent to DOKU

✅ **Customer redirected correctly**
- After payment, customer sees success page
- Session ID appears in URL
- No errors in browser console

✅ **Payment status accurate**
- Database shows 'completed' for successful payments
- Database shows 'failed' for failed payments
- Completed_at timestamp is set

✅ **Security working**
- Only DOKU IPs accepted
- Invalid signatures rejected
- Rate limiting functional

---

## Next Steps After Successful Test

1. **Confirm with BSP**: Webhooks working correctly
2. **Monitor logs**: Watch for any issues in first few days
3. **Document any issues**: Report to BSP if needed
4. **Switch to production mode**: Set `BSP_DOKU_MODE=production` when ready
5. **Production webhooks**: Update URLs if production uses different domain

---

## Production Deployment Checklist

When going live:

- [ ] Set `BSP_DOKU_MODE=production` in .env
- [ ] Verify production MALL_ID and SHARED_KEY
- [ ] Update IP whitelist to production IPs only
- [ ] Test with real (small amount) transaction
- [ ] Monitor logs closely for first 24 hours
- [ ] Have rollback plan ready
- [ ] Document any issues for BSP support

---

## Support Contacts

**BSP Support:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212

**What to include in support requests:**
1. Merchant ID (MALL_ID)
2. Transaction ID (TRANSIDMERCHANT)
3. Timestamp of issue
4. Error message from logs
5. Webhook payload (redact sensitive data)

---

**Ready to test!** BSP has enabled webhooks, our endpoints are live and secured.
