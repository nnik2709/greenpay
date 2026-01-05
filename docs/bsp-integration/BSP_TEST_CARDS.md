# BSP DOKU Test Cards

**Date Provided:** December 22, 2024
**Source:** BSP Bank PNG
**Purpose:** Testing DOKU payment gateway integration with PNG local cards

---

## Test Card Details

### PNG Local Cards (BSP Bank PNG)

#### 1. BSP Visa Platinum

**Card Number:** `4889 7501 0010 3462`
**CVV:** `921`
**Expiry:** `04/27`
**Card Type:** Visa Platinum
**Issuer:** BSP Bank PNG

#### 2. BSP Visa Silver

**Card Number:** `4889 7301 0099 4185`
**CVV:** `061`
**Expiry:** `04/27`
**Card Type:** Visa Silver
**Issuer:** BSP Bank PNG

### DOKU Test Cards (International)

#### 3. DOKU Visa Test Card #1

**Card Number:** `4761 3499 9900 0039`
**CVV:** `998`
**Expiry:** `12/31`
**Card Type:** Visa
**Issuer:** DOKU Test Card

#### 4. DOKU MasterCard Test Card #2

**Card Number:** `5573 3810 1111 1101`
**CVV:** `123`
**Expiry:** `01/28`
**Card Type:** MasterCard
**Issuer:** DOKU Test Card

---

## Testing Instructions

### Test Environment

- **URL:** https://greenpay.eywademo.cloud/buy-online
- **Mall ID:** 11170 (test)
- **Currency:** PGK (598)
- **Mode:** DOKU Staging

### Test Procedure

1. **Navigate to Buy Online page:**
   ```
   https://greenpay.eywademo.cloud/buy-online
   ```

2. **Fill in customer details:**
   - Quantity: 1
   - Passport Number: TEST123456
   - Surname: TESTUSER
   - Given Name: TEST
   - Date of Birth: 1990-01-01
   - Nationality: PNG
   - Sex: M
   - Email: your-email@example.com

3. **Click "Proceed to Payment"**
   - Should redirect to DOKU hosted payment page
   - Verify amount is correct
   - Verify currency is PGK

4. **Enter test card details on DOKU page:**
   - Use one of the test cards above
   - Enter card number (without spaces)
   - Enter CVV
   - Enter expiry date (MM/YY format)

5. **Complete payment:**
   - Submit payment form
   - May require 3D Secure verification
   - Wait for DOKU response

6. **Verify redirect back to GreenPay:**
   - Should redirect to success or failure page
   - Check transaction status in database

---

## Expected Test Results

### Successful Transaction Flow

1. ✅ Payment session created successfully
2. ✅ Redirected to DOKU hosted payment page
3. ✅ Card details accepted by DOKU
4. ✅ 3D Secure verification completed (if required)
5. ✅ Payment processed successfully
6. ✅ Webhook notification received from DOKU
7. ✅ Database updated with transaction status
8. ✅ Customer redirected to success page
9. ✅ Confirmation email sent (if configured)

### Common Test Scenarios

| Scenario | Test Card | Expected Result |
|----------|-----------|-----------------|
| PNG Local - Platinum | BSP Visa Platinum (4889 7501 0010 3462) | Success |
| PNG Local - Silver | BSP Visa Silver (4889 7301 0099 4185) | Success |
| DOKU International - Visa | DOKU Visa (4761 3499 9900 0039) | Success |
| DOKU International - MC | DOKU MasterCard (5573 3810 1111 1101) | Success |
| 3D Secure flow | Any card | Success with OTP |
| Invalid CVV | Wrong CVV | Decline |
| Expired card | - | Decline (after expiry) |

### Recommended Test Order

1. **Start with DOKU test cards** (cards #3 and #4)
   - These are designed for DOKU integration testing
   - Should work immediately if DOKU setup is correct

2. **Then test PNG local cards** (cards #1 and #2)
   - Tests actual BSP Bank PNG card processing
   - Verifies local card issuer integration

---

## Monitoring Commands

### Watch Backend Logs

```bash
ssh root@165.22.52.100
pm2 logs greenpay-api --lines 100 | grep -E "BSP DOKU|Payment|DOKU NOTIFY"
```

### Check Recent Transactions

```bash
ssh root@165.22.52.100
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  session_id,
  amount,
  status,
  payment_method,
  created_at,
  updated_at
FROM purchase_sessions
WHERE payment_method = 'bsp_doku'
ORDER BY created_at DESC
LIMIT 10;"
```

### Check Webhook Notifications

Look for these log patterns:
```
[DOKU NOTIFY] Webhook received at: ...
[DOKU NOTIFY] Transaction ID: ...
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] ✅ Transaction updated successfully
```

---

## Troubleshooting

### Issue: DOKU Rejects Payment

**Error:** "We are sorry that we could not process your request"

**Possible Causes:**
1. Merchant credentials (Mall ID 11170) not activated
2. Test cards not configured for Mall ID 11170
3. Currency (PGK 598) not enabled in test environment
4. Card details entered incorrectly

**Actions:**
- Verify card number entered without spaces
- Check CVV is correct (3 digits)
- Check expiry format (MM/YY)
- Contact BSP if issue persists

### Issue: Payment Page Not Loading

**Possible Causes:**
1. DOKU endpoint not accessible
2. WORDS signature incorrect
3. Required parameters missing

**Actions:**
- Check backend logs for errors
- Verify BSP_DOKU environment variables
- Test payment session creation with curl

### Issue: Webhook Not Received

**Possible Causes:**
1. IP whitelisting blocking DOKU servers
2. Webhook URL not configured with BSP
3. Firewall blocking DOKU IPs

**Actions:**
- Verify DOKU IPs are whitelisted
- Check nginx/firewall logs
- Confirm webhook URL with BSP

---

## Test Results Log

### Test #1: [Date/Time]

**Test Card:** BSP Visa Platinum
**Amount:** PGK XX.XX
**Result:** ✅ Success / ❌ Failed
**Notes:**

---

### Test #2: [Date/Time]

**Test Card:** BSP Visa Silver
**Amount:** PGK XX.XX
**Result:** ✅ Success / ❌ Failed
**Notes:**

---

## Important Notes

⚠️ **Security Reminders:**
- These test cards are for TEST environment only (Mall ID 11170)
- Never use test cards in production
- Never commit test card numbers to public repositories
- Keep this document secure and local only

⚠️ **Production Migration:**
- Production credentials will be different (new Mall ID)
- Production test cards may be different
- This document is for staging environment only

---

## Contact Information

**BSP Support:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212
- Reference: Climate Change Dev Authority - GreenPay Integration
- Mall ID: 11170 (test)

**DOKU Integration:**
- Contact through BSP technical team
- API Version: 1.29 (Hosted Payment Pages)

---

## Next Steps After Testing

1. ✅ Document all test results
2. ✅ Report any issues to BSP
3. ✅ Request production credentials when tests pass
4. ✅ Update environment for production deployment
5. ✅ Conduct final production testing
6. ✅ Go live with customer announcements

---

**Document Version:** 1.0
**Last Updated:** December 22, 2024
**Status:** Ready for Testing
