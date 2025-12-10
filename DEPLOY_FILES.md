# Deploy Buy Online Feature - Files List

## Files to Deploy

### Frontend Only (1 folder)

```
dist/
```

**Deploy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

**Command:**
```bash
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

## That's It!

No backend changes needed. The Buy Online feature:
1. Collects passport details on `/buy-online`
2. Stores data in sessionStorage
3. Redirects to existing `/buy-voucher` for credit card payment

## What's Deployed

✅ **Login Page** - "🛒 Buy Online" button below login form
✅ **Buy Online Page** - `/buy-online` route (passport details form)
✅ **Integration** - Redirects to `/buy-voucher` for payment

## Test After Deployment

1. Visit: https://greenpay.eywademo.cloud/login
2. Click: "🛒 Buy Online" button
3. Fill passport details
4. Click: "Continue to Payment →"
5. Verify: Redirects to /buy-voucher

## How It Works

```
User → /login
  ↓ (clicks "Buy Online")
User → /buy-online (passport form)
  ↓ (fills details, clicks continue)
  ↓ (stores data in sessionStorage)
User → /buy-voucher (credit card payment)
```

The `/buy-voucher` page can read passport data from:
```javascript
const passportData = JSON.parse(sessionStorage.getItem('buyOnlinePassportData'));
```

---

**Date:** December 10, 2025
**Build:** Production ready (599.63 kB, gzip: 188.77 kB)
**Backend:** No changes required
