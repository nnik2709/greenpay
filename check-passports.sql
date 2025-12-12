-- Check passports table structure
\d passports

-- Check if passports table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'passports';
