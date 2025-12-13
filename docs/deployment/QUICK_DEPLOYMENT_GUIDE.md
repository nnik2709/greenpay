# Quick Deployment Guide - 5 Minute Setup

## 🚀 Fast Track to Production

### Step 1: Backup (2 minutes)
```
Supabase Dashboard → Database → Backups → Create Manual Backup
Name: "Pre-v2.0-migration-YYYY-MM-DD"
Download: Yes
```

### Step 2: Run Migration (1 minute)
```
Supabase Dashboard → SQL Editor → New Query
Paste: supabase/migrations/CONSOLIDATED_MIGRATION_2025_01_20.sql
Click: Run
Wait for: "Success. No rows returned"
```

### Step 3: Verify Migration (1 minute)
```sql
-- Copy/paste this verification query:
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'individual_purchases'
   AND column_name IN ('discount', 'collected_amount', 'returned_amount')) as ind_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'corporate_vouchers'
   AND column_name IN ('discount', 'collected_amount', 'returned_amount')) as corp_cols,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'quotations'
   AND column_name IN ('discount', 'discount_amount', 'amount_after_discount')) as quot_cols;

-- Expected result: ind_cols=3, corp_cols=3, quot_cols=3
```

### Step 4: Configure Email (1 minute)
```
Supabase Dashboard → Edge Functions → Settings → Add:
RESEND_API_KEY = [your key from resend.com]
FROM_EMAIL = PNG Green Fees <noreply@yourdomain.com>
```

### Step 5: Test (30 seconds)
```
1. Login to app
2. Create a quotation
3. Check it appears in list
✅ Done!
```

---

## 📱 One-Line Commands

### Rollback Everything
```sql
ALTER TABLE quotations DROP COLUMN IF EXISTS discount CASCADE;
ALTER TABLE individual_purchases DROP COLUMN IF EXISTS discount CASCADE;
ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS discount CASCADE;
-- Then restore from backup
```

### Check Migration Status
```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name LIKE '%discount%' AND table_schema = 'public';
```

### Get Resend API Key
```
1. Go to: https://resend.com
2. Sign up → Verify domain → API Keys → Create
3. Copy key → Paste in Supabase Edge Functions settings
```

---

## ❌ Common Mistakes to Avoid

1. ❌ Running migrations out of order → ✅ Use CONSOLIDATED file
2. ❌ Forgetting backup → ✅ Always backup first
3. ❌ Not setting RESEND_API_KEY → ✅ Emails won't work without it
4. ❌ Testing in production → ✅ Test locally first

---

## 🆘 Emergency Contacts

**Issue:** Migration fails
**Fix:** Check error message, restore from backup if needed

**Issue:** Quotations not saving
**Fix:** Verify migration 021 ran successfully

**Issue:** Emails not sending
**Fix:** Check RESEND_API_KEY is set in Edge Functions

---

**Full docs:** See `PRODUCTION_MIGRATION_GUIDE.md` for details
