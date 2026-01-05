# Manual Commands to Run on Production

## Step 1: Check Current Database State

Run these commands via your database admin tool or psql:

```bash
# Connect to production database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db -f CHECK_PRODUCTION_ISSUES.sql > check_results.txt
```

This will create `check_results.txt` with diagnostic information.

---

## Step 2: Fix Database Permissions

Run this as the database superuser (postgres):

```bash
# Connect as postgres user (you'll need root access)
ssh root@165.22.52.100
sudo -u postgres psql greenpay_db -f /var/www/greenpay/FIX_DATABASE_PERMISSIONS.sql
```

Or if you have postgres password:

```bash
PGPASSWORD='your_postgres_password' psql -h 165.22.52.100 -U postgres -d greenpay_db -f FIX_DATABASE_PERMISSIONS.sql
```

---

## Step 3: Check Individual Issues

### Issue #2: Settings Permission Error

```bash
# Test settings update directly
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db << 'EOF'
-- Check current permissions
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'settings' AND grantee = 'greenpay_user';

-- Try to update (this will fail if permissions are wrong)
UPDATE settings
SET voucher_validity_days = 30
WHERE id = (SELECT id FROM settings ORDER BY id DESC LIMIT 1);
EOF
```

### Issue #3: Passport Reports Data

```bash
# Check if we have passport data
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db << 'EOF'
SELECT COUNT(*) as total_passports FROM passports;
SELECT id, passport_number, full_name, nationality, created_at
FROM passports
ORDER BY created_at DESC
LIMIT 10;
EOF
```

### Issue #4: Voucher Registration

```bash
# Test a specific voucher code (replace with actual code)
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db << 'EOF'
SELECT voucher_code, status, passport_number, valid_from, valid_until
FROM corporate_vouchers
WHERE voucher_code = '1XNDLVY9';
EOF
```

### Issue #9: User Management

```bash
# Check user table structure
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db << 'EOF'
SELECT id, name, email, "roleId", "isActive"
FROM "User"
ORDER BY id DESC
LIMIT 5;

-- Test user update
UPDATE "User"
SET "isActive" = false
WHERE id = (SELECT id FROM "User" WHERE email = 'test@example.com');
EOF
```

---

## Step 4: Test API Endpoints

### Test Settings Update (from local machine)

```bash
# Get auth token first (replace with real credentials)
TOKEN=$(curl -s -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}' | jq -r '.token')

# Test settings update
curl -X PUT https://greenpay.eywademo.cloud/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"voucher_validity_days":30}' | jq
```

### Test Voucher Registration

```bash
# Test voucher validation (no auth needed)
curl -X GET https://greenpay.eywademo.cloud/api/corporate-voucher-registration/voucher/1XNDLVY9 | jq
```

### Test Ticket Creation

```bash
# Get auth token (if not already have one)
TOKEN=$(curl -s -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}' | jq -r '.token')

# Test ticket creation
curl -X POST https://greenpay.eywademo.cloud/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Ticket",
    "description": "Testing ticket creation",
    "category": "technical",
    "priority": "low"
  }' | jq
```

---

## Step 5: Check Application Logs

```bash
# View PM2 logs for errors
ssh root@165.22.52.100
pm2 logs greenpay-api --lines 50 --nostream | grep -i error
```

---

## Expected Results

### Settings Permission Fix
✅ Should see: `GRANT` output and successful UPDATE

### Passport Reports
✅ Should see: Count > 0 and list of passports

### Voucher Registration
✅ Should see: Valid voucher JSON or proper error message

### Ticket Creation
✅ Should see: Created ticket JSON with ID

### User Management
✅ Should see: Successful UPDATE result

---

## If Issues Persist

1. **Settings Permission Error** - Check database owner and RLS policies
2. **Passport Reports No Data** - Check frontend API call and query params
3. **Voucher Registration** - Check if voucher code is correct and not expired
4. **Ticket Creation** - Check frontend form field names match backend
5. **User Management** - Check frontend payload and field names

---

## Quick Diagnosis Commands

```bash
# All-in-one check script
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db << 'EOF'
SELECT 'Passports' as table_name, COUNT(*) as count FROM passports
UNION ALL
SELECT 'Corporate Vouchers', COUNT(*) FROM corporate_vouchers
UNION ALL
SELECT 'Individual Purchases', COUNT(*) FROM individual_purchases
UNION ALL
SELECT 'Quotations', COUNT(*) FROM quotations
UNION ALL
SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Settings', COUNT(*) FROM settings;
EOF
```
