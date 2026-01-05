# Backend Migration to Modern Schema Status

**Date:** 2025-12-19
**Status:** IN PROGRESS

---

## Database Migration: ✅ COMPLETE

- **Legacy `"Passport"` table:** 153 rows (archived, not renamed yet)
- **Modern `passports` table:** 147 rows (migrated successfully)
- **Missing passports:** 6 rows (duplicates, handled by ON CONFLICT)

---

## Backend Routes Migration Status

### ✅ COMPLETED

1. **`backend/routes/passports.js`** - ✅ Updated to modern `passports` table
   - All CRUD operations use `passports` table
   - Uses snake_case columns: `passport_number`, `full_name`, `created_by`, etc.
   - JOINs to legacy `"User"` table (auth still using legacy)

2. **`backend/routes/individual-purchases.js`** - ✅ Updated to modern `passports` table
   - GET all purchases: LEFT JOIN to `passports` table
   - GET by ID: LEFT JOIN to `passports` table
   - Returns: `full_name`, `passport_number`, `nationality`, `date_of_birth`

3. **`backend/routes/buy-online.js`** - ✅ Updated to modern `passports` table
   - All 3 JOINs updated to use `passports` table
   - `completePurchaseWithPassport()` now creates/updates in modern table
   - Passport creation uses `full_name` instead of `surname` + `givenName`
   - Removed `sex` field (not in modern schema)

4. **`backend/routes/transactions.js`** - ✅ Updated to modern `passports` table
   - GET all transactions: LEFT JOIN to `passports` table
   - GET by ID: LEFT JOIN to `passports` table
   - Returns: `full_name`, `nationality`

---

## Column Mapping Reference

### Legacy `"Passport"` → Modern `passports`

| Legacy Column | Modern Column | Type | Notes |
|--------------|---------------|------|-------|
| `"passportNo"` | `passport_number` | text | Primary identifier |
| `surname` + `"givenName"` | `full_name` | text | Combined into single field |
| `nationality` | `nationality` | text | Same |
| `dob` | `date_of_birth` | date | Renamed |
| `"dateOfIssue"` | `issue_date` | date | Renamed |
| `"dateOfExpiry"` | `expiry_date` | date | Renamed |
| `type` | `passport_type` | text | Renamed |
| `sex` | ❌ REMOVED | - | No longer in modern schema |
| `"createdById"` | `created_by` | integer | Renamed, still FKs to `"User"`.id |
| `"createdAt"` | `created_at` | timestamp | Renamed |
| `"updatedAt"` | `updated_at` | timestamp | Renamed |

---

## Modern `passports` Table Schema

```sql
Column          | Type                        | Nullable | Default
================|=============================|==========|=========
id              | integer                     | NOT NULL | nextval()
passport_number | text                        | NOT NULL |
full_name       | text                        | NOT NULL |
nationality     | text                        | NULL     |
date_of_birth   | date                        | NULL     |
issue_date      | date                        | NULL     |
expiry_date     | date                        | NULL     |
passport_type   | text                        | NULL     |
created_by      | integer                     | NULL     | FK → "User"(id)
created_at      | timestamp without time zone | NOT NULL | CURRENT_TIMESTAMP
updated_at      | timestamp without time zone | NOT NULL | CURRENT_TIMESTAMP
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `passport_number`

**Foreign Keys:**
- `created_by` → `"User"(id)`

---

## Known Issues

### Current Error in Production

```
errorMissingColumn at position 379
```

**Cause:** `individual-purchases.js` was querying legacy `"Passport"` table columns that don't exist in modern schema:
- `surname`
- `"givenName"`
- `dob`
- `sex`

**Status:** ✅ FIXED

---

## Next Steps

1. ✅ Fix `individual-purchases.js` JOINs
2. ✅ Fix `buy-online.js` passport operations
3. ✅ Fix `transactions.js` passport references
4. ⏳ Deploy updated routes to production (in progress)
5. ⏳ Restart backend API server (pending)
6. ⏳ Verify all routes work correctly (pending)

---

## Deployment Commands

```bash
# Copy updated files to server
scp backend/routes/passports.js root@165.22.52.100:/var/www/greenpay/backend/routes/
scp backend/routes/individual-purchases.js root@165.22.52.100:/var/www/greenpay/backend/routes/
# ... more files

# Restart backend
ssh root@165.22.52.100 "pm2 restart greenpay-api"

# Check logs
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 50"
```

---

**Last Updated:** 2025-12-19 10:30 UTC
