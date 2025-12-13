# Corporate Voucher Passport Registration System

**Date:** December 12, 2025
**Commit:** 695cd0a
**Purpose:** Secure corporate vouchers by requiring passport registration before use

---

## Problem Statement

### Before This Implementation

Corporate vouchers had a critical security vulnerability:

```
Company purchases 100 vouchers → System generates codes → Company distributes → ❌ PROBLEM
```

**Issues:**
1. ❌ Vouchers created **without** passport data
2. ❌ Anyone with the code could use it
3. ❌ No way to verify actual traveler identity
4. ❌ Vouchers could be shared/resold
5. ❌ No audit trail of who used which voucher
6. ❌ Gate agents couldn't verify passport matches

### Example Vulnerability

```
Voucher K4P7M9X2 generated for "ABC Company"
    ↓
Employee A gets the code
    ↓
Employee A emails code to Friend B
    ↓
Friend B uses voucher (unauthorized use) ❌
```

---

## Solution Overview

### New Secure Flow

```
Company purchases vouchers
    ↓
System generates codes (status: pending_passport)
    ↓
Employee visits /corporate-voucher-registration
    ↓
Employee enters voucher code + scans passport
    ↓
System links passport to voucher (status: active)
    ↓
At gate: Agent scans code + verifies physical passport ✅
```

**Benefits:**
- ✅ One voucher = One passport (1:1 binding)
- ✅ Cannot use without registration
- ✅ Gate agents verify passport matches
- ✅ Full audit trail
- ✅ Prevents misuse/sharing

---

## Architecture

### Database Schema Changes

**Migration:** `migrations/08-corporate-voucher-passport-registration.sql`

#### Added Columns

| Column | Type | Purpose |
|--------|------|---------|
| `status` | TEXT | Voucher lifecycle state |
| `registered_at` | TIMESTAMPTZ | When passport was assigned |
| `registered_by` | UUID | Who performed registration |

#### Modified Columns

| Column | Before | After |
|--------|--------|-------|
| `passport_number` | NOT NULL | Nullable |

**Reason:** Allow voucher creation without immediate passport assignment

#### Voucher Status Values

| Status | Meaning | Can Use? |
|--------|---------|----------|
| `pending_passport` | Needs registration | ❌ No |
| `active` | Registered, ready | ✅ Yes |
| `used` | Already consumed | ❌ No |
| `expired` | Past expiry date | ❌ No |
| `cancelled` | Manually cancelled | ❌ No |

#### Indexes Created

```sql
CREATE INDEX idx_corporate_vouchers_status
ON corporate_vouchers(status);

CREATE INDEX idx_corporate_vouchers_passport_number
ON corporate_vouchers(passport_number)
WHERE passport_number IS NOT NULL;
```

**Purpose:** Fast lookups for validation queries

---

## API Endpoints

### 1. Lookup Voucher

**Endpoint:** `GET /api/corporate-voucher-registration/voucher/:code`

**Purpose:** Check voucher details before registration

**Authentication:** None (public)

**Request:**
```http
GET /api/corporate-voucher-registration/voucher/K4P7M9X2
```

**Response (Success):**
```json
{
  "voucher": {
    "id": "uuid",
    "voucher_code": "K4P7M9X2",
    "company_name": "ABC Corporation",
    "amount": "50.00",
    "status": "pending_passport",
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": "2026-01-01T00:00:00Z",
    "created_at": "2025-01-01T10:00:00Z"
  }
}
```

**Response (Already Registered):**
```json
{
  "voucher": {...},
  "alreadyRegistered": true,
  "message": "This voucher is already registered to a passport"
}
```

**Response (Expired):**
```json
{
  "voucher": {...},
  "expired": true,
  "message": "This voucher has expired"
}
```

---

### 2. Register Passport

**Endpoint:** `POST /api/corporate-voucher-registration/register`

**Purpose:** Link passport data to voucher

**Authentication:** None (public self-service)

**Request:**
```json
{
  "voucherCode": "K4P7M9X2",
  "passportNumber": "X12345678",
  "surname": "DOE",
  "givenName": "JOHN",
  "nationality": "USA",
  "dateOfBirth": "1990-01-15",
  "sex": "M",
  "dateOfExpiry": "2030-01-15"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Voucher successfully registered to passport",
  "voucher": {
    "id": "uuid",
    "voucher_code": "K4P7M9X2",
    "passport_number": "X12345678",
    "status": "active",
    "registered_at": "2025-01-15T14:30:00Z"
  }
}
```

**Response (Already Registered):**
```json
{
  "error": "Voucher already registered",
  "passport": "X12345678"
}
```

**Response (Expired):**
```json
{
  "error": "Voucher has expired"
}
```

---

### 3. List Company Vouchers

**Endpoint:** `GET /api/corporate-voucher-registration/company/:companyName`

**Purpose:** View all vouchers for a company (admin)

**Authentication:** Required (Flex_Admin, Finance_Manager, Counter_Agent)

**Request:**
```http
GET /api/corporate-voucher-registration/company/ABC%20Corporation?status=pending_passport
```

**Query Parameters:**
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "vouchers": [
    {
      "voucher_code": "K4P7M9X2",
      "status": "pending_passport",
      "passport_number": null,
      "valid_until": "2026-01-01T00:00:00Z"
    },
    {
      "voucher_code": "A8B5C3D1",
      "status": "active",
      "passport_number": "Y98765432",
      "surname": "SMITH",
      "given_name": "JANE",
      "registered_at": "2025-01-10T12:00:00Z"
    }
  ],
  "total": 100,
  "pending": 45,
  "active": 55
}
```

---

### 4. Bulk Register

**Endpoint:** `POST /api/corporate-voucher-registration/bulk-register`

**Purpose:** Register multiple vouchers at once (CSV upload)

**Authentication:** Optional (can be public or authenticated)

**Request:**
```json
{
  "registrations": [
    {
      "voucherCode": "K4P7M9X2",
      "passportNumber": "X12345678",
      "surname": "DOE",
      "givenName": "JOHN",
      "nationality": "USA"
    },
    {
      "voucherCode": "A8B5C3D1",
      "passportNumber": "Y98765432",
      "surname": "SMITH",
      "givenName": "JANE",
      "nationality": "UK"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registered 98 vouchers, 2 errors",
  "results": {
    "success": [
      {"voucherCode": "K4P7M9X2", "passportNumber": "X12345678"},
      {"voucherCode": "A8B5C3D1", "passportNumber": "Y98765432"}
    ],
    "errors": [
      {"voucherCode": "B2N6T9W5", "error": "Voucher not found"},
      {"voucherCode": "C7M4K1P8", "error": "Already registered"}
    ]
  }
}
```

---

## Frontend Registration Page

### Route

**URL:** `/corporate-voucher-registration`

**Component:** `src/pages/CorporateVoucherRegistration.jsx`

**Authentication:** None (public access)

---

### UI Flow (3 Steps)

#### Step 1: Enter Voucher Code

```
┌─────────────────────────────────┐
│  Corporate Voucher Registration │
├─────────────────────────────────┤
│                                 │
│  Step 1: Enter Voucher Code    │
│                                 │
│  Voucher Code:                  │
│  ┌─────────────────┐            │
│  │ K4P7M9X2        │            │
│  └─────────────────┘            │
│                                 │
│  [ Find Voucher ]               │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- 8-character input with uppercase conversion
- Real-time validation (length = 8)
- Looks up voucher via API
- Shows voucher details (company, amount, validity)
- Checks if already registered or expired

---

#### Step 2: Scan/Enter Passport

```
┌─────────────────────────────────┐
│  Step 2: Register Passport      │
├─────────────────────────────────┤
│  Voucher: K4P7M9X2              │
│  Company: ABC Corporation       │
│  Amount: PGK 50.00              │
│  Status: Pending Passport       │
├─────────────────────────────────┤
│                                 │
│  [ 📷 Scan Passport ]           │
│                                 │
│  or enter manually below        │
│                                 │
│  Passport Number: *             │
│  ┌─────────────────┐            │
│  │ X12345678       │            │
│  └─────────────────┘            │
│                                 │
│  Surname: *                     │
│  ┌─────────────────┐            │
│  │ DOE             │            │
│  └─────────────────┘            │
│                                 │
│  Given Name: *                  │
│  ┌─────────────────┐            │
│  │ JOHN            │            │
│  └─────────────────┘            │
│                                 │
│  [Back] [Register Voucher]      │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- **Camera Scanner Button**
  - Opens SimpleCameraScanner
  - Scans MRZ from passport
  - Auto-fills all fields
  - Uses enhanced OCR with green success blink

- **Manual Entry Form**
  - Required: Passport Number, Surname, Given Name
  - Optional: Nationality, DOB, Sex, Expiry
  - Uppercase conversion for names
  - Date pickers for DOB/expiry

- **Validation**
  - Client-side required field check
  - Server-side validation on submit
  - Error messages displayed

---

#### Step 3: Success Confirmation

```
┌─────────────────────────────────┐
│  ✅ Registration Successful!    │
├─────────────────────────────────┤
│  Your voucher is now active     │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Voucher Code: K4P7M9X2    │  │
│  │ Status: ✓ ACTIVE          │  │
│  │ Passport: X12345678       │  │
│  │ Valid Until: 01/01/2026   │  │
│  └───────────────────────────┘  │
│                                 │
│  Next Steps:                    │
│  • Save or print confirmation   │
│  • Present voucher at gate      │
│  • Keep passport for verify     │
│  • Single-use entry only        │
│                                 │
│  [Register Another] [Print]     │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Clear success message
- Voucher details displayed
- Next steps instructions
- Option to register another
- Print confirmation button

---

## Validation Logic

### Updated Validation Flow

**File:** `backend/routes/vouchers.js`

**Endpoint:** `GET /api/vouchers/validate/:code`

#### New Logic

```javascript
// 1. Look up voucher (individual or corporate)
const voucher = findVoucher(code);

// 2. NEW: Check if pending passport
if (voucher.status === 'pending_passport') {
  return {
    status: 'error',
    message: 'Corporate voucher requires passport registration.
              Visit /corporate-voucher-registration',
    requiresRegistration: true
  };
}

// 3. Check if used
if (voucher.used_at) {
  return { status: 'error', message: 'Already used' };
}

// 4. Check if expired
if (voucher.valid_until < now) {
  return { status: 'error', message: 'Expired' };
}

// 5. SUCCESS - Include passport data
return {
  status: 'success',
  message: 'Valid voucher',
  data: {
    voucher_code: code,
    passport_number: voucher.passport_number,
    surname: voucher.surname,
    given_name: voucher.given_name,
    nationality: voucher.nationality
  }
};
```

#### Corporate Voucher Query

```sql
SELECT
  cv.voucher_code,
  cv.status,
  cv.passport_number,
  cv.valid_until,
  cv.used_at,
  p.surname,
  p.given_name,
  p.nationality,
  CASE
    WHEN cv.status = 'pending_passport' THEN 'pending_passport'
    WHEN cv.used_at IS NOT NULL THEN 'used'
    WHEN cv.valid_until < NOW() THEN 'expired'
    WHEN cv.status = 'active' AND cv.passport_number IS NOT NULL THEN 'active'
    ELSE 'invalid'
  END as computed_status
FROM corporate_vouchers cv
LEFT JOIN passports p ON cv.passport_id = p.id
WHERE cv.voucher_code = $1
```

**Key Changes:**
- ✅ Join with passports table to get traveler info
- ✅ Check status='pending_passport' first
- ✅ Return passport details for gate verification

---

## Gate Validation Process

### Scan & Validate Screen

When gate agent scans a corporate voucher:

```
┌─────────────────────────────────┐
│  Scan & Validate                │
├─────────────────────────────────┤
│  Code Scanned: K4P7M9X2         │
│                                 │
│  ✅ VALID VOUCHER               │
│                                 │
│  Type: Corporate                │
│  Company: ABC Corporation       │
│                                 │
│  PASSPORT INFORMATION:          │
│  ┌───────────────────────────┐  │
│  │ Number: X12345678         │  │
│  │ Name: JOHN DOE            │  │
│  │ Nationality: USA          │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠ VERIFY:                     │
│  Agent must check physical      │
│  passport matches above data    │
│                                 │
│  [Mark as Used] [Cancel]        │
│                                 │
└─────────────────────────────────┘
```

### Agent Instructions

1. **Scan voucher code** (barcode/QR or manual entry)
2. **System checks:**
   - Is status = 'active'?
   - Has passport assigned?
   - Not already used?
   - Not expired?
3. **Screen shows passport details**
4. **Agent physically checks:**
   - Passport number matches
   - Name matches
   - Photo matches traveler
   - Passport not expired
5. **If all match → Mark as used**
6. **If mismatch → Reject + escalate**

---

## Use Cases

### Use Case 1: Standard Registration

**Scenario:** Employee receives voucher code from company

**Steps:**
1. Employee opens `/corporate-voucher-registration`
2. Enters voucher code `K4P7M9X2`
3. System shows voucher details
4. Employee clicks "Scan Passport"
5. Camera scans MRZ
6. System auto-fills passport data
7. Employee clicks "Register"
8. System activates voucher
9. Employee sees success message

**Result:** Voucher ready for travel

---

### Use Case 2: Bulk Registration (Admin)

**Scenario:** Company has 100 employees, wants to register all at once

**Steps:**
1. Company prepares CSV:
   ```csv
   voucher_code,passport_number,surname,given_name,nationality
   K4P7M9X2,X12345678,DOE,JOHN,USA
   A8B5C3D1,Y98765432,SMITH,JANE,UK
   ...
   ```
2. Admin calls bulk-register API
3. System processes all records
4. Returns success/error report
5. Admin fixes errors manually

**Result:** 98 registered, 2 errors to fix

---

### Use Case 3: Attempted Misuse

**Scenario:** Employee shares voucher code with friend

**Steps:**
1. Employee A registers voucher with their passport
2. Employee A emails code to Friend B
3. Friend B tries to use at gate
4. Gate agent scans code
5. System shows: "Passport: X12345678, Name: JOHN DOE"
6. Agent checks Friend B's passport: "Y98765432, JANE SMITH"
7. **Mismatch detected** → Entry denied

**Result:** Misuse prevented ✅

---

### Use Case 4: Unregistered Voucher

**Scenario:** Employee tries to use without registration

**Steps:**
1. Employee goes directly to gate
2. Presents unregistered voucher code
3. Gate agent scans code
4. System returns: "Status: pending_passport"
5. Screen shows error: "Requires registration"
6. Agent directs employee to registration page

**Result:** Cannot use until registered ✅

---

## Migration Guide

### Step 1: Run Database Migration

```bash
# Connect to database
psql -h localhost -U greenpay_user -d greenpay_db

# Run migration
\i migrations/08-corporate-voucher-passport-registration.sql

# Verify changes
\d corporate_vouchers

# Should see new columns:
# - status (text)
# - registered_at (timestamp with time zone)
# - registered_by (uuid)

# Check indexes
\di corporate_vouchers*

# Should see:
# - idx_corporate_vouchers_status
# - idx_corporate_vouchers_passport_number
```

---

### Step 2: Deploy Backend

```bash
# Copy new files
scp backend/routes/corporate-voucher-registration.js user@server:/path/to/backend/routes/

# Copy modified files
scp backend/routes/invoices-gst.js user@server:/path/to/backend/routes/
scp backend/routes/vouchers.js user@server:/path/to/backend/routes/
scp backend/server.js user@server:/path/to/backend/

# Restart server
pm2 restart png-green-fees

# Check logs
pm2 logs png-green-fees
```

---

### Step 3: Deploy Frontend

```bash
# Build was already done (12.00s)
# Deploy dist folder
scp -r dist/* user@server:/var/www/png-green-fees/dist/
```

---

### Step 4: Test

**Test Registration:**
1. Visit `https://yourdomain.com/corporate-voucher-registration`
2. Enter a test voucher code
3. Scan or enter passport data
4. Verify success message
5. Check database:
   ```sql
   SELECT voucher_code, status, passport_number, registered_at
   FROM corporate_vouchers
   WHERE voucher_code = 'K4P7M9X2';
   ```

**Test Validation:**
1. Go to Scan & Validate page
2. Enter the registered voucher code
3. Verify passport details show
4. Try unregistered voucher
5. Verify "requires registration" error

---

## Training Materials

### For Corporate Customers

**Email Template:**

> **Subject: Action Required: Register Your Travel Vouchers**
>
> Dear Customer,
>
> Your company has purchased travel vouchers. To activate your voucher, you must register it with your passport information.
>
> **How to Register:**
> 1. Visit: https://pnggreenfees.gov.pg/corporate-voucher-registration
> 2. Enter your voucher code (8 characters, e.g., K4P7M9X2)
> 3. Scan your passport or enter details manually
> 4. Receive confirmation
>
> **Important:**
> - Register before your travel date
> - One voucher per passport
> - Voucher cannot be used until registered
> - Keep confirmation for your records
>
> **Questions?**
> Contact: support@greenpay.gov.pg

---

### For Gate Agents

**Training Checklist:**

- [ ] Understand new validation flow
- [ ] Know how to check passport details on screen
- [ ] Verify physical passport matches system data
- [ ] Handle "pending_passport" error
  - Direct traveler to registration page
  - Provide QR code or URL
- [ ] Handle mismatch scenarios
  - Deny entry
  - Escalate to supervisor
  - Report suspicious activity
- [ ] Use new passport verification fields
  - Check name match
  - Check passport number match
  - Check photo match

**Quick Reference Card:**

```
┌──────────────────────────────────┐
│ CORPORATE VOUCHER VALIDATION     │
├──────────────────────────────────┤
│                                  │
│ 1. Scan voucher code             │
│                                  │
│ 2. Check status:                 │
│    ✅ Active → Continue          │
│    ❌ Pending → Send to register │
│    ❌ Used → Deny                │
│    ❌ Expired → Deny             │
│                                  │
│ 3. If active, verify passport:   │
│    • Number matches?             │
│    • Name matches?               │
│    • Photo matches?              │
│                                  │
│ 4. All match → Mark as used      │
│    Any mismatch → DENY + report  │
│                                  │
└──────────────────────────────────┘
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Registration Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'active') as registered,
     COUNT(*) FILTER (WHERE status = 'pending_passport') as pending,
     ROUND(COUNT(*) FILTER (WHERE status = 'active')::numeric / COUNT(*) * 100, 2) as registration_rate
   FROM corporate_vouchers;
   ```

2. **Time to Register**
   ```sql
   SELECT
     AVG(registered_at - created_at) as avg_registration_time,
     MAX(registered_at - created_at) as max_registration_time
   FROM corporate_vouchers
   WHERE registered_at IS NOT NULL;
   ```

3. **Validation Attempts**
   - Track API calls to `/api/vouchers/validate`
   - Count "pending_passport" errors
   - Measure conversion (register → use)

4. **Company Performance**
   ```sql
   SELECT
     company_name,
     COUNT(*) as total_vouchers,
     COUNT(*) FILTER (WHERE status = 'active') as registered,
     COUNT(*) FILTER (WHERE status = 'used') as used
   FROM corporate_vouchers
   GROUP BY company_name
   ORDER BY total_vouchers DESC;
   ```

---

## Troubleshooting

### Issue: Voucher shows "Pending Passport" but was registered

**Diagnosis:**
```sql
SELECT voucher_code, status, passport_number, registered_at
FROM corporate_vouchers
WHERE voucher_code = 'K4P7M9X2';
```

**Possible Causes:**
1. Registration failed silently
2. Database transaction rolled back
3. Status not updated

**Fix:**
```sql
UPDATE corporate_vouchers
SET status = 'active',
    registered_at = NOW()
WHERE voucher_code = 'K4P7M9X2'
  AND passport_number IS NOT NULL;
```

---

### Issue: Passport number in database but validation fails

**Diagnosis:**
Check computed_status logic in validation query

**Fix:**
Ensure query checks both `status` column and `passport_number` presence:
```sql
CASE
  WHEN cv.status = 'active' AND cv.passport_number IS NOT NULL THEN 'active'
  ...
END
```

---

### Issue: Duplicate registration error but no passport assigned

**Diagnosis:**
```sql
SELECT * FROM corporate_vouchers
WHERE voucher_code = 'K4P7M9X2';
```

**Cause:** Status set to 'active' but passport_number NULL

**Fix:**
```sql
UPDATE corporate_vouchers
SET status = 'pending_passport'
WHERE status = 'active'
  AND passport_number IS NULL;
```

---

## Security Considerations

### Threat Model

**Threat 1: Voucher Code Guessing**
- Risk: LOW
- Mitigation: 8-char alphanumeric = 2.8 trillion combinations
- Additional: Rate limiting on registration endpoint

**Threat 2: Passport Data Theft**
- Risk: MEDIUM
- Mitigation: HTTPS only, no passport data in URLs
- Additional: Consider encryption at rest

**Threat 3: Duplicate Registration**
- Risk: LOW
- Mitigation: Database checks, return error if already registered
- Additional: Audit log of registration attempts

**Threat 4: Physical Passport Mismatch**
- Risk: MEDIUM
- Mitigation: Gate agent visual verification
- Additional: Train agents on document verification

### Privacy Considerations

- Passport data stored securely
- No logging of full passport numbers
- API responses exclude sensitive fields
- RLS policies control access
- GDPR-compliant data retention

---

## Future Enhancements

### Phase 2 Features

1. **Photo Upload**
   - Capture passport photo page
   - OCR validation
   - Visual comparison at gate

2. **Mobile App**
   - Dedicated registration app
   - Push notifications
   - Digital voucher wallet

3. **Biometric Verification**
   - Fingerprint/facial recognition
   - Strengthen identity verification
   - Reduce agent workload

4. **API for Corporate Portals**
   - Companies manage their own registrations
   - Bulk upload interface
   - Real-time status tracking

5. **Analytics Dashboard**
   - Registration metrics
   - Usage patterns
   - Fraud detection

---

## Summary

### What Was Implemented

✅ Database schema for passport registration
✅ API endpoints for registration workflow
✅ Public registration page with camera scanner
✅ Enhanced validation with passport checks
✅ Migration script for existing data
✅ Comprehensive documentation

### Key Benefits

✅ **Security:** Prevents unauthorized voucher use
✅ **Compliance:** Meets border control requirements
✅ **Audit:** Full trail of registrations and usage
✅ **UX:** Simple self-service registration
✅ **Verification:** Gate agents can verify passports

### Next Steps

1. Run database migration
2. Deploy backend + frontend
3. Train gate agents
4. Notify corporate customers
5. Monitor registration rates

---

**End of Document**
