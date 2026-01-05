# Database Migrations - Deployment Guide

## Issue
You encountered permission errors because the tables are owned by `postgres` user, but you tried to run migrations as `greenpay_user`.

**Error Messages:**
- `ERROR: must be owner of table individual_purchases`
- `ERROR: must be owner of table settings`

## Solution
Run the migrations as the `postgres` superuser, which will:
1. Add the missing `card_last_four` column
2. Change table ownership to `greenpay_user`
3. Fix RLS policies for settings table
4. Grant proper permissions

---

## Step-by-Step Deployment

### Step 1: Backup Database (CRITICAL!)

```bash
# SSH to server
ssh root@165.22.52.100

# Create backup directory
mkdir -p /var/www/greenpay/backups

# Backup entire database
PGPASSWORD='your_postgres_password' pg_dump -h localhost -U postgres greenpay_db > /var/www/greenpay/backups/greenpay_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh /var/www/greenpay/backups/
```

### Step 2: Upload Migration File to Server

```bash
# From your local machine, upload the migration file
scp database/migrations/APPLY_AS_POSTGRES.sql root@165.22.52.100:/var/www/greenpay/database/migrations/

# Or if database/migrations folder doesn't exist on server, create it first:
ssh root@165.22.52.100 "mkdir -p /var/www/greenpay/database/migrations"
scp database/migrations/APPLY_AS_POSTGRES.sql root@165.22.52.100:/var/www/greenpay/database/migrations/
```

### Step 3: Find Your Postgres Password

```bash
# SSH to server
ssh root@165.22.52.100

# Check common locations for postgres password
cat /var/www/greenpay/.env | grep -i postgres
cat /var/www/greenpay/backend/.env | grep -i postgres

# Or check if it's in the home directory
cat ~/.pgpass

# If you can't find it, you may need to reset it or use peer authentication
```

### Step 4: Run Migration as Postgres User

**Option A: If you know the postgres password**

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to migrations directory
cd /var/www/greenpay/database/migrations

# Run migration as postgres user
PGPASSWORD='your_postgres_password' psql -h localhost -U postgres -d greenpay_db -f APPLY_AS_POSTGRES.sql
```

**Option B: If using peer authentication (recommended)**

```bash
# SSH to server
ssh root@165.22.52.100

# Switch to postgres system user and run migration
sudo -u postgres psql -d greenpay_db -f /var/www/greenpay/database/migrations/APPLY_AS_POSTGRES.sql
```

**Option C: If postgres user doesn't have a password set**

```bash
# SSH to server
ssh root@165.22.52.100

# Connect as postgres user via peer auth
sudo -u postgres psql greenpay_db

-- Then paste the contents of APPLY_AS_POSTGRES.sql
-- Or use \i command:
\i /var/www/greenpay/database/migrations/APPLY_AS_POSTGRES.sql
```

### Step 5: Verify Migrations

After running the migration, you should see output like:

```
=========================================
Starting Critical Database Migrations
=========================================

Migration 1: Adding card_last_four column...
✓ Migration 1 complete

Migration 2: Fixing settings table permissions...
Current settings table owner:
 tablename | tableowner
-----------+------------
 settings  | postgres

New settings table owner:
 tablename | tableowner
-----------+---------------
 settings  | greenpay_user

✓ Migration 2 complete

=========================================
VERIFICATION SUMMARY
=========================================

Table Ownerships:
 tablename            | tableowner    | status
---------------------+---------------+--------
 corporate_vouchers  | greenpay_user | ✓
 individual_purchases| greenpay_user | ✓
 passports           | greenpay_user | ✓
 quotations          | greenpay_user | ✓
 settings            | greenpay_user | ✓
 users               | greenpay_user | ✓

Settings Table RLS Policies:
 policyname               | cmd    | has_using_clause | has_check_clause
-------------------------+--------+------------------+-----------------
 all_users_settings_read | SELECT | t                | f
 flex_admin_settings_all | ALL    | t                | t

All migrations completed successfully!
```

### Step 6: Restart Backend API

```bash
# Still on server
pm2 restart greenpay-api

# Watch logs to ensure no errors
pm2 logs greenpay-api --lines 50
```

### Step 7: Test Fixes

**Test 1: View Vouchers (was giving 500 error)**

1. Login as Agent user
2. Go to `/app/passports`
3. Search for passport `387110389`
4. Click "View Vouchers"
5. Should load without 500 error
6. Check browser console - should be no errors about `card_last_four`

**Test 2: Settings Save (was giving ownership error)**

1. Login as Flex_Admin user
2. Go to `/app/admin/settings`
3. Change any setting (e.g., voucher price)
4. Click Save
5. Should save successfully without "must be owner" error
6. Verify setting was actually saved (refresh page)

---

## Troubleshooting

### Issue: "psql: command not found"

```bash
# Install PostgreSQL client tools
apt-get update
apt-get install -y postgresql-client
```

### Issue: "FATAL: Peer authentication failed for user postgres"

```bash
# Edit pg_hba.conf to allow password authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Change this line:
# local   all             postgres                                peer

# To:
# local   all             postgres                                md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue: "password authentication failed for user postgres"

```bash
# Reset postgres password
sudo -u postgres psql

# In psql:
ALTER USER postgres WITH PASSWORD 'new_secure_password';
\q
```

### Issue: Migration fails midway

```bash
# Restore from backup
PGPASSWORD='your_postgres_password' psql -h localhost -U postgres greenpay_db < /var/www/greenpay/backups/greenpay_db_backup_YYYYMMDD_HHMMSS.sql

# Fix the issue in migration file
# Re-run migration
```

### Issue: Still getting permission errors after migration

```bash
# Verify table ownership
sudo -u postgres psql greenpay_db -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"

# Manually fix ownership if needed
sudo -u postgres psql greenpay_db -c "ALTER TABLE individual_purchases OWNER TO greenpay_user;"
sudo -u postgres psql greenpay_db -c "ALTER TABLE settings OWNER TO greenpay_user;"
```

---

## Rollback Procedure

If something goes wrong:

```bash
# SSH to server
ssh root@165.22.52.100

# Stop backend API
pm2 stop greenpay-api

# Restore from backup
PGPASSWORD='your_postgres_password' psql -h localhost -U postgres greenpay_db < /var/www/greenpay/backups/greenpay_db_backup_YYYYMMDD_HHMMSS.sql

# Start backend API
pm2 start greenpay-api

# Monitor logs
pm2 logs greenpay-api
```

---

## Quick Reference Commands

```bash
# Connect to database as postgres
sudo -u postgres psql greenpay_db

# Check table ownership
\dt+

# Check column exists
\d individual_purchases

# Check RLS policies
\d+ settings

# Exit psql
\q

# View PM2 logs
pm2 logs greenpay-api --lines 100

# Restart backend
pm2 restart greenpay-api
```

---

## After Successful Migration

1. ✅ Mark migrations as applied in your tracking system
2. ✅ Document any issues encountered
3. ✅ Test all affected features thoroughly
4. ✅ Monitor application logs for 24 hours
5. ✅ Keep backup for at least 7 days
6. ✅ Update README_MIGRATIONS.md with applied status

---

## Contact

If you encounter issues:
- Check PM2 logs: `pm2 logs greenpay-api`
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`
- Verify database connection: `sudo -u postgres psql greenpay_db -c "SELECT version();"`

**Remember:** Always have a backup before running migrations!
