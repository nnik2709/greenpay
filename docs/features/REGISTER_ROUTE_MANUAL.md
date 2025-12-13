# How to Register Vouchers Route - Manual Steps

## Overview
You need to add one line to `server.js` to register the vouchers API route.

---

## Option 1: Automated Script (Recommended)

Run this command from your local machine:

```bash
./register-vouchers-route.sh
```

This will:
1. Check if route is already registered
2. Create a backup of server.js
3. Add the vouchers route
4. Restart the backend
5. Show you all registered routes

---

## Option 2: Manual Steps

### Step 1: SSH into Server

```bash
ssh root@72.61.208.79
```

### Step 2: Navigate to Backend Directory

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
```

### Step 3: Check Current Routes

First, see what routes are already registered:

```bash
grep "app.use('/api" server.js
```

You should see something like:
```javascript
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/passports', require('./routes/passports'));
app.use('/api/payment-modes', require('./routes/payment-modes'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/settings', require('./routes/settings'));
```

### Step 4: Check if Vouchers Route Already Exists

```bash
grep "vouchers" server.js
```

If something shows up, **STOP** - the route is already registered. Skip to Step 8.

### Step 5: Backup server.js

Always backup before editing:

```bash
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
```

Verify backup was created:
```bash
ls -lh server.js.backup.*
```

### Step 6: Edit server.js

Open the file in nano:

```bash
nano server.js
```

### Step 7: Add the Vouchers Route

Find the line that says:
```javascript
app.use('/api/tickets', require('./routes/tickets'));
```

**Right after that line**, add this new line:
```javascript
app.use('/api/vouchers', require('./routes/vouchers'));
```

It should look like this:
```javascript
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/vouchers', require('./routes/vouchers'));  // <-- Add this line
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` (to confirm)
- Press `Enter` (to save)

### Step 8: Verify the Route Was Added

```bash
grep "vouchers" server.js
```

You should see:
```javascript
app.use('/api/vouchers', require('./routes/vouchers'));
```

### Step 9: Restart Backend

```bash
pm2 restart greenpay-api
```

### Step 10: Check Backend Status

```bash
pm2 status greenpay-api
```

You should see status: **online** ✅

Check logs to ensure no errors:
```bash
pm2 logs greenpay-api --lines 20
```

---

## Verify It's Working

### Test from Server

```bash
# Get a valid JWT token first by logging in
curl -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenpay.pg","password":"Admin123!"}'

# Copy the token from the response, then test:
curl -X GET https://greenpay.eywademo.cloud/api/vouchers/validate/TEST123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response (voucher not found):
```json
{
  "type": "error",
  "status": "error",
  "message": "Voucher code not found."
}
```

---

## Troubleshooting

### ❌ Error: "Cannot find module './routes/vouchers'"

**Problem:** The vouchers.js file doesn't exist

**Solution:** Upload the file first:
```bash
# Check if file exists
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js

# If not, upload it (from your local machine):
scp /Users/nikolay/github/greenpay/backend/routes/vouchers.js \
  root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
```

### ❌ Backend Won't Start

**Check PM2 logs:**
```bash
pm2 logs greenpay-api --lines 50
```

**Common issues:**
- Syntax error in server.js (restore from backup)
- Missing vouchers.js file (upload it)
- Database connection issues (check .env)

**Restore backup if needed:**
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
ls -lh server.js.backup.*  # Find latest backup
cp server.js.backup.YYYYMMDD_HHMMSS server.js  # Restore
pm2 restart greenpay-api
```

### ❌ Route Returns 404

**Check route is registered:**
```bash
grep "vouchers" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
```

**Check backend is running:**
```bash
pm2 status greenpay-api
```

---

## What You Should See

**Before registering route:**
```bash
curl https://greenpay.eywademo.cloud/api/vouchers/validate/TEST
# Returns: 404 or "Route not found"
```

**After registering route:**
```bash
curl https://greenpay.eywademo.cloud/api/vouchers/validate/TEST -H "Authorization: Bearer TOKEN"
# Returns: JSON with validation result
```

---

## Summary

You only need to add **ONE LINE** to server.js:
```javascript
app.use('/api/vouchers', require('./routes/vouchers'));
```

Put it right after the tickets route line, save, and restart PM2.

That's it! ✅
