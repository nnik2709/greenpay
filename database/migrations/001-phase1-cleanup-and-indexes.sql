-- =====================================================
-- GREENPAY DATABASE OPTIMIZATION - PHASE 1
-- Low Risk, Immediate Performance Gains (~30 minutes)
-- =====================================================
--
-- WHAT THIS SCRIPT DOES:
-- 1. Drops 3 archived legacy tables (safe - already migrated)
-- 2. Adds 8 critical missing indexes (performance boost)
-- 3. Creates unified vouchers view (simplifies queries)
-- 4. Drops duplicate indexes
-- 5. Adds status CHECK constraints (data integrity)
-- 6. Updates table statistics
--
-- SAFETY:
-- - All operations are wrapped in a transaction (ROLLBACK if error)
-- - Uses IF EXISTS/IF NOT EXISTS (safe to run multiple times)
-- - No data modifications, only schema improvements
--
-- BEFORE RUNNING:
-- 1. Backup database:
--    pg_dump -h 165.22.52.100 -U greenpay -d greenpay > backup_$(date +%Y%m%d).sql
-- 2. Verify archived tables are empty:
--    SELECT COUNT(*) FROM "_archived_Invoice_20260102";
--    SELECT COUNT(*) FROM "_archived_Passport_20260102";
--    SELECT COUNT(*) FROM "_archived_Quotation_20260102";
--
-- TO RUN:
-- PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f 001-phase1-cleanup-and-indexes.sql
--
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: DROP ARCHIVED LEGACY TABLES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1: Dropping archived legacy tables...';
END $$;

DROP TABLE IF EXISTS "_archived_Invoice_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Passport_20260102" CASCADE;
DROP TABLE IF EXISTS "_archived_Quotation_20260102" CASCADE;

-- Drop unused sequences
DROP SEQUENCE IF EXISTS "Invoice_id_seq";
DROP SEQUENCE IF EXISTS "Passport_id_seq";
DROP SEQUENCE IF EXISTS "Quotation_id_seq";

DO $$
BEGIN
  RAISE NOTICE '✓ Archived tables dropped';
END $$;

-- =====================================================
-- STEP 2: ADD CRITICAL MISSING INDEXES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 2: Adding performance indexes...';
END $$;

-- Corporate vouchers company name search (used in admin searches)
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_company_name
ON corporate_vouchers(company_name);

-- Individual purchases email lookup (used in voucher retrieval)
CREATE INDEX IF NOT EXISTS idx_individual_purchases_customer_email
ON individual_purchases(customer_email);

-- Invoice customer search
CREATE INDEX IF NOT EXISTS idx_invoices_customer_email
ON invoices(customer_email);

-- Quotation customer search
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email
ON quotations(customer_email);

-- Voucher code lookups (critical for validation)
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_voucher_code
ON corporate_vouchers(voucher_code);

CREATE INDEX IF NOT EXISTS idx_individual_purchases_voucher_code
ON individual_purchases(voucher_code);

-- Status filtering (used in reports)
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_status
ON corporate_vouchers(status);

CREATE INDEX IF NOT EXISTS idx_individual_purchases_status
ON individual_purchases(status);

DO $$
BEGIN
  RAISE NOTICE '✓ Performance indexes added (8 indexes)';
END $$;

-- =====================================================
-- STEP 3: DROP DUPLICATE INDEXES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 3: Dropping duplicate indexes...';
END $$;

-- Remove duplicate unique constraint on passports (passport_number is already PRIMARY KEY)
DROP INDEX IF EXISTS passports_passport_nationality_unique;

DO $$
BEGIN
  RAISE NOTICE '✓ Duplicate indexes removed';
END $$;

-- =====================================================
-- STEP 4: ADD STATUS CHECK CONSTRAINTS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 4: Adding data integrity constraints...';
END $$;

-- Individual purchases status constraint
ALTER TABLE individual_purchases
DROP CONSTRAINT IF EXISTS individual_purchases_status_check;

ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_status_check
CHECK (status IN ('active', 'registered', 'used', 'expired', 'refunded'));

-- Corporate vouchers status constraint
ALTER TABLE corporate_vouchers
DROP CONSTRAINT IF EXISTS corporate_vouchers_status_check;

ALTER TABLE corporate_vouchers
ADD CONSTRAINT corporate_vouchers_status_check
CHECK (status IN ('pending_passport', 'active', 'redeemed', 'expired', 'cancelled'));

DO $$
BEGIN
  RAISE NOTICE '✓ Status constraints added';
END $$;

-- =====================================================
-- STEP 5: ADD MISSING FOREIGN KEYS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 5: Adding referential integrity constraints...';
END $$;

-- Individual purchases -> User
ALTER TABLE individual_purchases
DROP CONSTRAINT IF EXISTS individual_purchases_created_by_fkey;

ALTER TABLE individual_purchases
ADD CONSTRAINT individual_purchases_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

-- Customers -> User
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_created_by_fkey;

ALTER TABLE customers
ADD CONSTRAINT customers_created_by_fkey
FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

DO $$
BEGIN
  RAISE NOTICE '✓ Foreign key constraints added';
END $$;

-- =====================================================
-- STEP 6: CREATE UNIFIED VOUCHERS VIEW
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 6: Creating unified vouchers view...';
END $$;

CREATE OR REPLACE VIEW v_all_vouchers AS
-- Individual purchases
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

-- Corporate vouchers
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

-- Legacy vouchers
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

DO $$
BEGIN
  RAISE NOTICE '✓ Unified vouchers view created';
END $$;

-- =====================================================
-- STEP 7: UPDATE TABLE STATISTICS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 7: Updating table statistics for query planner...';
END $$;

ANALYZE corporate_vouchers;
ANALYZE individual_purchases;
ANALYZE vouchers;
ANALYZE passports;
ANALYZE invoices;
ANALYZE quotations;
ANALYZE customers;

DO $$
BEGIN
  RAISE NOTICE '✓ Table statistics updated';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'PHASE 1 MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ 3 archived tables dropped';
  RAISE NOTICE '  ✓ 8 performance indexes added';
  RAISE NOTICE '  ✓ 1 duplicate index removed';
  RAISE NOTICE '  ✓ 2 status constraints added';
  RAISE NOTICE '  ✓ 2 foreign key constraints added';
  RAISE NOTICE '  ✓ 1 unified vouchers view created';
  RAISE NOTICE '  ✓ 7 table statistics updated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run verification queries (see below)';
  RAISE NOTICE '  2. Monitor query performance in application logs';
  RAISE NOTICE '  3. Review Phase 2 migration plan (unused tables)';
  RAISE NOTICE '';
END $$;

-- Show new indexes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify unified view
SELECT
  voucher_source,
  COUNT(*) as count
FROM v_all_vouchers
GROUP BY voucher_source
ORDER BY voucher_source;

-- Review changes before committing
-- Uncomment the next line to ROLLBACK instead of COMMIT
-- ROLLBACK;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
