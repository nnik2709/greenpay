-- Migration: Create customers table for PNG tax invoice compliance
-- Customers store all required fields for PNG GST Tax Invoices

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),

  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Address (Required for PNG Tax Invoices)
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Papua New Guinea',

  -- Tax Information (PNG IRC)
  tin VARCHAR(50), -- Tax Identification Number from PNG IRC
  is_gst_registered BOOLEAN DEFAULT FALSE,

  -- Additional Details
  contact_person VARCHAR(255),
  notes TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active',

  -- Audit Fields
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT status_check CHECK (status IN ('active', 'inactive'))
);

-- Indexes for performance
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tin ON customers(tin);
CREATE INDEX idx_customers_status ON customers(status);

-- Full text search index
CREATE INDEX idx_customers_search ON customers USING gin(
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(company_name, '') || ' ' ||
    COALESCE(email, '')
  )
);

-- Comments for documentation
COMMENT ON TABLE customers IS 'Customer records for PNG GST-compliant invoicing';
COMMENT ON COLUMN customers.name IS 'Customer full name (individual or business)';
COMMENT ON COLUMN customers.tin IS 'Tax Identification Number from PNG Internal Revenue Commission';
COMMENT ON COLUMN customers.is_gst_registered IS 'Whether customer is registered for GST in PNG';
COMMENT ON COLUMN customers.address_line1 IS 'Primary address - required for PNG Tax Invoices';

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at();
