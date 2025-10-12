# Quick Start Deployment Guide

**Status:** Ready to deploy critical fixes  
**Time Required:** 30 minutes - 1 hour  
**Last Updated:** October 11, 2025

---

## 🎯 What Just Got Fixed

Your code now has these critical fixes applied:
1. ✅ Bulk Upload connects to real Edge Function (no more fake data)
2. ✅ All report pages show real database data
3. ✅ Corporate Batch History page created
4. ✅ All hardcoded data removed

**Next:** Deploy infrastructure and test

---

## 🚀 Quick Deployment (3 Options)

### Option 1: Automated Script (Recommended)

```bash
cd /Users/nnik/github/greenpay

# Run the automated deployment helper
./deploy-production-updates.sh

# Follow the prompts
# The script will:
# - Check Supabase CLI
# - Deploy all Edge Functions
# - Apply database migrations
# - Build frontend
```

### Option 2: Manual Step-by-Step

See detailed guide: `PRODUCTION_DEPLOYMENT_STEPS.md`

### Option 3: Quick Commands Only

```bash
# 1. Deploy Edge Functions
supabase functions deploy bulk-passport-upload
supabase functions deploy generate-corporate-zip
supabase functions deploy send-bulk-passport-vouchers

# 2. Apply Migrations
supabase db push

# 3. Build Frontend
npm run build

# 4. Deploy to VPS
./deploy-vps.sh
```

---

## ⚠️ Prerequisites

### Before Running Deployment:

1. **Supabase CLI Installed**
   ```bash
   # Check if installed
   supabase --version
   
   # If not, install:
   brew install supabase/tap/supabase
   # or
   npm install -g supabase
   ```

2. **Project Linked to Supabase**
   ```bash
   # Login
   supabase login
   
   # Link project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Get project ref from:
   # Supabase Dashboard → Settings → General → Reference ID
   ```

3. **VPS Access** (if deploying to production)
   - SSH access to 195.200.14.62
   - PM2 running
   - Nginx configured

---

## 🧪 Testing After Deployment

### Test 1: Bulk Upload
```bash
# File is ready: test-bulk-upload.csv
# Contains 5 test passports
```

1. Open: http://195.200.14.62 (or your VPS)
2. Login: admin@example.com / password123
3. Go to: Bulk Upload page
4. Upload: `test-bulk-upload.csv`
5. Verify: Shows "5 passports processed"
6. Check: Database has 5 new passports

### Test 2: Reports
Visit each report page and verify real data:
- `/reports/bulk-passport-uploads` - Should show your test upload
- `/reports/quotations` - Should show real quotations (not QUO-001 fake data)
- `/reports/passports` - Should show all passports
- `/reports/individual-purchases` - Should show real purchases
- `/reports/corporate-vouchers` - Should show real vouchers
- `/reports/revenue-generated` - Should show real revenue

### Test 3: Corporate Batch History (NEW)
- Go to: `/purchases/corporate-batch-history`
- Verify: Shows grouped corporate batches
- Test: Click "View Details" on a batch
- Test: Download ZIP button (if corporate vouchers exist)

---

## ✅ Success Criteria

Your deployment is successful when:

1. **Edge Functions Deployed**
   ```bash
   supabase functions list
   # Should show 10 functions including:
   # - bulk-passport-upload ← CRITICAL
   # - generate-corporate-zip
   # - send-bulk-passport-vouchers
   ```

2. **Migrations Applied**
   ```bash
   # Check in Supabase Dashboard → Table Editor
   # Should see these tables:
   # - bulk_uploads (new)
   # - corporate_vouchers (has batch_id column)
   # - quotations
   # - email_templates
   # - sms_settings
   ```

3. **Bulk Upload Works**
   - Upload test CSV → Success
   - Passports appear in database
   - No console errors
   - Toast shows success message

4. **Reports Show Real Data**
   - Bulk Upload Reports shows your test upload
   - Quotations Reports shows database data
   - No "QUO-001" or other fake data visible

5. **No Errors**
   - Browser console clean (F12)
   - Network tab shows 200 OK responses
   - No "undefined" or "null" errors

---

## 🐛 Common Issues & Fixes

### Issue 1: "Supabase CLI not found"
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Issue 2: "Project not linked"
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue 3: "Edge Function deployment failed"
```bash
# Check if Deno is required
deno --version

# If not installed:
curl -fsSL https://deno.land/install.sh | sh

# Try deploying again
supabase functions deploy bulk-passport-upload
```

### Issue 4: "Migration failed"
```bash
# Apply manually via Supabase SQL Editor
# Go to Dashboard → SQL Editor
# Copy content from each file in supabase/migrations/
# Paste and click "Run"
```

### Issue 5: "Upload doesn't work"
- Check: Edge Function deployed (`supabase functions list`)
- Check: Browser console for errors
- Check: Network tab shows POST to /bulk-passport-upload
- Check: Function logs (`supabase functions logs bulk-passport-upload`)

### Issue 6: "Reports show no data"
- Check: Supabase connection in browser
- Check: Tables have data (Supabase Dashboard → Table Editor)
- Check: Console errors for RLS policy issues
- Test: Run query manually in SQL Editor

---

## 📞 Getting Help

### Check Logs
```bash
# VPS logs (if deployed)
ssh user@195.200.14.62 'pm2 logs'

# Edge Function logs
supabase functions logs bulk-passport-upload

# Database logs
# Supabase Dashboard → Logs → select time range
```

### Verify Environment
```bash
# Check Supabase URL and Key
cat .env | grep VITE_SUPABASE

# On VPS
ssh user@195.200.14.62 'cat /var/www/png-green-fees/.env.production | grep VITE'
```

---

## 📚 Full Documentation

- **Detailed Steps:** `PRODUCTION_DEPLOYMENT_STEPS.md`
- **Storage Setup:** `STORAGE_SETUP_GUIDE.md`
- **Feature Analysis:** `COMPREHENSIVE_MISSING_FEATURES_ANALYSIS.md`

---

## 🎉 Ready to Deploy!

When you're ready, run:

```bash
./deploy-production-updates.sh
```

Or follow the manual steps in `PRODUCTION_DEPLOYMENT_STEPS.md`.

Good luck! 🚀

