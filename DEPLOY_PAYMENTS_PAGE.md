# Deploy Payments Page - Edit & Refund Feature

## Overview
New Payments page that allows Flex_Admin and Finance_Manager to view all payments with ability to Edit payment method and process Refunds with reasons.

## Features
1. **Payments List** - View all individual purchases (payments)
2. **Filters** - Filter by Date, Passport No, Exit Pass Code
3. **Edit Payment Method** - Change payment method for existing payments
4. **Refund Processing** - Process refunds with mandatory reason
5. **Refund History** - All refunds tracked with reason, timestamp, and user

## Files Changed

### Frontend Files
1. **NEW**: `src/pages/PaymentsList.jsx` - New payments management page
2. **MODIFIED**: `src/App.jsx` - Updated route to use PaymentsList (restricted to Flex_Admin & Finance_Manager)

### Backend Files
1. **MODIFIED**: `backend/routes/individual-purchases.js` - Added endpoints:
   - `GET /api/individual-purchases/:id/update-payment-method` - Update payment method
   - `GET /api/individual-purchases/:id/refund` - Process refund

### Database Migration
1. **NEW**: `add-refund-columns.sql` - Adds refund tracking columns to individual_purchases table

## Deployment Steps

### Quick Deployment (Automated)

Run the deployment script in another terminal:
```bash
./deploy-payments-feature.sh
```

This will:
1. Add refund columns to database
2. Upload backend files
3. Restart PM2

### Manual Deployment

#### Step 1: Add Refund Columns to Database

Run in another terminal:
```bash
./add-refund-columns.sh
```

Or manually via SSH:
```bash
ssh root@72.61.208.79
sudo -u postgres psql -d greenpay_db
```

Then run this SQL (as postgres superuser):
```sql
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refunded_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_individual_purchases_status ON individual_purchases(status);
```

#### Step 2: Deploy Backend

Upload the updated backend file:
```bash
scp backend/routes/individual-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

Restart PM2:
```bash
ssh root@72.61.208.79
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

#### Step 3: Deploy Frontend

Build and deploy:
```bash
npm run build
# Upload dist/ folder to server
```

## Usage

### Access
- **URL**: `/payments`
- **Roles**: Flex_Admin, Finance_Manager only

### Features

**Filter Payments:**
- Date filter (select specific date)
- Passport No filter (search by passport number)
- Exit Pass Code filter (search by voucher code)

**Edit Payment:**
1. Click "Edit" button on any payment
2. Select new payment method from dropdown
3. Click "Save"
4. Payment method updated in database

**Process Refund:**
1. Click "Refund" button on any payment
2. Enter reason for refund (mandatory)
3. Click "Confirm Refund"
4. Payment marked as refunded with:
   - Status: 'refunded'
   - Reason: User-provided text
   - Refunded At: Current timestamp
   - Refunded By: Current user's name

**View Refund Payments:**
- Click "View Refund Payments" button (yellow)
- Shows all payments with status = 'refunded'
- Displays refund reason and who processed it

## Database Schema Changes

```sql
individual_purchases table:
- status VARCHAR(20) DEFAULT 'active'    -- 'active' or 'refunded'
- refund_reason TEXT                      -- Why the payment was refunded
- refunded_at TIMESTAMP                   -- When refund was processed
- refunded_by VARCHAR(255)                -- User who processed refund
```

## API Endpoints

### Update Payment Method
```
GET /api/individual-purchases/:id/update-payment-method?payment_method=CASH
Authorization: Bearer <token>
Roles: Flex_Admin, Finance_Manager
```

### Process Refund
```
GET /api/individual-purchases/:id/refund?reason=Customer%20request
Authorization: Bearer <token>
Roles: Flex_Admin, Finance_Manager
```

## Reports Integration

Refunded payments are tracked in the database with:
- `status = 'refunded'`
- `refund_reason` - Text reason
- `refunded_at` - Timestamp
- `refunded_by` - User name

Reports can query these fields to generate refund reports.

## Testing

1. Login as Flex_Admin or Finance_Manager
2. Navigate to `/payments`
3. Test filters
4. Edit a payment method
5. Process a refund with reason
6. Verify payment shows as refunded
7. Check database for refund fields populated

## Notes

- Only Flex_Admin and Finance_Manager can access this page
- Counter_Agent role cannot see /payments
- Refund reasons are mandatory (free text)
- All refunds are permanent (cannot be undone via UI)
- Original payment data is preserved (only status changes)
