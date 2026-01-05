# Deploy Agent Workflow Improvements - Manual Deployment Guide

**Build Date:** December 15, 2025, 6:15 AM (UPDATED)
**Build Status:** ✅ SUCCESS (9.16s)
**Build Directory:** `/Users/nikolay/github/greenpay/dist/`
**Build Version:** v2 - Flattened Menu + Fixed Redirect

---

## What's Changed

### Frontend Updates:
1. ✅ Fixed agent blank screen on login → Now redirects to `/app/agent`
2. ✅ New Agent Landing page with 3 action cards
3. ✅ **FLATTENED Counter_Agent navigation menu** (no dropdown grouping)
4. ✅ Updated routing for Counter_Agent

### Key New Features:
- Beautiful 3-card agent landing page
- **Flattened menu:** 5 items shown directly (Home, All Passports, Individual Green Pass, Vouchers List, Scan & Validate)
- **Removed dropdown grouping:** "Green Pass Management" dropdown removed
- Simplified menu (removed: Bulk Upload, Corporate Exit Pass, Batch History, Payments)
- Agent home now goes to `/app/agent` instead of `/app/passports/create`
- GREEN CARD branding prominent

---

## Files to Deploy

### CRITICAL FILES (Must Deploy):

#### 1. Main HTML Entry Point
```
dist/index.html (4.6 KB)
```
**Server Path:** `/var/www/html/index.html` (or your document root)

#### 2. New Agent Landing Page Bundle
```
dist/assets/AgentLanding-528d829a.js (6.62 KB)
```
**Server Path:** `/var/www/html/assets/AgentLanding-528d829a.js`

#### 3. Main JavaScript Bundle (Contains flattened menu + routing changes)
```
dist/assets/index-05218150.js (661.14 KB)
```
**Server Path:** `/var/www/html/assets/index-05218150.js`

#### 4. Main CSS Bundle
```
dist/assets/index-d34c08f0.css (72.52 KB)
```
**Server Path:** `/var/www/html/assets/index-d34c08f0.css`

---

### ALL ASSET FILES (Recommended - Full Deployment):

Deploy the **entire `/dist` folder contents** to your web server:

```bash
# Option 1: Deploy entire dist folder (RECOMMENDED)
rsync -avz --delete dist/ user@server:/var/www/html/

# Option 2: Deploy using scp
scp -r dist/* user@server:/var/www/html/

# Option 3: Manual upload via FTP/SFTP
Upload entire /dist folder contents to your web server document root
```

**Why deploy all assets?**
- Ensures all dependencies are updated
- Prevents cache issues
- Includes all icon files and shared libraries
- Only 3.2 MB total (gzipped)

---

## Deployment Steps (Manual Upload)

### Using Command Line (SSH/SFTP):

```bash
# 1. Navigate to your project directory
cd /Users/nikolay/github/greenpay

# 2. Deploy to server (replace with your server details)
rsync -avz --delete \
  dist/ \
  root@greenpay.eywademo.cloud:/var/www/html/

# 3. Set correct permissions on server
ssh root@greenpay.eywademo.cloud "chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html"

# 4. Clear Nginx cache if applicable
ssh root@greenpay.eywademo.cloud "systemctl reload nginx"
```

### Using FTP/SFTP Client (e.g., FileZilla, Cyberduck):

1. Connect to your server
2. Navigate to web document root (usually `/var/www/html/` or `/home/user/public_html/`)
3. **DELETE** old `index.html` and `assets/` folder
4. Upload new `index.html` from `/Users/nikolay/github/greenpay/dist/`
5. Upload entire `assets/` folder from `/Users/nikolay/github/greenpay/dist/assets/`

---

## Critical Asset Files List (If uploading individually)

### Must Upload (Minimum Deployment):

**Root Files:**
```
dist/index.html
```

**CSS:**
```
dist/assets/index-d34c08f0.css
```

**New JavaScript (Agent Features):**
```
dist/assets/AgentLanding-528d829a.js
dist/assets/index-05218150.js  (Main bundle with flattened menu + routing)
```

**Updated Components:**
```
dist/assets/Dashboard-dd395a9a.js
dist/assets/IndividualPurchase-9e2c2e73.js
```

### All Asset Files (64 files total):

<details>
<summary>Click to see complete file list</summary>

```
dist/assets/AgentLanding-caf8f1d4.js (6.62 KB) ← NEW
dist/assets/BarChart-f981db74.js (368.41 KB)
dist/assets/BulkPassportUpload-a8c479da.js (34.34 KB)
dist/assets/BulkPassportUploadReports-1090e3a3.js (3.80 KB)
dist/assets/CashReconciliation-fd710663.js (11.28 KB)
dist/assets/CorporateBatchHistory-10a65784.js (11.27 KB)
dist/assets/CorporateExitPass-16bc130e.js (11.76 KB)
dist/assets/CorporateVoucherRegistration-cdc58cc1.js (14.72 KB)
dist/assets/CorporateVoucherReports-9a4ff60e.js (3.80 KB)
dist/assets/CreateQuotation-aeb989a7.js (22.84 KB)
dist/assets/Customers-a1dad4db.js (11.50 KB)
dist/assets/Dashboard-dd395a9a.js (24.22 KB)
dist/assets/EditPassport-1ed3162f.js (7.16 KB)
dist/assets/EmailTemplates-c8908168.js (12.85 KB)
dist/assets/ExportButton-8338bb9e.js (35.06 KB)
dist/assets/IndividualPurchase-9e2c2e73.js (31.56 KB)
dist/assets/IndividualPurchaseReports-ef4a5081.js (18.75 KB)
dist/assets/Invoices-bb300f57.js (18.50 KB)
dist/assets/LoginHistory-c0714ea3.js (6.41 KB)
dist/assets/OfflineTemplate-b350b694.js (5.01 KB)
dist/assets/OfflineUpload-f8a4d954.js (2.34 KB)
dist/assets/Passports-42b2c9ff.js (18.75 KB)
dist/assets/PassportReports-9828782a.js (4.11 KB)
dist/assets/PaymentCallback-236d5fd9.js (7.70 KB)
dist/assets/PaymentGatewaySettings-8bd9af1f.js (12.47 KB)
dist/assets/PaymentModes-cc74e284.js (4.04 KB)
dist/assets/PaymentsList-39fbe57d.js (10.86 KB)
dist/assets/ProfileSettings-1fad2ddf.js (3.91 KB)
dist/assets/Quotations-5dea40e0.js (19.06 KB)
dist/assets/QuotationsReports-0ce33164.js (3.48 KB)
dist/assets/RefundedReport-02732aed.js (6.85 KB)
dist/assets/Reports-72e75533.js (2.06 KB)
dist/assets/RevenueGeneratedReports-055a6d56.js (6.49 KB)
dist/assets/ScanAndValidate-b7c7dd1b.js (11.33 KB)
dist/assets/SettingsRPC-9ccf396c.js (3.41 KB)
dist/assets/SMSSettings-4e574c9e.js (9.16 KB)
dist/assets/Tickets-4c4c1e6c.js (46.37 KB)
dist/assets/Users-e793ef29.js (20.01 KB)
dist/assets/ViewQuotation-07cf6b2e.js (7.85 KB)
dist/assets/VoucherPrint-3883b110.js (77.48 KB)
dist/assets/VouchersList-5ffdd2da.js (8.70 KB)

dist/assets/alert-circle-60221be6.js (0.25 KB)
dist/assets/arrow-left-b87a1cdd.js (0.16 KB)
dist/assets/bulkUploadService-3f4eb2be.js (3.94 KB)
dist/assets/download-427ec40b.js (0.26 KB)
dist/assets/gstUtils-36c80ae6.js (1.84 KB)
dist/assets/html2canvas.esm-e0a7d97b.js (201.43 KB)
dist/assets/html5-qrcode-scanner-2a2d9a56.js (376.18 KB)
dist/assets/index-4d143d74.js (661.25 KB) ← UPDATED
dist/assets/index-d34c08f0.css (72.52 KB) ← UPDATED
dist/assets/index.es-34ae1aca.js (70.32 KB)
dist/assets/index.es-89a0c8cc.js (150.62 KB)
dist/assets/individualPurchasesService-1dfb4e6a.js (0.54 KB)
dist/assets/jspdf.es.min-85ab9979.js (413.20 KB)
dist/assets/passportsService-651a8d13.js (1.92 KB)
dist/assets/paymentGatewayService-04385f68.js (7.51 KB)
dist/assets/paymentModesStorage-65f87fe2.js (0.84 KB)
dist/assets/plus-2e2e32fe.js (0.15 KB)
dist/assets/plus-circle-05d20531.js (0.20 KB)
dist/assets/purify.es-fd086bfc.js (22.26 KB)
dist/assets/quotationsService-03fe9381.js (1.09 KB)
dist/assets/send-1a462d66.js (0.16 KB)
dist/assets/textarea-ee94609f.js (0.48 KB)
dist/assets/trash-2-e03c3b94.js (0.47 KB)
dist/assets/xlsx-f5126985.js (284.67 KB)
```
</details>

---

## Post-Deployment Testing

### 1. Test Counter_Agent Login:
```
URL: https://greenpay.eywademo.cloud/login
Email: agent@greenpay.pg
Password: Agent123!@#
```

**Expected Behavior:**
- ✅ Login successful
- ✅ Redirects to `/app/agent` (Agent Landing page)
- ✅ See 3 action cards:
  - Add Passport & Generate Voucher
  - Validate Existing Voucher
  - Add Passport to Voucher
- ✅ Menu shows: Home, Green Pass Management (4 items)
- ✅ NO: Bulk Upload, Corporate Exit Pass, Batch History, Payments

### 2. Test Navigation:
- Click "Home" → Should go to Agent Landing (`/app/agent`)
- Click "Green Pass Management" dropdown
  - All Passports → `/app/passports`
  - Individual Green Pass → `/app/passports/create`
  - Vouchers List → `/app/vouchers-list`
  - Scan & Validate → `/app/scan`

### 3. Test Action Cards:
- Click card 1 → Should navigate to `/app/passports/create`
- Click card 2 → Should navigate to `/app/scan`
- Click card 3 → Will be updated to reuse existing voucher registration page

### 4. Test Other Roles (Should be unchanged):
- Flex_Admin → `/app/dashboard` (unchanged)
- Finance_Manager → `/app/dashboard` (unchanged)
- IT_Support → `/app/dashboard` (unchanged)

---

## Rollback Plan (If Issues Occur)

### Quick Rollback:
```bash
# If you have a backup
rsync -avz --delete backup/dist/ root@greenpay.eywademo.cloud:/var/www/html/

# Or restore from git
cd /Users/nikolay/github/greenpay
git checkout HEAD~1  # Go back one commit
npm run build
rsync -avz --delete dist/ root@greenpay.eywademo.cloud:/var/www/html/
```

---

## Browser Cache Issues

If users don't see the changes:

### 1. Hard Refresh:
- **Chrome/Edge:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Firefox:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- **Safari:** Cmd+Option+R (Mac)

### 2. Clear Cache:
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Firefox: Settings → Privacy → Clear Data → Cached Web Content

### 3. Server-side Cache Clear:
```bash
# Clear Nginx cache (if enabled)
ssh root@greenpay.eywademo.cloud "find /var/cache/nginx -type f -delete && systemctl reload nginx"

# Or restart Nginx
ssh root@greenpay.eywademo.cloud "systemctl restart nginx"
```

---

## Server Configuration

**No server configuration changes needed!**

This is a frontend-only update. No backend, database, or Nginx config changes required.

---

## Success Checklist

- [ ] Uploaded `dist/index.html`
- [ ] Uploaded all files from `dist/assets/`
- [ ] Set correct file permissions (755 for directories, 644 for files)
- [ ] Cleared browser cache
- [ ] Tested Counter_Agent login
- [ ] Verified Agent Landing page displays
- [ ] Tested navigation menu (only 5 items for Counter_Agent)
- [ ] Tested all 3 action cards
- [ ] Verified other roles still work (Flex_Admin, Finance_Manager, IT_Support)

---

## Support

**Issues?**
1. Check browser console for errors (F12 → Console tab)
2. Verify all files uploaded correctly
3. Check file permissions on server
4. Try hard refresh (Ctrl+Shift+R)
5. Review deployment checklist above

**Documentation:**
- Full implementation details: `docs/AGENT_WORKFLOW_IMPROVEMENTS.md`
- This deployment guide: `DEPLOY_AGENT_IMPROVEMENTS.md`

---

## Summary

**Total Files:** 65 files (1 HTML + 64 assets)
**Total Size:** ~3.2 MB (gzipped: ~750 KB)
**Deployment Time:** ~2-5 minutes
**Downtime:** None (atomic replacement)
**Risk Level:** Low (frontend only, no backend changes)

**Quick Deploy Command:**
```bash
rsync -avz --delete dist/ root@greenpay.eywademo.cloud:/var/www/html/
```

---

**Ready to Deploy!** ✅
