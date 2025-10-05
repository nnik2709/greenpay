-- Safe update script for settings table
-- Only creates if doesn't exist, won't error if already present

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON settings;

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_validity_days INTEGER NOT NULL DEFAULT 30,
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings only if table is empty
INSERT INTO settings (voucher_validity_days, default_amount)
SELECT 30, 50.00
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update settings"
  ON settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );

-- Verify settings
SELECT * FROM settings;
