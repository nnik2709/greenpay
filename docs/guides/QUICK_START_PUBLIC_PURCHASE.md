# Quick Start: Public Voucher Purchase

## Setup (5 Minutes)

### 1. Run Database Migration

```bash
psql -U postgres -d greenpay -f backend/migrations/create-purchase-sessions-table.sql
```

### 2. Register Backend Route

The route is already added to `backend/server.js`, but ensure the backend server restarts:

```bash
cd backend
npm install  # If public-purchases route not loaded
npm run dev
```

### 3. Start Frontend

```bash
npm run dev
```

### 4. Test the Flow

Visit: `http://localhost:3000/buy-voucher`

---

## Test Purchase Flow

### Step 1: Fill Purchase Form
- **Email:** test@example.com
- **Phone:** +6757XXX XXXX (any PNG number)
- **Quantity:** 1-3 vouchers

### Step 2: Mock Payment
- You'll be redirected to `/mock-bsp-payment`
- Select any payment method
- Click "Pay PGK XX.XX"

### Step 3: See Results
- Redirected to `/purchase/callback`
- Voucher codes displayed
- Check browser console for:
  - Purchase session created
  - Payment verified
  - Vouchers generated

---

## Key URLs

| Page | URL | Auth Required |
|------|-----|---------------|
| Buy Voucher | `/buy-voucher` | No |
| Mock BSP Payment | `/mock-bsp-payment` | No |
| Payment Callback | `/purchase/callback` | No |
| Register Passport | `/register/{voucherCode}` | No (existing) |

---

## Mock BSP Payment

**IMPORTANT:** The mock BSP payment page (`/mock-bsp-payment`) is for development/testing only.

When integrating with real BSP:
1. Customer will be redirected to actual BSP secure payment page
2. Real payment processing occurs
3. BSP redirects back to `/purchase/callback`
4. BSP sends webhook to `/api/public-purchases/webhook/bsp`

---

## API Endpoints

### Create Session
```bash
curl -X POST http://localhost:3001/api/public-purchases/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerPhone": "+6757XXX XXXX",
    "quantity": 2,
    "amount": 100.00,
    "deliveryMethod": "SMS+Email",
    "currency": "PGK"
  }'
```

### Complete Purchase (Triggered by callback or webhook)
```bash
curl -X POST http://localhost:3001/api/public-purchases/complete \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "PGKB-20250115-ABC123",
    "paymentData": {
      "bspTransactionId": "BSP-123456",
      "paymentMethod": "VISA",
      "status": "completed"
    }
  }'
```

---

## Troubleshooting

### Backend Error: "Cannot find module './routes/public-purchases'"

```bash
cd backend
ls routes/public-purchases.js  # Should exist
npm restart
```

### Frontend Error: Module not found

```bash
npm install
npm run dev
```

### Database Error: "Table purchase_sessions does not exist"

```bash
psql -U postgres -d greenpay -f backend/migrations/create-purchase-sessions-table.sql
```

### Network Status Showing Offline

- Check browser DevTools → Network tab
- Disable "Offline" mode if enabled
- Form data is saved to localStorage and will submit when online

---

## Network Simulation (PNG Conditions)

### Test Offline Functionality

1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G" or "Offline"
4. Fill purchase form
5. Notice form data auto-saves
6. Set back to "Online"
7. Submit form - data persists

### Test Slow Network

1. Set throttling to "Slow 3G"
2. Complete purchase flow
3. Notice loading states
4. Minimal data transfer (~5-10KB for form submission)

---

## Next Steps

1. ✅ **Test local flow** - Verify all pages work
2. ⚠️ **Contact BSP** - Get merchant account (servicebsp@bsp.com.pg)
3. ⚠️ **Get SMS Gateway** - Contact Digicel/Bmobile for SMS API
4. ⚠️ **Update Environment** - Add BSP credentials to `.env`
5. ⚠️ **Replace Mock** - Update `bspPaymentService.js` with real BSP API
6. ⚠️ **Test Sandbox** - Use BSP sandbox environment
7. ⚠️ **Go Live** - Switch to production after testing

---

## File Checklist

Created files:
- ✅ `src/pages/PublicVoucherPurchase.jsx`
- ✅ `src/pages/PublicPurchaseCallback.jsx`
- ✅ `src/pages/MockBSPPayment.jsx`
- ✅ `src/lib/bspPaymentService.js`
- ✅ `backend/routes/public-purchases.js`
- ✅ `backend/services/sms-notification.js`
- ✅ `backend/migrations/create-purchase-sessions-table.sql`

Modified files:
- ✅ `src/App.jsx` (added public routes)
- ✅ `backend/server.js` (added public-purchases route)

Documentation:
- ✅ `PUBLIC_VOUCHER_PURCHASE_IMPLEMENTATION.md`
- ✅ `QUICK_START_PUBLIC_PURCHASE.md` (this file)

---

## Questions?

See full documentation: `PUBLIC_VOUCHER_PURCHASE_IMPLEMENTATION.md`

Contact: support@greenpay.gov.pg
