# GreenPay Deployment Package - January 25, 2026

## Build Status: ✅ SUCCESS

**Build completed in:** 6.33 seconds
**Build timestamp:** January 25, 2026
**Package location:** `/Users/nikolay/github/greenpay/deployment-package/`

---

## 📦 Files in This Package

### 1. Frontend Build
- **dist.tar.gz** (compressed frontend build - all fixes including quotation email)

### 2. Backend Files (Already Deployed)
- **buy-online.js** (payment_method standardization: ONLINE, CASH, POS, BANK TRANSFER)
- **payment-webhook-doku.js** (added payment_method column for DOKU payments)
- **public-purchases.js** (payment_method standardization)
- **notificationService.js** (SMTP_FROM fix + enhanced logging)

### 3. Database Migrations (Already Run)
- **fix-null-payment-method.sql** (migrated 50 records successfully)

### 4. Documentation
- **QUOTATION-EMAIL-FIX.md** (detailed analysis of quotation email bug and fix)

---

## 🔧 All Fixes Included

### Critical Fixes (This Deployment)

✅ **QUOTATION EMAIL SENDING** ⭐ MAJOR FIX
- **Root Cause:** Frontend was calling wrong endpoint (`/mark-sent` instead of `/send-email`)
- **Fix:** Updated frontend to call correct email-sending endpoint
- **Impact:** Quotation emails will now actually be sent via SMTP
- **Files Changed:**
  - `src/lib/quotationWorkflowService.js` - Added sendQuotationEmail function
  - `src/pages/Quotations.jsx` - Updated to call sendQuotationEmail endpoint
- **Details:** See QUOTATION-EMAIL-FIX.md

✅ **PASSPORT REPORTS - PDF EXPORT**
- **Root Cause:** Wrong import syntax for jspdf-autotable
- **Fix:** Changed to correct import and usage pattern
- **Files Changed:** `src/pages/reports/PassportReports.jsx`

✅ **PASSPORT REPORTS - REMOVED SEX & DOB COLUMNS**
- **Removed from:** Table display, Excel export, PDF export
- **Files Changed:** `src/pages/reports/PassportReports.jsx`

✅ **CUSTOMER FORM - PROVINCE → COUNTRY**
- **Changed:** Province field to Country (international customers)
- **Fixed:** Validation to actually prevent empty submissions
- **Files Changed:** `src/components/AddCustomerDialog.jsx`

### Backend Fixes (Already Deployed Earlier)

✅ **PAYMENT METHOD STANDARDIZATION**
- **Values:** CASH, POS, ONLINE, BANK TRANSFER (not "Card", "VISA", etc.)
- **Files:** buy-online.js, payment-webhook-doku.js, public-purchases.js

✅ **PAYMENT METHOD NULL VALUES**
- **Fixed:** DOKU webhook was missing payment_method column
- **Database Migration:** Migrated 50 existing records successfully
  - 51% ONLINE
  - 46% CASH
  - 3% POS

✅ **EMAIL SMTP CONFIGURATION**
- **Fixed:** All email functions now use SMTP_FROM correctly
- **Added:** Enhanced logging for debugging email issues
- **Files:** backend/services/notificationService.js

✅ **VOUCHER REGISTRATION SCHEMA**
- **Fixed:** Removed non-existent columns (sex, date_of_birth, updated_at)
- **Files:** buy-online.js

✅ **PDF GENERATOR**
- **QR Voucher Layout:** Fixed overlapping text
- **Thermal Receipt:** Added K currency format, all required fields
- **Files:** pdfGenerator.js

### Frontend Fixes (Previous Deployments)

✅ **Corporate Invoice/Voucher Email** - Fixed response.data.message access
✅ **Invoice Dropdown** - Changed "View Invoice" → "Download Invoice"
✅ **Voucher Dates** - All dates show dd/mm/yyyy format
✅ **Passport Reports CSV** - Fixed broken export, generates .xlsx

---

## 🚀 Deployment Instructions

### FRONTEND DEPLOYMENT ONLY (Backend Already Deployed)

```bash
# From your local machine:
scp deployment-package/dist.tar.gz root@165.22.52.100:/tmp/

# SSH to server:
ssh root@165.22.52.100

# Navigate to application directory
cd /var/www/greenpay

# Backup current frontend
tar -czf frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/

# Remove old frontend
rm -rf dist/

# Extract new build
tar -xzf /tmp/dist.tar.gz

# Set ownership
chown -R root:root dist/

# Clean up
rm /tmp/dist.tar.gz

# Verify deployment
ls -lh dist/
```

### Browser Cache Clear (IMPORTANT!)

After deployment, users must clear browser cache:
- **Windows:** Ctrl + Shift + Delete
- **Mac:** Cmd + Shift + Delete
- Or use hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)

---

## ✅ Post-Deployment Testing

### Priority 1: Quotation Email (CRITICAL - NEW FIX)

**Test Steps:**
1. Go to https://greenpay.eywademo.cloud/app/quotations
2. Select any quotation
3. Click "Send Email" button
4. Enter test email address
5. Click "Send Email"
6. Check PM2 logs immediately: `pm2 logs greenpay-api --lines 50`

**Expected Results:**
```
✅ Quotation PDF generated successfully, size: 45231 bytes
✅ SMTP connection verified
📧 Attempting to send quotation email...
   To: test@example.com
   From: "PNG Green Fees System" <noreply@greenpay.eywademo.cloud>
   Subject: Quotation Q-2026-XXX - Customer Name
   Has PDF: true
✅ Quotation email sent successfully!
   Recipient: test@example.com
   Message ID: <abc123@smtp-relay.brevo.com>
   Response: 250 2.0.0 Ok: queued as ABC123

# API endpoint should be:
"POST /api/quotations/send-email HTTP/1.1" 200
```

**Success Criteria:**
- [ ] Email arrives in inbox (or spam folder)
- [ ] PDF attached to email
- [ ] Logs show correct endpoint: POST /api/quotations/send-email
- [ ] Logs show SMTP success message with Message ID
- [ ] Quotation status updates to "sent"

### Priority 2: Passport Reports

**Test Steps:**
1. Go to https://greenpay.eywademo.cloud/app/reports/passports
2. Verify Sex and DOB columns are removed from table
3. Click "Export Excel" - verify download works
4. Click "Download PDF" - verify download works
5. Open exported files - verify Sex and DOB columns not present

**Success Criteria:**
- [ ] Table only shows: Type, Nationality, Passport No, Surname, Given Name, Expiry Date
- [ ] Excel export works and excludes Sex/DOB
- [ ] PDF export works and excludes Sex/DOB

### Priority 3: Customer Creation

**Test Steps:**
1. Go to https://greenpay.eywademo.cloud/app/quotations/create
2. Click "Create New Customer"
3. Verify form shows "Country" field (not "Province")
4. Try to submit with empty Name - should show error and NOT create
5. Try to submit with empty Address - should show error and NOT create
6. Fill all required fields - should create successfully

**Success Criteria:**
- [ ] Form shows "Country" field
- [ ] Empty Name prevents submission with error message
- [ ] Empty Address prevents submission with error message
- [ ] Valid data creates customer successfully

### Priority 4: Payment Methods

**Test Steps:**
1. Go to https://greenpay.eywademo.cloud/app/payments
2. Verify all payment methods show as: ONLINE, CASH, POS, or BANK TRANSFER
3. No "N/A" values should appear
4. No "Card" or "VISA" values should appear

**Success Criteria:**
- [ ] All records show standardized payment methods
- [ ] No NULL or "N/A" values
- [ ] Online payments show as "ONLINE"

### Priority 5: Voucher Registration & PDFs

**Test Steps:**
1. Complete online voucher purchase
2. Register passport to voucher
3. Download voucher PDF
4. Verify thermal receipt format includes:
   - Travel Document Number
   - Coupon Number label
   - K50.00 format for amount
   - Payment Mode

**Success Criteria:**
- [ ] No database errors in PM2 logs
- [ ] Voucher registration completes
- [ ] PDF generates correctly
- [ ] All fields display properly

---

## 🔄 Rollback Instructions

### Frontend Rollback

```bash
# On server:
ssh root@165.22.52.100
cd /var/www/greenpay

# Find the backup (shows all backups sorted by date)
ls -lt frontend-backup-*.tar.gz | head -5

# Rollback to specific backup
rm -rf dist
tar -xzf frontend-backup-YYYYMMDD-HHMMSS.tar.gz
```

**Note:** Backend files were already deployed and tested in previous session. If rollback needed, refer to previous deployment documentation.

---

## 📊 Change Summary

### This Deployment (Frontend Only)

| Component | Change | Files Modified |
|-----------|--------|----------------|
| Quotation Email | Fixed endpoint call to actually send email | quotationWorkflowService.js, Quotations.jsx |
| Passport Reports | Removed Sex/DOB columns from table and exports | PassportReports.jsx |
| Passport Reports | Fixed PDF export (jspdf-autotable import) | PassportReports.jsx |
| Customer Form | Province → Country, fixed validation | AddCustomerDialog.jsx |

### Previous Deployments (Backend - Already Live)

| Component | Change | Status |
|-----------|--------|--------|
| Payment Methods | Standardized to CASH/POS/ONLINE/BANK TRANSFER | ✅ Deployed & Tested |
| Database | Migrated 50 records to correct payment_method | ✅ Completed |
| Email SMTP | Fixed SMTP_FROM in all email functions | ✅ Deployed |
| Logging | Enhanced email debugging logs | ✅ Deployed |

---

## 🎯 Success Criteria

Deployment is successful when:

✅ **Quotation Emails**
- Emails actually arrive in recipient inbox
- Logs show correct endpoint: POST /api/quotations/send-email
- PDF attached to email
- No SMTP errors in logs

✅ **Passport Reports**
- Sex and DOB columns removed from all views
- Excel export works
- PDF export works

✅ **Customer Form**
- Shows "Country" field
- Validation prevents empty submissions
- Customers can be created successfully

✅ **No Regressions**
- Payment methods still show correctly
- Voucher registration still works
- Invoice emails still work
- All date formats still dd/mm/yyyy

---

## 🐛 Known Issues Resolved

1. ~~Quotation emails not being sent~~ ✅ FIXED - Frontend now calls correct endpoint
2. ~~autoTable is not a function error~~ ✅ FIXED - Correct import syntax
3. ~~Payment method showing N/A~~ ✅ FIXED - Database migrated
4. ~~Customer validation not working~~ ✅ FIXED - Proper trim() validation
5. ~~Wrong SMTP sender address~~ ✅ FIXED - All functions use SMTP_FROM

---

## 📞 Support

If issues occur after deployment:

1. **Check PM2 logs:** `pm2 logs greenpay-api --lines 100`
2. **Check frontend console:** Browser DevTools → Console
3. **Clear browser cache:** Force refresh (Ctrl+F5 / Cmd+Shift+R)
4. **Rollback if critical:** Follow rollback instructions above

---

**Package Created:** January 25, 2026
**Build Time:** 6.33 seconds
**Created By:** Claude Code Assistant
**Status:** ✅ READY FOR DEPLOYMENT

**IMPORTANT:** This deployment contains the critical fix for quotation email sending. After deployment, test quotation emails immediately and monitor PM2 logs to verify the fix is working correctly.
