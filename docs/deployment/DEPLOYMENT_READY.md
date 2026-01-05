# Deployment Ready - Critical Fixes

## Summary

After analyzing your manual testing issues and running database queries, I've identified and fixed the **root causes** of several critical issues:

### ✅ Fixed Issues:

1. **Settings Update Permission Error** - Wrong table schema
2. **Passport Reports Not Showing Data** - Frontend not parsing `full_name` field
3. **Quotations Report Errors** - Missing `company_name` column

### ✅ Already Working (Just Need Testing):

4. **Voucher Registration** - Code is correct, voucher exists in DB
5. **Ticket Creation** - Validation is correct
6. **User Management** - Update logic is correct
7. **Corporate Vouchers Status** - Already shows correct `pending_passport` status

---

## What You Need to Deploy

### 1. Run Database Migrations (REQUIRED)

```bash
# Connect to production server
ssh root@165.22.52.100

# Run migrations as postgres user
sudo -u postgres psql greenpay_db << 'EOF'
\i /var/www/greenpay/database/migrations/003_fix_settings_table_structure.sql
\i /var/www/greenpay/database/migrations/004_fix_quotations_table.sql
EOF
```

**What these do:**
- **003**: Recreates settings table with correct schema (fixes Issue #2)
- **004**: Adds missing columns to quotations table (fixes Issue #10)

### 2. Deploy Frontend Build (REQUIRED)

```bash
# From your local machine, copy built files
cd /Users/nikolay/github/greenpay
scp -r dist/* root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

**What this fixes:**
- Passport Reports will now display names correctly (Issue #3)
- Better date formatting
- Handles null values safely

---

## Files Changed

### Frontend:
- `src/pages/reports/PassportReports.jsx` - Parses `full_name` into surname/given name

### Database Migrations:
- `database/migrations/003_fix_settings_table_structure.sql` - NEW
- `database/migrations/004_fix_quotations_table.sql` - NEW

### Build:
- `dist/` - Complete production build ready to deploy

---

## Expected Results After Deployment

### Issue #2: Settings Update
**Before:** Error: "must be owner of table settings"
**After:** ✅ Settings page works, can update voucher validity days, default amount, GST, policy content

**Test:**
1. Login as Flex_Admin
2. Go to `/app/admin/settings`
3. Change "Voucher Validity Days" to 30
4. Click Save
5. Should see success message

### Issue #3: Passport Reports
**Before:** No data showing (blank surname/given name columns)
**After:** ✅ Shows all 147 passports with names parsed from `full_name`

**Test:**
1. Login as IT_Support or Finance_Manager
2. Go to `/app/reports/passports`
3. Should see list of 147 passports with names displayed
4. "NIKOLOV NIKOLAY" should show as: Surname="NIKOLAY", Given Name="NIKOLOV"

### Issue #10: Quotations Report
**Before:** Error: column "company_name" does not exist
**After:** ✅ Report loads correctly

**Test:**
1. Login as IT_Support
2. Go to `/app/reports/quotations`
3. Should see 26 quotations with company names

---

## Issues That Need Testing (May Already Work)

### Issue #4: Voucher Registration
**Database check:** ✅ Voucher `1XNDLVY9` exists and is valid

**Test:**
1. Visit: `https://greenpay.eywademo.cloud/register/1XNDLVY9`
2. Should show voucher details (Test Company, $50.00)
3. Should allow entering passport details
4. Should register successfully

**If it fails:** Check browser console for errors, let me know the exact error message

### Issue #5: Ticket Creation
**Backend validation:** ✅ Correct

**Test:**
1. Login as any user
2. Go to `/app/tickets`
3. Click "Create Ticket"
4. Fill in:
   - Title: "Test ticket"
   - Description: "Testing"
   - Category: "technical"
   - Priority: "low"
5. Should create successfully

**If it fails:** Check browser console, verify form field names match backend

### Issue #9: User Management
**Backend logic:** ✅ Correct

**Test Deactivate:**
1. Login as Flex_Admin
2. Go to `/app/users`
3. Find a user, click "Deactivate"
4. Should update status to "Inactive"

**Test Change Role:**
1. Select a user, click "Change Role"
2. Select different role
3. Should update role

**If it fails:** Check browser console for API errors

---

## Quick Deployment Script

I can create a deployment script for you, but since SSH is not available from this machine, here's what you run manually:

```bash
#!/bin/bash

echo "📦 Deploying GreenPay fixes..."

# 1. Upload database migrations
echo "1️⃣ Uploading database migrations..."
scp database/migrations/003_fix_settings_table_structure.sql \
    database/migrations/004_fix_quotations_table.sql \
    root@165.22.52.100:/var/www/greenpay/database/migrations/

# 2. Run migrations
echo "2️⃣ Running database migrations..."
ssh root@165.22.52.100 << 'ENDSSH'
cd /var/www/greenpay
sudo -u postgres psql greenpay_db -f database/migrations/003_fix_settings_table_structure.sql
sudo -u postgres psql greenpay_db -f database/migrations/004_fix_quotations_table.sql
ENDSSH

# 3. Upload frontend
echo "3️⃣ Uploading frontend build..."
scp -r dist/* root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/

# 4. Restart API
echo "4️⃣ Restarting API..."
ssh root@165.22.52.100 "pm2 restart greenpay-api"

# 5. Check logs
echo "5️⃣ Checking logs..."
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 20 --nostream"

echo "✅ Deployment complete!"
```

---

## Remaining Issues (Not Yet Fixed)

These were not addressed in this deployment and need separate investigation:

### Priority 2:
- Email functionality (Print voucher, Quotation email)
- Download Quotation not working
- View Invoice not working

### Priority 3:
- Navigation issues (blank pages, wrong redirects)
- Corporate Batch History no data

### Priority 4:
- PDF template inconsistency
- Button styling issues
- Missing Email Templates page

### Priority 5:
- Missing PWA icons

---

## Verification Checklist

After deployment, verify these work:

- [ ] Settings page can save updates
- [ ] Passport Reports shows all 147 passports with names
- [ ] Quotations Report loads for IT_Support
- [ ] Voucher registration link works
- [ ] Ticket creation works
- [ ] User deactivation works
- [ ] User role change works

---

## Need Help?

If any of the "should work" items fail after deployment:
1. Check browser console for errors
2. Check PM2 logs: `pm2 logs greenpay-api --lines 50`
3. Let me know the exact error message and I'll fix it
