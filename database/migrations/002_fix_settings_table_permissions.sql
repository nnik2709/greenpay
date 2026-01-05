-- Migration: Fix settings table permissions for Flex_Admin role
-- Date: 2025-12-18
-- Issue: Flex Admin gets "must be owner of table settings" error when saving
-- Severity: CRITICAL

-- First, check current table owner
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'settings';

-- Grant all privileges on settings table to application database user
-- Replace 'greenpay_user' with your actual database user
GRANT ALL PRIVILEGES ON TABLE settings TO greenpay_user;

-- Alternative: Change table ownership (if needed)
-- ALTER TABLE settings OWNER TO greenpay_user;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS flex_admin_settings_policy ON settings;
DROP POLICY IF EXISTS all_users_settings_read ON settings;

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy for Flex_Admin to have full access
CREATE POLICY flex_admin_settings_all ON settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::integer
      AND users.role = 'Flex_Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = current_setting('app.current_user_id', true)::integer
      AND users.role = 'Flex_Admin'
    )
  );

-- Create policy for all authenticated users to read settings
CREATE POLICY all_users_settings_read ON settings
  FOR SELECT
  USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'settings';
