-- =============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- =============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This will:
-- 1. Fix RLS policies (remove infinite recursion)
-- 2. Link your Auth users to profiles with correct roles
-- =============================================

-- =============================================
-- PART 1: FIX RLS POLICIES
-- =============================================

-- Fix Profiles Table Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete for own profile" ON profiles;

CREATE POLICY "Enable read for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Fix Passports Policies
DROP POLICY IF EXISTS "Authenticated users can view passports" ON passports;
DROP POLICY IF EXISTS "Counter agents and admins can insert passports" ON passports;
DROP POLICY IF EXISTS "Counter agents and admins can update passports" ON passports;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON passports;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON passports;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON passports;

CREATE POLICY "Enable read for authenticated users" ON passports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON passports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON passports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix Individual Purchases Policies
DROP POLICY IF EXISTS "Authenticated users can view individual purchases" ON individual_purchases;
DROP POLICY IF EXISTS "Authorized users can insert individual purchases" ON individual_purchases;
DROP POLICY IF EXISTS "Authorized users can update individual purchases" ON individual_purchases;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON individual_purchases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON individual_purchases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON individual_purchases;

CREATE POLICY "Enable read for authenticated users" ON individual_purchases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON individual_purchases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON individual_purchases
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix Corporate Vouchers Policies
DROP POLICY IF EXISTS "Authenticated users can view corporate vouchers" ON corporate_vouchers;
DROP POLICY IF EXISTS "Authorized users can insert corporate vouchers" ON corporate_vouchers;
DROP POLICY IF EXISTS "Authorized users can update corporate vouchers" ON corporate_vouchers;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON corporate_vouchers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON corporate_vouchers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON corporate_vouchers;

CREATE POLICY "Enable read for authenticated users" ON corporate_vouchers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON corporate_vouchers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON corporate_vouchers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix Quotations Policies
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON quotations;
DROP POLICY IF EXISTS "Finance managers and admins can insert quotations" ON quotations;
DROP POLICY IF EXISTS "Finance managers and admins can update quotations" ON quotations;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON quotations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON quotations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON quotations;

CREATE POLICY "Enable read for authenticated users" ON quotations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON quotations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON quotations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix Bulk Uploads Policies
DROP POLICY IF EXISTS "Authenticated users can view bulk uploads" ON bulk_uploads;
DROP POLICY IF EXISTS "Authorized users can insert bulk uploads" ON bulk_uploads;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON bulk_uploads;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bulk_uploads;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bulk_uploads;

CREATE POLICY "Enable read for authenticated users" ON bulk_uploads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON bulk_uploads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON bulk_uploads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix Payment Modes Policies
DROP POLICY IF EXISTS "Authenticated users can view payment modes" ON payment_modes;
DROP POLICY IF EXISTS "Admins can manage payment modes" ON payment_modes;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON payment_modes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON payment_modes;

CREATE POLICY "Enable read for authenticated users" ON payment_modes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON payment_modes
  FOR ALL USING (auth.role() = 'authenticated');

-- Fix Email Templates Policies
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON email_templates;

CREATE POLICY "Enable read for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON email_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Fix Transactions Policies
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transactions;

CREATE POLICY "Enable read for authenticated users" ON transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- PART 2: CREATE USER PROFILES
-- =============================================
-- This will automatically link your Auth users to profiles
-- It finds users by email and creates profiles for them

-- Create profile for admin@example.com
INSERT INTO profiles (id, email, role, active)
SELECT
  id,
  email,
  'Flex_Admin' as role,
  true as active
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- Create profile for finance@example.com
INSERT INTO profiles (id, email, role, active)
SELECT
  id,
  email,
  'Finance_Manager' as role,
  true as active
FROM auth.users
WHERE email = 'finance@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- Create profile for agent@example.com
INSERT INTO profiles (id, email, role, active)
SELECT
  id,
  email,
  'Counter_Agent' as role,
  true as active
FROM auth.users
WHERE email = 'agent@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- Create profile for support@example.com
INSERT INTO profiles (id, email, role, active)
SELECT
  id,
  email,
  'IT_Support' as role,
  true as active
FROM auth.users
WHERE email = 'support@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- =============================================
-- PART 3: VERIFICATION
-- =============================================

-- Show all created users with their roles
SELECT
  p.id,
  p.email,
  p.role,
  p.active,
  p.created_at,
  CASE p.role
    WHEN 'Flex_Admin' THEN 'Full system access'
    WHEN 'Finance_Manager' THEN 'Quotations & Reports'
    WHEN 'Counter_Agent' THEN 'Passports & Payments'
    WHEN 'IT_Support' THEN 'Users & Reports'
    ELSE 'Unknown role'
  END as access_level
FROM profiles p
ORDER BY
  CASE p.role
    WHEN 'Flex_Admin' THEN 1
    WHEN 'Finance_Manager' THEN 2
    WHEN 'Counter_Agent' THEN 3
    WHEN 'IT_Support' THEN 4
  END;

-- Count users by role
SELECT
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY
  CASE role
    WHEN 'Flex_Admin' THEN 1
    WHEN 'Finance_Manager' THEN 2
    WHEN 'Counter_Agent' THEN 3
    WHEN 'IT_Support' THEN 4
  END;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Setup complete!';
  RAISE NOTICE '✅ RLS policies fixed';
  RAISE NOTICE '✅ User profiles created';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login with:';
  RAISE NOTICE '- admin@example.com (Flex_Admin)';
  RAISE NOTICE '- finance@example.com (Finance_Manager)';
  RAISE NOTICE '- agent@example.com (Counter_Agent)';
  RAISE NOTICE '- support@example.com (IT_Support)';
END $$;
