# 🚀 Quick Manual Test - Corporate Voucher Registration (5 Minutes)

Since you're already logged in, let's test the flow right now!

---

## ✅ STEP 1: Create Corporate Vouchers (2 minutes)

1. **Go to**: https://greenpay.eywademo.cloud/app/corporate-exit-pass

2. **Create Invoice**:
   - Select any test customer
   - Number of vouchers: **2**
   - Click "Create Invoice"

3. **Mark as Paid**:
   - Click "Mark as Paid"

4. **Generate Vouchers**:
   - Click "Generate Vouchers"
   - **COPY the voucher codes** that appear (8 characters each)

   ```
   Voucher 1: ________________
   Voucher 2: ________________
   ```

5. **Download Vouchers PDF** (PENDING version):
   - Click "Download Vouchers PDF"
   - Open the PDF
   - **CHECK**: Should show "Scan to Register" and registration link
   - **CHECK**: Should NOT show passport number
   - Take screenshot if possible

---

## ✅ STEP 2: Register Passport (2 minutes)

1. **Open new tab** (keep logged in): https://greenpay.eywademo.cloud/app/voucher-registration

2. **Enter Voucher Code**:
   - Paste voucher code from Step 1
   - Click "Find Voucher"

3. **Enter Passport Data** (use test data):
   ```
   Passport Number: TEST123456
   Surname: TESTUSER
   Given Name: JOHN
   Nationality: Papua New Guinea
   Date of Birth: 1990-01-01
   Sex: Male
   ```

4. **Submit**:
   - Click "Register Voucher"
   - Should see SUCCESS screen with "ACTIVE" status

5. **Download PDF** (ACTIVE version):
   - Click "Download PDF" from success screen
   - Open the PDF
   - **CHECK**: Should show passport number "TEST123456"
   - **CHECK**: Should NOT show registration link
   - Take screenshot if possible

---

## ✅ STEP 3: Compare PDFs

**Open both PDFs side-by-side:**

### PENDING Voucher PDF (from Step 1):
- [ ] Shows "Scan to Register"
- [ ] Shows registration URL
- [ ] NO passport number
- [ ] CCDA logo centered at top

### ACTIVE Voucher PDF (from Step 2):
- [ ] Shows "Passport Number" section
- [ ] Shows "TEST123456"
- [ ] NO registration link
- [ ] CCDA logo centered at top

---

## 📸 Expected Results

### Pending PDF:
```
┌─────────────────────────────┐
│       [CCDA LOGO]           │
│                             │
│   VOUCHER CODE: 3IEW5268    │
│                             │
│   Scan to Register          │
│   https://greenpay...       │
│   [QR CODE]                 │
│                             │
│   Company: Test Co          │
│   Amount: PGK 50.00         │
└─────────────────────────────┘
```

### Active PDF:
```
┌─────────────────────────────┐
│       [CCDA LOGO]           │
│                             │
│   VOUCHER CODE: 3IEW5268    │
│                             │
│   Passport Number           │
│   TEST123456                │
│   [QR CODE]                 │
│                             │
│   Company: Test Co          │
│   Amount: PGK 50.00         │
└─────────────────────────────┘
```

---

## 🎯 Test Result

**Did it work?**
- [ ] ✅ YES - Both PDFs show correct content
- [ ] ❌ NO - PDFs don't match expected results

**If NO, what's wrong?**
```
_________________________________
_________________________________
```

---

## ⏱️ This should take about 5 minutes total!

Ready to start? Just follow the steps above!
