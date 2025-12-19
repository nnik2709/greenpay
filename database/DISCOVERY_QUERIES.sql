-- ============================================================================
-- DATABASE DISCOVERY QUERIES
-- Purpose: Determine which tables have actual data (legacy vs modern)
-- Run these queries on production to understand the data distribution
-- Date: 2025-12-19
-- ============================================================================

-- CRITICAL QUESTION: Where is the actual data?
-- The production database has BOTH legacy (capitalized) and modern (lowercase) tables
-- We need to know which ones are actively used

-- ============================================================================
-- PART 1: ROW COUNT COMPARISON
-- ============================================================================

-- Check Passport Tables
SELECT 'Legacy "Passport" (capitalized)' as table_name, COUNT(*) as row_count FROM "Passport"
UNION ALL
SELECT 'Modern passports (lowercase)' as table_name, COUNT(*) as row_count FROM passports;

-- Check User Tables
SELECT 'Legacy "User" (capitalized)' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 'Modern profiles (lowercase)' as table_name, COUNT(*) as row_count FROM profiles;

-- Check Invoice Tables
SELECT 'Legacy "Invoice" (capitalized)' as table_name, COUNT(*) as row_count FROM "Invoice"
UNION ALL
SELECT 'Modern invoices (lowercase)' as table_name, COUNT(*) as row_count FROM invoices;

-- Check Quotation Tables
SELECT 'Legacy "Quotation" (capitalized)' as table_name, COUNT(*) as row_count FROM "Quotation"
UNION ALL
SELECT 'Modern quotations (lowercase)' as table_name, COUNT(*) as row_count FROM quotations;

-- Check Role Table (legacy only)
SELECT 'Legacy "Role" table' as table_name, COUNT(*) as row_count FROM "Role";

-- ============================================================================
-- PART 2: MODERN TABLES (Should have most data)
-- ============================================================================

-- Individual Purchases (modern only)
SELECT 'individual_purchases' as table_name, COUNT(*) as row_count FROM individual_purchases;

-- Corporate Vouchers (modern only)
SELECT 'corporate_vouchers' as table_name, COUNT(*) as row_count FROM corporate_vouchers;

-- Customers (modern only)
SELECT 'customers' as table_name, COUNT(*) as row_count FROM customers;

-- Purchase Sessions (modern only)
SELECT 'purchase_sessions' as table_name, COUNT(*) as row_count FROM purchase_sessions;

-- Invoice Payments (modern only)
SELECT 'invoice_payments' as table_name, COUNT(*) as row_count FROM invoice_payments;

-- ============================================================================
-- PART 3: RECENT DATA CHECK (Last 7 days)
-- ============================================================================

-- Recent data in legacy Passport vs modern passports
SELECT 'Legacy "Passport" (recent)' as table_name,
       COUNT(*) as count_last_7_days
FROM "Passport"
WHERE "createdAt" > NOW() - INTERVAL '7 days';

SELECT 'Modern passports (recent)' as table_name,
       COUNT(*) as count_last_7_days
FROM passports
WHERE created_at > NOW() - INTERVAL '7 days';

-- Recent data in individual_purchases
SELECT 'individual_purchases (recent)' as table_name,
       COUNT(*) as count_last_7_days
FROM individual_purchases
WHERE created_at > NOW() - INTERVAL '7 days';

-- Recent data in corporate_vouchers
SELECT 'corporate_vouchers (recent)' as table_name,
       COUNT(*) as count_last_7_days
FROM corporate_vouchers
WHERE issued_date > NOW() - INTERVAL '7 days';

-- Recent invoices
SELECT 'Modern invoices (recent)' as table_name,
       COUNT(*) as count_last_7_days
FROM invoices
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- PART 4: SAMPLE DATA INSPECTION
-- ============================================================================

-- Sample from legacy Passport (if exists)
SELECT
  'Legacy Passport Sample' as source,
  id,
  "passportNo" as passport_number,
  "givenName" as given_name,
  surname,
  "createdAt" as created_at
FROM "Passport"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Sample from modern passports (if exists)
SELECT
  'Modern passports Sample' as source,
  id,
  passport_number,
  full_name,
  nationality,
  created_at
FROM passports
ORDER BY created_at DESC
LIMIT 5;

-- Sample from modern individual_purchases
SELECT
  'individual_purchases Sample' as source,
  id,
  voucher_code,
  passport_number,
  customer_name,
  amount,
  payment_method,
  created_at
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 5;

-- Sample from modern corporate_vouchers
SELECT
  'corporate_vouchers Sample' as source,
  id,
  voucher_code,
  passport_number,
  company_name,
  amount,
  status,
  issued_date
FROM corporate_vouchers
ORDER BY issued_date DESC
LIMIT 5;

-- ============================================================================
-- PART 5: CRITICAL COLUMN VERIFICATION
-- ============================================================================

-- Verify individual_purchases has all needed columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
ORDER BY ordinal_position;

-- Verify corporate_vouchers columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'corporate_vouchers'
ORDER BY ordinal_position;

-- Verify passports columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'passports'
ORDER BY ordinal_position;

-- Verify invoices columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Verify quotations columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 6: USER AUTHENTICATION CHECK
-- ============================================================================

-- Check if using legacy User table or modern profiles
SELECT
  'Legacy User with Roles' as auth_system,
  u.id,
  u.email,
  u."isActive",
  r.name as role_name,
  u."createdAt"
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
ORDER BY u."createdAt" DESC
LIMIT 5;

-- Check modern profiles (Supabase Auth)
SELECT
  'Modern profiles (Supabase)' as auth_system,
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================================================
-- EXPECTED RESULTS INTERPRETATION:
-- ============================================================================

-- If legacy tables (capitalized) have MORE rows and RECENT data:
--   → Backend routes querying legacy tables are CORRECT
--   → Modern tables might be empty or unused
--   → Focus on fixing column mismatches in legacy queries

-- If modern tables (lowercase) have MORE rows and RECENT data:
--   → Backend routes need to be updated to query modern tables
--   → Legacy tables might be historical/archived data
--   → Most fixes will involve changing table names in queries

-- If BOTH have data:
--   → System is in TRANSITION state
--   → Need to determine PRIMARY data source per feature
--   → Might need to query BOTH tables and UNION results

-- ============================================================================
-- NEXT STEPS AFTER RUNNING THESE QUERIES:
-- ============================================================================

-- 1. Identify which table set has the actual data
-- 2. Update backend routes to query the correct tables
-- 3. Fix column name mismatches based on which table is primary
-- 4. Consider data migration if needed (legacy → modern or vice versa)
-- 5. Eventually deprecate/archive unused table set

-- ============================================================================
