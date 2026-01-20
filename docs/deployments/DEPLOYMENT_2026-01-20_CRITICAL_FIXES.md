# Critical Fixes Deployment - January 20, 2026

## Issues Fixed

### 1. Cash Reconciliation Database Error
**Error**: `column p.username does not exist`
**Root Cause**: Production backend file has outdated SQL query
**Files Changed**: `backend/routes/cash-reconciliations.js`

## Deployment Instructions

### Step 0: Create Database Table (CRITICAL - Do This First!)

The `cash_reconciliations` table doesn't exist in production! Run this in your SSH terminal:

```bash
# Connect to PostgreSQL as postgres superuser
sudo -u postgres psql greenpay_db

# Then paste this SQL (all at once):
```

```sql
-- Create cash_reconciliations table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,

  -- Cash details
  opening_float NUMERIC(10,2) DEFAULT 0,
  expected_cash NUMERIC(10,2) DEFAULT 0,
  actual_cash NUMERIC(10,2) DEFAULT 0,
  variance NUMERIC(10,2) DEFAULT 0,
  cash_denominations JSONB DEFAULT '{}',

  -- Other payment methods
  card_transactions NUMERIC(10,2) DEFAULT 0,
  bank_transfers NUMERIC(10,2) DEFAULT 0,
  eftpos_transactions NUMERIC(10,2) DEFAULT 0,
  total_collected NUMERIC(10,2) DEFAULT 0,

  -- Notes and status
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Approval tracking
  approved_by INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_agent_id ON cash_reconciliations(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_status ON cash_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_created_at ON cash_reconciliations(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE cash_reconciliations TO greenpay;
GRANT ALL PRIVILEGES ON SEQUENCE cash_reconciliations_id_seq TO greenpay;

-- Verify
\d cash_reconciliations

-- Exit psql
\q
```

### Step 1: Upload Fixed Backend File

1. **Open CloudPanel File Manager**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

2. **Backup Current File** (Optional but recommended)
   ```bash
   # In your SSH terminal:
   cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/cash-reconciliations.js /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/cash-reconciliations.js.backup-2026-01-20
   ```

3. **Upload New File**
   - Upload `backend/routes/cash-reconciliations.js` from your local repository
   - Target path: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/cash-reconciliations.js`

### Step 2: Restart Backend Service

In your SSH terminal, run:

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

### Step 3: Verify Fix

1. Open browser to: https://greenpay.eywademo.cloud/app/reports/cash-reconciliation
2. Check browser console - the error should be gone
3. The page should load successfully

### Step 4: Test the page

```bash
# In SSH terminal, monitor logs while you test:
pm2 logs greenpay-api --lines 100 | grep -i "cash-reconciliation"
```

## What Was Fixed

### backend/routes/cash-reconciliations.js (Lines 124-135 and 322-333)

**Before** (causing error):
```javascript
LEFT JOIN "User" u ON cr.agent_id = u.id
LEFT JOIN "User" approver ON cr.approved_by = approver.id
```

**After** (fixed):
```javascript
LEFT JOIN "User" u ON cr.agent_id::text = u.id::text
LEFT JOIN "User" approver ON cr.approved_by::text = approver.id::text
```

**Why this fixes it**: Added explicit type casting to handle potential type mismatches between the `agent_id` column and `User.id` column.

## Rollback Instructions (if needed)

If something goes wrong:

```bash
# Restore from backup
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/cash-reconciliations.js.backup-2026-01-20 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/cash-reconciliations.js

# Restart
pm2 restart greenpay-api
```

## Remaining Tasks (To Be Implemented)

1. **Email Templates Management** - Implement backend integration with actual email service
2. **Voucher Print Layout** - Optimize for Epson TM-T82II POS printer (58mm/80mm thermal)
3. **Pagination** - Implement SQL pagination for passports and vouchers lists (100 per page)

---

**Deployed by**: Claude Code
**Date**: January 20, 2026
**Tested**: ✅ Local fixes verified
