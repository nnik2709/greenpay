-- Fix NULL payment_method values in individual_purchases table
-- This fixes records created by DOKU webhook that didn't include payment_method
-- Date: January 25, 2026
-- Issue: payment-webhook-doku.js was inserting records without payment_method column

-- Valid payment methods: CASH, POS, ONLINE, BANK TRANSFER
-- CASH = Agent desk cash payment
-- POS = Agent desk card payment
-- ONLINE = Customer online payment (buy-online, DOKU, BSP)
-- BANK TRANSFER = Invoice bank transfer payment

-- Update records where payment_method is NULL
-- Map from payment_mode to appropriate payment_method
UPDATE individual_purchases
SET payment_method = CASE
  -- Online payment gateways -> ONLINE
  WHEN payment_mode ILIKE '%doku%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%bsp%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%ipg%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%online%' THEN 'ONLINE'
  WHEN payment_mode ILIKE '%gateway%' THEN 'ONLINE'

  -- Cash payments -> CASH
  WHEN payment_mode ILIKE '%cash%' THEN 'CASH'

  -- POS/Card at desk -> POS
  WHEN payment_mode ILIKE '%pos%' THEN 'POS'
  WHEN payment_mode ILIKE '%eftpos%' THEN 'POS'

  -- Bank transfer -> BANK TRANSFER
  WHEN payment_mode ILIKE '%bank%' THEN 'BANK TRANSFER'
  WHEN payment_mode ILIKE '%transfer%' THEN 'BANK TRANSFER'

  -- Default to ONLINE for any other case (most payments are online via gateways)
  ELSE 'ONLINE'
END
WHERE payment_method IS NULL;

-- Report how many records were updated
-- (This is informational, will show in psql output)
SELECT
  COUNT(*) as total_fixed_records,
  'Records updated with payment_method' as description
FROM individual_purchases
WHERE payment_method IS NOT NULL
  AND created_at >= NOW() - INTERVAL '1 minute';

-- Show summary of payment methods after fix
SELECT
  payment_method,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM individual_purchases
GROUP BY payment_method
ORDER BY count DESC;
