# Investigating BSP DOKU Payment Failures

**Issue:** Transactions fail after entering test card details on DOKU page
**BSP Request:** Shopping Cart implementation required
**Current Status:** Basket is implemented but may have format issues

---

## Commands to Run on Server (Paste in SSH Terminal)

### 1. Check Recent Payment Logs

```bash
ssh root@165.22.52.100

# Check recent BSP DOKU activity
pm2 logs greenpay-api --lines 200 --nostream | grep -E "BSP DOKU|basket|BASKET"

# Check for errors
pm2 logs greenpay-api --lines 200 --nostream | grep -iE "error|failed|reject"

# Check webhook notifications
pm2 logs greenpay-api --lines 200 --nostream | grep -E "DOKU NOTIFY|DOKU REDIRECT"
```

### 2. Check Recent Transaction Sessions

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  id,
  amount,
  quantity,
  payment_status,
  payment_method,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated
FROM purchase_sessions
WHERE payment_method = 'bsp_doku'
ORDER BY created_at DESC
LIMIT 10;"
```

### 3. Test Payment Creation and Check Basket Format

```bash
# Create a test payment and see the exact parameters
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "BASKET123",
      "surname": "TESTUSER",
      "givenName": "TEST",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {"answer": 5, "expected": 5, "timeSpent": 10}
  }' | jq '.data.metadata.formParams.BASKET'

# Should show: "Green Fee Voucher,50.00,1,50.00"
```

---

## Current Implementation Analysis

### ✅ What We Have:

1. **Basket Parameter:** Implemented in `BSPGateway.js` line 249
   ```javascript
   const basket = `Green Fee Voucher,${amount},${quantity},${amount}`;
   ```

2. **Format:** `item_name,price,quantity,subtotal`
   - Item Name: "Green Fee Voucher"
   - Price: 50.00
   - Quantity: 1 (hardcoded)
   - Subtotal: 50.00

3. **Sent to DOKU:** Yes, in `BASKET` parameter (line 265)

### ❓ Potential Issues:

1. **Basket Format Might Be Wrong**
   - DOKU may require different format
   - May need URL encoding
   - May need semicolon separator instead of comma
   - May need additional fields

2. **Quantity Hardcoded to 1**
   - No UI to select quantity in BuyOnline.jsx
   - Backend hardcodes quantity=1 (buy-online.js line 135, 167)
   - BSP might expect shopping cart with variable quantities

3. **Missing Shopping Cart Fields**
   - DOKU might require `BASKET` as base64-encoded XML
   - Might need `SHOPPINGCART` parameter instead
   - Might need itemized details in specific format

---

## What BSP Likely Means by "Shopping Cart"

Based on DOKU API documentation, the basket parameter should be:

### Format Option 1: CSV Format (Current)
```
item_name,price,quantity,subtotal
```
Example:
```
Green Fee Voucher,50.00,1,50.00
```

### Format Option 2: Extended CSV with More Details
```
item_name,price,quantity,subtotal,item_code,category
```
Example:
```
Green Fee Voucher,50.00,1,50.00,GFV001,Permits
```

### Format Option 3: XML Format (Base64 Encoded)
```xml
<shopping_cart>
  <item>
    <name>Green Fee Voucher</name>
    <price>50.00</price>
    <quantity>1</quantity>
    <subtotal>50.00</subtotal>
  </item>
</shopping_cart>
```

### Format Option 4: JSON Format
```json
[{"name":"Green Fee Voucher","price":50.00,"qty":1,"subtotal":50.00}]
```

---

## Check What DOKU Actually Receives

### Method 1: Enable Debug Logging

Add to server `.env`:
```bash
BSP_DOKU_DEBUG=true
```

Then restart and check logs:
```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50 | grep -i basket
```

### Method 2: Check DOKU Error Response

When payment fails on DOKU page:
1. **Take screenshot** of error message
2. **Check browser console** (F12 → Console tab)
3. **Check network tab** (F12 → Network tab) for error responses
4. **Copy any error codes** shown

---

## Questions for BSP

If logs don't reveal the issue, email BSP:

```
Subject: Shopping Cart Format Clarification - Mall ID 11170

Dear BSP Digital Testing Team,

We are testing the DOKU integration (Mall ID 11170) and encountering
transaction failures after entering card details.

You mentioned "Shopping Cart implementation" is required. We currently
send the BASKET parameter as:

Format: item_name,price,quantity,subtotal
Example: Green Fee Voucher,50.00,1,50.00

Could you please clarify:

1. Is the BASKET parameter format correct?
2. Should we use a different format (XML, JSON, extended CSV)?
3. Are there additional shopping cart parameters required?
4. Can you provide an example of the correct basket format?

Our test transaction details:
- Mall ID: 11170
- Currency: PGK (598)
- Amount: 50.00
- Basket: "Green Fee Voucher,50.00,1,50.00"

Thank you,
[Your Name]
```

---

## Immediate Actions

### 1. Check Server Logs (Run These Commands)

```bash
# Connect to server
ssh root@165.22.52.100

# View last 100 lines with basket info
pm2 logs greenpay-api --lines 100 --nostream | grep -i basket

# View last 100 lines with errors
pm2 logs greenpay-api --lines 100 --nostream | grep -iE "error|failed|reject" | tail -20

# View last successful payment session creation
pm2 logs greenpay-api --lines 200 --nostream | grep "Payment session created"
```

### 2. Test Payment and Capture Exact Basket Value

```bash
# From your local machine
curl -X POST https://greenpay.eywademo.cloud/api/buy-online/prepare-payment \
  -H "Content-Type: application/json" \
  -d '{
    "passportData": {
      "passportNumber": "TEST123",
      "surname": "TEST",
      "givenName": "USER",
      "dateOfBirth": "1990-01-01",
      "nationality": "PNG",
      "sex": "M"
    },
    "email": "test@example.com",
    "amount": 50.00,
    "verification": {"answer": 5, "expected": 5, "timeSpent": 10}
  }' | jq '.'

# Look for .data.metadata.formParams.BASKET
```

### 3. Check Browser Console When Payment Fails

1. Open https://greenpay.eywademo.cloud/buy-online
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Fill form and click "Proceed to Payment"
5. When on DOKU page, enter test card
6. When payment fails, check Console for errors
7. Screenshot any error messages

---

## Next Steps Based on Findings

### If Logs Show Basket Format Error:
→ Fix basket format in BSPGateway.js

### If Logs Show Missing Parameters:
→ Add required shopping cart parameters

### If No Clear Error in Logs:
→ Contact BSP for clarification on basket format

### If DOKU Shows Specific Error Code:
→ Look up error code in DOKU documentation
→ Send to BSP for interpretation

---

## Quick Fix to Test (If BSP Confirms Format)

If BSP provides the correct format, we can quickly fix it in:

**File:** `backend/services/payment-gateways/BSPGateway.js`
**Line:** 249

Current:
```javascript
const basket = `Green Fee Voucher,${amount},${quantity},${amount}`;
```

Possible fixes based on BSP feedback:
```javascript
// Option 1: Add item code
const basket = `Green Fee Voucher,${amount},${quantity},${amount},GFV001`;

// Option 2: URL encode
const basket = encodeURIComponent(`Green Fee Voucher,${amount},${quantity},${amount}`);

// Option 3: Use semicolons
const basket = `Green Fee Voucher;${amount};${quantity};${amount}`;

// Option 4: Extended format with currency
const basket = `Green Fee Voucher,${amount},${quantity},${amount},PGK`;
```

---

**Start with Step 1:** Run the log check commands above and share the output here.
