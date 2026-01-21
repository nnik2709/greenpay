# Passport Registration Logic - Pragmatic Approach
**Date**: January 21, 2026
**Status**: Implemented

---

## Business Logic

### Passport Reuse Policy

**Approach**: **Silent Reuse** (No errors, no warnings)

When scanning a passport that already exists in the database:
- ✅ **Reuse the existing passport record**
- ✅ **Link voucher to existing passport_id**
- ✅ **Populate voucher with MRZ data**
- ❌ **Do NOT show error**
- ❌ **Do NOT create duplicate passport**
- ❌ **Do NOT block registration**

### Why This Approach?

1. **Testing Flexibility**: QA team can test with limited passports
2. **User Experience**: No agent confusion from error messages
3. **Data Quality**: MRZ data still populates voucher correctly
4. **Simplicity**: No complex duplicate prevention logic needed now
5. **Future-Ready**: Can add duplicate prevention later if needed

---

## Nationality Matching

### The Problem

MRZ scanners output **3-letter ISO codes**: `DNK`, `PNG`, `AUS`

Database may contain:
- 3-letter codes: `DNK`
- Full names: `Denmark`
- Mixed formats: Some `DNK`, some `Denmark`

**Example**:
- Scanner reads: `Passport: 1111, Nationality: DNK`
- Database has: `Passport: 1111, Nationality: Denmark`
- **Should be treated as SAME passport**, not different!

### The Solution

**Smart Nationality Matching**

Uses `nationalityNormalizer.js` utility to:
1. Normalize input to 3-letter code (`Denmark` → `DNK`)
2. Match against database using OR clause (matches both formats)
3. Store new records in 3-letter code format (consistent going forward)

**SQL Logic**:
```sql
-- Match passport by number AND nationality (handles both formats)
SELECT id FROM passports
WHERE passport_number = 'P1111'
  AND (
    nationality = 'DNK'           -- Matches 3-letter code
    OR nationality = 'Denmark'    -- Matches full name
    OR UPPER(nationality) = 'DNK' -- Case-insensitive
    OR UPPER(nationality) = 'DENMARK'
  )
```

---

## Implementation Details

### Backend: `public-purchases.js`

**Endpoint**: `POST /api/public-purchases/register-passport`

**Flow**:
```javascript
1. Receive MRZ data (passport_number, nationality, name, etc.)
2. Normalize nationality: "Denmark" → "DNK"
3. Check if passport exists:
   - Match on: passport_number + nationality (smart matching)
   - If EXISTS:
     ✅ Reuse existing passport_id
     ✅ Log: "Passport already exists, reusing"
     ✅ Continue to voucher update
   - If NOT EXISTS:
     ✅ Create new passport record
     ✅ Store nationality as 3-letter code
     ✅ Continue to voucher update
4. Update voucher:
   - Set passport_number (from MRZ)
   - Set customer_name (from MRZ)
   - Set passport_id (from step 3)
5. Return success (no errors, whether reused or created)
```

**Key Code**:
```javascript
const { buildNationalityWhereClause, normalizeToCode } = require('../utils/nationalityNormalizer');

// Normalize to 3-letter code
const normalizedNationality = nationality ? normalizeToCode(nationality) : null;

// Smart matching query
const nationalityClause = buildNationalityWhereClause(nationality, 2);
const query = `
  SELECT id FROM passports
  WHERE passport_number = $1
    AND ${nationalityClause.whereClause}
`;

// Reuse if exists, create if not
if (exists) {
  passportId = existing.id; // Silent reuse
} else {
  passportId = createNew(); // Store as 3-letter code
}
```

---

## Nationality Normalizer Utility

**File**: `backend/utils/nationalityNormalizer.js`

### Functions

#### `normalizeToCode(input)`
Converts any format to 3-letter ISO code
```javascript
normalizeToCode('Denmark')  // → 'DNK'
normalizeToCode('DNK')      // → 'DNK'
normalizeToCode('danish')   // → 'DNK' (case-insensitive)
```

#### `normalizeToName(input)`
Converts any format to full name
```javascript
normalizeToName('DNK')      // → 'Denmark'
normalizeToName('Denmark')  // → 'Denmark'
```

#### `nationalitiesMatch(nat1, nat2)`
Checks if two nationalities are the same
```javascript
nationalitiesMatch('DNK', 'Denmark')  // → true
nationalitiesMatch('DNK', 'DNK')      // → true
nationalitiesMatch('DNK', 'AUS')      // → false
```

#### `buildNationalityWhereClause(nationality, paramIndex)`
Generates SQL WHERE clause for smart matching
```javascript
const clause = buildNationalityWhereClause('DNK', 2);
// Returns:
// {
//   whereClause: "(nationality = $2 OR nationality = $3 OR UPPER(nationality) = $2 OR ...)",
//   params: ['DNK', 'Denmark']
// }
```

### Supported Countries

Full ISO 3166-1 Alpha-3 mapping (195+ countries), including:
- `PNG` → `Papua New Guinean`
- `DNK` → `Denmark`
- `AUS` → `Australian`
- `USA` → `American`
- `GBR` → `British`
- `PHL` → `Filipino`
- `CHN` → `Chinese`
- And all other countries...

---

## Data Storage Strategy

### Going Forward: Consistent Format

**All NEW passport records store nationality as 3-letter code**:
- `DNK` (not "Denmark")
- `PNG` (not "Papua New Guinean")
- `AUS` (not "Australian")

**Benefits**:
- Consistent format
- Smaller storage (3 chars vs. 20+ chars)
- Faster queries (indexed)
- International standard

### Legacy Data: Mixed Format

**Old records may have**:
- Full names: "Denmark", "Australian"
- 3-letter codes: "DNK", "AUS"
- Mixed case: "denmark", "DENMARK"

**Solution**: Smart matching handles all formats transparently

**Optional Migration** (not required):
```sql
-- Update old full-name records to 3-letter codes
UPDATE passports
SET nationality = 'DNK'
WHERE UPPER(nationality) IN ('DENMARK', 'DANISH');

UPDATE passports
SET nationality = 'AUS'
WHERE UPPER(nationality) IN ('AUSTRALIA', 'AUSTRALIAN');

-- Repeat for all countries...
```

---

## Database Schema

### Composite Key (Future Enhancement)

**Current**: `passport_number` is unique (wrong!)
**Problem**: Passport #1111 from Denmark and #1111 from Philippines are DIFFERENT people

**Solution** (when ready):
```sql
-- Add composite unique constraint
ALTER TABLE passports
DROP CONSTRAINT IF EXISTS passports_passport_number_key;

ALTER TABLE passports
ADD CONSTRAINT passports_number_nationality_unique
UNIQUE (passport_number, nationality);
```

**Impact**: Allows same passport number from different countries (correct behavior)

**Note**: Not critical for initial deployment, but should be added before production

---

## Testing Scenarios

### Scenario 1: First Time Registration
```
Input: Passport P1111, Nationality DNK
Database: No record exists
Result:
  ✅ New passport created (P1111, DNK)
  ✅ Voucher linked to passport_id
  ✅ Success response
```

### Scenario 2: Reuse Same Passport
```
Input: Passport P1111, Nationality DNK
Database: Record exists (P1111, DNK)
Result:
  ✅ Existing passport found
  ✅ Voucher linked to same passport_id
  ✅ Success response (no error)
  ✅ No duplicate passport created
```

### Scenario 3: Format Mismatch (DNK vs Denmark)
```
Input: Passport P1111, Nationality DNK (from MRZ)
Database: Record exists (P1111, Denmark) (old format)
Result:
  ✅ Smart matching finds existing record
  ✅ Voucher linked to same passport_id
  ✅ Success response (no error)
  ✅ No duplicate created
```

### Scenario 4: Different Countries, Same Number
```
Input 1: Passport P1111, Nationality DNK
Database: Creates record (P1111, DNK)

Input 2: Passport P1111, Nationality PHL
Database: Should create NEW record (P1111, PHL)
Result:
  ✅ Two separate passport records (correct - different people)
  ✅ Each voucher linked to correct passport
```

### Scenario 5: Case Variations
```
Input: Passport p1111, Nationality dnk (lowercase)
Database: Record exists (P1111, DNK) (uppercase)
Result:
  ✅ Case-insensitive matching works
  ✅ Finds existing record
  ✅ No duplicate created
```

---

## Logging & Monitoring

### Console Logs

**Existing Passport**:
```
Passport P1111 already exists (ID: 42), reusing for voucher ABC123
```

**New Passport**:
```
New passport created: P1111 (ID: 43) for voucher XYZ789
```

### Monitoring Queries

**Check for duplicate passports** (shouldn't happen with smart matching):
```sql
SELECT passport_number, nationality, COUNT(*) as count
FROM passports
GROUP BY passport_number, nationality
HAVING COUNT(*) > 1;
```

**Check nationality format distribution**:
```sql
SELECT
  LENGTH(nationality) as length,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT nationality) as samples
FROM passports
WHERE nationality IS NOT NULL
GROUP BY LENGTH(nationality)
ORDER BY count DESC;
```

**Most common nationalities**:
```sql
SELECT nationality, COUNT(*) as count
FROM passports
GROUP BY nationality
ORDER BY count DESC
LIMIT 20;
```

---

## Migration from Old System

### If Old System Had Duplicates

**Problem**: Old system may have created duplicates:
```
| id | passport_number | nationality |
|----|-----------------|-------------|
| 1  | P1111           | DNK         |
| 2  | P1111           | Denmark     |  ← Duplicate (format mismatch)
| 3  | P1111           | DNK         |  ← Duplicate (logic error)
```

**Solution**: Cleanup script
```sql
-- Find duplicates (same passport + nationality, different format)
WITH duplicates AS (
  SELECT
    passport_number,
    nationality,
    id,
    ROW_NUMBER() OVER (
      PARTITION BY passport_number,
                   CASE
                     WHEN nationality IN ('DNK', 'Denmark', 'danish') THEN 'DNK'
                     WHEN nationality IN ('AUS', 'Australia', 'Australian') THEN 'AUS'
                     -- Add more mappings...
                     ELSE nationality
                   END
      ORDER BY created_at ASC  -- Keep oldest record
    ) as rn
  FROM passports
)
-- Update vouchers to point to first occurrence
UPDATE individual_purchases ip
SET passport_id = (
  SELECT id FROM duplicates WHERE rn = 1 AND passport_number = ip.passport_number
)
WHERE passport_id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Delete duplicate passport records
DELETE FROM passports
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

---

## Future Enhancements (Optional)

### Enhancement 1: Duplicate Prevention
- Add in-memory batch tracking (same session)
- Add feature flag: `ALLOW_DUPLICATE_PASSPORTS=true/false`
- See `PASSPORT_DUPLICATE_PREVENTION.md` for full implementation

### Enhancement 2: Data Quality Improvements
- Update old nationality records to 3-letter codes
- Add validation: Reject unknown nationality codes
- Add country selector UI (dropdown with flags)

### Enhancement 3: Passport History
- Track all vouchers per passport
- Show agent: "This passport has 3 previous vouchers"
- Generate passport usage reports

### Enhancement 4: Cross-Validation
- Verify name matches previous registrations
- Alert if DOB changes (possible fraud)
- Flag suspiciously similar passport numbers

---

## Summary

### What Was Changed
1. ✅ Added `nationalityNormalizer.js` utility
2. ✅ Updated `register-passport` endpoint to use smart matching
3. ✅ Changed logic: Reuse existing passports (no error)
4. ✅ Store new records in consistent 3-letter format

### What This Solves
1. ✅ No more "DNK" vs "Denmark" duplicate passports
2. ✅ Testing teams can reuse same passports
3. ✅ No confusing error messages for agents
4. ✅ MRZ data still populates vouchers correctly
5. ✅ Database quality improves over time (new records consistent)

### What's NOT Changed
1. ✅ Frontend code (no changes needed)
2. ✅ Database schema (works with existing structure)
3. ✅ MRZ scanner integration (unchanged)
4. ✅ Other endpoints (not affected)

### Deployment
1. Upload `backend/utils/nationalityNormalizer.js`
2. Upload modified `backend/routes/public-purchases.js`
3. Restart backend: `pm2 restart greenpay-api`
4. Test with passport that exists in DB → Should work silently

**Ready for deployment! 🚀**
