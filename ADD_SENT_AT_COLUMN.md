# Add sent_at Column to Quotations Table

## Issue
Email is sending successfully ✅, but status update fails with error:
```
ERROR: column "sent_at" of relation "quotations" does not exist
```

## Solution
Add the missing `sent_at` column to the quotations table.

## Quick Fix (Run on Server)

**Option 1: Run the deployment script**
```bash
./deploy-quotation-sent-at-column.sh
```

**Option 2: Run SQL directly on server**
```bash
ssh root@72.61.208.79

# Then run:
PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db << 'EOF'
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
COMMENT ON COLUMN quotations.sent_at IS 'Timestamp when quotation was sent via email';
UPDATE quotations SET sent_at = created_at WHERE status = 'sent' AND sent_at IS NULL;
\d quotations
EOF
```

**Option 3: One-liner from your local machine**
```bash
ssh root@72.61.208.79 "PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -c \"ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;\""
```

## Verify
After running the migration, check that the column exists:
```sql
\d quotations
```

You should see:
```
sent_at | timestamp without time zone |
```

## Test
1. Go to https://greenpay.eywademo.cloud/quotations
2. Click "Send Quotation"
3. Enter quotation ID and email
4. Click Send

**Expected:**
- ✅ Email sent successfully
- ✅ Quotation status updated to 'sent'
- ✅ sent_at timestamp recorded
- ✅ No database errors

## Current Status
- ✅ Backend code deployed
- ✅ Frontend deployed
- ✅ Email sending works (confirmed in logs)
- ❌ Status update fails (missing column)

After adding the column, the entire feature will work perfectly!
