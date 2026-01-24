# Email Template Session ID - Manual Deployment Guide

**Date**: 2026-01-17
**Feature**: Add Session ID to Voucher Confirmation Emails
**Status**: ✅ Email template updated, manual backend deployment required

---

## What Was Changed

### 1. Email Template Updated (`backend/services/notificationService.js`)

**Changes Made:**
1. Added optional `sessionId` parameter to `sendVoucherNotification()` function
2. Added "Retrieve Vouchers" section to email HTML with session ID display
3. Maintains backward compatibility (sessionId is optional)

**Email Section Added:**
```html
<div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
  <p><strong>📧 Lost this email?</strong></p>
  <p>You can retrieve your vouchers anytime using your payment session ID and email address:</p>
  ${sessionId ? `
    <p style="margin: 10px 0;">
      <strong>Payment Session ID:</strong>
      <code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
        ${sessionId}
      </code>
    </p>
  ` : ''}
  <p style="margin: 10px 0;">
    <a href="${registrationUrl}/retrieve-vouchers" style="color: #2563eb; text-decoration: underline; font-weight: 600;">
      Retrieve Your Vouchers
    </a>
  </p>
</div>
```

---

## Manual Deployment Required

You need to update **6 function calls** across **5 backend files** to pass the session ID as the third parameter.

---

## File 1: `backend/routes/payment-webhook-doku.js`

### Location: Line 299

**Current Code:**
```javascript
sendVoucherNotification(
  {
    customerEmail: session.customer_email,
    customerPhone: null,
    quantity: vouchers.length // Actual quantity
  },
  vouchers // All vouchers in array
).catch(err => {
```

**Update To:**
```javascript
sendVoucherNotification(
  {
    customerEmail: session.customer_email,
    customerPhone: null,
    quantity: vouchers.length // Actual quantity
  },
  vouchers, // All vouchers in array
  sessionId  // ADD THIS: Payment session ID for retrieval
).catch(err => {
```

**Note:** `sessionId` variable is available in scope (line 291)

---

## File 2: `backend/routes/buy-online.js` (First Call)

### Location: Line 987

**Current Code:**
```javascript
await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: quantity
}, vouchers);
```

**Update To:**
```javascript
await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: quantity
}, vouchers, sessionId);  // ADD THIS: Payment session ID
```

**Note:** `sessionId` variable is available in scope (line 980 context)

---

## File 3: `backend/routes/buy-online.js` (Second Call)

### Location: Line 1141

**Current Code:**
```javascript
await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: 1
}, [voucher]);
```

**Update To:**
```javascript
await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: 1
}, [voucher], session.id);  // ADD THIS: Payment session ID
```

**Note:** Use `session.id` (the session object is available in scope)

---

## File 4: `backend/routes/public-purchases.js`

### Location: Line 936

**Current Code:**
```javascript
const notificationResult = await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: session.quantity
}, vouchers);
```

**Update To:**
```javascript
const notificationResult = await sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: session.customer_phone,
  quantity: session.quantity
}, vouchers, sessionId);  // ADD THIS: Payment session ID
```

**Note:** `sessionId` variable is available in scope (line 930 context)

---

## File 5: `backend/routes/voucher-retrieval.js` (First Call)

### Location: Line 211

**Current Code:**
```javascript
await sendVoucherNotification(
  {
    customerEmail: email,
    customerPhone: session.customer_phone,
    quantity: newVouchers.length
  },
  newVouchers
);
```

**Update To:**
```javascript
await sendVoucherNotification(
  {
    customerEmail: email,
    customerPhone: session.customer_phone,
    quantity: newVouchers.length
  },
  newVouchers,
  sessionId  // ADD THIS: Payment session ID
);
```

**Note:** `sessionId` variable is available in scope (function parameter)

---

## File 6: `backend/routes/voucher-retrieval.js` (Second Call)

### Location: Line 257

**Current Code:**
```javascript
await sendVoucherNotification(
  {
    customerEmail: email,
    customerPhone: session.customer_phone,
    quantity: vouchers.length
  },
  vouchers
);
```

**Update To:**
```javascript
await sendVoucherNotification(
  {
    customerEmail: email,
    customerPhone: session.customer_phone,
    quantity: vouchers.length
  },
  vouchers,
  sessionId  // ADD THIS: Payment session ID
);
```

**Note:** `sessionId` variable is available in scope (function parameter)

---

## Deployment Steps

### Step 1: Upload Updated notificationService.js

The `backend/services/notificationService.js` file has already been updated locally.

```bash
# Upload via CloudPanel File Manager:
# Source: /Users/nikolay/github/greenpay/backend/services/notificationService.js
# Destination: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/notificationService.js
```

### Step 2: Update 5 Backend Route Files

Manually edit each of the 5 files listed above via CloudPanel File Manager or SSH:

1. `backend/routes/payment-webhook-doku.js` - Add `, sessionId` at line 305
2. `backend/routes/buy-online.js` - Add `, sessionId` at lines 991 and 1145
3. `backend/routes/public-purchases.js` - Add `, sessionId` at line 940
4. `backend/routes/voucher-retrieval.js` - Add `, sessionId` at lines 217 and 263

**Quick Summary of Changes:**
- All changes follow the same pattern: add `, sessionId` or `, session.id` as third parameter
- Total characters to type: ~50-60 characters across 6 locations
- Estimated time: 5-10 minutes

### Step 3: Restart Backend

```bash
ssh root@165.22.52.100
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

**Expected Output:**
```
0|greenpay-api | Server started on port 5001
0|greenpay-api | Database connected
```

No errors about `sendVoucherNotification` or undefined parameters.

---

## Verification Tests

### Test 1: Make a Voucher Purchase

1. Go to: https://greenpay.eywademo.cloud/buy-online
2. Purchase a K 50 voucher
3. Use your personal email address
4. Complete payment

### Test 2: Check Email Content

Open the voucher confirmation email and verify:
- ✅ Email has "Lost this email?" section
- ✅ Section is blue with info styling
- ✅ Contains text: "You can retrieve your vouchers anytime..."
- ✅ Displays **Payment Session ID** (e.g., `PGKO-1234-5678`)
- ✅ Session ID is in a code box (gray background, monospace font)
- ✅ Contains link: "Retrieve Your Vouchers" → `/retrieve-vouchers`

### Test 3: Test Voucher Retrieval

1. Copy the Session ID from the email
2. Go to: https://greenpay.eywademo.cloud/retrieve-vouchers
3. Enter:
   - Session ID: (paste from email)
   - Email: (email used for purchase)
4. Click "Retrieve Vouchers"
5. Verify:
   - ✅ Vouchers display correctly
   - ✅ Email confirmation message appears
   - ✅ Download/Print buttons work

### Test 4: Backend Logs

```bash
ssh root@165.22.52.100
pm2 logs greenpay-api --lines 200 | grep -i "email"
```

Look for:
- ✅ "Email sent successfully"
- ✅ No errors about missing parameters
- ✅ Session ID mentioned in logs

---

## Rollback Plan

If emails are not sending or errors occur:

```bash
# SSH to server
ssh root@165.22.52.100

# Restore original notificationService.js
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services
# (You should create a backup first if you haven't)

# Revert the 6 route file changes (remove the sessionId parameters)

# Restart backend
pm2 restart greenpay-api
```

---

## Success Checklist

After deployment:
- [ ] `notificationService.js` uploaded successfully
- [ ] All 6 function calls updated with session ID parameter
- [ ] Backend restarted without errors
- [ ] Test voucher purchase completed
- [ ] Email received with "Lost this email?" section
- [ ] Session ID displays correctly in email
- [ ] "Retrieve Your Vouchers" link works
- [ ] Voucher retrieval flow works end-to-end
- [ ] No errors in backend logs

---

## Summary of Changes

**Files Modified:**
1. ✅ `backend/services/notificationService.js` - Email template updated (already done)
2. ⏳ `backend/routes/payment-webhook-doku.js` - Line 305 (manual update needed)
3. ⏳ `backend/routes/buy-online.js` - Lines 991, 1145 (manual update needed)
4. ⏳ `backend/routes/public-purchases.js` - Line 940 (manual update needed)
5. ⏳ `backend/routes/voucher-retrieval.js` - Lines 217, 263 (manual update needed)

**Total Changes:**
- 1 file fully updated (notificationService.js)
- 5 files need simple parameter additions (6 function calls total)
- All changes are additive (no removals)
- Backward compatible (sessionId is optional)

---

## Next Steps After Deployment

1. ✅ Deploy email template changes (this guide)
2. Test voucher retrieval flow end-to-end
3. Update user documentation with voucher retrieval instructions
4. Monitor email delivery for 24-48 hours

---

**Status**: ✅ READY FOR MANUAL DEPLOYMENT
**Risk Level**: LOW (additive changes only, backward compatible)
**Estimated Time**: 10-15 minutes
**Business Impact**: HIGH (helps customers recover lost vouchers)
