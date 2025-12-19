# BSP DOKU Payment Gateway - Implementation Summary

**Date:** December 19, 2024
**Status:** ✅ Implementation Complete - Ready for Testing
**Integration Type:** DOKU Hosted Payment Pages API v1.29

---

## 📋 What Was Implemented

### 1. BSP Payment Gateway Adapter
**File:** `backend/services/payment-gateways/BSPGateway.js`

Implements complete DOKU Hosted Payment Pages integration:

- **WORDS Signature Generation**
  - SHA1 hashing algorithm
  - Payment Request: `SHA1(AMOUNT + MALLID + SHARED_KEY + TRANSIDMERCHANT)`
  - Webhook Verification: `SHA1(AMOUNT + MALLID + SHARED_KEY + TRANSIDMERCHANT + RESULTMSG + VERIFYSTATUS)`
  - Supports non-IDR currencies (PGK = ISO 598)

- **Payment Request Creation**
  - Generates DOKU form parameters
  - Returns hosted payment page URL
  - Formats amount to 12.2 decimal places
  - Timestamp formatting (YYYYMMDDHHMMSS)
  - Basket/transaction description

- **Check Status API**
  - Query transaction status from DOKU
  - XML response parsing
  - Status mapping (completed/pending/failed)

- **Webhook Processing**
  - Signature verification
  - Status code mapping (0000 = success)
  - Payment details extraction

- **Void/Refund API**
  - Cancel unsettled transactions
  - WORDS signature for void requests

### 2. DOKU Webhook Routes
**File:** `backend/routes/payment-webhook-doku.js`

Two webhook endpoints:

- **Notify Webhook** (`/api/payment/webhook/doku/notify`)
  - Server-to-server notification
  - WORDS signature verification
  - Database transaction updates
  - Responds with "CONTINUE" to DOKU

- **Redirect Webhook** (`/api/payment/webhook/doku/redirect`)
  - Browser redirect after payment
  - Success/failure page routing
  - Customer-facing completion

---

## 🔐 Security Features

1. **WORDS Signature Verification**
   - All requests signed with SHA1 hash
   - Prevents tampering and replay attacks
   - Shared key never exposed in requests

2. **IP Whitelisting** (Recommended)
   - Test IPs: 103.10.130.75, 147.139.130.145
   - Production IPs: 103.10.130.35, 147.139.129.160

3. **Webhook Validation**
   - Signature verification on all webhooks
   - Invalid signatures rejected with "STOP" response

---

## 🚀 Deployment Steps

### Step 1: Add Environment Variables

Add to production server `.env` file:

```bash
# BSP DOKU Integration (TEST Environment)
BSP_DOKU_MALL_ID=11170
BSP_DOKU_SHARED_KEY=ywSd48uOfypN
BSP_DOKU_MODE=test
BSP_DOKU_CHAIN_MERCHANT=NA

# For production (when ready):
# BSP_DOKU_MODE=production
# BSP_DOKU_MALL_ID=<production_mall_id>
# BSP_DOKU_SHARED_KEY=<production_shared_key>
```

### Step 2: Mount Webhook Routes

Add to `backend/server.js`:

```javascript
// BSP DOKU Payment Webhooks
const paymentWebhookDoku = require('./routes/payment-webhook-doku');
app.use('/api/payment/webhook/doku', paymentWebhookDoku);
```

### Step 3: Deploy Files

Deploy the following files to production:

```bash
backend/services/payment-gateways/BSPGateway.js
backend/routes/payment-webhook-doku.js
```

Restart backend service:
```bash
pm2 restart greenpay-api
```

### Step 4: Provide URLs to BSP

Send these URLs to BSP for DOKU configuration:

| Purpose | URL |
|---------|-----|
| Test Website | https://greenpay.eywademo.cloud/buy-online |
| Notify URL | https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify |
| Redirect URL (Success) | https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect |

### Step 5: Configure IP Whitelisting

Allow these IPs in firewall for TEST environment:
- 103.10.130.75
- 147.139.130.145

---

## 🧪 Testing the Integration

### Test Flow

1. **Customer visits buy-online page**
   - Selects quantity and enters details
   - Clicks "Proceed to Payment"

2. **System creates payment session**
   - Generates WORDS signature
   - Creates form parameters
   - Redirects to DOKU hosted page

3. **Customer pays on DOKU page**
   - Enters credit card details
   - Completes 3D Secure verification
   - DOKU processes payment

4. **DOKU sends Notify webhook**
   - Server verifies WORDS signature
   - Updates transaction in database
   - Responds "CONTINUE"

5. **DOKU redirects customer**
   - Success: `/payment/success?session=XXX`
   - Failure: `/payment/failure?session=XXX&error=...`

### Test Cards (Request from BSP)

You'll need test card numbers from BSP Digital Testing Team for sandbox testing.

---

## 📊 Payment Flow Diagram

```
Customer → Merchant → DOKU → 3D Secure → Bank → DOKU → Merchant
   ↓          ↓         ↓                           ↓        ↓
 Browse    Create    Show                       Notify   Update
           Request   Payment                    Webhook  Database
                     Page                                   ↓
                                                      Customer
                                                      Redirected
```

---

## 🔧 Technical Specifications

### Currency Code
- **PGK (Papua New Guinea Kina)** = ISO 3166 code `598`

### Payment Channel
- **Credit Card** = Channel code `15`

### Response Codes
- `0000` = Success
- `5511` = Payment not yet completed (pending)
- Others = Failed (see DOKU documentation)

### DOKU Endpoints

**Test Environment:**
- Payment: https://staging.doku.com/Suite/Receive
- Check Status: https://staging.doku.com/Suite/CheckStatus
- Void: https://staging.doku.com/Suite/VoidRequest

**Production Environment:**
- Payment: https://pay.doku.com/Suite/Receive
- Check Status: https://pay.doku.com/Suite/CheckStatus
- Void: https://pay.doku.com/Suite/VoidRequest

---

## 📝 Database Schema

Transactions are stored in `payment_gateway_transactions` table:

```sql
CREATE TABLE payment_gateway_transactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  gateway_name VARCHAR(50) NOT NULL,
  gateway_session_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL,
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Next Steps

1. **Deploy to test server** ⏳
   - Add environment variables
   - Mount webhook routes
   - Restart PM2 service

2. **Provide URLs to BSP** ⏳
   - Send test website URL
   - Send notify webhook URL
   - Send redirect webhook URL

3. **BSP Testing (10 days)** ⏳
   - BSP Digital Testing Team tests payments
   - Monitor webhook logs
   - Fix any issues found

4. **Production Deployment** ⏳
   - Switch to production credentials
   - Update Mall ID and Shared Key
   - Set `BSP_DOKU_MODE=production`
   - Update IP whitelist
   - Media release
   - Go live!

---

## 📞 Support Contacts

**BSP Bank PNG:**
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212
- Reference: Climate Change Dev Authority integration

**DOKU Technical Support:**
- Contact through BSP technical team
- Reference: Mall ID 11170 (test)

---

## ✅ Implementation Checklist

### Code Implementation
- [x] BSPGateway.js with DOKU API
- [x] WORDS signature generation (SHA1)
- [x] Payment request creation
- [x] Check Status API
- [x] Webhook signature verification
- [x] Webhook routes (notify & redirect)
- [x] Database transaction updates
- [x] PGK currency support (ISO 598)

### Deployment Tasks
- [ ] Add environment variables to server
- [ ] Mount webhook routes in server.js
- [ ] Deploy to test environment
- [ ] Test locally or in staging
- [ ] Provide URLs to BSP
- [ ] Configure IP whitelisting
- [ ] BSP Digital Testing Team testing (10 days)
- [ ] Fix any issues found
- [ ] Switch to production credentials
- [ ] Go live!

---

## 🎉 Implementation Complete!

The BSP DOKU payment gateway integration is **fully implemented** and ready for deployment and testing. The payment gateway factory pattern already supports multiple gateways, so Stripe can remain available for testing while BSP is being configured.

**Estimated Time to Deploy:** 30-60 minutes
**Testing Timeline:** 10 days (BSP requirement)
