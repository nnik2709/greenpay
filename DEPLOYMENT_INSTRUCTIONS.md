# Frontend Deployment Instructions

**Date**: 2026-01-18
**Build**: deployment-frontend-20260118-202434.tar.gz
**Size**: 1.6 MB

---

## What's Included in This Build

This deployment includes the following fixes and improvements:

### 1. URL Centralization (Frontend Complete)
- ✅ All frontend URLs now use centralized configuration
- ✅ Voucher registration URLs fixed (no longer shows wrong domain)
- ✅ API URLs centralized
- ✅ Ready for future domain migration to `pnggreenfees.gov.pg`

### 2. Fixed Files
- `VoucherPrint.jsx` - Voucher registration URLs now use config
- `ScanAndValidate.jsx` - Updated heading text (voucher codes only)
- `api/client.js` - API URL centralized
- `storageService.js` - Storage API URL centralized
- `invoicePdfService.js` - PDF API URL centralized
- `quotationPdfService.js` - Quotation PDF API URL centralized

---

## Deployment Steps

### Option 1: Via CloudPanel File Manager (Recommended)

1. **Download the archive to your local machine:**
   - Location: `/Users/nikolay/github/greenpay/deployment-frontend-20260118-202434.tar.gz`

2. **Extract locally:**
   ```bash
   tar -xzf deployment-frontend-20260118-202434.tar.gz -C frontend-files/
   ```

3. **Upload via CloudPanel:**
   - Log in to CloudPanel
   - Navigate to File Manager
   - Go to `/var/www/png-green-fees/`
   - Backup current `dist/` folder (rename to `dist-backup-20260118`)
   - Upload all files from `frontend-files/` to `dist/`

4. **Restart PM2:**
   ```bash
   pm2 restart png-green-fees
   ```

### Option 2: Direct SCP Upload (If you have SSH access)

```bash
# Navigate to project directory
cd /Users/nikolay/github/greenpay

# Extract archive to temporary location
mkdir -p /tmp/greenpay-deploy
tar -xzf deployment-frontend-20260118-202434.tar.gz -C /tmp/greenpay-deploy/

# Upload to server (replace with your SSH details)
scp -r /tmp/greenpay-deploy/* root@165.22.52.100:/var/www/png-green-fees/dist/

# Clean up
rm -rf /tmp/greenpay-deploy
```

Then SSH to server and restart:
```bash
ssh root@165.22.52.100
pm2 restart png-green-fees
pm2 logs png-green-fees --lines 50
```

---

## Post-Deployment Verification

After deployment, verify the following:

### 1. Application Loads
- Visit: https://greenpay.eywademo.cloud
- Login should work correctly
- Dashboard should load

### 2. Voucher URLs Fixed
- Go to: Corporate Exit Pass page
- Generate a voucher
- **Verify**: Registration URL shows `https://greenpay.eywademo.cloud/register/...`
- **NOT**: `https://pnggreenfees.gov.pg/...`

### 3. Scan & Validate Page
- Go to: Scan & Validate page
- **Verify**: Heading says "Scan voucher barcodes or QR codes to validate."
- **Should NOT mention**: "passport MRZ codes"

### 4. Check Browser Console
- Open browser DevTools (F12)
- Check Console tab for any errors
- Should see no import errors or module errors

### 5. API Calls Work
- Test any feature that calls the backend
- Vouchers, Passports, Quotations, etc.
- All should work normally

---

## Rollback Instructions (If Needed)

If something goes wrong:

### Via CloudPanel:
1. Delete current `dist/` folder
2. Rename `dist-backup-20260118` to `dist`
3. Restart PM2: `pm2 restart png-green-fees`

### Via SSH:
```bash
ssh root@165.22.52.100
cd /var/www/png-green-fees/
rm -rf dist
mv dist-backup-20260118 dist
pm2 restart png-green-fees
pm2 logs png-green-fees --lines 50
```

---

## What's Changed (Technical Details)

### Config Files Created
- `src/config/urls.js` - Centralized URL configuration

### Files Modified
1. `src/lib/api/client.js` - Line 5: Now imports from config
2. `src/lib/storageService.js` - Line 7: Now imports from config
3. `src/lib/invoicePdfService.js` - Line 8: Now imports from config
4. `src/lib/quotationPdfService.js` - Line 8: Now imports from config
5. `src/components/VoucherPrint.jsx` - Line 40: Uses getRegistrationUrl()
6. `src/pages/ScanAndValidate.jsx` - Line 487: Updated heading text

### Current Domain Configuration
All URLs default to: `https://greenpay.eywademo.cloud`

### Future Domain Migration
When ready to switch to `pnggreenfees.gov.pg`:
1. Update `.env` file with new domain
2. Run `npm run build`
3. Deploy new build
4. No code changes needed!

---

## Build Information

- **Vite Version**: 4.5.14
- **Build Time**: 14.04 seconds
- **Modules**: 3,455 modules transformed
- **Bundle Size**: ~769 KB (main), ~1.6 MB total
- **Gzip Size**: ~240 KB (main)

---

## Files Included in Archive

The archive contains the complete `dist/` folder with:
- `index.html` - Main entry point
- `assets/` - All JavaScript, CSS, and asset files (73 files)
- All hashed asset files for cache busting

Total: 74 files

---

## Support

If you encounter any issues during deployment:

1. Check PM2 logs: `pm2 logs png-green-fees`
2. Check browser console for errors
3. Verify file permissions: `ls -la /var/www/png-green-fees/dist/`
4. Ensure PM2 process is running: `pm2 status`

---

## Next Steps (Backend - Not Included)

The backend still has 4 files that need URL centralization:
1. `backend/utils/pdfGenerator.js`
2. `backend/routes/payment-webhook-doku.js`
3. `backend/services/notificationService.js`
4. `backend/services/payment-gateways/BSPGateway.js`

See `DOMAIN_CENTRALIZATION_STATUS.md` for details.

---

**Deployment Ready**: Yes ✅
**Risk Level**: Low
**Testing Required**: Verify voucher URLs and scan page heading
