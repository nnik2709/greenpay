# Complete Schema Migration Plan
## Migrating Remaining Legacy Tables to Modern Schema

**Date:** 2026-01-02
**Current Status:** Partial Migration (Passports complete, Users/Quotations/Invoices pending)
**Target:** Full modern schema with all legacy tables archived

---

## Current State Analysis

### ✅ Already Migrated (Modern Schema Active)
- `passports` - 157 records (153 from legacy + 4 new)
- `individual_purchases` - 78 records
- `corporate_vouchers` - 342 records

### ⏳ Pending Migration (Legacy Schema Active)
- `"User"` - 6 users (authentication - CRITICAL)
- `"Quotation"` - Need to migrate
- `"Invoice"` - Need to migrate
- `"Role"` - 8 roles (referenced by User)
- `"PaymentMode"` - Payment methods
- `"Ticket"` / `"TicketResponse"` - Support tickets
- `"VoucherBatch"` - Corporate voucher batches
- Other legacy tables

---

## Migration Strategy

### Phase 1: Data Analysis & Backup (30 minutes)
1. Count records in all legacy tables
2. Identify relationships and dependencies
3. Create full database backup
4. Export data to CSV for safety

### Phase 2: User Migration (Most Critical - 1 hour)
**Challenge:** Users are for authentication - system will break if done wrong

**Approach:**
- Modern `profiles` table is for user metadata, NOT authentication
- Need to check if Supabase Auth is configured
- **Option A:** Keep legacy `"User"` table (safest)
- **Option B:** Migrate to modern auth system (requires code changes)

**Recommendation:** Keep `"User"` table active, archive when Supabase Auth is fully implemented

### Phase 3: Quotations & Invoices Migration (1 hour)
- Migrate from legacy to modern schema
- Update column names (camelCase → snake_case)
- Preserve relationships

### Phase 4: Other Tables Migration (1 hour)
- Roles, PaymentModes, Tickets, VoucherBatch
- Less critical, can be done gradually

### Phase 5: Testing & Verification (2 hours)
- Test all functionality
- Verify data integrity
- Confirm no data loss

### Phase 6: Archive Legacy Tables (30 minutes)
- Rename all legacy tables to `_archived_*`
- Keep for 30 days as backup
- Drop after verification period

---

## Detailed Migration Plan

### Step 1: Analyze Current Legacy Data

Run this to see what we're working with:

```bash
# Count all legacy table records
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user greenpay_db << 'EOF'
SELECT
  '"User"' as table_name,
  COUNT(*) as records,
  pg_size_pretty(pg_total_relation_size('"User"')) as size
UNION ALL
SELECT '"Role"', COUNT(*), pg_size_pretty(pg_total_relation_size('"Role"')) FROM "Role"
UNION ALL
SELECT '"Quotation"', COUNT(*), pg_size_pretty(pg_total_relation_size('"Quotation"')) FROM "Quotation"
UNION ALL
SELECT '"Invoice"', COUNT(*), pg_size_pretty(pg_total_relation_size('"Invoice"')) FROM "Invoice"
UNION ALL
SELECT '"PaymentMode"', COUNT(*), pg_size_pretty(pg_total_relation_size('"PaymentMode"')) FROM "PaymentMode"
UNION ALL
SELECT '"Ticket"', COUNT(*), pg_size_pretty(pg_total_relation_size('"Ticket"')) FROM "Ticket"
UNION ALL
SELECT '"TicketResponse"', COUNT(*), pg_size_pretty(pg_total_relation_size('"TicketResponse"')) FROM "TicketResponse"
UNION ALL
SELECT '"VoucherBatch"', COUNT(*), pg_size_pretty(pg_total_relation_size('"VoucherBatch"')) FROM "VoucherBatch"
UNION ALL
SELECT '"BulkPassportUpload"', COUNT(*), pg_size_pretty(pg_total_relation_size('"BulkPassportUpload"')) FROM "BulkPassportUpload"
UNION ALL
SELECT '"UserProfile"', COUNT(*), pg_size_pretty(pg_total_relation_size('"UserProfile"')) FROM "UserProfile"
UNION ALL
SELECT '"UserSession"', COUNT(*), pg_size_pretty(pg_total_relation_size('"UserSession"')) FROM "UserSession"
UNION ALL
SELECT '"SystemSettings"', COUNT(*), pg_size_pretty(pg_total_relation_size('"SystemSettings"')) FROM "SystemSettings";
EOF
```

### Step 2: Check Backend Code Dependencies

**CRITICAL:** Before migrating, need to check which tables the backend code actually uses:

```bash
# Search backend code for table references
cd /var/www/greenpay/backend
grep -r '"User"' routes/ services/ --include="*.js" | wc -l
grep -r 'FROM "Quotation"' routes/ services/ --include="*.js"
grep -r 'FROM "Invoice"' routes/ services/ --include="*.js"
```

This tells us if the backend is hardcoded to use legacy tables.

### Step 3: Create Backup

```bash
# Full database backup before migration
PGPASSWORD='GreenPay2025!Secure#PG' pg_dump -h localhost -U greenpay_user greenpay_db > /root/backups/pre_complete_migration_$(date +%Y%m%d_%H%M%S).sql
gzip /root/backups/pre_complete_migration_*.sql
```

---

## Migration Scripts

### Script 1: Check Backend Dependencies

```bash
#!/bin/bash
# check-backend-dependencies.sh

echo "Checking which legacy tables are used in backend code..."
echo ""

BACKEND_PATH="/var/www/greenpay/backend"

echo "=== User Table References ==="
grep -rn '"User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20

echo ""
echo "=== Quotation Table References ==="
grep -rn '"Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20

echo ""
echo "=== Invoice Table References ==="
grep -rn '"Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20

echo ""
echo "=== Role Table References ==="
grep -rn '"Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20

echo ""
echo "Summary: Count of legacy table references in backend"
echo "------------------------------------------------------"
echo "User: $(grep -r '"User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) references"
echo "Quotation: $(grep -r '"Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) references"
echo "Invoice: $(grep -r '"Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) references"
echo "Role: $(grep -r '"Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) references"
echo "PaymentMode: $(grep -r '"PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) references"
```

### Script 2: Migrate Quotations

```sql
-- migrate-quotations.sql

-- Create modern quotations table if not exists (already should exist)
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  number_of_passports INTEGER,
  amount_per_passport DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  amount_after_discount DECIMAL(10,2),
  items JSONB,
  tax DECIMAL(10,2) DEFAULT 0,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  sent_at TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check if quotations table has data
SELECT 'Existing modern quotations' as info, COUNT(*) as count FROM quotations;

-- Check legacy quotations
SELECT 'Legacy Quotation records' as info, COUNT(*) as count FROM "Quotation";

-- Migrate quotations from legacy to modern (only if modern is empty or for new records)
INSERT INTO quotations (
  quotation_number,
  company_name,
  contact_email,
  number_of_passports,
  amount_per_passport,
  total_amount,
  discount,
  discount_amount,
  amount_after_discount,
  valid_until,
  status,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  COALESCE("quotationNumber", 'QUO-' || id) as quotation_number,
  "clientName" as company_name,
  "clientEmail" as contact_email,
  "numberOfPassports" as number_of_passports,
  "amountPerPassport" as amount_per_passport,
  "totalAmount" as total_amount,
  "discountPercentage" as discount,
  "discountAmount" as discount_amount,
  "amountAfterDiscount" as amount_after_discount,
  "validityDate"::date as valid_until,
  CASE status
    WHEN 'draft' THEN 'draft'
    WHEN 'sent' THEN 'sent'
    WHEN 'approved' THEN 'approved'
    WHEN 'accepted' THEN 'accepted'
    ELSE 'draft'
  END as status,
  CONCAT_WS(E'\n', "termsConditions", notes) as notes,
  "createdBy" as created_by,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM "Quotation"
WHERE "quotationNumber" IS NOT NULL
ON CONFLICT (quotation_number) DO NOTHING;

-- Verification
SELECT 'Migration Result' as info;
SELECT 'Legacy' as source, COUNT(*) FROM "Quotation"
UNION ALL
SELECT 'Modern' as source, COUNT(*) FROM quotations;
```

### Script 3: Migrate Invoices

```sql
-- migrate-invoices.sql

-- Create modern invoices table if not exists
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER,
  quotation_id INTEGER,
  company_name VARCHAR(255),
  items JSONB,
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unpaid',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check existing data
SELECT 'Existing modern invoices' as info, COUNT(*) as count FROM invoices;
SELECT 'Legacy Invoice records' as info, COUNT(*) as count FROM "Invoice";

-- Migrate invoices from legacy to modern
INSERT INTO invoices (
  invoice_number,
  company_name,
  quotation_id,
  subtotal,
  total_amount,
  amount_paid,
  status,
  due_date,
  notes,
  created_by,
  created_at,
  updated_at
)
SELECT
  COALESCE("invoiceNumber", 'INV-' || id) as invoice_number,
  "clientName" as company_name,
  "quotationId" as quotation_id,
  ("totalAmount" - COALESCE("discount", 0)) as subtotal,
  "amountAfterDiscount" as total_amount,
  COALESCE("amountPaid", 0) as amount_paid,
  CASE status
    WHEN 'draft' THEN 'unpaid'
    WHEN 'sent' THEN 'unpaid'
    WHEN 'paid' THEN 'paid'
    WHEN 'overdue' THEN 'overdue'
    ELSE 'unpaid'
  END as status,
  "dueDate"::date as due_date,
  notes as notes,
  "createdBy" as created_by,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM "Invoice"
WHERE "invoiceNumber" IS NOT NULL
ON CONFLICT (invoice_number) DO NOTHING;

-- Verification
SELECT 'Migration Result' as info;
SELECT 'Legacy' as source, COUNT(*) FROM "Invoice"
UNION ALL
SELECT 'Modern' as source, COUNT(*) FROM invoices;
```

### Script 4: Archive Legacy Tables (AFTER verification)

```sql
-- archive-legacy-tables.sql
-- Run this ONLY after verifying modern tables work correctly

-- BACKUP FIRST!
-- This script renames legacy tables to archived versions

-- Check one more time before archiving
SELECT 'FINAL CHECK - Legacy tables about to be archived' as warning;

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name ~ '^[A-Z]'
  AND table_name NOT LIKE '_archived_%'
ORDER BY table_name;

-- Archive legacy tables (run these one by one, not all at once)
-- WAIT! READ THE MIGRATION VERIFICATION REPORT FIRST!

-- Archive Passport (already migrated)
-- ALTER TABLE "Passport" RENAME TO "_archived_Passport_20260102";

-- Archive Quotation (after migration and verification)
-- ALTER TABLE "Quotation" RENAME TO "_archived_Quotation_20260102";

-- Archive Invoice (after migration and verification)
-- ALTER TABLE "Invoice" RENAME TO "_archived_Invoice_20260102";

-- Archive other non-critical tables
-- ALTER TABLE "BulkPassportUpload" RENAME TO "_archived_BulkPassportUpload_20260102";
-- ALTER TABLE "UserProfile" RENAME TO "_archived_UserProfile_20260102";
-- ALTER TABLE "UserSession" RENAME TO "_archived_UserSession_20260102";
-- ALTER TABLE "SystemSettings" RENAME TO "_archived_SystemSettings_20260102";
-- ALTER TABLE "TicketResponse" RENAME TO "_archived_TicketResponse_20260102";
-- ALTER TABLE "VoucherBatch" RENAME TO "_archived_VoucherBatch_20260102";

-- KEEP ACTIVE FOR NOW (authentication dependencies):
-- "User", "Role", "PaymentMode", "Ticket"

-- Verification after archiving
SELECT 'Archived tables' as info;
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE '_archived_%'
ORDER BY table_name;
```

---

## Critical Decision: User Authentication

### Current Situation
- Backend uses `"User"` table for authentication
- Modern `profiles` table is empty (different purpose)
- Supabase Auth is configured but may not be actively used

### Option A: Keep Legacy User Table (RECOMMENDED for now)
**Pros:**
- Zero downtime
- Authentication keeps working
- No code changes needed
- Low risk

**Cons:**
- Hybrid schema continues
- Need to migrate later

**Action:**
- Keep `"User"`, `"Role"` tables active
- Archive when Supabase Auth is fully implemented

### Option B: Migrate to Supabase Auth Now
**Pros:**
- Full modern architecture
- Better security
- Scalable

**Cons:**
- Requires backend code changes
- Risk of breaking authentication
- Downtime required
- Complex migration

**Action:**
- Requires separate project
- Should be planned carefully
- Not part of this schema cleanup

---

## Execution Timeline

### Immediate (This Session)
1. ✅ Run backend dependency check
2. ✅ Create database backup
3. ✅ Migrate Quotations to modern schema
4. ✅ Migrate Invoices to modern schema
5. ✅ Test quotation/invoice functionality
6. ✅ Archive non-critical legacy tables

### Short-term (Next Week)
1. Monitor system stability
2. Verify no issues with migrated data
3. Update backend code to use modern tables
4. Archive remaining safe-to-archive tables

### Medium-term (Next Month)
1. Plan Supabase Auth migration
2. Migrate User authentication
3. Archive final legacy tables
4. Drop archived tables after 30 days

---

## Rollback Plan

If something breaks after migration:

```sql
-- Rollback: Restore from backup
-- 1. Stop backend
-- pm2 stop greenpay-api

-- 2. Restore database
-- PGPASSWORD='GreenPay2025!Secure#PG' dropdb -h localhost -U greenpay_user greenpay_db
-- PGPASSWORD='GreenPay2025!Secure#PG' createdb -h localhost -U greenpay_user greenpay_db
-- gunzip -c /root/backups/pre_complete_migration_*.sql.gz | PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user greenpay_db

-- 3. Restart backend
-- pm2 restart greenpay-api
```

---

## Success Criteria

### Phase 1: Quotations & Invoices
- ✅ All quotations migrated to modern schema
- ✅ All invoices migrated to modern schema
- ✅ No data loss (record counts match)
- ✅ Financial totals match
- ✅ System functionality works (can view/create/edit)

### Phase 2: Non-Critical Tables
- ✅ Legacy tables archived
- ✅ Modern tables active
- ✅ No errors in backend logs

### Phase 3: Final State
- ✅ Only active legacy tables: User, Role, PaymentMode, Ticket (auth/config)
- ✅ All business data in modern schema
- ✅ System stable for 30 days
- ✅ Archived tables can be dropped

---

## Next Steps

**Run these in order:**

1. **Check backend dependencies**
   ```bash
   bash check-backend-dependencies.sh
   ```

2. **Create backup**
   ```bash
   bash create-backup.sh
   ```

3. **Migrate quotations**
   ```bash
   psql -f migrate-quotations.sql
   ```

4. **Migrate invoices**
   ```bash
   psql -f migrate-invoices.sql
   ```

5. **Test functionality**
   - Login to system
   - View quotations
   - View invoices
   - Create new quotation
   - Generate invoice

6. **Archive safe tables**
   ```bash
   psql -f archive-legacy-tables.sql
   ```

7. **Monitor for 7 days**
   - Check logs daily
   - Verify no errors
   - Confirm functionality

8. **Document final state**
   - Update architecture docs
   - Mark migration complete

---

**Created:** 2026-01-02
**Status:** Ready for execution
**Risk Level:** Medium (with proper testing)
**Estimated Time:** 4-6 hours (including testing)
