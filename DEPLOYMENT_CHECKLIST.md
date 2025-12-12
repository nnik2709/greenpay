# Corporate Voucher Registration - Deployment Checklist

## Status: Ready to Deploy ✅

### Database Migration: ✅ COMPLETED
```sql
-- Already executed on production database:
✅ Added passport_id column (INTEGER)
✅ Added passport_number column (TEXT)
✅ Added registered_by column (INTEGER)
✅ Changed status default to 'pending_passport'
✅ Created indexes on passport fields
✅ Updated 209 existing vouchers to 'pending_passport' status
```

### Frontend Build: ✅ COMPLETED
```
✅ Built successfully (9.36s)
✅ CorporateVoucherRegistration component: 10.81 kB
✅ All assets bundled in dist/ folder
```

### Backend Changes: ✅ COMPLETED
```
✅ Fixed schema compatibility (INTEGER vs UUID)
✅ Removed updated_at column references
✅ corporate-voucher-registration.js ready to deploy
```

---

## Deployment Steps

### Option 1: Automated Script (Requires SSH Access)
```bash
./deploy-corporate-voucher-registration.sh
```

### Option 2: Manual Deployment

#### Step 1: Deploy Backend Route
```bash
# Copy the new route file to server
scp backend/routes/corporate-voucher-registration.js \
    root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# SSH to server and restart backend
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-backend
pm2 logs greenpay-backend --lines 20
exit
```

#### Step 2: Deploy Frontend Build
```bash
# Remove old frontend files
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && rm -rf assets && rm -f index.html"

# Copy new build files
rsync -avz dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/

# Set permissions
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && \
    chown -R eywademo-greenpay:eywademo-greenpay assets index.html && \
    chmod -R 755 assets && chmod 644 index.html"
```

---

## Post-Deployment Testing

### 1. Test Registration Page
```
URL: https://greenpay.eywademo.cloud/corporate-voucher-registration

Steps:
1. Enter a voucher code (one of the 209 pending vouchers)
2. Click "Camera Scan" or manually enter passport details
3. Submit registration
4. Verify success message

Expected: Voucher status changes from 'pending_passport' to 'active'
```

### 2. Test Gate Validation
```
URL: https://greenpay.eywademo.cloud/app/scan (or use scan page)

Steps:
1. Scan an unregistered voucher (pending_passport)
   Expected: Error message "requires passport registration"

2. Scan a registered voucher (active)
   Expected: Success with passport details displayed:
   - Passport Number
   - Surname
   - Given Name
   - Nationality
```

### 3. Test API Endpoints
```bash
# Lookup voucher
curl https://greenpay.eywademo.cloud/api/corporate-voucher-registration/voucher/VOUCHER_CODE

# Expected response:
{
  "voucher": {
    "voucher_code": "...",
    "company_name": "...",
    "status": "pending_passport",
    ...
  }
}
```

---

## Verification Queries

### Check Registration Status
```sql
-- See voucher status breakdown
SELECT
  status,
  COUNT(*) as total,
  COUNT(passport_number) as with_passport
FROM corporate_vouchers
GROUP BY status;

-- View recent registrations
SELECT
  voucher_code,
  company_name,
  passport_number,
  status,
  registered_at
FROM corporate_vouchers
WHERE registered_at IS NOT NULL
ORDER BY registered_at DESC
LIMIT 10;
```

### Monitor Registration Activity
```sql
-- Count pending vs active
SELECT
  CASE
    WHEN status = 'pending_passport' THEN 'Awaiting Registration'
    WHEN status = 'active' THEN 'Registered & Active'
    ELSE status
  END as voucher_status,
  COUNT(*) as count
FROM corporate_vouchers
GROUP BY status;
```

---

## Rollback Plan (If Needed)

### Database Rollback
```sql
-- Remove new columns (if major issues)
ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS passport_id;
ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS passport_number;
ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS registered_by;
ALTER TABLE corporate_vouchers ALTER COLUMN status SET DEFAULT 'active';
UPDATE corporate_vouchers SET status = 'active' WHERE status = 'pending_passport';
```

### Frontend Rollback
```bash
# Restore from backup
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
tar -xzf backups/frontend-backup-YYYYMMDD-HHMMSS.tar.gz
```

### Backend Rollback
```bash
# Remove new route
ssh root@72.61.208.79
rm /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/corporate-voucher-registration.js
pm2 restart greenpay-backend
```

---

## Communication to Customers

### Email Template
```
Subject: Action Required: Register Your Corporate Green Fee Vouchers

Dear [Company Name],

We have enhanced the security of our Corporate Green Fee system. All corporate
vouchers now require passport registration before use.

To register your vouchers:
1. Visit: https://greenpay.eywademo.cloud/corporate-voucher-registration
2. Enter your voucher code (8 characters, e.g., GP-ABC123)
3. Scan or enter passport details for the traveler
4. Submit to activate the voucher

Your Vouchers Requiring Registration: [COUNT]
Deadline: [DATE]

For assistance, contact: [SUPPORT CONTACT]

Thank you,
PNG Green Fees Team
```

---

## Files Changed

### New Files
- `backend/routes/corporate-voucher-registration.js` (350 lines)
- `src/pages/CorporateVoucherRegistration.jsx` (570 lines)
- `migrations/08-corporate-voucher-passport-registration-PRODUCTION.sql`
- `CORPORATE_VOUCHER_PASSPORT_REGISTRATION.md` (documentation)
- `deploy-corporate-voucher-registration.sh` (deployment script)

### Modified Files
- `backend/routes/corporate-voucher-registration.js` (removed updated_at refs)
- `backend/server.js` (added route registration)
- `src/App.jsx` (added public route)
- `backend/routes/vouchers.js` (enhanced validation)
- `backend/routes/invoices-gst.js` (updated voucher generation)

### Git Commit
```
Commit: 0582102
Message: Fix corporate voucher registration for production schema
Status: Pushed to main ✅
```

---

## Support & Monitoring

### Backend Logs
```bash
# View live logs
ssh root@72.61.208.79 'pm2 logs greenpay-backend --lines 100'

# Check for errors
ssh root@72.61.208.79 'pm2 logs greenpay-backend --err --lines 50'
```

### Database Monitoring
```sql
-- Registrations per hour
SELECT
  DATE_TRUNC('hour', registered_at) as hour,
  COUNT(*) as registrations
FROM corporate_vouchers
WHERE registered_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Failed validation attempts (check backend logs for these)
-- Look for: "Corporate voucher requires passport registration"
```

---

## Known Issues & Solutions

### Issue: Passports Table Missing
If the passports table doesn't exist in production:
```sql
-- Check if table exists
\dt passports

-- If missing, create it
CREATE TABLE passports (
  id SERIAL PRIMARY KEY,
  passport_number TEXT UNIQUE NOT NULL,
  surname TEXT NOT NULL,
  given_name TEXT NOT NULL,
  nationality TEXT,
  date_of_birth DATE,
  sex TEXT,
  date_of_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_passports_number ON passports(passport_number);
```

### Issue: Camera Scanner Not Working
- Check browser permissions for camera access
- Ensure HTTPS is enabled (camera requires secure context)
- Test SimpleCameraScanner component separately
- Fallback: Users can manually enter passport details

### Issue: Validation Not Showing Passport Data
- Check backend route is registered in server.js
- Verify LEFT JOIN query in vouchers.js validation
- Check passport_id reference is correct
- Review backend logs for SQL errors

---

## Success Criteria

✅ All 209 existing vouchers marked as pending_passport
✅ Registration page accessible at /corporate-voucher-registration
✅ Users can register passports to vouchers
✅ Gate validation shows passport details for registered vouchers
✅ Unregistered vouchers are rejected with clear message
✅ No errors in backend logs
✅ Frontend loads without console errors

---

## Next Steps After Deployment

1. **Test End-to-End Flow**
   - Register a test voucher
   - Validate at gate
   - Confirm passport details display

2. **Notify Customers**
   - Send email to all corporate customers
   - Provide registration instructions
   - Set deadline for registration

3. **Monitor Registration Rate**
   - Track daily registrations
   - Follow up with customers who haven't registered
   - Address any support questions

4. **Train Gate Agents**
   - Show them new passport verification fields
   - Explain how to compare physical passport with system data
   - Handle edge cases (expired passports, name mismatches)

5. **Documentation**
   - Update user manual
   - Create video tutorial for registration process
   - FAQ for common questions

---

Generated: December 12, 2025
Feature: Corporate Voucher Passport Registration
Status: Ready for Deployment
