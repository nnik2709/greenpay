# Deploy Security Fixes - Quick Guide

**Date:** December 19, 2024
**Priority:** HIGH
**Time Required:** 5 minutes

---

## Files to Update on Server

### 1. Update server.js (Localhost binding fix)

**File:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js`

**Line 91-93, Change from:**
```javascript
// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
```

**To:**
```javascript
// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1'; // Listen on localhost only for security

app.listen(PORT, HOST, () => {
```

**Line 96-99, Change from:**
```javascript
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                       ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV}          ║`);
  console.log(`║   Database: ${process.env.DB_NAME}            ║`);
```

**To:**
```javascript
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Host: ${HOST}                    ║`);
  console.log(`║   Port: ${PORT}                       ║`);
  console.log(`║   Environment: ${process.env.NODE_ENV}          ║`);
  console.log(`║   Database: ${process.env.DB_NAME}            ║`);
```

---

## Quick Deployment Commands

```bash
# Connect to server
ssh root@165.22.52.100

# 1. FIX .env PERMISSIONS (CRITICAL - 30 seconds)
chmod 600 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
# Should show: -rw-------

# 2. UPDATE server.js (2 minutes)
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano server.js
# Make the changes shown above
# Save: Ctrl+O, Enter, Ctrl+X

# 3. RESTART BACKEND (10 seconds)
pm2 restart greenpay-api

# 4. VERIFY FIX (30 seconds)
sleep 3
netstat -tulpn | grep 3001
# Should show: 127.0.0.1:3001 (NOT :::3001)

# If still shows :::3001, check PM2 logs:
pm2 logs greenpay-api --lines 20
# Should see: Host: 127.0.0.1
```

---

## Expected Results

### BEFORE Fix:
```bash
tcp6  0  0 :::3001  :::*  LISTEN  997839/node
```
☠️ **INSECURE** - Exposed to network

### AFTER Fix:
```bash
tcp   0  0 127.0.0.1:3001  0.0.0.0:*  LISTEN  123456/node
```
✅ **SECURE** - Localhost only

---

## Additional Security Fixes (Run After)

```bash
# Apply pending security updates (15 minutes)
sudo apt-get update
sudo apt-get upgrade -y

# Check results
apt-get -s upgrade | grep -P '^\d+ upgraded'
# Should show: 0 upgraded
```

---

## Verification Checklist

After deployment, verify:

```bash
# 1. .env permissions
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
# Expected: -rw------- (600)

# 2. Node.js localhost binding
netstat -tulpn | grep 3001
# Expected: 127.0.0.1:3001

# 3. Backend running
pm2 status
# Expected: greenpay-api | online

# 4. Application working
curl -I https://greenpay.eywademo.cloud
# Expected: HTTP/2 200

# 5. Backend not accessible externally
curl -I http://165.22.52.100:3001
# Expected: Connection refused (GOOD!)
```

---

## Troubleshooting

### Issue: Backend won't start after changes

```bash
# Check syntax error
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
node -c server.js

# Check PM2 logs
pm2 logs greenpay-api --err --lines 50

# Revert if needed
pm2 restart greenpay-api
```

### Issue: Application not accessible

```bash
# Check Nginx is proxying correctly
curl -I https://greenpay.eywademo.cloud
nginx -t

# Check backend is responding on localhost
curl http://127.0.0.1:3001/api/health
```

---

## Rollback Plan

If something breaks:

```bash
# Restore original server.js
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Change back to:
nano server.js
# Line 93: Remove HOST binding
# app.listen(PORT, () => {

pm2 restart greenpay-api
```

---

## Summary

**What This Fixes:**
- ✅ Node.js backend exposed to network → Localhost only
- ✅ .env file world-readable → Owner-only
- ✅ 44 pending security updates → Up to date

**Impact:**
- **Zero downtime** - PM2 restart takes ~2 seconds
- **Improved security** - Eliminates direct backend access
- **BSP compliance** - Meets banking security requirements

**Time Required:**
- .env fix: 30 seconds
- server.js update: 2 minutes
- Security updates: 15 minutes
- **Total: ~18 minutes**

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
