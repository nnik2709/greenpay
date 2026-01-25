# Deployment Ready - January 25, 2026

## Build Status: ✅ SUCCESS

**Build completed in:** 6.03 seconds
**Build timestamp:** January 25, 2026 08:35

---

## Changes Included in This Build

### 1. Backend Fixes (buy-online.js)
- ✅ Removed non-existent database columns (`p.sex`, `updated_at`, `date_of_birth`)
- ✅ Fixed passport registration schema errors
- **Status:** Ready for manual deployment

### 2. Frontend Fixes (Built & Ready)
- ✅ **Corporate Invoice/Voucher Email** - Fixed response handling
- ✅ **Invoice Dropdown Text** - Changed "View Invoice" → "Download Invoice"
- ✅ **Voucher Date Format** - Changed to dd/mm/yyyy
- ✅ **Passport Reports CSV** - Fixed broken export, now uses API
- ✅ **Passport Reports PDF** - Added new PDF download feature
- **Status:** Built and ready in `/dist` folder

---

## Built Files Verified

### Key Modified Components:
```
dist/assets/Invoices-B03fDRVh.js          24K  (Email fix + text change)
dist/assets/VouchersList-Ce9jzmmT.js      11K  (Date formatting)
dist/assets/PassportReports-UZ0z8kZI.js    7K  (CSV/PDF export)
```

### Required Libraries (Already Included):
```
dist/assets/jspdf.es.min-BU_k2izD.js      385K  ✅ jsPDF for PDF generation
dist/assets/jspdf.plugin.autotable-*.js    31K  ✅ PDF tables
dist/assets/xlsx-C2K9OxTh.js              283K  ✅ Excel export
```

**Total build size:** 853.95 kB (main bundle)
**Gzipped:** 256.95 kB

---

## Deployment Steps

### Backend Deployment (Manual - As Requested)

**File:** `backend/routes/buy-online.js`

```bash
# From your local terminal (already have SSH access):
scp -i ~/.ssh/nikolay backend/routes/buy-online.js eywasystems@72.61.208.79:/tmp/

# Then SSH and deploy:
ssh -i ~/.ssh/nikolay eywasystems@72.61.208.79
sudo -i

# Backup current file
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js.backup

# Deploy new file
mv /tmp/buy-online.js \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

chown eywademo-greenpay:eywademo-greenpay \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

# Restart API
pm2 restart greenpay-api

# Verify
pm2 logs greenpay-api --lines 50
```

### Frontend Deployment

**Option 1: Upload entire dist folder**
```bash
# From local terminal:
cd /Users/nikolay/github/greenpay
tar -czf dist.tar.gz dist/
scp -i ~/.ssh/nikolay dist.tar.gz eywasystems@72.61.208.79:/tmp/

# On server:
ssh -i ~/.ssh/nikolay eywasystems@72.61.208.79
sudo -i
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Backup current frontend
mv dist dist.backup-$(date +%Y%m%d-%H%M%S)

# Extract new build
tar -xzf /tmp/dist.tar.gz
chown -R eywademo-greenpay:eywademo-greenpay dist/
```

**Option 2: Use existing deployment script (if available)**
```bash
./deploy-frontend.sh
```

---

## Testing After Deployment

### Priority 1: Critical Features
- [ ] **Voucher Registration** - Test passport registration to voucher (fixes schema errors)
  - Go to payment success page
  - Register passport to voucher
  - Verify no "p.sex" or "updated_at" errors in PM2 logs

### Priority 2: Corporate Vouchers
- [ ] **Email Vouchers** - From Invoices page, email vouchers to customer
  - Should show success message
  - Customer should receive email with PDF
- [ ] **Download Vouchers** - Click download on invoice
  - Should download PDF without console errors
- [ ] **Invoice Dropdown** - Verify text says "Download Invoice" not "View Invoice"

### Priority 3: Voucher Dates
- [ ] **VouchersList Page** - Check all date columns
  - Valid Until: should be dd/mm/yyyy (e.g., 25/01/2026)
  - Used Date: should be dd/mm/yyyy
  - Created Date: should be dd/mm/yyyy
- [ ] **Export to Excel** - Download and verify date format in Excel

### Priority 4: Passport Reports
- [ ] **Navigate** to Reports > Passport Reports
- [ ] **Export Excel** - Click "Export Excel" button
  - Should download .xlsx file
  - Should include all passport data
  - Should respect date range filters
- [ ] **Download PDF** - Click "Download PDF" button
  - Should download PDF in landscape
  - Should show all columns
  - Should respect filters

---

## Rollback Plan

### Backend Rollback
```bash
# On server as root:
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js.backup \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

pm2 restart greenpay-api
```

### Frontend Rollback
```bash
# On server as root:
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
mv dist dist.failed
mv dist.backup-YYYYMMDD-HHMMSS dist  # Use most recent backup
```

---

## Documentation Files

All changes are documented in:

1. **BUY-ONLINE-SCHEMA-FIX.md** - Backend database schema fixes
2. **CORPORATE-VOUCHERS-FIXES.md** - Frontend corporate voucher & report fixes
3. **DEPLOYMENT-READY.md** - This file (deployment guide)

---

## Browser Cache Clearing

**IMPORTANT:** Users may need to clear browser cache to see changes:

**Chrome/Edge:**
- Windows: `Ctrl + Shift + Delete`
- Mac: `Cmd + Shift + Delete`
- Select "Cached images and files"

**Firefox:**
- Windows: `Ctrl + Shift + Delete`
- Mac: `Cmd + Shift + Delete`

**Or hard refresh:**
- Windows: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

---

## Success Criteria

Deployment is successful when:

✅ Backend
- Voucher registration works without schema errors
- No "p.sex" errors in PM2 logs
- No "updated_at" errors in PM2 logs

✅ Frontend
- Voucher emails send successfully
- Downloads work without errors
- Dates show as dd/mm/yyyy format
- Passport reports export to both Excel and PDF

---

**Deployed By:** Awaiting deployment
**Build By:** Claude Code Assistant
**Build Date:** January 25, 2026 08:35
**Status:** READY FOR DEPLOYMENT ✅
