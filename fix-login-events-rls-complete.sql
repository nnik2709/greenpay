-- Complete fix for login_events RLS policies
-- This will allow proper access to login_events table

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can view all login events" ON public.login_events;
DROP POLICY IF EXISTS "Authenticated users can insert login events" ON public.login_events;

-- Create comprehensive policies for login_events table

-- Policy 1: Allow users to view their own login events
CREATE POLICY "Users can view own login events" ON public.login_events
  FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Allow admins and IT support to view all login events
CREATE POLICY "Admins can view all login events" ON public.login_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Policy 3: Allow any authenticated user to insert login events (for login tracking)
CREATE POLICY "Authenticated users can insert login events" ON public.login_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 4: Allow admins to update login events (for management purposes)
CREATE POLICY "Admins can update login events" ON public.login_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Policy 5: Allow admins to delete login events (for cleanup purposes)
CREATE POLICY "Admins can delete login events" ON public.login_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_events TO authenticated;
GRANT USAGE ON SEQUENCE login_events_id_seq TO authenticated;

-- Create a test login event to verify the setup works
INSERT INTO public.login_events (
  user_id,
  ip_address,
  user_agent,
  created_at
) VALUES (
  auth.uid(),
  '127.0.0.1',
  'Test Browser',
  NOW()
) ON CONFLICT DO NOTHING;



