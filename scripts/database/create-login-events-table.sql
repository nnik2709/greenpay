-- Create login_events table for tracking user login activity
CREATE TABLE IF NOT EXISTS login_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  event_type TEXT DEFAULT 'login' CHECK (event_type IN ('login', 'logout', 'failed_login')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON login_events(created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON login_events(email);

-- Enable RLS (Row Level Security)
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own login events
CREATE POLICY "Users can view their own login events" ON login_events
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all login events
CREATE POLICY "Admins can view all login events" ON login_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- Create policy to allow system to insert login events
CREATE POLICY "System can insert login events" ON login_events
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON login_events TO authenticated;
GRANT USAGE ON SEQUENCE login_events_id_seq TO authenticated;



