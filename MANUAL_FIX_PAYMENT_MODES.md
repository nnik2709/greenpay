# Manual Fix for Payment Modes 500 Error

## Problem
Getting 500 error on `/api/payment-modes` endpoint. Likely causes:
1. PaymentMode table doesn't exist in database
2. payment-modes.js route file not on server
3. Route not registered in server.js

## Solution Steps

### Step 1: Copy files to server

Run these commands on your Mac (you'll need to enter password after SSH key):

```bash
# Copy payment-modes.js route file
scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/payment-modes.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js

# Copy SQL file
scp -i ~/.ssh/nikolay /Users/nikolay/github/greenpay/create-payment-modes-table.sql root@72.61.208.79:/tmp/create-payment-modes-table.sql
```

### Step 2: SSH to server

```bash
ssh -i ~/.ssh/nikolay root@72.61.208.79
```
(Enter password when prompted)

### Step 3: Create the PaymentMode table

On the server, run:

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/create-payment-modes-table.sql
```

This will:
- Create the PaymentMode table if it doesn't exist
- Grant permissions to greenpay_user
- Insert 3 default payment modes (CASH, EFTPOS, BANK TRANSFER)
- Show you the current payment modes

### Step 4: Verify payment-modes.js file exists

```bash
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js
```

If file doesn't exist, you need to run the scp command from Step 1 again.

### Step 5: Register route in server.js

Check if route is already registered:

```bash
grep "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
```

If nothing shows up, edit server.js:

```bash
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
```

Find the line with settings route (should look like):
```javascript
app.use('/api/settings', require('./routes/settings'));
```

Add this line RIGHT AFTER it:
```javascript
app.use('/api/payment-modes', require('./routes/payment-modes'));
```

Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

### Step 6: Restart backend

```bash
pm2 restart greenpay-api
```

### Step 7: Check logs

```bash
pm2 logs greenpay-api --lines 30
```

Look for:
- ✅ "Server running on port 5000" - good
- ❌ Any error messages about payment-modes or PaymentMode table

### Step 8: Test the endpoint

While still on server:

```bash
# Test if endpoint responds (should get 401 without token)
curl https://greenpay.eywademo.cloud/api/payment-modes
```

Expected: `{"error":"No token provided"}` - this is GOOD, means route is working

If you get 404 or 500, check logs again.

### Step 9: Test from frontend

Go to https://greenpay.eywademo.cloud/purchases and check browser console.

- ✅ Should load payment modes without errors
- ❌ If still 500 error, check PM2 logs for database errors

## Quick Verification Checklist

On the server, run:

```bash
# 1. Check table exists
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT COUNT(*) FROM \"PaymentMode\";"

# 2. Check file exists
ls -l /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js

# 3. Check route registered
grep "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js

# 4. Check backend status
pm2 status greenpay-api
```

All should return success.

## If Still Not Working

Get the exact error from PM2 logs:

```bash
pm2 logs greenpay-api --lines 50
```

Look for lines with "Error" or "payment-modes" and send me the output.
