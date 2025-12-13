# Deploy Refund Payment Method Feature

## Overview
Added refund payment method tracking to allow different payment methods for refunds (e.g., original payment by CARD, refund by CASH).

## Changes Made

### Database Changes
- Added `refund_payment_method` column to `individual_purchases` table
- This tracks how the refund was paid (CASH, BANK, CARD, etc.)

### Backend Changes
- Modified `/api/individual-purchases/:id/refund` endpoint
- Now requires `refund_payment_method` parameter
- Backend file: `backend/routes/individual-purchases.js`

### Frontend Changes
- Updated `src/pages/PaymentsList.jsx`
- Added refund payment method selector in refund dialog
- Shows original payment method and requires refund payment method selection
- Displays refund payment method in "View Refund Payments" table

## Deployment Steps

### Step 1: Add Database Column

Run this command to connect to the database:
```bash
ssh root@72.61.208.79
sudo -u postgres psql -d greenpay_db
```

Then run this SQL:
```sql
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS refund_payment_method VARCHAR(50);

COMMENT ON COLUMN individual_purchases.refund_payment_method IS 'Payment method used for the refund (CASH, BANK, CARD, etc.)';
```

Or use the SQL file:
```bash
ssh root@72.61.208.79
sudo -u postgres psql -d greenpay_db < /path/to/add-refund-payment-method.sql
```

### Step 2: Deploy Backend

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

### Step 3: Deploy Frontend

Build and deploy:
```bash
npm run build
# Upload dist/ folder to server
```

## Features

### Refund Dialog
When processing a refund, users now must:
1. Select refund payment method (dropdown with all payment modes)
2. Enter refund reason (free text, mandatory)

The dialog shows:
- Original payment amount
- Passport number
- Original payment method (for reference)
- Refund payment method selector (required)
- Refund reason textarea (required)

### Refund Payments View
When viewing refunded payments, the table shows:
- **Refund Payment Method** - How the refund was paid (blue badge)
- **Refund Reason** - Why it was refunded
- **Refunded By** - Who processed the refund
- **Refunded At** - Timestamp

## Cash Reconciliation Integration

The `refund_payment_method` field is now available for reports:

```sql
-- Example: Get all cash refunds for daily reconciliation
SELECT
  id,
  voucher_code,
  passport_number,
  amount,
  payment_method as original_payment,
  refund_payment_method,
  refund_reason,
  refunded_by,
  refunded_at
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_payment_method = 'CASH'
  AND DATE(refunded_at) = CURRENT_DATE;
```

This allows cash reconciliation reports to include:
- Cash payments received
- Cash refunds given
- Net cash position

## Testing

1. Login as Flex_Admin or Finance_Manager
2. Navigate to `/payments`
3. Click "Refund" on a payment
4. Verify refund payment method selector is required
5. Select different payment method than original (e.g., original CARD, refund CASH)
6. Enter reason and confirm
7. Click "View Refund Payments"
8. Verify refund payment method is displayed

## Notes

- Refund payment method is mandatory (validation on both frontend and backend)
- Can be different from original payment method
- Available in reports for cash reconciliation
- Displayed in refund payments view with blue badge
