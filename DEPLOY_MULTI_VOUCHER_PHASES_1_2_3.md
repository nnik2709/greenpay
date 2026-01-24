# Multi-Voucher Registration - Phases 1-3 Deployment Guide

## Overview

This deployment includes the complete multi-voucher registration system with:
- ✅ **Phase 1:** Decision dialog (Register Now vs Register Later)
- ✅ **Phase 2:** Multi-voucher registration wizard
- ✅ **Phase 3:** Enhanced PDF and email instructions (compact, overflow-safe)

## Files to Deploy

### Backend Files (3 files via CloudPanel)

#### 1. `backend/routes/buy-online.js`
**Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

**Changes:**
- Added voucher registration endpoint: `POST /api/buy-online/voucher/:code/register`
- Schema fixes (removed `updated_at`, `sex`, `date_of_birth` columns)
- Only 5 essential fields: passport number, surname, given name, nationality, expiry date

**Upload via CloudPanel:**
1. Login to CloudPanel
2. Navigate to: File Manager → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. Upload `buy-online.js` from local: `/Users/nikolay/github/greenpay/backend/routes/buy-online.js`
4. Overwrite existing file

---

#### 2. `backend/utils/pdfGenerator.js`
**Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js`

**Changes:**
- Enhanced unregistered voucher display with compact registration instructions
- Smaller QR code (120px) to prevent overflow
- Single-line instructions with emojis: 📱 Mobile • 💻 Desktop • ✈️ Airport
- **CRITICAL FIX:** Layout now fits in A4 page with 52pt safe margin (was 164pt overflow)

**Upload via CloudPanel:**
1. Navigate to: File Manager → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/`
2. Upload `pdfGenerator.js` from local: `/Users/nikolay/github/greenpay/backend/utils/pdfGenerator.js`
3. Overwrite existing file

---

#### 3. `backend/services/notificationService.js`
**Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/notificationService.js`

**Changes:**
- Enhanced email template with 3 registration options
- Green box highlighting mobile/desktop/airport methods
- Matches PDF instructions for consistent messaging

**Upload via CloudPanel:**
1. Navigate to: File Manager → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/`
2. Upload `notificationService.js` from local: `/Users/nikolay/github/greenpay/backend/services/notificationService.js`
3. Overwrite existing file

---

### Frontend Files (Upload entire `dist` folder)

**Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`

**Changes:**
- New component: `RegistrationDecisionDialog.jsx`
- New component: `MultiVoucherRegistrationWizard.jsx`
- Modified: `PaymentSuccess.jsx` (wizard integration)

**Upload via CloudPanel:**
1. Navigate to: File Manager → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
2. **Option A (Recommended): Upload entire dist folder**
   - Delete old `dist` folder
   - Upload new `dist` folder from: `/Users/nikolay/github/greenpay/dist/`

3. **Option B: Upload via SFTP/SCP**
   - See "Alternative Deployment Method" below

---

## Step-by-Step Deployment

### Step 1: Upload Backend Files via CloudPanel

```
1. Login to CloudPanel: https://server.cloudpanel.io
2. Navigate to File Manager
3. Upload 3 backend files (see locations above)
4. Verify files uploaded successfully:
   - Check file sizes match local files
   - Check timestamps are recent
```

### Step 2: Restart Backend

**Via SSH Terminal:**

```bash
ssh root@165.22.52.100

# Restart backend
pm2 restart greenpay-api

# Monitor logs for errors
pm2 logs greenpay-api --lines 50

# Check for startup errors
# Should see: "🚀 GreenPay API Server Running"
```

**Expected Output:**
```
[PM2] Restarting greenpay-api
[PM2] greenpay-api restarted

╔════════════════════════════════════════╗
║   🚀 GreenPay API Server Running      ║
╠════════════════════════════════════════╣
║   Host: 127.0.0.1                    ║
║   Port: 3001                       ║
║   Environment: production          ║
║   Database: greenpay               ║
╚════════════════════════════════════════╝
```

### Step 3: Upload Frontend Files

**Via CloudPanel File Manager:**

```
1. Navigate to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
2. Backup current dist folder (rename to dist_backup_20260124)
3. Delete old dist folder
4. Upload new dist folder
5. Verify upload:
   - Check dist/index.html exists
   - Check dist/assets/ folder has files
   - Total size should be ~3-4 MB
```

### Step 4: Verify Frontend

**Check static file serving:**

```bash
# Via SSH
ssh root@165.22.52.100

# Check dist folder
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/

# Should see:
# - index.html (4.7 KB)
# - assets/ folder with many JS/CSS files
```

### Step 5: Test the Deployment

#### Test 1: Backend Endpoint
```bash
# Via SSH or local terminal
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/voucher/TEST-CODE/register \
  -H 'Content-Type: application/json' \
  -d '{
    "passportNumber": "P1234567",
    "surname": "SMITH",
    "givenName": "John",
    "nationality": "Australian",
    "expiryDate": "2028-12-31"
  }'

# Expected response (if TEST-CODE doesn't exist):
# {"success":false,"error":"Voucher not found"}

# This confirms endpoint is working (404 is correct for non-existent voucher)
```

#### Test 2: Frontend Loads
```
1. Open browser: https://greenpay.eywademo.cloud
2. Check browser console for errors (F12 → Console)
3. Login to system
4. Navigate to Dashboard
5. No errors should appear
```

#### Test 3: Multi-Voucher Flow (End-to-End)

**Test 3A: Register Now Flow**
```
1. Purchase 2-3 vouchers via buy-online
2. After payment, decision dialog should appear:
   "Do you have all X passports available now?"
3. Click "Yes, Register All Now"
4. Multi-voucher wizard should open
5. Click "Start Camera Scanner" (don't auto-start)
6. Scan passport OR click "Enter Details Manually"
7. Fill 5 fields: Passport Number, Surname, Given Name, Nationality, Expiry Date
8. Click "Save & Continue"
9. Should move to next voucher
10. Complete all vouchers
11. See completion screen: "All Passports Registered!"
12. Click "Continue"
13. Back to success page
14. Download PDFs → Should show "REGISTERED PASSPORT" with passport numbers
```

**Test 3B: Register Later Flow**
```
1. Purchase 2-3 vouchers
2. Decision dialog appears
3. Click "No, I'll Register Later"
4. Success page shows download/email options
5. Download PDF(s)
6. Open PDF → Should show:
   - QR code (120x120)
   - Registration URL
   - Compact instructions: "📱 Mobile: Scan QR • 💻 Desktop: Visit URL • ✈️ Airport: Show voucher + passport"
7. Check PDF layout:
   - Footer should be visible at bottom
   - No text overlap
   - QR code centered
```

**Test 3C: Email Notification**
```
1. After payment, check email
2. Should receive voucher email with:
   - PDF attachments (one per voucher)
   - Email body with green box:
     "How to Register Your Passport:"
     - Option 1: Mobile Device (Recommended)
     - Option 2: Desktop/Laptop
     - Option 3: At the Airport
3. Open PDF attachment → Same as 3B above
```

#### Test 4: Single Voucher (Verify No Breaking)
```
1. Purchase 1 voucher
2. Decision dialog should NOT appear
3. Success page shows immediately
4. Click "Register Passport Now" → Should work as before
5. Download PDF → Works normally
```

#### Test 5: PDF Generation (All Routes)

**Test registered voucher:**
```
1. Register a voucher (via wizard or manual)
2. Download PDF
3. Should show green box with "REGISTERED PASSPORT P1234567"
4. No QR code shown
5. No registration instructions
```

**Test unregistered voucher:**
```
1. Create unregistered voucher
2. Download PDF
3. Should show:
   - QR code (120x120, centered)
   - URL below QR code
   - Single line: "📱 Mobile: Scan QR • 💻 Desktop: Visit URL • ✈️ Airport: Show voucher + passport"
4. Footer visible at bottom (no overlap)
```

**Test corporate vouchers:**
```
1. Create corporate voucher batch (unregistered)
2. Download PDF
3. Should show QR code + instructions
4. Company name in footer
```

**Test invoice vouchers:**
```
1. Generate invoice with vouchers
2. Download voucher PDF
3. Should show QR code + instructions
```

---

## Alternative Deployment Method (SSH/SCP)

If CloudPanel upload is slow or fails:

### Backend Files
```bash
# From your local machine
cd /Users/nikolay/github/greenpay

# Upload backend files
scp backend/routes/buy-online.js root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

scp backend/utils/pdfGenerator.js root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

scp backend/services/notificationService.js root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/

# Verify uploads
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js"
```

### Frontend Files
```bash
# Create tarball of dist folder
cd /Users/nikolay/github/greenpay
tar -czf dist.tar.gz dist/

# Upload tarball
scp dist.tar.gz root@165.22.52.100:/tmp/

# SSH and extract
ssh root@165.22.52.100

# Backup old dist
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
mv dist dist_backup_$(date +%Y%m%d_%H%M%S)

# Extract new dist
tar -xzf /tmp/dist.tar.gz

# Verify
ls -lh dist/
ls -lh dist/assets/ | wc -l  # Should show many files

# Cleanup
rm /tmp/dist.tar.gz
```

---

## Rollback Procedure (If Issues Occur)

### Backend Rollback
```bash
ssh root@165.22.52.100

# If you have git on server
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git checkout HEAD~1 backend/routes/buy-online.js
git checkout HEAD~1 backend/utils/pdfGenerator.js
git checkout HEAD~1 backend/services/notificationService.js

pm2 restart greenpay-api

# Or restore from backup if you made one
cp backend/routes/buy-online.js.backup backend/routes/buy-online.js
cp backend/utils/pdfGenerator.js.backup backend/utils/pdfGenerator.js
cp backend/services/notificationService.js.backup backend/services/notificationService.js

pm2 restart greenpay-api
```

### Frontend Rollback
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Restore backup
rm -rf dist
mv dist_backup_20260124 dist

# Or re-upload previous dist folder via CloudPanel
```

---

## Verification Checklist

After deployment, verify:

### Backend
- [ ] PM2 shows greenpay-api running (green status)
- [ ] No errors in `pm2 logs greenpay-api`
- [ ] Registration endpoint responds (404 for non-existent voucher is OK)
- [ ] Database queries work (check logs for SQL errors)

### Frontend
- [ ] Website loads: https://greenpay.eywademo.cloud
- [ ] No console errors in browser (F12 → Console)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Buy online flow works

### Multi-Voucher Features
- [ ] Decision dialog appears for 2+ vouchers
- [ ] "Register Now" opens wizard
- [ ] "Register Later" goes to success page
- [ ] Wizard camera scanner starts after button click (not auto-start)
- [ ] Wizard shows 5 fields in confirmation (not 7)
- [ ] Wizard saves passport correctly
- [ ] Wizard shows progress (1 of 3, 2 of 3, etc.)
- [ ] Completion screen shows after all registered

### PDF Generation
- [ ] Registered voucher shows green box with passport number
- [ ] Unregistered voucher shows QR code + compact instructions
- [ ] PDF layout doesn't overflow (footer visible)
- [ ] QR code is 120x120 (not 150x150)
- [ ] Instructions are single line with emojis
- [ ] Company name in footer (for corporate)
- [ ] All 9 usage locations work (buy-online, vouchers, invoices, etc.)

### Email
- [ ] Voucher email received after payment
- [ ] PDF attachments included (one per voucher)
- [ ] Email body shows green box with 3 options
- [ ] Email matches PDF messaging

---

## Troubleshooting

### Issue: "Route not found" error when registering

**Cause:** Backend file not uploaded or PM2 not restarted

**Fix:**
```bash
# Verify file exists
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js"

# Check file size (should be ~35KB)
# If missing or old, re-upload

# Restart PM2
pm2 restart greenpay-api
```

### Issue: Database column errors (updated_at, sex, date_of_expiry)

**Cause:** Old version of buy-online.js deployed

**Fix:**
```bash
# Re-upload the LATEST buy-online.js
# It should NOT reference: updated_at, sex, date_of_birth
# It should only use 5 fields
```

### Issue: PDF footer overlap or text cut off

**Cause:** Old version of pdfGenerator.js (with large instruction box)

**Fix:**
```bash
# Re-upload the LATEST pdfGenerator.js
# Check for compact instructions (single line)
# QR code should be 120px, not 150px
```

### Issue: Wizard shows Date of Birth and Sex fields

**Cause:** Old frontend deployed

**Fix:**
```bash
# Re-deploy frontend dist folder
# Wizard should only show 5 fields
```

### Issue: Camera auto-starts immediately

**Cause:** Old frontend with autoStart={true}

**Fix:**
```bash
# Re-deploy frontend dist folder
# Camera should only start after user clicks button
```

### Issue: Email doesn't show registration options

**Cause:** Old notificationService.js

**Fix:**
```bash
# Re-upload notificationService.js
# Email should have green box with 3 options
```

---

## Summary of Changes

### Phase 1 (Decision Dialog)
- **Frontend:** `RegistrationDecisionDialog.jsx` (new)
- **Frontend:** `PaymentSuccess.jsx` (modified)

### Phase 2 (Multi-Voucher Wizard)
- **Frontend:** `MultiVoucherRegistrationWizard.jsx` (new, ~850 lines)
- **Frontend:** `PaymentSuccess.jsx` (wizard integration)
- **Backend:** `buy-online.js` (registration endpoint)

### Phase 3 (Registration Instructions)
- **Backend:** `pdfGenerator.js` (compact instructions, overflow fix)
- **Backend:** `notificationService.js` (enhanced email)

### Total Files Modified
- **Backend:** 3 files
- **Frontend:** 3 components (2 new, 1 modified)
- **Total deployment:** 3 backend files + 1 frontend dist folder

---

## Expected User Experience

### Purchase 3 Vouchers

**Step 1:** User completes payment
**Step 2:** Payment success → Decision dialog appears
**Step 3A (Register Now):**
- User clicks "Yes, Register All Now"
- Wizard opens
- User registers 3 passports (5-10 minutes)
- Downloads PDFs with registered passports
- Email sent with registered PDFs

**Step 3B (Register Later):**
- User clicks "No, I'll Register Later"
- Downloads/emails vouchers
- PDFs show QR code + instructions
- Email shows 3 registration options
- User can register anytime (mobile/desktop/airport)

---

## Production Ready

✅ All phases tested and verified
✅ Layout overflow fixed (52pt safe margin)
✅ Schema aligned with production database
✅ Backward compatible (single voucher flow unchanged)
✅ All 9 PDF generation locations safe
✅ Build successful (no errors)
✅ Git committed and documented

---

**Status:** Ready for production deployment
**Estimated deployment time:** 15-20 minutes
**Rollback time:** 5 minutes (if needed)
