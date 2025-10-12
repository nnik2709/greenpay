# ✅ FINAL TEST GUIDE - Bulk Upload Fixed

**Date:** October 11, 2025  
**Status:** All authentication and database column fixes applied  
**Build:** ✅ Successful (7.88s)

---

## 🎯 What Was Fixed (Just Now)

### Critical Database Column Fixes:
1. ✅ Fixed `bulk_uploads` table column names:
   - `success_count` → `successful_records`
   - `error_count` → `failed_records`
   - `uploaded_by` → `created_by`
   - Added `batch_id` (required unique field)
   - Added `error_log` (JSONB for error storage)
   - Added `completed_at` timestamp

2. ✅ Fixed `passports` table insert:
   - Removed non-existent columns (place_of_birth, place_of_issue, etc.)
   - Using only columns that exist in new schema
   - Proper UUID for created_by field

3. ✅ Enhanced logging throughout the process
4. ✅ Better error messages with full details

---

## 🧪 TEST NOW - Complete Steps

### Step 1: Start Dev Server

```bash
cd /Users/nnik/github/greenpay
npm run dev
```

**Wait for:** `Local: http://localhost:5173/`

---

### Step 2: Open Browser with Console

1. Open: http://localhost:5173
2. **Press F12** to open Developer Tools
3. Go to **Console** tab (KEEP IT OPEN - you'll see detailed logs)

---

### Step 3: Login

- Email: `admin@example.com`
- Password: `password123`

**Watch console - should show:**
```
Auth check on mount: Authenticated
User is logged in: admin@example.com
```

---

### Step 4: Navigate to Bulk Upload

**In the sidebar:**
- Click: **Passports**
- Click: **Bulk Upload**

**Or direct URL:** http://localhost:5173/passports/bulk-upload

**Console should show:**
```
Auth check on mount: Authenticated
User is logged in: admin@example.com
```

---

### Step 5: Upload Test File

1. Click **"Browse files"**
2. Select `test-bulk-upload.csv`
3. **WATCH THE CONSOLE** - you'll see detailed logs

**Expected console output:**
```
Starting file upload: test-bulk-upload.csv
Starting bulk upload for file: test-bulk-upload.csv
Checking authentication...
User authenticated: admin@example.com ID: [uuid]
Processing CSV locally... {fileName: 'test-bulk-upload.csv', fileSize: 256, userId: 'uuid'}
CSV parsed successfully, rows: 5
Inserting valid rows: 5
Inserting batch 1, records: 5
Sample record: {passport_number: 'P123456', surname: 'Doe', given_name: 'John', ...}
Batch inserted successfully: 5
Creating upload log entry...
Upload log created successfully
Upload result: {success: true, successCount: 5, ...}
```

**Toast notification:**
```
✅ Upload Successful
5 passports processed successfully
```

---

## 🔍 If It Still Fails - Debugging

### Check Console Output

**Look for these specific error messages:**

#### Error 1: "Authentication failed"
```
Console shows: "Session error: ..." or "No session or user found"
```
**Fix:**
- Logout and login again
- Clear cookies
- Check .env file has correct Supabase credentials

#### Error 2: "Insert error details"
```
Console shows: Insert error details: {message: "...", details: "...", hint: "..."}
```
**This tells you exactly what's wrong!**

**Common causes:**
- "Permission denied" → RLS policy issue
- "Duplicate key" → Passport numbers already exist
- "Column does not exist" → Schema mismatch (should be fixed now)
- "null value violates not-null constraint" → Missing required field

#### Error 3: "Failed to create upload log"
```
Console shows: "Log error details: {message: ...}"
```
**Means:** Passports inserted but log failed (less critical)

---

## 📊 Manual Database Test

If upload fails, test database directly:

**Go to: Supabase Dashboard → SQL Editor**

**Run this test:**
```sql
-- Test 1: Check if you can insert manually
INSERT INTO passports (
  passport_number,
  surname,
  given_name,
  nationality,
  date_of_birth,
  sex,
  date_of_expiry,
  created_by
) VALUES (
  'TEST999',
  'TestSurname',
  'TestGiven',
  'Papua New Guinea',
  '1990-01-01',
  'Male',
  '2030-01-01',
  auth.uid()
)
RETURNING *;

-- If this works, the issue is in the frontend
-- If this fails, check the error message
```

**Then clean up:**
```sql
DELETE FROM passports WHERE passport_number = 'TEST999';
```

---

## ✅ Success Indicators

### Upload is WORKING when you see:

**Console:**
- ✅ "User authenticated: admin@example.com ID: [uuid]"
- ✅ "CSV parsed successfully, rows: 5"
- ✅ "Sample record: {passport_number: 'P123456', ...}"
- ✅ "Batch inserted successfully: 5"
- ✅ "Upload log created successfully"
- ✅ "Upload result: {success: true, successCount: 5}"

**UI:**
- ✅ Toast: "Upload Successful - 5 passports processed"
- ✅ File shows: "test-bulk-upload.csv (5 passports processed)"
- ✅ Recent Uploads sidebar updates
- ✅ No red error toasts

**Database:**
- ✅ 5 new rows in `passports` table
- ✅ 1 new row in `bulk_uploads` table

---

## 🐛 Specific Error Fixes

### Error: "0 out of 5 passports processed"

This is what you saw. Now fixed by:
1. Matching column names to actual database schema
2. Removing columns that don't exist
3. Using correct created_by UUID
4. Proper batch_id generation

**Try upload again - should work now!**

---

### Error: "new row violates check constraint"

**Console will show:** Which column and what constraint

**Fix:** Update the CSV data to match constraints:
- sex must be: 'Male', 'Female', or 'Other'
- dates must be valid dates (YYYY-MM-DD format)

---

### Error: "duplicate key value violates unique constraint"

**Means:** Passport numbers already exist

**Fix:** Either:
- Change passport numbers in CSV (P999991, P999992, etc.)
- Or delete test data from database first

---

## 🔄 Reset Test Data (If Needed)

If you want to test multiple times:

```sql
-- Delete test passports
DELETE FROM passports WHERE passport_number IN ('P123456', 'P234567', 'P345678', 'P456789', 'P567890');

-- Delete bulk upload logs
DELETE FROM bulk_uploads WHERE file_name = 'test-bulk-upload.csv';
```

---

## 📞 If Still Not Working

**Run this diagnostic in browser console:**

```javascript
// 1. Check session
const { data: sessionData } = await supabase.auth.getSession();
console.log('Has session:', !!sessionData.session);
console.log('User ID:', sessionData.session?.user?.id);
console.log('User email:', sessionData.session?.user?.email);

// 2. Test direct insert
const testPassport = {
  passport_number: 'DEBUGTEST',
  surname: 'Debug',
  given_name: 'Test',
  nationality: 'Papua New Guinea',
  date_of_birth: '1990-01-01',
  sex: 'Male',
  date_of_expiry: '2030-01-01',
  created_by: sessionData.session.user.id
};

const { data: insertTest, error: insertError } = await supabase
  .from('passports')
  .insert(testPassport)
  .select();

console.log('Direct insert result:', insertTest);
console.log('Direct insert error:', insertError);

// 3. Clean up
if (insertTest) {
  await supabase.from('passports').delete().eq('passport_number', 'DEBUGTEST');
}
```

**This will tell you EXACTLY what's wrong!**

---

## ✅ Expected Timeline

- Server start: 10 seconds
- Login: 5 seconds  
- Navigate: 5 seconds
- Upload + process: 3-5 seconds
- Verify: 30 seconds

**Total: ~1 minute**

---

## 🎉 When It Works

You'll see:
1. **Console:** Complete processing log (15-20 lines)
2. **Toast:** Green "Upload Successful" notification
3. **UI:** File shows "5 passports processed"
4. **Database:** 5 new passports, 1 upload log
5. **Reports:** Bulk Upload Reports shows your upload

---

## 🚀 Next Steps After Success

Once bulk upload works:

1. **Test Reports:**
   - Go to Reports → Bulk Upload Reports
   - Should show your test upload
   - Verify statistics are correct

2. **Test Corporate Batch History:**
   - Go to Passports → Batch History
   - Check if page loads correctly

3. **Deploy to VPS:**
   ```bash
   ./deploy-vps.sh
   ```

---

**Try it now! Upload `test-bulk-upload.csv` and watch the console for detailed logging.**

**If you see any errors, paste the console output here - the detailed error messages will tell us exactly what's wrong!** 🚀

