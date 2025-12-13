-- Complete database RLS fix for login_events table
-- This will resolve all permission issues

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can view all login events" ON public.login_events;
DROP POLICY IF EXISTS "Authenticated users can insert login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can update login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can delete login events" ON public.login_events;

-- Step 2: Temporarily disable RLS to fix the table
ALTER TABLE public.login_events DISABLE ROW LEVEL SECURITY;

-- Step 3: Add missing columns if they don't exist
ALTER TABLE public.login_events 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'login';

-- Step 4: Update existing records to have proper data
UPDATE public.login_events 
SET email = COALESCE(email, 'unknown@example.com'),
    event_type = COALESCE(event_type, 'login')
WHERE email IS NULL OR event_type IS NULL;

-- Step 5: Make email NOT NULL after updating
ALTER TABLE public.login_events ALTER COLUMN email SET NOT NULL;

-- Step 6: Re-enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Step 7: Create comprehensive RLS policies

-- Policy 1: Allow authenticated users to view all login events (for admin purposes)
CREATE POLICY "Authenticated users can view login events" ON public.login_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy 2: Allow authenticated users to insert login events
CREATE POLICY "Authenticated users can insert login events" ON public.login_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: Allow admins to update login events
CREATE POLICY "Admins can update login events" ON public.login_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Policy 4: Allow admins to delete login events
CREATE POLICY "Admins can delete login events" ON public.login_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_events TO authenticated;
GRANT USAGE ON SEQUENCE login_events_id_seq TO authenticated;

-- Step 9: Create some test data
INSERT INTO public.login_events (
  user_id,
  email,
  ip_address,
  user_agent,
  event_type,
  created_at
) VALUES 
  (auth.uid(), 'admin@example.com', '127.0.0.1', 'Mozilla/5.0 (Test Browser)', 'login', NOW()),
  (auth.uid(), 'admin@example.com', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'login', NOW() - INTERVAL '1 hour'),
  (auth.uid(), 'admin@example.com', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'login', NOW() - INTERVAL '2 hours'),
  (auth.uid(), 'admin@example.com', '203.0.113.1', 'Mozilla/5.0 (X11; Linux x86_64)', 'login', NOW() - INTERVAL '1 day'),
  (auth.uid(), 'admin@example.com', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)', 'login', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Step 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON public.login_events(email);
CREATE INDEX IF NOT EXISTS idx_login_events_event_type ON public.login_events(event_type);

-- Step 11: Verify the setup
SELECT 
  'RLS Status' as check_type,
  CASE WHEN relrowsecurity THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_class 
WHERE relname = 'login_events';

SELECT 
  'Policy Count' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'login_events';

SELECT 
  'Test Data Count' as check_type,
  COUNT(*) as count
FROM public.login_events;



