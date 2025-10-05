-- Settings table for system-wide configurations
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_validity_days INTEGER NOT NULL DEFAULT 30,
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (voucher_validity_days, default_amount)
VALUES (30, 50.00)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read settings
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update settings"
  ON settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );
