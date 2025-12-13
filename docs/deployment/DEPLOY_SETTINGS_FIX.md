# Deploy Settings Page Fix

The Settings page was trying to use Supabase RPC functions. This has been fixed to use the PostgreSQL backend API instead.

## Changes Made (Local):
1. ✅ Updated `src/lib/api/client.js` - Added settings API methods
2. ✅ Updated `src/pages/admin/SettingsRPC.jsx` - Migrated from Supabase to backend API
3. ✅ Created backend route: `backend/routes/settings.js`
4. ✅ Created database migration: `create-settings-table.sql`

## Deployment Steps:

### Step 1: Create SystemSettings Table in Database

SSH into server and run:

```bash
ssh -i ~/.ssh/nikolay root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
```

Create the SQL file:

```bash
cat > /tmp/create-settings-table.sql << 'EOF'
-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  id SERIAL PRIMARY KEY,
  "voucherValidityDays" INTEGER NOT NULL DEFAULT 30,
  "defaultAmount" DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO "SystemSettings" ("voucherValidityDays", "defaultAmount", "createdAt", "updatedAt")
VALUES (30, 50.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON "SystemSettings" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "SystemSettings_id_seq" TO greenpay_user;
EOF
```

Run the migration:

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/create-settings-table.sql
```

Verify table was created:

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT * FROM \"SystemSettings\";"
```

### Step 2: Create Backend Settings Route

Still on server:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes
```

Create the settings route file:

```bash
cat > settings.js << 'EOF'
// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "SystemSettings" ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        voucherValidityDays: 30,
        defaultAmount: 50.00,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { voucher_validity_days, default_amount } = req.body;

    // Check if settings exist
    const existing = await db.query('SELECT id FROM "SystemSettings" LIMIT 1');

    if (existing.rows.length === 0) {
      // Insert new settings
      const result = await db.query(
        `INSERT INTO "SystemSettings"
         ("voucherValidityDays", "defaultAmount", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [voucher_validity_days, default_amount]
      );
      return res.json(result.rows[0]);
    } else {
      // Update existing settings
      const result = await db.query(
        `UPDATE "SystemSettings"
         SET "voucherValidityDays" = $1,
             "defaultAmount" = $2,
             "updatedAt" = NOW()
         WHERE id = $3
         RETURNING *`,
        [voucher_validity_days, default_amount, existing.rows[0].id]
      );
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
EOF
```

### Step 3: Register the Settings Route in server.js

Edit server.js to add the settings route:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
```

Check current routes:

```bash
grep "app.use('/api" server.js
```

Add the settings route after the other routes (you can use nano or vi):

```bash
nano server.js
```

Add this line with the other route registrations:

```javascript
app.use('/api/settings', require('./routes/settings'));
```

Save and exit (Ctrl+X, Y, Enter for nano).

### Step 4: Restart Backend

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

Verify no errors in logs.

### Step 5: Deploy Updated Frontend

From your Mac, rebuild and deploy:

```bash
cd /Users/nikolay/github/greenpay
npm run build
rsync -avz -e "ssh -i ~/.ssh/nikolay" /Users/nikolay/github/greenpay/dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

Then on server, set permissions:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
chown -R eywademo-greenpay:eywademo-greenpay assets index.html
chmod -R 755 assets && chmod 644 index.html
```

### Step 6: Test

1. Open: https://greenpay.eywademo.cloud/admin/settings
2. Page should load without errors
3. You should see:
   - Voucher Validity (Days): 30
   - Default Amount (PGK): 50.00
4. Try changing a value and click "Save Settings"
5. Should show success message

## Quick Deploy Script (All Steps)

```bash
# On server
ssh -i ~/.ssh/nikolay root@72.61.208.79

# Create database table
cat > /tmp/settings-migration.sql << 'EOF'
CREATE TABLE IF NOT EXISTS "SystemSettings" (
  id SERIAL PRIMARY KEY,
  "voucherValidityDays" INTEGER NOT NULL DEFAULT 30,
  "defaultAmount" DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO "SystemSettings" ("voucherValidityDays", "defaultAmount")
VALUES (30, 50.00) ON CONFLICT DO NOTHING;
GRANT SELECT, INSERT, UPDATE ON "SystemSettings" TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE "SystemSettings_id_seq" TO greenpay_user;
EOF

PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/settings-migration.sql

# Copy settings route (upload the file from local or create it on server as shown in Step 2)

# Add to server.js (manual step - see Step 3)

# Restart backend
pm2 restart greenpay-api

# Exit server, then from Mac:
# npm run build && rsync deployment
```

## Verification

Check backend logs for errors:
```bash
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 logs greenpay-api --lines 50"
```

Test settings API directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://greenpay.eywademo.cloud/api/settings
```

## Files Created Locally

- `/Users/nikolay/github/greenpay/backend-settings-route.js` - Backend route code
- `/Users/nikolay/github/greenpay/create-settings-table.sql` - Database migration
- Updated: `src/lib/api/client.js`
- Updated: `src/pages/admin/SettingsRPC.jsx`
