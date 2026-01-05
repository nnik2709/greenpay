# Critical Fixes to Apply on Production

## Summary of Issues Found

Based on database queries, we found:
- ✅ **147 passports** exist in database
- ✅ **Voucher code 1XNDLVY9** is valid and exists
- ✅ **User management** structure is correct
- ✅ **Corporate vouchers** status is correctly showing `pending_passport`
- ❌ **Settings table** has WRONG schema (key/value instead of individual columns)
- ❌ **Quotations table** missing `company_name` column
- ❌ **Passport reports** frontend expects separate `surname`/`given_name` fields

---

## PRIORITY 1: Fix Settings Table (Issue #2)

### Problem:
Settings table has this structure:
```
id | key | value | description | updated_by | updated_at
```

But code expects:
```
id | voucher_validity_days | default_amount | gst_enabled | terms_content | privacy_content | refunds_content | created_at | updated_at
```

### Solution:
Run migration script:

```bash
sudo -u postgres psql greenpay_db -f database/migrations/003_fix_settings_table_structure.sql
```

### What it does:
1. Backs up existing settings table
2. Drops and recreates with correct schema
3. Inserts default values
4. Grants permissions to greenpay_user

### Expected result:
✅ Settings update in `/app/admin/settings` will work

---

## PRIORITY 2: Fix Quotations Table (Issue #10)

### Problem:
Quotations table missing `company_name` column (and possibly others)

### Solution:
```bash
sudo -u postgres psql greenpay_db -f database/migrations/004_fix_quotations_table.sql
```

### What it does:
1. Adds missing columns: company_name, quotation_number, total_amount, status
2. Sets default values for existing records
3. Verifies structure

### Expected result:
✅ Quotations Report will work for IT_Support role

---

## PRIORITY 3: Fix Passport Reports (Issue #3)

### Problem:
Frontend code (`src/pages/reports/PassportReports.jsx:55-56`) expects:
- `surname` (separate field)
- `given_name` or `givenName` (separate field)

But production database only has:
- `full_name` (single field combining both)

### Solution Option A: Update Frontend (Recommended)
Update `PassportReports.jsx` to parse `full_name`:

```javascript
// Line 50-60 in PassportReports.jsx
const transformedData = passports.map(p => {
  // Parse full_name into surname and given name
  let surname = '';
  let givenName = '';

  if (p.full_name) {
    const parts = p.full_name.split(' ');
    if (parts.length > 0) {
      surname = parts[parts.length - 1]; // Last word as surname
      givenName = parts.slice(0, -1).join(' '); // Rest as given name
    }
  }

  return {
    id: p.id,
    type: 'P',
    nationality: p.nationality,
    passportNo: p.passport_number || p.passportNo,
    surname: surname || p.surname, // Fallback to direct field if exists
    givenName: givenName || p.given_name || p.givenName,
    dob: p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : (p.dob || ''),
    sex: p.sex || '',
    dateOfExpiry: p.date_of_expiry ? new Date(p.date_of_expiry).toLocaleDateString() : (p.dateOfExpiry || ''),
  };
});
```

### Solution Option B: Add Database Columns
Add `surname` and `given_name` columns to passports table and populate from `full_name`

**Recommendation:** Use Option A - simpler and faster

---

## ALREADY WORKING (No Fix Needed)

### Issue #4: Voucher Registration
✅ **WORKING** - Voucher code `1XNDLVY9` exists in database and is valid
- Status: `pending_passport`
- Valid until: 2026-12-18
- Company: Test Company

**Action:** Just need to verify frontend form is working

### Issue #5: Ticket Creation
✅ **CODE IS CORRECT** - Backend validation looks proper
- Requires: title, description
- Category: must be in ['technical', 'billing', 'feature_request', 'other']
- Priority: optional, must be in ['low', 'medium', 'high', 'urgent']

**Action:** Test on production - might be a frontend form issue

### Issue #9: User Management
✅ **CODE IS CORRECT** - Update logic is dynamic and proper
- Deactivate user: sets `isActive = false`
- Change role: updates `roleId`

**Action:** Test on production - might be a frontend API call issue

### Issue #11: Corporate Vouchers Status
✅ **ALREADY CORRECT** - Database shows `pending_passport` (not "Active")
- Verified: All vouchers without passports have status = 'pending_passport'

**Action:** This issue may have been fixed already or was a misreport

---

## COMMANDS TO RUN

### Step 1: Fix Settings Table
```bash
sudo -u postgres psql greenpay_db << 'EOF'
\i database/migrations/003_fix_settings_table_structure.sql
EOF
```

### Step 2: Fix Quotations Table
```bash
sudo -u postgres psql greenpay_db << 'EOF'
\i database/migrations/004_fix_quotations_table.sql
EOF
```

### Step 3: Deploy Frontend Fix
After I create the PassportReports.jsx fix, run:
```bash
npm run build
scp -r dist/* root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

### Step 4: Restart API
```bash
ssh root@165.22.52.100
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20 --nostream
```

---

## VERIFICATION TESTS

### Test Settings Update
```bash
# Get auth token
TOKEN=$(curl -s -X POST https://greenpay.eywademo.cloud/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"flexadmin@greenpay.com","password":"your_password"}' | jq -r '.token')

# Test update
curl -X PUT https://greenpay.eywademo.cloud/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"voucher_validity_days":30,"default_amount":50}' | jq
```

### Test Passport Reports
Visit: `https://greenpay.eywademo.cloud/app/reports/passports`
- Should see 147 passports
- Should display full names properly (not blank)

### Test Voucher Registration
Visit: `https://greenpay.eywademo.cloud/register/1XNDLVY9`
- Should show voucher details
- Should allow registration

---

## NEXT STEPS

1. Run database migrations (003 and 004)
2. I'll create frontend fix for PassportReports.jsx
3. Build and deploy frontend
4. Test all fixed features
5. Move to remaining issues (email, navigation, UI/UX)
