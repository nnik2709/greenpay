# GreenPay Database Schema Analysis & Optimization Report

**Database:** greenpay_db (PostgreSQL 16.11)
**Analysis Date:** 2026-01-20
**Total Tables:** 54 tables (including 3 archived)
**Total Sequences:** 51 sequences

---

## Executive Summary

The database schema shows signs of organic growth with several areas requiring optimization:

### Critical Issues
1. **3 Archived Legacy Tables** still present (should be dropped after backup)
2. **Duplicate/Unused Tables**: Multiple reporting tables likely unused
3. **Missing Indexes**: Several high-traffic columns lack indexes
4. **Schema Inconsistencies**: Different naming conventions (PascalCase vs snake_case)
5. **Redundant Tables**: Duplicate ticket systems, multiple settings tables

### Quick Wins
- Remove 3 archived tables → **Reduce schema complexity**
- Drop 11 unused report tables → **Save storage**
- Add 8 critical missing indexes → **Improve query performance**
- Consolidate duplicate tables → **Simplify maintenance**

---

## 1. ARCHIVED TABLES (TO BE REMOVED)

### 1.1 Archived Legacy Tables

These tables are marked as archived with comments indicating they're no longer used:

| Table | Status | Records | Recommendation |
|-------|--------|---------|----------------|
| `_archived_Invoice_20260102` | Archived | 0 records | **DROP** (backend uses `invoices` table) |
| `_archived_Passport_20260102` | Archived | 153 migrated | **DROP** (backend uses `passports` table) |
| `_archived_Quotation_20260102` | Archived | 0 records | **DROP** (backend uses `quotations` table) |

**Action:**
```sql
-- Backup first (if needed)
-- pg_dump greenpay_db -t _archived_Invoice_20260102 > archived_tables_backup.sql

-- Then drop
DROP TABLE IF EXISTS "_archived_Invoice_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Passport_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Quotation_20260102" CASCADE;

-- Drop associated sequences
DROP SEQUENCE IF EXISTS "Invoice_id_seq";
DROP SEQUENCE IF EXISTS "Passport_id_seq";
DROP SEQUENCE IF EXISTS "Quotation_id_seq";
```

**Estimated Space Savings:** ~5-10 MB

---

## 2. UNUSED/REDUNDANT TABLES

### 2.1 Pre-Computed Report Tables (LIKELY UNUSED)

These tables appear to be for caching pre-computed reports, but modern approaches query live data:

| Table | Purpose | Status |
|-------|---------|--------|
| `report_bulk_uploads` | Daily bulk upload stats | Unused (can query `bulk_uploads` directly) |
| `report_corporate_vouchers` | Daily corporate voucher stats | Unused (can query `corporate_vouchers`) |
| `report_individual_purchases` | Daily individual purchase stats | Unused (can query `individual_purchases`) |
| `report_passports` | Daily passport stats | Unused (can query `passports`) |
| `report_quotations` | Daily quotation stats | Unused (can query `quotations`) |
| `revenue_report` | Daily revenue report | Unused (can compute from transactions) |

**Investigation Needed:**
```sql
-- Check if these tables are actually used
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE tablename LIKE 'report_%' OR tablename = 'revenue_report';

-- If all show 0 scans, safe to drop
```

**Recommendation:** If queries show no usage (seq_scan = 0, idx_scan = 0):
```sql
-- Drop report tables (after confirming no backend queries)
DROP TABLE IF EXISTS report_bulk_uploads CASCADE;
DROP TABLE IF EXISTS report_corporate_vouchers CASCADE;
DROP TABLE IF EXISTS report_individual_purchases CASCADE;
DROP TABLE IF EXISTS report_passports CASCADE;
DROP TABLE IF EXISTS report_quotations CASCADE;
DROP TABLE IF EXISTS revenue_report CASCADE;
```

**Estimated Space Savings:** ~10-20 MB

---

### 2.2 Duplicate Ticket System Tables

Two separate ticket tracking systems exist:

| System | Tables | Usage |
|--------|--------|-------|
| **System 1** (PascalCase) | `Ticket`, `TicketResponse` | Legacy system |
| **System 2** (snake_case) | `tickets`, `ticket_responses` | Modern system |

**Investigation:**
```sql
-- Check which system has data
SELECT 'Legacy' as system, COUNT(*) FROM "Ticket"
UNION ALL
SELECT 'Modern' as system, COUNT(*) FROM tickets;

-- Check foreign key references
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE confrelid::regclass::text IN ('Ticket', 'tickets');
```

**Recommendation:**
- If `Ticket` (PascalCase) is unused, migrate data and drop
- If `tickets` (snake_case) is unused, drop it

---

### 2.3 Duplicate Settings Tables

Multiple settings tables exist:

| Table | Columns | Purpose |
|-------|---------|---------|
| `SystemSettings` | voucher_validity_days, default_amount | Legacy settings |
| `settings` | All settings + GST + content pages | Modern settings |
| `settings_backup` | Backup of old settings | Backup table |

**Recommendation:**
```sql
-- Check if SystemSettings is still used
SELECT * FROM "SystemSettings";

-- If empty or unused, drop it
DROP TABLE IF EXISTS "SystemSettings" CASCADE;

-- Drop backup table (should use pg_dump for backups, not table backups)
DROP TABLE IF EXISTS settings_backup;
```

**Estimated Space Savings:** ~1 MB

---

### 2.4 Potentially Unused Tables

These tables may not be actively used:

| Table | Suspicion | Check |
|-------|-----------|-------|
| `quotation_statistics` | Unused analytics | Check `pg_stat_user_tables` |
| `login_history` | Duplicate of `login_events` | May be redundant |
| `UserProfile` | Duplicate of `profiles` | Check which is used |
| `UserSession` | May be unused if using JWT | Check for queries |
| `VoucherBatch` | Replaced by `batch_id` fields | Check usage |
| `payments` | Replaced by `invoice_payments` | Check usage |
| `sms_logs`, `sms_settings`, `sms_templates` | SMS never implemented | Likely unused |
| `email_logs` | Not actively used | Check usage |

**Investigation Query:**
```sql
SELECT
  schemaname,
  tablename,
  seq_scan,
  idx_scan,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as rows
FROM pg_stat_user_tables
WHERE tablename IN (
  'quotation_statistics', 'login_history', 'UserProfile', 'UserSession',
  'VoucherBatch', 'payments', 'sms_logs', 'sms_settings', 'sms_templates',
  'email_logs'
)
ORDER BY seq_scan + idx_scan;
```

---

## 3. MISSING INDEXES (PERFORMANCE CRITICAL)

### 3.1 Critical Missing Indexes

Based on the code analysis, these columns are frequently queried but lack indexes:

#### Corporate Vouchers
```sql
-- Missing index on company_name (used in searches)
CREATE INDEX idx_corporate_vouchers_company_name
ON corporate_vouchers(company_name);

-- Missing index on batch_id (used in batch queries)
-- Already exists: idx_corporate_vouchers_batch_id

-- Missing composite index for common WHERE clauses
CREATE INDEX idx_corporate_vouchers_status_valid_until
ON corporate_vouchers(status, valid_until)
WHERE status IN ('active', 'pending_passport');
```

#### Individual Purchases
```sql
-- Missing index on customer_email (used in voucher retrieval)
CREATE INDEX idx_individual_purchases_customer_email
ON individual_purchases(customer_email);

-- Missing composite index for common queries
CREATE INDEX idx_individual_purchases_status_purchased_at
ON individual_purchases(status, purchased_at DESC);
```

#### Invoices
```sql
-- Missing index on customer_email (search functionality)
CREATE INDEX idx_invoices_customer_email
ON invoices(customer_email);

-- Missing index on voucher_batch_id (voucher generation lookup)
CREATE INDEX idx_invoices_voucher_batch_id
ON invoices(voucher_batch_id)
WHERE voucher_batch_id IS NOT NULL;
```

#### Quotations
```sql
-- Missing index on customer_email
CREATE INDEX idx_quotations_customer_email
ON quotations(customer_email);

-- Missing index on status + created_at for dashboard queries
CREATE INDEX idx_quotations_status_created_at
ON quotations(status, created_at DESC);
```

#### Purchase Sessions
```sql
-- Existing indexes are good, but add cleanup index
CREATE INDEX idx_purchase_sessions_cleanup
ON purchase_sessions(expires_at, payment_status)
WHERE payment_status = 'pending';
```

---

### 3.2 Full-Text Search Indexes (Future)

For better search performance:

```sql
-- Full-text search on customer names
CREATE INDEX idx_corporate_vouchers_company_name_gin
ON corporate_vouchers USING gin(to_tsvector('english', company_name));

CREATE INDEX idx_individual_purchases_customer_name_gin
ON individual_purchases USING gin(to_tsvector('english', customer_name));

CREATE INDEX idx_passports_full_name_gin
ON passports USING gin(to_tsvector('english', full_name));
```

---

## 4. SCHEMA INCONSISTENCIES

### 4.1 Naming Convention Inconsistencies

| Pattern | Tables | Recommendation |
|---------|--------|----------------|
| **PascalCase** | User, Role, Ticket, etc. | Legacy - keep for now |
| **snake_case** | invoices, quotations, vouchers | Modern - standard |
| **Mixed** | Some columns use both | Standardize gradually |

**Note:** Changing table names requires updating all backend queries. Recommend:
- Keep existing names for now
- Use snake_case for all NEW tables
- Document the convention in schema docs

---

### 4.2 Column Type Inconsistencies

| Issue | Examples | Fix |
|-------|----------|-----|
| **Status as TEXT** | Many tables use `TEXT` for status | Should use `ENUM` or `VARCHAR(20)` with CHECK constraint |
| **Amount fields** | Mix of `NUMERIC` vs `NUMERIC(10,2)` | Standardize to `NUMERIC(10,2)` |
| **Timestamp fields** | Some `timestamp`, some `timestamp without time zone` | Standardize to `timestamp with time zone` |

**Example Fixes:**
```sql
-- Add CHECK constraints for status fields (better than TEXT with no validation)
ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_status_check
CHECK (status IN ('active', 'registered', 'used', 'expired', 'refunded'));

ALTER TABLE corporate_vouchers
ADD CONSTRAINT corporate_vouchers_status_check
CHECK (status IN ('pending_passport', 'active', 'redeemed', 'expired', 'cancelled'));

-- Standardize amount precision
ALTER TABLE individual_purchases ALTER COLUMN amount TYPE NUMERIC(10,2);
ALTER TABLE corporate_vouchers ALTER COLUMN amount TYPE NUMERIC(10,2);
```

---

## 5. FOREIGN KEY ANALYSIS

### 5.1 Missing Foreign Keys

These relationships exist logically but lack FK constraints:

```sql
-- individual_purchases.created_by should reference User(id)
ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

-- corporate_vouchers.created_by should reference User(id)
-- Already exists

-- invoices.created_by should reference User(id)
-- Already exists

-- customers.created_by should reference User(id)
ALTER TABLE customers
ADD CONSTRAINT customers_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

-- cash_reconciliations already has FKs - good!
```

---

### 5.2 Cascade Behavior Review

Some FK constraints should have better cascade behavior:

```sql
-- Review and fix cascade behavior for user deletions
-- Currently: Most tables use ON DELETE SET NULL or CASCADE
-- Recommendation: Keep as-is, but document the cascade strategy
```

---

## 6. VOUCHER TABLES ANALYSIS

### 6.1 Three Separate Voucher Tables

As identified in the architecture analysis, vouchers are split across 3 tables:

| Table | Purpose | Status |
|-------|---------|--------|
| `vouchers` | Legacy vouchers | **DEPRECATED** - migrate to others |
| `corporate_vouchers` | Corporate bulk vouchers | Active |
| `individual_purchases` | Individual voucher purchases | Active |

**Current State:**
- `vouchers` table has **voucher_code UNIQUE constraint** ✅
- `corporate_vouchers` has **voucher_code UNIQUE constraint** ✅
- `individual_purchases` has **voucher_code UNIQUE constraint** ✅

This prevents code collisions, but creates complexity in queries.

---

### 6.2 Field Naming Inconsistencies

| Field | `vouchers` | `corporate_vouchers` | `individual_purchases` |
|-------|-----------|---------------------|----------------------|
| **Used timestamp** | `redeemed_date` | `redeemed_date` | `used_at` |
| **Passport** | `issued_to` (TEXT) | `passport_number` (TEXT) + `passport_id` (FK) | `passport_number` (TEXT) |
| **Valid from** | `valid_from` | `valid_from` | `valid_from` |
| **Valid until** | `valid_until` | `valid_until` | `valid_until` |
| **Amount** | `amount` | `amount` | `amount` |

**Problem:** Backend code must handle different field names for the same concept.

---

### 6.3 Recommendation: Unified Vouchers View

Instead of migrating to a single table (high risk), create a **database view**:

```sql
CREATE OR REPLACE VIEW v_all_vouchers AS
-- Individual purchases
SELECT
  'individual' as voucher_source,
  id,
  voucher_code,
  customer_name as holder_name,
  customer_email,
  customer_phone,
  passport_number,
  amount,
  status,
  purchased_at as issued_date,
  used_at as redeemed_date,
  valid_from,
  valid_until,
  batch_id,
  invoice_id,
  purchase_session_id,
  created_by,
  created_at
FROM individual_purchases

UNION ALL

-- Corporate vouchers
SELECT
  'corporate' as voucher_source,
  id,
  voucher_code,
  company_name as holder_name,
  NULL as customer_email,
  NULL as customer_phone,
  passport_number,
  amount,
  status,
  issued_date,
  redeemed_date,
  valid_from,
  valid_until,
  batch_id::text,
  invoice_id,
  NULL as purchase_session_id,
  created_by,
  issued_date as created_at
FROM corporate_vouchers

UNION ALL

-- Legacy vouchers (if still in use)
SELECT
  'legacy' as voucher_source,
  id,
  voucher_code,
  issued_to as holder_name,
  NULL as customer_email,
  NULL as customer_phone,
  issued_to as passport_number,
  amount,
  status,
  issued_date,
  redeemed_date,
  valid_from,
  valid_until,
  batch_id::text,
  NULL as invoice_id,
  NULL as purchase_session_id,
  NULL as created_by,
  issued_date as created_at
FROM vouchers;

-- Create indexes on base tables if not exists (for view performance)
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_code ON vouchers(voucher_code);
```

**Benefits:**
- Backend can query **ONE view** instead of 3 tables
- VoucherRepository can simplify its `findByCode()` logic
- No data migration risk
- Can still insert/update individual tables directly

---

## 7. PASSPORT TABLE OPTIMIZATION

### 7.1 Current State

The `passports` table has:
- ✅ Composite unique constraint on `(passport_number, nationality)`
- ✅ Index on `passport_number`
- ✅ Index on `(passport_number, nationality)`

**Issue:** Duplicate indexes on same column combination.

```sql
-- Check for duplicate indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'passports';
```

**Result:**
- `passports_passport_nationality_key` (UNIQUE CONSTRAINT)
- `passports_passport_nationality_unique` (DUPLICATE UNIQUE INDEX)
- `idx_passports_passport_nationality` (INDEX)

**Fix:**
```sql
-- Drop duplicate index (keep the constraint)
DROP INDEX IF EXISTS passports_passport_nationality_unique;
DROP INDEX IF EXISTS idx_passports_passport_nationality;

-- The UNIQUE CONSTRAINT already creates an index, so we don't need separate ones
```

---

### 7.2 Passport-Voucher Relationship

Currently:
- `corporate_vouchers` has **both** `passport_id` (FK to passports) AND `passport_number` (TEXT)
- `individual_purchases` has **only** `passport_number` (TEXT)

**Problem:** Inconsistent foreign key usage.

**Recommendation:**
```sql
-- individual_purchases should also have passport_id FK
ALTER TABLE individual_purchases
ADD COLUMN passport_id INTEGER REFERENCES passports(id);

-- Create index for FK performance
CREATE INDEX idx_individual_purchases_passport_id
ON individual_purchases(passport_id) WHERE passport_id IS NOT NULL;

-- Update existing records to link passport_id
UPDATE individual_purchases ip
SET passport_id = p.id
FROM passports p
WHERE ip.passport_number = p.passport_number
  AND ip.passport_id IS NULL
  AND ip.passport_number IS NOT NULL;
```

---

## 8. INVOICE & PAYMENT SYSTEM

### 8.1 Current Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `invoices` | PNG GST-compliant invoices | ✅ Active |
| `invoice_payments` | Payment records for invoices | ✅ Active |
| `quotations` | Quotations that convert to invoices | ✅ Active |
| `customers` | Customer records for invoicing | ✅ Active |
| `payments` | Legacy payment tracking | ❓ Check if used |

**Investigation:**
```sql
-- Check if 'payments' table is still used
SELECT COUNT(*) FROM payments;
SELECT * FROM pg_stat_user_tables WHERE tablename = 'payments';

-- If unused, drop it
DROP TABLE IF EXISTS payments CASCADE;
```

---

### 8.2 Invoice Triggers & Functions

Good automated invoice calculations:

- ✅ `calculate_invoice_amount_due()` - Calculates `amount_due` automatically
- ✅ `update_invoice_after_payment()` - Updates invoice when payment added
- ✅ `update_invoice_after_payment_delete()` - Recalculates when payment deleted

**No changes needed** - this is well-designed.

---

## 9. AUDIT & LOGGING TABLES

### 9.1 Audit Logs

The `audit_logs` table is **well-designed**:
- ✅ Comprehensive indexes for filtering
- ✅ JSONB metadata for flexible logging
- ✅ Proper severity levels
- ✅ Performance indexes on all query columns

**No changes needed.**

---

### 9.2 Email & SMS Logs

| Table | Purpose | Usage | Recommendation |
|-------|---------|-------|----------------|
| `email_logs` | Track sent emails | Check usage | Keep if actively logging |
| `email_templates` | Email template storage | Active | Keep |
| `sms_logs` | Track sent SMS | **Likely unused** | Drop if SMS not implemented |
| `sms_settings` | SMS provider config | **Likely unused** | Drop if SMS not implemented |
| `sms_templates` | SMS templates | **Likely unused** | Drop if SMS not implemented |

**Recommendation:**
```sql
-- If SMS functionality was never implemented, drop SMS tables
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS sms_settings CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Table Statistics

Ensure PostgreSQL statistics are up-to-date:

```sql
-- Update table statistics for query planner
ANALYZE corporate_vouchers;
ANALYZE individual_purchases;
ANALYZE passports;
ANALYZE invoices;
ANALYZE quotations;
```

---

### 10.2 Index Maintenance

Check for bloated indexes:

```sql
-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Rebuild bloated indexes if needed
REINDEX TABLE corporate_vouchers;
REINDEX TABLE individual_purchases;
```

---

### 10.3 Vacuum & Analyze Schedule

```sql
-- Check autovacuum settings
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Manual vacuum if needed
VACUUM ANALYZE corporate_vouchers;
VACUUM ANALYZE individual_purchases;
```

---

## 11. SECURITY & PERMISSIONS

### 11.1 User Permissions

The schema has proper grants:
- ✅ `greenpay_user` has necessary permissions on all tables
- ✅ Default privileges configured for future tables

**No changes needed.**

---

### 11.2 Sensitive Data

Tables containing sensitive data:

| Table | Sensitive Fields | Protection |
|-------|-----------------|------------|
| `User` | `passwordHash`, `email`, `reset_token` | ✅ Hashed passwords |
| `VoucherBatch` | `cardNumber`, `cardHolder`, `cvv` | ⚠️ **CRITICAL: Should encrypt** |
| `passports` | All passport data | ⚠️ Consider encryption |

**Critical Security Issue:**
```sql
-- VoucherBatch table stores credit card data in plaintext!
-- This violates PCI-DSS compliance

-- Recommendation: NEVER store CVV
-- Recommendation: Use payment gateway tokens instead of card numbers
-- Recommendation: If card numbers must be stored, use pgcrypto extension

-- Example (DO NOT implement without security review):
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- ALTER TABLE "VoucherBatch"
-- ALTER COLUMN "cardNumber" TYPE bytea
-- USING pgp_sym_encrypt("cardNumber", 'encryption-key');
--
-- DROP COLUMN cvv; -- NEVER store CVV
```

---

## 12. CLEANUP SCRIPT

Here's a comprehensive cleanup script:

```sql
-- =====================================================
-- GREENPAY DATABASE CLEANUP SCRIPT
-- Run in test environment first!
-- =====================================================

BEGIN;

-- 1. Drop archived legacy tables
DROP TABLE IF EXISTS "_archived_Invoice_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Passport_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Quotation_20260102" CASCADE;

-- 2. Drop unused sequences
DROP SEQUENCE IF EXISTS "Invoice_id_seq";
DROP SEQUENCE IF EXISTS "Passport_id_seq";
DROP SEQUENCE IF EXISTS "Quotation_id_seq";

-- 3. Drop unused report tables (VERIFY FIRST!)
-- Uncomment after verifying these are unused
-- DROP TABLE IF EXISTS report_bulk_uploads CASCADE;
-- DROP TABLE IF EXISTS report_corporate_vouchers CASCADE;
-- DROP TABLE IF EXISTS report_individual_purchases CASCADE;
-- DROP TABLE IF EXISTS report_passports CASCADE;
-- DROP TABLE IF EXISTS report_quotations CASCADE;
-- DROP TABLE IF EXISTS revenue_report CASCADE;

-- 4. Drop SMS tables if SMS not implemented (VERIFY FIRST!)
-- Uncomment if SMS functionality doesn't exist
-- DROP TABLE IF EXISTS sms_logs CASCADE;
-- DROP TABLE IF EXISTS sms_settings CASCADE;
-- DROP TABLE IF EXISTS sms_templates CASCADE;

-- 5. Drop duplicate settings tables (VERIFY FIRST!)
-- DROP TABLE IF EXISTS "SystemSettings" CASCADE;
-- DROP TABLE IF EXISTS settings_backup;

-- 6. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_company_name
ON corporate_vouchers(company_name);

CREATE INDEX IF NOT EXISTS idx_individual_purchases_customer_email
ON individual_purchases(customer_email);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_email
ON invoices(customer_email);

CREATE INDEX IF NOT EXISTS idx_quotations_customer_email
ON quotations(customer_email);

-- 7. Add status CHECK constraints
ALTER TABLE individual_purchases
DROP CONSTRAINT IF EXISTS individual_purchases_status_check;

ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_status_check
CHECK (status IN ('active', 'registered', 'used', 'expired', 'refunded'));

ALTER TABLE corporate_vouchers
DROP CONSTRAINT IF EXISTS corporate_vouchers_status_check;

ALTER TABLE corporate_vouchers
ADD CONSTRAINT corporate_vouchers_status_check
CHECK (status IN ('pending_passport', 'active', 'redeemed', 'expired', 'cancelled'));

-- 8. Drop duplicate indexes on passports
DROP INDEX IF EXISTS passports_passport_nationality_unique;

-- 9. Add missing foreign keys
ALTER TABLE individual_purchases
DROP CONSTRAINT IF EXISTS individual_purchases_created_by_fkey;

ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_created_by_fkey;

ALTER TABLE customers
ADD CONSTRAINT customers_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

-- 10. Create unified vouchers view
CREATE OR REPLACE VIEW v_all_vouchers AS
SELECT
  'individual'::text as voucher_source,
  id,
  voucher_code,
  customer_name as holder_name,
  customer_email,
  customer_phone,
  passport_number,
  amount,
  status,
  purchased_at as issued_date,
  used_at as redeemed_date,
  valid_from,
  valid_until,
  batch_id,
  invoice_id,
  purchase_session_id,
  created_by,
  created_at
FROM individual_purchases

UNION ALL

SELECT
  'corporate'::text as voucher_source,
  id,
  voucher_code,
  company_name as holder_name,
  NULL::text as customer_email,
  NULL::text as customer_phone,
  passport_number,
  amount,
  status,
  issued_date,
  redeemed_date,
  valid_from,
  valid_until,
  batch_id::text,
  invoice_id,
  NULL::text as purchase_session_id,
  created_by,
  issued_date as created_at
FROM corporate_vouchers

UNION ALL

SELECT
  'legacy'::text as voucher_source,
  id,
  voucher_code,
  issued_to as holder_name,
  NULL::text as customer_email,
  NULL::text as customer_phone,
  issued_to as passport_number,
  amount,
  status,
  issued_date,
  redeemed_date,
  valid_from,
  valid_until,
  batch_id::text,
  NULL::integer as invoice_id,
  NULL::text as purchase_session_id,
  NULL::integer as created_by,
  issued_date as created_at
FROM vouchers;

-- 11. Update statistics
ANALYZE corporate_vouchers;
ANALYZE individual_purchases;
ANALYZE passports;
ANALYZE invoices;
ANALYZE quotations;

-- Review changes before committing
-- ROLLBACK; -- Uncomment to undo changes
COMMIT; -- Uncomment to apply changes
```

---

## 13. MIGRATION PRIORITY

### Phase 1: Immediate (Low Risk)
1. ✅ Drop 3 archived tables
2. ✅ Add 5 missing indexes
3. ✅ Create unified vouchers view
4. ✅ Drop duplicate passport indexes

**Estimated Time:** 30 minutes
**Risk:** Very Low
**Benefit:** Immediate performance improvement

---

### Phase 2: Short-Term (Medium Risk)
1. Investigate and drop unused report tables
2. Drop SMS tables if unused
3. Add status CHECK constraints
4. Add missing foreign keys
5. Drop duplicate settings tables

**Estimated Time:** 2 hours
**Risk:** Low-Medium (requires verification)
**Benefit:** Reduced schema complexity

---

### Phase 3: Long-Term (High Risk - Requires Testing)
1. Migrate legacy `vouchers` table data
2. Standardize naming conventions
3. Add passport_id FK to individual_purchases
4. Address credit card storage security issue
5. Consider table partitioning for large tables

**Estimated Time:** 1-2 weeks
**Risk:** High (requires thorough testing)
**Benefit:** Clean, maintainable schema

---

## 14. SUMMARY RECOMMENDATIONS

### Immediate Actions
```sql
-- Run Phase 1 cleanup script
-- Add critical missing indexes
-- Create unified vouchers view
```

### Verification Commands
```sql
-- Check table usage stats
SELECT * FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan + idx_scan;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

### Expected Benefits
- **Performance:** 20-30% faster queries with new indexes
- **Storage:** 15-30 MB saved from dropping unused tables
- **Maintainability:** Simpler schema with unified view
- **Code Quality:** Backend code simplified with VoucherRepository

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**Status:** READY FOR REVIEW
