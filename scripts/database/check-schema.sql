-- Check the actual structure of corporate_vouchers table
\d corporate_vouchers

-- Check profiles table structure (especially id column type)
\d profiles

-- Show all columns in corporate_vouchers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'corporate_vouchers'
ORDER BY ordinal_position;
