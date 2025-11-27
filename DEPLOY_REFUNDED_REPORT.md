# Deploy Refunded Report & Cash Reconciliation

## Overview
Added two new reports to the Reports menu:
1. **Refunded Report** - View all refunded payments with filters and summary
2. **Cash Reconciliation** - Daily cash reconciliation report (already existed, now added to menu)

## Changes Made

### New Files
1. `src/pages/reports/RefundedReport.jsx` - New refunded payments report page

### Modified Files
1. `src/App.jsx` - Added routes for both reports
2. `src/components/Header.jsx` - Added menu items for both reports

## Features

### Refunded Report (`/reports/refunded`)

**Access**: Flex_Admin, Finance_Manager, IT_Support

**Filters**:
- From Date / To Date
- Passport No
- File No (Exit Pass Code)

**Summary Cards**:
- Total Refunded (count)
- Total Refunded Amount
- Total Collected
- Total Original Amount

**Table Columns**:
- ID
- Exit Pass Code
- Passport No
- File No
- Original Amount
- Collected Amount
- Refunded Amount (red text)
- Payment Mode
- Created By
- Date & Time (refunded_at timestamp)
- Status ("Deleted" badge in red)

**Data Source**:
- Fetches from `/api/individual-purchases`
- Filters for `status = 'refunded'`

### Cash Reconciliation Report (`/reports/cash-reconciliation`)

**Access**: Flex_Admin, Finance_Manager, Counter_Agent

**Features**:
- Daily cash reconciliation
- Denomination counting
- Variance calculation
- Cash vs Card vs Other payments
- Opening float tracking
- History view

**Note**: This report needs to be updated to include cash refunds in the reconciliation calculation.

## Deployment Steps

### Frontend Only (No Backend Changes)

```bash
npm run build
# Upload dist/ folder to server
```

### Updating Cash Reconciliation for Refunds

The Cash Reconciliation service currently uses Supabase and needs to be migrated to PostgreSQL API to include refunds:

**Current behavior**:
- Only shows cash payments received
- Does not account for cash refunds

**Required enhancement**:
- Fetch refunded payments where `refund_payment_method = 'CASH'`
- Subtract cash refunds from expected cash
- Show refunds separately in summary

**Example SQL for cash refunds**:
```sql
SELECT
  COUNT(*) as refund_count,
  SUM(amount) as total_refunded
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_payment_method = 'CASH'
  AND DATE(refunded_at) = '2025-11-27';
```

## Menu Structure

Both reports are now in the **Reports** dropdown menu:

- Reports Dashboard
- Passport Reports
- Individual Purchase
- Corporate Vouchers
- Revenue Generated
- Bulk Uploads
- Quotations
- **Refunded** ← NEW
- **Cash Reconciliation** ← ADDED TO MENU

## Testing

### Refunded Report
1. Login as Flex_Admin or Finance_Manager
2. Navigate to Reports → Refunded
3. Should see all refunded payments
4. Test filters (date range, passport, file no)
5. Verify summary totals match filtered results

### Cash Reconciliation
1. Login as Counter_Agent
2. Navigate to Reports → Cash Reconciliation
3. Select today's date
4. Enter opening float
5. Load transactions
6. Count cash denominations
7. Submit reconciliation
8. Check variance calculation

## Next Steps

To fully integrate refunds with cash reconciliation:

1. Create backend API endpoint for cash reconciliation data
2. Migrate `cashReconciliationService.js` from Supabase to PostgreSQL API
3. Include refunds in the cash calculation:
   - Cash collected: Sum of cash payments
   - Cash refunded: Sum of cash refunds
   - Net cash: Cash collected - Cash refunded + Opening float
4. Display refunds separately in reconciliation summary
5. Update reconciliation table to store refund information

## Database Query for Cash Reconciliation with Refunds

```sql
-- Cash payments received
SELECT SUM(amount) as cash_received
FROM individual_purchases
WHERE payment_method = 'CASH'
  AND status != 'refunded'
  AND DATE(created_at) = CURRENT_DATE;

-- Cash refunds given
SELECT SUM(amount) as cash_refunded
FROM individual_purchases
WHERE status = 'refunded'
  AND refund_payment_method = 'CASH'
  AND DATE(refunded_at) = CURRENT_DATE;

-- Net cash position
-- Expected = Opening Float + Cash Received - Cash Refunded
```

## Notes

- Refunded Report shows status as "Deleted" (per screenshot)
- Refund payment method tracking is complete and ready for cash reconciliation integration
- Cash Reconciliation currently works but doesn't account for refunds yet
- Counter agents can access Cash Reconciliation but not Refunded Report
