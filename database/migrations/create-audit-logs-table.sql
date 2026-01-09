--
-- AUDIT LOGS TABLE
-- Records all security-relevant events for compliance and forensics
--

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,

  -- Event Classification
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),

  -- User Context
  user_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  user_email VARCHAR(254),

  -- Action Details
  action TEXT NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),

  -- Additional Context
  metadata JSONB,

  -- Network Context
  ip_address VARCHAR(45) NOT NULL,  -- IPv6 support
  user_agent TEXT,

  -- Outcome
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event ON audit_logs(user_id, event_type, created_at DESC);

-- GIN index for metadata JSON queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Table comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all security-relevant events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (login_success, payment_completed, etc.)';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: info, warning, error, critical';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context stored as JSON';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client (IPv4 or IPv6)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (voucher, passport, user, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
