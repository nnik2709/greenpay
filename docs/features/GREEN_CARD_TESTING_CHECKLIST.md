# GREEN CARD Template - Quick Testing Checklist

**Date:** January 8, 2026
**Database Migration:** ✅ Completed
**Backend Files:** Ready to upload

---

## Pre-Testing Setup

### Upload Files via CloudPanel File Manager

Upload these 3 files to the production server:

- [ ] `backend/utils/pdfGenerator.js` → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js`
- [ ] `backend/routes/invoices-gst.js` → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/invoices-gst.js`
- [ ] `backend/routes/vouchers.js` → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js`

### Restart Backend

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

- [ ] Backend restarted without errors
- [ ] No errors in PM2 logs

---

## Test 1: Unregistered Corporate Voucher

**Goal:** Verify vouchers show QR code, URL, and authorizing officer before passport registration

### Steps:
1. Login as **Finance Manager** at https://greenpay.eywademo.cloud
2. Navigate to **Quotations** → **Create New Quotation**
3. Fill in quotation details:
   - Company: "Test Company Ltd"
   - Number of vouchers: 3
   - Save quotation
4. Generate invoice from quotation
5. Record payment (mark as paid)
6. Generate vouchers
7. **Download ONE voucher PDF**

### Expected Results:
- [ ] CCDA logo centered at top
- [ ] "GREEN CARD" title in green
- [ ] Voucher code displayed prominently (e.g., "CORP12345678")
- [ ] CODE128 barcode visible and centered
- [ ] **QR code visible on left side**
- [ ] **Registration URL visible and clickable:** `https://greenpay.eywademo.cloud/register/{CODE}`
- [ ] **"Authorizing Officer: [Your Finance Manager Name]"** in footer
- [ ] **"Generated on [Month Day, Year, Time AM/PM]"** in footer
- [ ] **NO passport information displayed**

**Save the voucher code for Test 2:** ________________

---

## Test 2: Registered Corporate Voucher

**Goal:** Verify voucher updates after passport registration

### Steps:
1. Use the voucher code from Test 1
2. Navigate to: `https://greenpay.eywademo.cloud/register/{VOUCHER_CODE}`
3. Fill in passport registration form:
   - Passport Number: "N1234567"
   - Full Name: "John Test Smith"
   - Nationality: "Australia"
   - Date of Birth: "1990-01-15"
4. Submit registration
5. **Download the updated voucher PDF** from success page

### Expected Results:
- [ ] CCDA logo centered at top
- [ ] "GREEN CARD" title in green
- [ ] Voucher code displayed prominently
- [ ] CODE128 barcode visible and centered
- [ ] **Passport number displayed prominently: "N1234567"**
- [ ] **NO QR code visible**
- [ ] **NO registration URL visible**
- [ ] **"Authorizing Officer: [Finance Manager Name]" still in footer**
- [ ] **"Registered on [Month Day, Year, Time AM/PM]"** in footer (not "Generated on")

---

## Test 3: Individual Purchase Voucher

**Goal:** Verify individual purchases don't show authorizing officer

### Steps:
1. Logout (or use incognito window)
2. Navigate to **Individual Purchase** page (or public purchase page)
3. Fill in passport details:
   - Passport Number: "N9876543"
   - Full Name: "Jane Test Doe"
   - Nationality: "United States"
   - Date of Birth: "1985-05-20"
4. Complete payment (use test payment if available)
5. **Download voucher PDF** from success page

### Expected Results:
- [ ] CCDA logo centered at top
- [ ] "GREEN CARD" title in green
- [ ] Voucher code displayed prominently
- [ ] CODE128 barcode visible and centered
- [ ] **Passport number displayed prominently: "N9876543"**
- [ ] **NO QR code visible**
- [ ] **NO registration URL visible**
- [ ] **NO "Authorizing Officer" field in footer**
- [ ] **"Registered on [Month Day, Year, Time AM/PM]"** in footer

---

## Comparison Table

Use this to verify all three PDFs side-by-side:

| Element | Unregistered Corporate | Registered Corporate | Individual Purchase |
|---------|------------------------|---------------------|---------------------|
| QR Code | ✅ YES | ❌ NO | ❌ NO |
| Registration URL | ✅ YES | ❌ NO | ❌ NO |
| Passport Number | ❌ NO | ✅ YES | ✅ YES |
| Authorizing Officer | ✅ YES | ✅ YES | ❌ NO |
| Date Label | "Generated on" | "Registered on" | "Registered on" |

---

## Quick Verification Commands

### Check if backend is running:
```bash
pm2 list | grep greenpay-api
```

### Watch logs during testing:
```bash
pm2 logs greenpay-api --lines 100 --timestamp
```

### Check database migration:
```bash
sudo -u postgres psql -d greenpay_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'corporate_vouchers' AND column_name = 'created_by';"
```

---

## Troubleshooting

### If authorizing officer doesn't appear:
- Check PM2 logs for SQL errors
- Verify `created_by` column exists in database
- Check Finance Manager user ID is being passed correctly

### If QR code doesn't appear on unregistered vouchers:
- Check that `passport_number` is NULL in database
- Verify `generateVoucherPDFBuffer` function logic

### If passport doesn't appear on registered vouchers:
- Check registration was successful
- Verify `passport_number` column is populated in database
- Check voucher status changed to 'active'

### Check voucher in database:
```bash
sudo -u postgres psql -d greenpay_db -c "SELECT voucher_code, passport_number, status, created_by, registered_at FROM corporate_vouchers WHERE voucher_code = 'YOUR_CODE_HERE';"
```

---

## Success Criteria

All tests pass when:
- [ ] Test 1: Unregistered corporate voucher shows QR code, URL, and authorizing officer
- [ ] Test 2: Registered corporate voucher shows passport and authorizing officer (no QR/URL)
- [ ] Test 3: Individual purchase shows passport WITHOUT authorizing officer
- [ ] Date formats are correct: "January 8, 2026, 10:30 AM"
- [ ] No errors in PM2 logs during testing
- [ ] All existing voucher functionality still works

---

## After Testing

Once all tests pass:
- [ ] Mark deployment as successful
- [ ] Archive old test vouchers if needed
- [ ] Document any issues found
- [ ] Update team on new authorizing officer feature

**Testing completed by:** ________________
**Date:** ________________
**Result:** ☐ PASS  ☐ FAIL (details: _________________)
