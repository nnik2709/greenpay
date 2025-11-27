-- Fix individual_purchases table schema
-- Run this on production database via CloudPanel

-- First, check if the table exists and what it looks like
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
ORDER BY ordinal_position;

-- If passport_id column exists, remove it (since we don't need it)
-- The table should only use passport_number for linking
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'individual_purchases' AND column_name = 'passport_id'
    ) THEN
        ALTER TABLE individual_purchases DROP COLUMN passport_id;
        RAISE NOTICE 'Removed passport_id column';
    END IF;
END $$;

-- Ensure all required columns exist with correct types
DO $$
BEGIN
    -- Add any missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'status') THEN
        ALTER TABLE individual_purchases ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refunded') THEN
        ALTER TABLE individual_purchases ADD COLUMN refunded BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refund_amount') THEN
        ALTER TABLE individual_purchases ADD COLUMN refund_amount DECIMAL(10, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refund_reason') THEN
        ALTER TABLE individual_purchases ADD COLUMN refund_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refund_method') THEN
        ALTER TABLE individual_purchases ADD COLUMN refund_method TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refund_notes') THEN
        ALTER TABLE individual_purchases ADD COLUMN refund_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_purchases' AND column_name = 'refunded_at') THEN
        ALTER TABLE individual_purchases ADD COLUMN refunded_at TIMESTAMP;
    END IF;
END $$;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
ORDER BY ordinal_position;

SELECT 'Migration completed successfully!' as status;
