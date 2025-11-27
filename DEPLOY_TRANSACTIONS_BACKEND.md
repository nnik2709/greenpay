# Deploy Transactions Backend Route

## Files Changed

### 1. New File: `backend/routes/transactions.js`
- Aggregates data from `individual_purchases` and `corporate_vouchers` tables
- Provides `/api/transactions` endpoint for dashboard analytics

### 2. Modified: `backend/server.js`
- Added transactions route registration

## Manual Deployment Steps

### Option 1: Via CloudPanel File Manager
1. Upload `backend/routes/transactions.js` to:
   ```
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
   ```

2. Upload updated `backend/server.js` to:
   ```
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
   ```

3. SSH to server and restart PM2:
   ```bash
   ssh root@72.61.208.79
   pm2 restart greenpay-api
   pm2 logs greenpay-api --lines 20
   ```

### Option 2: Via SCP (if you have SSH access)
```bash
# From your local machine
scp backend/routes/transactions.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Then SSH and restart
ssh root@72.61.208.79
pm2 restart greenpay-api
```

## Verify Deployment

After restarting PM2, test the endpoint:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://greenpay.eywademo.cloud/api/transactions
```

Or check in browser console after logging in:
```javascript
fetch('https://greenpay.eywademo.cloud/api/transactions', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('greenpay_auth_token')
  }
}).then(r => r.json()).then(console.log)
```

## What This Enables

The dashboard will now display:
- Overall Revenue (from all transactions)
- Today's Revenue
- Card Payments total
- Cash Payments total
- Total Individual Purchases count
- Total Corporate Purchases count
- Charts showing trends over time
- Revenue by nationality breakdown

## Frontend Changes (Already Applied)

The frontend has been updated and will auto-reload in your browser. No deployment needed for frontend during development.
