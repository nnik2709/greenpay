# 🔑 Stripe Setup Guide - Step by Step

**Purpose:** Configure Stripe for testing the PNG Green Fees online payment system

**Time Required:** 10 minutes

**Cost:** FREE (test mode only)

---

## 📋 What You'll Get

After completing this guide, you'll have:
- ✅ Stripe test account (free)
- ✅ Publishable key (for frontend)
- ✅ Secret key (for backend)
- ✅ Webhook secret (for payment confirmations)

---

## 🚀 Step 1: Create Stripe Account

### 1.1 Sign Up

1. Go to: **https://dashboard.stripe.com/register**
2. Fill in:
   - **Email:** Your email address
   - **Full name:** Your name
   - **Country:** Select your country
   - **Password:** Create a strong password
3. Click **Create account**

### 1.2 Verify Email

1. Check your email inbox
2. Click the verification link
3. You'll be redirected to Stripe Dashboard

### 1.3 Skip Activation (IMPORTANT!)

**⚠️ DO NOT activate your account for live payments**

When Stripe asks you to activate your account:
- Click **"I'll do this later"** or **"Skip for now"**
- We want to stay in **TEST MODE** for POC

**Why?** Test mode lets you test everything without real money or bank account setup.

---

## 🔑 Step 2: Get API Keys

### 2.1 Navigate to API Keys

1. In Stripe Dashboard, click **Developers** (top right menu)
2. Click **API keys** (left sidebar)
3. You should see **"Test mode"** toggle is ON (top right)

### 2.2 Copy Publishable Key

1. Find **"Publishable key"** section
2. Look for key starting with `pk_test_...`
3. Click **"Reveal test key"** (if hidden)
4. Click **copy icon** to copy the key
5. **Save it** - You'll need this for frontend configuration

**Example:**
```
pk_test_51QGxxx...xxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Copy Secret Key

1. Find **"Secret key"** section
2. Look for key starting with `sk_test_...`
3. Click **"Reveal test key"** (if hidden)
4. Click **copy icon** to copy the key
5. **Save it** - You'll need this for backend configuration

**Example:**
```
sk_test_51QGxxx...xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **SECURITY WARNING:**
- Never share your secret key publicly
- Never commit it to git
- Only use it in backend .env file

---

## 🔔 Step 3: Set Up Webhook

Webhooks notify your backend when a payment is completed.

### 3.1 Navigate to Webhooks

1. In Stripe Dashboard, click **Developers**
2. Click **Webhooks** (left sidebar)
3. Click **"Add endpoint"** button

### 3.2 Configure Webhook Endpoint

**Fill in the form:**

1. **Endpoint URL:**
   ```
   https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe
   ```

   ⚠️ Make sure to use **https://** (not http://)

2. **Description (optional):**
   ```
   PNG Green Fees - Online Payment Notifications
   ```

3. **Events to send:**
   - Click **"Select events"** button
   - In the search box, type: `checkout.session`
   - **Check these two events:**
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.expired`
   - Click **"Add events"** button

4. Click **"Add endpoint"** to save

### 3.3 Copy Webhook Signing Secret

After creating the webhook endpoint:

1. You'll see your new webhook in the list
2. Click on it to view details
3. Find **"Signing secret"** section
4. Click **"Reveal"** button
5. Copy the secret starting with `whsec_test_...`
6. **Save it** - You'll need this for backend configuration

**Example:**
```
whsec_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Summary - Keys You Should Have

After completing the steps above, you should have **3 keys**:

| Key | Starts With | Used In | Example |
|-----|-------------|---------|---------|
| **Publishable Key** | `pk_test_` | Frontend (.env.local) | `pk_test_51QGxxx...` |
| **Secret Key** | `sk_test_` | Backend (.env) | `sk_test_51QGxxx...` |
| **Webhook Secret** | `whsec_test_` | Backend (.env) | `whsec_test_xxx...` |

---

## 🔧 Step 4: Configure Your Application

### 4.1 Backend Configuration (Server)

SSH to your server and edit the backend .env file:

```bash
ssh root@72.61.208.79
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

**Add these lines:**
```env
# Payment Gateway
PAYMENT_GATEWAY=stripe

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE

# CORS (for local testing)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://greenpay.eywademo.cloud
```

**Replace:**
- `sk_test_YOUR_SECRET_KEY_HERE` → Your actual secret key
- `whsec_test_YOUR_WEBHOOK_SECRET_HERE` → Your actual webhook secret

**Save and restart:**
```bash
# Save: Ctrl+O, Enter, Ctrl+X
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

**Look for this log message:**
```
✅ Payment gateway initialized: stripe
```

### 4.2 Frontend Configuration (Local)

On your local computer:

```bash
cd /Users/nikolay/github/greenpay
cp .env.example .env.local
nano .env.local
```

**Add these lines:**
```env
# Backend API - Remote server
VITE_API_URL=https://greenpay.eywademo.cloud/api

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Admin Email
VITE_ADMIN_EMAIL=admin@greenpay.gov.pg
```

**Replace:**
- `pk_test_YOUR_PUBLISHABLE_KEY_HERE` → Your actual publishable key

**Save:** Ctrl+O, Enter, Ctrl+X

---

## 🧪 Step 5: Test Your Setup

### 5.1 Test Backend API

```bash
curl -X POST https://greenpay.eywademo.cloud/api/public-purchases/create-payment-session \
  -H 'Content-Type: application/json' \
  -d '{
    "customerEmail": "test@example.com",
    "customerPhone": "+67512345678",
    "quantity": 1,
    "amount": 50,
    "currency": "PGK",
    "returnUrl": "https://greenpay.eywademo.cloud/purchase/callback",
    "cancelUrl": "https://greenpay.eywademo.cloud/buy-voucher"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "PGKB-1733654400-ABC123",
    "paymentUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
    "gateway": "stripe"
  }
}
```

✅ If you see this, backend is configured correctly!

❌ If you see errors, check:
- Backend .env has correct keys
- PM2 is running: `ssh root@72.61.208.79 "pm2 status greenpay-api"`
- Backend logs: `ssh root@72.61.208.79 "pm2 logs greenpay-api"`

### 5.2 Test Frontend

```bash
cd /Users/nikolay/github/greenpay
npm run dev
```

Open browser: **http://localhost:3000**

1. Login with your admin credentials
2. Go to: **Buy Voucher** (or http://localhost:3000/buy-voucher)
3. Fill the form:
   - Email: test@example.com
   - Phone: +67512345678
   - Quantity: 1
4. Click **"Proceed to Payment"**
5. You should be redirected to **Stripe Checkout** page

✅ If you see Stripe Checkout, frontend is configured correctly!

### 5.3 Test Payment

On Stripe Checkout page:

1. **Email:** Enter any email (e.g., test@example.com)
2. **Card number:** `4242 4242 4242 4242`
3. **Expiry:** Any future date (e.g., `12/34`)
4. **CVC:** Any 3 digits (e.g., `123`)
5. **Name:** Any name
6. **ZIP:** Any 5 digits (e.g., `12345`)
7. Click **"Pay"**

**Expected:**
- Payment succeeds
- You're redirected back to your app
- You see voucher codes
- Webhook processes payment (check backend logs)

---

## 📊 Test Cards Reference

Use these test cards on Stripe Checkout:

| Card Number | Result | Use For |
|-------------|--------|---------|
| `4242 4242 4242 4242` | ✅ Success | Normal successful payment |
| `4000 0025 0000 3155` | ✅ Success with 3D Secure | Test authentication flow |
| `4000 0000 0000 9995` | ❌ Declined | Test payment failure |
| `4000 0000 0000 0069` | ❌ Expired card | Test validation errors |

**For all cards:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

---

## 🔍 Verify Payment in Stripe Dashboard

After making a test payment:

1. Go to: **https://dashboard.stripe.com**
2. Make sure **"Test mode"** is ON (toggle in top right)
3. Click **Payments** (left sidebar)
4. You should see your test payment
5. Click on it to view details

You can also view:
- **Checkout Sessions:** Developers → Events → Filter by `checkout.session.completed`
- **Webhooks:** Developers → Webhooks → Click your endpoint → View attempts

---

## 🐛 Troubleshooting

### Issue: "Invalid API Key"

**Problem:** Backend returns error about invalid API key

**Solution:**
```bash
ssh root@72.61.208.79
cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env | grep STRIPE_SECRET_KEY

# Make sure it starts with sk_test_ and has no extra spaces
# If wrong, edit:
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
pm2 restart greenpay-api
```

### Issue: Webhook Not Received

**Problem:** Payment completes but vouchers not generated

**Check these:**

1. **Webhook URL is correct:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - URL should be: `https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe`
   - Must use **https://** (not http://)

2. **Events are selected:**
   - Events should include `checkout.session.completed`
   - Click webhook → Edit → Check events

3. **Webhook secret matches:**
   ```bash
   ssh root@72.61.208.79
   cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env | grep WEBHOOK_SECRET
   # Should match the secret from Stripe Dashboard
   ```

4. **Check webhook attempts:**
   - Stripe Dashboard → Developers → Webhooks
   - Click your webhook endpoint
   - View **"Recent deliveries"**
   - Check if webhooks are being sent and what response your server gives

### Issue: CORS Error in Browser

**Problem:** Browser console shows CORS error

**Solution:**
```bash
ssh root@72.61.208.79
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Make sure this line exists:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://greenpay.eywademo.cloud

# Save and restart:
pm2 restart greenpay-api
```

### Issue: "Only test keys allowed"

**Problem:** Backend rejects your Stripe key

**Cause:** You're using a live key (`sk_live_...`) instead of test key (`sk_test_...`)

**Solution:**
- Go to Stripe Dashboard
- Make sure **"Test mode"** toggle is ON (top right)
- Copy keys from **Test mode** (they start with `_test_`)

---

## 🎯 Checklist - Did You Get Everything?

Before moving to testing:

- [ ] ✅ Created Stripe account
- [ ] ✅ Stayed in test mode (did NOT activate)
- [ ] ✅ Got publishable key (`pk_test_...`)
- [ ] ✅ Got secret key (`sk_test_...`)
- [ ] ✅ Created webhook endpoint
- [ ] ✅ Got webhook secret (`whsec_test_...`)
- [ ] ✅ Configured backend .env on server
- [ ] ✅ Restarted PM2 backend
- [ ] ✅ Configured frontend .env.local locally
- [ ] ✅ Tested API endpoint with curl
- [ ] ✅ Tested frontend redirect to Stripe
- [ ] ✅ Completed test payment successfully

---

## 📚 Next Steps

Once Stripe is configured:

1. **Deploy the payment gateway system:**
   ```bash
   ./deploy-payment-gateway.sh
   ```

2. **Test the complete flow:**
   - Follow: `LOCAL_TESTING_SETUP.md`
   - Make test purchases
   - Verify vouchers in reports

3. **When ready for production:**
   - Contact BSP Bank or Kina Bank for credentials
   - Follow: `PAYMENT_GATEWAY_IMPLEMENTATION_SUMMARY.md`
   - Switch `PAYMENT_GATEWAY=bsp` in .env
   - No code changes needed!

---

## 📞 Support

### Stripe Support
- **Dashboard:** https://dashboard.stripe.com
- **Docs:** https://stripe.com/docs
- **Testing Guide:** https://stripe.com/docs/testing
- **Support:** https://support.stripe.com

### Common Links
- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Payments:** https://dashboard.stripe.com/test/payments
- **Events:** https://dashboard.stripe.com/test/events

---

**Status:** Ready to Configure
**Last Updated:** December 8, 2025
**Estimated Time:** 10 minutes
