# Manual Deployment Package - Security Fixes

**Date:** December 19, 2024
**Files to Deploy:** 2 files
**Time Required:** 2 minutes

---

## Files Changed in This Deployment

### 1. backend/server.js
**Purpose:** Restrict Node.js backend to localhost only (security fix)
**Changes:** Added HOST binding to 127.0.0.1

### 2. backend/services/payment-gateways/BSPGateway.js
**Purpose:** Enable currency testing capability for DOKU
**Changes:** Added BSP_DOKU_TEST_CURRENCY environment variable support

---

## Deployment Steps

### Step 1: Connect to Server
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
```

### Step 2: Pull Latest Changes
```bash
git pull origin main
```

This will update:
- ✅ `backend/server.js` (localhost binding)
- ✅ `backend/services/payment-gateways/BSPGateway.js` (currency testing)

### Step 3: Restart Backend
```bash
pm2 restart greenpay-api
```

### Step 4: Verify Deployment
```bash
# Check Node.js is now localhost-only
netstat -tulpn | grep 3001
# Expected: 127.0.0.1:3001 (NOT :::3001)

# Check backend is running
pm2 status

# Check application is accessible
curl -I https://greenpay.eywademo.cloud
# Expected: HTTP/2 200
```

---

## Expected Results

### BEFORE:
```bash
tcp6  0  0 :::3001  :::*  LISTEN      # EXPOSED TO NETWORK ❌
```

### AFTER:
```bash
tcp   0  0 127.0.0.1:3001  0.0.0.0:*  LISTEN      # LOCALHOST ONLY ✅
```

---

## Verification Commands

```bash
# Full verification
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

echo "=== Deployment Verification ==="
echo ""

echo "1. Git status:"
git log -1 --oneline

echo ""
echo "2. Node.js port binding:"
netstat -tulpn | grep 3001

echo ""
echo "3. Backend status:"
pm2 status greenpay-api

echo ""
echo "4. Application health:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://greenpay.eywademo.cloud

echo ""
echo "5. .env permissions:"
ls -la .env | awk '{print $1, $3, $4, $9}'

echo ""
echo "6. DOKU firewall:"
ufw status | grep -E "103.10.130|147.139.130"
```

---

## Rollback Plan (If Needed)

```bash
# If something breaks, rollback:
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git log -5 --oneline
git reset --hard <previous-commit-hash>
pm2 restart greenpay-api
```

---

## What This Fixes

✅ **Security:** Node.js backend no longer exposed to network
✅ **Security:** .env file already secured (permissions: 600)
✅ **Security:** Updates already applied (6 remaining are safe)
✅ **Feature:** Currency testing capability for DOKU diagnostics
✅ **Compliance:** Meets BSP banking security requirements

---

## Summary

**Commands to run:**
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git pull origin main
pm2 restart greenpay-api
netstat -tulpn | grep 3001
```

**Total time:** ~2 minutes
**Downtime:** ~3 seconds (PM2 restart)
**Risk:** Very low (can rollback with git reset)

---

**Document Version:** 1.0
**Last Updated:** December 19, 2024
**Ready for Deployment:** ✅ YES
