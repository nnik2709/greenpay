# 🚀 Production Verification Checklist

After deploying the email voucher functionality and updated PDF template, use this checklist to verify everything works correctly.

---

## ✅ Part 1: Email Voucher Functionality (5 minutes)

### Prerequisites
- You already have a registered corporate voucher (from previous test)
- Or create a new one following QUICK_MANUAL_TEST.md

### Test Steps

1. **Navigate to Registration Success Page**
   - URL: `https://greenpay.eywademo.cloud/voucher-registration`
   - Enter voucher code from your test: `________________`
   - Click "Find Voucher"
   - Should show "Active" status with green checkmark

2. **Test Email Dialog**
   - [ ] Click "Email Voucher" button
   - [ ] Dialog appears with title "Email Voucher"
   - [ ] Input field labeled "Email Address" is visible
   - [ ] Placeholder text shows "customer@example.com"

3. **Test Email Validation**
   - [ ] Enter invalid email: `test` (no @ or domain)
   - [ ] Click "Send Email"
   - [ ] Error message appears: "Invalid Email" or "Please enter a valid email address"
   - [ ] Button returns to enabled state

4. **Send Real Email**
   - [ ] Enter your actual email: `________________`
   - [ ] Click "Send Email"
   - [ ] Button shows "Sending..." state
   - [ ] Success toast appears: "Email sent successfully"
   - [ ] Dialog closes automatically

5. **Check Email Delivery**
   - [ ] Check your inbox (within 1-2 minutes)
   - [ ] Email subject: "Your GREEN CARD Voucher - [VOUCHER_CODE]"
   - [ ] Email from: `noreply@greenpay.pg` or configured sender
   - [ ] Email body shows:
     - Greeting
     - Voucher code
     - Passport number
     - Company name
     - Amount (PGK)
   - [ ] PDF attachment present: `voucher-[CODE].pdf`

6. **Verify PDF Attachment**
   - [ ] Download PDF from email
   - [ ] Open PDF - should display correctly
   - [ ] CCDA logo centered at top (not two logos side-by-side)
   - [ ] Logo size appropriate (~104pt width)
   - [ ] Barcode/QR code NOT skewed or corrupted
   - [ ] Shows passport number (not registration link)
   - [ ] All voucher details visible: code, company, amount, dates

---

## ✅ Part 2: PDF Template Quality (3 minutes)

### Test Download Button

1. **From Registration Success Page**
   - [ ] Click "Download PDF" button
   - [ ] PDF downloads successfully
   - [ ] Filename: `voucher-[CODE].pdf`

2. **Verify PDF Content**
   - [ ] CCDA logo centered (not PNG flag)
   - [ ] Logo size looks good (bigger than before)
   - [ ] Passport Number section visible
   - [ ] Passport number displayed correctly
   - [ ] NO registration link or "Scan to Register" text
   - [ ] Barcode renders cleanly (not corrupted)
   - [ ] QR code not skewed
   - [ ] All text readable and properly aligned

---

## ✅ Part 3: Pending Voucher PDF (3 minutes)

### Test Corporate Voucher Before Registration

1. **Create New Corporate Vouchers**
   - Go to: `https://greenpay.eywademo.cloud/app/payments/corporate-exit-pass`
   - Create invoice with 1 voucher
   - Mark as paid
   - Generate vouchers
   - Copy voucher code: `________________`

2. **Download Pending Voucher**
   - [ ] Click "Download Vouchers PDF" from the corporate exit pass page
   - [ ] PDF downloads successfully

3. **Verify Pending PDF Content**
   - [ ] CCDA logo centered at top
   - [ ] Logo size appropriate
   - [ ] Shows "Scan to Register" text
   - [ ] Shows registration URL: `https://greenpay.eywademo.cloud/register/[CODE]`
   - [ ] QR code for registration URL
   - [ ] NO passport number section
   - [ ] Company name displayed
   - [ ] Amount displayed
   - [ ] Valid dates displayed

---

## ✅ Part 4: Email Multiple Vouchers (5 minutes)

### Test Individual Email for Each Voucher

1. **Create Multiple Corporate Vouchers**
   - Create invoice with 3 vouchers
   - Mark as paid, generate vouchers
   - Copy all 3 voucher codes:
     ```
     Voucher 1: ________________
     Voucher 2: ________________
     Voucher 3: ________________
     ```

2. **Register 3 Different Passports**
   - Register Voucher 1 with passport: `TEST001`
   - Register Voucher 2 with passport: `TEST002`
   - Register Voucher 3 with passport: `TEST003`

3. **Email Each Voucher Separately**
   - [ ] Email Voucher 1 to: `email1@example.com`
   - [ ] Email Voucher 2 to: `email2@example.com`
   - [ ] Email Voucher 3 to: `email3@example.com`

4. **Verify Each Email**
   - [ ] Email 1 contains PDF with passport `TEST001`
   - [ ] Email 2 contains PDF with passport `TEST002`
   - [ ] Email 3 contains PDF with passport `TEST003`
   - [ ] Each email shows correct company name
   - [ ] Each PDF has unique voucher code

---

## ✅ Part 5: Backend Routes (2 minutes)

### Verify New Routes Work

1. **Test Download Route Directly**
   - Get voucher ID from database or URL
   - Open: `https://greenpay.eywademo.cloud/api/vouchers/download/[ID]`
   - [ ] PDF downloads automatically
   - [ ] No 404 error
   - [ ] No authentication issues

2. **Check Backend Logs (if accessible)**
   - [ ] PM2 logs show no errors: `pm2 logs png-green-fees --lines 50`
   - [ ] No "Route not found" errors
   - [ ] No PDF generation errors

---

## 🎯 Summary

### Expected Results

| Feature | Status | Notes |
|---------|--------|-------|
| Email dialog appears | ✅ |  |
| Email validation works | ✅ |  |
| Email sends successfully | ✅ |  |
| PDF attachment received | ✅ |  |
| PDF shows correct passport | ✅ |  |
| CCDA logo centered | ✅ |  |
| Logo size appropriate | ✅ |  |
| QR code not skewed | ✅ |  |
| Pending voucher shows registration link | ✅ |  |
| Active voucher shows passport | ✅ |  |
| Individual emails for each voucher | ✅ |  |
| Download route works | ✅ |  |

---

## 🔧 Troubleshooting

### If Email Not Received
1. Check spam/junk folder
2. Verify SMTP credentials in `.env` on server
3. Check PM2 logs: `pm2 logs png-green-fees | grep -i email`
4. Test SMTP connection from server

### If PDF Shows Old Template
1. Verify `pdfGenerator.js` deployed to production
2. Check file timestamp: `ls -lh backend/utils/pdfGenerator.js`
3. Restart PM2: `pm2 restart png-green-fees`
4. Clear browser cache and retry

### If QR Code Still Skewed
1. Check `pdfGenerator.js` has latest barcode generation code
2. Verify bwip-js package installed: `npm list bwip-js`
3. Check barcode generation logs in console

### If Download 404 Error
1. Verify `vouchers.js` has new routes
2. Check route definitions: `grep -n "download/:id" backend/routes/vouchers.js`
3. Restart backend: `pm2 restart png-green-fees`

---

## 📊 Deployment Files Changed

These files should be on production:

1. ✅ `backend/routes/vouchers.js`
   - Added: `GET /api/vouchers/download/:id`
   - Added: `POST /api/vouchers/email-single/:id`

2. ✅ `backend/utils/pdfGenerator.js`
   - Unified GREEN CARD template
   - Centered CCDA logo (104pt)
   - Conditional passport/registration logic

3. ✅ `dist/assets/CorporateVoucherRegistration-[hash].js`
   - Email dialog functionality
   - Email validation
   - API call to `/api/vouchers/email-single/:id`

---

## ⏱️ Total Verification Time: ~20 minutes

Once complete, all voucher PDF generation should use the unified GREEN CARD template with proper logos, and users can email individual vouchers to their own email addresses after registration.

---

## 📝 Notes Section

Use this space to record any issues found:

```
Issue 1:
_______________________________
_______________________________

Issue 2:
_______________________________
_______________________________

Issue 3:
_______________________________
_______________________________
```
