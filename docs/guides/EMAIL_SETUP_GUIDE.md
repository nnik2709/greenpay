# Email Functionality Setup Guide

## Quick Setup (10 minutes)

You can set up and test email functionality right now on your development Supabase instance before production migration.

---

## Step 1: Get Resend API Key (5 minutes)

### 1.1 Sign Up for Resend
1. Go to https://resend.com
2. Click "Sign Up" or "Get Started"
3. Sign up with your email (or GitHub account)
4. Verify your email address

### 1.2 Verify Your Domain (Optional for Testing)
For testing, you can skip domain verification and use Resend's test mode:
- Test emails will go to your verified email address only
- For production, you'll need to verify your domain

**To verify domain (for production later):**
1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records (TXT, MX, etc.) to your domain provider
5. Wait for verification (can take 5-60 minutes)

### 1.3 Get Your API Key
1. In Resend Dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it: `PNG Green Fees Dev` (or similar)
4. Select permissions: "Sending access"
5. Click "Create"
6. **Copy the API key immediately** (shown only once!)
7. Store it safely - you'll need it in next step

Example API key format: `re_123abc456def789...`

---

## Step 2: Configure Supabase Edge Functions (2 minutes)

### 2.1 Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your PNG Green Fees project
3. Navigate to **Edge Functions** (in left sidebar)

### 2.2 Set Environment Variables
1. Click on **"Edge Functions"** → **"Settings"** (or Configuration)
2. Find **"Function secrets"** or **"Environment Variables"** section
3. Add two new secrets:

**Secret 1:**
```
Name: RESEND_API_KEY
Value: [paste your Resend API key here]
```

**Secret 2:**
```
Name: FROM_EMAIL
Value: PNG Green Fees <noreply@yourdomain.com>
```

**Important notes for FROM_EMAIL:**
- For testing without domain verification: Use your verified email
  - Example: `PNG Green Fees <your.email@gmail.com>`
- For production with verified domain: Use your domain
  - Example: `PNG Green Fees <noreply@pnggreenfeees.gov.pg>`

4. Click **"Save"** or **"Add secret"**

### 2.3 Restart Edge Functions (if needed)
Some Supabase versions require restarting functions after adding secrets:
1. Go to Edge Functions list
2. Look for restart/redeploy buttons (optional)
3. Or wait 1-2 minutes for auto-reload

---

## Step 3: Run Database Migrations (2 minutes)

Before testing emails, ensure your database has the latest schema:

### 3.1 Open Supabase SQL Editor
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**

### 3.2 Run Migration 020
1. Open file: `supabase/migrations/020_add_discount_and_returned_amount.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Verify: "Success. No rows returned" (or similar)

### 3.3 Run Migration 021
1. Open file: `supabase/migrations/021_add_discount_to_quotations.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Verify: "Success. No rows returned"

**OR run both at once:**
1. Open: `supabase/migrations/CONSOLIDATED_MIGRATION_2025_01_20.sql`
2. Copy entire contents
3. Paste and run in SQL Editor

### 3.4 Verify Migrations
Run this verification query:
```sql
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'quotations'
   AND column_name IN ('discount', 'discount_amount', 'amount_after_discount')) as quot_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'email_logs') as email_logs_table_exists;

-- Expected: quot_cols=3, email_logs_table_exists > 0
```

---

## Step 4: Test Email Functionality (3 minutes)

### 4.1 Test Quotation Email

#### Via Application UI:
1. Start your dev server: `npm run dev`
2. Login to the application
3. Navigate to **Quotations** → **Create New Quotation**
4. Fill in the form:
   - Company Name: Test Company
   - Contact Person: Your Name
   - Contact Email: **YOUR EMAIL ADDRESS** (where you want to receive test)
   - Total Vouchers: 10
   - Discount: 10%
   - Valid Until: [future date]
   - Notes: Test quotation
5. Click **"Create Quotation"**
6. Should see success message with quotation number
7. Check the quotations list - quotation should appear

#### Send the Email:
1. Click on the created quotation
2. Look for "Send Email" or similar button
3. OR use the Quotations.jsx send email functionality
4. Enter your email address
5. Click "Send"

#### Via Supabase SQL (Direct Test):
```sql
-- Get a quotation ID
SELECT id, quotation_number FROM quotations LIMIT 1;

-- Then test the edge function directly in Supabase Functions UI
-- Go to: Edge Functions → send-quotation → Invoke
-- Body:
{
  "quotationId": "[paste quotation id here]",
  "email": "your.email@example.com"
}
```

### 4.2 Check Email Logs
After sending, verify the email was logged:
```sql
SELECT
  recipient_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
ORDER BY sent_at DESC
LIMIT 5;
```

### 4.3 Check Your Inbox
1. Check your email inbox (might take 1-2 minutes)
2. Check spam folder if not in inbox
3. Email should contain:
   - Professional HTML layout
   - Quotation details with company name
   - QR code for quotation reference
   - Total amount and discount information

---

## Testing Different Email Functions

### Test Invoice Email
```sql
-- Find or create an invoice
SELECT id, invoice_number FROM invoices LIMIT 1;

-- Test via Supabase Functions UI
-- Function: send-invoice
{
  "invoiceId": "[invoice id]",
  "email": "your.email@example.com"
}
```

### Test Bulk Voucher Email
```sql
-- Get some passport IDs
SELECT id FROM passports LIMIT 3;

-- Test via Supabase Functions UI
-- Function: send-bulk-passport-vouchers
{
  "passportIds": ["id1", "id2", "id3"],
  "email": "your.email@example.com",
  "message": "Test bulk vouchers"
}
```

### Test Corporate Batch Email
```sql
-- Get a batch ID
SELECT DISTINCT batch_id FROM corporate_vouchers WHERE batch_id IS NOT NULL LIMIT 1;

-- Test via Supabase Functions UI
-- Function: send-corporate-batch-email
{
  "batchId": "[batch id]",
  "recipientEmail": "your.email@example.com"
}
```

---

## Troubleshooting

### Issue: "Email provider not configured"
**Error:** Status 501, "Email provider not configured"

**Solution:**
1. Verify RESEND_API_KEY is set in Supabase Edge Functions settings
2. Check there are no typos in the secret name (must be exactly `RESEND_API_KEY`)
3. Wait 2 minutes for Edge Functions to reload
4. Try redeploying the function

### Issue: "Failed to send email" (502 error)
**Causes:**
1. Invalid API key
2. Resend account not verified
3. FROM_EMAIL address not verified

**Solution:**
1. Check Resend API key is correct and active
2. Verify your email in Resend dashboard
3. If using custom domain, verify domain is properly set up
4. Check Resend dashboard for error logs

### Issue: Email sent but not received
**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Resend dashboard → Logs to see delivery status
4. Check `email_logs` table in database:
   ```sql
   SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
   ```

### Issue: Quotation not found (404)
**Solution:**
1. Verify quotation exists in database:
   ```sql
   SELECT id, quotation_number FROM quotations LIMIT 5;
   ```
2. Use correct quotation ID (UUID format)
3. Ensure migration 021 was applied successfully

### Issue: "Quotation Reference" error in email
**Solution:**
Quotations need to be created with new schema (after migration 021):
1. Create a new quotation (not use old ones)
2. Old quotations may have missing discount fields

---

## Verifying Setup is Complete

Run this checklist:

```sql
-- 1. Check Edge Function secrets are set (can't query directly, but can test)
-- If this works, secrets are set correctly

-- 2. Verify database schema
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('quotations', 'email_logs', 'individual_purchases')
GROUP BY table_name;
-- Expected: quotations, email_logs, individual_purchases tables exist

-- 3. Check email_logs table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

-- 4. Verify quotations have discount columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quotations'
  AND column_name IN ('discount', 'discount_amount', 'amount_after_discount')
ORDER BY column_name;
-- Expected: 3 rows
```

**All checks pass?** ✅ Email functionality is ready!

---

## Quick Reference

### Resend Dashboard
- URL: https://resend.com/dashboard
- View sent emails: Dashboard → Emails
- Check delivery status: Click on any email
- API usage: Dashboard → Settings → Usage

### Supabase Edge Functions
- URL: https://supabase.com/dashboard/project/[your-project]/functions
- View logs: Click on function → Logs
- Test function: Click on function → Invoke
- Update secrets: Settings → Function secrets

### Testing Endpoints
All edge functions are at: `https://[your-project].supabase.co/functions/v1/[function-name]`

Available functions:
- `send-quotation`
- `send-invoice`
- `send-bulk-passport-vouchers`
- `send-voucher-batch`
- `send-corporate-batch-email`

---

## Production Considerations

Before going to production:

1. **Verify Domain in Resend**
   - Add your domain in Resend dashboard
   - Update DNS records
   - Wait for verification
   - Update FROM_EMAIL to use your domain

2. **Update FROM_EMAIL**
   ```
   FROM_EMAIL=PNG Green Fees <noreply@pnggreenfeees.gov.pg>
   ```

3. **Create Production API Key**
   - Separate API key for production
   - Named: "PNG Green Fees Production"
   - Update RESEND_API_KEY in production Supabase

4. **Test Email Deliverability**
   - Send test emails to multiple providers (Gmail, Outlook, Yahoo)
   - Check spam scores
   - Verify DKIM, SPF, DMARC records

5. **Monitor Email Logs**
   ```sql
   -- Daily email volume
   SELECT
     DATE(sent_at) as date,
     status,
     COUNT(*) as count
   FROM email_logs
   GROUP BY DATE(sent_at), status
   ORDER BY date DESC;
   ```

---

## Cost Considerations

### Resend Pricing (as of 2024)
- **Free Tier:** 100 emails/day, 3,000 emails/month
- **Paid Plans:** Starting at $20/month for 50,000 emails
- **Pay as you go:** Available for higher volumes

### Recommendations
- Start with free tier for testing
- Monitor usage in Resend dashboard
- Upgrade before reaching limits
- Set up usage alerts in Resend

---

## Next Steps

Once email is working in development:
1. ✅ Test all 5 email functions
2. ✅ Verify emails are received correctly
3. ✅ Check email logs in database
4. ✅ Test with different email providers
5. 🚀 Ready to deploy to production!

---

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **This Project:** See `TEST_EMAIL_FUNCTIONALITY.md` for more examples

---

**Setup Time:** ~10 minutes
**Testing Time:** ~5 minutes per function
**Total Time:** ~30-40 minutes for complete setup and testing

Good luck! 🚀
