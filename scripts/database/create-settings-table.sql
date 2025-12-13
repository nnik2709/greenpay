-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  id SERIAL PRIMARY KEY,
  "voucherValidityDays" INTEGER NOT NULL DEFAULT 30,
  "defaultAmount" DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO "SystemSettings" ("voucherValidityDays", "defaultAmount", "createdAt", "updatedAt")
VALUES (30, 50.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON "SystemSettings" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "SystemSettings_id_seq" TO greenpay_user;
