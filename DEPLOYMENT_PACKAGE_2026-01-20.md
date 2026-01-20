# Deployment Package - 2026-01-20

## ✅ Issue #1: User Registration Fix - READY TO DEPLOY

**Status**: Built and ready for manual deployment

### Files to Deploy

#### Backend File (already on server, no changes needed):
`/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/auth.js`
- ✅ Already deployed and working

#### Frontend Files (need deployment):
**Location**: `dist/` folder contents → Upload to `/var/www/png-green-fees/dist/`

**Method**: Use CloudPanel File Manager

### Deployment Steps

1. **Open CloudPanel**
   - URL: `https://greenpay.eywademo.cloud:8443`
   - Login with your credentials

2. **Backup Current dist/ folder**
   ```bash
   # Via SSH (paste in terminal):
   ssh root@165.22.52.100
   cd /var/www/png-green-fees
   cp -r dist dist-backup-20260120-v2
   ```

3. **Upload New dist/ folder**
   - In CloudPanel File Manager, navigate to `/var/www/png-green-fees/dist`
   - Delete all current contents
   - Upload ALL files from local `/Users/nikolay/github/greenpay/dist/`
   - **Important**: Upload the CONTENTS of dist/, not the dist folder itself

4. **Restart PM2**
   ```bash
   # Via SSH (paste in terminal):
   pm2 restart png-green-fees
   pm2 status
   pm2 logs png-green-fees --lines 50
   ```

5. **Verify**
   - Open https://greenpay.eywademo.cloud
   - Log in as Flex Admin
   - Go to Users page
   - Try creating a new user with any role
   - Should work without errors ✅

### Rollback (if needed)
```bash
ssh root@165.22.52.100
cd /var/www/png-green-fees
rm -rf dist
mv dist-backup-20260120-v2 dist
pm2 restart png-green-fees
```

---

## ✅ Issue #2: Multi-Voucher Wizard - READY TO DEPLOY

**Status**: Built and ready for manual deployment

### Implementation Documents Available

1. **`WIZARD_MVP_READY_TO_IMPLEMENT.md`** ⭐ Start here
   - Step-by-step code to add
   - Copy-paste ready
   - Test cases included

2. **`MULTI_VOUCHER_WIZARD_IMPLEMENTATION.md`**
   - Complete 3-phase plan
   - Backend API specs
   - Bulk actions design

3. **`MULTI_VOUCHER_REGISTRATION_ANALYSIS.md`**
   - Problem analysis
   - User requirements
   - Proposed solution

### When You're Ready to Implement

**Follow these steps:**

1. Open `WIZARD_MVP_READY_TO_IMPLEMENT.md`
2. Follow Step 1-4 to modify `IndividualPurchase.jsx`
3. Test locally: `npm run dev`
4. Build: `npm run build`
5. Deploy same way as Issue #1 above
6. Test with 2-3 voucher batches

**Estimated Time**: 2-3 hours for MVP implementation

**What MVP Does**:
- ✅ "Start Wizard" button (only shows if quantity > 1)
- ✅ Sidebar with voucher status (✅ Registered, ⏳ Pending)
- ✅ Sequential registration wizard
- ✅ Skip functionality
- ✅ Completion summary
- ✅ Return to wizard for skipped vouchers

**What's NOT in MVP** (Phase 2 later):
- ❌ Bulk email/print/download
- ❌ MRZ scanner in wizard
- ❌ Backend API integration for registration
- ❌ Previous button

---

## 📦 What's in Your Repository

### ✅ Completed & Ready
- `backend/routes/auth.js` - Fixed passwordHash references (already deployed)
- `src/lib/usersService.js` - Fixed ROLE_MAP (already built)
- `dist/` folder - Built frontend with user registration fix

### 📋 Documentation Created
- `SESSION_SUMMARY.md` - Today's work summary
- `MULTI_VOUCHER_REGISTRATION_ANALYSIS.md` - Problem analysis
- `MULTI_VOUCHER_WIZARD_IMPLEMENTATION.md` - Full implementation plan
- `WIZARD_MVP_READY_TO_IMPLEMENT.md` - MVP step-by-step guide
- `DEPLOYMENT_PACKAGE_2026-01-20.md` - This file
- `USER_REGISTRATION_FIX_DEPLOYMENT.md` - Earlier deployment notes

### ⏳ Pending Implementation
- Multi-voucher wizard (code in `WIZARD_MVP_READY_TO_IMPLEMENT.md`)
- Bulk actions backend endpoints (specs in `MULTI_VOUCHER_WIZARD_IMPLEMENTATION.md`)

---

## 🎯 Quick Reference

### Current Production Status

**✅ Working:**
- User registration for all 4 roles (Flex_Admin, Finance_Manager, Counter_Agent, IT_Support)
- Individual voucher registration (navigate away workflow)

**⏳ Not Yet Deployed:**
- Multi-voucher wizard
- Bulk email/print/download actions

### Role ID Mappings (Production Database)

```
Role Table:
 id |      name
----+-----------------
  1 | Admin           (legacy, not used)
  2 | Manager         (legacy, not used)
  3 | Agent           (legacy, not used)
  4 | Customer        (legacy, not used)
  5 | IT_Support      ✅ ACTIVE
  6 | Flex_Admin      ✅ ACTIVE
  7 | Finance_Manager ✅ ACTIVE
  8 | Counter_Agent   ✅ ACTIVE
```

**ROLE_MAP in usersService.js:**
```javascript
const ROLE_MAP = {
  'Flex_Admin': 6,
  'Finance_Manager': 7,
  'Counter_Agent': 8,
  'IT_Support': 5
};
```

---

## 🚀 Immediate Action Items

### Right Now - Deploy User Registration Fix

**What you need:**
- Local `dist/` folder (already built)
- CloudPanel access
- SSH access

**Steps:**
1. Backup current dist/
2. Upload new dist/ contents via CloudPanel
3. Restart PM2: `pm2 restart png-green-fees`
4. Test user creation

**Time**: 5-10 minutes

### Later - Implement Multi-Voucher Wizard

**What you need:**
- `WIZARD_MVP_READY_TO_IMPLEMENT.md` (already created)
- Code editor
- 2-3 hours

**Steps:**
1. Follow step-by-step guide in the document
2. Test locally
3. Build and deploy
4. Test with 2-3 voucher batches

---

## 📞 Support

If you encounter any issues:

1. **Check PM2 logs**:
   ```bash
   pm2 logs png-green-fees --lines 100
   pm2 logs greenpay-api --lines 100
   ```

2. **Check browser console** (F12 → Console tab)

3. **Rollback if needed** (commands provided above)

4. **Database verification**:
   ```bash
   sudo -u postgres psql greenpay_db -c "SELECT id, name FROM \"Role\" ORDER BY id;"
   ```

---

**Prepared by**: Claude Code
**Date**: 2026-01-20
**Session**: User Registration Fix + Multi-Voucher Wizard Planning
**Status**: Issue #1 ready for deployment, Issue #2 ready for implementation
