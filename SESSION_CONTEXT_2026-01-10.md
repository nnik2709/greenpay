# Claude Code Session Context - January 10, 2026 (Updated)

## Session Overview
This document captures the current session context, progress, and activities to enable seamless continuation on another computer.

## Current Session Status: READY FOR DEPLOYMENT

---

## Completed Tasks This Session

### 1. PrehKeyTec Passport Scanner Integration (Completed Earlier)
- **useWebSerial.js** hook for Web Serial API communication with PrehKeyTec MC 147 A scanner
- Auto-connect on page load (after first authorization)
- Auto-reconnect on USB disconnect/reconnect
- DTR/RTS signal handling for P6 hardware
- MRZ parsing (ICAO 9303 TD3 format)

### 2. Scanner Form Auto-Population Bug Fix
**Problem:** Form fields weren't populating after scan despite successful scan data.

**Root Cause:** `mergedData` was using wrong keys from `fieldsToUpdate` (snake_case) when accessing values.

**Solution:** Use `scannedData` values directly (already in camelCase format).

**File:** `src/pages/IndividualPurchase.jsx`

### 3. Voucher Template Fixes
**Changes:**
- Removed PNG emblem from voucher (only CCDA logo now, centered)
- Removed duplicate passport number display (was showing twice)
- Fixed both on-screen preview and print template

**File:** `src/components/VoucherPrint.jsx`

### 4. Email Voucher Fix
**Problem:** 500 error on `POST /api/vouchers/:code/email`

**Root Cause:** `generateVoucherPDF` was not imported - function didn't exist.

**Solution:** Import and use `generateVoucherPDFBuffer` from pdfGenerator.

**File:** `backend/routes/vouchers.js` (line ~1217)

### 5. ReadableStream Already Locked Fix
**Problem:** Error when navigating back to IndividualPurchase page after creating voucher.

**Solution:** Added check for `port.readable.locked` before getting new reader.

**File:** `src/hooks/useWebSerial.js` (lines 510-528)

### 6. "No Fields to Update" Error Handling
**Problem:** Console showed error when scanning passport that already has all fields.

**Solution:** Made error handling graceful - shows success message instead of error.

**File:** `src/pages/IndividualPurchase.jsx` (lines 173-198)

### 7. Passport Number + Nationality Unique Constraint (NEW - IMPORTANT)
**Problem:** Passport numbers are NOT globally unique - different countries can issue same number.

**Solution:** Implemented composite unique constraint.

#### Database Migration (NEW FILE - NOT YET RUN)
**File:** `backend/migrations/add-passport-nationality-unique.sql`
- Removes old `UNIQUE(passport_number)` constraint
- Adds new `UNIQUE(passport_number, nationality)` composite constraint
- Includes safety checks for existing duplicates

#### Backend Update
**File:** `backend/routes/passports.js`
- Added `nationality` query parameter support to GET /api/passports
- Can filter by both passport_number AND nationality

#### Frontend Service
**File:** `src/lib/passportsService.js`
- Added `getPassportByNumberAndNationality(passportNumber, nationality)` function
- Marked old `getPassportByNumber` as deprecated

#### Updated Pages
- `src/pages/IndividualPurchase.jsx` - All 4 scanner lookups now use nationality
- `src/pages/Payments.jsx` - MRZ scanner lookup now uses nationality

---

## Files Modified This Session

### Frontend (need rebuild & deploy)
```
src/hooks/useWebSerial.js           - ReadableStream lock fix
src/pages/IndividualPurchase.jsx    - Nationality-aware lookups, error handling
src/pages/Payments.jsx              - Nationality-aware lookups
src/lib/passportsService.js         - New getPassportByNumberAndNationality function
src/components/VoucherPrint.jsx     - Template fixes (PNG emblem removed, centered logo)
```

### Backend (need deploy)
```
backend/routes/passports.js         - Nationality filter support
backend/routes/vouchers.js          - Email voucher fix (generateVoucherPDFBuffer)
backend/migrations/add-passport-nationality-unique.sql  - NEW FILE, needs to be run
```

---

## Deployment Steps (DO IN ORDER)

### Step 1: Run Database Migration FIRST
```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Upload the migration file first via CloudPanel, then run:
psql -U postgres -d greenpay -f migrations/add-passport-nationality-unique.sql
```

### Step 2: Deploy Backend Files
Upload these files to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`:
- `routes/passports.js`
- `routes/vouchers.js`
- `migrations/add-passport-nationality-unique.sql`

Then restart:
```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

### Step 3: Build & Deploy Frontend
From Windows cmd.exe (NOT WSL):
```cmd
cd C:\users\nikol\github\greenpay
npm run build
```
Then upload `dist` folder contents to server via CloudPanel.

---

## Current Git Status (Uncommitted Changes)
```
M backend/routes/passports.js
M backend/routes/vouchers.js
M src/components/VoucherPrint.jsx
M src/hooks/useWebSerial.js
M src/lib/passportsService.js
M src/pages/IndividualPurchase.jsx
M src/pages/Payments.jsx
?? backend/migrations/add-passport-nationality-unique.sql
?? SESSION_CONTEXT_2026-01-10.md
```

---

## Architecture Notes

### Scanner Flow
1. `useWebSerial` hook connects to PrehKeyTec scanner via Web Serial API
2. Scanner sends MRZ data with START_MARKER (`\x1c\x02`) and END_MARKER (`\x03\x1d`)
3. `parseMrz()` extracts: passport_no, surname, given_name, nationality, dob, sex, date_of_expiry
4. `processScannedPassport()` in IndividualPurchase.jsx:
   - Looks up passport by number + nationality (globally unique)
   - If found: loads existing data, updates missing fields
   - If not found: creates new passport record

### Passport Lookup Strategy
- **With Scanner (MRZ):** Use `getPassportByNumberAndNationality()` - globally unique
- **Manual Entry:** Use `getPassportByNumber()` - may have duplicates across countries

### Server Paths (CRITICAL)
```
Backend: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
PM2 Name: greenpay-api (NOT greenpay-backend)
Frontend: /var/www/png-green-fees/dist
PM2 Name: png-green-fees
```

---

## Known Issues / Minor Items

1. **Missing PWA Icons** - `icon-192.png` and `icon-512.png` missing from public folder
   - Causes 404 in console but app works fine
   - Optional fix: Create these icons

2. **Manual Search Without Nationality**
   - When user types passport number manually, lookup uses `getPassportByNumber` only
   - This is intentional - user doesn't know nationality when typing
   - Scanner-based lookups are accurate (uses nationality from MRZ)

---

## To Continue on Another PC

### Quick Start
```bash
# 1. Navigate to project (Windows)
cd C:\users\nikol\github\greenpay

# 2. Check current status
git status

# 3. Review changes
git diff

# 4. If you need to commit changes:
git add -A
git commit -m "Add passport+nationality unique constraint and scanner fixes"

# 5. Build frontend (Windows cmd.exe)
npm run build
```

### Deploy Backend Changes
1. Upload files via CloudPanel File Manager
2. Run database migration (Step 1 above)
3. Restart PM2: `pm2 restart greenpay-api`

### Verify Everything Works
1. Go to https://greenpay.eywademo.cloud/app/passports/create
2. Scan a passport with the PrehKeyTec scanner
3. Form should auto-populate
4. Create voucher
5. Verify email sending works
6. Verify voucher PDF has only CCDA logo (centered)

---

## Important: Passport Uniqueness

**Before:** `passport_number` was unique alone - WRONG
**After:** `passport_number + nationality` is unique - CORRECT

Example: Denmark passport "AB123456" and Philippines passport "AB123456" are now treated as DIFFERENT people.

The database migration MUST be run before the new code will work properly.

---

## Contact / References

- Production URL: https://greenpay.eywademo.cloud/
- Backend PM2: `greenpay-api`
- Backend Path: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
- Session Date: January 10, 2026
