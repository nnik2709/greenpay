# Database Analysis Summary

**Date:** 2025-12-19
**Status:** Discovery phase complete - awaiting production query results

---

## 🎯 What We Discovered

After obtaining the complete production schema dump, we found something unexpected:

### The Production Database Has TWO Complete Schema Sets:

1. **Legacy Schema** (Capitalized tables, CamelCase columns)
   - `"User"`, `"Passport"`, `"Invoice"`, `"Quotation"`, `"Role"`, etc.
   - Uses Sequelize ORM naming conventions
   - Foreign keys like `"createdById"`, `"roleId"`

2. **Modern Schema** (Lowercase tables, snake_case columns)
   - `individual_purchases`, `corporate_vouchers`, `invoices`, `passports`, `profiles`, etc.
   - Uses PostgreSQL standard naming conventions
   - Foreign keys like `created_by`, `passport_id`

**Both schemas coexist in the same database!**

---

## ✅ What We Now Know

### Tables That DO Exist (contrary to initial audit):

| Table | Status | Notes |
|-------|--------|-------|
| `invoices` | ✅ **EXISTS** | Lowercase modern table |
| `customers` | ✅ **EXISTS** | For customer management |
| `purchase_sessions` | ✅ **EXISTS** | For online purchases |
| `invoice_payments` | ✅ **EXISTS** | For partial payment tracking |
| `individual_purchases` | ✅ EXISTS | Has `card_last_four` (we added it) |
| `corporate_vouchers` | ✅ EXISTS | Missing `payment_method` column (expected) |

### The Real Problem:

**Not missing tables** - it's **which table has the actual data**:
- Is live data in `"Passport"` (legacy) or `passports` (modern)?
- Is user data in `"User"` (legacy) or `profiles` (modern)?
- Which invoice table is active?

---

## 📋 Files Created for Next Steps

### 1. `DATABASE_SCHEMA_AUDIT_UPDATED.md`
- Complete revised audit with correct findings
- Lists all tables that exist in BOTH schemas
- Identifies specific column mismatches
- Provides action plan based on discovery

### 2. `DISCOVERY_QUERIES.sql`
- SQL queries to run on production
- Determines which tables have actual data
- Compares row counts between legacy vs modern tables
- Checks recent data (last 7 days) to see what's actively used
- Samples data from both table sets
- Verifies column structures

### 3. `database/PRODUCTION_SCHEMA.sql`
- Complete schema dump from production
- Reference for all table structures
- Shows triggers, functions, indexes, etc.

---

## 🎬 Next Steps for You

### Step 1: Run Discovery Queries (5 minutes)

```bash
# SSH to production
ssh root@165.22.52.100

# Run discovery queries
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/discovery_queries.sql

# Or copy/paste queries manually from database/DISCOVERY_QUERIES.sql
```

### Step 2: Share Results

Copy the output and share it. The key questions we need answered:

1. **Passport data:** Which table has more rows - `"Passport"` or `passports`?
2. **User data:** Which is primary - `"User"` or `profiles`?
3. **Invoice data:** Which table is actively used - `"Invoice"` or `invoices`?
4. **Recent activity:** Which tables have data from the last 7 days?

### Step 3: Based on Results

Once we know where the data lives, we can:
- Update backend routes to query the correct tables
- Fix specific column name mismatches
- Provide targeted fixes for each problematic route

---

## 🔍 Why "View Vouchers by Passport" Failed

The error cascade we saw:
1. ❌ `card_last_four` missing → **FIXED** (added column)
2. ❌ `issued_date` wrong → **FIXED** (changed to `created_at`)
3. ❌ `nationality` missing in individual_purchases → **FIXED** (used NULL)
4. ❌ `payment_method` missing in corporate_vouchers → **FIXED** (used NULL)

**These were symptoms of:**
- Backend code written for one schema version
- Production database has evolved/changed
- Missing columns in specific tables (not missing tables)

**User's decision:** Abandon this feature, use alternative (`/app/vouchers-list` with filter)

---

## 📊 Current Status

### ✅ Completed:
- Full production schema documented
- Comprehensive audit with correct findings
- Discovery SQL queries prepared
- Files committed to repo for tracking

### ⏳ Pending:
- Run discovery queries on production
- Analyze which tables have actual data
- Update backend routes based on findings
- Fix remaining production issues

### 🚫 Abandoned:
- "View Vouchers by Passport" feature (user decision)

---

## 🎯 Expected Outcomes

After running discovery queries, we'll likely find:

**Scenario A: Modern tables have the data**
- Most tables (`individual_purchases`, `corporate_vouchers`, `invoices`, `passports`) are actively used
- Legacy tables are mostly empty or historical
- Backend routes need minor updates to reference modern tables
- **Estimated fix time:** 2-4 hours for all routes

**Scenario B: Legacy tables have the data**
- `"User"`, `"Passport"`, `"Invoice"` contain active data
- Modern tables are empty or transitional
- Backend routes are mostly correct
- **Estimated fix time:** 1-2 hours for column name fixes

**Scenario C: Split data (transition state)**
- Some features use legacy, some use modern
- Need per-feature analysis
- **Estimated fix time:** 4-8 hours for comprehensive updates

---

## 📝 Files to Review

1. **DATABASE_SCHEMA_AUDIT_UPDATED.md** - Complete audit report
2. **DISCOVERY_QUERIES.sql** - Queries to run on production
3. **database/PRODUCTION_SCHEMA.sql** - Full schema reference

All files are in your GitHub repo and ready for deployment tracking.

---

**Next Action:** Run the discovery queries and share results.

Once we have that data, we can provide specific, targeted fixes for each backend route.
