# Production Deployment Steps - Critical Fixes Applied

**Date:** October 11, 2025  
**Status:** Code fixes completed, ready for deployment  
**Estimated Time:** 1-2 hours

---

## ✅ What Was Just Fixed

### Code Changes Completed:
1. ✅ **BulkPassportUpload.jsx** - Now connects to real bulkUploadService
2. ✅ **BulkPassportUploadReports.jsx** - Connected to real database data
3. ✅ **QuotationsReports.jsx** - Connected to real database data
4. ✅ **CorporateBatchHistory.jsx** - New page created
5. ✅ **All hardcoded data removed** - Verified no fake data remains

### Next: Deploy Infrastructure & Test

---

## 📋 STEP 1: Deploy Edge Functions

### Prerequisites Check
```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it:
# Mac/Linux:
brew install supabase/tap/supabase

# Or using npm:
npm install supabase --save-dev
```

### Link to Your Supabase Project (First Time Only)
```bash
# Login to Supabase
supabase login

# Link to your project (you'll be prompted for project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Your project ref can be found in:
# Supabase Dashboard → Settings → General → Reference ID
```

### Deploy Critical Edge Functions
```bash
# Navigate to project root
cd /Users/nnik/github/greenpay

# Deploy bulk upload function (CRITICAL)
supabase functions deploy bulk-passport-upload

# Deploy corporate ZIP generation
supabase functions deploy generate-corporate-zip

# Deploy quotation PDF generation
supabase functions deploy generate-quotation-pdf

# Deploy bulk email functions
supabase functions deploy send-bulk-passport-vouchers
supabase functions deploy send-voucher-batch

# Deploy other functions
supabase functions deploy bulk-corporate
supabase functions deploy report-export
supabase functions deploy send-email
supabase functions deploy send-invoice
supabase functions deploy send-quotation

# Verify deployments
supabase functions list
```

### Expected Output:
```
┌─────────────────────────────────┬─────────────────────┬──────────┐
│ NAME                            │ CREATED AT          │ VERSION  │
├─────────────────────────────────┼─────────────────────┼──────────┤
│ bulk-passport-upload            │ 2025-10-11 ...      │ ...      │
│ generate-corporate-zip          │ 2025-10-11 ...      │ ...      │
│ ... (other functions)           │                     │          │
└─────────────────────────────────┴─────────────────────┴──────────┘
```

---

## 📋 STEP 2: Apply Database Migrations

### Check Current Migration Status
```bash
# See which migrations are applied
supabase migration list
```

### Apply All Pending Migrations
```bash
# This will apply all migrations in supabase/migrations/
supabase db push

# You'll see output for each migration:
# - 007_sms_settings.sql
# - 008_audit_logs.sql
# - 009_login_events.sql
# - 010_ticket_responses.sql
# - 011_invoices.sql
# - 012_report_views.sql
# - 013_passport_file_storage.sql
# - 014_quotation_workflow.sql (adds batch_id to corporate_vouchers)
# - 015_discount_tracking.sql
# - 016_email_templates_data.sql
```

### Verify Tables Created
```bash
# Option 1: Using SQL Editor in Supabase Dashboard
# Go to SQL Editor and run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# Option 2: Using CLI
supabase db remote ls
```

### Expected Tables:
- ✅ profiles
- ✅ passports
- ✅ individual_purchases
- ✅ corporate_vouchers (should now have batch_id column)
- ✅ quotations
- ✅ payment_modes
- ✅ tickets
- ✅ transactions
- ✅ cash_reconciliations
- ✅ email_templates
- ✅ sms_settings
- ✅ audit_logs
- ✅ login_events
- ✅ bulk_uploads

---

## 📋 STEP 3: Create Storage Buckets

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket** for each bucket below:

#### Bucket 1: passport-photos
- **Name:** `passport-photos`
- **Public:** ❌ No (Private)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

#### Bucket 2: passport-signatures  
- **Name:** `passport-signatures`
- **Public:** ❌ No (Private)
- **File size limit:** 2 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

#### Bucket 3: corporate-vouchers
- **Name:** `corporate-vouchers`
- **Public:** ❌ No (Private)
- **File size limit:** 50 MB
- **Allowed MIME types:** `application/zip, application/pdf`

#### Bucket 4: quotations
- **Name:** `quotations`
- **Public:** ❌ No (Private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/pdf`

### Option 2: Via SQL (Alternative)

Run this in Supabase SQL Editor:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('passport-photos', 'passport-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg']),
  ('passport-signatures', 'passport-signatures', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/jpg']),
  ('corporate-vouchers', 'corporate-vouchers', false, 52428800, ARRAY['application/zip', 'application/pdf']),
  ('quotations', 'quotations', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for buckets
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('passport-photos', 'passport-signatures', 'corporate-vouchers', 'quotations'));

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('passport-photos', 'passport-signatures', 'corporate-vouchers', 'quotations'));

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('passport-photos', 'passport-signatures', 'corporate-vouchers', 'quotations'));

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('passport-photos', 'passport-signatures', 'corporate-vouchers', 'quotations'));
```

### Verify Buckets Created
Go to **Storage** in Supabase Dashboard - you should see 4 buckets.

---

## 📋 STEP 4: Build and Deploy Frontend

### Build the Updated Frontend
```bash
cd /Users/nnik/github/greenpay

# Install any new dependencies (in case)
npm install

# Build for production
npm run build

# This creates /dist folder with optimized build
```

### Deploy to VPS
```bash
# Option 1: Using existing deploy script
./deploy-vps.sh

# Option 2: Manual deployment
# Assuming VPS at 195.200.14.62
scp -r dist/* user@195.200.14.62:/var/www/png-green-fees/frontend/

# Restart the service
ssh user@195.200.14.62 'cd /var/www/png-green-fees && pm2 restart ecosystem.config.js'
```

---

## 📋 STEP 5: Test Bulk Upload Flow

### Create Test CSV File

Create a file called `test-passports.csv` with this content:
```csv
passportNo,surname,givenName,nationality,dob,sex,dateOfExpiry
P123456,Doe,John,Papua New Guinea,1990-01-01,Male,2030-01-01
P234567,Smith,Jane,Papua New Guinea,1985-05-15,Female,2029-06-30
P345678,Brown,Bob,Papua New Guinea,1992-03-20,Male,2028-12-31
```

### Test in Browser

1. **Open App:** http://195.200.14.62 (or your VPS IP)
2. **Login:** admin@example.com / password123
3. **Navigate:** Click "Bulk Upload" or go to `/purchases/bulk-passport-upload`
4. **Upload File:** 
   - Click "Browse files" or drag & drop `test-passports.csv`
   - Wait for processing (should show success message)
   - Verify passport count shows "3 passports processed"
5. **Check for Errors:**
   - Open browser console (F12)
   - Look for any error messages
   - Should see "Upload Successful" toast

### Verify in Database

Go to Supabase Dashboard → **Table Editor** → **bulk_uploads**:
- You should see a new row with today's date
- `total_records`: 3
- `success_count`: 3
- `error_count`: 0
- `status`: completed

Go to **passports** table:
- Should see 3 new passport records
- Passport numbers: P123456, P234567, P345678

---

## 📋 STEP 6: Verify All Reports

### Test Each Report Page

1. **Passport Reports**
   - URL: `/reports/passports`
   - Should show all passports from database
   - No hardcoded data

2. **Individual Purchase Reports**
   - URL: `/reports/individual-purchases`
   - Should show real individual voucher purchases
   - Already was using real data

3. **Corporate Voucher Reports**
   - URL: `/reports/corporate-vouchers`
   - Should show real corporate vouchers
   - Already was using real data

4. **Bulk Upload Reports** (NEWLY FIXED)
   - URL: `/reports/bulk-passport-uploads`
   - Should show real upload history (including your test upload)
   - Statistics should be calculated from real data
   - **Verify:** Shows your test upload from Step 5

5. **Quotations Reports** (NEWLY FIXED)
   - URL: `/reports/quotations`
   - Should show real quotations from database
   - Statistics calculated dynamically
   - **Verify:** No hardcoded "QUO-001" etc.

6. **Revenue Reports**
   - URL: `/reports/revenue-generated`
   - Should show real revenue data
   - Already was using real data

7. **Corporate Batch History** (NEW PAGE)
   - URL: `/purchases/corporate-batch-history`
   - Should list all corporate voucher batches
   - Can view batch details
   - Can download ZIP files
   - **Verify:** Shows batch groupings correctly

---

## ✅ SUCCESS CHECKLIST

After completing all steps, verify:

### Infrastructure ✅
- [ ] All 10 Edge Functions deployed (check `supabase functions list`)
- [ ] All 12 database migrations applied (check tables exist)
- [ ] All 4 storage buckets created (check Supabase Storage)
- [ ] Frontend built and deployed to VPS
- [ ] PM2 service restarted without errors

### Functionality ✅
- [ ] Bulk upload processes real CSV files (tested with 3 passports)
- [ ] Passports appear in database after upload
- [ ] Bulk Upload Reports shows real upload history
- [ ] Quotations Reports shows real data (no fake QUO-001)
- [ ] Corporate Batch History page loads and shows batches
- [ ] All 7 report pages load without console errors
- [ ] No "mock data" or hardcoded arrays visible anywhere

### Testing ✅
- [ ] Browser console shows no errors on any page
- [ ] Network tab shows successful API calls
- [ ] Toast notifications appear correctly
- [ ] Loading states work properly
- [ ] Data refreshes after operations

---

## 🚨 TROUBLESHOOTING

### Issue: "Cannot invoke Edge Function"
**Solution:** 
```bash
# Redeploy the specific function
supabase functions deploy bulk-passport-upload

# Check function logs
supabase functions logs bulk-passport-upload
```

### Issue: "Table 'bulk_uploads' does not exist"
**Solution:**
```bash
# Re-run migrations
supabase db push

# Or manually run specific migration in SQL Editor
```

### Issue: "Storage bucket not found"
**Solution:** 
- Go to Supabase Dashboard → Storage
- Manually create missing buckets
- Check bucket names match exactly (case-sensitive)

### Issue: "Upload shows success but no passports created"
**Solution:**
- Check Edge Function logs: `supabase functions logs bulk-passport-upload`
- Verify CSV format matches expected columns
- Check database permissions (RLS policies)

### Issue: "Reports show empty tables"
**Solution:**
- Check browser console for errors
- Verify Supabase connection (check `.env` or VPS env vars)
- Test database query manually in SQL Editor
- Check if data exists in tables

---

## 📞 NEED HELP?

### Check Logs
```bash
# VPS API logs
ssh user@195.200.14.62 'pm2 logs'

# Edge Function logs
supabase functions logs [function-name]

# Database logs
# Go to Supabase Dashboard → Logs
```

### Verify Environment
```bash
# On VPS, check environment variables
ssh user@195.200.14.62 'cat /var/www/png-green-fees/.env.production'

# Should have:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

---

## 🎉 DONE!

Once all checks pass, your system is production-ready with:
- ✅ Real bulk upload processing
- ✅ All reports connected to database
- ✅ Corporate batch history tracking
- ✅ No hardcoded data anywhere
- ✅ Full infrastructure deployed

**Next Steps:**
- Monitor system for 24 hours
- Test with real users
- Add SMS Settings page (optional enhancement)
- Configure email templates
- Set up automated backups

---

**Last Updated:** October 11, 2025  
**Deployment Version:** v2.0 - Critical Fixes Applied

