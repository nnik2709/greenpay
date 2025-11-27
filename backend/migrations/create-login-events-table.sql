-- Create login_events table to track user login history
-- Run this SQL on the production database

CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success' or 'failed'
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key to User table
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES "User" (id)
    ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_login_time ON login_events(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON login_events(email);

-- Add comment to table
COMMENT ON TABLE login_events IS 'Tracks user login history including successful and failed attempts';
