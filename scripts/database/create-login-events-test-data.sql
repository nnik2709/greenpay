-- Create test data for login_events table
-- This will populate the table with sample data for testing

-- First, ensure we have a test user profile
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
) ON CONFLICT (id) DO NOTHING;

-- Create sample login events with proper data
INSERT INTO login_events (
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

-- Verify the data was inserted
SELECT 
  'Sample Data Created' as status,
  COUNT(*) as login_events_count
FROM login_events;



