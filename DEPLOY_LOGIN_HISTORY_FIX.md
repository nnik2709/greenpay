# Deploy Login History Fix - 403 Error Resolution

## Issue Found

The `checkRole` middleware in `backend/routes/login-events.js` was incorrectly passing roles as an array `['Flex_Admin', 'IT_Support']` instead of individual arguments `'Flex_Admin', 'IT_Support'`.

This has been fixed in the local code.

## Deployment Instructions

### Step 1: Upload Fixed Backend File

In **another terminal**, run this command:

```bash
scp /Users/nikolay/github/greenpay/backend/routes/login-events.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

### Step 2: Restart PM2

```bash
ssh root@72.61.208.79
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 30
```

Look for the startup message confirming the login-events route is registered.

### Step 3: Test the Endpoint

After PM2 restarts, refresh your localhost:3000 page and navigate to the Login History page.

You should now be able to see login events without the 403 Forbidden error.

## What Was Wrong

**Before:**
```javascript
router.get('/', auth, checkRole(['Flex_Admin', 'IT_Support']), async (req, res) => {
```

**After:**
```javascript
router.get('/', auth, checkRole('Flex_Admin', 'IT_Support'), async (req, res) => {
```

The `checkRole` middleware is defined as:
```javascript
const checkRole = (...roles) => {
  // roles is already an array from spread operator
  // so we should pass individual strings, not an array
}
```

When we passed `['Flex_Admin', 'IT_Support']`, the middleware received `[['Flex_Admin', 'IT_Support']]` which didn't match the user's role.

## Verification

Once deployed, you should see:
- Login History page loads without 403 errors
- Login events are displayed in the table
- You can filter by user, search, and change entries per page

If you still see errors, check PM2 logs for any startup errors:
```bash
pm2 logs greenpay-api --lines 50
```
