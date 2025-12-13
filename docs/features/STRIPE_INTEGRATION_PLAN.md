# 🎯 Stripe Payment Integration Plan
## PNG Green Fees System

**Date:** December 2, 2025
**Status:** Planning Phase
**Estimated Implementation Time:** 2-3 weeks

---

## ⚠️ IMPORTANT: Stripe Availability in PNG

### Current Situation
**Stripe is NOT officially supported in Papua New Guinea** as of 2025. PNG is not on Stripe's list of supported countries.

### Available Options

#### Option 1: Workaround via US LLC (Recommended if Stripe is required)
- Establish a US-based Limited Liability Company (LLC)
- Obtain US Employer Identification Number (EIN)
- Open a US bank account
- Register Stripe account under the US entity
- **Pros:** Full Stripe functionality, international credibility
- **Cons:** Complex setup, legal/tax implications, currency conversion fees

#### Option 2: Use Local PNG Payment Gateways (Currently Implemented)
- **BSP Internet Payment Gateway** - Already planned in codebase
- **Cloudcode IPG** - Local PNG provider
- **NiuPay** - PNG fintech solution
- **Pros:** Local support, PGK native, PNG regulations compliant
- **Cons:** Less international recognition

#### Option 3: Hybrid Approach (Best of Both Worlds)
- Keep BSP IPG for local PNG customers (PGK payments)
- Add Stripe for international customers (USD/AUD payments)
- Let customer choose payment gateway at checkout
- **Pros:** Maximum flexibility, serves both markets
- **Cons:** Maintain two integrations

---

## 📋 Prerequisites

### 1. Stripe Account Setup

**If using Workaround (US LLC approach):**
- [ ] Register US LLC (via services like doola, Firstbase, or directly)
- [ ] Obtain EIN from IRS
- [ ] Open US bank account (Mercury, Wise Business, etc.)
- [ ] Register Stripe account with US business details
- [ ] Verify business documents

**OR If Stripe becomes available in PNG:**
- [ ] Register PNG business with Stripe
- [ ] Complete KYC verification
- [ ] Add bank account for payouts

### 2. Stripe Credentials Needed

You'll need the following from Stripe Dashboard:

**Development (Test Mode):**
- `STRIPE_TEST_PUBLISHABLE_KEY` - Frontend client-side key (starts with `pk_test_`)
- `STRIPE_TEST_SECRET_KEY` - Backend server-side key (starts with `sk_test_`)
- `STRIPE_TEST_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_test_`)

**Production (Live Mode):**
- `STRIPE_LIVE_PUBLISHABLE_KEY` - Frontend key (starts with `pk_live_`)
- `STRIPE_LIVE_SECRET_KEY` - Backend key (starts with `sk_live_`)
- `STRIPE_LIVE_WEBHOOK_SECRET` - Webhook secret (starts with `whsec_`)

### 3. Technical Requirements

**Backend Dependencies:**
```bash
npm install stripe@latest           # Official Stripe Node.js SDK
npm install express                 # Already installed
npm install dotenv                  # Already installed
```

**Frontend Dependencies:**
```bash
npm install @stripe/stripe-js       # Stripe.js (official client library)
npm install @stripe/react-stripe-js # React components for Stripe
```

---

## 🏗️ Architecture Design

### Payment Flow (Stripe Checkout Session Approach)

```
┌─────────────────┐
│  Customer       │
│  Fills Form     │
│  (Buy Voucher)  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│  Frontend: PublicVoucherPurchase.jsx    │
│  - Collect customer info                │
│  - Select quantity (1-20 vouchers)      │
│  - Calculate total (PGK 50 each)        │
└────────┬────────────────────────────────┘
         │
         │ POST /api/public-purchases/create-stripe-session
         ↓
┌─────────────────────────────────────────┐
│  Backend: public-purchases.js           │
│  1. Create purchase_session record      │
│  2. Create Stripe Checkout Session      │
│  3. Return redirect URL                 │
└────────┬────────────────────────────────┘
         │
         │ Redirect to Stripe Hosted Checkout
         ↓
┌─────────────────────────────────────────┐
│  Stripe Hosted Checkout Page            │
│  - Customer enters card details         │
│  - Stripe handles 3D Secure/SCA         │
│  - Customer confirms payment            │
└────────┬────────────────────────────────┘
         │
         │ Payment Success/Failure
         ↓
┌─────────────────────────────────────────┐
│  Stripe Webhook                          │
│  POST /api/public-purchases/webhook/    │
│       stripe                             │
│  - Verify webhook signature             │
│  - Process payment event                │
│  - Generate vouchers                    │
│  - Send SMS/Email                       │
└────────┬────────────────────────────────┘
         │
         │ Redirect back to our site
         ↓
┌─────────────────────────────────────────┐
│  Frontend: PublicPurchaseCallback.jsx   │
│  - Fetch session status                 │
│  - Display voucher codes                │
│  - Option to register passport          │
└─────────────────────────────────────────┘
```

### Alternative: Payment Intents API (Advanced)

For more control over the payment flow, use Payment Intents API instead of Checkout Sessions.

**Use Checkout Sessions if:**
- ✅ You want Stripe-hosted payment page (easier, PCI compliant)
- ✅ Quick implementation
- ✅ Don't need custom payment form styling

**Use Payment Intents if:**
- ✅ You want custom payment form on your site
- ✅ Need granular control over payment flow
- ✅ Complex multi-step checkout process

---

## 📁 Files to Create/Modify

### New Backend Files

#### 1. `backend/services/stripeService.js` (NEW)
Stripe payment service with all payment operations.

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe Checkout Session
 */
async function createCheckoutSession(sessionData) {
  // Create Checkout Session with line items
  // Return session URL for redirect
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  // Verify using STRIPE_WEBHOOK_SECRET
}

/**
 * Handle payment success
 */
async function handlePaymentSuccess(session) {
  // Generate vouchers, send notifications
}

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature,
  handlePaymentSuccess
};
```

#### 2. `backend/routes/stripe-webhooks.js` (NEW)
Dedicated webhook handler for Stripe events.

```javascript
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify signature
  // Handle events: checkout.session.completed, payment_intent.succeeded, etc.
  // Update database, generate vouchers
});

module.exports = router;
```

### Files to Modify

#### 3. `backend/routes/public-purchases.js` (MODIFY)
Add new endpoint for Stripe checkout session creation.

**Add:**
```javascript
/**
 * POST /api/public-purchases/create-stripe-session
 * Create Stripe Checkout Session for voucher purchase
 */
router.post('/create-stripe-session', async (req, res) => {
  // Create purchase_session record
  // Create Stripe Checkout Session
  // Return session URL
});
```

#### 4. `backend/.env` (MODIFY)
Add Stripe credentials.

**Add:**
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_test_... or whsec_...
STRIPE_CURRENCY=PGK  # or USD if using workaround
STRIPE_MODE=test  # or 'live' for production

# Webhook URL (must be publicly accessible)
STRIPE_WEBHOOK_URL=https://greenpay.eywademo.cloud/api/webhooks/stripe
```

#### 5. `backend/server.js` (MODIFY)
Register Stripe webhook route.

**Add:**
```javascript
const stripeWebhookRouter = require('./routes/stripe-webhooks');

// IMPORTANT: Stripe webhooks need raw body, register BEFORE express.json()
app.use('/api/webhooks/stripe', stripeWebhookRouter);

// Then other routes...
app.use(express.json());
app.use('/api/public-purchases', publicPurchasesRouter);
```

#### 6. `backend/package.json` (MODIFY)
Add Stripe dependency.

**Add to dependencies:**
```json
{
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
```

### Frontend Files

#### 7. `src/lib/stripePaymentService.js` (NEW)
Frontend Stripe service wrapper.

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Initiate Stripe Checkout
 */
export async function initiateStripeCheckout(purchaseData) {
  // Call backend to create checkout session
  // Redirect to Stripe Checkout
}

/**
 * Verify payment status
 */
export async function verifyStripePayment(sessionId) {
  // Check session status
}
```

#### 8. `src/pages/PublicVoucherPurchase.jsx` (MODIFY)
Add Stripe as payment option alongside BSP.

**Modify:**
```javascript
// Add payment method selection
const [paymentMethod, setPaymentMethod] = useState('bsp'); // or 'stripe'

const handleSubmit = async () => {
  if (paymentMethod === 'stripe') {
    // Use Stripe flow
    const session = await initiateStripeCheckout(sessionData);
    // Stripe will redirect
  } else {
    // Use BSP flow (existing code)
    const session = await initiateBSPPayment(sessionData);
  }
};
```

#### 9. `.env.local` (MODIFY)
Add Stripe public key for frontend.

**Add:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```

#### 10. `package.json` (MODIFY)
Add Stripe frontend dependencies.

**Add:**
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.4.0",
    "@stripe/react-stripe-js": "^2.5.0"
  }
}
```

---

## 🔐 Security Considerations

### 1. Webhook Signature Verification
**CRITICAL:** Always verify webhook signatures to prevent fake payment confirmations.

```javascript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 2. Environment Variables
- Store API keys in `.env` files
- **NEVER** commit `.env` to git
- Use different keys for test/production
- Rotate keys periodically

### 3. HTTPS Required
- Stripe webhooks require HTTPS
- Current domain: `https://greenpay.eywademo.cloud` ✅ (Already has SSL)

### 4. Idempotency
- Handle duplicate webhooks (Stripe may retry)
- Use `purchase_session.id` to prevent duplicate voucher generation

### 5. PCI Compliance
- **Using Stripe Checkout:** Stripe handles card data (PCI compliant by default) ✅
- **Using Payment Element:** Still PCI compliant, card data never touches your server ✅
- **NEVER** store card numbers in your database

---

## 💰 Currency Handling

### Challenge: Stripe + PNG Kina (PGK)

**Option A: Use PGK if Stripe supports it**
- Check Stripe dashboard if PGK is available
- Vouchers are PGK 50.00 each
- No currency conversion needed

**Option B: Use USD with conversion (if using US LLC workaround)**
- Convert PGK to USD at payment time
- Example: PGK 50 ≈ USD 13.50 (at ~3.7 exchange rate)
- Display both currencies to customer
- Store original PGK amount in database
- **Note:** Exchange rates fluctuate

**Option C: Use AUD (Australia close to PNG)**
- Convert PGK to AUD
- Lower conversion fees than USD for PNG customers
- Example: PGK 50 ≈ AUD 19 (at ~2.6 exchange rate)

### Recommended Approach
```javascript
const EXCHANGE_RATES = {
  PGK_TO_USD: 0.27,
  PGK_TO_AUD: 0.38
};

function convertAmount(amountPGK, targetCurrency) {
  if (targetCurrency === 'USD') {
    return Math.ceil(amountPGK * EXCHANGE_RATES.PGK_TO_USD * 100); // Stripe uses cents
  }
  // ... similar for AUD
}
```

---

## 📊 Database Schema Updates

### Option 1: Extend existing `purchase_sessions` table

**Add columns:**
```sql
ALTER TABLE purchase_sessions
  ADD COLUMN payment_provider VARCHAR(50) DEFAULT 'BSP',  -- 'BSP' or 'STRIPE'
  ADD COLUMN stripe_session_id VARCHAR(255),
  ADD COLUMN stripe_payment_intent VARCHAR(255),
  ADD COLUMN stripe_customer_id VARCHAR(255),
  ADD COLUMN original_currency VARCHAR(3),
  ADD COLUMN original_amount DECIMAL(10,2),
  ADD COLUMN exchange_rate DECIMAL(10,6);
```

### Option 2: Create separate table for Stripe sessions

```sql
CREATE TABLE stripe_sessions (
  id SERIAL PRIMARY KEY,
  purchase_session_id VARCHAR(255) REFERENCES purchase_sessions(id),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  amount_total INTEGER,  -- Amount in cents
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

**Recommendation:** Use Option 1 (extend existing table) for simplicity.

---

## 🧪 Testing Strategy

### Phase 1: Local Testing (Test Mode)

**1. Setup Test Environment**
```bash
# Backend
cd backend
npm install stripe
echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY" >> .env
echo "STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET" >> .env
npm run dev

# Frontend
cd ..
npm install @stripe/stripe-js @stripe/react-stripe-js
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY" >> .env.local
npm run dev
```

**2. Test with Stripe Test Cards**
- Card Number: `4242 4242 4242 4242` (Success)
- Card Number: `4000 0025 0000 3155` (Requires 3D Secure)
- Card Number: `4000 0000 0000 9995` (Declined)
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)

**3. Test Webhook Locally**
- Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- Login: `stripe login`
- Forward webhooks: `stripe listen --forward-to http://localhost:3001/api/webhooks/stripe`
- Test webhook: `stripe trigger checkout.session.completed`

### Phase 2: Staging Testing

**1. Deploy to Staging Server**
- Use test keys on staging
- Accessible webhook URL needed
- Test end-to-end flow

**2. Test Scenarios**
- [ ] Successful payment → vouchers generated → SMS sent
- [ ] Failed payment → session remains pending
- [ ] Expired session → cannot complete
- [ ] Duplicate webhook → idempotency works
- [ ] 3D Secure authentication
- [ ] Customer cancels payment
- [ ] Network timeout handling

### Phase 3: Production Testing

**1. Switch to Live Keys**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MODE=live
```

**2. Small Test Transactions**
- Make real purchases with small amounts
- Verify entire flow works
- Check SMS delivery
- Verify database updates

**3. Monitor Stripe Dashboard**
- Watch for errors
- Check webhook delivery
- Review customer disputes

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Stripe account verified and activated
- [ ] Live API keys obtained
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] SSL certificate active on domain (Already ✅)
- [ ] Database migrations run
- [ ] Environment variables set on server
- [ ] Dependencies installed (`npm install`)
- [ ] Code tested in staging with test keys

### Deployment Steps

**1. Backend Deployment**
```bash
# Upload files to server
scp backend/services/stripeService.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/
scp backend/routes/stripe-webhooks.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/routes/public-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Update dependencies
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && npm install"

# Set environment variables
ssh root@72.61.208.79 "cat >> /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env << EOF
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=PGK
STRIPE_MODE=live
EOF"

# Run database migration
ssh root@72.61.208.79 "psql -U greenpay_user -d greenpay_db -f /path/to/migration.sql"

# Restart PM2
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```

**2. Frontend Deployment**
```bash
# Update environment variables
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_..." >> .env.local

# Build production bundle
npm run build

# Deploy (existing process)
./deploy-frontend.sh  # or however you deploy frontend
```

**3. Configure Stripe Webhook**
- Go to Stripe Dashboard → Developers → Webhooks
- Click "Add endpoint"
- URL: `https://greenpay.eywademo.cloud/api/webhooks/stripe`
- Select events:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy webhook signing secret to `.env`

### Post-Deployment

- [ ] Test with real card (small amount)
- [ ] Verify webhook receives events
- [ ] Check voucher generation
- [ ] Verify SMS delivery
- [ ] Monitor PM2 logs: `pm2 logs greenpay-api`
- [ ] Monitor Stripe Dashboard for errors
- [ ] Test refund process
- [ ] Set up error alerting (email/SMS on failures)

---

## 🔄 Migration Strategy: BSP → Stripe or Hybrid

### Scenario A: Replace BSP with Stripe

**Steps:**
1. Keep existing BSP code but disable UI option
2. Add Stripe as only payment method
3. All new purchases go through Stripe
4. Existing BSP vouchers remain valid

### Scenario B: Hybrid (Both BSP and Stripe)

**Recommended Approach:**

**1. Add Payment Method Selection**
```jsx
<div className="payment-method-selection">
  <label>
    <input type="radio" value="bsp" checked={method === 'bsp'} />
    BSP Bank PNG (Local Payment - PGK)
  </label>
  <label>
    <input type="radio" value="stripe" checked={method === 'stripe'} />
    Credit/Debit Card (International - Stripe)
  </label>
</div>
```

**2. Route to appropriate service**
```javascript
if (method === 'stripe') {
  return await createStripeSession(data);
} else {
  return await createBSPSession(data);
}
```

**3. Unified callback handler**
Both payment methods redirect to same callback page which checks `payment_provider` field.

---

## 📝 Code Examples

### Complete Stripe Service Implementation

```javascript
// backend/services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CURRENCY = process.env.STRIPE_CURRENCY || 'PGK';
const MODE = process.env.STRIPE_MODE || 'test';

/**
 * Create Stripe Checkout Session
 */
exports.createCheckoutSession = async ({
  purchaseSessionId,
  customerEmail,
  customerPhone,
  quantity,
  amountPGK,
  returnUrl,
  cancelUrl,
}) => {
  try {
    // Calculate amount (Stripe uses smallest currency unit - cents/toea)
    const amount = Math.round(amountPGK * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY.toLowerCase(),
            product_data: {
              name: 'PNG Green Fees Exit Pass Voucher',
              description: `${quantity} voucher(s) @ PGK 50.00 each`,
              images: ['https://greenpay.eywademo.cloud/logo.png'],
            },
            unit_amount: 5000, // PGK 50.00 in toea
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      client_reference_id: purchaseSessionId, // Our session ID
      metadata: {
        purchase_session_id: purchaseSessionId,
        customer_phone: customerPhone,
        quantity: quantity,
      },
      expires_at: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      expiresAt: new Date(session.expires_at * 1000),
    };
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Verify Webhook Signature
 */
exports.verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Retrieve Checkout Session
 */
exports.getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    throw error;
  }
};

/**
 * Handle Successful Payment
 */
exports.handlePaymentSuccess = async (session, db) => {
  const purchaseSessionId = session.client_reference_id;
  const stripeSessionId = session.id;
  const paymentIntentId = session.payment_intent;

  // Update purchase_session
  await db.query(
    `UPDATE purchase_sessions
     SET payment_status = 'completed',
         payment_provider = 'STRIPE',
         stripe_session_id = $1,
         stripe_payment_intent = $2,
         completed_at = NOW()
     WHERE id = $3`,
    [stripeSessionId, paymentIntentId, purchaseSessionId]
  );

  console.log(`✅ Stripe payment successful for session: ${purchaseSessionId}`);
  return { success: true };
};

/**
 * Process Refund
 */
exports.processRefund = async (paymentIntentId, amount, reason) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // Amount in cents/toea
      reason: reason || 'requested_by_customer',
    });
    return refund;
  } catch (error) {
    console.error('Refund failed:', error);
    throw error;
  }
};
```

### Frontend Stripe Integration

```javascript
// src/lib/stripePaymentService.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Initiate Stripe Checkout
 */
export async function initiateStripeCheckout(purchaseData) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  try {
    // Call backend to create checkout session
    const response = await fetch(`${API_URL}/public-purchases/create-stripe-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: purchaseData.customerEmail,
        customerPhone: purchaseData.customerPhone,
        quantity: purchaseData.quantity,
        amount: purchaseData.amount,
        returnUrl: `${window.location.origin}/purchase/callback`,
        cancelUrl: `${window.location.origin}/buy-voucher`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { sessionId, checkoutUrl } = await response.json();

    // Redirect to Stripe Checkout
    window.location.href = checkoutUrl;

    return { sessionId, checkoutUrl };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

/**
 * Verify Stripe Payment Status
 */
export async function verifyStripePayment(sessionId) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  try {
    const response = await fetch(
      `${API_URL}/public-purchases/stripe-session/${sessionId}`
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}
```

---

## 💵 Pricing & Fees

### Stripe Fees (Standard Pricing)

**International Cards:**
- 2.9% + $0.30 USD per successful charge
- Additional 1.5% for currency conversion (if applicable)

**Example for PGK 50 voucher (≈ USD 13.50):**
- Transaction fee: USD 0.30 + (USD 13.50 × 2.9%) = USD 0.69
- **Net received: USD 12.81** (≈ PGK 47.50)
- **Cost per voucher: PGK 2.50**

**Compare with BSP IPG fees:**
- (Check BSP fee structure - typically 1-3% + fixed fee for PNG domestic cards)

### Cost Mitigation Strategies

1. **Pass fees to customer**
   - Display: "Voucher: PGK 50.00 + Processing Fee: PGK 2.50 = Total: PGK 52.50"

2. **Absorb fees into pricing**
   - Raise voucher price to PGK 53 to cover Stripe fees

3. **Tiered pricing**
   - 1 voucher: PGK 53 (higher per-unit fee)
   - 5 vouchers: PGK 260 (PGK 52/each - economy of scale)
   - 10 vouchers: PGK 515 (PGK 51.50/each)

---

## 🆘 Support & Resources

### Stripe Support
- **Dashboard:** https://dashboard.stripe.com
- **Documentation:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Support:** https://support.stripe.com
- **Status Page:** https://status.stripe.com

### PNG Payment Alternatives
- **BSP IPG:** servicebsp@bsp.com.pg | +675 3201212
- **Cloudcode IPG:** https://cloudcode.com.pg
- **NiuPay:** Contact via businessadvantagepng.com

### Development Resources
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhooks Tester:** https://webhook.site (for testing)
- **Test Cards:** https://stripe.com/docs/testing

---

## 📌 Next Steps

### Immediate Actions (Week 1)

1. **Decision: Choose Integration Approach**
   - [ ] Use Stripe with US LLC workaround?
   - [ ] Stick with BSP IPG (local PNG)?
   - [ ] Implement both (hybrid)?

2. **If Stripe Chosen:**
   - [ ] Register Stripe account (US LLC if needed)
   - [ ] Obtain test API keys
   - [ ] Set up development environment
   - [ ] Install dependencies

3. **Development Setup**
   - [ ] Create `stripeService.js`
   - [ ] Create `stripe-webhooks.js`
   - [ ] Modify `public-purchases.js`
   - [ ] Test locally with Stripe CLI

### Implementation Phase (Week 2)

- [ ] Frontend integration (payment selection)
- [ ] Backend API endpoints
- [ ] Database migration
- [ ] Local testing with test cards
- [ ] Webhook testing

### Testing & Deployment (Week 3)

- [ ] Staging deployment
- [ ] End-to-end testing
- [ ] Production deployment
- [ ] Live transaction testing
- [ ] Monitoring setup

---

## ⚡ Quick Start (Test Mode)

If you decide to proceed with Stripe, here's the fastest way to get started:

```bash
# 1. Get Stripe test keys from dashboard.stripe.com
# 2. Backend setup
cd backend
npm install stripe
echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY" >> .env
echo "STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET" >> .env

# 3. Frontend setup
cd ..
npm install @stripe/stripe-js
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY" >> .env.local

# 4. Test webhook locally
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# 5. Start servers
npm run dev          # Frontend
cd backend && npm run dev  # Backend

# 6. Test with card 4242 4242 4242 4242
```

---

## 📊 Summary

| Aspect | Stripe | BSP IPG (Current) |
|--------|--------|-------------------|
| **Availability in PNG** | ❌ Not direct (needs workaround) | ✅ Yes (local) |
| **Setup Complexity** | 🟡 Medium (US LLC needed) | 🟢 Easy |
| **Integration Time** | 2-3 weeks | Already planned |
| **Fees** | ~3-4.5% + USD 0.30 | 1-3% (typical) |
| **Currency** | USD/AUD conversion | ✅ Native PGK |
| **International Cards** | ✅ Yes | Limited |
| **3D Secure** | ✅ Built-in | Check with BSP |
| **PCI Compliance** | ✅ Automatic | ✅ (if using hosted) |
| **Webhook Reliability** | ✅ Excellent | Verify with BSP |
| **Documentation** | ✅ Excellent | Limited |
| **Support** | ✅ 24/7 global | PNG business hours |

**Recommendation:**
- **Short term:** Proceed with BSP IPG for local PNG market (already planned)
- **Long term:** Add Stripe via US LLC for international customers (hybrid approach)

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Prepared by:** Claude Code
**License:** © 2025 PNG Green Fees System
