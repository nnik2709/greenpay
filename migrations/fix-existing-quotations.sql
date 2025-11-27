-- Fix existing quotations to show correct number of vouchers at PGK 50 each
-- This updates quotations that were already migrated but have incorrect values

UPDATE quotations
SET
  unit_price = 50.00,
  number_of_vouchers = GREATEST(1, ROUND(subtotal / 50.00)::INTEGER),
  line_total = GREATEST(1, ROUND(subtotal / 50.00)::INTEGER) * 50.00,
  discount_percentage = CASE
    WHEN ROUND(subtotal / 50.00)::INTEGER * 50.00 > subtotal
    THEN ROUND(((ROUND(subtotal / 50.00)::INTEGER * 50.00 - subtotal) / (ROUND(subtotal / 50.00)::INTEGER * 50.00) * 100)::NUMERIC, 2)
    ELSE 0
  END,
  discount_amount = CASE
    WHEN ROUND(subtotal / 50.00)::INTEGER * 50.00 > subtotal
    THEN ROUND(subtotal / 50.00)::INTEGER * 50.00 - subtotal
    ELSE 0
  END
WHERE unit_price != 50.00 OR number_of_vouchers = 1 AND subtotal > 50;

-- Show the results
SELECT
  quotation_number,
  customer_name,
  number_of_vouchers,
  unit_price,
  line_total,
  discount_amount,
  subtotal,
  total_amount
FROM quotations
ORDER BY created_at DESC;
