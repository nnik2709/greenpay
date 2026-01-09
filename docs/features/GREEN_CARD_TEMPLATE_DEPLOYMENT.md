# GREEN CARD Template Deployment Guide

## Overview

This deployment adds unified GREEN CARD PDF template support for all voucher types with authorizing officer tracking.

## Deployment Date
**Prepared:** January 8, 2026

---

## Database Migration

### Required Changes
Add `created_by` column to track the Finance Manager who generated corporate vouchers.

### Migration SQL

```sql
-- Add created_by column to corporate_vouchers table
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "User"(id);

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'corporate_vouchers'
AND column_name = 'created_by';
```

### Deployment Steps

**Option 1: Via SSH Terminal (Recommended)**

User should paste these commands in their SSH terminal:

```bash
# Connect to production database using environment credentials
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Run migration (using credentials from .env file)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES "User"(id);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'corporate_vouchers'
AND column_name = 'created_by';
EOF
```

**Option 2: Via Database Admin Tool**

If using pgAdmin or similar tool, run the migration SQL directly.

---

## Backend Deployment

### Files Changed

1. `/backend/utils/pdfGenerator.js` - Updated footer with authorizing officer
2. `/backend/routes/invoices-gst.js` - Added Finance Manager tracking for corporate vouchers
3. `/backend/routes/vouchers.js` - Updated voucher download/email to include Finance Manager name

### Deployment Commands

User should paste these commands in their SSH terminal:

```bash
# Navigate to backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Verify PM2 process name and path
pm2 describe greenpay-api | grep script

# The files should already be uploaded via CloudPanel File Manager
# Verify files exist:
ls -lh utils/pdfGenerator.js
ls -lh routes/invoices-gst.js
ls -lh routes/vouchers.js

# Restart backend to apply changes
pm2 restart greenpay-api

# Monitor logs for errors
pm2 logs greenpay-api --lines 50
```

---

## Manual Testing Guide

### Test 1: Unregistered Corporate Voucher
**Purpose:** Verify vouchers generated from invoices show QR code, URL, and authorizing officer

**Steps:**
1. Log in as Finance_Manager role
2. Navigate to Quotations → Create New Quotation
3. Create quotation for 5 vouchers
4. Generate invoice from quotation
5. Record payment and generate vouchers
6. Download voucher PDF

**Expected Results:**
- ✅ CCDA logo centered at top
- ✅ "GREEN CARD" title in green
- ✅ Voucher code displayed prominently
- ✅ CODE128 barcode centered
- ✅ QR code visible on left side
- ✅ Registration URL clickable: `https://greenpay.eywademo.cloud/register/{CODE}`
- ✅ "Authorizing Officer: [Finance Manager Name]" in footer
- ✅ "Generated on [Month Day, Year, Time]" in footer
- ✅ NO passport information visible

### Test 2: Registered Corporate Voucher
**Purpose:** Verify vouchers show passport after registration

**Steps:**
1. Use voucher code from Test 1
2. Navigate to `/register/{VOUCHER_CODE}` (or use registration form)
3. Register passport to voucher
4. Download voucher PDF again

**Expected Results:**
- ✅ CCDA logo centered at top
- ✅ "GREEN CARD" title in green
- ✅ Voucher code displayed prominently
- ✅ CODE128 barcode centered
- ✅ Passport number displayed prominently
- ✅ NO QR code visible
- ✅ NO registration URL visible
- ✅ "Authorizing Officer: [Finance Manager Name]" still in footer
- ✅ "Registered on [Month Day, Year, Time]" in footer

### Test 3: Individual Purchase Voucher
**Purpose:** Verify individual purchases don't show authorizing officer

**Steps:**
1. Navigate to Individual Purchase page (as Counter_Agent or public user)
2. Enter passport details
3. Complete payment
4. Download voucher PDF

**Expected Results:**
- ✅ CCDA logo centered at top
- ✅ "GREEN CARD" title in green
- ✅ Voucher code displayed prominently
- ✅ CODE128 barcode centered
- ✅ Passport number displayed prominently
- ✅ NO QR code visible
- ✅ NO registration URL visible
- ✅ NO "Authorizing Officer" field in footer
- ✅ "Registered on [Month Day, Year, Time]" in footer

---

## Rollback Plan

If issues are found during testing:

### Rollback Database
```sql
-- Remove created_by column
ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS created_by;
```

### Rollback Backend Code

```bash
# Revert to previous commit (if using git)
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
git checkout HEAD~1 utils/pdfGenerator.js routes/invoices-gst.js routes/vouchers.js
pm2 restart greenpay-api
```

Or restore previous file versions from backup/CloudPanel File Manager history.

---

## Verification Checklist

After deployment and testing, verify:

- [ ] Database migration completed successfully
- [ ] Backend restarted without errors
- [ ] Test 1 passed: Unregistered corporate voucher shows QR code and authorizing officer
- [ ] Test 2 passed: Registered corporate voucher shows passport and authorizing officer
- [ ] Test 3 passed: Individual purchase voucher shows passport WITHOUT authorizing officer
- [ ] No errors in PM2 logs during testing
- [ ] All existing voucher functionality still works

---

## Technical Details

### Voucher Types and Logic

| Voucher Type | QR Code | URL | Passport | Authorizing Officer | Date Label |
|--------------|---------|-----|----------|---------------------|------------|
| Unregistered Corporate | Yes | Yes | No | Yes | Generated on |
| Registered Corporate | No | No | Yes | Yes | Registered on |
| Individual Purchase | No | No | Yes | No | Registered on |

### Date Format
All dates use full month name format: "January 8, 2026, 10:30 AM"

### Conditional Logic
- **Authorizing Officer**: Only shows if `voucher.created_by_name` exists
- **QR Code/URL**: Only shows if `voucher.passport_number` is null/empty
- **Date Label**: "Registered on" if passport exists, "Generated on" otherwise

### Database Schema
```sql
corporate_vouchers (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(255) UNIQUE,
  company_name VARCHAR(255),
  amount DECIMAL(10,2),
  status VARCHAR(50), -- 'pending_passport', 'active', 'used'
  passport_id INTEGER REFERENCES passports(id),
  passport_number VARCHAR(50),
  invoice_id INTEGER REFERENCES invoices(id),
  created_by INTEGER REFERENCES "User"(id), -- NEW COLUMN
  registered_at TIMESTAMP,
  registered_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  valid_from DATE,
  valid_until DATE
)
```

---

## Support

If issues occur during deployment:
1. Check PM2 logs: `pm2 logs greenpay-api --err`
2. Verify database migration: Query `information_schema.columns`
3. Check file upload: Verify modified files exist on server
4. Test with browser DevTools Network tab to see API responses

## Notes

- Individual purchases automatically work correctly due to conditional logic
- No frontend changes required
- All voucher types use the unified `generateVoucherPDFBuffer` function
- Finance Manager name is fetched from User table at voucher generation time
