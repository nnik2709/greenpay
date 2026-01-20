# User Registration Fix - Deployment Instructions

**Date**: 2026-01-20
**Issue**: Flex Admin cannot create new users - "Role ID is required" validation error
**Fix**: Added role name to ID mapping in frontend service layer

## Problem Analysis

The backend `/api/auth/register` endpoint expects `roleId` (integer) but the frontend was sending `role` (string).

**Error Message**:
```
POST https://greenpay.eywademo.cloud/api/auth/register 400 (Bad Request)
{"error":"Validation failed","details":[{"type":"field","msg":"Role ID is required","path":"roleId","location":"body"}]}
```

## Solution

Added role name to ID mapping in `src/lib/usersService.js`:

```javascript
// Role name to ID mapping (matches database Role table)
const ROLE_MAP = {
  'Flex_Admin': 1,
  'Finance_Manager': 2,
  'Counter_Agent': 3,
  'IT_Support': 4
};
```

Modified `createUser()` and `updateUser()` functions to convert role names to IDs before sending to backend.

## Files Changed

- `src/lib/usersService.js` - Added ROLE_MAP and updated createUser/updateUser functions

## Deployment Steps

### 1. Upload Built Files to Production Server

The frontend has been built locally. Upload the `dist/` folder contents to production:

**Via CloudPanel File Manager:**
1. Open CloudPanel at `https://greenpay.eywademo.cloud:8443`
2. Navigate to File Manager
3. Go to `/var/www/png-green-fees/dist`
4. **BACKUP** current dist folder first (rename to `dist-backup-20260120`)
5. Delete contents of current `dist/` folder
6. Upload entire contents of local `dist/` folder (all files from `/Users/nikolay/github/greenpay/dist/`)

**OR via SCP (if available):**
```bash
# From local machine
cd /Users/nikolay/github/greenpay
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
```

### 2. Restart Frontend PM2 Process

**Via SSH Terminal** (paste these commands):
```bash
ssh root@165.22.52.100

# Restart frontend
pm2 restart png-green-fees

# Verify it's running
pm2 status

# Check logs for any errors
pm2 logs png-green-fees --lines 50
```

### 3. Test the Fix

1. Log in as **Flex_Admin** user
2. Navigate to **Users** page
3. Click **ADD USER** button
4. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: (8+ chars, uppercase, digit, special char)
   - Role: Select any role (Flex Admin, Finance Manager, Counter Agent, IT Support)
5. Click **Add User**
6. **Expected**: User should be created successfully with message "User Added!"
7. **Previous Error**: "Validation failed: Role ID is required" should NO LONGER occur

### 4. Verification Checklist

- [ ] Frontend files uploaded to `/var/www/png-green-fees/dist`
- [ ] PM2 process restarted successfully (`pm2 restart png-green-fees`)
- [ ] Website loads at https://greenpay.eywademo.cloud
- [ ] Login as Flex_Admin works
- [ ] Can access Users page
- [ ] Can click "ADD USER" button
- [ ] Form opens correctly
- [ ] **Can successfully create a new user** (all roles work: Flex_Admin, Finance_Manager, Counter_Agent, IT_Support)
- [ ] No console errors in browser DevTools

## Rollback Plan (If Needed)

If the fix causes issues:

```bash
ssh root@165.22.52.100

# Restore backup
cd /var/www/png-green-fees
rm -rf dist
mv dist-backup-20260120 dist

# Restart
pm2 restart png-green-fees
```

## Notes

- This fix is **frontend-only**, no backend or database changes required
- No data migration needed
- Safe to deploy during business hours
- **Estimated downtime**: <30 seconds (during PM2 restart)

## Related Issue #2 (Still Pending)

**Multi-voucher registration flow issue** - When purchasing multiple vouchers (>1), after registering the first passport, remaining vouchers disappear. This requires a separate fix with an N-step wizard implementation.

---

**Status**: ✅ Built and ready for deployment
**Next Step**: Upload dist/ folder and restart PM2 (see steps above)
