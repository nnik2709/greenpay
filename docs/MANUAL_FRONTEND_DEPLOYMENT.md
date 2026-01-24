# Manual Frontend Deployment Instructions

**Date**: 2026-01-15
**Fix**: Multiple Vouchers Display - Phase 1 Complete
**Build Status**: ✅ SUCCESS (built in 13.61s)

---

## What's Being Deployed

Frontend fix to display ALL purchased vouchers on the PaymentSuccess page, with Download All, Print All, and Email All functionality.

**Backend is already deployed** - This is frontend-only deployment.

---

## Build Summary

```
✓ 3453 modules transformed
✓ built in 13.61s
✓ Total bundle size: ~752 KB (gzip: ~235 KB)
```

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
cp -r dist dist.backup-multiple-vouchers-$(date +%Y%m%d-%H%M%S)

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
tar -czf dist-frontend-fix.tar.gz dist/

# Upload to server
scp dist-frontend-fix.tar.gz root@165.22.52.100:/tmp/

# SSH to server and extract
ssh root@165.22.52.100
cd /var/www/png-green-fees
rm -rf dist
cd /var/www/png-green-fees
tar -xzf /tmp/dist-frontend-fix.tar.gz
rm /tmp/dist-frontend-fix.tar.gz
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

### Test 1: Single Voucher (Backward Compatibility)

1. Go to: https://greenpay.eywademo.cloud
2. Complete BSP DOKU payment for **1 voucher** (K50)
3. On success page, verify:
   - ✅ Title: "Your green fee voucher is ready" (singular)
   - ✅ ONE voucher displayed
   - ✅ NO "Voucher 1 of 1" header
   - ✅ Buttons: "Download PDF", "Print", "Email Voucher" (no numbers)

### Test 2: Multiple Vouchers (NEW FEATURE)

1. Complete BSP DOKU payment for **3 vouchers** (K150)
2. On success page, verify:
   - ✅ Title: "Your 3 green fee vouchers are ready"
   - ✅ THREE vouchers displayed with headers:
     - "Voucher 1 of 3"
     - "Voucher 2 of 3"
     - "Voucher 3 of 3"
   - ✅ Each voucher shows unique code and barcode
   - ✅ All vouchers are scrollable
   - ✅ Buttons: "Download All (3)", "Print All (3)", "Email All (3)"

### Test 3: Actions Work

1. Click **"Download All (3)"** → Should download PDF with all 3 vouchers
2. Click **"Print All (3)"** → Should open print dialog with all 3 vouchers
3. Click **"Email All (3)"** → Dialog should say "Email 3 Vouchers"
4. Enter email and send → All 3 vouchers should arrive in one email

### Test 4: Browser Console Check

Open browser console (F12) and check for errors:
- ✅ NO red errors in console
- ✅ All assets loaded (check Network tab)

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

# Restore backup
cp -r dist.backup-multiple-vouchers-YYYYMMDD-HHMMSS dist

# Restart service
pm2 restart png-green-fees

# Verify
pm2 logs png-green-fees --lines 20
```

---

## Key Files Changed (For Reference)

These files have the multiple voucher display fix:

**Frontend**:
- `src/pages/PaymentSuccess.jsx` - Displays all vouchers, dynamic buttons

**Backend** (already deployed):
- `backend/routes/buy-online.js` - Returns all vouchers

**Assets impacted**:
The compiled frontend includes these changes in the bundled JavaScript files in `dist/assets/`.

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

---

## Contact & Support

If issues persist:
1. Check PM2 logs: `pm2 logs png-green-fees`
2. Check Nginx logs: `tail -100 /var/log/nginx/error.log`
3. Restore from backup (see Rollback Plan above)

---

## Success Criteria Checklist

After deployment, confirm:
- [ ] Frontend loads without errors
- [ ] Single voucher purchase shows correctly (backward compatible)
- [ ] Multiple vouchers display with "Voucher X of N" headers
- [ ] Buttons show quantity: "Download All (3)", etc.
- [ ] Download All works
- [ ] Print All works
- [ ] Email All works
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

---

**Status**: ✅ BUILD COMPLETE - READY FOR MANUAL DEPLOYMENT
**Risk Level**: LOW (isolated frontend change, backward compatible)
**Estimated Deployment Time**: 10-15 minutes
**Business Impact**: HIGH (completes Phase 1, fixes critical user issue)
