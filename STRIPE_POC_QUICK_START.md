# 🚀 Stripe POC Quick Start Guide
## Payment Gateway Abstraction - Testing with Stripe

**Purpose:** Test online payment flow using Stripe, then easily switch to BSP/Kina Bank for production

**Date:** December 2, 2025

---

## ✨ What Was Built

### Payment Gateway Abstraction Layer

A modular architecture that allows **easy switching** between payment gateways:

```
Your App Code
     ↓
PaymentGatewayInterface (Abstract)
     ↓
├── StripeGateway (POC/Testing) ✅
├── BSPGateway (Production - Placeholder) 📝
└── KinaBankGateway (Production Alt - Placeholder) 📝
```

**Benefits:**
- ✅ Test with Stripe now, switch to BSP later
- ✅ No code changes needed - just environment variables
- ✅ Same API for all gateways
- ✅ Easy to add new gateways in future

---

## 📁 Files Created

### Backend - Payment Gateway Layer

1. **`backend/services/payment-gateways/PaymentGatewayInterface.js`**
   - Abstract interface all gateways must implement
   - Defines standard methods: createPaymentSession, verifyPaymentSession, processWebhook, etc.

2. **`backend/services/payment-gateways/StripeGateway.js`**
   - Stripe implementation (for testing/POC)
   - Uses Stripe Checkout Sessions
   - Converts PGK to USD (≈ 0.27 exchange rate)
   - **Only accepts test API keys** (safety feature)

3. **`backend/services/payment-gateways/BSPGateway.js`**
   - BSP placeholder (to be implemented for production)
   - Contains TODO comments showing where to add real API calls

4. **`backend/services/payment-gateways/KinaBankGateway.js`**
   - Kina Bank placeholder (alternative to BSP)

5. **`backend/services/payment-gateways/PaymentGatewayFactory.js`**
   - Factory pattern for gateway selection
   - Reads `PAYMENT_GATEWAY` env variable
   - Returns appropriate gateway instance

### Backend - Routes Updated

6. **`backend/routes/public-purchases.js` (MODIFIED)**
   - New endpoint: `POST /api/public-purchases/create-payment-session`
   - New endpoint: `POST /api/public-purchases/webhook` (universal webhook handler)
   - Uses `PaymentGatewayFactory` instead of hardcoded gateways
   - Helper function: `completeVoucherPurchase()` for generating vouchers

### Configuration

7. **`backend/.env.example` (MODIFIED)**
   - Added `PAYMENT_GATEWAY=stripe|bsp|kina`
   - Added Stripe configuration section
   - Added BSP configuration (commented out)
   - Added Kina Bank configuration (commented out)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/register
2. Create free account
3. Skip activation (stay in test mode)
4. Go to **Developers** → **API Keys**
5. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### Step 2: Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

**Add these lines:**
```env
# Payment Gateway
PAYMENT_GATEWAY=stripe

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE
```

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install stripe

# Frontend (if needed)
cd ..
npm install @stripe/stripe-js
```

### Step 4: Start Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

---

## 🧪 Testing Locally

### Test the API Endpoint

```bash
curl -X POST http://localhost:3001/api/public-purchases/create-payment-session \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerPhone": "+67512345678",
    "quantity": 2,
    "amount": 100,
    "currency": "USD",
    "returnUrl": "http://localhost:3000/purchase/callback",
    "cancelUrl": "http://localhost:3000/buy-voucher"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "PGKB-1234567890-ABC123",
    "paymentUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "expiresAt": "2025-12-02T15:30:00.000Z",
    "gateway": "stripe",
    "metadata": {
      "stripeSessionId": "cs_test_...",
      "amountUSD": 13.50,
      "amountPGK": 100,
      "exchangeRate": 0.27
    }
  }
}
```

### Test with Stripe Test Cards

When redirected to Stripe Checkout, use these test cards:

| Card Number | Result | Use Case |
|-------------|--------|----------|
| `4242 4242 4242 4242` | ✅ Success | Normal payment |
| `4000 0025 0000 3155` | ✅ Success (3D Secure) | Test authentication |
| `4000 0000 0000 9995` | ❌ Declined | Test failure handling |
| `4000 0000 0000 0069` | ❌ Expired card | Test validation |

- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Test Webhooks Locally

Stripe webhooks need a public URL. For local testing:

**Option A: Stripe CLI (Recommended)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3001/api/public-purchases/webhook?gateway=stripe

# In another terminal, trigger test webhook
stripe trigger checkout.session.completed
```

**Option B: ngrok (Alternative)**
```bash
# Install ngrok
brew install ngrok  # Mac

# Start tunnel
ngrok http 3001

# Use the HTTPS URL in Stripe Dashboard:
# https://abc123.ngrok.io/api/public-purchases/webhook?gateway=stripe
```

---

## 📊 How It Works

### Payment Flow

```
1. Customer fills form → frontend
2. Frontend calls: POST /api/public-purchases/create-payment-session
3. Backend:
   - Saves to purchase_sessions table
   - Calls PaymentGatewayFactory.getGateway() → returns StripeGateway
   - StripeGateway.createPaymentSession() → creates Stripe checkout
   - Returns payment URL
4. Customer redirected to Stripe → enters card → pays
5. Stripe sends webhook to: POST /api/public-purchases/webhook?gateway=stripe
6. Backend:
   - Verifies webhook signature
   - Generates vouchers
   - Updates purchase_sessions table
   - Sends SMS/Email (TODO)
7. Customer redirected back → sees voucher codes
```

### Database Flow

```sql
-- Step 1: Create session
INSERT INTO purchase_sessions (
  id, customer_email, customer_phone, quantity, amount, currency,
  payment_status, expires_at
) VALUES (
  'PGKB-123', 'test@example.com', '+675123', 2, 100, 'PGK',
  'pending', NOW() + INTERVAL '15 minutes'
);

-- Step 2: Webhook completes payment
UPDATE purchase_sessions
SET payment_status = 'completed',
    payment_gateway_ref = 'pi_stripe_123',
    completed_at = NOW()
WHERE id = 'PGKB-123';

-- Step 3: Generate vouchers
INSERT INTO individual_purchases (
  customer_email, voucher_code, amount, payment_mode,
  valid_from, valid_until, status, purchase_session_id
) VALUES
  ('test@example.com', 'VCH-ABC', 50, 'Stripe', NOW(), NOW() + 30, 'active', 'PGKB-123'),
  ('test@example.com', 'VCH-DEF', 50, 'Stripe', NOW(), NOW() + 30, 'active', 'PGKB-123');
```

---

## 🔄 Switching to BSP/Kina Bank (Production)

### Step 1: Get BSP/Kina Bank Credentials

**BSP Bank PNG:**
- Contact: servicebsp@bsp.com.pg | +675 3201212
- Request merchant account
- Get: Merchant ID, API Key, Webhook Secret, API endpoints

**Kina Bank:**
- Contact Kina Bank PNG
- Request payment gateway access

### Step 2: Update .env

```env
# Change gateway
PAYMENT_GATEWAY=bsp  # or 'kina'

# Add BSP credentials
BSP_MERCHANT_ID=your_merchant_id
BSP_API_KEY=your_api_key
BSP_WEBHOOK_SECRET=your_webhook_secret
BSP_MODE=sandbox  # Change to 'production' when ready
BSP_SANDBOX_URL=https://sandbox-bsp.example.com
BSP_PRODUCTION_URL=https://api-bsp.com.pg
```

### Step 3: Implement BSP/Kina Gateway

Edit `backend/services/payment-gateways/BSPGateway.js`:

```javascript
// Find all TODO comments and replace with actual BSP API calls
// Example:

async createPaymentSession(params) {
  // Replace this placeholder code:
  /*
  return {
    paymentUrl: `/mock-bsp-payment`,
    sessionId: `BSP-${params.sessionId}`,
    ...
  };
  */

  // With actual BSP API call:
  const response = await fetch(`${this.getEndpoint()}/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Merchant-ID': this.config.merchantId
    },
    body: JSON.stringify({
      merchant_reference: params.sessionId,
      amount: params.amountPGK,
      currency: 'PGK',
      customer: {
        email: params.customerEmail,
        phone: params.customerPhone
      },
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl
    })
  });

  const data = await response.json();

  return {
    paymentUrl: data.payment_url,
    sessionId: data.bsp_session_id,
    expiresAt: new Date(data.expires_at),
    metadata: data
  };
}
```

### Step 4: Test in Sandbox

```bash
# Restart backend
cd backend
npm run dev

# Test with BSP sandbox
# Payment will now go through BSP instead of Stripe
```

### Step 5: Go Live

```env
# Switch to production mode
PAYMENT_GATEWAY=bsp
BSP_MODE=production
```

**That's it!** No code changes needed - just environment variables.

---

## 🎯 Frontend Integration

The frontend needs minimal changes to support the new abstraction.

### Updated PublicVoucherPurchase.jsx

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Call new unified endpoint
    const response = await fetch(`${API_URL}/public-purchases/create-payment-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: formData.email,
        customerPhone: formData.phone,
        quantity: formData.quantity,
        amount: 50 * formData.quantity,
        currency: 'PGK',
        returnUrl: `${window.location.origin}/purchase/callback`,
        cancelUrl: `${window.location.origin}/buy-voucher`,
        deliveryMethod: formData.preferSMS ? 'SMS+Email' : 'Email'
      })
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to payment gateway (Stripe, BSP, or Kina)
      window.location.href = data.data.paymentUrl;
    }
  } catch (error) {
    console.error('Payment error:', error);
    toast.error('Failed to initiate payment');
  } finally {
    setSubmitting(false);
  }
};
```

**Key Points:**
- Uses `/create-payment-session` (new unified endpoint)
- Works with any gateway (Stripe, BSP, Kina)
- No frontend changes needed when switching gateways

---

## 📋 Deployment Checklist

### Testing Phase (Stripe)

- [ ] Install dependencies: `npm install stripe`
- [ ] Configure `.env` with Stripe test keys
- [ ] Set `PAYMENT_GATEWAY=stripe`
- [ ] Start backend: `npm run dev`
- [ ] Test API endpoint with curl
- [ ] Test with Stripe test cards
- [ ] Set up Stripe CLI for webhook testing
- [ ] Verify voucher generation after payment
- [ ] Check database updates
- [ ] Test refund flow (optional)

### Production Phase (BSP/Kina)

- [ ] Obtain BSP/Kina Bank credentials
- [ ] Update `.env` with production credentials
- [ ] Set `PAYMENT_GATEWAY=bsp` (or `kina`)
- [ ] Implement real API calls in `BSPGateway.js`
- [ ] Test in sandbox mode
- [ ] Verify webhook signature validation
- [ ] Test complete payment flow end-to-end
- [ ] Switch to production mode
- [ ] Monitor first real transactions
- [ ] Set up error alerting

---

## 🐛 Troubleshooting

### "Payment gateway 'stripe' is not properly configured"

**Solution:**
```bash
# Check .env file has:
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Restart backend
npm run dev
```

### "Only test keys allowed during POC phase"

**Solution:**
This is a safety feature. StripeGateway only accepts test keys (`sk_test_...`).

If you need to use live keys:
1. Edit `backend/services/payment-gateways/StripeGateway.js`
2. Remove the test key check in `isAvailable()` method
3. Or better: wait until BSP/Kina production is ready

### Webhooks not received

**Solution:**
```bash
# For local testing, use Stripe CLI:
stripe listen --forward-to http://localhost:3001/api/public-purchases/webhook?gateway=stripe

# For production, configure webhook in Stripe Dashboard:
# URL: https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe
# Events: checkout.session.completed, checkout.session.expired
```

### "Unknown payment gateway: xyz"

**Solution:**
```bash
# Check .env has valid gateway name:
PAYMENT_GATEWAY=stripe  # or 'bsp' or 'kina'

# Valid options:
# - stripe (for testing)
# - bsp (for production)
# - kina (for production alternative)
```

---

## 📊 Monitoring & Logs

### Backend Logs

Watch for these log messages:

```
✅ Payment gateway initialized: stripe
💳 Using payment gateway: stripe
✅ Payment session created: PGKB-123 via stripe
📥 Webhook received for gateway: stripe
✅ Webhook verified: checkout.session.completed
✅ Purchase completed: PGKB-123, 2 voucher(s) generated
```

### Database Queries

```sql
-- Check purchase sessions
SELECT * FROM purchase_sessions ORDER BY created_at DESC LIMIT 10;

-- Check generated vouchers
SELECT * FROM individual_purchases
WHERE purchase_session_id IS NOT NULL
ORDER BY created_at DESC LIMIT 10;

-- Check payment status
SELECT
  id,
  payment_status,
  payment_gateway_ref,
  created_at,
  completed_at
FROM purchase_sessions
WHERE payment_status = 'completed';
```

---

## 🎓 Next Steps

1. **Test the Flow** - Use this guide to test with Stripe
2. **Verify Everything Works** - Check voucher generation, reports, etc.
3. **Contact BSP/Kina Bank** - Get production credentials
4. **Implement Production Gateway** - Update BSPGateway.js with real API calls
5. **Test in Sandbox** - Before going live
6. **Deploy to Production** - Switch `PAYMENT_GATEWAY` env variable

---

## 📞 Support

### Stripe
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing

### BSP Bank PNG
- Email: servicebsp@bsp.com.pg
- Phone: +675 3201212

### Kina Bank
- Website: kinabank.com.pg

---

**Version:** 1.0
**Date:** December 2, 2025
**Status:** Ready for Testing
