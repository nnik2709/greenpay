# Manual Deployment Steps for GreenPay

## Prerequisites
✅ Production build completed (`npm run build`)
✅ Backend server running with password reset API
✅ SSH access to 72.61.208.79

## Deployment Commands

Run these commands **from your local machine** (not from SSH session):

```bash
# 1. Navigate to project directory
cd /Users/nikolay/github/greenpay

# 2. Backup current deployment (optional but recommended)
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && mkdir -p backups && tar -czf backups/frontend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || true"

# 3. Copy new build files to server
scp -r dist/* root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/

# 4. Set proper permissions
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && chown -R eywademo-greenpay:eywademo-greenpay assets index.html && chmod -R 755 assets && chmod 644 index.html"

# 5. Verify deployment
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/"
```

## What's Included in This Deployment

### Frontend Changes:
- ✅ Fixed user management page (property name consistency)
- ✅ Fixed purchases page (removed undefined functions)
- ✅ Migrated storage service from Supabase to backend API
- ✅ Added password reset API client methods
- ✅ Cleaned up console errors (filtered expected 404s)
- ✅ Updated all service files for PostgreSQL migration

### Backend Changes (Already Deployed):
- ✅ Password reset API endpoints (`/api/auth/request-password-reset`, `/api/auth/verify-reset-token`, `/api/auth/reset-password`)
- ✅ Database columns added (`reset_token`, `reset_token_expiry`)
- ✅ CORS configuration fixed
- ✅ `nodemailer` and `bcrypt` installed

## Post-Deployment Testing

### 1. Basic Functionality
```bash
# Test if site loads
curl -I https://greenpay.eywademo.cloud

# Should return: HTTP/2 200
```

### 2. Browser Testing
1. Open https://greenpay.eywademo.cloud in an **incognito/private window**
2. Check browser console - should be clean (no red errors)
3. Log in with existing credentials
4. Test these pages:
   - Dashboard (http://localhost:3000/)
   - Users page (http://localhost:3000/users)
   - Passports page
   - Purchases page

### 3. Specific Feature Testing

**Users Page:**
- Should load without blank screen
- User roles should display correctly (no "Cannot read properties of undefined")
- Active/Inactive status should show properly

**Purchases Page:**
- Should load without "setCardNumber is not defined" error
- POS terminal payment should work

**Console Errors:**
- Transaction 404 errors should be filtered (not shown)
- Only meaningful errors should appear

### 4. Password Reset API Testing

**Note:** Email functionality requires SMTP configuration (see `PRODUCTION_SMTP_SETUP.md`)

Test API endpoints directly:
```bash
# 1. Request password reset
curl -X POST https://greenpay.eywademo.cloud/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: {"message":"Password reset email sent"}

# 2. Check server logs for reset token
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 30"

# 3. Verify reset token (use token from logs)
curl -X POST https://greenpay.eywademo.cloud/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_LOGS"}'

# Expected: {"valid":true}

# 4. Reset password (use token from logs)
curl -X POST https://greenpay.eywademo.cloud/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_LOGS","newPassword":"NewPassword123!"}'

# Expected: {"message":"Password reset successful"}
```

## Rollback Procedure (If Needed)

If something goes wrong:

```bash
# 1. SSH into server
ssh root@72.61.208.79

# 2. List available backups
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backups/

# 3. Restore from backup (replace with your backup filename)
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
rm -rf assets index.html
tar -xzf backups/frontend-backup-YYYYMMDD-HHMMSS.tar.gz

# 4. Set permissions
chown -R eywademo-greenpay:eywademo-greenpay assets index.html
chmod -R 755 assets
chmod 644 index.html
```

## Troubleshooting

### Issue: Blank pages after deployment
**Solution:**
```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or test in incognito/private window
```

### Issue: 404 errors for assets
**Solution:**
```bash
# Check file permissions
ssh root@72.61.208.79 "ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/"

# Files should be owned by eywademo-greenpay:eywademo-greenpay
# Assets folder: 755, index.html: 644
```

### Issue: API errors
**Solution:**
```bash
# Check backend is running
ssh root@72.61.208.79 "pm2 status"

# View backend logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 50"

# Restart backend if needed
ssh root@72.61.208.79 "pm2 restart greenpay-api"
```

### Issue: CORS errors
**Solution:**
```bash
# Already fixed in backend server.js
# If still occurring, check CORS configuration in .env:
ssh root@72.61.208.79 "cat /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env | grep ALLOWED_ORIGINS"

# Should include: https://greenpay.eywademo.cloud,http://localhost:3000,http://localhost:5173
```

## Files Changed in This Deployment

### Frontend (`dist/assets/*.js`):
- `Users-*.js` - Fixed role/active property handling
- `Purchases-*.js` - Removed undefined setCardNumber calls
- `Dashboard-*.js` - Cleaned up transaction error logging
- `storageService` - Migrated to backend API uploads
- `api/client.js` - Added password reset methods
- Multiple service files - PostgreSQL migration updates

### Backend (Already deployed):
- `routes/auth.js` - Complete password reset implementation
- `server.js` - Fixed duplicate CORS declaration
- Database: `User` table - Added reset token columns

## Success Criteria

✅ Site loads at https://greenpay.eywademo.cloud
✅ No blank pages (especially Users page)
✅ No "Cannot read properties of undefined" errors
✅ No "setCardNumber is not defined" errors
✅ Console shows minimal errors (no transaction 404 spam)
✅ Backend API responds correctly
✅ Password reset API endpoints available (POST /api/auth/request-password-reset, etc.)

## Next Steps After Deployment

1. **Configure Email (when ready):**
   - See `PRODUCTION_SMTP_SETUP.md` for complete guide
   - Choose email provider (Gmail, SendGrid, AWS SES)
   - Update .env with SMTP credentials
   - Test password reset flow end-to-end

2. **Monitor Production:**
   ```bash
   # Watch backend logs
   ssh root@72.61.208.79 "pm2 logs greenpay-api"

   # Check for errors
   ssh root@72.61.208.79 "pm2 logs greenpay-api --err"
   ```

3. **Performance Testing:**
   - Test with multiple concurrent users
   - Verify database queries are efficient
   - Monitor server resources (CPU, memory)

## Summary

This deployment includes all PostgreSQL migration fixes, console error cleanup, and password reset API foundation. The only remaining task is SMTP configuration for sending password reset emails (see `PRODUCTION_SMTP_SETUP.md`).

**Deployment Time:** ~5 minutes
**Downtime:** None (files are copied while site is live)
**Risk Level:** Low (backup created before deployment)

---

**Need help?** Check server logs or PM2 status if issues occur.
