#!/bin/bash
#
# Deploy Quotation sent_at Column Migration
# Adds missing sent_at column to quotations table
#

set -e

echo "🗄️  Adding sent_at column to quotations table..."

SERVER="root@72.61.208.79"

# Run SQL migration on server
ssh ${SERVER} "PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -f - " << 'EOF'
-- Add sent_at column to quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;

-- Add comment to document the column purpose
COMMENT ON COLUMN quotations.sent_at IS 'Timestamp when quotation was sent via email';

-- Optional: Update existing 'sent' quotations to have a sent_at date
UPDATE quotations
SET sent_at = created_at
WHERE status = 'sent' AND sent_at IS NULL;

-- Verify column was added
\d quotations
EOF

echo ""
echo "✅ Migration complete!"
echo ""
echo "🧪 Test the quotation email feature again:"
echo "  1. Go to https://greenpay.eywademo.cloud/quotations"
echo "  2. Click 'Send Quotation'"
echo "  3. Enter quotation ID and email"
echo "  4. Click Send"
echo ""
echo "Expected: Email sent AND status updated to 'sent' with timestamp"
echo ""
