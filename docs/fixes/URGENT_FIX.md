# URGENT FIX - Table Name Error

## Problem
The server is still using old code with wrong table name `"IndividualPurchase"` instead of `individual_purchases`.

The error shows it's failing at line 130 in the old file.

## Solution

The backend.zip you uploaded has the correct files, but the server might not have extracted them properly or PM2 is still using cached code.

## Fix Steps

### Step 1: Verify file was uploaded correctly
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes
head -150 individual-purchases.js | tail -20
```

Check line 106-120. It should show:
```javascript
INSERT INTO individual_purchases (
```
NOT `"IndividualPurchase"`

### Step 2: If file is wrong, check the backup folder

The old file might still be there. Check:
```bash
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend-backup-*
```

### Step 3: Force reload PM2 with no cache

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 delete greenpay-api
pm2 start server.js --name greenpay-api --no-daemon
```

Wait to see if it starts correctly, then:
```bash
Ctrl+C
pm2 start server.js --name greenpay-api
pm2 save
```

### Step 4: Verify the fix

Test creating a voucher again. The error should be gone.

## Quick Verification Script

Run this to check if the correct file is in place:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes
grep -n "individual_purchases" individual-purchases.js | head -5
```

Should show multiple lines with `individual_purchases` (lowercase with underscore).

If it shows `"IndividualPurchase"` or `IndividualPurchase` (PascalCase), then the file wasn't uploaded correctly.

## Alternative: Manual Upload

If the unzip didn't work properly, manually upload just this one file:

1. In CloudPanel File Manager, navigate to:
   `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

2. Delete or rename existing `individual-purchases.js`:
   - Rename to `individual-purchases.js.old`

3. Upload the new file from:
   `/Users/nikolay/github/greenpay/backend/routes/individual-purchases.js`

4. Restart PM2:
   ```bash
   pm2 restart greenpay-api
   ```

## Check Current Code

To see what's actually running, check this line:

```bash
sed -n '106,120p' /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
```

This will show lines 106-120 where the INSERT statement is.

**Correct output should be:**
```sql
INSERT INTO individual_purchases (
  voucher_code,
  passport_id,
  ...
```

**Wrong output would be:**
```sql
INSERT INTO "IndividualPurchase" (
```

Let me know what you see!
