-- Migration 004: Fix Quotations Table - Add Missing Columns
-- Date: 2025-12-19
-- Issue: Missing company_name column
-- Run as: postgres superuser

-- =====================================================
-- CHECK CURRENT QUOTATIONS SCHEMA
-- =====================================================
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- =====================================================
-- ADD MISSING COLUMNS IF NEEDED
-- =====================================================
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS quotation_number TEXT;

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2);

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================
-- Set default values for existing records if needed
UPDATE quotations
SET company_name = 'Unknown Company'
WHERE company_name IS NULL;

UPDATE quotations
SET status = 'draft'
WHERE status IS NULL;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'quotations'
ORDER BY ordinal_position;

-- Show sample data
SELECT
    id,
    quotation_number,
    company_name,
    total_amount,
    status,
    created_at
FROM quotations
ORDER BY created_at DESC
LIMIT 5;
