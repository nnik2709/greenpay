# Deployment Ready - November 26, 2025

## Summary

Frontend has been updated and rebuilt with the following migrations:

1. ✅ Payment Modes migrated from Supabase to PostgreSQL API
2. ✅ Support Tickets migrated from Supabase to PostgreSQL API
3. ✅ New production build created in `/dist` folder

## Changes Made

### 1. API Client (`src/lib/api/client.js`)
- Added `update` and `delete` methods to tickets API

### 2. Tickets Storage (`src/lib/ticketStorage.js`)
- **Before:** Used Supabase client directly
- **After:** Uses PostgreSQL backend API via `api.tickets.*`
- Removed all Supabase imports and calls

### 3. Tickets Page (`src/pages/Tickets.jsx`)
- Removed Supabase import
- Removed Supabase email notification code (backend will handle this)

### 4. Frontend Build
- Built successfully at: `/Users/nikolay/github/greenpay/dist`
- Total size: ~3.0 MB
- 80 files generated
- Key file: `dist/assets/Tickets-bfcbee87.js` (46.30 kB)

## Deployment Steps

### Step 1: Create Payment Modes Table (if not done)

```bash
ssh -i ~/.ssh/nikolay root@72.61.208.79

PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db << 'EOF'
CREATE TABLE IF NOT EXISTS "PaymentMode" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  "collectCardDetails" BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON "PaymentMode" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "PaymentMode_id_seq" TO greenpay_user;

INSERT INTO "PaymentMode" (name, "collectCardDetails", active)
VALUES
  ('CASH', false, true),
  ('EFTPOS', true, true),
  ('BANK TRANSFER', false, true)
ON CONFLICT (name) DO NOTHING;

SELECT * FROM "PaymentMode";
EOF
```

### Step 2: Create Tickets Tables

```bash
# Copy SQL file to server
scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/create-tickets-tables.sql root@72.61.208.79:/tmp/

# On server, run:
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/create-tickets-tables.sql
```

### Step 3: Copy Backend Route Files

```bash
# Copy tickets.js route
scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/tickets.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/tickets.js

# Copy payment-modes.js route (if not done)
scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/payment-modes.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js
```

### Step 4: Register Routes in server.js

On the server, edit `server.js`:

```bash
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
```

Add these lines after the settings route:

```javascript
app.use('/api/payment-modes', require('./routes/payment-modes'));
app.use('/api/tickets', require('./routes/tickets'));
```

Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

### Step 5: Restart Backend

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

Verify no errors in logs.

### Step 6: Deploy Frontend

```bash
# On your Mac
./deploy-frontend.sh
```

Or manually:

```bash
# Create tarball
cd /Users/nikolay/github/greenpay
tar -czf dist.tar.gz dist/

# Copy to server
scp -i ~/.ssh/nikolay dist.tar.gz root@72.61.208.79:/tmp/

# On server:
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
mv frontend frontend.backup.$(date +%Y%m%d_%H%M%S)
tar -xzf /tmp/dist.tar.gz
mv dist frontend
rm /tmp/dist.tar.gz

# Clean up local
rm /Users/nikolay/github/greenpay/dist.tar.gz
```

### Step 7: Test

1. Visit https://greenpay.eywademo.cloud
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
3. Test Payment Modes:
   - Go to Admin → Payment Modes
   - Should load without errors
   - Try adding a new payment mode
4. Test Support Tickets (IT_Support role):
   - Go to Support Tickets menu
   - Should load without errors
   - Try creating a new ticket

## Files Ready for Deployment

**On your Mac:**
- `/Users/nikolay/github/greenpay/dist/` - Frontend build
- `/Users/nikolay/github/greenpay/tickets.js` - Tickets backend route
- `/Users/nikolay/github/greenpay/payment-modes.js` - Payment modes backend route
- `/Users/nikolay/github/greenpay/create-tickets-tables.sql` - SQL migration
- `/Users/nikolay/github/greenpay/deploy-frontend.sh` - Deployment script

**Documentation:**
- `TICKETS_SYSTEM_STATUS.md` - Complete analysis of tickets system
- `MANUAL_FIX_PAYMENT_MODES.md` - Payment modes setup guide

## New Features Enabled

### Payment Modes Management
- Visible to: Flex_Admin
- Location: Admin → Payment Modes
- Features: Add, edit, toggle active, delete payment modes
- Supports: Card details collection flag

### Support Tickets System
- Visible to: IT_Support (menu), all authenticated users (can access via URL)
- Location: Support Tickets menu
- Features:
  - Create tickets with title, description, priority
  - View all tickets (role-based filtering)
  - Update ticket status (open, in_progress, resolved, closed)
  - Add responses/comments
  - Staff vs user response tracking
  - Role-based access control

## Migration Status

✅ **Completed:**
- Dashboard → PostgreSQL
- Users → PostgreSQL
- Passports → PostgreSQL
- Payment Modes → PostgreSQL
- Settings → PostgreSQL
- Support Tickets → PostgreSQL

⚠️ **Still on Supabase:**
- Purchases
- Quotations
- Bulk Uploads
- Corporate Vouchers
- Individual Purchases
- Reports
- Transactions
- Other features (see POSTGRES_MIGRATION_PLAN.md)

## Next Steps

After deployment, test all functionality and then continue with Phase 2B migration:
- Quotations
- Purchases/Payments
- Bulk Uploads
- Corporate Vouchers
