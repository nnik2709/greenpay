# Deploy Backend - Immediate Steps

## Problem Identified
- Two PM2 processes running: `greenpay` (old) and `greenpay-api` (new)
- The old process doesn't have the new transactions route
- Need to clean up and deploy new files

## Steps to Run (In Another Terminal)

### 1. Upload Backend Files

```bash
# Upload new transactions route
scp backend/routes/transactions.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated server.js
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

### 2. SSH to Server

```bash
ssh root@72.61.208.79
```

### 3. On the Server - Clean Up PM2

```bash
# Check what's running
pm2 status

# Stop the old 'greenpay' process
pm2 stop greenpay
pm2 delete greenpay

# Restart the correct 'greenpay-api' process
pm2 restart greenpay-api

# Check logs
pm2 logs greenpay-api --lines 30
```

### 4. Verify It's Working

```bash
# Should return: {"status":"ok","message":"GreenPay API is running"}
curl http://localhost:3001/health

# Exit SSH
exit
```

### 5. Test from Your Machine

```bash
# Test login (use single quotes to avoid shell escaping issues)
curl -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenpay.pg","password":"Admin123!"}'
```

You should see a response with a token and user object.

## Alternative: Use the Deployment Script

Or just run this from your project directory:
```bash
./deploy-transactions.sh
```

## After Deployment

Refresh your browser at http://localhost:3000 and:
1. Login with `admin@greenpay.pg` / `Admin123!`
2. Check the Dashboard
3. Open browser console and run:
   ```javascript
   fetch('https://greenpay.eywademo.cloud/api/transactions', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('greenpay_auth_token')
     }
   }).then(r => r.json()).then(console.log)
   ```

You should see transaction data (or an empty array if no transactions exist yet).
