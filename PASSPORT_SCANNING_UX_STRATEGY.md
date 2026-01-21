# Passport Scanning UX Strategy for Airport Kiosks
**Date**: January 21, 2026
**Perspective**: Airport Check-in Best Practices

---

## Core Principles

### 1. Speed is Critical
Airport operations demand **sub-5-second** transactions. Every database lookup, comparison, and update adds latency.

### 2. MRZ Scanner is Source of Truth
The physical passport (MRZ data) is the **authoritative source** at the moment of transaction. Database records may be outdated.

### 3. Data Quality Over Deduplication
Better to have accurate, current data than enforce strict deduplication with stale information.

---

## Recommended UX Flow

### Scenario 1: New Passport (Not in DB)
**Flow**: Fast path - no lookups needed
```
1. Scan MRZ → Parse data
2. Create passport record
3. Link to voucher
4. Complete (< 2 seconds)
```

**Implementation**:
- No pre-check needed
- INSERT with ON CONFLICT DO NOTHING
- Use RETURNING clause to get passport_id
- Single database round-trip

---

### Scenario 2: Existing Passport (Already in DB)
**Flow**: Use fresh MRZ data, update stale DB record

#### Option A: Trust MRZ, Update DB (RECOMMENDED)
```
1. Scan MRZ → Parse data
2. UPSERT passport record (INSERT ON CONFLICT UPDATE)
   - Match on: passport_number + nationality (composite key)
   - Update: full_name, expiry_date, date_of_birth
   - Keep: created_at (preserve first registration)
3. Link to voucher
4. Complete (< 3 seconds)
```

**Rationale**:
- MRZ data is **current** (passport is in hand)
- DB data may be **months old**
- Passport details can change (name corrections, renewals)
- No comparison logic needed → faster
- Auto-corrects data quality issues

#### Option B: Compare and Warn (NOT RECOMMENDED for Airport)
```
1. Scan MRZ → Parse data
2. Lookup existing passport
3. Compare fields (name, DOB, expiry)
4. IF mismatch:
   - Show warning dialog
   - Agent decides: Update or Keep old
   - Agent clicks button
5. Link to voucher
6. Complete (10-30 seconds with human intervention)
```

**Why NOT Recommended**:
- Adds 8-25 seconds per transaction
- Requires agent decision (cognitive load)
- Causes queue delays
- Most "mismatches" are data quality issues, not fraud
- False positives from:
  - Name spelling variations
  - OCR errors in old records
  - Date format differences
  - Typos in manual entry

---

## Technical Implementation

### Recommended: Upsert Pattern

```javascript
// Single atomic operation - fast and safe
const upsertPassportQuery = `
  INSERT INTO passports (
    passport_number,
    nationality,
    full_name,
    date_of_birth,
    expiry_date,
    sex,
    passport_type,
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  ON CONFLICT (passport_number, nationality)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    date_of_birth = EXCLUDED.date_of_birth,
    expiry_date = EXCLUDED.expiry_date,
    sex = EXCLUDED.sex,
    updated_at = NOW()
  RETURNING id, created_at
`;
```

**Performance**: 1 database round-trip (fast)

**Data Quality**: Always uses fresh MRZ data

**Deduplication**: Composite key (passport_number + nationality) prevents true duplicates

---

## What Fields to Compare?

### Option 1: No Comparison (Recommended)
**Always use MRZ data** - it's the current, physical document in hand.

### Option 2: Minimal Validation (If Required by Regulations)
**Only compare passport_number + nationality**:
- These NEVER change for the same passport
- If mismatch → it's a DIFFERENT passport (renewal, new issue)
- CREATE new record (it's a different document)

**DO NOT compare**:
- Name (may have corrections, transliterations)
- DOB (may have OCR errors, format differences)
- Expiry (passport may be renewed)

---

## Handling Missing Fields

### Scenario: DB has partial data, MRZ has complete data

**Airport Kiosk Approach**: Update DB with new data

```javascript
// Example: Old record missing date_of_birth
// Old DB: { passport_number: "P61820835", full_name: "NIKOLOV", dob: NULL }
// New MRZ: { passport_number: "P61820835", full_name: "NIKOLOV NIKOLAY", dob: "1978-05-15" }

// UPSERT will:
UPDATE passports SET
  full_name = "NIKOLOV NIKOLAY",  -- More complete
  date_of_birth = "1978-05-15",   -- Was NULL, now filled
  updated_at = NOW()
WHERE passport_number = "P61820835"
```

**Result**:
- Database quality improves over time
- No data loss
- No agent intervention needed

---

## Fraud Detection vs. Data Quality

### Fraud Scenarios (RARE)
1. **Stolen passport**: Different person using same passport number
2. **Fake passport**: Made-up passport number

**Detection Strategy**:
- Photo verification (not in scope for green fees)
- Watchlist checking (separate system)
- Immigration system integration (separate system)

**NOT detectable by comparing old vs new MRZ scans**

### Data Quality Issues (COMMON)
1. **OCR errors**: Old record from bad scan
2. **Name variations**: "JOHN" vs "JOHNATHAN"
3. **Transliteration differences**: "NIKOLOV" vs "NIKOLOFF"
4. **Manual entry typos**: Database has wrong data
5. **Incomplete data**: Old record missing fields

**Solution**: Always trust fresh MRZ scan

---

## Recommended Logic Flow

```javascript
async function registerPassportToVoucher(scannedMRZ, voucherCode) {
  const {
    passportNumber,
    nationality,
    surname,
    givenName,
    dateOfBirth,
    sex,
    expiryDate
  } = scannedMRZ;

  // STEP 1: Upsert passport record (creates or updates)
  const passport = await db.query(`
    INSERT INTO passports (
      passport_number,
      nationality,
      full_name,
      date_of_birth,
      expiry_date,
      sex,
      passport_type,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'P', NOW(), NOW())
    ON CONFLICT (passport_number, nationality)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      date_of_birth = EXCLUDED.date_of_birth,
      expiry_date = EXCLUDED.expiry_date,
      sex = EXCLUDED.sex,
      updated_at = NOW()
    RETURNING id, passport_number, full_name, created_at
  `, [
    passportNumber,
    nationality,
    `${surname} ${givenName}`.trim(),
    dateOfBirth,
    expiryDate,
    sex
  ]);

  // STEP 2: Link to voucher
  await db.query(`
    UPDATE individual_purchases
    SET passport_number = $1,
        passport_id = $2,
        customer_name = $3
    WHERE voucher_code = $4
  `, [
    passport.passport_number,
    passport.id,
    passport.full_name,
    voucherCode
  ]);

  // STEP 3: Log if this was an update (optional - for audit)
  const isUpdate = new Date(passport.created_at) < new Date(Date.now() - 1000);
  if (isUpdate) {
    console.log(`Passport ${passportNumber} updated with fresh MRZ data`);
  }

  return { success: true, passport };
}
```

**Performance**: 2 database queries, ~100-200ms total

**UX**: Instant, no agent intervention

**Data Quality**: Improves automatically

---

## Edge Cases

### Case 1: Same passport used for multiple vouchers (family/group)
**Scenario**: Customer buys 5 vouchers, uses same passport for all

**Current Flow**:
1. Scan passport 1st time → Create record
2. Scan passport 2nd time → UPSERT updates updated_at
3. Scan passport 3rd-5th time → Same

**Result**: 5 vouchers linked to 1 passport record ✓

**Is this allowed?**: BUSINESS DECISION
- Some airports: 1 voucher per passport (regulatory)
- Some airports: Multiple vouchers per passport OK (group leader)

**Implementation**:
```javascript
// If only 1 voucher per passport allowed:
const existingVoucher = await db.query(`
  SELECT voucher_code FROM individual_purchases
  WHERE passport_number = $1
    AND status != 'USED'
    AND valid_until > NOW()
  LIMIT 1
`, [passportNumber]);

if (existingVoucher.rows.length > 0) {
  throw new Error('This passport already has an active voucher');
}
```

### Case 2: Passport renewal (new passport, same person)
**Scenario**: Person had passport P123456, now has P999888

**Old System**: Two separate passport records ✓ (Correct - they are different documents)

**Database**:
```
| id | passport_number | full_name       | created_at  |
|----|-----------------|-----------------|-------------|
| 1  | P123456         | SMITH JOHN      | 2025-01-01  |
| 2  | P999888         | SMITH JOHN      | 2026-01-20  |
```

**Vouchers**:
```
| voucher_code | passport_id | passport_number |
|--------------|-------------|-----------------|
| ABC123       | 1           | P123456         |
| XYZ789       | 2           | P999888         |
```

**Result**: Both records exist, no conflict ✓

### Case 3: OCR error in old record, correct MRZ now
**Scenario**: Old scan had OCR error

**Old DB**: `full_name = "NIKOLQV NIKQLAY"` (bad scan)
**New MRZ**: `full_name = "NIKOLOV NIKOLAY"` (correct)

**With UPSERT**: Automatically corrected ✓

**With Compare**: Agent sees "Name mismatch", gets confused, delays queue ✗

---

## Database Schema Requirement

### Composite Unique Key (CRITICAL)

```sql
-- Passport numbers are only unique within a country
-- Example: Greece #P123456 and Philippines #P123456 are DIFFERENT people

ALTER TABLE passports
ADD CONSTRAINT passports_number_nationality_key
UNIQUE (passport_number, nationality);
```

**Why Composite Key**:
- Passport numbers are NOT globally unique
- Different countries reuse numbers
- Prevents false duplicates
- Enables correct UPSERT logic

### Current Schema Check

```sql
-- Check if constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'passports'
  AND constraint_type = 'UNIQUE';
```

---

## Comparison: Airport Kiosk vs. Immigration

### Airport Kiosk (Green Fees) - Speed Priority
- **Goal**: Collect fee, issue voucher
- **Time**: < 5 seconds per transaction
- **Trust**: MRZ scanner is source of truth
- **Approach**: Upsert, no comparison

### Immigration Control - Security Priority
- **Goal**: Verify identity, check watchlists
- **Time**: 30-60 seconds per traveler
- **Trust**: Biometric + document + database
- **Approach**: Compare everything, flag anomalies

**GreenPay is Kiosk, not Immigration** → Optimize for speed

---

## Recommended UX Messages

### Silent Update (No Agent Message)
```javascript
// Just works - no notification needed
await upsertPassport(mrzData);
await linkToVoucher(passportId, voucherCode);
// Show: "Voucher registered successfully"
```

### Optional Audit Log (Background)
```javascript
// Log for debugging, not shown to agent
console.log(`[Passport] ${isUpdate ? 'Updated' : 'Created'} ${passportNumber}`);
```

### Error Messages (Only for Real Failures)
```javascript
// Only show errors if something is truly wrong
if (!mrzData.passportNumber) {
  showError("Unable to read passport. Please try scanning again.");
}

if (voucherAlreadyRegistered) {
  showError("This voucher has already been registered with a passport.");
}
```

**No messages for**:
- Passport already exists (normal case)
- Data updated (beneficial, not error)
- Fields filled in (improvement)

---

## Performance Benchmarks

### Target Times (Airport Kiosk)
- MRZ scan detection: < 1 second
- MRZ parsing: < 100ms
- Database upsert: < 200ms
- Voucher link: < 100ms
- **Total: < 2 seconds** ✓

### Comparison Approach (Slow)
- MRZ scan: 1 second
- Lookup existing: 200ms
- Compare fields: 100ms
- Show dialog: Wait for agent (8-30 seconds)
- Update decision: Agent click
- Database update: 200ms
- **Total: 10-35 seconds** ✗

**25 passengers/hour difference** between approaches!

---

## Final Recommendations

### ✅ DO
1. **Use UPSERT pattern** (INSERT ON CONFLICT UPDATE)
2. **Always use fresh MRZ data** as source of truth
3. **Composite key**: (passport_number, nationality)
4. **Auto-update** DB when MRZ has more complete data
5. **Silent operation** - no agent intervention needed
6. **Log updates** in background for audit

### ❌ DON'T
1. **Compare old DB vs new MRZ** - causes delays
2. **Show warnings** for data differences - cognitive load
3. **Ask agent to decide** - slows queue
4. **Treat DB as authoritative** - it may be stale
5. **Block on "mismatches"** - most are data quality, not fraud
6. **Use passport_number alone** as unique key - causes international conflicts

### 🎯 Priority Order
1. **Speed** - Sub-5-second transactions
2. **Accuracy** - Physical passport (MRZ) is truth
3. **Data Quality** - Improve DB over time automatically
4. **Audit** - Log everything in background
5. **Simplicity** - No agent decisions needed

---

## Implementation Checklist

- [ ] Add composite UNIQUE constraint: (passport_number, nationality)
- [ ] Update register-passport endpoint to use UPSERT
- [ ] Remove any comparison/warning logic
- [ ] Test: Scan same passport twice → should update, not error
- [ ] Test: Scan passport with partial old data → should fill in gaps
- [ ] Verify: Transaction time < 2 seconds
- [ ] Add audit logging (background, not shown to agent)
- [ ] Document business rule: Multiple vouchers per passport allowed? Y/N

---

**Summary**: Treat the MRZ scanner as source of truth, use UPSERT to handle duplicates gracefully, prioritize speed over comparison. This matches airport kiosk best practices where throughput is critical.
