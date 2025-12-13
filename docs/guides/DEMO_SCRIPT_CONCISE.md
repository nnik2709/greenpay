# PNG Green Fees - Stripe Demo Script (Concise)

**Duration:** 10 minutes

---

## Part 1: Online Purchase (3 min)

### Step 1: Navigate to Purchase Page
- **Go to:** https://greenpay.eywademo.cloud/buy-voucher
- **Expected:** Purchase form loads with PNG branding

### Step 2: Fill Purchase Form
- **Email:** `demo@example.com` (use your real email)
- **Phone:** `+675 7123 4567`
- **Quantity:** `2`
- **Click:** "Proceed to Payment"
- **Expected:** Redirects to Stripe Checkout page

### Step 3: Complete Payment
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** `12/34`
- **CVC:** `123`
- **Name:** `John Demo`
- **Country:** `Papua New Guinea`
- **ZIP:** `111`
- **Click:** "Pay K100.00"
- **Expected:** Redirects to success page

### Step 4: View Vouchers
- **Expected:**
  - ✅ Success message
  - 2 unique voucher codes (e.g., `VCH-1765212324386-P6BSRSRVM`)
  - Payment details (K100.00, transaction ID, date)
  - "Register Passport" buttons

---

## Part 2: Email Notification (1 min)

### Step 5: Check Email
- **Open:** Email inbox for `demo@example.com`
- **Find:** Email from "PNG Green Fees"
- **Subject:** "Your PNG Green Fee Vouchers - Ready to Use"
- **Expected:**
  - Professional HTML email with PNG branding
  - Order summary (2 vouchers, K100.00)
  - Voucher codes table with amounts and dates
  - "Register Passport" button for each voucher

### Step 6: Click Registration Link
- **Click:** "Register Passport" button (first voucher)
- **Expected:** Opens registration page with pre-filled voucher code

---

## Part 3: Passport Registration (2 min)

### Step 7: Fill Registration Form
- **Passport Number:** `AB1234567`
- **Surname:** `DEMO`
- **Given Names:** `John Michael`
- **Date of Birth:** `1990-01-15`
- **Sex:** `Male`
- **Nationality:** `PNG`
- **Issue Date:** `2020-01-01`
- **Expiry Date:** `2030-01-01`
- **Click:** "Register Passport"
- **Expected:** Success message "Passport registered successfully!"

---

## Part 4: Admin System View (4 min)

### Step 8: Login to Admin
- **Go to:** https://greenpay.eywademo.cloud/
- **Click:** "Login"
- **Email:** `flexadmin@greenpay.com`
- **Password:** `Admin123!`
- **Click:** "Login"
- **Expected:** Dashboard loads, "Welcome Flex Admin" visible

### Step 9: View Purchase Report
- **Click:** "Reports" (sidebar)
- **Click:** "Individual Purchase Report"
- **Expected:** Table shows recent purchases
- **Find:** Entry with:
  - Passport: `AB1234567`
  - Name: `DEMO, John Michael`
  - Payment Mode: `Stripe`
  - Amount: `K50.00`
  - Status: `Used`

### Step 10: Search Passport
- **Click:** "Passports" (sidebar)
- **Type in search:** `AB1234567`
- **Press:** Enter
- **Expected:** Passport record displays:
  - Full name: DEMO, John Michael
  - DOB: 1990-01-15
  - Linked voucher code
  - Created timestamp (today)

### Step 11: Check Revenue Report
- **Click:** "Reports" → "Revenue Report"
- **Select:** Today's date range
- **Click:** "Generate" or "Search"
- **Expected:**
  - Total Revenue: K100.00
  - Stripe: K100.00
  - Charts showing payment breakdown

---

## Quick Reference

### Test Card Details
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
Name: Any name
ZIP: Any number
```

### Admin Logins
```
Flex Admin:
  Email: flexadmin@greenpay.com
  Password: Admin123!

Finance Manager:
  Email: finance@greenpay.com
  Password: Finance123!

Counter Agent:
  Email: agent@greenpay.com
  Password: Agent123!
```

### URLs
```
Public Purchase: https://greenpay.eywademo.cloud/buy-voucher
Admin Login: https://greenpay.eywademo.cloud/
```

---

## Pre-Demo Check
```bash
# Verify backend running
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 status greenpay-api"
# Expected: status: online

# Test site accessibility
curl -I https://greenpay.eywademo.cloud/
# Expected: HTTP/2 200
```

---

## Troubleshooting

**Email not received?**
- Check spam folder
- Use different email address
- Show voucher on success page

**Payment fails?**
- Card: 4000000000000002 (always fails) - for demo purposes
- Restart: ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 restart greenpay-api"

**Can't login?**
- Verify credentials from table above
- Clear browser cache

---

## Demo Flow Chart

```
1. Buy voucher (3 min)
   ↓
2. Check email (1 min)
   ↓
3. Register passport (2 min)
   ↓
4. View in admin (4 min)
   = 10 minutes total
```

---

**End of Demo Script**
