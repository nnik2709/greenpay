-- Create RPC functions for login history and user management
-- This will solve the RLS policy issues by using stored procedures

-- Function to get login history (supports filtering by user_id)
CREATE OR REPLACE FUNCTION get_login_history(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_time TIMESTAMPTZ,
  event_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user has permission to view login history
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Flex_Admin', 'IT_Support')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view login history';
  END IF;

  -- Return login events
  RETURN QUERY
  SELECT 
    le.id,
    le.user_id,
    le.email as user_email,
    le.ip_address,
    le.user_agent,
    le.created_at as login_time,
    le.event_type
  FROM login_events le
  WHERE (p_user_id IS NULL OR le.user_id = p_user_id)
  ORDER BY le.created_at DESC
  LIMIT 1000;
END;
$$;

-- Function to get all users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user has permission to view users
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Flex_Admin', 'IT_Support')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view users';
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.full_name, '') as full_name,
    p.role,
    p.active,
    p.created_at,
    p.updated_at
  FROM profiles p
  ORDER BY p.email;
END;
$$;

-- Function to get user profile
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Use provided user_id or current user's id
  target_user_id := COALESCE(p_user_id, auth.uid());

  -- Check if user can view this profile
  IF target_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Flex_Admin', 'IT_Support')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view this profile';
  END IF;

  -- Return user profile
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.full_name, '') as full_name,
    p.role,
    p.active,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user can update this profile
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Flex_Admin', 'IT_Support')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to update this profile';
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    full_name = COALESCE(p_full_name, full_name),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role),
    active = COALESCE(p_active, active),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to get system settings
CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE (
  id UUID,
  voucher_validity_days INTEGER,
  default_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Return settings
  RETURN QUERY
  SELECT 
    s.id,
    s.voucher_validity_days,
    s.default_amount,
    s.created_at,
    s.updated_at
  FROM settings s
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to update system settings
CREATE OR REPLACE FUNCTION update_system_settings(
  p_voucher_validity_days INTEGER DEFAULT NULL,
  p_default_amount DECIMAL(10,2) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user has admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'Flex_Admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to update settings';
  END IF;

  -- Update settings
  UPDATE settings 
  SET 
    voucher_validity_days = COALESCE(p_voucher_validity_days, voucher_validity_days),
    default_amount = COALESCE(p_default_amount, default_amount),
    updated_at = NOW()
  WHERE id = (SELECT id FROM settings ORDER BY created_at DESC LIMIT 1);

  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_login_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_system_settings(INTEGER, DECIMAL) TO authenticated;

