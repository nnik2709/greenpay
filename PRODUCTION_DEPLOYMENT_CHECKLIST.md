# Production Deployment Checklist

**Build Date:** November 23, 2025
**Git Commit:** a9f19ad
**Build Status:** ✅ COMPLETE
**Build Size:** 3.1 MB
**Files:** 80 assets

---

## 🎯 DEPLOYMENT OVERVIEW

This production build includes:
- ✅ **CRITICAL:** PCI-DSS compliance fix (credit card removal)
- ✅ Hardware scanner integration (MRZ passport reading)
- ✅ Security audit completed
- ✅ All latest features and bug fixes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **Step 1: Database Migration (CRITICAL)**

⚠️ **MUST BE DONE FIRST** - Before deploying code

1. **Backup Database**
   ```bash
   # Login to Supabase Dashboard
   # Go to Database → Backups
   # Create manual backup: "pre-pci-fix-backup-2025-11-23"
   ```
   - [ ] Database backup created
   - [ ] Backup download verified

2. **Run Migration Script**
   ```sql
   -- In Supabase SQL Editor
   -- Open file: migrations/pci_compliance_pos_tracking.sql
   -- Execute entire script
   ```
   - [ ] Migration script executed
   - [ ] "Migration Complete" message received
   - [ ] No errors in output

3. **Verify Migration**
   ```sql
   -- Check new columns exist
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'individual_purchases'
   AND column_name LIKE 'pos_%';
   -- Expected: 3 rows
   ```
   - [ ] New columns verified (pos_terminal_id, pos_transaction_ref, pos_approval_code)
   - [ ] Indexes created
   - [ ] No data violations found

---

### **Step 2: Environment Check**

On production server (eywademo.cloud):

```bash
# Check environment files
ls -la /var/www/png-green-fees/.env*

# Verify critical env vars are set
grep "VITE_SUPABASE" /var/www/png-green-fees/.env
```

- [ ] `.env` file exists
- [ ] `VITE_SUPABASE_URL` configured
- [ ] `VITE_SUPABASE_ANON_KEY` configured
- [ ] No `.env` file in git history

---

### **Step 3: Server Preparation**

```bash
# Check disk space
df -h

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check server resources
free -h
```

- [ ] Sufficient disk space (> 1GB free)
- [ ] PM2 is running
- [ ] Nginx is running
- [ ] Server resources adequate

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Pull Latest Code**

```bash
cd /var/www/png-green-fees

# Pull from GitHub
git pull origin main

# Verify correct commit
git log --oneline -1
# Should show: a9f19ad 🔒 Add comprehensive security audit report
```

- [ ] Code pulled successfully
- [ ] Correct commit hash (a9f19ad)
- [ ] No merge conflicts

---

### **Step 2: Install Dependencies**

```bash
# Install any new dependencies
npm install

# Check for vulnerabilities
npm audit
```

- [ ] Dependencies installed
- [ ] No critical vulnerabilities

---

### **Step 3: Build Production Bundle**

```bash
# Build production assets
npm run build

# Verify build output
ls -lh dist/
du -sh dist/
# Expected: ~3.1 MB
```

- [ ] Build completed successfully
- [ ] No build errors
- [ ] dist/ folder created (~3.1 MB)
- [ ] 80 asset files generated

---

### **Step 4: Restart Application**

```bash
# Restart PM2 process
pm2 restart png-green-fees

# Check status
pm2 status

# Monitor logs for errors
pm2 logs png-green-fees --lines 50
```

- [ ] PM2 restarted successfully
- [ ] Status shows "online"
- [ ] No errors in logs

---

### **Step 5: Nginx Check**

```bash
# Test Nginx configuration
sudo nginx -t

# Reload if needed
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

- [ ] Nginx config valid
- [ ] Nginx running
- [ ] No errors in logs

---

## ✅ POST-DEPLOYMENT VERIFICATION

### **Step 1: Application Health Check**

```bash
# Check if app is responding
curl -I https://greenpay.eywademo.cloud

# Check PM2 logs
pm2 logs png-green-fees --lines 20
```

- [ ] HTTP 200 response
- [ ] Application loads
- [ ] No errors in PM2 logs

---

### **Step 2: Critical Functionality Tests**

**Test 1: Login**
- [ ] Navigate to https://greenpay.eywademo.cloud/login
- [ ] Login with test credentials
- [ ] Successfully authenticated
- [ ] Dashboard loads

**Test 2: PCI-DSS Compliance (CRITICAL)**
- [ ] Go to `/purchases`
- [ ] Click "Add Payment"
- [ ] Select payment method: "CREDIT CARD"
- [ ] **VERIFY YOU SEE:**
  - [ ] ✅ "PCI-Compliant" security notice
  - [ ] ✅ Transaction Reference Number field (required)
  - [ ] ✅ POS Terminal ID field
  - [ ] ✅ Approval Code field
  - [ ] ✅ Card Last 4 Digits field (max 4 chars)
- [ ] **VERIFY YOU DON'T SEE:**
  - [ ] ❌ Full card number field
  - [ ] ❌ Expiry date field
  - [ ] ❌ CVV/CVC field

**Test 3: Individual Purchase**
- [ ] Go to `/passports/create`
- [ ] Same credit card field verification as above
- [ ] POS transaction fields visible
- [ ] No full card data fields

**Test 4: Scanner Integration**
- [ ] Scanner indicator visible on passport entry pages
- [ ] Manual entry still works
- [ ] No JavaScript errors in console

**Test 5: Other Pages**
- [ ] Passports list loads
- [ ] Reports load
- [ ] Quotations work
- [ ] User management accessible (admin)

---

### **Step 3: Database Verification**

```sql
-- In Supabase SQL Editor

-- 1. Verify no card data violations
SELECT COUNT(*) as violations
FROM individual_purchases
WHERE LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4;
-- Expected: 0

-- 2. Check new columns exist
SELECT COUNT(*) FROM individual_purchases
WHERE pos_terminal_id IS NOT NULL
   OR pos_transaction_ref IS NOT NULL
   OR pos_approval_code IS NOT NULL;
-- Expected: 0 or more (depending on new entries)

-- 3. Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'individual_purchases'
AND indexname LIKE '%pos%';
-- Expected: 2 indexes
```

- [ ] No card data violations
- [ ] New columns accessible
- [ ] Indexes created

---

### **Step 4: Browser Console Check**

Open browser console (F12) and check:

- [ ] No JavaScript errors
- [ ] No 404s for assets
- [ ] No CORS errors
- [ ] Application loads correctly

---

### **Step 5: Mobile/Responsive Check**

- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] UI remains functional
- [ ] No layout breaks

---

## 🔄 ROLLBACK PLAN (If Issues Occur)

### **Quick Rollback:**

```bash
cd /var/www/png-green-fees

# Check previous commits
git log --oneline -5

# Rollback to previous stable commit
git reset --hard 6d57401  # Before security audit

# Rebuild
npm run build

# Restart
pm2 restart png-green-fees
```

### **Database Rollback:**

⚠️ **Only if critical issues**

```sql
-- Restore from backup via Supabase Dashboard
-- Or manually drop new columns (see migration file for DROP statements)
```

**Note:** Rollback is NOT recommended as the previous version violates PCI-DSS.

---

## 📊 MONITORING (First 24 Hours)

### **What to Monitor:**

1. **PM2 Logs**
   ```bash
   pm2 logs png-green-fees --lines 100
   ```
   - Watch for errors
   - Check authentication issues
   - Monitor database queries

2. **Nginx Access Logs**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```
   - Monitor traffic
   - Check for 500 errors
   - Verify HTTPS usage

3. **Nginx Error Logs**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```
   - Watch for proxy errors
   - Check SSL issues

4. **Supabase Dashboard**
   - Monitor database queries
   - Check authentication logs
   - Review RLS policy violations (should be none)

---

## 👥 STAFF TRAINING (CRITICAL)

⚠️ **Must be done BEFORE processing card payments**

**What Changed:**
- No more credit card number entry
- Now enter POS transaction details instead

**Training Topics:**
1. **New Payment Workflow:**
   - Process card on POS terminal
   - Get printed receipt
   - Enter transaction reference from receipt
   - Enter terminal ID, approval code
   - Optional: Last 4 digits

2. **What NOT to do:**
   - ❌ Never enter full card number
   - ❌ Never enter expiry date
   - ❌ Never enter CVV/CVC

3. **Documentation:**
   - Refer to: `PCI_COMPLIANCE_FIX.md`
   - Training guide included

**Training Checklist:**
- [ ] All Counter_Agents trained
- [ ] Finance_Manager briefed
- [ ] Flex_Admin informed
- [ ] Training documentation provided
- [ ] Questions answered

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- IT Support team
- Check: `pm2 logs png-green-fees`
- Check: Nginx logs

**Database Issues:**
- Database Administrator
- Supabase Dashboard
- Check: RLS policies

**Compliance Questions:**
- Legal/Security team
- Refer to: `PCI_COMPLIANCE_FIX.md`
- Refer to: `SECURITY_AUDIT_REPORT.md`

**Training Questions:**
- Finance Manager
- Refer to: `URGENT_DEPLOYMENT.md`

---

## ✅ DEPLOYMENT COMPLETION CHECKLIST

### **All Steps Completed:**

- [ ] Database backed up
- [ ] Migration executed successfully
- [ ] Migration verified
- [ ] Code pulled from GitHub
- [ ] Dependencies installed
- [ ] Production build created
- [ ] PM2 restarted
- [ ] Application accessible
- [ ] Login tested
- [ ] PCI compliance verified (no card fields)
- [ ] POS transaction fields visible
- [ ] Database queries verified
- [ ] No console errors
- [ ] Mobile/responsive checked
- [ ] Staff training completed
- [ ] Documentation reviewed
- [ ] Monitoring set up

### **Final Sign-Off:**

- [ ] Technical Lead approval
- [ ] Security compliance verified
- [ ] Business stakeholder informed
- [ ] Deployment documented
- [ ] Incident response plan ready

---

## 📝 DEPLOYMENT NOTES

**Deployment Time:** _______________  
**Deployed By:** _______________  
**Issues Encountered:** _______________  
**Resolution:** _______________  
**Additional Notes:** _______________

---

## 🎉 SUCCESS CRITERIA

Deployment is successful when:

1. ✅ Application loads without errors
2. ✅ Login works correctly
3. ✅ PCI-compliant payment fields visible
4. ✅ NO credit card data fields visible
5. ✅ Database migration complete
6. ✅ No console errors
7. ✅ PM2 status: online
8. ✅ All critical pages load
9. ✅ Staff training complete
10. ✅ No data violations in database

---

**Deployment Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Date Completed:** _______________

**Verified By:** _______________

---

**IMPORTANT REMINDERS:**

1. 🔒 **PCI Compliance is CRITICAL** - Verify no card data collection
2. 📊 **Database migration FIRST** - Before deploying code
3. 💾 **Backup database** - Before any changes
4. 👥 **Train staff** - Before processing payments
5. 📝 **Document issues** - For future reference

---

**End of Deployment Checklist**
