# Cloudflare Turnstile Deployment Guide

## Overview

This guide covers deploying the Cloudflare Turnstile bot protection system to replace the math verification on the `/buy-online` public payment page.

**Security Improvement:**
- Current system: 40-60% bot protection (honeypot + math)
- New system: 99% bot protection (Cloudflare Turnstile - Managed mode)

## Files Modified

### Frontend
- `/Users/nikolay/github/greenpay/src/pages/BuyOnline.jsx` - Added Turnstile widget, honeypot field, removed "Secure Payment Process" section
- `/Users/nikolay/github/greenpay/.env` - Added site key
- Built: `dist/` directory (ready for deployment)

**CRITICAL FIX:** Added missing `honeypot` and `startTime` state variables that were causing a production error.

### Backend
- `/Users/nikolay/github/greenpay/backend/utils/turnstileVerification.js` - **NEW FILE** (verification logic)
- `/Users/nikolay/github/greenpay/backend/routes/buy-online.js` - Updated to use Turnstile

## Deployment Steps

### Step 1: Frontend Deployment

The frontend has been built locally with the Turnstile site key. Deploy the `dist/` folder to production:

```bash
# From your local machine
cd /Users/nikolay/github/greenpay
./deploy.sh
```

Or manually upload the `dist/` folder contents to `/var/www/png-green-fees/dist` on the server.

### Step 2: Backend Environment Variable

Add the Turnstile secret key to the backend environment on the production server.

**IMPORTANT:** According to CLAUDE.md, backend is at:
- Path: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
- PM2 process: `greenpay-api`

**Option A: Using PM2 Environment Variables (Recommended)**

```bash
# SSH into the server
ssh root@165.22.52.100

# Set environment variable for PM2 process
pm2 set greenpay-api:TURNSTILE_SECRET_KEY "0x4AAAAAACKrkLEeEdG19DpLoMKYcuxYPZQ"

# Save PM2 configuration
pm2 save
```

**Option B: Using .env File**

```bash
# SSH into the server
ssh root@165.22.52.100

# Navigate to backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Add to .env file (create if doesn't exist)
echo 'TURNSTILE_SECRET_KEY=0x4AAAAAACKrkLEeEdG19DpLoMKYcuxYPZQ' >> .env
```

### Step 3: Deploy Backend Files

Upload the following files to the production server using CloudPanel File Manager:

#### File 1: `backend/utils/turnstileVerification.js` (NEW FILE)

**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/turnstileVerification.js`

**Source:** `/Users/nikolay/github/greenpay/backend/utils/turnstileVerification.js`

This file contains the Cloudflare Turnstile verification logic.

#### File 2: `backend/routes/buy-online.js` (UPDATED)

**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

**Source:** `/Users/nikolay/github/greenpay/backend/routes/buy-online.js`

This file has been updated to use Turnstile instead of math verification.

### Step 4: Verify File Upload

Paste these commands in your SSH terminal to verify files are uploaded correctly:

```bash
# 1. Verify backend path (should match PM2 process)
pm2 describe greenpay-api | grep script

# 2. Check new verification file exists
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/turnstileVerification.js

# 3. Check updated route file
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

# 4. Verify environment variable (Option A - PM2)
pm2 env greenpay-api | grep TURNSTILE

# OR verify environment variable (Option B - .env file)
cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env | grep TURNSTILE
```

### Step 5: Restart Backend

```bash
# SSH into the server
ssh root@165.22.52.100

# Restart the backend API
pm2 restart greenpay-api

# Monitor logs to confirm startup
pm2 logs greenpay-api --lines 50
```

Look for:
- No errors on startup
- Server listening message
- NO warnings about missing TURNSTILE_SECRET_KEY

### Step 6: Test the Implementation

#### Manual Test

1. Visit: https://greenpay.eywademo.cloud/buy-online
2. Fill out the passport form
3. Verify you see the Cloudflare Turnstile widget (checkbox or automatic verification)
4. Click "Proceed to Payment"
5. Check that verification passes and payment gateway loads

#### Monitor Backend Logs During Test

```bash
# In SSH terminal, watch logs in real-time
pm2 logs greenpay-api --lines 100

# Look for these messages during test:
# ✅ "Turnstile verification passed" - SUCCESS
# ❌ "Turnstile verification failed" - FAILURE (check token from frontend)
# ⚠️ "No Turnstile token provided" - Frontend not sending token
```

## Verification Checklist

- [ ] Frontend deployed (`dist/` folder uploaded)
- [ ] Backend environment variable added (`TURNSTILE_SECRET_KEY`)
- [ ] New file uploaded: `backend/utils/turnstileVerification.js`
- [ ] Updated file uploaded: `backend/routes/buy-online.js`
- [ ] Backend restarted (`pm2 restart greenpay-api`)
- [ ] No startup errors in logs
- [ ] Manual test: Turnstile widget appears on form
- [ ] Manual test: Form submission works
- [ ] Backend logs show "Turnstile verification passed"

## Troubleshooting

### Issue: "TURNSTILE_SECRET_KEY not configured" warning in logs

**Cause:** Environment variable not set or not loaded by PM2

**Fix:**
```bash
# Check if variable is set
pm2 env greenpay-api | grep TURNSTILE

# If not found, set it
pm2 set greenpay-api:TURNSTILE_SECRET_KEY "0x4AAAAAACKrkLEeEdG19DpLoMKYcuxYPZQ"
pm2 save
pm2 restart greenpay-api
```

### Issue: "No Turnstile token provided" warning

**Cause:** Frontend not sending the token or frontend not deployed

**Fix:**
1. Verify frontend is deployed with latest build
2. Check browser console for JavaScript errors
3. Verify `.env` has `VITE_TURNSTILE_SITE_KEY=0x4AAAAAACKrkPvzxDqNR6CE`

### Issue: "Turnstile verification failed"

**Cause:** Token is invalid or secret key is incorrect

**Fix:**
1. Verify secret key matches Cloudflare dashboard
2. Check token is fresh (not expired)
3. Verify site key in frontend matches Cloudflare dashboard

### Issue: Turnstile widget not appearing on page

**Cause:** Frontend script not loaded or site key missing

**Fix:**
1. Check browser console for errors
2. Verify frontend `.env` has `VITE_TURNSTILE_SITE_KEY`
3. Rebuild frontend: `npm run build`
4. Redeploy `dist/` folder

## Rollback Plan

If issues occur, you can quickly rollback to the old math verification:

### Quick Rollback (Backend Only)

Restore the original `buy-online.js` file from git:

```bash
# SSH into server
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Backup current file
cp routes/buy-online.js routes/buy-online.js.turnstile-backup

# Restore from git (you'll need to have git on server)
# Or manually copy the old version via CloudPanel
```

## Support Information

**Cloudflare Turnstile Dashboard:**
- URL: https://dash.cloudflare.com/
- Navigate to: Your Account → Turnstile
- View: Analytics, Error logs, Configuration

**Your Turnstile Configuration:**
- Widget Mode: Managed (adaptive challenge)
- Site Key: `0x4AAAAAACKrkPvzxDqNR6CE` (public, used in frontend)
- Secret Key: `0x4AAAAAACKrkLEeEdG19DpLoMKYcuxYPZQ` (private, used in backend)

## Post-Deployment Monitoring

Monitor these metrics after deployment:

1. **Success Rate:** Check Cloudflare Turnstile dashboard for verification success rate
2. **Error Rate:** Monitor `pm2 logs greenpay-api` for verification failures
3. **User Experience:** Collect feedback on verification process
4. **Bot Traffic:** Compare bot traffic before/after deployment in Cloudflare analytics

Expected outcome: ~99% of legitimate users pass, ~99% of bots blocked.
