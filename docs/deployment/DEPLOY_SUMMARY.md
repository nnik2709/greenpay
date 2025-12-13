# Quick Deployment Summary - Phase 2

## Files to Deploy

### Frontend (1 folder)
```bash
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

### Backend (3 files)
```bash
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

scp backend/routes/public-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

### Database (SQL)
```bash
ssh root@72.61.208.79
psql -U postgres -d greenpay << 'EOF'
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_data JSONB;
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data ON purchase_sessions USING GIN (passport_data);
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;
EOF
```

### Restart Backend
```bash
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && pm2 restart greenpay-api"
```

---

## What's Deployed

- ✅ Login page with "Buy Online" button
- ✅ /buy-online page (passport form)
- ✅ Passport data stored in DB session
- ✅ Payment webhook creates passport + voucher atomically
- ✅ Idempotency protection
- ✅ Session expiry (30 minutes)

---

## Test After Deploy

1. Visit: https://greenpay.eywademo.cloud/login
2. Click: "🛒 Buy Online"
3. Fill passport details + email
4. Click: "Continue to Payment"
5. Complete test payment
6. Verify passport + voucher created

---

See `PHASE2_DEPLOYMENT.md` for complete documentation.
