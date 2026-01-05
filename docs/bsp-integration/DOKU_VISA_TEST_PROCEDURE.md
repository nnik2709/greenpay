# DOKU Visa Test Card - Detailed Testing Procedure

**Test Card:** DOKU Visa 4761 3499 9900 0039
**Issue:** Invoice generated but empty confirmation code, transaction fails after 10-15 seconds

---

## 🧪 Testing Procedure with Browser Console

### Step 1: Open Browser Console BEFORE Testing

1. Open Chrome/Firefox
2. Press **F12** to open Developer Tools
3. Go to **Network** tab
4. Check "Preserve log" option
5. Clear any existing logs

### Step 2: Start Payment Flow

1. Visit: https://greenpay.eywademo.cloud/buy-online
2. Fill in form:
   - Passport: TEST123456
   - Surname: TESTUSER
   - Given Name: TEST
   - DOB: 1990-01-01
   - Nationality: PNG
   - Sex: M
   - Email: your-email@example.com
3. Click "Proceed to Payment"

### Step 3: On DOKU Payment Page

1. **Before entering card**, check Network tab for the POST to DOKU
2. Click on the request to DOKU
3. Go to **Request** section and copy the form data
4. Look for these parameters:
   ```
   BASKET: ?
   CURRENCY: ?
   AMOUNT: ?
   MALLID: ?
   WORDS: ?
   ```

### Step 4: Enter Card Details

1. Enter card: **4761349999000039** (no spaces)
2. CVV: **998**
3. Expiry: **12/31**
4. Click **Pay**

### Step 5: While Processing (10-15 seconds)

1. **Watch the Network tab** - you should see new requests
2. Look for any responses from DOKU
3. Check Console tab for any JavaScript errors

### Step 6: When Payment Fails

1. **Screenshot the error page** showing:
   - Invoice number
   - Confirmation code (empty)
   - Error message
2. **Check Network tab** for the response
3. Click on any DOKU response and look at:
   - Response Headers
   - Response Body (may contain error code)
4. **Check Console tab** for any error messages

### Step 7: Check Our Server Logs

On server, run:
```bash
# Get logs from the exact time of your test
pm2 logs greenpay-api --lines 100 --nostream | tail -50
```

---

## 🔍 What to Look For

### In Browser Network Tab:

Look for responses from DOKU containing:
```
RESPONSECODE: [error code]
RESULTMSG: [error message]
APPROVALCODE: [empty if failed]
```

### In Browser Console Tab:

Look for:
- JavaScript errors
- Failed network requests
- CORS errors
- Any red error messages

### In Server Logs:

Look for:
```
[DOKU NOTIFY] Webhook received
[DOKU REDIRECT] Customer redirect
```

If these don't appear, DOKU isn't sending webhooks back to us.

---

## 📊 Common DOKU Error Codes

Based on DOKU API documentation:

| Code | Meaning | Action |
|------|---------|--------|
| 0000 | Success | Should not see this if failing |
| 5501 | Transaction declined | Card issuer declined |
| 5502 | Insufficient funds | Test card limit exceeded |
| 5503 | Invalid card | Card not valid for this merchant |
| 5504 | Expired card | Should not be this (exp 12/31) |
| 5511 | Authentication failed | 3D Secure issue |
| 5599 | General decline | Various reasons |
| 9999 | System error | DOKU internal error |

---

## 🎯 Specific Tests to Run

### Test 1: Different Amount
Try PGK 1.00 instead of 50.00 to rule out amount limits

### Test 2: Check DOKU's Test Environment Status
It's possible DOKU staging is down or has issues

### Test 3: Verify Merchant Configuration
The issue might be Mall ID 11170 configuration in DOKU

---

## 📧 Email Template for BSP (After Collecting Data)

```
Subject: DOKU Visa Test Card Failing - Detailed Diagnostics

Dear BSP Digital Testing Team,

We have conducted detailed testing with the DOKU Visa test card and collected
diagnostic information.

TEST CARD USED:
Card: 4761 3499 9900 0039 (DOKU Visa test card)
CVV: 998
Expiry: 12/31

SYMPTOM:
1. Payment page loads successfully
2. Card details entered correctly
3. Click "Pay" button
4. Processing for 10-15 seconds (normal DOKU processing time)
5. Result:
   - Invoice Number: [INSERT NUMBER FROM SCREENSHOT]
   - Confirmation Code: [EMPTY]
   - Message: "Transaction Failed"

TECHNICAL DETAILS:
- Transaction ID: [PGKO-xxx from our system]
- Test Time: [HH:MM:SS]
- Amount: PGK 50.00
- Currency: 598 (PGK)
- Mall ID: 11170

BROWSER DIAGNOSTICS:
[Paste any error codes from Network tab]
[Paste any console errors]

SERVER DIAGNOSTICS:
[Paste webhook logs or "No webhooks received"]

PARAMETERS SENT TO DOKU:
BASKET: Green Fee Voucher,50.00,1,50.00
CURRENCY: 598
AMOUNT: 50.00
MALLID: 11170
PAYMENTCHANNEL: 15

QUESTIONS:
1. Is the DOKU Visa test card (4761 3499 9900 0039) activated for Mall ID 11170?
2. Does this test card support PGK currency (598) in staging environment?
3. What does the invoice number [INSERT] show in DOKU's system logs?
4. Is there a specific error/decline code in DOKU's records?
5. Should we test with IDR currency (360) instead of PGK (598)?

The integration appears technically correct (invoice generated = DOKU accepted
our request), but the card processor is declining the transaction. We need to
understand if this is a test card configuration issue or a currency support issue.

Please check DOKU's logs for the invoice number and advise on next steps.

Attached: Screenshot of DOKU error page

Thank you,
[Your Name]
```

---

## ⚡ Quick Command Reference

```bash
# Watch logs in real-time during test
pm2 logs greenpay-api --lines 0

# Check last 5 transactions
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT id, payment_status, TO_CHAR(created_at, 'HH24:MI:SS') FROM purchase_sessions WHERE payment_method = 'bsp_doku' ORDER BY created_at DESC LIMIT 5;"

# Get form parameters being sent
curl -s https://greenpay.eywademo.cloud/api/buy-online/prepare-payment -X POST -H "Content-Type: application/json" -d '{"passportData":{"passportNumber":"T","surname":"T","givenName":"T","dateOfBirth":"1990-01-01","nationality":"PNG","sex":"M"},"email":"t@t.com","amount":50,"verification":{"answer":5,"expected":5,"timeSpent":10}}' | jq .data.metadata.formParams
```

---

## 🎬 Next Steps

1. **Do ONE more test** with browser console open
2. **Capture screenshot** of DOKU error with invoice number
3. **Copy invoice number** exactly as shown
4. **Run the diagnostic commands** above
5. **Send email to BSP** with all collected information

The key information BSP needs is the **invoice number** - they can look this up
in DOKU's system and tell you the exact decline reason.

---

**Ready to do one more test with diagnostics?** Follow the procedure above and
collect all the information.
