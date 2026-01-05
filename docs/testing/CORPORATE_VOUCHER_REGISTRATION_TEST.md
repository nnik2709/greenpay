# Corporate Voucher Registration Flow - Manual Test Guide

## Test Objective
Verify the complete flow from corporate voucher generation (without passport) through customer registration.

---

## Prerequisites
- Access to https://greenpay.eywademo.cloud
- Login credentials for Counter_Agent or Flex_Admin
- A test customer in the system
- Optional: Mobile phone for camera scanner testing

---

## Test Flow

### 🏢 STEP 1: Create Corporate Invoice & Generate Vouchers

**Expected Result:** Vouchers created with status `pending_passport` and no passport number

1. **Login** to https://greenpay.eywademo.cloud
   - Email: `agent@greenpay.pg`
   - Password: `Agent123!`

2. **Navigate** to Corporate Exit Pass
   - Menu → Corporate Exit Pass
   - URL: `/app/corporate-exit-pass`

3. **Create Invoice**
   - Select a customer (or create new test customer)
   - Set number of vouchers: **2** (for testing)
   - Total amount should auto-calculate: **PGK 100.00** (2 × 50)
   - Set valid until: **30 days from today**
   - Click **"Create Invoice"**

4. **Record Invoice Details**
   ```
   Invoice Number: _____________________ (e.g., INV-1234)
   Customer Name: ______________________
   Total Amount: PGK __________________
   ```

5. **Mark as Paid**
   - Click **"Mark as Paid"**
   - Wait for confirmation: "Invoice Paid"

6. **Generate Vouchers**
   - Click **"Generate Vouchers"**
   - Wait for confirmation: "Vouchers Generated Successfully"

7. **Record Voucher Codes**
   ```
   Voucher 1: _____________________ (8 characters, e.g., 3IEW5268)
   Voucher 2: _____________________ (8 characters)
   ```

8. **Verify Voucher Format**
   - [ ] Voucher code is exactly 8 characters
   - [ ] Contains only uppercase letters and numbers
   - [ ] No special characters or hyphens

---

### 📥 STEP 2: Download & Check PENDING Voucher PDF

**Expected Result:** PDF shows registration link, NOT passport number

1. **Download Vouchers PDF**
   - Click **"Download Vouchers PDF"**
   - PDF should download: `Vouchers-INV-XXXX.pdf`

2. **Open PDF and Verify Content**
   - [ ] **CCDA logo** centered at top
   - [ ] **Voucher code** displayed prominently (e.g., 3IEW5268)
   - [ ] **"Scan to Register"** section visible
   - [ ] **Registration URL** shown: `https://greenpay.eywademo.cloud/register/[CODE]`
   - [ ] **NO passport number** displayed
   - [ ] QR/Barcode present
   - [ ] Company name shown
   - [ ] Amount shown (PGK 50.00)
   - [ ] Valid until date shown

3. **Take Screenshot**
   - Save as: `pending-voucher-pdf-screenshot.png`

---

### 🔍 STEP 3: Verify Database Status (Optional - Server Access)

**Expected Result:** Voucher record has `status='pending_passport'` and `passport_number=NULL`

If you have server access, run this query in your SSH terminal:

```sql
PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -c "
SELECT
  voucher_code,
  company_name,
  status,
  passport_number,
  passport_id,
  valid_until,
  invoice_id
FROM corporate_vouchers
WHERE voucher_code = 'YOUR_VOUCHER_CODE_HERE'
ORDER BY created_at DESC
LIMIT 1;
"
```

**Expected output:**
```
voucher_code | company_name     | status            | passport_number | passport_id | valid_until | invoice_id
-------------|------------------|-------------------|-----------------|-------------|-------------|------------
3IEW5268     | Test Company Inc | pending_passport  | NULL            | NULL        | 2025-XX-XX  | 123
```

---

### 👤 STEP 4: Register Passport to Voucher

**Expected Result:** Successfully register passport, voucher becomes active

1. **Navigate to Registration Page**
   - URL: `https://greenpay.eywademo.cloud/app/voucher-registration`
   - Or Menu → Voucher Registration

2. **Verify Page Elements**
   - [ ] Step indicator showing 3 steps
   - [ ] Step 1: Enter Code (active)
   - [ ] Input field for voucher code
   - [ ] "Find Voucher" button

3. **Enter Voucher Code**
   - Paste your voucher code from Step 1: `_____________________`
   - Click **"Find Voucher"**

4. **Verify Voucher Details**
   - Wait for Step 2 to appear
   - [ ] Company name displayed correctly
   - [ ] Amount shown: PGK 50.00
   - [ ] Valid until date shown
   - [ ] Status shown: "Pending Passport"

5. **Choose Registration Method**

   **Option A: Manual Entry** (Recommended for testing)
   - Scroll to manual entry form (below scanner buttons)
   - Fill in test passport data:
     ```
     Passport Number: TEST123456
     Surname: TESTUSER
     Given Name: JOHN
     Nationality: Papua New Guinea
     Date of Birth: 1990-01-01
     Sex: Male
     Passport Expiry: 2030-12-31
     ```

   **Option B: Camera Scanner** (Mobile/Desktop with webcam)
   - Click **"Scan Passport with Camera"**
   - Allow camera permissions
   - Point camera at passport MRZ (bottom 2 lines)
   - Wait for auto-fill

   **Option C: USB Scanner** (Desktop with hardware scanner)
   - Scanner indicator should show "Hardware Scanner Active"
   - Scan passport MRZ with USB scanner
   - Fields auto-fill

6. **Submit Registration**
   - Click **"Register Voucher"** button
   - Wait for processing (should be < 2 seconds)

7. **Verify Success Screen**
   - [ ] Step 3: Complete (green checkmark)
   - [ ] Success message: "Registration Successful!"
   - [ ] Voucher code displayed
   - [ ] Status: **"✓ ACTIVE"**
   - [ ] Passport number displayed: TEST123456
   - [ ] Valid until date shown
   - [ ] Action buttons visible:
     - Print Voucher
     - Email Voucher
     - Download PDF

8. **Take Screenshot**
   - Save as: `registration-success-screenshot.png`

---

### 📥 STEP 5: Download & Check ACTIVE Voucher PDF

**Expected Result:** PDF now shows passport number, NOT registration link

1. **Download Active Voucher PDF**
   - From success screen, click **"Download PDF"**
   - Or navigate to Vouchers List and download from there
   - PDF should download: `voucher-3IEW5268.pdf`

2. **Open PDF and Verify Content**
   - [ ] **CCDA logo** centered at top
   - [ ] **Voucher code** displayed (same as before)
   - [ ] **"Passport Number"** section visible
   - [ ] **Passport number** shown: **TEST123456**
   - [ ] **NO registration link or "Scan to Register"** text
   - [ ] QR/Barcode present
   - [ ] Company name shown
   - [ ] Amount shown (PGK 50.00)
   - [ ] Valid until date shown

3. **Compare PDFs**
   - Open both PDFs side-by-side:
     - `Vouchers-INV-XXXX.pdf` (pending - from Step 2)
     - `voucher-3IEW5268.pdf` (active - from Step 5)
   - [ ] Pending PDF shows registration link
   - [ ] Active PDF shows passport number
   - [ ] Both have CCDA logo centered
   - [ ] Both have same voucher code
   - [ ] Layout is otherwise identical

4. **Take Screenshot**
   - Save as: `active-voucher-pdf-screenshot.png`

---

### 🔍 STEP 6: Verify Database Update (Optional - Server Access)

**Expected Result:** Voucher record now has `status='active'` and `passport_number='TEST123456'`

Run this query in your SSH terminal:

```sql
PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -c "
SELECT
  voucher_code,
  company_name,
  status,
  passport_number,
  passport_id,
  registered_at,
  valid_until
FROM corporate_vouchers
WHERE voucher_code = 'YOUR_VOUCHER_CODE_HERE'
ORDER BY created_at DESC
LIMIT 1;
"
```

**Expected output:**
```
voucher_code | company_name     | status | passport_number | passport_id | registered_at       | valid_until
-------------|------------------|--------|-----------------|-------------|---------------------|-------------
3IEW5268     | Test Company Inc | active | TEST123456      | 789         | 2025-12-16 14:30:00 | 2025-XX-XX
```

**Verify:**
- [ ] `status` changed from `pending_passport` to `active`
- [ ] `passport_number` changed from `NULL` to `TEST123456`
- [ ] `passport_id` is no longer NULL
- [ ] `registered_at` timestamp is set

---

### 🧪 STEP 7: Test Second Voucher (Same Passport)

**Expected Result:** Can register different passport to second voucher

1. **Use Second Voucher Code** from Step 1
   - Voucher 2: `_____________________`

2. **Repeat Steps 4-5** with different passport data:
   ```
   Passport Number: TEST999999
   Surname: TESTUSER2
   Given Name: JANE
   ```

3. **Verify:**
   - [ ] Registration successful
   - [ ] Different passport number shown in PDF
   - [ ] Both vouchers now active

---

### 🚨 STEP 8: Test Error Conditions

**Expected Result:** Proper error messages for invalid scenarios

1. **Test: Invalid Voucher Code**
   - Go to registration page
   - Enter: `INVALID1`
   - Click Find Voucher
   - [ ] Error: "Voucher not found" or "Invalid code format"

2. **Test: Already Registered Voucher**
   - Try to register the first voucher again (from Step 4)
   - [ ] Message: "Voucher already registered to passport TEST123456"
   - [ ] Skips to success screen automatically
   - [ ] Shows existing passport number

3. **Test: Expired Voucher** (If you have one)
   - Use an expired voucher code
   - [ ] Error: "This voucher has expired"

4. **Test: Missing Required Fields**
   - Enter voucher code
   - Leave passport number empty
   - Try to submit
   - [ ] Error: "Passport number is required"

---

## ✅ Test Results Summary

### Test Environment
- Date: _______________
- Tester: _______________
- Environment: Production / Staging (circle one)

### Results Checklist

**Step 1: Invoice & Voucher Generation**
- [ ] Invoice created successfully
- [ ] Invoice marked as paid
- [ ] Vouchers generated (2 vouchers)
- [ ] Voucher codes are 8-character alphanumeric

**Step 2: Pending Voucher PDF**
- [ ] PDF downloaded successfully
- [ ] Shows registration link
- [ ] Does NOT show passport number
- [ ] CCDA logo centered
- [ ] QR code present

**Step 3: Database Verification**
- [ ] Status: `pending_passport`
- [ ] Passport number: `NULL`

**Step 4: Passport Registration**
- [ ] Registration page loaded
- [ ] Voucher lookup successful
- [ ] Passport data entry worked (manual/camera/scanner)
- [ ] Registration submitted successfully
- [ ] Success screen displayed

**Step 5: Active Voucher PDF**
- [ ] PDF downloaded successfully
- [ ] Shows passport number
- [ ] Does NOT show registration link
- [ ] CCDA logo centered
- [ ] QR code present

**Step 6: Database Update**
- [ ] Status: `active`
- [ ] Passport number: populated
- [ ] Registration timestamp set

**Step 7: Multiple Vouchers**
- [ ] Second voucher registered successfully
- [ ] Different passport accepted

**Step 8: Error Handling**
- [ ] Invalid code rejected
- [ ] Already registered voucher handled
- [ ] Missing fields validation works

### Overall Result
- [ ] **PASS** - All steps completed successfully
- [ ] **FAIL** - Issues found (list below)

### Issues Found
```
Issue 1: _______________________________________________________________

Issue 2: _______________________________________________________________

Issue 3: _______________________________________________________________
```

### Screenshots Captured
- [ ] `pending-voucher-pdf-screenshot.png`
- [ ] `registration-success-screenshot.png`
- [ ] `active-voucher-pdf-screenshot.png`

---

## 📊 Performance Notes

**Voucher Generation Time:** _______ seconds
**PDF Download Time (pending):** _______ seconds
**Registration Processing Time:** _______ seconds
**PDF Download Time (active):** _______ seconds

**Expected Performance:**
- Voucher generation: < 5 seconds for 2 vouchers
- PDF download: < 3 seconds (instant, no 15-20 second delay)
- Registration: < 2 seconds

---

## 💡 Additional Features to Test (Optional)

### Bulk Registration via CSV
1. Create CSV file with voucher codes + passport data
2. Use bulk registration API endpoint
3. Verify all vouchers registered

### Email Notifications
1. Click "Email Voucher" button on success screen
2. Check if email sent
3. Verify PDF attachment

### Camera Scanner (Mobile)
1. Open registration page on mobile device
2. Use phone camera to scan passport MRZ
3. Verify auto-fill works

### USB Scanner (Desktop)
1. Connect USB keyboard wedge scanner
2. Verify "Hardware Scanner Active" indicator
3. Scan passport MRZ
4. Verify auto-fill works

---

## 🐛 Common Issues & Solutions

**Issue:** Voucher code not found
**Solution:** Verify you copied the exact code, including uppercase/lowercase

**Issue:** PDF shows old content (registration link when it should show passport)
**Solution:** Browser cache - do hard refresh (Ctrl+Shift+R) or clear cache

**Issue:** Camera scanner not working
**Solution:** Check browser permissions for camera access

**Issue:** Registration fails with database error
**Solution:** Check passport data format, ensure passport number doesn't have special characters

**Issue:** PDF download gives 404 error
**Solution:** Ensure voucher exists and session is valid

---

## 📝 Notes

Use this space for additional observations:

```
___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________
```

---

**Test completed by:** _____________________ **Date:** _______________
