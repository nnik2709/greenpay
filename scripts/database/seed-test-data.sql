-- Seed Test Data for PNG Green Fees System
-- Run this script to populate database with test data for Playwright tests
--
-- Run with:
-- PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f seed-test-data.sql
--
-- First, let's check what users exist
-- SELECT id, email, role FROM "User";

-- Assuming user IDs from the system:
-- Flex_Admin: flexadmin@greenpay.com (assume id=1)
-- Counter_Agent: agent@greenpay.com (assume id=3)
-- Finance_Manager: finance@greenpay.com (assume id=2)

-- ===========================================
-- 1. CREATE TEST PASSPORTS
-- ===========================================

INSERT INTO "Passport" ("passportNo", nationality, surname, "givenName", dob, sex, "dateOfExpiry", "createdById", "createdAt", "updatedAt")
VALUES
  ('P1234567', 'USA', 'Smith', 'John', '1990-05-15', 'Male', '2030-12-31', 3, NOW(), NOW()),
  ('P2345678', 'AUS', 'Johnson', 'Sarah', '1985-08-22', 'Female', '2029-06-30', 3, NOW(), NOW()),
  ('P3456789', 'GBR', 'Williams', 'David', '1978-03-10', 'Male', '2028-11-15', 3, NOW(), NOW()),
  ('P4567890', 'CAN', 'Brown', 'Emma', '1992-11-28', 'Female', '2031-03-20', 3, NOW(), NOW()),
  ('P5678901', 'NZL', 'Jones', 'Michael', '1988-07-04', 'Male', '2029-09-10', 3, NOW(), NOW()),
  ('P6789012', 'DEU', 'Garcia', 'Maria', '1995-01-18', 'Female', '2030-05-25', 3, NOW(), NOW()),
  ('P7890123', 'FRA', 'Martinez', 'Carlos', '1982-09-30', 'Male', '2028-08-15', 3, NOW(), NOW()),
  ('P8901234', 'JPN', 'Anderson', 'Lisa', '1991-12-05', 'Female', '2031-01-10', 3, NOW(), NOW()),
  ('P9012345', 'CHN', 'Taylor', 'Robert', '1987-04-20', 'Male', '2029-07-22', 3, NOW(), NOW()),
  ('P0123456', 'IND', 'Thomas', 'Jennifer', '1993-06-14', 'Female', '2030-10-18', 3, NOW(), NOW())
ON CONFLICT ("passportNo") DO NOTHING;

-- ===========================================
-- 2. CREATE INDIVIDUAL PURCHASE VOUCHERS
-- ===========================================

-- Get passport IDs for voucher creation
DO $$
DECLARE
  passport1_id INTEGER;
  passport2_id INTEGER;
  passport3_id INTEGER;
  passport4_id INTEGER;
  passport5_id INTEGER;
  counter_agent_id INTEGER;
BEGIN
  -- Get passport IDs
  SELECT id INTO passport1_id FROM "Passport" WHERE "passportNo" = 'P1234567';
  SELECT id INTO passport2_id FROM "Passport" WHERE "passportNo" = 'P2345678';
  SELECT id INTO passport3_id FROM "Passport" WHERE "passportNo" = 'P3456789';
  SELECT id INTO passport4_id FROM "Passport" WHERE "passportNo" = 'P4567890';
  SELECT id INTO passport5_id FROM "Passport" WHERE "passportNo" = 'P5678901';

  -- Get counter agent user ID
  SELECT id INTO counter_agent_id FROM "User" WHERE email = 'agent@greenpay.com';

  -- Insert individual purchase vouchers
  INSERT INTO "IndividualPurchase" (
    "voucherCode",
    "passportId",
    "purchaseDate",
    "validFrom",
    "validUntil",
    amount,
    status,
    "paymentMode",
    "createdBy",
    "createdAt",
    "updatedAt"
  )
  VALUES
    -- Active vouchers
    ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), passport1_id, NOW() - INTERVAL '5 days', NOW(), NOW() + INTERVAL '90 days', 55.00, 'active', 'Cash', counter_agent_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), passport2_id, NOW() - INTERVAL '10 days', NOW(), NOW() + INTERVAL '90 days', 55.00, 'active', 'EFTPOS', counter_agent_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), passport3_id, NOW() - INTERVAL '3 days', NOW(), NOW() + INTERVAL '90 days', 55.00, 'active', 'Credit Card', counter_agent_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

    -- Used voucher
    ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), passport4_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 55.00, 'used', 'Cash', counter_agent_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),

    -- Expired voucher
    ('VP-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), passport5_id, NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days', NOW() - INTERVAL '90 days', 55.00, 'expired', 'EFTPOS', counter_agent_id, NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days')
  ON CONFLICT DO NOTHING;
END $$;

-- ===========================================
-- 3. CREATE INVOICES FROM EXISTING QUOTATIONS
-- ===========================================

-- Convert one of the existing quotations to an invoice
DO $$
DECLARE
  quotation_id INTEGER;
  finance_manager_id INTEGER;
BEGIN
  -- Get a quotation ID
  SELECT id INTO quotation_id FROM "Quotation" WHERE status = 'draft' LIMIT 1;

  -- Get finance manager user ID
  SELECT id INTO finance_manager_id FROM "User" WHERE email = 'finance@greenpay.com';

  IF quotation_id IS NOT NULL THEN
    -- Insert invoice based on quotation
    INSERT INTO "Invoice" (
      "quotationId",
      "invoiceNumber",
      "invoiceDate",
      "dueDate",
      "totalAmount",
      "paidAmount",
      status,
      "paymentStatus",
      "createdBy",
      "createdAt",
      "updatedAt"
    )
    VALUES
      (quotation_id, 'INV-2025-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'), NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 6875.00, 0, 'sent', 'unpaid', finance_manager_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days')
    ON CONFLICT DO NOTHING;

    -- Update quotation status to approved
    UPDATE "Quotation" SET status = 'approved', "updatedAt" = NOW() WHERE id = quotation_id;
  END IF;
END $$;

-- ===========================================
-- 4. CREATE FULLY PAID INVOICE WITH PAYMENT
-- ===========================================

DO $$
DECLARE
  quotation_id INTEGER;
  invoice_id INTEGER;
  finance_manager_id INTEGER;
BEGIN
  -- Get another quotation
  SELECT id INTO quotation_id FROM "Quotation" WHERE status = 'draft' ORDER BY id LIMIT 1 OFFSET 1;

  -- Get finance manager user ID
  SELECT id INTO finance_manager_id FROM "User" WHERE email = 'finance@greenpay.com';

  IF quotation_id IS NOT NULL THEN
    -- Create paid invoice
    INSERT INTO "Invoice" (
      "quotationId",
      "invoiceNumber",
      "invoiceDate",
      "dueDate",
      "totalAmount",
      "paidAmount",
      status,
      "paymentStatus",
      "vouchersGenerated",
      "createdBy",
      "createdAt",
      "updatedAt"
    )
    VALUES
      (quotation_id, 'INV-2025-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'), NOW() - INTERVAL '20 days', NOW() + INTERVAL '25 days', 550.00, 550.00, 'paid', 'paid', true, finance_manager_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days')
    RETURNING id INTO invoice_id;

    -- Create payment record if Payment table exists
    BEGIN
      INSERT INTO "Payment" (
        "invoiceId",
        "paymentDate",
        amount,
        "paymentMode",
        "referenceNumber",
        notes,
        "createdBy",
        "createdAt",
        "updatedAt"
      )
      VALUES
        (invoice_id, NOW() - INTERVAL '5 days', 550.00, 'Bank Transfer', 'TXN-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'), 'Full payment received', finance_manager_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Payment table does not exist, skipping payment creation';
    END;

    -- Update quotation status
    UPDATE "Quotation" SET status = 'approved', "updatedAt" = NOW() WHERE id = quotation_id;
  END IF;
END $$;

-- ===========================================
-- 5. UPDATE QUOTATION STATUSES
-- ===========================================

-- Mark one quotation as sent
UPDATE "Quotation"
SET status = 'sent', "updatedAt" = NOW()
WHERE status = 'draft' AND id NOT IN (SELECT "quotationId" FROM "Invoice" WHERE "quotationId" IS NOT NULL)
LIMIT 1;

-- ===========================================
-- 6. SUMMARY OF CREATED DATA
-- ===========================================

SELECT '=== TEST DATA SUMMARY ===' AS message;

SELECT 'Passports created:' AS category, COUNT(*) AS count
FROM "Passport"
WHERE "passportNo" IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901', 'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456');

SELECT 'Individual Purchases created:' AS category, COUNT(*) AS count
FROM "IndividualPurchase";

SELECT 'Voucher Status Breakdown:' AS category, status, COUNT(*) AS count
FROM "IndividualPurchase"
GROUP BY status;

SELECT 'Invoices created:' AS category, COUNT(*) AS count
FROM "Invoice";

SELECT 'Invoice Status Breakdown:' AS category, "paymentStatus", COUNT(*) AS count
FROM "Invoice"
GROUP BY "paymentStatus";

SELECT 'Quotations (total):' AS category, COUNT(*) AS count
FROM "Quotation";

SELECT 'Quotation Status Breakdown:' AS category, status, COUNT(*) AS count
FROM "Quotation"
GROUP BY status;

SELECT '=== READY FOR TESTING ===' AS message;
