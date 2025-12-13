# Passport Creation Fix - Deployment Summary

**Date:** November 30, 2025
**Issue:** Voucher creation failing with 500 error due to passport creation failure
**Root Cause:** Column name mismatch between frontend/backend code and database schema

## Problem Analysis

### Initial Symptom
```
POST https://greenpay.eywademo.cloud/api/passports 500 (Internal Server Error)
Error: {"error":"Failed to create passport"}
```

### Root Cause Discovery
The database table `"Passport"` uses **camelCase** column names:
- `passportNo` (NOT `passport_number`)
- `givenName` (NOT `given_name`)
- `dob` (NOT `date_of_birth`)
- `dateOfExpiry` (NOT `date_of_expiry`)
- `createdById` (NOT `created_by`)

Previous code incorrectly used snake_case column names.

### Database Verification
```sql
\d "Passport"
```

Confirmed:
- All fields are **already nullable** except `id`, `createdAt`, `updatedAt`
- Only `passportNo` needs to be mandatory (user requirement met)
- Column names are camelCase

## Files Fixed

### 1. Frontend: `src/lib/passportsService.js`

**Lines 38-57**: Fixed `createPassport` function to send camelCase field names

```javascript
// BEFORE (WRONG - snake_case)
const payload = {
  passport_number: passportData.passportNumber,
  given_name: passportData.givenName,
  date_of_birth: passportData.dob,
  date_of_expiry: passportData.dateOfExpiry,
  created_by: userId,
};

// AFTER (CORRECT - camelCase)
const payload = {
  passportNo: passportData.passportNumber,
  nationality: passportData.nationality,
  surname: passportData.surname,
  givenName: passportData.givenName,
  dob: passportData.dob,
  sex: passportData.sex,
  dateOfExpiry: passportData.dateOfExpiry,
  createdById: userId,
};
```

### 2. Backend: `backend/routes/passports.js`

**Line 72**: Fixed validation to expect camelCase field name
```javascript
// BEFORE
body('passport_number').notEmpty().withMessage('Passport number is required')

// AFTER
body('passportNo').notEmpty().withMessage('Passport number is required')
```

**Line 88**: Fixed field assignment
```javascript
// BEFORE
cleanFields.created_by = req.userId;

// AFTER
cleanFields.createdById = req.userId;
```

## Deployment Required

### Backend Deployment
The file `backend/routes/passports.js` needs to be deployed to production:

**Manual deployment steps:**
1. Copy `backend/routes/passports.js` to server:
   ```bash
   scp backend/routes/passports.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
   ```

2. Restart PM2 process:
   ```bash
   ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && pm2 restart greenpay-api"
   ```

3. Verify PM2 status:
   ```bash
   ssh root@72.61.208.79 "pm2 status greenpay-api"
   ```

**Note:** The deployment scripts `./deploy-passport-fix.sh` and `./deploy-backend.sh` exist but require SSH authentication setup.

### Frontend Deployment
Frontend changes in `src/lib/passportsService.js` need to be built and deployed:

```bash
npm run build
# Then deploy dist/ to production
```

## Testing Instructions

After deployment, test voucher creation:

1. Navigate to http://localhost:3000 (or production URL)
2. Login as `agent@greenpay.com` / `test123`
3. Go to Individual Purchase
4. Fill in minimal passport info:
   - Passport Number: `P12345678`
   - Nationality: Any value
   - Given Name: Any value
   - Surname: Any value
   - **Leave optional fields blank**: dob, sex, dateOfExpiry
5. Complete voucher creation
6. Should succeed without 500 error

## Expected Behavior

- ✅ Passport creation works with only passport number + basic info
- ✅ Optional fields (dob, sex, dateOfExpiry) can be left empty
- ✅ Database accepts NULL values for optional fields
- ✅ Backend validates only `passportNo` as required
- ✅ Frontend sends camelCase field names matching database

## Verification

Check PM2 logs after deployment:
```bash
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 50"
```

No errors like:
- ❌ `column "dateOfBirth" of relation "Passport" does not exist`
- ❌ `column "passport_number" of relation "Passport" does not exist`

## Files Modified (Local)

- ✅ `src/lib/passportsService.js` - Fixed to send camelCase
- ✅ `backend/routes/passports.js` - Fixed to expect camelCase

## Files NOT Needed

- ❌ `fix-passport-constraints.sql` - Database already has correct constraints
- ❌ Schema migration - Database schema is already correct

## Summary

The fix is complete in the local repository. Both frontend and backend now correctly use **camelCase** column names that match the database schema. The user requirement that "only passport number should be mandatory" is already satisfied by the database schema - all other fields are nullable.

**Next step:** Deploy both files to production and test voucher creation.
