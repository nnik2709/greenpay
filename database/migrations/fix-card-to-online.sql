-- Fix 'Card' payment_method values to 'ONLINE'
-- Date: January 25, 2026
-- Issue: Existing records have 'Card' but should be 'ONLINE' for online gateway payments

-- Current state shows:
-- Card: 50 records (51%) - These are from online gateways (DOKU, BSP)
-- CASH: 45 records (46%) - These are correct
-- POS: 3 records (3%) - These are correct

-- Update 'Card' to 'ONLINE' for online payment gateway records
-- Only update if payment_mode indicates online gateway (BSP, DOKU, IPG, Online)
UPDATE individual_purchases
SET payment_method = 'ONLINE'
WHERE payment_method = 'Card'
  AND (
    payment_mode ILIKE '%bsp%'
    OR payment_mode ILIKE '%doku%'
    OR payment_mode ILIKE '%ipg%'
    OR payment_mode ILIKE '%online%'
    OR payment_mode ILIKE '%gateway%'
  );

-- Show summary after update
SELECT
  payment_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM individual_purchases
GROUP BY payment_method
ORDER BY count DESC;

-- Check if any 'Card' values remain (should be 0 if all were online gateways)
SELECT
  COUNT(*) as remaining_card_records,
  'Card records that were not updated (may be legitimate POS card payments)' as note
FROM individual_purchases
WHERE payment_method = 'Card';
