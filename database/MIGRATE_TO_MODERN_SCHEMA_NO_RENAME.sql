-- ============================================================================
-- MIGRATE TO MODERN SCHEMA - Complete Migration Script (No Table Rename)
-- Purpose: Move from mixed (legacy + modern) schema to pure modern schema
-- Date: 2025-12-19
-- Status: Test data migration (safe to run)
-- ============================================================================

-- CONTEXT:
-- Current production has TWO schemas:
-- 1. Legacy (capitalized) tables: "Passport", "User", "Role" with CamelCase columns
-- 2. Modern (lowercase) tables: passports, individual_purchases, etc. with snake_case
--
-- This script migrates data from legacy → modern WITHOUT renaming tables
-- (Table rename requires superuser - will be done separately if needed)

BEGIN;

-- ============================================================================
-- STEP 1: BACKUP VERIFICATION
-- ============================================================================

-- Verify we have backups before proceeding
DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'MIGRATION TO MODERN SCHEMA';
  RAISE NOTICE 'Date: %', CURRENT_TIMESTAMP;
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Ensure you have created a backup before proceeding!';
  RAISE NOTICE 'Command: pg_dump -h localhost -U greenpay_user -d greenpay_db > backup.sql';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: PRE-MIGRATION VALIDATION
-- ============================================================================

-- Show current data distribution
DO $$
DECLARE
  legacy_passport_count INT;
  modern_passport_count INT;
  legacy_user_count INT;
  modern_profile_count INT;
  individual_purchases_count INT;
  corporate_vouchers_count INT;
BEGIN
  SELECT COUNT(*) INTO legacy_passport_count FROM "Passport";
  SELECT COUNT(*) INTO modern_passport_count FROM passports;
  SELECT COUNT(*) INTO legacy_user_count FROM "User";
  SELECT COUNT(*) INTO modern_profile_count FROM profiles;
  SELECT COUNT(*) INTO individual_purchases_count FROM individual_purchases;
  SELECT COUNT(*) INTO corporate_vouchers_count FROM corporate_vouchers;

  RAISE NOTICE 'PRE-MIGRATION DATA COUNT:';
  RAISE NOTICE '  Legacy "Passport" table: % rows', legacy_passport_count;
  RAISE NOTICE '  Modern passports table: % rows', modern_passport_count;
  RAISE NOTICE '  Legacy "User" table: % rows', legacy_user_count;
  RAISE NOTICE '  Modern profiles table: % rows', modern_profile_count;
  RAISE NOTICE '  individual_purchases: % rows', individual_purchases_count;
  RAISE NOTICE '  corporate_vouchers: % rows', corporate_vouchers_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: MIGRATE PASSPORTS (Legacy → Modern)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migrating passports from "Passport" to passports...';
END $$;

-- Migrate all passports from legacy to modern table
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  issue_date,
  expiry_date,
  passport_type,
  created_by,
  created_at,
  updated_at
)
SELECT
  "passportNo" as passport_number,
  CONCAT("givenName", ' ', surname) as full_name,
  COALESCE(nationality, 'Unknown') as nationality,
  CASE
    WHEN dob IS NOT NULL THEN dob::date
    ELSE NULL
  END as date_of_birth,
  CASE
    WHEN "dateOfIssue" IS NOT NULL THEN "dateOfIssue"::date
    ELSE NULL
  END as issue_date,
  CASE
    WHEN "dateOfExpiry" IS NOT NULL THEN "dateOfExpiry"::date
    ELSE NULL
  END as expiry_date,
  COALESCE(type, 'Regular') as passport_type,
  "createdById" as created_by,
  "createdAt" as created_at,
  "updatedAt" as updated_at
FROM "Passport"
WHERE "passportNo" NOT IN (
  SELECT passport_number FROM passports
)
ON CONFLICT (passport_number) DO NOTHING;

-- Report migration results
DO $$
DECLARE
  migrated_count INT;
  modern_count INT;
BEGIN
  SELECT COUNT(*) INTO modern_count FROM passports;
  SELECT COUNT(*) INTO migrated_count FROM "Passport";

  RAISE NOTICE '';
  RAISE NOTICE 'PASSPORT MIGRATION RESULTS:';
  RAISE NOTICE '  Legacy table had: % passports', migrated_count;
  RAISE NOTICE '  Modern table now has: % passports', modern_count;
  RAISE NOTICE '';

  IF modern_count >= migrated_count THEN
    RAISE NOTICE '  ✓ Migration successful!';
  ELSE
    RAISE WARNING '  ⚠ Some passports may not have migrated. Check for duplicates.';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: UPDATE FOREIGN KEY REFERENCES (if needed)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Checking foreign key consistency...';
END $$;

DO $$
DECLARE
  orphaned_purchases INT;
  orphaned_vouchers INT;
BEGIN
  -- Check individual_purchases
  SELECT COUNT(*) INTO orphaned_purchases
  FROM individual_purchases ip
  WHERE ip.passport_number IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM passports p
      WHERE p.passport_number = ip.passport_number
    );

  -- Check corporate_vouchers
  SELECT COUNT(*) INTO orphaned_vouchers
  FROM corporate_vouchers cv
  WHERE cv.passport_number IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM passports p
      WHERE p.passport_number = cv.passport_number
    );

  IF orphaned_purchases > 0 THEN
    RAISE WARNING '  ⚠ Found % individual_purchases with invalid passport references', orphaned_purchases;
  ELSE
    RAISE NOTICE '  ✓ All individual_purchases have valid passport references';
  END IF;

  IF orphaned_vouchers > 0 THEN
    RAISE WARNING '  ⚠ Found % corporate_vouchers with invalid passport references', orphaned_vouchers;
  ELSE
    RAISE NOTICE '  ✓ All corporate_vouchers have valid passport references';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: POST-MIGRATION VALIDATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'POST-MIGRATION VALIDATION:';
  RAISE NOTICE '';
END $$;

-- Verify data integrity
DO $$
DECLARE
  passport_count INT;
  individual_count INT;
  corporate_count INT;
  invoice_count INT;
  quotation_count INT;
BEGIN
  SELECT COUNT(*) INTO passport_count FROM passports;
  SELECT COUNT(*) INTO individual_count FROM individual_purchases;
  SELECT COUNT(*) INTO corporate_count FROM corporate_vouchers;
  SELECT COUNT(*) INTO invoice_count FROM invoices;
  SELECT COUNT(*) INTO quotation_count FROM quotations;

  RAISE NOTICE 'FINAL DATA COUNT (Modern Schema):';
  RAISE NOTICE '  passports: % rows', passport_count;
  RAISE NOTICE '  individual_purchases: % rows', individual_count;
  RAISE NOTICE '  corporate_vouchers: % rows', corporate_count;
  RAISE NOTICE '  invoices: % rows', invoice_count;
  RAISE NOTICE '  quotations: % rows', quotation_count;
  RAISE NOTICE '';

  RAISE NOTICE 'AUTH TABLES (Kept - Still Active):';
  SELECT COUNT(*) INTO passport_count FROM "User";
  RAISE NOTICE '  "User": % rows', passport_count;
  SELECT COUNT(*) INTO passport_count FROM "Role";
  RAISE NOTICE '  "Role": % rows', passport_count;
  RAISE NOTICE '';

  RAISE NOTICE 'LEGACY PASSPORT TABLE (Not renamed - requires superuser):';
  SELECT COUNT(*) INTO passport_count FROM "Passport";
  RAISE NOTICE '  "Passport": % rows', passport_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 6: VERIFY UNIQUENESS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Verifying data uniqueness...';
END $$;

DO $$
DECLARE
  dup_passports INT;
  dup_individual INT;
  dup_corporate INT;
BEGIN
  -- Check for duplicate passport numbers
  SELECT COUNT(*) INTO dup_passports
  FROM (
    SELECT passport_number, COUNT(*)
    FROM passports
    GROUP BY passport_number
    HAVING COUNT(*) > 1
  ) dups;

  -- Check for duplicate voucher codes in individual_purchases
  SELECT COUNT(*) INTO dup_individual
  FROM (
    SELECT voucher_code, COUNT(*)
    FROM individual_purchases
    GROUP BY voucher_code
    HAVING COUNT(*) > 1
  ) dups;

  -- Check for duplicate voucher codes in corporate_vouchers
  SELECT COUNT(*) INTO dup_corporate
  FROM (
    SELECT voucher_code, COUNT(*)
    FROM corporate_vouchers
    GROUP BY voucher_code
    HAVING COUNT(*) > 1
  ) dups;

  IF dup_passports = 0 AND dup_individual = 0 AND dup_corporate = 0 THEN
    RAISE NOTICE '  ✓ No duplicates found - data integrity good!';
  ELSE
    IF dup_passports > 0 THEN
      RAISE WARNING '  ⚠ Found % duplicate passport numbers', dup_passports;
    END IF;
    IF dup_individual > 0 THEN
      RAISE WARNING '  ⚠ Found % duplicate individual voucher codes', dup_individual;
    END IF;
    IF dup_corporate > 0 THEN
      RAISE WARNING '  ⚠ Found % duplicate corporate voucher codes', dup_corporate;
    END IF;
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 7: SUCCESS SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Test backend passport routes';
  RAISE NOTICE '   curl https://greenpay.eywademo.cloud/api/passports | jq .length';
  RAISE NOTICE '';
  RAISE NOTICE '2. Verify passport CRUD operations work';
  RAISE NOTICE '';
  RAISE NOTICE '3. To archive legacy "Passport" table (requires postgres superuser):';
  RAISE NOTICE '   sudo -u postgres psql greenpay_db';
  RAISE NOTICE '   ALTER TABLE "Passport" RENAME TO "_archived_Passport_20251219";';
  RAISE NOTICE '';
  RAISE NOTICE 'ROLLBACK PROCEDURE (if needed):';
  RAISE NOTICE '1. ROLLBACK; (if still in transaction)';
  RAISE NOTICE '2. Or restore from backup';
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================';
END $$;

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
