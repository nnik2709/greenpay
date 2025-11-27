#!/bin/bash

# Create login_events table on production database
# Run this script in another terminal

echo "Creating login_events table on production database..."

ssh root@72.61.208.79 << 'EOF'
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db << 'SQL'

-- Create login_events table to track user login history
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key to User table (allow NULL for failed logins where user doesn't exist)
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES "User" (id)
    ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_login_time ON login_events(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON login_events(email);

-- Add comment to table
COMMENT ON TABLE login_events IS 'Tracks user login history including successful and failed attempts';

-- Verify table was created
\dt login_events
\d login_events

SQL

echo ""
echo "✅ login_events table created successfully!"
echo ""

EOF
