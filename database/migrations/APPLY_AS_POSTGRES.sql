-- ============================================================================
-- CRITICAL MIGRATIONS - RUN AS POSTGRES SUPERUSER
-- ============================================================================
-- Date: 2025-12-18
-- Database: greenpay_db
-- Run as: postgres user (superuser)
--
-- HOW TO RUN:
-- PGPASSWORD='your_postgres_password' psql -h localhost -U postgres -d greenpay_db -f APPLY_AS_POSTGRES.sql
-- ============================================================================

\echo '========================================='
\echo 'Starting Critical Database Migrations'
\echo '========================================='
\echo ''

-- ============================================================================
-- MIGRATION 1: Add card_last_four column to individual_purchases
-- ============================================================================
\echo 'Migration 1: Adding card_last_four column...'

ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);

COMMENT ON COLUMN individual_purchases.card_last_four IS 'Last 4 digits of payment card (PCI compliant - never store full card number)';

\echo 'Verifying card_last_four column...'
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
AND column_name = 'card_last_four';

\echo '✓ Migration 1 complete'
\echo ''

-- ============================================================================
-- MIGRATION 2: Fix settings table permissions and RLS policies
-- ============================================================================
\echo 'Migration 2: Fixing settings table permissions...'

-- Show current owner
\echo 'Current settings table owner:'
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'settings';

-- Change owner to application user (greenpay_user)
ALTER TABLE settings OWNER TO greenpay_user;

\echo 'New settings table owner:'
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'settings';

-- Grant all privileges
GRANT ALL PRIVILEGES ON TABLE settings TO greenpay_user;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS flex_admin_settings_policy ON settings;
DROP POLICY IF EXISTS all_users_settings_read ON settings;
DROP POLICY IF EXISTS flex_admin_settings_all ON settings;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy for Flex_Admin to have full access
CREATE POLICY flex_admin_settings_all ON settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::integer
      AND users.role = 'Flex_Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::integer
      AND users.role = 'Flex_Admin'
    )
  );

-- Create policy for all authenticated users to read settings
CREATE POLICY all_users_settings_read ON settings
  FOR SELECT
  USING (true);

\echo 'Verifying RLS policies...'
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'settings';

\echo '✓ Migration 2 complete'
\echo ''

-- ============================================================================
-- MIGRATION 3: Fix individual_purchases table ownership (if needed)
-- ============================================================================
\echo 'Migration 3: Ensuring proper ownership of individual_purchases...'

-- Show current owner
\echo 'Current individual_purchases table owner:'
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'individual_purchases';

-- Change owner to application user if it's postgres
ALTER TABLE individual_purchases OWNER TO greenpay_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON TABLE individual_purchases TO greenpay_user;

\echo 'New individual_purchases table owner:'
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'individual_purchases';

\echo '✓ Migration 3 complete'
\echo ''

-- ============================================================================
-- MIGRATION 4: Fix other critical table ownerships
-- ============================================================================
\echo 'Migration 4: Fixing ownership of other tables...'

-- List of tables that should be owned by greenpay_user
ALTER TABLE users OWNER TO greenpay_user;
ALTER TABLE passports OWNER TO greenpay_user;
ALTER TABLE corporate_vouchers OWNER TO greenpay_user;
ALTER TABLE quotations OWNER TO greenpay_user;

GRANT ALL PRIVILEGES ON TABLE users TO greenpay_user;
GRANT ALL PRIVILEGES ON TABLE passports TO greenpay_user;
GRANT ALL PRIVILEGES ON TABLE corporate_vouchers TO greenpay_user;
GRANT ALL PRIVILEGES ON TABLE quotations TO greenpay_user;

\echo '✓ Migration 4 complete'
\echo ''

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo '========================================='
\echo 'VERIFICATION SUMMARY'
\echo '========================================='

\echo ''
\echo 'Table Ownerships:'
SELECT
    tablename,
    tableowner,
    CASE
        WHEN tableowner = 'greenpay_user' THEN '✓'
        ELSE '✗'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('individual_purchases', 'settings', 'users', 'passports', 'corporate_vouchers', 'quotations')
ORDER BY tablename;

\echo ''
\echo 'Settings Table RLS Policies:'
SELECT
    policyname,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_check_clause
FROM pg_policies
WHERE tablename = 'settings';

\echo ''
\echo 'Individual Purchases Columns:'
SELECT
    column_name,
    data_type,
    CASE
        WHEN column_name = 'card_last_four' THEN '✓ NEW'
        ELSE ''
    END as notes
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
ORDER BY ordinal_position;

\echo ''
\echo '========================================='
\echo 'All migrations completed successfully!'
\echo '========================================='
\echo ''
\echo 'Next steps:'
\echo '1. Restart the backend API: pm2 restart greenpay-api'
\echo '2. Test "View Vouchers" functionality'
\echo '3. Test settings save as Flex_Admin'
\echo ''
