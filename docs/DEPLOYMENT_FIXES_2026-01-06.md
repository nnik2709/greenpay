# Deployment Fixes - January 6, 2026

## Summary of All Changes

This document details all fixes implemented and deployment instructions.

## 1. Backend: Email Voucher API Fix ✅

**File**: `backend/routes/vouchers.js` (lines 1093-1170)

**Issue**:
- Error: `db.oneOrNone is not a function` at line 1108
- Backend uses `db.query()` pattern, not `db.oneOrNone()`

**Fix Applied**:
- Changed `db.oneOrNone()` to `db.query()`
- Access results via `result.rows[0]` instead of direct result

**Lines Changed**: 1108-1126

## 2. Frontend: MRZ Country Code Translation ✅

**Files**:
- NEW: `src/lib/countryCodeMapper.js` (complete file)
- UPDATED: `src/lib/mrzParser.js` (lines 12, 76-77, 121-122)

**Feature**: Automatically converts 3-letter ISO country codes from MRZ to full nationality names (e.g., "AUS" → "Australian")

## 3. Frontend: Nationality Dropdown

**File**: `src/pages/IndividualPurchase.jsx` (lines 464-665)

**Current State**: HTML5 datalist implementation
- Works for search/autocomplete
- No visual dropdown arrow (HTML5 limitation)

**Notes**:
- HTML5 datalist is a typing-based autocomplete, not a visual dropdown
- To show a clickable dropdown arrow, would need to use a React component library (e.g., shadcn/ui Select)
- Current implementation works but requires typing to search

## 4. Finance Manager Payments Menu

**File**: `src/App.jsx` (line 239-242)

**Status**: ✅ Already configured
- Finance_Manager role already has access to `/app/payments`
- Route is properly protected with role check

**Note**: The menu link needs to be added to the Finance Manager's navigation UI (Header or Sidebar component)

---

## Deployment Instructions

### Step 1: Deploy Backend Fix (CRITICAL)

Upload the fixed backend file:

```bash
# Upload via CloudPanel File Manager:
# Source: /Users/nikolay/github/greenpay/backend/routes/vouchers.js
# Destination: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js

# After upload, restart backend:
pm2 restart greenpay-api

# Monitor logs for errors:
pm2 logs greenpay-api --lines 50
```

### Step 2: Deploy Frontend Files

Upload the new distribution folder:

```bash
# Upload via CloudPanel File Manager:
# Source: /Users/nikolay/github/greenpay/dist/ (entire contents)
# Destination: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/

# Ensure these new files are uploaded:
# - dist/assets/* (all new bundle files)
# - dist/index.html
```

### Step 3: Verify Deployment

Test each feature:

```bash
# 1. Email Voucher Test:
# - Create individual purchase
# - Email the voucher
# - Check logs: pm2 logs greenpay-api --lines 100
# - Should NOT see "db.oneOrNone is not a function" error

# 2. MRZ Country Code Test:
# - Scan passport MRZ
# - Verify nationality field shows full name (e.g., "Australian" not "AUS")

# 3. Nationality Dropdown Test:
# - Go to Individual Purchase page
# - Type in nationality field
# - See autocomplete suggestions appear

# 4. Finance Manager Payments:
# - Login as Finance_Manager
# - Navigate to /app/payments (should work)
# - Menu link in UI may need to be added manually
```

---

## Known Issues / Future Enhancements

### 1. Nationality Dropdown UX

**Current**: HTML5 datalist (type-to-search autocomplete)
**Issue**: No visual dropdown arrow to click
**Enhancement**: Replace with shadcn/ui Select component for better UX

**Example Implementation**:
```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select value={passportInfo.nationality} onValueChange={(value) => handleFieldChange('nationality', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select nationality" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Afghan">Afghan</SelectItem>
    <SelectItem value="Albanian">Albanian</SelectItem>
    // ... all 186+ nationalities
  </SelectContent>
</Select>
```

### 2. Finance Manager Payments Menu Link

**Current**: Route exists and works when accessed directly
**Issue**: No visible menu link in Finance Manager's navigation
**Enhancement**: Add menu item to Header or Sidebar component

**Files to Check**:
- `src/components/Header.jsx`
- `src/components/MainLayout.jsx`
- Look for Finance_Manager specific navigation sections

---

## Files Modified in This Session

### Backend
1. `backend/routes/vouchers.js` - Fixed email API endpoint (lines 1093-1170)

### Frontend
1. `src/lib/countryCodeMapper.js` - NEW FILE: Country code mappings
2. `src/lib/mrzParser.js` - Updated to translate country codes
3. `src/pages/IndividualPurchase.jsx` - Added nationality datalist dropdown

### Build
- Production bundle built successfully (8.05 seconds)
- All changes compiled into `dist/` folder

---

## Testing Checklist

- [ ] Backend deployed and restarted
- [ ] Frontend deployed
- [ ] Email voucher works without errors
- [ ] MRZ nationality translation works
- [ ] Nationality autocomplete suggestions appear when typing
- [ ] Finance Manager can access `/app/payments`
- [ ] No console errors in browser
- [ ] No errors in PM2 logs

---

## Rollback Plan

If issues occur:

```bash
# Rollback backend only:
# Restore previous version of vouchers.js from backup
pm2 restart greenpay-api

# Rollback frontend only:
# Re-upload previous dist/ folder contents

# Check backup locations:
# Backend: Check CloudPanel file manager backup/history
# Frontend: Previous dist/ folder should be backed up before deployment
```

---

## Support

If issues persist:
1. Check PM2 logs: `pm2 logs greenpay-api --lines 200`
2. Check browser console for frontend errors
3. Verify file uploads completed successfully
4. Confirm PM2 restart was successful: `pm2 status`
