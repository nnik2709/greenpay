# Batch Purchase Feature - Manual Deployment Instructions

**Date:** 2026-01-19
**Feature:** Batch Individual Voucher Purchase
**Deployment Method:** Manual File Upload via CloudPanel File Manager

---

## Overview

This guide provides step-by-step instructions for manually deploying the batch purchase feature to your production server at `greenpay.eywademo.cloud`.

**IMPORTANT:** Deploy with feature flag DISABLED first to verify zero impact on existing flows.

---

## Phase 1: Database Migrations (CRITICAL - Do This First)

### Step 1.1: Upload Database Migration Files

**Files to Upload:**
```
LOCAL:  database/migrations/add-batch-tracking.sql
SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/migrations/add-batch-tracking.sql

LOCAL:  database/migrations/fix-passport-composite-key.sql
SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/migrations/fix-passport-composite-key.sql
```

**How to Upload (via CloudPanel File Manager):**
1. Log into CloudPanel
2. Navigate to File Manager
3. Go to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/migrations/`
4. Click "Upload"
5. Select `add-batch-tracking.sql` and `fix-passport-composite-key.sql`
6. Click "Upload"

### Step 1.2: Run Database Migrations

**SSH Commands to Run:**

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to project directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Run migration 1: Add batch tracking columns
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -f database/migrations/add-batch-tracking.sql

# Expected output:
# NOTICE: Added batch_id column to individual_purchases table
# NOTICE: Added created_by column to individual_purchases table

# Run migration 2: Fix passport uniqueness constraint
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -f database/migrations/fix-passport-composite-key.sql

# Expected output:
# NOTICE: Dropped existing passport_number unique constraint
# NOTICE: Added composite unique constraint on (passport_number, nationality)

# Verify migrations succeeded
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "\d individual_purchases" | grep -E "batch_id|created_by"

# Expected output:
#  batch_id        | character varying(50) |           |          |
#  created_by      | integer               |           |          |
```

**✅ Checkpoint:** Database migrations complete. Proceed to backend deployment.

---

## Phase 2: Backend API Deployment

### Step 2.1: Backup Existing Backend File

**IMPORTANT:** Always backup before modifying production files!

```bash
# SSH to server (if not already connected)
ssh root@165.22.52.100

# Create backup
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js \
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js.backup-$(date +%Y%m%d-%H%M%S)

# Verify backup created
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js*
```

### Step 2.2: Upload Updated Backend File

**File to Upload:**
```
LOCAL:  backend/routes/individual-purchases.js
SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
```

**How to Upload:**
1. Open CloudPanel File Manager
2. Navigate to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. Click on `individual-purchases.js` → "Delete" (you have backup!)
4. Click "Upload"
5. Select your local `backend/routes/individual-purchases.js`
6. Click "Upload"

### Step 2.3: Verify File Upload

```bash
# Check file size (should be larger ~22-23KB with batch endpoints)
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js

# Check for batch endpoints in file
grep -c "router.post('/batch'" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
# Expected: 2 (one for batch purchase, one for batch email)

grep -c "router.get.*batch.*pdf" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
# Expected: 1 (batch PDF endpoint)
```

### Step 2.4: Restart Backend Service

```bash
# Restart backend API
pm2 restart greenpay-api

# Check logs for errors
pm2 logs greenpay-api --lines 50 --nostream

# Verify no errors (should see "greenpay-api" started successfully)
pm2 status
```

**✅ Checkpoint:** Backend deployed and running. Proceed to frontend deployment.

---

## Phase 3: Frontend Deployment (Feature DISABLED)

### Step 3.1: Upload Frontend Config Files

**Files to Upload:**

```
1. Feature Flags Configuration
   LOCAL:  src/config/features.js
   SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/config/features.js

2. Batch Purchase Service
   LOCAL:  src/lib/batchPurchaseService.js
   SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/lib/batchPurchaseService.js

3. Batch Quantity Selector Component
   LOCAL:  src/components/BatchQuantitySelector.jsx
   SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/components/BatchQuantitySelector.jsx

4. Batch Passport List Component
   LOCAL:  src/components/BatchPassportList.jsx
   SERVER: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/components/BatchPassportList.jsx
```

**How to Upload:**

1. **Upload features.js:**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/config/`
   - Create `config` directory if it doesn't exist
   - Upload `features.js`

2. **Upload batchPurchaseService.js:**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/lib/`
   - Upload `batchPurchaseService.js`

3. **Upload BatchQuantitySelector.jsx:**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/components/`
   - Upload `BatchQuantitySelector.jsx`

4. **Upload BatchPassportList.jsx:**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/components/`
   - Upload `BatchPassportList.jsx`

### Step 3.2: Verify Feature Flag is DISABLED

**CRITICAL:** Before building frontend, verify feature flag is OFF:

```bash
# Check feature flag status
cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/config/features.js | grep BATCH_PURCHASE_ENABLED

# Expected output:
#   BATCH_PURCHASE_ENABLED: false,

# If it shows "true", edit the file:
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/config/features.js
# Change line 16 from:
#   BATCH_PURCHASE_ENABLED: true,
# To:
#   BATCH_PURCHASE_ENABLED: false,
# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 3.3: Build Frontend

```bash
# Navigate to project directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Expected output:
# vite v4.x.x building for production...
# ✓ xxxx modules transformed.
# dist/index.html                  x.xx kB
# dist/assets/index-xxxxx.js       xxx.xx kB

# Verify dist directory created
ls -lh dist/
```

### Step 3.4: Restart Frontend Service (if using PM2 for frontend)

```bash
# If frontend is served via PM2
pm2 restart png-green-fees

# Check status
pm2 status

# View logs
pm2 logs png-green-fees --lines 20 --nostream
```

**✅ Checkpoint:** Frontend deployed with feature DISABLED. Users see no changes.

---

## Phase 4: Regression Testing (Feature DISABLED)

### Step 4.1: Test Existing Flows

**IMPORTANT:** With feature flag disabled, batch mode should be completely invisible.

**Test Cases:**

1. **Test Single Individual Purchase (Most Important)**
   - Login as Counter_Agent
   - Go to Individual Purchase page
   - Scan passport (or enter manually)
   - Proceed to payment
   - Complete purchase
   - Verify voucher generated
   - **Expected:** NO quantity selector visible, works exactly as before

2. **Test Online Purchase (BuyOnline.jsx)**
   - Go to public purchase page
   - Purchase 1-5 vouchers
   - Complete payment
   - **Expected:** Works exactly as before, zero changes

3. **Test Corporate Purchase**
   - Login as Finance_Manager
   - Go to Corporate Voucher Registration
   - Create batch
   - **Expected:** Works exactly as before, zero changes

**✅ Checkpoint:** All existing flows work. No errors in logs. Ready for Phase 5.

---

## Phase 5: Enable Feature for Testing (Internal Only)

**ONLY proceed if Phase 4 tests passed successfully.**

### Step 5.1: Enable Feature Flag

```bash
# Edit feature flag
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/src/config/features.js

# Change line 16:
# FROM:
  BATCH_PURCHASE_ENABLED: false,
# TO:
  BATCH_PURCHASE_ENABLED: true,

# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 5.2: Rebuild Frontend

```bash
# Rebuild with feature enabled
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
npm run build

# Restart frontend
pm2 restart png-green-fees
```

### Step 5.3: Test Batch Mode (IT_Support Only)

**Test Cases:**

1. **Test Quantity Selector Appears**
   - Login as IT_Support or Counter_Agent
   - Go to Individual Purchase
   - **Expected:** See quantity selector (1-5 buttons)
   - **Expected:** Default quantity = 1 (single mode)

2. **Test Batch Mode with 2 Vouchers**
   - Select quantity: 2
   - Scan first passport
   - Scan second passport
   - Verify both appear in passport list
   - Proceed to payment (PGK 100 total)
   - Complete payment
   - **Expected:** 2 vouchers created with same batch_id

3. **Test Batch PDF Download**
   - After creating batch
   - Click "Download All Vouchers"
   - **Expected:** PDF with 2 vouchers (2 pages)

4. **Test Batch Email**
   - After creating batch
   - Click "Email Vouchers"
   - Enter email address
   - **Expected:** Email sent with PDF attached

5. **Test Validation**
   - Try to scan 6 passports
   - **Expected:** Error "Maximum 5 vouchers allowed"

6. **Test Duplicate Detection**
   - Scan same passport twice in batch
   - **Expected:** Error "Duplicate passport detected"

7. **Test Switch Back to Single Mode**
   - Select quantity: 1
   - **Expected:** Passport list disappears
   - **Expected:** Single purchase flow (existing behavior)

**✅ Checkpoint:** Batch mode works correctly. Ready for pilot deployment.

---

## Phase 6: Pilot Deployment (2-3 Counter Agents)

### Step 6.1: Select Pilot Users

Choose 2-3 experienced Counter_Agent users for pilot testing.

### Step 6.2: Train Pilot Users

**Training Checklist:**
- [ ] How to select quantity (1-5)
- [ ] How to scan passports sequentially
- [ ] How to review passport list
- [ ] How to remove passport from list (if scanned wrong one)
- [ ] How to process payment (single payment for all)
- [ ] How to download batch PDF
- [ ] How to email batch vouchers

### Step 6.3: Monitor Pilot Usage

```bash
# Monitor backend logs in real-time
pm2 logs greenpay-api | grep BATCH

# Check batch purchases in database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay << 'EOF'
SELECT
  COUNT(*) as total_batch_vouchers,
  COUNT(DISTINCT batch_id) as unique_batches,
  MIN(created_at) as first_batch,
  MAX(created_at) as last_batch
FROM individual_purchases
WHERE batch_id IS NOT NULL;
EOF

# Check for errors
pm2 logs greenpay-api --err | grep -i batch
```

### Step 6.4: Gather Feedback

**Questions for Pilot Users:**
- Is the quantity selector easy to find?
- Is the sequential scanning workflow clear?
- Does the passport list show all necessary information?
- Is the payment process straightforward?
- Are the PDF and email features working well?
- Any confusing UI elements?
- Any errors or issues encountered?

**✅ Checkpoint:** Pilot successful with positive feedback. Ready for full rollout.

---

## Phase 7: Full Rollout (All Users)

### Step 7.1: Announce Feature

**Email to All Counter_Agents, Finance_Managers:**

```
Subject: New Feature: Batch Voucher Purchase (1-5 vouchers at once)

Hi Team,

We've deployed a new feature that allows you to process multiple individual vouchers
(1-5) in a single transaction, saving time when processing families or groups.

Key Benefits:
- 3x faster: Process 5 vouchers in 5 minutes instead of 15 minutes
- Single payment: One card swipe for all vouchers
- Better organization: All vouchers in single PDF

How to Use:
1. On Individual Purchase page, select quantity (1-5)
2. Scan passports sequentially (one at a time)
3. Review passport list
4. Process single payment for all vouchers
5. Download or email batch PDF

Training Resources:
- Video tutorial: [link]
- User guide: [link]

Support:
If you encounter any issues, contact IT Support.

Thank you!
```

### Step 7.2: Monitor Production

**Daily monitoring for first week:**

```bash
# Daily batch statistics
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay << 'EOF'
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE batch_id IS NULL) as single_purchases,
  COUNT(*) FILTER (WHERE batch_id IS NOT NULL) as batch_purchases,
  COUNT(DISTINCT batch_id) as unique_batches,
  ROUND(AVG(CASE WHEN batch_id IS NOT NULL THEN
    (SELECT COUNT(*) FROM individual_purchases ip2 WHERE ip2.batch_id = ip.batch_id)
  END), 2) as avg_batch_size
FROM individual_purchases
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
EOF

# Error monitoring
pm2 logs greenpay-api --err --lines 100 | grep -i batch

# Performance check (should be < 5 seconds per batch)
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay << 'EOF'
SELECT
  batch_id,
  COUNT(*) as vouchers,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as seconds
FROM individual_purchases
WHERE batch_id IS NOT NULL
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY batch_id
ORDER BY seconds DESC
LIMIT 10;
EOF
```

**✅ Checkpoint:** Full rollout complete. Feature stable.

---

## Rollback Procedures

### Emergency Rollback (< 5 minutes)

**If ANY critical issue discovered:**

```bash
# STEP 1: Disable feature flag immediately
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
nano src/config/features.js
# Change BATCH_PURCHASE_ENABLED: true to false
# Save and exit

# STEP 2: Rebuild frontend
npm run build

# STEP 3: Restart services
pm2 restart png-green-fees
pm2 restart greenpay-api

# STEP 4: Verify rollback
# Test single purchase flow works
```

**Effect:** Batch mode instantly hidden. Users only see single purchase mode.

---

### Backend Rollback (if database issues)

```bash
# STEP 1: Disable feature flag (as above)

# STEP 2: Restore backend from backup
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes
cp individual-purchases.js individual-purchases.js.failed
cp individual-purchases.js.backup-YYYYMMDD-HHMMSS individual-purchases.js

# STEP 3: Restart backend
pm2 restart greenpay-api

# STEP 4: (Optional) Rollback database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay << 'EOF'
ALTER TABLE individual_purchases DROP COLUMN IF EXISTS batch_id;
ALTER TABLE individual_purchases DROP COLUMN IF EXISTS created_by;
EOF
```

---

## Files Checklist

### Backend Files (Upload to Server)

- [x] `database/migrations/add-batch-tracking.sql`
- [x] `database/migrations/fix-passport-composite-key.sql`
- [x] `backend/routes/individual-purchases.js` (BACKUP FIRST!)

### Frontend Files (Upload to Server)

- [x] `src/config/features.js`
- [x] `src/lib/batchPurchaseService.js`
- [x] `src/components/BatchQuantitySelector.jsx`
- [x] `src/components/BatchPassportList.jsx`

### Documentation (Reference Only - Not for Server)

- [x] `BATCH_PURCHASE_PHASE1_DEPLOYMENT.md`
- [x] `BATCH_PURCHASE_RISK_ANALYSIS.md`
- [x] `BATCH_PURCHASE_FRONTEND_IMPLEMENTATION.md`
- [x] `BATCH_PURCHASE_SECURITY_REVIEW.md`
- [x] `BATCH_PURCHASE_DEPLOYMENT_SUMMARY.md`
- [x] `MANUAL_DEPLOYMENT_INSTRUCTIONS.md` (this file)

---

## Support Contacts

**Issues During Deployment:**
- Check PM2 logs: `pm2 logs greenpay-api`
- Check database connection: `PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT 1;"`
- Verify file permissions: `ls -la backend/routes/individual-purchases.js`

**Emergency Contacts:**
- IT Support: [Your contact]
- Database Admin: [Your contact]
- Development Team: [Your contact]

---

## Success Criteria

**Phase 1-4 (Feature Disabled):**
- ✅ Database migrations complete
- ✅ Backend deployed without errors
- ✅ Frontend builds successfully
- ✅ All existing flows work unchanged
- ✅ Zero errors in logs

**Phase 5-6 (Internal Testing):**
- ✅ Quantity selector appears
- ✅ Batch purchase creates multiple vouchers
- ✅ PDF download works
- ✅ Email sending works
- ✅ Validation works (max 5, no duplicates)
- ✅ Single mode (quantity=1) works as before

**Phase 7 (Full Rollout):**
- ✅ Batch adoption rate > 10% within 1 month
- ✅ Error rate < 2%
- ✅ User feedback positive
- ✅ Performance acceptable (< 5 seconds per batch)

---

**Deployment Prepared By:** Claude Code
**Deployment Date:** 2026-01-19
**Version:** 1.0
**Status:** Ready for Manual Deployment
