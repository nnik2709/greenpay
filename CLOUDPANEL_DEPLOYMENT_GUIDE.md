# CloudPanel File Manager Deployment Guide

## Quick Deployment Checklist

Upload these files via CloudPanel File Manager to fix the "Insufficient permissions" issue:

### 📂 Target Directory
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

### ✅ Critical Files to Upload (Priority Order)

#### 1. **routes/auth.js** ⭐ CRITICAL
- **Local:** `/Users/nikolay/github/greenpay/backend/routes/auth.js`
- **Remote:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/auth.js`
- **Why:** Adds missing `/api/auth/me` endpoint that frontend is calling

#### 2. **routes/individual-purchases.js** ⭐ CRITICAL
- **Local:** `/Users/nikolay/github/greenpay/backend/routes/individual-purchases.js`
- **Remote:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js`
- **Why:** Allows Counter_Agent role to create vouchers (fixes main issue!)

#### 3. **routes/passports.js** ⭐ CRITICAL
- **Local:** `/Users/nikolay/github/greenpay/backend/routes/passports.js`
- **Remote:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/passports.js`
- **Why:** Allows Counter_Agent to create passports, only passport number required

### 📋 Additional Files (Optional but Recommended)

#### 4. **routes/users.js**
- User management endpoints

#### 5. **routes/invoices.js**
- Invoice management

#### 6. **routes/quotations.js**
- Quotation management

#### 7. **routes/tickets.js**
- Support ticket system

#### 8. **middleware/auth.js**
- Updated authentication middleware (if not already present)

#### 9. **middleware/validator.js**
- Validation middleware (if not already present)

#### 10. **config/database.js**
- Database configuration (if not already present)

## Step-by-Step CloudPanel Instructions

### Step 1: Login to CloudPanel
1. Go to your CloudPanel URL
2. Login with your credentials

### Step 2: Navigate to File Manager
1. Click on **Sites** in the left menu
2. Select your site (`greenpay.eywademo.cloud`)
3. Click on **File Manager**

### Step 3: Navigate to Backend Directory
1. Navigate to: `htdocs/greenpay.eywademo.cloud/backend/`
2. Go into the `routes/` folder

### Step 4: Upload Files
1. Click **Upload** button
2. Select the 3 critical files from your local `backend/routes/` folder:
   - `auth.js`
   - `individual-purchases.js`
   - `passports.js`
3. If prompted, **overwrite** existing files

### Step 5: Restart Backend API
1. In CloudPanel, go to **PM2**
2. Find the `greenpay-api` process
3. Click **Restart**

OR use Terminal in CloudPanel:
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

### Step 6: Verify Deployment
Check PM2 logs to ensure backend restarted without errors

## What Each File Fixes

### auth.js Changes
```javascript
// ADDS this new endpoint:
router.get('/me', auth, async (req, res) => {
  // Returns current user info
});
```
**Fixes:** "Route not found" error for `/api/auth/me`

### individual-purchases.js Changes
```javascript
// Line 4: Fixed import
const { auth, checkRole } = require('../middleware/auth');

// Line 8-9: Added Counter_Agent permission
router.post('/',
  auth,
  checkRole('Flex_Admin', 'Counter_Agent'),  // ← Counter_Agent now allowed!
  ...
);
```
**Fixes:** "Insufficient permissions" when Counter_Agent creates vouchers

### passports.js Changes
```javascript
// Added Counter_Agent to allowed roles
router.post('/',
  auth,
  checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent'),  // ← Counter_Agent added!
  [
    body('passportNo').notEmpty().withMessage('Passport number is required')
    // All other fields are optional now
  ],
  ...
);
```
**Fixes:**
- Counter_Agent can create passports
- Only passport number is required
- All other fields (surname, givenName, etc.) are optional

## After Deployment Test

1. Open frontend: http://localhost:5173
2. Login as Agent (Counter_Agent role)
3. Go to Individual Purchase page
4. Enter passport number
5. Click "Generate Voucher"
6. ✅ Should work without "Insufficient permissions" error!

## File Sizes Reference

To verify upload:
- auth.js: ~6-7 KB
- individual-purchases.js: ~4-5 KB
- passports.js: ~7-8 KB

## Backup Before Upload

CloudPanel usually creates automatic backups, but you can:
1. Download existing files before upload
2. Or rename them: `auth.js` → `auth.js.old`

## If Something Goes Wrong

### Restore Previous Version
1. In File Manager, find backup files (`.old` or CloudPanel backups)
2. Rename back to original name
3. Restart PM2

### Check Logs
```bash
pm2 logs greenpay-api --lines 50
```

Look for:
- Database connection errors
- Module import errors
- Syntax errors

## Alternative: Terminal Upload

If CloudPanel has Terminal:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes

# Backup existing files
cp auth.js auth.js.backup
cp individual-purchases.js individual-purchases.js.backup
cp passports.js passports.js.backup

# Then upload via File Manager
# After upload, restart:
pm2 restart greenpay-api
```

## Summary

**Minimum deployment:**
1. Upload 3 files via CloudPanel File Manager
2. Restart PM2 process `greenpay-api`
3. Test voucher creation
4. ✅ Done!

**Time estimate:** 5-10 minutes

**Risk level:** Low (existing files backed up, can easily rollback)
