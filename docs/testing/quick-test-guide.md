# Quick BSP DOKU Payment Testing Guide

**Date:** December 22, 2024

---

## 🚀 Quick Start (2 Terminal Setup)

### Terminal 1: Start Monitoring

```bash
cd /Users/nikolay/github/greenpay
./monitor-bsp-payment-test.sh
```

This will show real-time:
- ✅ Payment session creation
- ✅ DOKU redirects
- ✅ Webhook notifications
- ✅ Database updates
- ❌ Any errors

**Keep this terminal open** while testing!

---

### Terminal 2: Test Payments

**Step 1:** Visit the payment page
```
https://greenpay.eywademo.cloud/buy-online
```

**Step 2:** Fill in test data
- **Quantity:** 1
- **Passport Number:** TEST123456
- **Surname:** TESTUSER
- **Given Name:** TEST
- **Date of Birth:** 1990-01-01
- **Nationality:** PNG
- **Sex:** M
- **Email:** your-email@example.com

**Step 3:** Click "Proceed to Payment"

**Step 4:** On DOKU page, enter test card:

#### Option A: DOKU Visa (Recommended First)
```
Card Number: 4761349999000039
CVV: 998
Expiry: 12/31
```

#### Option B: DOKU MasterCard
```
Card Number: 5573381011111101
CVV: 123
Expiry: 01/28
```

#### Option C: BSP Visa Platinum (PNG Local)
```
Card Number: 4889750100103462
CVV: 921
Expiry: 04/27
```

#### Option D: BSP Visa Silver (PNG Local)
```
Card Number: 4889730100994185
CVV: 061
Expiry: 04/27
```

**Step 5:** Complete payment and observe results

---

## 📊 What to Watch For

### ✅ Success Indicators (in Terminal 1)

```
[BSP DOKU] Creating payment session
  Transaction ID: PGKO-xxxxx
  Amount: 50.00 PGK
  Customer: test@example.com

[BSP DOKU] Payment session created successfully

[DOKU NOTIFY] Webhook received at: 2024-12-22T...
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] ✅ Transaction updated successfully
```

### ❌ Error Indicators

```
[BSP DOKU] ERROR: ...
[DOKU NOTIFY] SECURITY: Signature verification failed
[DOKU NOTIFY] SECURITY: Unauthorized IP address
```

---

## 🔍 Manual Log Check (If Monitoring Script Fails)

```bash
# Check recent logs
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 100 --nostream" | grep -E "BSP DOKU|DOKU NOTIFY"

# Check recent transactions
ssh root@165.22.52.100 "PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c \"SELECT session_id, amount, status, created_at FROM purchase_sessions WHERE payment_method = 'bsp_doku' ORDER BY created_at DESC LIMIT 5;\""
```

---

## 📝 Test Results Template

After each test, document:

### Test #1: DOKU Visa Card

**Date/Time:** _______________
**Card Used:** DOKU Visa (4761 3499 9900 0039)
**Amount:** PGK _______
**Result:** ✅ Success / ❌ Failed

**What Happened:**
- [ ] Payment page loaded
- [ ] Redirected to DOKU successfully
- [ ] Card details accepted
- [ ] 3D Secure prompted (if applicable)
- [ ] Payment processed
- [ ] Webhook received
- [ ] Database updated
- [ ] Redirected back to success page

**Errors/Issues:**
_______________________________

**Transaction ID:** PGKO-_______________

---

### Test #2: DOKU MasterCard

**Date/Time:** _______________
**Card Used:** DOKU MasterCard (5573 3810 1111 1101)
**Amount:** PGK _______
**Result:** ✅ Success / ❌ Failed

**What Happened:**
- [ ] Payment page loaded
- [ ] Redirected to DOKU successfully
- [ ] Card details accepted
- [ ] 3D Secure prompted (if applicable)
- [ ] Payment processed
- [ ] Webhook received
- [ ] Database updated
- [ ] Redirected back to success page

**Errors/Issues:**
_______________________________

**Transaction ID:** PGKO-_______________

---

### Test #3: BSP Visa Platinum

**Date/Time:** _______________
**Card Used:** BSP Visa Platinum (4889 7501 0010 3462)
**Amount:** PGK _______
**Result:** ✅ Success / ❌ Failed

**What Happened:**
- [ ] Payment page loaded
- [ ] Redirected to DOKU successfully
- [ ] Card details accepted
- [ ] 3D Secure prompted (if applicable)
- [ ] Payment processed
- [ ] Webhook received
- [ ] Database updated
- [ ] Redirected back to success page

**Errors/Issues:**
_______________________________

**Transaction ID:** PGKO-_______________

---

### Test #4: BSP Visa Silver

**Date/Time:** _______________
**Card Used:** BSP Visa Silver (4889 7301 0099 4185)
**Amount:** PGK _______
**Result:** ✅ Success / ❌ Failed

**What Happened:**
- [ ] Payment page loaded
- [ ] Redirected to DOKU successfully
- [ ] Card details accepted
- [ ] 3D Secure prompted (if applicable)
- [ ] Payment processed
- [ ] Webhook received
- [ ] Database updated
- [ ] Redirected back to success page

**Errors/Issues:**
_______________________________

**Transaction ID:** PGKO-_______________

---

## 🐛 Common Issues & Solutions

### Issue: "We are sorry that we could not process your request"

**Possible Causes:**
1. Merchant credentials not activated
2. Test card not configured for this Mall ID
3. Currency not supported

**Actions:**
- Check monitoring logs for specific error
- Try different test card
- Verify card number entered correctly (no spaces)
- Contact BSP with transaction details

### Issue: Payment page doesn't load

**Possible Causes:**
1. WORDS signature error
2. Missing required parameters

**Actions:**
- Check monitoring logs for "Creating payment session"
- Look for error messages
- Verify BSP_DOKU environment variables

### Issue: Webhook not received

**Possible Causes:**
1. IP whitelisting blocking DOKU
2. Webhook URL not configured

**Actions:**
- Check firewall rules
- Verify DOKU IPs whitelisted
- Confirm webhook URL with BSP

---

## 📞 Report to BSP

If you encounter issues, prepare this information for BSP:

```
Subject: BSP DOKU Test Results - [Date]

Dear BSP Digital Testing Team,

Test Results for GreenPay DOKU Integration:

Environment:
- Mall ID: 11170
- Currency: PGK (598)
- URL: https://greenpay.eywademo.cloud/buy-online

Test Card: [Card type]
Amount: PGK [amount]
Date/Time: [timestamp]
Transaction ID: PGKO-[id]

Result: [Success/Failed]

Details:
[What happened - paste relevant logs from monitoring]

Error Message:
[If failed - paste error message]

Request:
[What you need BSP to do]

Thank you,
[Your name]
```

---

## ✅ Success Criteria

Testing is successful when:

- ✅ All 4 test cards process successfully
- ✅ Webhooks received and verified
- ✅ Database updated correctly
- ✅ Customer redirected to success page
- ✅ No security errors in logs
- ✅ Payment amounts correct in PGK

---

**Ready to test!** Start the monitoring script and begin testing.
