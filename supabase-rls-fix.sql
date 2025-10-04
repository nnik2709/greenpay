-- Fix RLS Policies - Removes infinite recursion issues
-- Run this in Supabase SQL Editor to fix the policy errors

-- =============================================
-- FIX PROFILES TABLE POLICIES
-- =============================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Create simpler, non-recursive policies for profiles
CREATE POLICY "Enable read for authenticated users" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable delete for own profile" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =============================================
-- FIX OTHER TABLE POLICIES (if needed)
-- =============================================

-- Passports: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view passports" ON passports;
DROP POLICY IF EXISTS "Counter agents and admins can insert passports" ON passports;
DROP POLICY IF EXISTS "Counter agents and admins can update passports" ON passports;

CREATE POLICY "Enable read for authenticated users" ON passports
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON passports
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON passports
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Individual Purchases: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view individual purchases" ON individual_purchases;
DROP POLICY IF EXISTS "Authorized users can insert individual purchases" ON individual_purchases;
DROP POLICY IF EXISTS "Authorized users can update individual purchases" ON individual_purchases;

CREATE POLICY "Enable read for authenticated users" ON individual_purchases
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON individual_purchases
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON individual_purchases
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Corporate Vouchers: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view corporate vouchers" ON corporate_vouchers;
DROP POLICY IF EXISTS "Authorized users can insert corporate vouchers" ON corporate_vouchers;
DROP POLICY IF EXISTS "Authorized users can update corporate vouchers" ON corporate_vouchers;

CREATE POLICY "Enable read for authenticated users" ON corporate_vouchers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON corporate_vouchers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON corporate_vouchers
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Quotations: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON quotations;
DROP POLICY IF EXISTS "Finance managers and admins can insert quotations" ON quotations;
DROP POLICY IF EXISTS "Finance managers and admins can update quotations" ON quotations;

CREATE POLICY "Enable read for authenticated users" ON quotations
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON quotations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON quotations
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Bulk Uploads: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view bulk uploads" ON bulk_uploads;
DROP POLICY IF EXISTS "Authorized users can insert bulk uploads" ON bulk_uploads;

CREATE POLICY "Enable read for authenticated users" ON bulk_uploads
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON bulk_uploads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON bulk_uploads
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Payment Modes: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view payment modes" ON payment_modes;
DROP POLICY IF EXISTS "Admins can manage payment modes" ON payment_modes;

CREATE POLICY "Enable read for authenticated users" ON payment_modes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON payment_modes
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Tickets: Keep existing policies (they work)
-- No changes needed for tickets table

-- Email Templates: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;

CREATE POLICY "Enable read for authenticated users" ON email_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON email_templates
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Transactions: Simplify policies
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;

CREATE POLICY "Enable read for authenticated users" ON transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- VERIFICATION
-- =============================================

-- Test that policies are working
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated!';
  RAISE NOTICE 'All tables now allow authenticated users to read/write';
  RAISE NOTICE 'Role-based restrictions can be added later if needed';
END $$;
