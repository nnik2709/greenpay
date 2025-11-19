-- Create email_logs table for tracking email activities
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  batch_id TEXT,
  company_name TEXT,
  voucher_count INTEGER,
  total_amount DECIMAL(10,2),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_batch_id ON email_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_logs
-- Admin users can view all email logs
CREATE POLICY "Admin can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'Flex_Admin'
    )
  );

-- Finance managers can view all email logs
CREATE POLICY "Finance Manager can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'Finance_Manager'
    )
  );

-- Counter agents can view all email logs
CREATE POLICY "Counter Agent can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'Counter_Agent'
    )
  );

-- Service role can insert email logs (for Edge Functions)
CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Service role can update email logs (for Edge Functions)
CREATE POLICY "Service role can update email logs" ON email_logs
  FOR UPDATE USING (true);

-- Add comment
COMMENT ON TABLE email_logs IS 'Logs of emails sent through the system, including corporate batch emails';







