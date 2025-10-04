-- =============================================
-- SAMPLE DATA FOR PNG GREEN FEES SYSTEM
-- =============================================
-- Run this in Supabase SQL Editor AFTER complete-setup.sql
-- This adds sample data for testing and demonstration
-- =============================================

-- Get the admin user ID for created_by fields
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE email = 'admin@example.com' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please run complete-setup.sql first.';
  END IF;

  -- =============================================
  -- PART 1: PASSPORTS
  -- =============================================

  INSERT INTO passports (passport_number, nationality, surname, given_name, date_of_birth, sex, date_of_expiry, created_by)
  VALUES
    ('P1234567', 'Australian', 'Smith', 'John', '1990-01-15', 'Male', '2030-01-15', admin_id),
    ('A9876543', 'American', 'Doe', 'Jane', '1992-05-20', 'Female', '2028-05-20', admin_id),
    ('G2468135', 'German', 'Müller', 'Hans', '1985-11-30', 'Male', '2032-11-30', admin_id),
    ('F1357924', 'French', 'Martin', 'Sophie', '1995-07-10', 'Female', '2029-07-10', admin_id),
    ('P7654321', 'Papua New Guinean', 'Kama', 'Michael', '1988-03-25', 'Male', '2027-03-25', admin_id),
    ('C8901234', 'Chinese', 'Wang', 'Li', '1993-09-18', 'Female', '2031-09-18', admin_id),
    ('N5678901', 'New Zealander', 'Wilson', 'Emma', '1991-12-05', 'Female', '2029-12-05', admin_id),
    ('J3456789', 'Japanese', 'Tanaka', 'Yuki', '1987-04-22', 'Male', '2030-04-22', admin_id)
  ON CONFLICT (passport_number) DO NOTHING;

  -- =============================================
  -- PART 2: INDIVIDUAL PURCHASES
  -- =============================================

  INSERT INTO individual_purchases (
    voucher_code,
    passport_id,
    passport_number,
    amount,
    payment_method,
    card_last_four,
    used_at,
    valid_from,
    valid_until,
    created_by
  )
  SELECT
    'IND-VALID-ABC',
    p.id,
    'F1357924',
    150.00,
    'CREDIT CARD',
    '4242',
    NULL,
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '20 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'F1357924'
  UNION ALL
  SELECT
    'IND-USED-DEF',
    p.id,
    'P7654321',
    150.00,
    'CASH',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '20 days',
    NOW() + INTERVAL '10 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'P7654321'
  UNION ALL
  SELECT
    'IND-RECENT-GHI',
    p.id,
    'C8901234',
    150.00,
    'DEBIT CARD',
    '5678',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '27 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'C8901234'
  ON CONFLICT (voucher_code) DO NOTHING;

  -- =============================================
  -- PART 3: CORPORATE VOUCHERS
  -- =============================================

  INSERT INTO corporate_vouchers (
    voucher_code,
    passport_id,
    passport_number,
    company_name,
    quantity,
    amount,
    payment_method,
    used_at,
    valid_from,
    valid_until,
    created_by
  )
  SELECT
    'CORP-VALID-123',
    p.id,
    'P1234567',
    'Pacific Airlines Ltd',
    10,
    1500.00,
    'BANK TRANSFER',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '30 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'P1234567'
  UNION ALL
  SELECT
    'CORP-USED-456',
    p.id,
    'A9876543',
    'Global Mining Corp',
    25,
    3750.00,
    'BANK TRANSFER',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '60 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'A9876543'
  UNION ALL
  SELECT
    'CORP-EXPIRED-789',
    p.id,
    'G2468135',
    'Tourism PNG',
    15,
    2250.00,
    'BANK TRANSFER',
    NULL,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 day',
    admin_id
  FROM passports p WHERE p.passport_number = 'G2468135'
  UNION ALL
  SELECT
    'CORP-NEW-001',
    p.id,
    'N5678901',
    'Port Moresby Hotels Group',
    50,
    7500.00,
    'BANK TRANSFER',
    NULL,
    NOW(),
    NOW() + INTERVAL '90 days',
    admin_id
  FROM passports p WHERE p.passport_number = 'N5678901'
  ON CONFLICT (voucher_code) DO NOTHING;

  -- =============================================
  -- PART 4: QUOTATIONS
  -- =============================================

  INSERT INTO quotations (
    quotation_number,
    company_name,
    contact_person,
    contact_email,
    contact_phone,
    number_of_passports,
    amount_per_passport,
    total_amount,
    valid_until,
    status,
    notes,
    created_by
  )
  VALUES
    (
      'QUO-2025-001',
      'Air Niugini',
      'Sarah Johnson',
      'sarah.j@airniugini.com.pg',
      '+675 123 4567',
      100,
      150.00,
      15000.00,
      NOW() + INTERVAL '30 days',
      'pending',
      'Corporate rate for flight crew members',
      admin_id
    ),
    (
      'QUO-2025-002',
      'PNG Resources Ltd',
      'David Chen',
      'dchen@pngresources.com',
      '+675 234 5678',
      250,
      140.00,
      35000.00,
      NOW() + INTERVAL '45 days',
      'approved',
      'Mining company employee green fees - approved by finance',
      admin_id
    ),
    (
      'QUO-2025-003',
      'Coral Sea Hotels',
      'Maria Santos',
      'msantos@coralsea.pg',
      '+675 345 6789',
      50,
      150.00,
      7500.00,
      NOW() + INTERVAL '20 days',
      'pending',
      'Tourist package deal',
      admin_id
    ),
    (
      'QUO-2024-099',
      'PNG Logging Co',
      'John Smith',
      'jsmith@pnglogging.com',
      '+675 456 7890',
      75,
      150.00,
      11250.00,
      NOW() - INTERVAL '10 days',
      'expired',
      'Expired - no response from client',
      admin_id
    )
  ON CONFLICT (quotation_number) DO NOTHING;

  -- =============================================
  -- PART 5: TRANSACTIONS (for reporting)
  -- =============================================

  -- Individual purchase transactions
  INSERT INTO transactions (
    transaction_type,
    reference_id,
    amount,
    payment_method,
    passport_number,
    nationality,
    created_by,
    created_at
  )
  SELECT
    'individual',
    ip.id,
    ip.amount,
    ip.payment_method,
    ip.passport_number,
    p.nationality,
    admin_id,
    ip.created_at
  FROM individual_purchases ip
  JOIN passports p ON p.passport_number = ip.passport_number
  ON CONFLICT DO NOTHING;

  -- Corporate voucher transactions
  INSERT INTO transactions (
    transaction_type,
    reference_id,
    amount,
    payment_method,
    passport_number,
    nationality,
    created_by,
    created_at
  )
  SELECT
    'corporate',
    cv.id,
    cv.amount,
    cv.payment_method,
    cv.passport_number,
    p.nationality,
    admin_id,
    cv.created_at
  FROM corporate_vouchers cv
  JOIN passports p ON p.passport_number = cv.passport_number
  ON CONFLICT DO NOTHING;

  -- =============================================
  -- PART 6: BULK UPLOAD RECORDS
  -- =============================================

  INSERT INTO bulk_uploads (
    batch_id,
    file_name,
    total_records,
    successful_records,
    failed_records,
    status,
    error_log,
    created_by,
    created_at,
    completed_at
  )
  VALUES
    (
      'BATCH-2025-001',
      'passports_jan_2025.csv',
      100,
      98,
      2,
      'completed',
      '[{"row": 45, "error": "Invalid date format"}, {"row": 78, "error": "Duplicate passport number"}]'::jsonb,
      admin_id,
      NOW() - INTERVAL '15 days',
      NOW() - INTERVAL '15 days' + INTERVAL '2 minutes'
    ),
    (
      'BATCH-2025-002',
      'corporate_passports.csv',
      50,
      50,
      0,
      'completed',
      '[]'::jsonb,
      admin_id,
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days' + INTERVAL '1 minute'
    ),
    (
      'BATCH-2025-003',
      'tourism_batch.csv',
      25,
      20,
      5,
      'completed',
      '[{"row": 5, "error": "Invalid passport number"}, {"row": 12, "error": "Missing surname"}, {"row": 18, "error": "Invalid date"}, {"row": 20, "error": "Missing nationality"}, {"row": 23, "error": "Duplicate entry"}]'::jsonb,
      admin_id,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days' + INTERVAL '3 minutes'
    )
  ON CONFLICT (batch_id) DO NOTHING;

  RAISE NOTICE '✅ Sample data loaded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '- 8 Passports';
  RAISE NOTICE '- 3 Individual Purchases (1 unused, 2 used)';
  RAISE NOTICE '- 4 Corporate Vouchers (2 valid, 1 used, 1 expired)';
  RAISE NOTICE '- 4 Quotations (2 pending, 1 approved, 1 expired)';
  RAISE NOTICE '- 7 Transactions';
  RAISE NOTICE '- 3 Bulk Upload Records';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready to test!';
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Show all passports
SELECT
  passport_number,
  given_name || ' ' || surname as name,
  nationality,
  TO_CHAR(date_of_expiry, 'YYYY-MM-DD') as expires
FROM passports
ORDER BY created_at DESC;

-- Show voucher statistics
SELECT
  'Individual Purchases' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE used_at IS NULL) as unused,
  COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used
FROM individual_purchases
UNION ALL
SELECT
  'Corporate Vouchers' as type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE used_at IS NULL AND valid_until > NOW()) as valid_unused,
  COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used
FROM corporate_vouchers;

-- Show quotation status
SELECT
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_value
FROM quotations
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    WHEN 'expired' THEN 4
  END;

-- Show recent transactions
SELECT
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  payment_method
FROM transactions
GROUP BY transaction_type, payment_method
ORDER BY transaction_type, payment_method;
