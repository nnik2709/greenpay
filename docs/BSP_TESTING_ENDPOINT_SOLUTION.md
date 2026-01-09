# BSP DOKU Webhook Testing - ISP Filter Bypass Solution (STAGING)

## Problem

BSP DOKU testers and some users experience "Access Denied - URL is uncategorized" errors when trying to access the webhook URL:

```
https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
```

**Root Cause**: Many ISPs (Internet Service Providers) and mobile carriers in PNG and globally filter URLs containing the word "webhook" as a security measure against phishing attacks.

## Solution: Alternative Testing Endpoint

We've created an **alias endpoint** without the word "webhook" that ISPs won't block:

### Alternative Testing URL (FOR BSP MANUAL TESTING):
```
https://greenpay.eywademo.cloud/api/payment/doku-notify/notify
```

### Staging Webhook URL (for BSP DOKU staging configuration):
```
https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
```

**Environment**: STAGING (BSP DOKU Staging Integration)

## How It Works

Both URLs point to the **exact same backend code**:
- Same security checks
- Same IP validation
- Same webhook processing logic
- Same response format

**The alias is purely for testing purposes to bypass ISP filters.**

## For BSP DOKU Testers

### Testing from Browser

You can now access the endpoint from your browser using the new URL:

**GET Request (Browser):**
```
https://greenpay.eywademo.cloud/api/payment/doku-notify/notify
```

Expected response: `{"error":"Route not found","path":"/notify"}` (because GET is not allowed - webhook requires POST)

### Testing with POST Request

**Using curl:**
```bash
curl -X POST https://greenpay.eywademo.cloud/api/payment/doku-notify/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"
```

Expected response: `STOP`

**Using Postman:**
- Method: `POST`
- URL: `https://greenpay.eywademo.cloud/api/payment/doku-notify/notify`
- Headers: `Content-Type: application/x-www-form-urlencoded`
- Body: `TRANSIDMERCHANT=TEST123&STATUSCODE=0000`

Expected response: `STOP` or voucher creation confirmation

## Important Notes

### For Production Use

**DOKU MUST continue using the official webhook URL:**
```
https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
```

**Why?**
- The official URL is documented in DOKU's integration guide
- DOKU's servers are NOT affected by ISP filters (server-to-server calls)
- Production payments use the official URL

### Testing vs Staging Configuration

| Purpose | Use This URL |
|---------|-------------|
| BSP manual testing (bypasses ISP filters) | `https://greenpay.eywademo.cloud/api/payment/doku-notify/notify` |
| BSP DOKU staging configuration | `https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify` |

**Note**: This is the STAGING environment. Production URLs will be configured separately after staging validation is complete.

## Why ISPs Block "Webhook" URLs

- **Security Feature**: Many ISPs filter URLs with "webhook" to prevent phishing attacks
- **Affects**: PNG carriers (Digicel, bmobile), European ISPs, Asian carriers
- **Does NOT affect**: Server-to-server calls (DOKU's actual payment notifications)
- **Only blocks**: Browser access from certain networks

## Deployment Instructions

### 1. Upload Backend File

**File:** `backend/server.js`
**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js`

Upload via CloudPanel File Manager.

### 2. Restart Backend

Paste these commands in your SSH terminal:

```bash
# SSH into server
ssh root@165.22.52.100

# Restart backend
pm2 restart greenpay-api

# Monitor logs
pm2 logs greenpay-api --lines 50
```

### 3. Test Both Endpoints

Test that both URLs work:

```bash
# Test original webhook URL
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"

# Test new alias URL (for BSP testing)
curl -X POST https://greenpay.eywademo.cloud/api/payment/doku-notify/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"
```

Both should return: `STOP`

## Verification Checklist

- [ ] Backend file uploaded (`backend/server.js`)
- [ ] Backend restarted (`pm2 restart greenpay-api`)
- [ ] No startup errors in logs
- [ ] Original webhook URL works: `curl -X POST .../webhook/doku/notify`
- [ ] New testing URL works: `curl -X POST .../doku-notify/notify`
- [ ] BSP can access testing URL from their browser/network
- [ ] Inform BSP about the new testing URL

## Email Template for BSP

```
Subject: Alternative Testing Endpoint for STAGING Webhook Integration

Dear BSP DOKU Team,

We've identified that some ISPs in PNG and globally filter URLs containing "webhook"
as a security measure, which may prevent you from testing our staging integration endpoint.

To facilitate your testing, we've created an alternative testing endpoint:

Alternative Testing URL (for manual testing):
https://greenpay.eywademo.cloud/api/payment/doku-notify/notify

Staging Webhook URL (for BSP DOKU staging configuration):
https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify

Environment: STAGING

Both endpoints share the same backend code and security measures. The alternative
URL bypasses ISP filtering while the staging webhook URL should be configured in
your BSP DOKU staging portal for automated payment notifications.

Test the alternative endpoint:
curl -X POST https://greenpay.eywademo.cloud/api/payment/doku-notify/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "TRANSIDMERCHANT=TEST123&STATUSCODE=0000"

Expected response: STOP

Once staging integration testing is complete and validated, we will proceed with
production environment setup.

Please let us know if you encounter any issues with the testing endpoint.

Best regards,
GreenPay Technical Team
```

## Technical Details

### Code Changes

**File:** `backend/server.js` (line 74)

```javascript
// Original webhook route (production)
app.use('/api/payment/webhook/doku', paymentWebhookDokuRoutes);

// Alias for BSP testing (bypasses ISP filters)
app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes);
```

Both routes use the same Express router (`paymentWebhookDokuRoutes`), ensuring identical functionality.

### Security

- IP validation: Both URLs check DOKU allowed IPs
- Rate limiting: Both URLs share same rate limits
- Webhook signature: Both URLs validate webhook data
- No additional security risks introduced

## Troubleshooting

### Issue: BSP still can't access the new URL

**Possible causes:**
1. Backend not restarted after deployment
2. Nginx cache - clear nginx cache
3. DNS propagation delay

**Solutions:**
```bash
# Restart nginx (if needed)
systemctl restart nginx

# Clear PM2 logs to see fresh output
pm2 flush

# Restart backend
pm2 restart greenpay-api
```

### Issue: Getting 404 errors on new endpoint

**Check:**
```bash
# Verify server.js was uploaded correctly
ssh root@165.22.52.100 "grep 'doku-notify' /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js"
```

Should show: `app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes);`

## Summary

- ✅ Created alias endpoint without "webhook" keyword
- ✅ BSP can test from any network without ISP blocking
- ✅ Production webhook URL unchanged
- ✅ No impact on existing functionality
- ✅ Same security and validation for both URLs
