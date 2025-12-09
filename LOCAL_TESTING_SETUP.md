# 🧪 Local Testing Setup Guide
## Frontend on localhost:3000 + Backend on greenpay.eywademo.cloud

**Setup:** Frontend runs locally, Backend/DB runs on remote server

**Date:** December 2, 2025

---

## 🎯 Architecture

```
┌─────────────────────────────────┐
│  Your Computer (Local)          │
│                                 │
│  Frontend: localhost:3000       │
│  - React + Vite                 │
│  - Hot reload for development   │
└────────────┬────────────────────┘
             │
             │ HTTPS API Calls
             ↓
┌─────────────────────────────────┐
│  Remote Server                  │
│  greenpay.eywademo.cloud        │
│                                 │
│  Backend API: Port 3001         │
│  - Node.js + Express            │
│  - PM2 Process Manager          │
│                                 │
│  Database: PostgreSQL           │
│  - greenpay_db                  │
└─────────────────────────────────┘
```

**Benefits:**
- ✅ Fast frontend development (hot reload)
- ✅ Use real database with real data
- ✅ Test with actual backend API
- ✅ No need to mock backend responses
- ✅ CORS already configured

---

## 📋 Prerequisites

### On Your Computer
- [x] Node.js installed (v18 or later)
- [x] npm installed
- [x] Git repository cloned

### On Remote Server
- [x] Backend deployed at greenpay.eywademo.cloud
- [x] PM2 running greenpay-api
- [x] PostgreSQL database setup
- [x] SSL certificate active (HTTPS)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone/Update Repository

```bash
cd ~/github/greenpay
git pull origin main  # Get latest changes
```

### Step 2: Configure Frontend Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Add these lines:**
```env
# Backend API - Points to remote server
VITE_API_URL=https://greenpay.eywademo.cloud/api

# Stripe Publishable Key (for testing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Save and exit** (Ctrl+O, Enter, Ctrl+X)

### Step 3: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Stripe (if not already installed)
npm install @stripe/stripe-js
```

### Step 4: Start Frontend

```bash
npm run dev
```

**Expected output:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
➜  press h to show help
```

### Step 5: Open in Browser

```bash
# Open browser
open http://localhost:3000

# Or manually go to:
# http://localhost:3000
```

**You should see the login page!** ✅

---

## 🧪 Testing Scenarios

### Test 1: Login

```bash
# Open: http://localhost:3000

# Login with test credentials
Email: admin@greenpay.gov.pg
Password: Admin123!

# Or your actual admin account
```

**Expected:**
- ✅ Redirects to dashboard
- ✅ Shows your username
- ✅ Loads real data from database

**Troubleshooting:**
```bash
# If login fails, check network tab:
# Should see:
# POST https://greenpay.eywademo.cloud/api/auth/login
# Status: 200

# If CORS error, backend needs:
# ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Test 2: View Reports

```bash
# Navigate to: Reports → Individual Purchase Reports
```

**Expected:**
- ✅ Shows list of vouchers from database
- ✅ Can filter, search, export
- ✅ Includes online purchases (if any)

### Test 3: Online Voucher Purchase Flow

```bash
# Open: http://localhost:3000/buy-voucher
```

**Fill form:**
- Email: `test@example.com`
- Phone: `+67512345678`
- Quantity: `2`

**Click "Proceed to Payment"**

**Expected:**
- ✅ Creates session in database
- ✅ Redirects to Stripe Checkout
- ✅ Can complete payment with test card: `4242 4242 4242 4242`
- ✅ Webhook processes payment
- ✅ Generates vouchers in database
- ✅ Shows voucher codes

**Check in database:**
```bash
# SSH to server
ssh root@72.61.208.79

# Connect to database
psql -U greenpay_user -d greenpay_db

# Check sessions
SELECT * FROM purchase_sessions ORDER BY created_at DESC LIMIT 5;

# Check vouchers
SELECT * FROM individual_purchases
WHERE purchase_session_id IS NOT NULL
ORDER BY created_at DESC LIMIT 5;
```

### Test 4: Passport Registration

```bash
# Copy a voucher code from previous test
# Open: http://localhost:3000/register/VCH-XXXXX-XXXXX
```

**Enter passport number:** `P1234567`

**Click "Register Passport"**

**Expected:**
- ✅ Validates voucher
- ✅ Saves passport number
- ✅ Updates database
- ✅ Shows success message

---

## 🔍 Debugging

### Check Backend Connection

```bash
# Test API endpoint
curl https://greenpay.eywademo.cloud/api/auth/verify
```

**Expected response:**
```json
{
  "message": "API is running",
  "timestamp": "2025-12-02T..."
}
```

### Check Browser Console

**Open DevTools (F12) → Console tab**

Look for:
```
✅ API URL: https://greenpay.eywademo.cloud/api
✅ Connected to backend
```

**If you see errors:**
```
❌ CORS error → Backend ALLOWED_ORIGINS needs http://localhost:3000
❌ Network error → Check backend is running
❌ 404 Not Found → Endpoint doesn't exist
❌ 401 Unauthorized → Need to login
```

### Check Network Tab

**DevTools → Network tab**

**Filter:** XHR

**Look for:**
- `POST /api/auth/login` → Status 200
- `GET /api/individual-purchases` → Status 200
- `POST /api/public-purchases/create-payment-session` → Status 200

**If seeing 500 errors:**
```bash
# Check backend logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 50"
```

### Common Issues

#### Issue 1: "Cannot connect to backend"

**Solution:**
```bash
# Check .env.local has correct URL
cat .env.local | grep VITE_API_URL

# Should see:
VITE_API_URL=https://greenpay.eywademo.cloud/api

# Restart frontend
npm run dev
```

#### Issue 2: CORS Error

**Solution:**
```bash
# SSH to server
ssh root@72.61.208.79

# Edit backend .env
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Add/update:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://greenpay.eywademo.cloud

# Restart backend
pm2 restart greenpay-api

# Check logs
pm2 logs greenpay-api --lines 20
```

#### Issue 3: "Payment gateway not configured"

**Solution:**
```bash
# SSH to server
ssh root@72.61.208.79

# Edit backend .env
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Add:
PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET

# Restart backend
pm2 restart greenpay-api
```

#### Issue 4: Hot reload not working

**Solution:**
```bash
# Stop dev server (Ctrl+C)

# Clear Vite cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

---

## 📊 Testing Checklist

### Authentication
- [ ] Can login with admin account
- [ ] Can logout
- [ ] Session persists on page refresh
- [ ] Protected routes redirect to login

### Dashboard
- [ ] Loads without errors
- [ ] Shows real statistics from database
- [ ] Charts render correctly

### Reports
- [ ] Individual Purchase Reports loads
- [ ] Revenue Reports loads
- [ ] Passport Reports loads
- [ ] Can export to CSV/Excel
- [ ] Filters work correctly

### Online Voucher Purchase
- [ ] Form validation works
- [ ] Can submit purchase request
- [ ] Redirects to Stripe Checkout
- [ ] Can complete payment with test card
- [ ] Webhook processes payment
- [ ] Vouchers generated in database
- [ ] Callback page shows voucher codes

### Passport Registration
- [ ] Can access registration page with voucher code
- [ ] Validates voucher exists
- [ ] Checks if voucher already used
- [ ] Checks expiry dates
- [ ] Can submit passport number
- [ ] Updates database correctly
- [ ] Shows success message

### User Management (Admin)
- [ ] Can view users list
- [ ] Can create new user
- [ ] Can edit user details
- [ ] Role-based access works

---

## 🔄 Development Workflow

### Making Frontend Changes

```bash
# 1. Edit files in src/ directory
# Example: src/pages/PublicVoucherPurchase.jsx

# 2. Vite auto-reloads changes (hot reload)
# No need to restart server!

# 3. Check browser for updates
# Changes appear immediately

# 4. Test the changes
# Use browser DevTools to debug
```

### Making Backend Changes (Requires Deployment)

```bash
# 1. Edit backend files locally
# Example: backend/routes/public-purchases.js

# 2. Upload to server
scp backend/routes/public-purchases.js \
  root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# 3. Restart backend
ssh root@72.61.208.79 "pm2 restart greenpay-api"

# 4. Test changes
# Frontend will now use updated backend
```

### Database Changes

```bash
# 1. Create migration SQL file locally
# Example: migration.sql

# 2. Upload to server
scp migration.sql root@72.61.208.79:/tmp/

# 3. Run migration
ssh root@72.61.208.79
psql -U greenpay_user -d greenpay_db -f /tmp/migration.sql

# 4. Verify changes
psql -U greenpay_user -d greenpay_db -c "\d table_name"
```

---

## 🚀 Stripe Testing

### Setup Stripe CLI for Webhooks

**Install Stripe CLI:**
```bash
# Mac
brew install stripe/stripe-cli/stripe

# Or download from:
# https://stripe.com/docs/stripe-cli
```

**Login to Stripe:**
```bash
stripe login
```

**Forward webhooks to remote server:**
```bash
# Option 1: Forward to remote server (if webhook URL is public)
# Configure in Stripe Dashboard:
# URL: https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe
# Events: checkout.session.completed, checkout.session.expired

# Option 2: Test webhooks locally (requires ngrok or similar)
# This won't work with remote backend directly
```

**Trigger test webhook:**
```bash
stripe trigger checkout.session.completed
```

### Test Cards

| Card Number | Result | Description |
|-------------|--------|-------------|
| `4242 4242 4242 4242` | ✅ Success | Basic successful payment |
| `4000 0025 0000 3155` | ✅ Success | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | ❌ Declined | Always declined |
| `4000 0000 0000 0069` | ❌ Expired | Expired card error |

**Use with:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

---

## 📈 Performance Tips

### Fast Frontend Development

```bash
# Use Vite's HMR (Hot Module Replacement)
# Changes appear in < 1 second

# Open multiple browser tabs for testing:
# Tab 1: Admin dashboard
# Tab 2: Public voucher purchase
# Tab 3: Passport registration
```

### Backend Logs

```bash
# Watch backend logs in real-time
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 100"

# Or use tmux/screen to keep it open:
ssh root@72.61.208.79
pm2 logs greenpay-api
# Press Ctrl+C to exit
```

### Database Queries

```bash
# Quick database check
ssh root@72.61.208.79 "psql -U greenpay_user -d greenpay_db -c 'SELECT COUNT(*) FROM individual_purchases;'"

# Export data for testing
ssh root@72.61.208.79 "psql -U greenpay_user -d greenpay_db -c 'COPY (SELECT * FROM individual_purchases LIMIT 10) TO STDOUT CSV HEADER;'" > test_data.csv
```

---

## 🎯 Ready to Test!

### Quick Start Commands

```bash
# Terminal 1: Start frontend
cd ~/github/greenpay
npm run dev

# Terminal 2: Watch backend logs
ssh root@72.61.208.79 "pm2 logs greenpay-api"

# Browser: Open application
open http://localhost:3000
```

### What to Test

1. **Login/Authentication** - Verify session management
2. **Dashboard** - Check real data loads
3. **Reports** - Ensure all reports show data
4. **Online Purchase** - Complete Stripe payment flow
5. **Passport Registration** - Register voucher with passport
6. **User Management** - Admin functions work
7. **Navigation** - All routes accessible

---

## 📞 Need Help?

### Backend Issues
```bash
# Check if backend is running
ssh root@72.61.208.79 "pm2 status greenpay-api"

# View logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 50"

# Restart if needed
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```

### Database Issues
```bash
# Connect to database
ssh root@72.61.208.79
psql -U greenpay_user -d greenpay_db

# Check tables
\dt

# Check table structure
\d table_name

# Run query
SELECT * FROM users LIMIT 5;
```

### Frontend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf node_modules/.vite
npm install

# Restart dev server
npm run dev
```

---

## ✅ Success Criteria

You're set up correctly when:

- ✅ Frontend loads at http://localhost:3000
- ✅ Can login with admin credentials
- ✅ Dashboard shows real data from database
- ✅ Reports load without errors
- ✅ Can complete online voucher purchase with Stripe
- ✅ Vouchers appear in database
- ✅ Can register passport with voucher code
- ✅ Browser console shows no CORS errors
- ✅ Network tab shows API calls to greenpay.eywademo.cloud

---

**Happy Testing!** 🚀

If you encounter any issues, check the troubleshooting section or watch the backend logs for error messages.
