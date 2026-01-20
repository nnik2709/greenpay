-- Migration 006: Create email_templates table
-- Purpose: Store customizable email templates for the system
-- Date: 2026-01-20

-- Drop table if exists (for development only - remove in production)
DROP TABLE IF EXISTS email_templates CASCADE;

-- Create email_templates table
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Insert default templates
INSERT INTO email_templates (name, description, subject, body, variables) VALUES
(
  'individual_purchase',
  'Email template for individual voucher purchases',
  'PNG Green Fee Voucher - {{VOUCHER_CODE}}',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .voucher-code { font-size: 24px; font-weight: bold; color: #4CAF50; margin: 20px 0; }
    .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PNG Green Fee Voucher</h1>
  </div>
  <div class="content">
    <p>Dear {{CUSTOMER_NAME}},</p>
    <p>Thank you for your payment. Your PNG Green Fee voucher is now ready.</p>
    <div class="voucher-code">Voucher Code: {{VOUCHER_CODE}}</div>
    <p><strong>Amount:</strong> PGK {{AMOUNT}}<br/>
    <strong>Payment Method:</strong> {{PAYMENT_METHOD}}<br/>
    <strong>Issued On:</strong> {{ISSUE_DATE}}<br/>
    <strong>Valid Until:</strong> {{VALID_UNTIL}}</p>

    <p>Your voucher is attached as a PDF to this email.</p>

    <p>To register your passport with this voucher, please visit:<br/>
    <a href="{{REGISTRATION_URL}}">{{REGISTRATION_URL}}</a></p>

    <p>Please keep this voucher for airport checks.</p>
  </div>
  <div class="footer">
    <p>Climate Change and Development Authority<br/>
    Email: png.greenfees@ccda.gov.pg<br/>
    Phone: +675 7700 7513 / +675 7700 7836</p>
  </div>
</body>
</html>',
  '["CUSTOMER_NAME", "VOUCHER_CODE", "AMOUNT", "PAYMENT_METHOD", "ISSUE_DATE", "VALID_UNTIL", "REGISTRATION_URL"]'::jsonb
),
(
  'corporate_purchase',
  'Email template for corporate/bulk voucher purchases',
  'PNG Green Fee Vouchers - {{COMPANY_NAME}} ({{VOUCHER_COUNT}} vouchers)',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .company-name { font-size: 20px; font-weight: bold; color: #4CAF50; margin: 15px 0; }
    .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PNG Green Fee Corporate Vouchers</h1>
  </div>
  <div class="content">
    <p>Dear {{CONTACT_NAME}},</p>
    <div class="company-name">{{COMPANY_NAME}}</div>
    <p>Thank you for your corporate purchase. Your {{VOUCHER_COUNT}} PNG Green Fee voucher(s) are now ready.</p>

    <p><strong>Batch ID:</strong> {{BATCH_ID}}<br/>
    <strong>Total Amount:</strong> PGK {{TOTAL_AMOUNT}}<br/>
    <strong>Payment Method:</strong> {{PAYMENT_METHOD}}<br/>
    <strong>Issued On:</strong> {{ISSUE_DATE}}</p>

    <p>All vouchers are attached as PDF files to this email.</p>

    <p>Each voucher must be registered with a passport before use. You can register passports at:<br/>
    <a href="{{REGISTRATION_BASE_URL}}">{{REGISTRATION_BASE_URL}}</a></p>

    <p>For bulk passport registration, please contact our support team.</p>
  </div>
  <div class="footer">
    <p>Climate Change and Development Authority<br/>
    Email: png.greenfees@ccda.gov.pg<br/>
    Phone: +675 7700 7513 / +675 7700 7836</p>
  </div>
</body>
</html>',
  '["CONTACT_NAME", "COMPANY_NAME", "VOUCHER_COUNT", "BATCH_ID", "TOTAL_AMOUNT", "PAYMENT_METHOD", "ISSUE_DATE", "REGISTRATION_BASE_URL"]'::jsonb
),
(
  'quotation_email',
  'Email template for sending quotations to customers',
  'PNG Green Fee Quotation - {{QUOTATION_NUMBER}}',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .quotation-number { font-size: 20px; font-weight: bold; color: #4CAF50; margin: 15px 0; }
    .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PNG Green Fee Quotation</h1>
  </div>
  <div class="content">
    <p>Dear {{CUSTOMER_NAME}},</p>
    <p>Thank you for your interest in PNG Green Fees. Please find your quotation attached.</p>

    <div class="quotation-number">Quotation #{{QUOTATION_NUMBER}}</div>

    <p><strong>Number of Vouchers:</strong> {{QUANTITY}}<br/>
    <strong>Total Amount:</strong> PGK {{TOTAL_AMOUNT}}<br/>
    <strong>Valid Until:</strong> {{VALID_UNTIL}}</p>

    <p>To proceed with this quotation, please contact us or visit our office.</p>

    <p>If you have any questions, please don''t hesitate to reach out.</p>
  </div>
  <div class="footer">
    <p>Climate Change and Development Authority<br/>
    Email: png.greenfees@ccda.gov.pg<br/>
    Phone: +675 7700 7513 / +675 7700 7836</p>
  </div>
</body>
</html>',
  '["CUSTOMER_NAME", "QUOTATION_NUMBER", "QUANTITY", "TOTAL_AMOUNT", "VALID_UNTIL"]'::jsonb
),
(
  'invoice_email',
  'Email template for sending invoices to customers',
  'PNG Green Fee Invoice - {{INVOICE_NUMBER}}',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .invoice-number { font-size: 20px; font-weight: bold; color: #4CAF50; margin: 15px 0; }
    .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PNG Green Fee Invoice</h1>
  </div>
  <div class="content">
    <p>Dear {{CUSTOMER_NAME}},</p>
    <p>Thank you for your payment. Please find your invoice attached.</p>

    <div class="invoice-number">Invoice #{{INVOICE_NUMBER}}</div>

    <p><strong>Total Amount:</strong> PGK {{TOTAL_AMOUNT}}<br/>
    <strong>Payment Method:</strong> {{PAYMENT_METHOD}}<br/>
    <strong>Date:</strong> {{INVOICE_DATE}}</p>

    <p>Your vouchers have been generated and are available in your account.</p>

    <p>For any queries regarding this invoice, please contact our support team.</p>
  </div>
  <div class="footer">
    <p>Climate Change and Development Authority<br/>
    Email: png.greenfees@ccda.gov.pg<br/>
    Phone: +675 7700 7513 / +675 7700 7836</p>
  </div>
</body>
</html>',
  '["CUSTOMER_NAME", "INVOICE_NUMBER", "TOTAL_AMOUNT", "PAYMENT_METHOD", "INVOICE_DATE"]'::jsonb
);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_template_timestamp
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_email_template_timestamp();

-- Grant permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE ON email_templates TO greenpay;
GRANT USAGE, SELECT ON SEQUENCE email_templates_id_seq TO greenpay;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Email templates table created successfully with 4 default templates';
END $$;
