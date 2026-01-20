-- Migration: Add batch tracking fields to individual_purchases table
-- Purpose: Support batch voucher purchases (1-5 vouchers in single transaction)
-- Date: 2026-01-19

-- Add batch_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'individual_purchases' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE individual_purchases
    ADD COLUMN batch_id VARCHAR(50);

    CREATE INDEX IF NOT EXISTS idx_individual_purchases_batch_id
    ON individual_purchases(batch_id)
    WHERE batch_id IS NOT NULL;

    RAISE NOTICE 'Added batch_id column to individual_purchases table';
  ELSE
    RAISE NOTICE 'batch_id column already exists in individual_purchases table';
  END IF;
END $$;

-- Add created_by column if it doesn't exist (for tracking which user created the voucher)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'individual_purchases' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE individual_purchases
    ADD COLUMN created_by INTEGER;

    -- Add foreign key to User table if needed
    -- ALTER TABLE individual_purchases
    -- ADD CONSTRAINT fk_individual_purchases_created_by
    -- FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_individual_purchases_created_by
    ON individual_purchases(created_by);

    RAISE NOTICE 'Added created_by column to individual_purchases table';
  ELSE
    RAISE NOTICE 'created_by column already exists in individual_purchases table';
  END IF;
END $$;

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Verifying columns...';

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'individual_purchases' AND column_name = 'batch_id'
  ) THEN
    RAISE NOTICE '✓ batch_id column exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'individual_purchases' AND column_name = 'created_by'
  ) THEN
    RAISE NOTICE '✓ created_by column exists';
  END IF;
END $$;
