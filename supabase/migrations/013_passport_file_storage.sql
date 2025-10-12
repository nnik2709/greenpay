-- Migration: Add File Storage Fields to Passports
-- Date: October 11, 2025
-- Purpose: Support photo and signature uploads for passports

-- Add photo and signature paths to passports table
ALTER TABLE passports ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS signature_path TEXT;

-- Add storage bucket paths as comments
COMMENT ON COLUMN passports.photo_path IS 'Path to passport photo in Supabase Storage (bucket: passport-photos)';
COMMENT ON COLUMN passports.signature_path IS 'Path to passport signature in Supabase Storage (bucket: passport-signatures)';

-- Create storage buckets via Supabase Dashboard or SQL
-- Note: Storage buckets are created via Supabase Dashboard UI or Storage API
-- Bucket names: 
--   - passport-photos (public bucket, max 2MB per file)
--   - passport-signatures (public bucket, max 1MB per file)

-- Add index for file path queries (if needed)
CREATE INDEX IF NOT EXISTS idx_passports_photo ON passports(photo_path) WHERE photo_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_passports_signature ON passports(signature_path) WHERE signature_path IS NOT NULL;

-- RLS policies for storage remain at storage bucket level
-- No additional table policies needed


