#!/bin/bash
# Run this script ON THE SERVER to complete the settings setup

echo "========================================="
echo "GreenPay Settings Setup"
echo "========================================="

# Step 1: Create database table
echo ""
echo "Step 1: Creating SystemSettings table..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db << 'SQLEOF'
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  id SERIAL PRIMARY KEY,
  "voucherValidityDays" INTEGER NOT NULL DEFAULT 30,
  "defaultAmount" DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "SystemSettings" ("voucherValidityDays", "defaultAmount")
VALUES (30, 50.00)
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON "SystemSettings" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "SystemSettings_id_seq" TO greenpay_user;
SQLEOF

echo "✅ Database table created"

# Step 2: Verify table
echo ""
echo "Step 2: Verifying table..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT * FROM \"SystemSettings\";"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next: Make sure server.js has this line:"
echo "  app.use('/api/settings', require('./routes/settings'));"
echo ""
echo "Then rebuild frontend on your Mac and deploy"
