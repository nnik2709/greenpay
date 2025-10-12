-- PNG Green Fees System - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- NOTE: UUID extensions are handled by migrations/000_extensions.sql

-- =============================================
-- PROFILES TABLE (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Flex_Admin', 'Counter_Agent', 'Finance_Manager', 'IT_Support')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'IT_Support')
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'IT_Support')
    )
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'IT_Support')
    )
  );

-- =============================================
-- PASSPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS passports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_number TEXT UNIQUE NOT NULL,
  nationality TEXT NOT NULL,
  surname TEXT NOT NULL,
  given_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')),
  date_of_expiry DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view passports" ON passports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Counter agents and admins can insert passports" ON passports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent')
    )
  );

CREATE POLICY "Counter agents and admins can update passports" ON passports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent')
    )
  );

CREATE INDEX idx_passports_number ON passports(passport_number);
CREATE INDEX idx_passports_surname ON passports(surname);

-- =============================================
-- INDIVIDUAL PURCHASES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS individual_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_code TEXT UNIQUE NOT NULL,
  passport_id UUID REFERENCES passports(id),
  passport_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  card_last_four TEXT,
  used_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE individual_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view individual purchases" ON individual_purchases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert individual purchases" ON individual_purchases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent')
    )
  );

CREATE POLICY "Authorized users can update individual purchases" ON individual_purchases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent', 'Finance_Manager')
    )
  );

CREATE INDEX idx_individual_purchases_voucher ON individual_purchases(voucher_code);
CREATE INDEX idx_individual_purchases_passport ON individual_purchases(passport_number);
CREATE INDEX idx_individual_purchases_created_at ON individual_purchases(created_at);

-- =============================================
-- CORPORATE VOUCHERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS corporate_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_code TEXT UNIQUE NOT NULL,
  passport_id UUID REFERENCES passports(id),
  passport_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE corporate_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view corporate vouchers" ON corporate_vouchers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert corporate vouchers" ON corporate_vouchers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent', 'Finance_Manager')
    )
  );

CREATE POLICY "Authorized users can update corporate vouchers" ON corporate_vouchers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent', 'Finance_Manager')
    )
  );

CREATE INDEX idx_corporate_vouchers_code ON corporate_vouchers(voucher_code);
CREATE INDEX idx_corporate_vouchers_company ON corporate_vouchers(company_name);
CREATE INDEX idx_corporate_vouchers_created_at ON corporate_vouchers(created_at);

-- =============================================
-- QUOTATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  number_of_passports INTEGER NOT NULL,
  amount_per_passport DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quotations" ON quotations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Finance managers and admins can insert quotations" ON quotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Finance_Manager')
    )
  );

CREATE POLICY "Finance managers and admins can update quotations" ON quotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Finance_Manager')
    )
  );

CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_company ON quotations(company_name);
CREATE INDEX idx_quotations_status ON quotations(status);

-- =============================================
-- BULK UPLOADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bulk_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_log JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE bulk_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bulk uploads" ON bulk_uploads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert bulk uploads" ON bulk_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'Counter_Agent')
    )
  );

CREATE INDEX idx_bulk_uploads_batch ON bulk_uploads(batch_id);
CREATE INDEX idx_bulk_uploads_created_at ON bulk_uploads(created_at);

-- =============================================
-- PAYMENT MODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payment_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  collect_card_details BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment modes" ON payment_modes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage payment modes" ON payment_modes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Flex_Admin'
    )
  );

-- Insert default payment modes
INSERT INTO payment_modes (name, collect_card_details, active) VALUES
  ('CASH', false, true),
  ('CREDIT CARD', true, true),
  ('DEBIT CARD', true, true),
  ('BANK TRANSFER', false, true),
  ('EFTPOS', true, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  responses JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tickets" ON tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own tickets" ON tickets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins and IT support can update all tickets" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'IT_Support')
    )
  );

CREATE POLICY "Admins can delete tickets" ON tickets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Flex_Admin'
    )
  );

CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);

-- =============================================
-- EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view email templates" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Flex_Admin'
    )
  );

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, variables) VALUES
  ('voucher_confirmation', 'Green Fee Voucher Confirmation', 'Dear {name},\n\nYour green fee voucher {voucher_code} has been successfully created.\n\nValid from: {valid_from}\nValid until: {valid_until}\n\nThank you!', '["name", "voucher_code", "valid_from", "valid_until"]'::jsonb),
  ('quotation_email', 'Quotation for Green Fee Services', 'Dear {contact_person},\n\nPlease find attached quotation {quotation_number} for {number_of_passports} passports.\n\nTotal Amount: {total_amount}\nValid Until: {valid_until}\n\nBest regards,', '["contact_person", "quotation_number", "number_of_passports", "total_amount", "valid_until"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- TRANSACTIONS TABLE (for reporting)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('individual', 'corporate', 'bulk')),
  reference_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  passport_number TEXT,
  nationality TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions" ON transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_passport ON transactions(passport_number);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passports_updated_at BEFORE UPDATE ON passports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_individual_purchases_updated_at BEFORE UPDATE ON individual_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_vouchers_updated_at BEFORE UPDATE ON corporate_vouchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_modes_updated_at BEFORE UPDATE ON payment_modes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  sequence := LPAD(NEXTVAL('quotation_sequence')::TEXT, 4, '0');
  RETURN 'QUO-' || year || '-' || sequence;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_sequence START 1;

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_validity_days INTEGER NOT NULL DEFAULT 30,
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );

-- Insert default settings
INSERT INTO settings (voucher_validity_days, default_amount)
SELECT 30, 50.00
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- Revenue report view
CREATE OR REPLACE VIEW revenue_report AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  'individual' as type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  payment_method
FROM individual_purchases
GROUP BY DATE_TRUNC('day', created_at), payment_method
UNION ALL
SELECT
  DATE_TRUNC('day', created_at) as date,
  'corporate' as type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  payment_method
FROM corporate_vouchers
GROUP BY DATE_TRUNC('day', created_at), payment_method
ORDER BY date DESC;

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Note: User profiles will be automatically created when users sign up via Supabase Auth
-- You can manually create test users in the Supabase Auth UI and then insert their profiles here

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth users';
COMMENT ON TABLE passports IS 'Passport information for travelers';
COMMENT ON TABLE individual_purchases IS 'Individual green fee voucher purchases';
COMMENT ON TABLE corporate_vouchers IS 'Corporate green fee vouchers';
COMMENT ON TABLE quotations IS 'Quotations for corporate clients';
COMMENT ON TABLE bulk_uploads IS 'Bulk passport upload batches';
COMMENT ON TABLE payment_modes IS 'Available payment methods';
COMMENT ON TABLE tickets IS 'Support tickets';
COMMENT ON TABLE email_templates IS 'Email templates for notifications';
COMMENT ON TABLE transactions IS 'Transaction records for reporting';
