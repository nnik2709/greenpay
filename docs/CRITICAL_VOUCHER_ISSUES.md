# CRITICAL: Multiple Voucher Generation Issues

**Date**: 2026-01-15
**Severity**: CRITICAL - Money taken but vouchers not generated
**Status**: Bugs identified, fixes ready for implementation

## Issues Identified

### 1. ❌ CRITICAL: Only 1 Voucher Generated Regardless of Quantity

**Current Behavior**: User pays for 2 vouchers, only gets 1 voucher
**Root Cause**: Webhook only creates single voucher (line 216-260 in `payment-webhook-doku.js`)
**Financial Impact**: HIGH - Customer charged for 2, receives 1

**Evidence from code**:
```javascript
// Line 216-260: Only creates ONE voucher
const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
const voucherResult = await client.query(voucherQuery, voucherValues);
const voucher = voucherResult.rows[0]; // Single voucher

// Line 294: Hardcoded quantity: 1
sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: null,
  quantity: 1  // ❌ WRONG - should be session.quantity
}, [voucher]); // ❌ WRONG - only 1 voucher in array
```

**Fix Required**: Loop to create `session.quantity` vouchers

---

### 2. ❌ No Email Verification

**Current Behavior**: Single email field, no confirmation
**Risk**: Typo in email = vouchers lost forever
**User Experience**: Poor - no way to correct email before payment

**Fix Required**:
- Add second "Confirm Email" field
- Validate emails match before payment
- Show clear error if mismatch

---

### 3. ❌ No Safety Net for Failed Voucher Generation

**Current Behavior**: If voucher generation fails after successful payment:
- Money is taken from customer
- Payment marked as "completed" in database
- No vouchers created
- Customer has NO way to retrieve vouchers

**Evidence from logs**:
```
[DOKU NOTIFY] Payment successful - creating voucher
[DOKU NOTIFY] ❌ Voucher creation failed: <error>
[DOKU NOTIFY] WARNING: Payment successful but voucher creation failed
[DOKU NOTIFY] WARNING: Customer should contact support with session ID: XXX
```

**Fix Required**: Voucher retrieval endpoint using session ID + email verification

---

### 4. ❌ No Voucher Retrieval Mechanism

**Current Behavior**: If customer loses email or vouchers fail to generate, there's NO way to retrieve them

**Fix Required**: Self-service voucher retrieval page at `/retrieve-vouchers`

---

## Solution Architecture

### Fix #1: Generate Correct Number of Vouchers

**File**: `backend/routes/payment-webhook-doku.js`
**Lines**: 216-306

**Changes**:
1. Read `session.quantity` from database
2. Loop to create multiple vouchers
3. Collect all vouchers in array
4. Send all vouchers in single email
5. Update notification to show actual quantity

```javascript
// Get quantity from session
const quantity = session.quantity || 1;
const vouchers = [];

// Loop to create all vouchers
for (let i = 0; i < quantity; i++) {
  const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
  // ... create voucher ...
  vouchers.push(voucherResult.rows[0]);
}

// Send email with ALL vouchers
sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: null,
  quantity: quantity // Actual quantity
}, vouchers); // All vouchers
```

---

### Fix #2: Email Verification Before Payment

**File**: `src/pages/BuyOnline.jsx` (or relevant purchase page)

**Add to form**:
```jsx
<Input
  type="email"
  name="email"
  placeholder="Email Address"
  required
/>

<Input
  type="email"
  name="emailConfirm"
  placeholder="Confirm Email Address"
  required
/>

// Validation before submit:
if (formData.email !== formData.emailConfirm) {
  setError('Email addresses do not match');
  return;
}
```

**Benefits**:
- Catches typos BEFORE payment
- Improves customer confidence
- Reduces support burden

---

### Fix #3: Email Verification Link Before Payment (Optional)

**Flow**:
1. User enters email twice
2. System sends verification code to email
3. User enters code to confirm
4. Only then proceed to payment

**Implementation**:
- Create email verification table
- Generate 6-digit code
- Send via email
- Validate before payment

**Note**: This adds friction. Consider A/B testing.

---

### Fix #4: Voucher Retrieval System (CRITICAL SAFETY NET)

**New Endpoint**: `GET /api/buy-online/retrieve-vouchers`

**Flow**:
1. Customer visits: `/retrieve-vouchers`
2. Enters: Session ID + Email address
3. System validates email matches session
4. Returns vouchers if payment completed
5. Sends vouchers again via email

**Frontend Page**: `src/pages/RetrieveVouchers.jsx`

```jsx
<Card>
  <CardHeader>
    <CardTitle>Retrieve Your Vouchers</CardTitle>
    <CardDescription>
      If you lost your voucher email or vouchers weren't generated,
      retrieve them here using your payment session ID.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Input
      type="text"
      placeholder="Session ID (e.g., PGKO-XXX-XXX)"
      value={sessionId}
    />
    <Input
      type="email"
      placeholder="Email used for purchase"
      value={email}
    />
    <Button onClick={handleRetrieve}>Retrieve Vouchers</Button>
  </CardContent>
</Card>
```

**Backend Implementation**:
```javascript
router.post('/retrieve-vouchers', async (req, res) => {
  const { sessionId, email } = req.body;

  // 1. Validate inputs
  if (!sessionId || !email) {
    return res.status(400).json({ error: 'Session ID and email required' });
  }

  // 2. Get session
  const session = await db.query(
    'SELECT * FROM purchase_sessions WHERE id = $1',
    [sessionId]
  );

  if (session.rows.length === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const sessionData = session.rows[0];

  // 3. Verify email matches
  if (sessionData.customer_email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ error: 'Email does not match' });
  }

  // 4. Check payment status
  if (sessionData.payment_status !== 'completed') {
    return res.status(400).json({
      error: 'Payment not completed',
      status: sessionData.payment_status
    });
  }

  // 5. Get vouchers
  const vouchers = await db.query(
    'SELECT * FROM individual_purchases WHERE purchase_session_id = $1',
    [sessionId]
  );

  if (vouchers.rows.length === 0) {
    // Payment completed but vouchers not created - TRIGGER CREATION
    try {
      await createVoucherFromPayment(sessionId, {
        approvalCode: sessionData.payment_gateway_ref
      });

      // Re-fetch vouchers
      const newVouchers = await db.query(
        'SELECT * FROM individual_purchases WHERE purchase_session_id = $1',
        [sessionId]
      );

      // Send email
      sendVoucherNotification({
        customerEmail: email,
        customerPhone: null,
        quantity: newVouchers.rows.length
      }, newVouchers.rows);

      return res.json({
        success: true,
        message: 'Vouchers generated successfully',
        vouchers: newVouchers.rows
      });
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to generate vouchers',
        details: err.message
      });
    }
  }

  // 6. Return vouchers + re-send email
  sendVoucherNotification({
    customerEmail: email,
    customerPhone: null,
    quantity: vouchers.rows.length
  }, vouchers.rows);

  res.json({
    success: true,
    vouchers: vouchers.rows
  });
});
```

---

## Implementation Priority

### Phase 1: CRITICAL (Deploy Immediately)
1. ✅ Fix multiple voucher generation in webhook
2. ✅ Fix hardcoded quantity in email notification
3. ✅ Create voucher retrieval endpoint
4. ✅ Create voucher retrieval frontend page

### Phase 2: HIGH (Deploy This Week)
1. ⚠️ Add email confirmation field
2. ⚠️ Add email validation before payment
3. ⚠️ Add "Retrieve Vouchers" link on payment failed page
4. ⚠️ Add "Retrieve Vouchers" link in email footer

### Phase 3: MEDIUM (Consider for Future)
1. 🔄 Email verification code before payment (adds friction)
2. 🔄 SMS verification as alternative
3. 🔄 Retry mechanism for failed voucher generation
4. 🔄 Admin dashboard to manually trigger voucher generation

---

## Testing Plan

### Test Case 1: Multiple Vouchers
1. Purchase 3 vouchers
2. Complete payment
3. Verify 3 vouchers created in database
4. Verify email contains all 3 vouchers
5. Verify all 3 have unique codes

### Test Case 2: Email Typo
1. Enter wrong email
2. Try to confirm with different email
3. Verify validation error before payment
4. Correct email and retry

### Test Case 3: Voucher Retrieval (Success Case)
1. Complete payment
2. Visit `/retrieve-vouchers`
3. Enter session ID + correct email
4. Verify vouchers returned
5. Verify email sent again

### Test Case 4: Voucher Retrieval (Failed Generation)
1. Simulate failed voucher generation after payment
2. Visit `/retrieve-vouchers`
3. Enter session ID + correct email
4. Verify system generates vouchers on-demand
5. Verify email sent

### Test Case 5: Security
1. Try to retrieve with wrong email
2. Verify 403 error
3. Try non-existent session ID
4. Verify 404 error

---

## Database Changes Required

### Add vouchers_generated flag to purchase_sessions

```sql
ALTER TABLE purchase_sessions
ADD COLUMN vouchers_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN vouchers_generation_attempts INT DEFAULT 0,
ADD COLUMN last_generation_attempt TIMESTAMP;
```

**Purpose**: Track voucher generation status separately from payment status

---

## Success Metrics

**Before Fix**:
- 1 voucher generated when 2 purchased = 50% fulfillment
- 0% recovery rate for failed voucher generation
- 0% customer self-service

**After Fix**:
- 100% correct voucher quantity generation
- ~95% email accuracy (with confirmation)
- ~80% customer self-service via retrieval
- 100% recovery for failed generation

---

## Rollout Plan

1. Deploy webhook fix for multiple vouchers
2. Test with 1, 2, 3 voucher purchases
3. Deploy voucher retrieval endpoint + frontend
4. Test retrieval with existing failed sessions
5. Update email templates with retrieval link
6. Deploy email confirmation on purchase page
7. Monitor for 48 hours

---

**Priority**: CRITICAL
**Impact**: HIGH - Customer satisfaction + Financial correctness
**Effort**: Medium - ~4-6 hours development + testing
**Risk**: LOW - Backward compatible, improves existing flow
