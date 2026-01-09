# BSP Testing Endpoint - Deployment Package

## ✅ Safety Review

### What Changed
- **ONE LINE ADDED** to `backend/server.js` (line 74)
- **NO existing code modified**
- **NO database changes**
- **NO breaking changes**

### Risk Assessment: **MINIMAL** ✅

| Risk | Level | Explanation |
|------|-------|-------------|
| Breaking existing functionality | **None** | Only adds a new route alias, existing webhook unchanged |
| Security | **None** | Uses exact same security as existing webhook |
| Performance | **None** | Same backend code, same processing |
| Database | **None** | No database changes |
| Rollback difficulty | **Easy** | Can revert by removing 1 line |

## What This Does

Creates an alternative URL for BSP testing that bypasses ISP filtering:

**Current (Production):** `https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify`
**New (BSP Testing):** `https://greenpay.eywademo.cloud/api/payment/doku-notify/notify`

Both URLs use **identical backend code** - the new URL is just an alias.

## Files to Deploy

### Single File Changed:
```
backend/server.js
```

**Line 74 added:**
```javascript
app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes); // ALIAS for BSP testing (bypasses ISP filters)
```

## Deployment Steps

### Step 1: Backup Current File (Optional but Recommended)

In your SSH terminal:

```bash
ssh root@165.22.52.100
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js.backup
```

### Step 2: Upload New File

**Method:** CloudPanel File Manager

1. Open CloudPanel: https://your-cloudpanel-url
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
3. Upload file: `backend/server.js`
4. **Overwrite** the existing `server.js`

### Step 3: Restart Backend

In your SSH terminal:

```bash
ssh root@165.22.52.100

# Restart the backend
pm2 restart greenpay-api

# Check for errors (should see "GreenPay API Server Running")
pm2 logs greenpay-api --lines 50
```

**Expected output:**
```
╔════════════════════════════════════════╗
║   🚀 GreenPay API Server Running      ║
╠════════════════════════════════════════╣
║   Port: 3001                           ║
║   Host: 127.0.0.1                      ║
╚════════════════════════════════════════╝
```

### Step 4: Test Both Endpoints

From your SSH terminal:

```bash
# Test original webhook (production)
curl -X POST https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"

# Expected: STOP
```

```bash
# Test new BSP testing endpoint
curl -X POST https://greenpay.eywademo.cloud/api/payment/doku-notify/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "test=1"

# Expected: STOP
```

**Both should return:** `STOP`

### Step 5: Verify from Browser (if accessible)

If your ISP doesn't block it, try visiting in browser:
```
https://greenpay.eywademo.cloud/api/payment/doku-notify/notify
```

Expected: JSON error (because GET is not allowed, only POST)

## Verification Checklist

After deployment, verify:

- [ ] Backend restarted successfully (no errors in PM2 logs)
- [ ] Original webhook URL works: `curl -X POST .../webhook/doku/notify` returns `STOP`
- [ ] New testing URL works: `curl -X POST .../doku-notify/notify` returns `STOP`
- [ ] No errors in backend logs
- [ ] Production payments still working (test with a real transaction)

## Rollback Plan (If Needed)

If anything goes wrong:

### Option 1: Restore Backup

```bash
ssh root@165.22.52.100
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js.backup \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
pm2 restart greenpay-api
```

### Option 2: Remove Single Line

Edit `server.js` and remove line 74:
```javascript
app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes); // ALIAS for BSP testing (bypasses ISP filters)
```

Then restart:
```bash
pm2 restart greenpay-api
```

## After Deployment: Inform BSP

Send this to BSP DOKU team:

---

**Subject:** Alternative Testing Endpoint Available

Dear BSP DOKU Team,

We've created an alternative testing endpoint to help you test our webhook integration without ISP filtering issues.

**Testing URL:**
```
https://greenpay.eywademo.cloud/api/payment/doku-notify/notify
```

**Production URL (unchanged):**
```
https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
```

**Test with curl:**
```bash
curl -X POST https://greenpay.eywademo.cloud/api/payment/doku-notify/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "TRANSIDMERCHANT=TEST123&STATUSCODE=0000"
```

Expected response: `STOP` or voucher creation confirmation

Both endpoints use identical backend code and security measures. Please use the testing URL for all your integration testing.

Best regards,
GreenPay Technical Team

---

## Technical Details

### Code Change

**File:** `backend/server.js`

**Before:**
```javascript
app.use('/api/payment/webhook/doku', paymentWebhookDokuRoutes); // BSP DOKU webhooks (no authentication)
app.use('/api/ocr', ocrRoutes); // Python OCR service (no authentication - public)
```

**After:**
```javascript
app.use('/api/payment/webhook/doku', paymentWebhookDokuRoutes); // BSP DOKU webhooks (no authentication)
app.use('/api/payment/doku-notify', paymentWebhookDokuRoutes); // ALIAS for BSP testing (bypasses ISP filters)
app.use('/api/ocr', ocrRoutes); // Python OCR service (no authentication - public)
```

### How It Works

Both routes point to the **same Express router** (`paymentWebhookDokuRoutes`):
- Same request handling
- Same IP validation
- Same rate limiting
- Same webhook processing
- Same response format

### Security

No security changes:
- ✅ Same IP validation (DOKU allowed IPs)
- ✅ Same rate limiting (100 requests/minute)
- ✅ Same webhook signature validation
- ✅ Same database transaction safety
- ✅ No new vulnerabilities introduced

### Why This Works

ISP filters (Forcepoint/BlackSpider) block URLs containing "webhook" keyword:
- ❌ Blocked: `/api/payment/webhook/doku/notify`
- ✅ Allowed: `/api/payment/doku-notify/notify`

The new URL bypasses the filter while maintaining all security and functionality.

## Support

If you encounter any issues:

1. Check PM2 logs: `pm2 logs greenpay-api --lines 100`
2. Check nginx error logs: `tail -f /var/log/nginx/error.log`
3. Test with curl from server: Works = ISP filter, Fails = Server issue
4. Rollback if needed (see Rollback Plan above)

## Files Included in Package

1. `backend/server.js` - Updated server file (upload this)
2. `BSP_TESTING_ENDPOINT_SOLUTION.md` - Full documentation
3. `DEPLOYMENT_PACKAGE.md` - This file (deployment guide)

## Summary

- ✅ **Safe to deploy** - Only adds 1 line, no modifications to existing code
- ✅ **No breaking changes** - Production webhook continues working
- ✅ **Easy rollback** - Can remove single line if needed
- ✅ **Solves ISP filtering** - BSP can test without network blocks
- ✅ **Minimal risk** - Same backend code, same security
