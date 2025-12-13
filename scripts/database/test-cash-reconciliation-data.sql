-- Test Data for Cash Reconciliation
-- Run this in your Supabase SQL Editor to create test transactions

-- First, create individual purchase records (these generate vouchers)
-- We'll create 4 cash purchases and 2 card purchases

DO $$
DECLARE
  v_user_id UUID;
  v_purchase_id_1 UUID := gen_random_uuid();
  v_purchase_id_2 UUID := gen_random_uuid();
  v_purchase_id_3 UUID := gen_random_uuid();
  v_purchase_id_4 UUID := gen_random_uuid();
  v_purchase_id_5 UUID := gen_random_uuid();
  v_purchase_id_6 UUID := gen_random_uuid();
BEGIN
  -- Get a user ID (first profile in the system)
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  -- Insert individual purchases (cash transactions)
  INSERT INTO individual_purchases (
    id, passport_number, voucher_code, qr_code, amount,
    payment_method, nationality, validity_days, status, created_by
  ) VALUES
    (v_purchase_id_1, 'P12345678', 'CASH-001', 'QR-001', 50.00, 'cash', 'Papua New Guinea', 30, 'active', v_user_id),
    (v_purchase_id_2, 'P23456789', 'CASH-002', 'QR-002', 75.00, 'cash', 'Australia', 30, 'active', v_user_id),
    (v_purchase_id_3, 'P34567890', 'CASH-003', 'QR-003', 100.00, 'cash', 'New Zealand', 30, 'active', v_user_id),
    (v_purchase_id_4, 'P45678901', 'CASH-004', 'QR-004', 50.00, 'cash', 'Papua New Guinea', 30, 'active', v_user_id),

    -- Card transactions
    (v_purchase_id_5, 'P56789012', 'CARD-001', 'QR-005', 150.00, 'card', 'United States', 30, 'active', v_user_id),
    (v_purchase_id_6, 'P67890123', 'CARD-002', 'QR-006', 200.00, 'card', 'United Kingdom', 30, 'active', v_user_id);

  -- Now insert corresponding transaction records
  INSERT INTO transactions (
    id, transaction_type, reference_id, amount,
    payment_method, passport_number, nationality, created_by
  ) VALUES
    -- Cash transactions (will appear in reconciliation)
    (gen_random_uuid(), 'individual', v_purchase_id_1, 50.00, 'cash', 'P12345678', 'Papua New Guinea', v_user_id),
    (gen_random_uuid(), 'individual', v_purchase_id_2, 75.00, 'cash', 'P23456789', 'Australia', v_user_id),
    (gen_random_uuid(), 'individual', v_purchase_id_3, 100.00, 'cash', 'P34567890', 'New Zealand', v_user_id),
    (gen_random_uuid(), 'individual', v_purchase_id_4, 50.00, 'cash', 'P45678901', 'Papua New Guinea', v_user_id),

    -- Card transactions (won't appear in cash reconciliation)
    (gen_random_uuid(), 'individual', v_purchase_id_5, 150.00, 'card', 'P56789012', 'United States', v_user_id),
    (gen_random_uuid(), 'individual', v_purchase_id_6, 200.00, 'card', 'P67890123', 'United Kingdom', v_user_id);

END $$;

-- Verify the data was inserted
SELECT
  payment_method,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM transactions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY payment_method
ORDER BY payment_method;

-- Expected results:
-- cash: 4 transactions = PGK 275.00
-- card: 2 transactions = PGK 350.00
--
-- For Cash Reconciliation:
-- Opening Float: 100.00
-- Expected Cash: 375.00 (100 + 275)
-- Count exactly 375 in denominations for zero variance!
