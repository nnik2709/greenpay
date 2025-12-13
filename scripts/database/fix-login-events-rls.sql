-- Fix RLS policies for login_events table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own login events" ON public.login_events;
DROP POLICY IF EXISTS "Admins can view all login events" ON public.login_events;

-- Create new policies
CREATE POLICY "Users can view own login events" ON public.login_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all login events" ON public.login_events
  FOR SELECT USING (
    EXISTS (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('Flex_Admin','IT_Support'))
  );

-- Allow system to insert login events (for authenticated users)
CREATE POLICY "Authenticated users can insert login events" ON public.login_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);



