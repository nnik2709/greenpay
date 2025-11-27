-- Run this to see the actual schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
ORDER BY ordinal_position;
