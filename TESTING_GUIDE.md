# Cash Reconciliation - Testing Guide

**Feature:** Cash Reconciliation
**Status:** Ready for Testing
**Date:** October 2025

---

## 🚀 **QUICK START**

### Prerequisites

You need Supabase credentials to test this feature. If you don't have them yet:

**Option 1: Use Existing Supabase Project**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to Settings → API
4. Copy:
   - Project URL
   - Anon/Public key

**Option 2: Create New Supabase Project** (5 minutes)
1. Go to https://supabase.com
2. Click "Start your project"
3. Create new project (free tier)
4. Wait for database to provision (~2 minutes)
5. Get credentials from Settings → API

---

## 📝 **SETUP STEPS**

### Step 1: Configure Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit .env and add your Supabase credentials
nano .env
```

Add these lines to `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

### Step 2: Run Database Migration

**Option A: Using Supabase CLI** (Recommended if installed)
```bash
supabase db push
```

**Option B: Manual SQL Execution** (If no CLI)
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/006_cash_reconciliation.sql`
3. Paste and click "Run"
4. Verify: "Success. No rows returned"

---

### Step 3: Start Development Server

```bash
npm run dev
```

Server should start on http://localhost:3000

---

## 🧪 **TESTING CHECKLIST**

### Test 1: Access the Feature

**Steps:**
1. Open browser: http://localhost:3000
2. Login with credentials (if you have test users)
3. Navigate to: http://localhost:3000/cash-reconciliation

**Expected Result:**
- ✅ Page loads without errors
- ✅ You see "Cash Reconciliation" heading
- ✅ Date picker shows today's date
- ✅ Opening Float field visible
- ✅ "Load Transactions" button visible

**If it fails:**
- Check browser console for errors (F12)
- Verify route was added correctly in App.jsx
- Check Supabase connection

---

### Test 2: Load Transaction Summary

**Setup:**
You need some transactions in the database first. If you don't have any:

**Create Test Transactions:**
Run this SQL in Supabase SQL Editor:

```sql
-- Insert test transaction for today
INSERT INTO transactions (
  id,
  passport_number,
  transaction_type,
  amount,
  payment_method,
  nationality,
  created_by,
  created_at
) VALUES (
  uuid_generate_v4(),
  'P12345678',
  'individual_purchase',
  50.00,
  'cash',
  'Papua New Guinea',
  (SELECT id FROM profiles LIMIT 1), -- Uses first user
  NOW()
);

-- Insert a few more with different payment methods
INSERT INTO transactions (id, passport_number, transaction_type, amount, payment_method, nationality, created_by, created_at)
VALUES
  (uuid_generate_v4(), 'P23456789', 'individual_purchase', 75.00, 'card', 'Australia', (SELECT id FROM profiles LIMIT 1), NOW()),
  (uuid_generate_v4(), 'P34567890', 'individual_purchase', 100.00, 'cash', 'New Zealand', (SELECT id FROM profiles LIMIT 1), NOW());
```

**Test Steps:**
1. Select today's date
2. Enter Opening Float: `100`
3. Click "Load Transactions"

**Expected Result:**
- ✅ Transaction Summary card appears
- ✅ Shows: Total Transactions count
- ✅ Shows: Total Revenue
- ✅ Shows: Cash amount
- ✅ Shows: Card amount
- ✅ Cash Denomination section appears

---

### Test 3: Cash Denomination Entry

**Steps:**
1. Enter denominations (example):
   - K 100: 2 notes = PGK 200.00
   - K 50: 1 note = PGK 50.00
   - K 20: 3 notes = PGK 60.00
   - K 10: 5 notes = PGK 50.00
   - K 2: 10 notes = PGK 20.00

**Expected Result:**
- ✅ Each row shows calculation (e.g., "= PGK 200.00")
- ✅ "Actual Cash Counted" updates automatically
- ✅ Variance calculates in real-time

---

### Test 4: Variance Calculation

**Scenario A: Perfect Match**
- Opening Float: 100
- Cash Sales: 150 (from transactions)
- Expected Cash: 250
- Actual Cash: 250 (your count)
- **Expected:** Green box, Variance: 0.00 PGK

**Scenario B: Overage**
- Expected: 250
- Actual: 260
- **Expected:** Yellow/Green box, Variance: +10.00 PGK

**Scenario C: Shortage**
- Expected: 250
- Actual: 240
- **Expected:** Red box, Variance: -10.00 PGK

**Test Steps:**
1. Count denominations to get different totals
2. Watch variance indicator change color
3. Read variance message (overage/shortage)

---

### Test 5: Submit Reconciliation

**Steps:**
1. Enter optional notes: "Test reconciliation - first submission"
2. Click "Submit Reconciliation"

**Expected Result:**
- ✅ Toast notification: "Reconciliation Submitted!"
- ✅ Shows variance amount in toast
- ✅ Form resets
- ✅ Denomination fields clear

**Verify in Database:**
```sql
SELECT * FROM cash_reconciliations ORDER BY created_at DESC LIMIT 1;
```

Should show your submission with:
- status: 'pending'
- variance: calculated amount
- cash_denominations: JSON with your counts

---

### Test 6: View History

**Steps:**
1. Click "View History" button
2. Dialog should open

**Expected Result:**
- ✅ Shows your submitted reconciliation
- ✅ Displays: Date, Status (pending), Expected, Actual, Variance
- ✅ Shows any notes you entered
- ✅ Status badge colored (yellow for pending)

---

### Test 7: Role-Based Access

**Test as Different Roles:**

**Counter_Agent:**
- ✅ Can access /cash-reconciliation
- ✅ Can submit reconciliations
- ✅ Can view their own history

**Finance_Manager:**
- ✅ Can access /cash-reconciliation
- ✅ Can view all reconciliations (should test)
- ✅ Can approve/reject (future feature)

**Flex_Admin:**
- ✅ Full access to everything

**IT_Support:**
- ❌ Should NOT have access (verify redirect)

---

## 🐛 **COMMON ISSUES & FIXES**

### Issue 1: "No transactions found"

**Cause:** No transactions for selected date
**Fix:**
- Use the SQL above to create test transactions
- Or select a different date with existing data

---

### Issue 2: "Failed to load transaction summary"

**Cause:** Database connection or RLS policy issue
**Fix:**
1. Check Supabase credentials in .env
2. Verify migration ran successfully
3. Check browser console for specific error
4. Verify user is logged in

---

### Issue 3: Variance not calculating

**Cause:** JavaScript calculation issue
**Fix:**
1. Check browser console for errors
2. Verify denomination inputs accept numbers
3. Try refreshing page
4. Check calculateDenominationTotal function

---

### Issue 4: Can't access /cash-reconciliation

**Cause:** Route not added or wrong role
**Fix:**
1. Verify App.jsx has the route (line 142-146)
2. Check user role (must be Counter_Agent, Finance_Manager, or Flex_Admin)
3. Clear browser cache and reload

---

### Issue 5: RLS Policy Error

**Error:** "new row violates row-level security policy"

**Cause:** User doesn't match RLS policy
**Fix:**
- Verify user is logged in
- Check user.id matches agent_id being submitted
- Review RLS policies in migration file

---

## 📊 **TEST DATA EXAMPLES**

### Example 1: Busy Day

**Transactions:**
- 50 individual purchases × PGK 50 = PGK 2,500 (cash)
- 20 card payments × PGK 75 = PGK 1,500
- 5 bank transfers × PGK 100 = PGK 500

**Opening Float:** PGK 200

**Expected Cash:** PGK 2,700 (2,500 + 200)

**Denomination Count:**
- K 100: 20 notes = 2,000
- K 50: 10 notes = 500
- K 20: 5 notes = 100
- K 10: 10 notes = 100
- **Total:** PGK 2,700 ✅ Perfect match!

---

### Example 2: Small Shortage

**Expected Cash:** PGK 500
**Actual Count:** PGK 495
**Variance:** -5.00 PGK
**Notes:** "5 Kina coin missing from till"

---

### Example 3: Overage

**Expected Cash:** PGK 1,000
**Actual Count:** PGK 1,020
**Variance:** +20.00 PGK
**Notes:** "Extra 20 Kina note found, recount confirmed"

---

## ✅ **ACCEPTANCE CRITERIA**

**Feature is working if:**

- [ ] Page loads without errors
- [ ] Can select date
- [ ] Can enter opening float
- [ ] Transaction summary loads
- [ ] Can enter denominations
- [ ] Auto-calculation works for each denomination
- [ ] Actual cash total updates in real-time
- [ ] Variance calculates correctly
- [ ] Variance color coding works (green/yellow/red)
- [ ] Can enter optional notes
- [ ] Can submit reconciliation
- [ ] Toast notification appears on submit
- [ ] Form resets after submit
- [ ] Can view history
- [ ] History shows submitted records
- [ ] Status badge displays correctly
- [ ] Role-based access works

---

## 📸 **SCREENSHOTS TO TAKE**

For documentation:

1. Empty form (initial state)
2. Transaction summary loaded
3. Denomination entry in progress
4. Variance calculation (each color)
5. Submit success toast
6. History dialog
7. Database record in Supabase

---

## 🎯 **NEXT STEPS AFTER TESTING**

**If all tests pass:**
1. ✅ Add to sidebar menu
2. ✅ Update user guide with screenshots
3. ✅ Create training materials
4. ✅ Demo to stakeholders

**If issues found:**
1. 🐛 Document issues in TESTING_ISSUES.md
2. 🔧 Fix critical bugs
3. 🧪 Re-test
4. ✅ Mark as production-ready

---

## 💡 **TIPS FOR TESTERS**

1. **Test with real-world numbers** - Use actual PGK denominations
2. **Try edge cases:**
   - Zero transactions
   - Very large amounts
   - Negative variance
   - Empty notes
3. **Test different roles** - Switch user accounts
4. **Check mobile** - Test on phone/tablet
5. **Test offline** - What happens when internet drops?
6. **Performance** - How fast does it load with 100+ transactions?

---

## 📞 **SUPPORT**

**Issues?** Create a ticket or contact:
- Developer: [Your name]
- Supabase Help: https://supabase.com/docs

**Good Luck Testing!** 🚀

---

**END OF TESTING GUIDE**
