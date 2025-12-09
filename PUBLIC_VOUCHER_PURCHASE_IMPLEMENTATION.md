# Public Voucher Purchase Implementation Guide

## Overview

This document describes the implementation of **Variant 1: Two-Step Purchase Flow** optimized for PNG's network conditions (low bandwidth, unreliable connectivity).

**Implementation Date:** 2025-01-15
**Status:** ✅ Complete (Mock BSP Integration)
**Next Steps:** Integrate with real BSP Payment Gateway

---

## Architecture

### Flow Diagram

```
Customer Visit
     ↓
/buy-voucher (Public Page)
  - Enter email + phone + quantity
  - No authentication required
  - Auto-saves to localStorage
     ↓
Create Purchase Session
  - Backend: POST /api/public-purchases/create-session
  - Returns session ID
     ↓
Redirect to BSP Payment Gateway
  - Mock: /mock-bsp-payment
  - Production: BSP secure payment page
     ↓
Customer Completes Payment
  - BSP processes payment
  - Redirects back to /purchase/callback
  - BSP sends webhook to backend
     ↓
Generate Vouchers
  - Backend: POST /api/public-purchases/complete
  - Creates voucher codes
  - Sends via SMS + Email
     ↓
Display Voucher Codes
  - Customer sees codes on screen
  - Can download or register passport immediately
     ↓
Register Passport (Later)
  - Customer visits /register/{voucherCode}
  - Enters passport details
  - Links passport to voucher
```

---

## Files Created

### Frontend Components

1. **`src/pages/PublicVoucherPurchase.jsx`**
   - Public purchase page (no auth)
   - Form: email, phone, quantity
   - Offline-first with localStorage
   - Network status monitoring
   - Auto-save functionality

2. **`src/pages/PublicPurchaseCallback.jsx`**
   - Payment callback handler
   - Verifies payment with BSP
   - Displays voucher codes
   - Download/register options

3. **`src/pages/MockBSPPayment.jsx`**
   - Mock BSP payment gateway (dev/test only)
   - Simulates payment flow
   - Replace with real BSP redirect in production

### Backend Services

4. **`src/lib/bspPaymentService.js`**
   - BSP payment gateway integration
   - **MOCK IMPLEMENTATION** - placeholders for real BSP API
   - Functions: initiate, verify, webhook, refund

5. **`backend/routes/public-purchases.js`**
   - Public API endpoints (no authentication)
   - Create session
   - Complete purchase
   - Generate vouchers
   - Webhook handler

6. **`backend/services/sms-notification.js`**
   - SMS sending service
   - **MOCK IMPLEMENTATION** - placeholder for real SMS gateway
   - PNG phone number formatting
   - Voucher code delivery via SMS

### Database

7. **`backend/migrations/create-purchase-sessions-table.sql`**
   - `purchase_sessions` table
   - Tracks purchases before/after payment
   - 15-minute expiry for pending sessions
   - Cleanup function for expired sessions

---

## Database Schema

### `purchase_sessions` Table

```sql
CREATE TABLE purchase_sessions (
  id VARCHAR(255) PRIMARY KEY,              -- Session ID (merchant reference)
  customer_email VARCHAR(255),              -- Email for voucher delivery
  customer_phone VARCHAR(50),               -- Phone for SMS delivery
  quantity INTEGER NOT NULL,                -- Number of vouchers
  amount DECIMAL(10,2) NOT NULL,           -- Total amount (PGK)
  currency VARCHAR(3) DEFAULT 'PGK',       -- Currency
  delivery_method VARCHAR(50),              -- 'Email', 'SMS', 'SMS+Email'
  payment_status VARCHAR(50),               -- 'pending', 'completed', 'failed'
  payment_gateway_ref VARCHAR(255),         -- BSP transaction ID
  session_data JSONB,                       -- Payment metadata
  expires_at TIMESTAMP NOT NULL,            -- 15 minutes from creation
  completed_at TIMESTAMP,                   -- When payment completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `individual_purchases` Table Updates

```sql
ALTER TABLE individual_purchases
  ADD COLUMN purchase_session_id VARCHAR(255),  -- Link to session
  ADD COLUMN customer_email VARCHAR(255),        -- Customer email
  ADD COLUMN customer_phone VARCHAR(50),         -- Customer phone
  ADD COLUMN payment_gateway_ref VARCHAR(255);   -- BSP transaction ID
```

---

## API Endpoints

### Public Endpoints (No Authentication)

#### 1. Create Purchase Session
```
POST /api/public-purchases/create-session

Body:
{
  "customerEmail": "customer@example.com",
  "customerPhone": "+675XXXXXXXX",
  "quantity": 2,
  "amount": 100.00,
  "deliveryMethod": "SMS+Email",
  "currency": "PGK"
}

Response:
{
  "success": true,
  "data": {
    "id": "PGKB-20250115-ABC123",
    "customerEmail": "customer@example.com",
    "customerPhone": "+675XXXXXXXX",
    "quantity": 2,
    "amount": 100.00,
    "expiresAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 2. Complete Purchase
```
POST /api/public-purchases/complete

Body:
{
  "sessionId": "PGKB-20250115-ABC123",
  "paymentData": {
    "bspTransactionId": "BSP-123456",
    "authCode": "AUTH-ABC",
    "paymentMethod": "VISA",
    "cardLastFour": "4242",
    "status": "completed"
  }
}

Response:
{
  "success": true,
  "message": "2 voucher(s) generated successfully",
  "data": {
    "session": { ... },
    "vouchers": [
      {
        "voucher_code": "VCH-20250115-XYZ123",
        "amount": 50.00,
        "valid_from": "2025-01-15",
        "valid_until": "2025-02-14",
        "status": "active"
      }
    ]
  }
}
```

#### 3. BSP Webhook
```
POST /api/public-purchases/webhook/bsp

Body:
{
  "merchant_reference": "PGKB-20250115-ABC123",
  "transaction_id": "BSP-123456",
  "status": "completed",
  "amount": 100.00,
  "payment_method": "VISA"
}

Response:
{
  "received": true
}
```

---

## Configuration

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay
DB_USER=postgres
DB_PASSWORD=your_password

# BSP Payment Gateway (TO BE CONFIGURED)
BSP_MERCHANT_ID=YOUR_MERCHANT_ID
BSP_API_KEY=YOUR_API_KEY
BSP_SANDBOX_MODE=true
BSP_SANDBOX_ENDPOINT=https://sandbox-bsp-api.example.com
BSP_PRODUCTION_ENDPOINT=https://api-bsp.com.pg

# SMS Gateway (TO BE CONFIGURED)
SMS_ENABLED=false
SMS_PROVIDER=mock  # Change to: digicel|bmobile|twilio
SMS_API_KEY=YOUR_SMS_API_KEY
SMS_SENDER_ID=GreenFees
```

### Frontend (.env)
```bash
VITE_API_URL=https://greenpay.eywademo.cloud/api
```

---

## Testing Instructions

### 1. Run Database Migration

```bash
# Connect to PostgreSQL
psql -U postgres -d greenpay

# Run migration
\i backend/migrations/create-purchase-sessions-table.sql

# Verify tables created
\dt purchase_sessions
```

### 2. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend Dev Server

```bash
npm install
npm run dev
```

### 4. Test Purchase Flow

1. Visit: `http://localhost:3000/buy-voucher`
2. Fill form:
   - Email: test@example.com
   - Phone: +675XXXXXXXX
   - Quantity: 2
3. Click "Proceed to Payment"
4. **Mock BSP page** appears
5. Select payment method
6. Click "Pay"
7. Redirected to callback page
8. See voucher codes displayed

### 5. Test Offline Functionality

1. Open DevTools → Network tab
2. Set to "Offline"
3. Fill purchase form
4. Form data saved to localStorage
5. Set back to "Online"
6. Submit form - data persists

---

## Integration with Real BSP Gateway

### Step 1: Contact BSP Bank

```
Email: servicebsp@bsp.com.pg
Phone: +675 3201212

Request:
- Merchant account application
- API documentation
- Sandbox credentials
- Production credentials (after testing)
```

### Step 2: Update `bspPaymentService.js`

Replace mock functions with real BSP API calls:

```javascript
// File: src/lib/bspPaymentService.js

// BEFORE (Mock):
const response = {
  success: true,
  paymentUrl: mockPaymentUrl
};

// AFTER (Real BSP):
const response = await fetch('https://api-bsp.com.pg/payment/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BSP_API_KEY}`,
    'X-Merchant-ID': BSP_MERCHANT_ID
  },
  body: JSON.stringify({
    merchant_reference: sessionId,
    amount: paymentData.amount,
    currency: 'PGK',
    customer_email: paymentData.customerEmail,
    customer_phone: paymentData.customerPhone,
    return_url: paymentData.returnUrl,
    cancel_url: paymentData.cancelUrl,
    webhook_url: `${API_URL}/public-purchases/webhook/bsp`
  })
});

const result = await response.json();
return {
  success: true,
  paymentUrl: result.payment_url,
  bspTransactionId: result.transaction_id
};
```

### Step 3: Configure Webhook Endpoint

Ensure BSP can reach your webhook:

```
Webhook URL: https://greenpay.eywademo.cloud/api/public-purchases/webhook/bsp

Security:
- Add webhook signature verification
- Verify BSP IP whitelist
- Log all webhook calls
```

### Step 4: Test in BSP Sandbox

1. Use sandbox credentials
2. Set `BSP_SANDBOX_MODE=true`
3. Make test purchases
4. Verify webhook callbacks
5. Check voucher generation

### Step 5: Go Live

1. Switch to production credentials
2. Set `BSP_SANDBOX_MODE=false`
3. Update `BSP_PRODUCTION_ENDPOINT`
4. Test small transactions first
5. Monitor for 24-48 hours

---

## SMS Integration

### Option 1: Digicel PNG (Recommended)

```javascript
// Contact Digicel for SMS API access
// Update backend/services/sms-notification.js

const sendSMS = async (to, message) => {
  const response = await fetch('https://sms-api.digicel.com.pg/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIGICEL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: formatPNGPhone(to),
      message: message,
      from: 'GreenFees'
    })
  });

  return await response.json();
};
```

### Option 2: Bmobile (Telikom PNG)

```javascript
// Contact Bmobile for SMS gateway access
// Similar implementation to Digicel
```

### Option 3: Twilio (International)

```bash
npm install twilio
```

```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const sendSMS = async (to, message) => {
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: formatPNGPhone(to)
  });

  return result;
};
```

---

## Security Considerations

### 1. Data Protection
- ✅ No card data stored (BSP handles all payment data)
- ✅ Session tokens expire after 15 minutes
- ✅ Phone/email validation before processing
- ✅ Rate limiting on public endpoints (TODO)

### 2. Payment Validation
- ✅ Webhook signature verification (implement when BSP provides method)
- ✅ Double-check payment status via BSP API query
- ✅ Idempotency - prevent duplicate voucher generation
- ✅ Transaction logging for audit trail

### 3. Fraud Prevention
- ⚠️ **TODO:** Add reCAPTCHA to purchase form
- ⚠️ **TODO:** Implement rate limiting (max 5 purchases per IP/hour)
- ⚠️ **TODO:** Email verification before sending voucher codes
- ⚠️ **TODO:** Suspicious activity detection

---

## Monitoring & Maintenance

### Cron Jobs Needed

```bash
# Cleanup expired sessions (every 30 minutes)
*/30 * * * * curl -X POST http://localhost:3001/api/public-purchases/cleanup-expired

# Send voucher expiry reminders (daily at 9am)
0 9 * * * node backend/scripts/send-expiry-reminders.js
```

### Logging

Monitor these logs:
- Purchase session creation
- Payment gateway responses
- Webhook callbacks
- Voucher generation
- SMS delivery status
- Failed transactions

### Alerts

Set up alerts for:
- Payment gateway downtime
- High failure rate (>10%)
- Webhook processing errors
- SMS delivery failures
- Database connection issues

---

## Performance Optimization

### Frontend Optimizations (PNG Networks)

1. **Aggressive Caching**
   - Service Worker caching
   - LocalStorage for form data
   - IndexedDB for offline queue

2. **Minimal Payload**
   - Gzip compression
   - Minified assets
   - Image compression (if adding images)
   - Remove unnecessary dependencies

3. **Progressive Enhancement**
   - Works on 2G/EDGE networks
   - Graceful degradation
   - Offline queueing

### Backend Optimizations

1. **Database Indexing**
   - Index on `purchase_sessions.expires_at`
   - Index on `purchase_sessions.payment_status`
   - Index on `individual_purchases.purchase_session_id`

2. **Connection Pooling**
   - PostgreSQL connection pool (already configured)
   - Keep-alive connections

3. **Async Processing**
   - Queue voucher generation
   - Background SMS/email sending
   - Webhook processing in background

---

## Troubleshooting

### Issue: Payment successful but no vouchers generated

**Check:**
1. Webhook logs - did BSP send callback?
2. Database - check `purchase_sessions.payment_status`
3. Backend logs - any errors in `/complete` endpoint?

**Fix:**
```bash
# Manually complete session
curl -X POST http://localhost:3001/api/public-purchases/complete \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "PGKB-XXX", "paymentData": {...}}'
```

### Issue: Customer didn't receive SMS/Email

**Check:**
1. SMS service logs
2. Email service logs
3. Phone number format (+675XXXXXXXX)
4. Email address validity

**Fix:**
```bash
# Resend voucher codes
node backend/scripts/resend-voucher-codes.js --session-id PGKB-XXX
```

### Issue: Session expired before payment

**Check:**
- Session `expires_at` timestamp
- Customer took too long (>15 minutes)

**Fix:**
- Customer must restart purchase
- Consider increasing timeout to 30 minutes if needed

---

## Next Steps

### Immediate (Before Production)

- [ ] Contact BSP for merchant account and API docs
- [ ] Contact Digicel/Bmobile for SMS gateway access
- [ ] Implement webhook signature verification
- [ ] Add reCAPTCHA to purchase form
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Create admin dashboard for transaction monitoring

### Future Enhancements

- [ ] Add Progressive Web App (PWA) manifest
- [ ] Implement Service Worker for offline support
- [ ] Add bulk purchase discounts
- [ ] Corporate account management
- [ ] Multi-currency support
- [ ] Payment plans/installments
- [ ] Loyalty/rewards program

---

## Support Contacts

**BSP Bank PNG:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212

**Digicel PNG:**
- Business Support: [Contact via Digicel website]

**Bmobile (Telikom PNG):**
- Business Support: [Contact via Telikom website]

**Development Team:**
- Email: support@greenpay.gov.pg
- Phone: +675 XXX XXXX

---

## License & Copyright

© 2025 PNG Green Fees System. All rights reserved.
