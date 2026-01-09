# How to Test GREEN CARD Template - Step by Step

## Prerequisites

Before testing, make sure:
- [ ] Database migration completed (created_by column added)
- [ ] 3 backend files uploaded via CloudPanel
- [ ] Backend restarted: `pm2 restart greenpay-api`
- [ ] No errors in logs: `pm2 logs greenpay-api --lines 20`

---

## TEST 1: Unregistered Corporate Voucher
**Goal:** See QR code, registration URL, and authorizing officer name

### Step-by-Step:

1. **Login to the system**
   - Go to: https://greenpay.eywademo.cloud
   - Login as **Finance Manager**
   - Username: (your finance manager account)
   - Password: (your password)

2. **Create a Quotation**
   - Click **"Quotations"** in the menu
   - Click **"Create New Quotation"** button
   - Fill in the form:
     ```
     Company Name: Test Company ABC
     Contact Person: John Smith
     Email: test@company.com
     Phone: +675 12345678
     Number of Vouchers: 3
     Unit Price: 100.00
     Notes: Testing GREEN CARD template
     ```
   - Click **"Create Quotation"**

3. **Generate Invoice**
   - Find the quotation you just created
   - Click **"Generate Invoice"** button
   - Confirm the invoice details

4. **Record Payment**
   - On the invoice page, click **"Mark as Paid"** or **"Record Payment"**
   - Payment Method: Cash (or any method)
   - Amount: (should auto-fill with total)
   - Click **"Confirm Payment"**

5. **Generate Vouchers**
   - After payment, you should see **"Generate Vouchers"** button
   - Click it to create the vouchers
   - System will create 3 vouchers

6. **Download ONE Voucher**
   - You'll see a list of 3 vouchers generated
   - Click **"Download PDF"** on the FIRST voucher
   - **SAVE THIS VOUCHER CODE** - you'll need it for Test 2!
   - Example code: `CORP12345678`

7. **Open the PDF and Check:**
   - [ ] CCDA logo at top (centered)
   - [ ] "GREEN CARD" title in green color
   - [ ] Voucher code shown (e.g., CORP12345678)
   - [ ] Barcode visible
   - [ ] **QR CODE on left side** ✓
   - [ ] **Registration URL showing:** `https://greenpay.eywademo.cloud/register/CORP12345678` ✓
   - [ ] **Bottom left says:** "Authorizing Officer: [Your Name]" ✓
   - [ ] **Bottom right says:** "Generated on January 8, 2026, 10:30 AM" ✓
   - [ ] **NO passport number shown** ✓

**SAVE THE VOUCHER CODE:** _________________

---

## TEST 2: Registered Corporate Voucher
**Goal:** See passport number, NO QR code, still shows authorizing officer

### Step-by-Step:

1. **Open Registration Page**
   - Use the voucher code from Test 1
   - Go to: `https://greenpay.eywademo.cloud/register/CORP12345678`
   - (Replace `CORP12345678` with your actual code)

2. **Fill in Passport Details**
   ```
   Passport Number: N1234567
   Full Name: John Test Smith
   Nationality: Australia
   Date of Birth: 1990-01-15
   Gender: Male
   ```
   - Click **"Register Passport"** or **"Submit"**

3. **Download Updated Voucher**
   - After successful registration, you'll see a success message
   - Click **"Download Voucher"** button on the success page
   - OR go back to the invoice/voucher list and download again

4. **Open the PDF and Check:**
   - [ ] CCDA logo at top (centered)
   - [ ] "GREEN CARD" title in green color
   - [ ] Voucher code shown (same code)
   - [ ] Barcode visible
   - [ ] **Passport number displayed:** "N1234567" ✓
   - [ ] **NO QR code** ✓
   - [ ] **NO registration URL** ✓
   - [ ] **Bottom left still says:** "Authorizing Officer: [Your Name]" ✓
   - [ ] **Bottom right says:** "Registered on January 8, 2026, [time]" ✓

---

## TEST 3: Individual Purchase Voucher
**Goal:** See passport number, NO authorizing officer field

### Step-by-Step:

1. **Logout or Use Incognito Window**
   - If logged in, click **"Logout"**
   - OR open a new incognito/private browser window

2. **Go to Individual Purchase Page**
   - Go to: https://greenpay.eywademo.cloud
   - Look for **"Individual Purchase"** or **"Buy Voucher"** link
   - OR navigate to the public purchase page

3. **Fill in Purchase Form**
   ```
   Passport Number: N9876543
   Full Name: Jane Test Doe
   Nationality: United States
   Date of Birth: 1985-05-20
   Gender: Female
   Email: jane@example.com
   Phone: +675 98765432
   ```

4. **Complete Payment**
   - If there's a test payment option, use it
   - If real payment is required, use a test card or minimal amount
   - Complete the payment process

5. **Download Voucher**
   - After successful payment, you'll see a success page
   - Click **"Download Voucher"** button

6. **Open the PDF and Check:**
   - [ ] CCDA logo at top (centered)
   - [ ] "GREEN CARD" title in green color
   - [ ] Voucher code shown
   - [ ] Barcode visible
   - [ ] **Passport number displayed:** "N9876543" ✓
   - [ ] **NO QR code** ✓
   - [ ] **NO registration URL** ✓
   - [ ] **NO "Authorizing Officer" field at bottom** ✓
   - [ ] **Bottom right says:** "Registered on January 8, 2026, [time]" ✓

---

## Quick Visual Comparison

After completing all 3 tests, compare the PDFs side-by-side:

| Feature | Test 1 (Unregistered) | Test 2 (Registered Corp) | Test 3 (Individual) |
|---------|---------------------|----------------------|-------------------|
| QR Code | ✅ YES | ❌ NO | ❌ NO |
| Registration URL | ✅ YES | ❌ NO | ❌ NO |
| Passport Number | ❌ NO | ✅ YES | ✅ YES |
| Authorizing Officer | ✅ YES | ✅ YES | ❌ NO |
| Date Label | "Generated on" | "Registered on" | "Registered on" |

---

## Troubleshooting

### "Authorizing Officer" not showing in Test 1 or Test 2:
```bash
# Check PM2 logs
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 50"

# Check if created_by column exists
ssh root@165.22.52.100 "sudo -u postgres psql -d greenpay_db -c 'SELECT created_by FROM corporate_vouchers LIMIT 1;'"
```

### QR code not showing in Test 1:
- Make sure the voucher hasn't been registered yet
- Check that `passport_number` field is NULL in database

### Can't find Individual Purchase page:
- Check your role permissions
- Try accessing directly: `/individual-purchase` or `/buy-online`
- Contact system admin if the page is not accessible

### Backend not responding:
```bash
# Check if backend is running
ssh root@165.22.52.100 "pm2 list"

# Restart backend
ssh root@165.22.52.100 "pm2 restart greenpay-api"
```

---

## What to Report

If any test fails, please provide:

1. **Which test failed:** Test 1, 2, or 3
2. **What was wrong:** Describe what you saw vs what you expected
3. **Screenshot of PDF:** Attach the PDF or screenshot
4. **Voucher code:** Provide the voucher code
5. **Backend logs:** Copy any error messages from PM2 logs

**Example Report:**
```
Test 2 FAILED
Expected: Authorizing Officer field in footer
Actual: No authorizing officer shown
Voucher Code: CORP12345678
Screenshot: attached
Logs: "TypeError: Cannot read property 'name' of undefined"
```

---

## Success Criteria

ALL 3 tests must pass:
- [ ] Test 1: Unregistered voucher shows QR code + URL + authorizing officer
- [ ] Test 2: Registered voucher shows passport + authorizing officer (no QR/URL)
- [ ] Test 3: Individual purchase shows passport, NO authorizing officer

**If all tests pass:** Deployment is successful! ✅

**If any test fails:** Review the troubleshooting section or contact the development team.
