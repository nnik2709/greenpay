# Deploy Refund Status Workflow

## Overview
Added a two-stage refund workflow with "Pending" and "Completed" statuses:
1. **Initiate Refund** - Sets refund status to "pending" (refund requested but not yet paid)
2. **Complete Refund** - Sets refund status to "completed" (refund payment has been made)

## Changes Made

### Database Changes
- Added `refund_status` column to `individual_purchases` table
- Values: NULL (no refund), 'pending' (refund initiated), 'completed' (refund paid)

### Backend Changes
- Modified `/api/individual-purchases/:id/refund` endpoint to set `refund_status = 'pending'`
- Added `/api/individual-purchases/:id/update-refund-status` endpoint to update status
- File: `backend/routes/individual-purchases.js`

### Frontend Changes
- Updated PaymentsList to show clickable "Pending Refund" status badge
- Click on "Pending Refund" to mark as completed
- Status badges:
  - **Active** - Green badge (normal payment)
  - **Pending Refund** - Yellow badge (clickable, refund initiated)
  - **Refunded** - Red badge (refund completed)
- File: `src/pages/PaymentsList.jsx`

## Deployment Steps

### Step 1: Add Database Column

```bash
ssh root@72.61.208.79
sudo -u postgres psql -d greenpay_db
```

Run this SQL:
```sql
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);

-- Update existing refunded payments to have refund_status = 'completed'
UPDATE individual_purchases
SET refund_status = 'completed'
WHERE status = 'refunded' AND refund_status IS NULL;

COMMENT ON COLUMN individual_purchases.refund_status IS 'Refund status: NULL (no refund), pending (refund initiated), completed (refund paid)';

CREATE INDEX IF NOT EXISTS idx_individual_purchases_refund_status ON individual_purchases(refund_status);
```

Or use the SQL file:
```bash
ssh root@72.61.208.79
sudo -u postgres psql -d greenpay_db -f /path/to/add-refund-status-column.sql
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

## User Workflow

### 1. Initiate Refund
1. Go to `/payments`
2. Click "Refund" button on a payment
3. Select refund payment method
4. Enter refund reason
5. Click "Confirm Refund"
6. Payment status changes to **"Pending Refund"** (yellow badge)
7. Toast message: "Refund is pending. Click on 'Pending Refund' status to mark as completed once payment is made."

### 2. Complete Refund
1. After the refund payment has been physically made to the customer
2. Click on the yellow **"Pending Refund"** badge in the Status column
3. Status automatically changes to **"Refunded"** (red badge)
4. Toast message: "Refund status updated to completed"

## Status Badge Colors

| Status | Color | Description | Action |
|--------|-------|-------------|--------|
| Active | Green | Normal payment | Can be refunded |
| Pending Refund | Yellow (clickable) | Refund initiated but not paid | Click to mark as completed |
| Refunded | Red | Refund completed | No action available |

## Database Status Values

### `status` column (overall payment status)
- `'active'` or `NULL` - Normal active payment
- `'refunded'` - Payment has been refunded

### `refund_status` column (refund workflow stage)
- `NULL` - No refund (payment is active)
- `'pending'` - Refund initiated, waiting for payment
- `'completed'` - Refund payment has been made

## API Endpoints

### Initiate Refund
```
GET /api/individual-purchases/:id/refund?reason=...&refund_payment_method=...
Response: Sets status='refunded', refund_status='pending'
```

### Update Refund Status
```
GET /api/individual-purchases/:id/update-refund-status?refund_status=completed
Response: Updates refund_status to 'completed'
```

## Testing

### Test Pending → Completed Workflow

1. Login as Flex_Admin or Finance_Manager
2. Navigate to `/payments`
3. Click "Refund" on an active payment
4. Fill in refund details and submit
5. Verify status shows "Pending Refund" (yellow)
6. Click on "Pending Refund" badge
7. Verify status changes to "Refunded" (red)
8. Check database:
```sql
SELECT id, status, refund_status, refund_reason, refunded_at, refunded_by
FROM individual_purchases
WHERE status = 'refunded'
ORDER BY refunded_at DESC
LIMIT 10;
```

## Benefits

1. **Workflow Control** - Clear separation between "refund requested" and "refund paid"
2. **Tracking** - Can report on pending vs completed refunds
3. **Audit Trail** - Timestamp and user tracking for both stages
4. **Cash Reconciliation** - Only completed refunds should affect cash reconciliation
5. **Easy Updates** - One click to change status from pending to completed

## Reports Integration

### Pending Refunds Report
```sql
SELECT
  id,
  voucher_code,
  passport_number,
  amount,
  refund_payment_method,
  refund_reason,
  refunded_by,
  refunded_at
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_status = 'pending'
ORDER BY refunded_at DESC;
```

### Completed Refunds Report
```sql
SELECT
  id,
  voucher_code,
  passport_number,
  amount,
  refund_payment_method,
  refund_reason,
  refunded_by,
  refunded_at
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_status = 'completed'
ORDER BY refunded_at DESC;
```

### Cash Reconciliation
For daily cash reconciliation, only include **completed** refunds:
```sql
-- Cash refunds completed today
SELECT SUM(amount) as cash_refunded
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_status = 'completed'
  AND refund_payment_method = 'CASH'
  AND DATE(refunded_at) = CURRENT_DATE;
```

## Notes

- Existing refunded payments will be migrated to `refund_status = 'completed'`
- Status badge is clickable only when `refund_status = 'pending'`
- Both Flex_Admin and Finance_Manager can update refund status
- Counter_Agent cannot access the Payments page
