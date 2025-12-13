# Deploy Vouchers API - Manual Steps

## Overview
This guide will help you deploy the new vouchers validation API endpoint that replaces Supabase with PostgreSQL for the /scan feature.

## Files Ready for Deployment

### Local File Location:
```
/Users/nikolay/github/greenpay/backend/routes/vouchers.js
```

### Destination on Server:
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
```

## Step 1: Upload vouchers.js

### Option A: Using SCP (if you have SSH key access)
```bash
scp /Users/nikolay/github/greenpay/backend/routes/vouchers.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
```

### Option B: Copy Content Manually
1. SSH into the server:
   ```bash
   ssh root@72.61.208.79
   ```

2. Create the file:
   ```bash
   nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
   ```

3. Copy the entire content from `/Users/nikolay/github/greenpay/backend/routes/vouchers.js` and paste it into nano

4. Save and exit (Ctrl+X, then Y, then Enter)

## Step 2: Register Route in server.js

1. SSH into the server (if not already):
   ```bash
   ssh root@72.61.208.79
   ```

2. Navigate to backend directory:
   ```bash
   cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
   ```

3. Check if vouchers route is already registered:
   ```bash
   grep "vouchers" server.js
   ```

4. If nothing shows up, edit server.js:
   ```bash
   nano server.js
   ```

5. Find the line with tickets route (should look like):
   ```javascript
   app.use('/api/tickets', require('./routes/tickets'));
   ```

6. Add this line RIGHT AFTER the tickets route:
   ```javascript
   app.use('/api/vouchers', require('./routes/vouchers'));
   ```

7. Save and exit (Ctrl+X, then Y, then Enter)

## Step 3: Verify Route Registration

Check that the route was added correctly:
```bash
grep "app.use('/api" server.js
```

You should see:
```javascript
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/passports', require('./routes/passports'));
app.use('/api/payment-modes', require('./routes/payment-modes'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/vouchers', require('./routes/vouchers'));  // <-- New line
app.use('/api/settings', require('./routes/settings'));
```

## Step 4: Restart Backend API

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api
```

Check status:
```bash
pm2 status greenpay-api
pm2 logs greenpay-api --lines 20
```

## Step 5: Test the API

### Test with a valid token:
```bash
# Replace YOUR_TOKEN with actual JWT token from login
curl -X GET \
  https://greenpay.eywademo.cloud/api/vouchers/validate/TEST123 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Expected responses:
- **Voucher not found:**
  ```json
  {
    "type": "error",
    "status": "error",
    "message": "Voucher code not found."
  }
  ```

- **Valid voucher:**
  ```json
  {
    "type": "voucher",
    "status": "success",
    "message": "Individual voucher is valid and ready to use!",
    "data": { ... }
  }
  ```

- **Used voucher:**
  ```json
  {
    "type": "voucher",
    "status": "error",
    "message": "Individual voucher has already been used on ...",
    "data": { ... }
  }
  ```

## Troubleshooting

### Error: "Cannot find module './routes/vouchers'"
- Check that vouchers.js file exists in routes directory:
  ```bash
  ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
  ```

### Error: "Route not found"
- Verify route is registered in server.js:
  ```bash
  grep "vouchers" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
  ```

### Error: Database connection issues
- Check backend logs:
  ```bash
  pm2 logs greenpay-api --lines 50
  ```

## What This API Does

The `/api/vouchers/validate/:code` endpoint:

1. **Accepts:** Voucher code as URL parameter
2. **Searches:** Both IndividualPurchase and CorporateVoucher tables
3. **Validates:**
   - Code exists
   - Not already used (usedAt is NULL)
   - Not expired (validUntil > now)
4. **Returns:** JSON with validation result

This replaces the Supabase queries in the frontend with PostgreSQL API calls.

## Success Criteria

✅ vouchers.js file uploaded to server
✅ Route registered in server.js
✅ Backend restarted without errors
✅ Test API call returns proper JSON response
✅ Frontend /scan page can validate vouchers

## Next Steps

After successful backend deployment:
1. Build updated frontend (npm run build)
2. Deploy frontend build to server
3. Test /scan page with QR codes
4. Verify green/red flash and sounds work on mobile
