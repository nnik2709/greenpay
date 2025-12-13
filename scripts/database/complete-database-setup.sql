-- Complete database setup for login history functionality
-- This will fix all database issues and create test data

-- Step 1: Create test user profile if it doesn't exist
INSERT INTO profiles (
  id,
  email,
  role,
  active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'Flex_Admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Step 2: Fix login_events table structure
-- Add missing columns if they don't exist
ALTER TABLE public.login_events 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'login';

-- Step 3: Update existing records
UPDATE public.login_events 
SET email = COALESCE(email, 'admin@example.com'),
    event_type = COALESCE(event_type, 'login')
WHERE email IS NULL OR event_type IS NULL;

-- Step 4: Make email NOT NULL after updating
ALTER TABLE public.login_events ALTER COLUMN email SET NOT NULL;

-- Step 5: Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can view all login events" ON public.login_events;
DROP POLICY IF EXISTS "Authenticated users can insert login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can update login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can delete login events" ON public.login_events;
DROP POLICY IF EXISTS "Authenticated users can view login events" ON public.login_events;

-- Step 6: Temporarily disable RLS to fix data
ALTER TABLE public.login_events DISABLE ROW LEVEL SECURITY;

-- Step 7: Create comprehensive test data
INSERT INTO public.login_events (
  id,
  user_id,
  email,
  ip_address,
  user_agent,
  event_type,
  created_at
) VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'login', NOW() - INTERVAL '30 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'login', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'login', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '203.0.113.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'login', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)', 'login', NOW() - INTERVAL '1 week'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '192.168.1.200', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', 'login', NOW() - INTERVAL '2 weeks'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin@example.com', '10.0.0.75', 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)', 'login', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Step 8: Re-enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Step 9: Create permissive RLS policies for testing
CREATE POLICY "Allow all authenticated users to view login events" ON public.login_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to insert login events" ON public.login_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to update login events" ON public.login_events
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users to delete login events" ON public.login_events
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Step 10: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_events TO authenticated;
GRANT USAGE ON SEQUENCE login_events_id_seq TO authenticated;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON public.login_events(email);
CREATE INDEX IF NOT EXISTS idx_login_events_event_type ON public.login_events(event_type);

-- Step 12: Verify the setup
SELECT 
  'Setup Complete' as status,
  (SELECT COUNT(*) FROM profiles WHERE email = 'admin@example.com') as admin_profile_count,
  (SELECT COUNT(*) FROM login_events) as login_events_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'login_events') as policy_count;



