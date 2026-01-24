# Backend Deployment Instructions

**Date**: 2026-01-18
**Purpose**: Deploy backend URL centralization updates

---

## What's Included in This Deployment

This deployment completes the URL centralization for the backend, making all domain URLs configurable from a single source.

### Backend Files Updated (5 files)

1. **`backend/config/urls.js`** (NEW) - Centralized URL configuration
2. **`backend/utils/pdfGenerator.js`** - Updated registration URLs
3. **`backend/routes/payment-webhook-doku.js`** - Updated payment callback URLs
4. **`backend/services/notificationService.js`** - Updated email notification URLs
5. **`backend/services/payment-gateways/BSPGateway.js`** - Updated webhook URL

---

## Changes Made

### 1. New Config File: `backend/config/urls.js`

Created centralized URL configuration with helper functions:
- `PUBLIC_URL` - Public frontend URL
- `API_URL` - API base URL
- `FRONTEND_URL` - Frontend application URL
- `getRegistrationUrl(voucherCode)` - Build registration URLs
- `getPaymentCallbackUrl(path)` - Build payment callback URLs
- `getAppUrl(path)` - Build app URLs

### 2. PDF Generator (`backend/utils/pdfGenerator.js`)

**Lines updated**: 5, 158, 585

**Changes**:
- Added import: `const { getRegistrationUrl } = require('../config/urls');`
- Replaced hardcoded URLs with `getRegistrationUrl(voucherCode)` (2 occurrences)

### 3. Payment Webhook (`backend/routes/payment-webhook-doku.js`)

**Lines updated**: 12, 483, 496, 502, 508

**Changes**:
- Added import: `const { getPaymentCallbackUrl } = require('../config/urls');`
- Replaced 4 hardcoded payment redirect URLs with `getPaymentCallbackUrl()` calls

### 4. Notification Service (`backend/services/notificationService.js`)

**Lines updated**: 6, 497, 765, 801

**Changes**:
- Added imports: `const { PUBLIC_URL, getAppUrl } = require('../config/urls');`
- Replaced 3 hardcoded URLs with centralized config

### 5. BSP Gateway (`backend/services/payment-gateways/BSPGateway.js`)

**Lines updated**: 13, 253

**Changes**:
- Added import: `const { FRONTEND_URL } = require('../../config/urls');`
- Replaced hardcoded URL with `FRONTEND_URL` constant

---

## Deployment Steps

**IMPORTANT**: You will deploy these files manually via CloudPanel File Manager.

### Step 1: Prepare Files Locally

The 5 backend files are ready in your local repository:
```
/Users/nikolay/github/greenpay/backend/config/urls.js
/Users/nikolay/github/greenpay/backend/utils/pdfGenerator.js
/Users/nikolay/github/greenpay/backend/routes/payment-webhook-doku.js
/Users/nikolay/github/greenpay/backend/services/notificationService.js
/Users/nikolay/github/greenpay/backend/services/payment-gateways/BSPGateway.js
```

### Step 2: Backup Current Backend Files (via SSH)

Run these commands in your SSH terminal:

```bash
# Create backup directory
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
mkdir -p backups/backup-20260118

# Backup files being replaced
cp config/urls.js backups/backup-20260118/ 2>/dev/null || echo "config/urls.js is new, no backup needed"
cp utils/pdfGenerator.js backups/backup-20260118/
cp routes/payment-webhook-doku.js backups/backup-20260118/
cp services/notificationService.js backups/backup-20260118/
cp services/payment-gateways/BSPGateway.js backups/backup-20260118/

# Verify backups
ls -la backups/backup-20260118/
```

### Step 3: Upload Files via CloudPanel

1. **Log in to CloudPanel**
   - URL: Your CloudPanel login URL

2. **Navigate to Backend Directory**
   - Go to File Manager
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

3. **Create config directory (if needed)**
   - Check if `config/` directory exists
   - If not, create it: Right-click → New Folder → "config"

4. **Upload Each File**
   - Upload `backend/config/urls.js` to `backend/config/`
   - Upload `backend/utils/pdfGenerator.js` to `backend/utils/`
   - Upload `backend/routes/payment-webhook-doku.js` to `backend/routes/`
   - Upload `backend/services/notificationService.js` to `backend/services/`
   - Upload `backend/services/payment-gateways/BSPGateway.js` to `backend/services/payment-gateways/`

### Step 4: Verify Files on Server (via SSH)

```bash
# Check file sizes and timestamps
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Verify config file exists
ls -lh config/urls.js

# Verify all files were updated
ls -lh utils/pdfGenerator.js
ls -lh routes/payment-webhook-doku.js
ls -lh services/notificationService.js
ls -lh services/payment-gateways/BSPGateway.js

# Check for syntax errors
node -c config/urls.js
node -c utils/pdfGenerator.js
node -c routes/payment-webhook-doku.js
node -c services/notificationService.js
node -c services/payment-gateways/BSPGateway.js
```

### Step 5: Restart Backend (via SSH)

```bash
# Restart the backend API
pm2 restart greenpay-api

# Monitor logs for errors
pm2 logs greenpay-api --lines 100
```

---

## Post-Deployment Verification

After deployment, test the following features:

### 1. PDF Generation (Registration URLs)
- Generate a corporate voucher
- Check the PDF - registration URL should be correct
- Test both individual and corporate voucher PDFs

### 2. Payment Webhooks
- Process a test payment via BSP DOKU
- Verify redirect URLs work correctly
- Check both success and failure callbacks

### 3. Email Notifications
- Trigger an email notification (create a ticket)
- Check that email contains correct links
- Verify ticket URL is correct

### 4. Check Logs for Errors

```bash
pm2 logs greenpay-api --lines 200 | grep -i error
```

---

## Rollback Instructions (If Needed)

If something goes wrong, restore from backup:

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Remove new config file if it's causing issues
rm -f config/urls.js

# Restore backed up files
cp backups/backup-20260118/pdfGenerator.js utils/
cp backups/backup-20260118/payment-webhook-doku.js routes/
cp backups/backup-20260118/notificationService.js services/
cp backups/backup-20260118/BSPGateway.js services/payment-gateways/

# Restart backend
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

---

## Environment Variables (Future Domain Migration)

When you're ready to migrate to `pnggreenfees.gov.pg`, update the `.env` file on the server:

```bash
# SSH to server
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Edit .env file
nano .env
```

Add or update these variables:
```env
PUBLIC_URL=https://pnggreenfees.gov.pg
API_URL=https://pnggreenfees.gov.pg/api
FRONTEND_URL=https://pnggreenfees.gov.pg
```

Then restart:
```bash
pm2 restart greenpay-api
```

That's it! No code changes needed for domain migration.

---

## Technical Details

### Files Modified Summary

| File | Lines Changed | Type of Change |
|------|---------------|----------------|
| `backend/config/urls.js` | NEW FILE | Created centralized config |
| `backend/utils/pdfGenerator.js` | 5, 158, 585 | Import + 2 URL replacements |
| `backend/routes/payment-webhook-doku.js` | 12, 483, 496, 502, 508 | Import + 4 URL replacements |
| `backend/services/notificationService.js` | 6, 497, 765, 801 | Import + 3 URL replacements |
| `backend/services/payment-gateways/BSPGateway.js` | 13, 253 | Import + 1 URL replacement |

### Current Domain Configuration

All URLs default to: `https://greenpay.eywademo.cloud`

### Benefits

1. **Single Source of Truth**: All URLs configured in one place
2. **Easy Domain Migration**: Change .env file, restart - done
3. **Environment-Specific URLs**: Development vs Production via env vars
4. **Maintainability**: No more searching for hardcoded URLs
5. **Consistency**: All parts of the system use the same domain

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs greenpay-api --lines 200`
2. Check syntax: `node -c backend/config/urls.js`
3. Verify file permissions: `ls -la backend/config/`
4. Ensure PM2 process is running: `pm2 status`
5. Check environment variables: `pm2 env greenpay-api`

---

**Deployment Ready**: Yes ✅
**Risk Level**: Low
**Testing Required**: PDF generation, payment webhooks, email notifications
**Rollback Available**: Yes (backups in `backups/backup-20260118/`)

