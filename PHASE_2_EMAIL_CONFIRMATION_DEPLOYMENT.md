# Phase 2 Email Confirmation & Voucher Retrieval Deployment

**Date**: 2026-01-15
**Feature**: Email Confirmation Fields + Voucher Retrieval Page
**Build Status**: ✅ SUCCESS (built in 8.63s) - **UPDATED with API fix**
**Backend Status**: ✅ Already deployed (voucher-retrieval endpoint ready)
**Critical Fix**: API response handling corrected (response.data.success → response.success)

---

## What's Being Deployed (Phase 2)

This deployment adds **email safety features** to prevent voucher loss:

### 1. Email Confirmation Fields (Typo Prevention)
- Added to **PublicVoucherPurchase** form (/buy-voucher)
- Added to **BuyOnline** form (/buy-online)
- Real-time validation with ✓/⚠ visual feedback
- Prevents form submission if emails don't match

### 2. Voucher Retrieval Page (Lost Voucher Recovery)
- New public page at **/retrieve-vouchers**
- Allows customers to recover lost vouchers using:
  - Payment Session ID (from confirmation email)
  - Email address (security verification)
- Features:
  - Email verification (must match payment email)
  - Display all retrieved vouchers
  - Download All and Print All buttons
  - Recovery notification if vouchers were regenerated
  - Rate limiting (5 attempts per 5 minutes)

---

## Build Summary

```
✓ 3454 modules transformed
✓ built in 12.12s
✓ Total bundle size: ~765 KB (gzip: ~237 KB)
```

---

## Files Changed

### Frontend Files Modified:
1. **src/pages/PublicVoucherPurchase.jsx** - Email confirmation field added
2. **src/pages/BuyOnline.jsx** - Email confirmation field added
3. **src/pages/RetrieveVouchers.jsx** - NEW PAGE (voucher retrieval)
4. **src/App.jsx** - Route added for /retrieve-vouchers

### Backend Files:
- **backend/routes/voucher-retrieval.js** - Already deployed (Phase 1)
- No backend changes needed for this deployment

---

## Files Location

All deployment files are in: `/Users/nikolay/github/greenpay/dist/`

### Directory Structure:
```
dist/
├── index.html                    (4.74 KB - Main HTML file)
├── assets/                       (77 JavaScript & CSS files)
├── bg-png.jpg                    (493 KB - Background image)
├── logo.png                      (72 KB - Logo)
├── logo-png.png                  (4.7 KB - Logo PNG)
├── manifest.json                 (1.5 KB - PWA manifest)
├── service-worker.js             (7.4 KB - Service worker)
├── offline.html                  (4.3 KB - Offline page)
└── ws-test.html                  (4.9 KB - WebSocket test)
```

**Total files**: 85 files (8 root files + 77 assets)

---

## Manual Deployment Steps

### Step 1: Backup Current Production

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to frontend directory
cd /var/www/png-green-fees

# Create backup
cp -r dist dist.backup-phase2-email-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -lh dist.backup-*
```

### Step 2: Upload Files via CloudPanel

**Option A: CloudPanel File Manager (Recommended)**

1. Open CloudPanel at: https://your-cloudpanel-url.com
2. Login with your credentials
3. Navigate to: **Sites → png-green-fees → File Manager**
4. Go to path: `/var/www/png-green-fees/`
5. **DELETE** the existing `dist` folder
6. **CREATE** new empty `dist` folder
7. **UPLOAD** all files from your local `/Users/nikolay/github/greenpay/dist/` to server `dist/`
   - Upload `index.html`, `manifest.json`, `service-worker.js`, etc. (8 root files)
   - Upload the entire `assets/` folder (77 files)
   - Upload all image files (`bg-png.jpg`, `logo.png`, `logo-png.png`)

**Option B: SCP Command (Alternative)**

From your local machine:

```bash
# Create tar archive for faster upload
cd /Users/nikolay/github/greenpay
tar -czf dist-phase2-email.tar.gz dist/

# Upload to server
scp dist-phase2-email.tar.gz root@165.22.52.100:/tmp/

# SSH to server and extract
ssh root@165.22.52.100
cd /var/www/png-green-fees
rm -rf dist
tar -xzf /tmp/dist-phase2-email.tar.gz
rm /tmp/dist-phase2-email.tar.gz
```

### Step 3: Verify File Permissions

```bash
# On server
cd /var/www/png-green-fees
chown -R www-data:www-data dist/
chmod -R 755 dist/
```

### Step 4: Verify Files Uploaded

```bash
# Check main files exist
ls -lh dist/index.html
ls -lh dist/manifest.json
ls -lh dist/service-worker.js

# Check assets folder
ls -lh dist/assets/ | head -20

# Count total files
find dist/ -type f | wc -l
# Should output: 85
```

### Step 5: Restart Frontend Service

```bash
# Restart PM2 process
pm2 restart png-green-fees

# Check status
pm2 list

# Monitor logs for errors
pm2 logs png-green-fees --lines 50
```

**Expected PM2 Output**:
```
┌────┬────────────────┬─────────┬────────┐
│ id │ name           │ status  │ cpu    │
├────┼────────────────┼─────────┼────────┤
│ 0  │ png-green-fees │ online  │ 0%     │
└────┴────────────────┴─────────┴────────┘
```

### Step 6: Clear Browser Cache

**IMPORTANT**: After deployment, clear browser cache or use hard refresh:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R` (Mac)

---

## Verification Tests

### Test 1: Email Confirmation Field - PublicVoucherPurchase

1. Go to: https://greenpay.eywademo.cloud/buy-voucher
2. Enter email address in "Email Address" field (e.g., `test@example.com`)
3. Verify:
   - ✅ "Confirm Email Address" field appears below
   - ✅ Field has placeholder "your@email.com (re-enter to confirm)"
4. Enter DIFFERENT email in confirmation field (e.g., `wrong@example.com`)
5. Verify:
   - ✅ Red warning appears: "⚠ Emails do not match"
6. Enter SAME email in confirmation field (e.g., `test@example.com`)
7. Verify:
   - ✅ Green checkmark appears: "✓ Emails match"
8. Try to submit form with mismatched emails
9. Verify:
   - ✅ Toast error appears: "Email Mismatch"
   - ✅ Form does NOT submit

### Test 2: Email Confirmation Field - BuyOnline

1. Go to: https://greenpay.eywademo.cloud/buy-online
2. Enter email address (e.g., `test@example.com`)
3. Verify:
   - ✅ "Confirm Email Address" field appears
4. Test mismatch and match scenarios (same as Test 1)
5. Verify validation works correctly

### Test 3: Voucher Retrieval Page Access

1. Go to: https://greenpay.eywademo.cloud/retrieve-vouchers
2. Verify:
   - ✅ Page loads successfully
   - ✅ Title: "Retrieve Your Vouchers"
   - ✅ Form has two fields:
     - "Payment Session ID" with placeholder "PGKO-XXXX-XXXX"
     - "Email Address" with placeholder "your@email.com"
   - ✅ Blue security notice about email verification
   - ✅ Help section with troubleshooting tips
   - ✅ NO authentication required (public page)

### Test 4: Voucher Retrieval - Validation

1. On /retrieve-vouchers page:
2. Click "Retrieve Vouchers" button WITHOUT entering any data
3. Verify:
   - ✅ Toast error: "Missing Information"
4. Enter Session ID but leave Email blank
5. Verify:
   - ✅ Toast error: "Missing Information"
6. Enter invalid email format (e.g., "notanemail")
7. Verify:
   - ✅ Toast error: "Invalid Email"

### Test 5: Voucher Retrieval - Success Flow (REQUIRES REAL SESSION)

**Prerequisites**: Complete a voucher purchase to get a real Session ID

1. Complete a voucher purchase at /buy-voucher
2. Note the Session ID from success page (e.g., `PGKO-1234-5678`)
3. Go to: https://greenpay.eywademo.cloud/retrieve-vouchers
4. Enter:
   - Session ID: `PGKO-1234-5678` (from purchase)
   - Email: The email used during purchase
5. Click "Retrieve Vouchers"
6. Verify:
   - ✅ Loading spinner appears
   - ✅ Toast success: "Vouchers Retrieved"
   - ✅ All vouchers from that session display
   - ✅ Each voucher shows:
     - Voucher code
     - Amount (K 50.00)
     - Status
     - Valid from/until dates
     - Barcode
   - ✅ Action buttons appear:
     - "Download All (N)" or "Download PDF"
     - "Print All (N)" or "Print"
   - ✅ Green confirmation: "A copy of your vouchers has been sent to [email]"

### Test 6: Voucher Retrieval - Email Mismatch

1. On /retrieve-vouchers page
2. Enter a valid Session ID from a previous purchase
3. Enter WRONG email address (not the one used during purchase)
4. Click "Retrieve Vouchers"
5. Verify:
   - ✅ Toast error: "Email address does not match"
   - ✅ No vouchers displayed

### Test 7: Voucher Retrieval - Invalid Session ID

1. On /retrieve-vouchers page
2. Enter fake Session ID (e.g., `PGKO-9999-9999`)
3. Enter any valid email
4. Click "Retrieve Vouchers"
5. Verify:
   - ✅ Toast error: "Session not found" or similar
   - ✅ No vouchers displayed

### Test 8: Download and Print Buttons

1. Successfully retrieve vouchers (Test 5)
2. Click "Download All (N)" button
3. Verify:
   - ✅ PDF downloads with all vouchers
   - ✅ Toast: "Download Started"
4. Click "Print All (N)" button
5. Verify:
   - ✅ Print dialog opens
   - ✅ Shows all vouchers in print preview

### Test 9: Browser Console Check

Open browser console (F12) and check for errors:
- ✅ NO red errors in console
- ✅ All assets loaded (check Network tab)
- ✅ No 404 errors for routes or assets

---

## Rollback Plan (If Issues Occur)

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to frontend directory
cd /var/www/png-green-fees

# Find your backup
ls -lh dist.backup-*

# Remove broken deployment
rm -rf dist

# Restore backup (replace YYYYMMDD-HHMMSS with actual backup timestamp)
cp -r dist.backup-phase2-email-YYYYMMDD-HHMMSS dist

# Restart service
pm2 restart png-green-fees

# Verify
pm2 logs png-green-fees --lines 20
```

---

## What Changed (Technical Details)

### 1. Email Confirmation Fields

**PublicVoucherPurchase.jsx** (Lines 30, 133-141, 347-373):
- Added `emailConfirm` state field
- Validation: Checks if `email === emailConfirm` before submission
- UI: Shows confirmation field ONLY after user enters first email
- Real-time feedback: ✓ (green) or ⚠ (red) icons

**BuyOnline.jsx** (Lines 36, 72-80, 311-337):
- Same pattern as PublicVoucherPurchase
- Consistent UX across both purchase forms

### 2. Voucher Retrieval Page

**RetrieveVouchers.jsx** (NEW FILE):
- Full featured voucher recovery page
- Calls backend endpoint: `/api/voucher-retrieval/retrieve`
- Email verification for security
- Displays all vouchers with barcodes
- Download/Print functionality
- Help section with troubleshooting

**App.jsx** (Line 159):
- Added route: `<Route path="/retrieve-vouchers" element={<RetrieveVouchers />} />`
- Public route (no authentication required)

### 3. Backend Integration

Backend endpoint **already deployed** in Phase 1:
- `/api/voucher-retrieval/retrieve` (POST)
- Requires: `sessionId` and `email`
- Verifies email matches purchase record
- Returns all vouchers for session
- Rate limiting: 5 attempts per 5 minutes

---

## Success Criteria Checklist

After deployment, confirm:
- [ ] /buy-voucher page loads without errors
- [ ] Email confirmation field appears when email is entered
- [ ] Validation prevents submission with mismatched emails
- [ ] /buy-online page has same email confirmation behavior
- [ ] /retrieve-vouchers page loads successfully
- [ ] Voucher retrieval form validates inputs correctly
- [ ] Can retrieve vouchers with valid Session ID + Email
- [ ] Email mismatch shows appropriate error
- [ ] Invalid Session ID shows appropriate error
- [ ] Download All button works
- [ ] Print All button works
- [ ] No console errors
- [ ] Mobile responsive (test on phone)
- [ ] All routes accessible without auth errors

---

## Pending Tasks (NOT in This Deployment)

These Phase 2 tasks will be completed AFTER testing email functionality:

1. **Update Email Templates** - Add "Retrieve Vouchers" link to footer (not started)
2. **End-to-End Testing** - Complete voucher retrieval flow testing (not started)

---

## Known Issues & Limitations

1. **Backend endpoint must be available**: Voucher retrieval requires `/api/voucher-retrieval/retrieve` endpoint (already deployed in Phase 1)
2. **Rate limiting**: Users limited to 5 retrieval attempts per 5 minutes (security feature)
3. **Session ID required**: Users must have Session ID from purchase confirmation email

---

## Troubleshooting

### Issue 1: "502 Bad Gateway" after restart

**Solution**:
```bash
pm2 describe png-green-fees
pm2 restart png-green-fees
pm2 logs png-green-fees --err
```

### Issue 2: Old version still showing

**Cause**: Browser cache
**Solution**: Hard refresh (`Ctrl + Shift + R`) or clear browser cache

### Issue 3: "Cannot GET /" error

**Cause**: index.html missing
**Solution**:
```bash
ls -lh /var/www/png-green-fees/dist/index.html
# If missing, restore from backup or re-upload
```

### Issue 4: Assets not loading (404 errors)

**Cause**: assets/ folder missing or wrong permissions
**Solution**:
```bash
ls -lh /var/www/png-green-fees/dist/assets/
chmod -R 755 /var/www/png-green-fees/dist/
```

### Issue 5: /retrieve-vouchers route returns 404

**Cause**: React Router not configured in Nginx
**Solution**: Verify Nginx config has `try_files $uri /index.html;` for single-page app routing

### Issue 6: Email confirmation field not appearing

**Cause**: JavaScript error or browser cache
**Solution**:
1. Open browser console (F12) and check for errors
2. Hard refresh (`Ctrl + Shift + R`)
3. Verify `index.html` and assets loaded correctly

---

## Contact & Support

If issues persist:
1. Check PM2 logs: `pm2 logs png-green-fees`
2. Check Nginx logs: `tail -100 /var/log/nginx/error.log`
3. Restore from backup (see Rollback Plan above)

---

## Deployment Commands Summary (Copy/Paste)

```bash
# 1. Backup
ssh root@165.22.52.100 "cd /var/www/png-green-fees && cp -r dist dist.backup-phase2-email-$(date +%Y%m%d-%H%M%S)"

# 2. Upload (via CloudPanel File Manager - see Step 2 above)

# 3. Set permissions
ssh root@165.22.52.100 "cd /var/www/png-green-fees && chown -R www-data:www-data dist/ && chmod -R 755 dist/"

# 4. Verify files
ssh root@165.22.52.100 "find /var/www/png-green-fees/dist/ -type f | wc -l"
# Should output: 85

# 5. Restart service
ssh root@165.22.52.100 "pm2 restart png-green-fees && pm2 list"

# 6. Monitor logs
ssh root@165.22.52.100 "pm2 logs png-green-fees --lines 50"
```

---

**Status**: ✅ BUILD COMPLETE - READY FOR MANUAL DEPLOYMENT
**Risk Level**: LOW (isolated frontend changes, backend already deployed)
**Estimated Deployment Time**: 10-15 minutes
**Business Impact**: HIGH (prevents voucher loss due to email typos)

---

## Next Steps After Deployment

1. **Test email functionality** (user requested priority)
2. **Update email templates** - Add "Retrieve Vouchers" link to voucher emails
3. **Full end-to-end testing** - Test complete voucher retrieval flow with real purchases
4. **User documentation** - Update user guide with voucher retrieval instructions
