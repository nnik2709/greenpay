# Quick Verification Guide - New Features

## Issue Fixed ✅

**Problem**: Blank page at `/passports` with 500 errors  
**Cause**: Wrong import path in `storageService.js`  
**Fix**: Changed `from './supabase'` to `from './supabaseClient'`  
**Status**: ✅ FIXED

---

## What Was Implemented Today

### 1. File Storage Service ✅
**File**: `src/lib/storageService.js`  
**Status**: Ready (needs Supabase Storage buckets created)

### 2. Public Registration Flow ✅
**Files**: 
- `src/pages/PublicRegistration.jsx`
- `src/pages/PublicRegistrationSuccess.jsx`
- Routes added to `src/App.jsx`

**Test URL**: `http://localhost:3000/register/TEST-CODE`

### 3. Quotation Workflow Service ✅
**Files**:
- `src/lib/quotationWorkflowService.js`
- `supabase/migrations/014_quotation_workflow.sql`

**Functions**:
- `markQuotationAsSent()`
- `approveQuotation()`
- `convertQuotationToVoucherBatch()`
- `rejectQuotation()`
- `getQuotationStatistics()`

### 4. Enhanced Quotations Page ✅
**File**: `src/pages/Quotations.jsx`  
**Changes**:
- Now loads REAL DATA from database
- Shows real statistics
- Ready for workflow buttons

---

## Quick Test Commands

### Test 1: Check if pages load (no console errors)

```bash
# Kill any existing server
pkill -9 -f "vite"

# Start fresh dev server
npm run dev
```

Then open browser to:
- `http://localhost:3000/dashboard` - Should load without errors
- `http://localhost:3000/passports` - Should load without errors
- `http://localhost:3000/quotations` - Should show real data
- `http://localhost:3000/register/TEST-CODE` - Public registration page

### Test 2: Run Playwright regression tests

```bash
# Run regression suite
npx playwright test tests/regression/ --project=chromium --reporter=list
```

Should see:
```
✅ REGRESSION CHECK PASSED: Dashboard
✅ REGRESSION CHECK PASSED: Individual purchase page
✅ REGRESSION CHECK PASSED: QR scanner
... etc
```

### Test 3: Run specific feature tests

```bash
# Test quotations
npx playwright test tests/phase-1/05-quotations.spec.ts --project=chromium

# Test dashboard
npx playwright test tests/phase-1/01-dashboard.spec.ts --project=chromium

# Test public registration
npx playwright test tests/new-features/public-registration.spec.ts --project=chromium
```

---

## Setup Still Needed

### Supabase Dashboard Tasks (5 minutes)

1. **Create Storage Buckets**:
   - Go to Storage → New Bucket
   - Create: `passport-photos` (public, 2MB limit)
   - Create: `passport-signatures` (public, 1MB limit)
   - Create: `voucher-batches` (public, 10MB limit)

2. **Run Migration 013**:
   - Go to SQL Editor
   - Copy content from `supabase/migrations/013_passport_file_storage.sql`
   - Paste and Run

3. **Run Migration 014**:
   - Copy content from `supabase/migrations/014_quotation_workflow.sql`
   - Paste and Run

---

## Expected Results

### After Fixes

✅ **Pages Load**: All pages should load without 500 errors  
✅ **No Import Errors**: All modules load correctly  
✅ **Quotations Show Data**: Real quotations display (if any in DB)  
✅ **Public Registration Works**: Can access without login  
✅ **Console Clean**: No JavaScript errors  

### WebSocket Warnings

⚠️ **Can Ignore**: The WebSocket errors are just Vite HMR warnings, not critical:
```
WebSocket connection to 'ws://localhost:3000/?token=...' failed
```

These don't affect functionality, just hot reload.

---

## Quick Health Check

```bash
# 1. Check dev server is running
lsof -i :3000 | grep LISTEN

# 2. Check for JavaScript errors in build
npm run build

# 3. Test a simple page
curl -s http://localhost:3000/ | grep "PNG Green Fees"
```

All should succeed ✅

---

## If Still Having Issues

### Clear Caches

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
pkill -f "vite"
npm run dev
```

### Check Browser Console

Open browser DevTools (F12) and look for:
- ❌ Red errors - need to fix
- ⚠️ Yellow warnings - can usually ignore
- Specific error messages - check file paths

---

**Current Status**: Import errors fixed, pages should load ✅

**Next**: Run migrations and create storage buckets to complete setup










