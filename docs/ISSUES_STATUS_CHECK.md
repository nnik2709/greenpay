# Issues Status Check - 2025-12-19

Based on code review, here's the current status of manual testing issues:

## ✅ Already Fixed in Code (Need Deployment Verification)

### 1. Voucher Registration Link (Issue #4)
**Status:** Code looks correct
**Location:** `backend/routes/corporate-voucher-registration.js:28-80`
- Endpoint: `GET /api/corporate-voucher-registration/voucher/:code`
- Has proper validation
- Returns 404 if voucher not found
- Checks expiration and registration status

**Action:** Need to test on production to verify

### 2. Ticket Creation (Issue #5)
**Status:** Code looks correct
**Location:** `backend/routes/tickets.js:106-148`
- Validation rules look proper:
  - `title` - required
  - `description` - required
  - `category` - must be in ['technical', 'billing', 'feature_request', 'other']
  - `priority` - optional, must be in ['low', 'medium', 'high', 'urgent']

**Action:** Need to test on production to verify if validation messages work

### 3. User Management (Issue #9)
**Status:** Code looks correct
**Location:** `backend/routes/users.js:110-180`
- Deactivate user: Uses dynamic UPDATE with `isActive` field
- Change role: Uses dynamic UPDATE with `roleId` field
- Has proper validation for "No fields to update"

**Action:** Need to test on production to see if there's a frontend issue

---

## ⚠️ Needs Investigation

### 4. Settings Update Permission Error (Issue #2)
**Location:** `backend/routes/settings.js:110-201`
**Current Code:**
- Uses proper UPDATE/INSERT logic
- All queries use parameterized statements ($1, $2, etc.)
- No direct table ownership issues visible

**Possible Causes:**
1. Database user permissions - greenpay_user might not have UPDATE privilege on settings table
2. RLS (Row Level Security) policy blocking updates
3. Frontend sending incomplete data

**Action:** Need to check database permissions on production

### 5. Passport Reports (Issue #3)
**Location:** Need to find frontend reports page
**Action:**
- Find `src/pages/reports/Passports.jsx` or similar
- Check query being sent to backend
- Backend passports route looks fine (`backend/routes/passports.js:8-60`)

### 6. Quotations Report Permission (Issue #10)
**Error:** 403 Insufficient permissions for IT_Support
**Action:**
- Check RBAC middleware for quotations reports
- Verify IT_Support role has access to reports routes

---

## 🔍 Findings from Code Review

### Settings Route Analysis
```javascript
// Line 156-168 in backend/routes/settings.js
const updateResult = await db.query(
  `UPDATE settings
   SET voucher_validity_days = $1,
       default_amount = $2,
       gst_enabled = $3,
       terms_content = $4,
       privacy_content = $5,
       refunds_content = $6,
       updated_at = NOW()
   WHERE id = $7
   RETURNING *`,
  [newVoucherDays, newDefaultAmount, newGstEnabled, newTerms, newPrivacy, newRefunds, existingResult.rows[0].id]
);
```

**This looks correct** - no direct table reference that would cause "must be owner" error.

**Likely cause:** Database user `greenpay_user` doesn't have UPDATE permission on `settings` table.

**Fix:** Need to run on production database:
```sql
GRANT UPDATE ON settings TO greenpay_user;
```

---

## Next Steps

1. **Check database permissions** for settings table
2. **Test voucher registration** on production with real voucher code
3. **Test ticket creation** on production with proper validation
4. **Test user management** functions on production
5. **Find and review** reports frontend pages
