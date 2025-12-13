# Test Bulk Upload NOW - Step by Step

**Status:** ✅ Build successful with auth fixes  
**Time:** 5 minutes to test  
**Date:** October 11, 2025

---

## 🚀 Quick Test

### 1. Start the App

```bash
# Make sure you're in the project directory
cd /Users/nnik/github/greenpay

# Start dev server
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

### 2. Open Browser & Login

**Open:** http://localhost:5173  
**Login with:**
- Email: `admin@example.com`
- Password: `password123`

**Important:** Make sure you see the dashboard after login. If login fails, you need to create a user first.

---

### 3. Navigate to Bulk Upload

**Option A: Using Menu**
- Click **"Passports"** in the sidebar
- Click **"Bulk Upload"** (should be visible in dropdown)

**Option B: Direct URL**
- Go to: http://localhost:5173/passports/bulk-upload

**You should see:**
- Page title: "Bulk Passport Upload"
- Three steps shown: Upload File → Payment → View Vouchers
- Upload area with "Browse files" button
- "Recent Uploads" sidebar on the right

---

### 4. Upload Test File

**File to use:** `test-bulk-upload.csv` (in project root)

**Steps:**
1. Click **"Browse files"** button
2. Select `test-bulk-upload.csv`
3. Watch for processing...

**What to watch in Browser Console (F12):**
```
Starting bulk upload for file: test-bulk-upload.csv
Checking authentication...
User authenticated: admin@example.com
Processing CSV locally... {fileName: 'test-bulk-upload.csv', ...}
CSV parsed successfully, rows: 5
Inserting valid rows: 5
Inserting batch 1, records: 5
Batch inserted successfully: 5
Creating upload log entry...
Upload log created successfully
Upload result: {success: true, successCount: 5, ...}
```

**Expected Result:**
- ✅ Green toast notification: "Upload Successful - 5 passports processed successfully"
- ✅ File name shown: "test-bulk-upload.csv (5 passports processed)"
- ✅ Recent Uploads sidebar updates with new entry
- ✅ No errors in console

**If you see "Not Authenticated":**
- Check browser console for specific error
- Verify you're logged in (refresh page)
- Check if Supabase URL/keys are set in environment

---

### 5. Verify in Database

**Option 1: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Open your project
3. Go to: **Table Editor** → **passports**
4. Should see 5 new rows with passport numbers:
   - P123456
   - P234567
   - P345678
   - P456789
   - P567890

**Option 2: Via SQL Editor**
```sql
-- Check passports
SELECT * FROM passports ORDER BY created_at DESC LIMIT 10;

-- Check upload log
SELECT * FROM bulk_uploads ORDER BY created_at DESC LIMIT 5;
```

---

### 6. Check Reports

**Go to:** Reports → Bulk Upload Reports  
**URL:** http://localhost:5173/reports/bulk-passport-uploads

**You should see:**
- Your upload listed in the table
- Statistics showing: Total Uploads, Total Passports, etc.
- File name: test-bulk-upload.csv
- Records: 5

---

## 🐛 Debugging Authentication Issues

### Issue: "Not Authenticated" Error

Open browser console (F12) and check which line is failing:

**If you see: "No user found in session"**
```bash
# This means you're not logged in
# Solution: Refresh page and log in again
```

**If you see: "Auth error: ..."**
```bash
# This means Supabase connection issue
# Check:
1. Are VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set?
2. Is your Supabase project active?
3. Is the network connection working?
```

**If you see: "Database connection not available"**
```bash
# This means Supabase client didn't initialize
# Check .env file exists with correct values
```

### Verify Environment Variables

```bash
# Check if .env file exists
cat .env | grep VITE_SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

**If .env doesn't exist:**
```bash
# Create it
cp .env.example .env

# Edit and add your Supabase credentials
# Get them from: Supabase Dashboard → Settings → API
```

### Check if User is Logged In

Open browser console and run:
```javascript
// Check authentication
const { data } = await window.supabase.auth.getUser();
console.log('Current user:', data.user);

// Should show user object with email
```

---

## 📊 Detailed Console Logging

When you upload a file, you should see this sequence in console:

```
1. Starting file upload: test-bulk-upload.csv
2. Starting bulk upload for file: test-bulk-upload.csv
3. Checking authentication...
4. User authenticated: admin@example.com
5. Processing CSV locally... {fileName, fileSize, userId}
6. CSV parsed successfully, rows: 5
7. Inserting valid rows: 5
8. Inserting batch 1, records: 5
9. Batch inserted successfully: 5
10. Creating upload log entry...
11. Upload log created successfully
12. Upload result: {success: true, successCount: 5, ...}
```

**If authentication fails, you'll see:**
```
1. Starting file upload: test-bulk-upload.csv
2. Starting bulk upload for file: test-bulk-upload.csv
3. Checking authentication...
4. Authentication error: [error details]  ← CHECK THIS
5. Upload error: Not authenticated. Please log in again.
```

---

## ✅ Success Checklist

Upload is working when you see:
- [ ] Console shows "User authenticated: [email]"
- [ ] Console shows "CSV parsed successfully, rows: 5"
- [ ] Console shows "Batch inserted successfully: 5"
- [ ] Toast notification: "Upload Successful"
- [ ] File name displays with count
- [ ] Recent uploads sidebar updates
- [ ] No red errors in console

---

## 🔧 Quick Fixes

### Fix #1: Not logged in
```
Solution: Refresh page, log in with admin@example.com / password123
```

### Fix #2: Supabase not configured
```bash
# Create .env file
cp .env.example .env

# Add your Supabase credentials
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Restart dev server
# Ctrl+C then npm run dev
```

### Fix #3: User doesn't exist
```sql
-- Create admin user in Supabase Dashboard → Authentication → Users
-- Or run in SQL Editor:

-- First create auth user via Dashboard Authentication → Add User
-- Then create profile:
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'user-uuid-from-auth',
  'admin@example.com',
  'Admin User',
  'Flex_Admin'
);
```

### Fix #4: bulk_uploads table doesn't exist
```bash
# Apply migrations
supabase db push

# Or manually in SQL Editor - run migrations in order
```

---

## 📞 If Still Not Working

**Run this diagnostic:**

1. Open browser console (F12)
2. Go to Console tab
3. Run these commands:

```javascript
// Test 1: Check Supabase connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Test 2: Check authentication
const { data, error } = await supabase.auth.getUser();
console.log('Auth data:', data);
console.log('Auth error:', error);

// Test 3: Check if user object exists
console.log('User email:', data?.user?.email);
console.log('User ID:', data?.user?.id);

// Test 4: Test database query
const { data: passports, error: dbError } = await supabase
  .from('passports')
  .select('id')
  .limit(1);
console.log('DB query result:', passports);
console.log('DB error:', dbError);
```

**Share the output of these tests if still having issues!**

---

## 🎯 Expected Timeline

- Server start: 10 seconds
- Login: 5 seconds
- Navigate to page: 5 seconds
- Upload & process: 3-5 seconds
- Verify in database: 30 seconds

**Total: ~1 minute**

---

**Try it now and check the browser console for the detailed logging!**








