-- Seed Test Data for PNG Green Fees System (v4 - With Test Voucher Codes)
-- Run with:
-- PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f seed-test-data-v4-final.sql

\echo '🌱 Seeding test data with specific test voucher codes...'
\echo ''

-- ===========================================
-- 1. CREATE TEST PASSPORTS
-- ===========================================

\echo '📘 Creating test passports in "Passport" table...'

INSERT INTO "Passport" ("passportNo", nationality, surname, "givenName", dob, sex, "dateOfExpiry", "createdById", "createdAt", "updatedAt")
VALUES
  ('P1234567', 'USA', 'Smith', 'John', '1990-05-15', 'Male', '2030-12-31', 3, NOW(), NOW()),
  ('P2345678', 'AUS', 'Johnson', 'Sarah', '1985-08-22', 'Female', '2029-06-30', 3, NOW(), NOW()),
  ('P3456789', 'GBR', 'Williams', 'David', '1978-03-10', 'Male', '2028-11-15', 3, NOW(), NOW()),
  ('P4567890', 'CAN', 'Brown', 'Emma', '1992-11-28', 'Female', '2031-03-20', 3, NOW(), NOW()),
  ('P5678901', 'NZL', 'Jones', 'Michael', '1988-07-04', 'Male', '2029-09-10', 3, NOW(), NOW()),
  ('PTEST123', 'FRA', 'Test', 'User', '1995-01-01', 'Male', '2030-12-31', 3, NOW(), NOW());

\echo '  ✓ Created 6 passports'

-- ===========================================
-- 2. CREATE INDIVIDUAL PURCHASE VOUCHERS WITH TEST CODES
-- ===========================================

\echo '🎫 Creating individual purchase vouchers with test codes...'

-- Delete existing vouchers with these codes first (in case running multiple times)
DELETE FROM individual_purchases WHERE voucher_code IN ('TEST-VOUCHER-123', 'VALID-TEST-VOUCHER', 'EXPIRED-VOUCHER-999', 'USED-VOUCHER-888');

-- Insert vouchers with specific test codes
INSERT INTO individual_purchases (
  voucher_code,
  passport_number,
  amount,
  payment_method,
  discount,
  collected_amount,
  returned_amount,
  valid_from,
  valid_until,
  customer_name,
  customer_email,
  created_at,
  used_at
)
VALUES
  -- Active voucher for most public registration tests
  ('TEST-VOUCHER-123', 'PTEST123', 55.00, 'Cash', 0, 55.00, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', 'Test User', 'test@example.com', NOW() - INTERVAL '1 day', NULL),

  -- Another valid voucher
  ('VALID-TEST-VOUCHER', 'P1234567', 55.00, 'EFTPOS', 0, 55.00, 0, NOW() - INTERVAL '2 days', NOW() + INTERVAL '90 days', 'John Smith', 'john.smith@example.com', NOW() - INTERVAL '2 days', NULL),

  -- Expired voucher (valid_until in the past)
  ('EXPIRED-VOUCHER-999', 'P2345678', 55.00, 'Credit Card', 0, 55.00, 0, NOW() - INTERVAL '180 days', NOW() - INTERVAL '90 days', 'Sarah Johnson', 'sarah.j@example.com', NOW() - INTERVAL '180 days', NULL),

  -- Used voucher (has used_at timestamp)
  ('USED-VOUCHER-888', 'P3456789', 55.00, 'Cash', 0, 55.00, 0, NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days', 'David Williams', 'david.w@example.com', NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days'),

  -- Additional active vouchers with random codes for other tests
  ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), 'P4567890', 55.00, 'EFTPOS', 0, 55.00, 0, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 'Emma Brown', 'emma.b@example.com', NOW() - INTERVAL '5 days', NULL),
  ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), 'P5678901', 55.00, 'Cash', 0, 55.00, 0, NOW() - INTERVAL '3 days', NOW() + INTERVAL '90 days', 'Michael Jones', 'michael.j@example.com', NOW() - INTERVAL '3 days', NULL);

\echo '  ✓ Created 6 vouchers (4 with test codes, 2 with random codes)'

-- ===========================================
-- 3. CREATE INVOICES (if quotations exist)
-- ===========================================

\echo '📄 Creating invoices...'

DO $$
DECLARE
  quotation_id INTEGER;
  finance_manager_id INTEGER := 2;
  invoice_num TEXT;
BEGIN
  -- Check if quotations table exists and has records
  SELECT id INTO quotation_id FROM quotations WHERE status = 'draft' LIMIT 1;

  IF quotation_id IS NOT NULL THEN
    -- Generate invoice number
    invoice_num := 'INV-2025-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Create unpaid invoice
    INSERT INTO invoices (
      quotation_id,
      invoice_number,
      invoice_date,
      due_date,
      total_amount,
      paid_amount,
      status,
      created_by,
      created_at,
      updated_at
    )
    VALUES
      (quotation_id, invoice_num, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 6875.00, 0, 'unpaid', finance_manager_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days')
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Update quotation status
    UPDATE quotations SET status = 'approved', updated_at = NOW() WHERE id = quotation_id;

    RAISE NOTICE '  ✓ Created invoice: %', invoice_num;
  ELSE
    RAISE NOTICE '  ℹ No draft quotations found, skipping invoice creation';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '  ℹ Invoices or quotations table does not exist';
  WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ Error creating invoice: %', SQLERRM;
END $$;

-- ===========================================
-- 4. SUMMARY
-- ===========================================

\echo ''
\echo '========================================='
\echo 'Test Data Summary'
\echo '========================================='

SELECT 'Passports:' AS info, COUNT(*) AS count FROM "Passport";
SELECT 'Individual Purchases:' AS info, COUNT(*) AS count FROM individual_purchases;

\echo ''
\echo 'Test vouchers created:'
SELECT
  voucher_code,
  passport_number,
  payment_method,
  valid_from::date,
  valid_until::date,
  CASE
    WHEN used_at IS NOT NULL THEN used_at::date::text
    ELSE 'not used'
  END as used_at,
  CASE
    WHEN used_at IS NOT NULL THEN 'USED'
    WHEN valid_until < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as status
FROM individual_purchases
WHERE voucher_code IN ('TEST-VOUCHER-123', 'VALID-TEST-VOUCHER', 'EXPIRED-VOUCHER-999', 'USED-VOUCHER-888')
ORDER BY voucher_code;

\echo ''
\echo '✅ Test data seeding complete!'
\echo ''
\echo 'Test voucher codes available:'
\echo '  • TEST-VOUCHER-123 (ACTIVE) - for most public registration tests'
\echo '  • VALID-TEST-VOUCHER (ACTIVE) - additional valid voucher'
\echo '  • EXPIRED-VOUCHER-999 (EXPIRED) - for expired voucher tests'
\echo '  • USED-VOUCHER-888 (USED) - for used voucher tests'
\echo ''
