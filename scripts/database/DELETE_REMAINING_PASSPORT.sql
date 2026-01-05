-- Delete the remaining passport record

-- First, check what passport remains
SELECT id, passport_number, nationality, surname, given_name, created_at
FROM passports;

-- Delete all remaining passports
DELETE FROM passports;

-- Verify it's deleted
SELECT COUNT(*) as remaining_passports FROM passports;

