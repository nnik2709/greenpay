# Voucher Creation Error - Root Cause Analysis

## Error Description
When trying to create a voucher as Counter_Agent user, the system fails with:
```
POST https://greenpay.eywademo.cloud/api/passports 500 (Internal Server Error)
Error: {"error":"Failed to create passport"}
```

## Root Cause Identified

**Column Name Mismatch between Frontend and Database**

### Frontend Code (src/lib/passportsService.js:40-48)
Sends data with **camelCase** column names:
```javascript
const payload = {
  passportNo: passportData.passportNumber,        // ❌ Wrong
  nationality: passportData.nationality,          // ✅ Correct
  surname: passportData.surname,                  // ✅ Correct
  givenName: passportData.givenName,              // ❌ Wrong
  dateOfBirth: passportData.dob,                  // ❌ Wrong
  sex: passportData.sex,                          // ✅ Correct
  dateOfExpiry: passportData.dateOfExpiry,        // ❌ Wrong
  createdById: userId,                            // ❌ Wrong
};
```

### Database Schema (PostgreSQL)
Expects **snake_case** column names:
```sql
CREATE TABLE passports (
  id UUID PRIMARY KEY,
  passport_number TEXT UNIQUE NOT NULL,           -- ❌ Mismatch
  nationality TEXT NOT NULL,                      -- ✅ Match
  surname TEXT NOT NULL,                          -- ✅ Match
  given_name TEXT NOT NULL,                       -- ❌ Mismatch
  date_of_birth DATE NOT NULL,                    -- ❌ Mismatch
  sex TEXT,                                       -- ✅ Match
  date_of_expiry DATE NOT NULL,                   -- ❌ Mismatch
  created_by UUID,                                -- ❌ Mismatch
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Backend Route (backend/routes/passports.js:68-108)
The backend route blindly accepts whatever column names are sent from frontend and tries to insert them. When it tries to insert:
```sql
INSERT INTO "Passport" ("passportNo", "givenName", "dateOfBirth", "dateOfExpiry", "createdById", ...)
```

PostgreSQL rejects it because those columns don't exist (the actual columns are `passport_number`, `given_name`, etc.).

## Solution

Fix the frontend service to send snake_case column names to match the database schema.

### File to Fix: `src/lib/passportsService.js`

**Current (lines 40-48):**
```javascript
const payload = {
  passportNo: passportData.passportNumber,
  nationality: passportData.nationality,
  surname: passportData.surname,
  givenName: passportData.givenName,
  dateOfBirth: passportData.dob,
  sex: passportData.sex,
  dateOfExpiry: passportData.dateOfExpiry,
  createdById: userId,
};
```

**Fixed:**
```javascript
const payload = {
  passport_number: passportData.passportNumber,    // Fixed
  nationality: passportData.nationality,
  surname: passportData.surname,
  given_name: passportData.givenName,              // Fixed
  date_of_birth: passportData.dob,                 // Fixed
  sex: passportData.sex,
  date_of_expiry: passportData.dateOfExpiry,       // Fixed
  created_by: userId,                              // Fixed
};
```

## Manual Commands to Check Backend Logs

If you want to verify the exact database error on the server, SSH into the backend server and run:

### Option 1: Check PM2 Logs
```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 logs --lines 100 --nostream | grep -i "passport\|error"
```

### Option 2: Check Database Directly
```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
psql -U your_db_user -d your_db_name -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Passport' ORDER BY ordinal_position;"
```

### Option 3: Check Node.js Server Logs
```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
tail -f logs/error.log  # If you have error logging configured
```

## Impact

This error affects:
- ✅ **Existing passport records**: Can be viewed and searched (read operations work)
- ❌ **New voucher creation**: Cannot create vouchers because passport creation fails
- ❌ **Individual purchases**: Workflow blocked at passport creation step
- ❌ **Data seeding tests**: Passport seeding tests fail with timeout

## Testing After Fix

After applying the fix, test with:

1. **Manual UI Test:**
   - Login as Counter_Agent (agent@greenpay.com / test123)
   - Go to Individual Purchase page
   - Enter passport details
   - Enter payment information
   - Click "Generate Voucher"
   - Should succeed without errors

2. **Playwright Test:**
   ```bash
   npx playwright test tests/data-seeding/01-seed-passports.spec.ts --reporter=list
   ```

3. **API Test:**
   ```bash
   curl -X POST https://greenpay.eywademo.cloud/api/passports \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "passport_number": "TEST123456",
       "nationality": "USA",
       "surname": "TEST",
       "given_name": "USER",
       "date_of_birth": "1990-01-01",
       "sex": "Male",
       "date_of_expiry": "2030-12-31"
     }'
   ```

## Related Files

- **Frontend Service**: `src/lib/passportsService.js` (needs fix)
- **Backend Route**: `backend/routes/passports.js` (currently correct)
- **Database Schema**: `supabase-schema.sql` (currently correct)
- **API Client**: `src/lib/api/client.js` (no changes needed)

## Priority

🔴 **HIGH** - This blocks a critical workflow (voucher generation) for Counter_Agent users.
