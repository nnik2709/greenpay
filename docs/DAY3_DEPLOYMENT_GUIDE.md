# DAY 3 SECURITY FIXES - MANUAL DEPLOYMENT GUIDE

## Overview

Day 3 implements:
- ✅ Helmet security headers
- ✅ Comprehensive input validation schemas
- ✅ Audit logging system
- ✅ Database table for audit logs

## Files Created/Modified

### Local Files (already created):
1. `backend/server.js.day3` - Updated server.js with Helmet
2. `backend/validators/schemas.js` - Input validation schemas
3. `backend/services/auditLogger.js` - Audit logging service
4. `database/migrations/create-audit-logs-table.sql` - Database migration

## Manual Deployment Steps

### Step 1: Install Helmet on Production Server

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install helmet
```

### Step 2: Backup Current server.js

```bash
cp server.js server.js.backup-day3-$(date +%Y%m%d-%H%M%S)
```

### Step 3: Upload Files via CloudPanel File Manager

Upload these files to the production server:

**File 1:** `/Users/nikolay/github/greenpay/backend/server.js.day3`
→ Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js`
(Replace existing server.js)

**File 2:** `/Users/nikolay/github/greenpay/backend/validators/schemas.js`
→ Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/validators/schemas.js`
(Create validators directory if needed)

**File 3:** `/Users/nikolay/github/greenpay/backend/services/auditLogger.js`
→ Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/auditLogger.js`
(services directory should already exist)

**File 4:** `/Users/nikolay/github/greenpay/database/migrations/create-audit-logs-table.sql`
→ Upload to: `/tmp/create-audit-logs-table.sql`

### Step 4: Run Database Migration

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f /tmp/create-audit-logs-table.sql
```

Verify table creation:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "\d audit_logs"
```

### Step 5: Verify Helmet Installation

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm list helmet
```

Should show:
```
greenpay-backend@1.0.0 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
└── helmet@X.X.X
```

### Step 6: Restart Backend

```bash
pm2 restart greenpay-api
```

### Step 7: Verify Deployment

Check PM2 status:
```bash
pm2 list | grep greenpay-api
```

Check logs for "Helmet enabled":
```bash
pm2 logs greenpay-api --lines 20 --nostream | grep -E "(Helmet|Security|GreenPay API Server Running)"
```

### Step 8: Test Security Headers

From your local machine:
```bash
curl -I https://greenpay.eywademo.cloud/api/health
```

You should see these headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
```

### Step 9: Verify Audit Logs Table

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT COUNT(*) FROM audit_logs;"
```

## What Was Deployed

### 1. Helmet Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- X-XSS-Protection

### 2. Input Validation Schemas
Ready-to-use validation schemas for:
- Voucher codes (8 alphanumeric)
- Email addresses
- Passport numbers
- Amounts and fees
- Pagination
- Date ranges
- User IDs
- Phone numbers
- Passwords

### 3. Audit Logging Service
Comprehensive logging for:
- Authentication events (login, logout, password changes)
- Authorization events (access denied, permission escalation)
- Data access events (view sensitive data, exports)
- Data modifications (create, update, delete)
- Financial events (payments, refunds, vouchers)
- Security events (rate limits, suspicious activity)
- System events (user management, config changes)

### 4. Database Table: audit_logs
Columns:
- event_type, severity, user_id, user_email
- action, resource_type, resource_id
- metadata (JSON), ip_address, user_agent
- success, failure_reason, created_at

Indexes for performance on:
- user_id, event_type, severity, created_at
- ip_address, resource lookups, metadata (GIN)

## Next Steps (Day 4+)

The infrastructure is now in place. Future work includes:

1. **Apply validation schemas to routes**
   - Import schemas in route files
   - Add to existing validation chains
   - Test each endpoint

2. **Add audit logging to routes**
   - Import auditLogger in route files
   - Call appropriate log functions
   - Test audit trail

3. **CSRF protection**
4. **Session management hardening**
5. **API authentication tokens**

## Troubleshooting

### Backend won't start after deployment
```bash
pm2 logs greenpay-api --err
```

Common issues:
- Missing helmet package → Run `npm install helmet`
- Syntax error in server.js → Check file upload was complete
- Missing directories → Create validators/ and services/ directories

### Headers not showing
- Check backend is running: `pm2 list`
- Verify server.js has Helmet config: `grep helmet server.js`
- Check for CORS override issues

### Database migration fails
- Verify credentials are correct
- Check database connection: `PGPASSWORD='...' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT NOW();"`
- Table might already exist (safe to ignore)

## Verification Checklist

- [ ] Helmet installed (`npm list helmet`)
- [ ] server.js updated with Helmet config
- [ ] validators/schemas.js uploaded
- [ ] services/auditLogger.js uploaded
- [ ] audit_logs table created
- [ ] Backend restarted successfully
- [ ] Security headers present in API responses
- [ ] No errors in PM2 logs

## Rollback (if needed)

```bash
# Restore backup
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cp server.js.backup-day3-YYYYMMDD-HHMMSS server.js
pm2 restart greenpay-api

# Remove audit_logs table (optional)
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "DROP TABLE IF EXISTS audit_logs CASCADE;"
```

## Support

If issues occur:
1. Check PM2 logs: `pm2 logs greenpay-api`
2. Verify file paths match exactly
3. Ensure all files uploaded completely
4. Check database connection and credentials
