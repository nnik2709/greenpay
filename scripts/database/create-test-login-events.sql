-- Create test login events for demonstration
-- This will create some sample data to show in the login history

-- First, let's create a test user if it doesn't exist
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'testuser@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create the profile for the test user
INSERT INTO profiles (
  id,
  email,
  role,
  active,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'testuser@example.com',
  'Flex_Admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample login events
INSERT INTO login_events (
  id,
  user_id,
  ip_address,
  user_agent,
  created_at
) VALUES 
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '203.0.113.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', NOW() - INTERVAL '1 week'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)', NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO NOTHING;



