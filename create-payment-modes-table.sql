-- Create PaymentMode table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PaymentMode" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  "collectCardDetails" BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "PaymentMode" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "PaymentMode_id_seq" TO greenpay_user;

-- Insert default payment modes if table is empty
INSERT INTO "PaymentMode" (name, "collectCardDetails", active)
VALUES
  ('CASH', false, true),
  ('EFTPOS', true, true),
  ('BANK TRANSFER', false, true)
ON CONFLICT (name) DO NOTHING;

-- Show current payment modes
SELECT * FROM "PaymentMode";
