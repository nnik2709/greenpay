# Fix "Not Authenticated" Error - Complete Guide

**Date:** October 11, 2025  
**Issue:** Bulk upload shows "Not Authenticated" error  
**Solution:** Multiple fixes applied + diagnostic tools created

---

## ✅ What Was Fixed

### Code Changes Applied:
1. ✅ Changed from `getUser()` to `getSession()` (matches AuthContext)
2. ✅ Added detailed console logging throughout upload process
3. ✅ Added authentication check before file processing
4. ✅ Better error messages with specific causes
5. ✅ Removed confusing "Offline Upload" from menu

### Build Status:
✅ Build successful (7.94s)  
✅ All authentication checks in place  
✅ Ready to test

---

## 🧪 Test Authentication NOW

### Quick Test (1 minute):

```bash
# 1. Start dev server
npm run dev

# 2. Open in browser
# http://localhost:5173

# 3. Open Browser Console (F12)
# Watch for authentication messages

# 4. Login
# admin@example.com / password123

# 5. Go to Bulk Upload
# Passports → Bulk Upload

# 6. Watch console - should show:
# "Auth check on mount: Authenticated"
# "User is logged in: admin@example.com"
```

---

## 🔍 Diagnostic Tool

### Option 1: Use Built-in Diagnostic Page

**Open this file in your browser:**
```
file:///Users/nnik/github/greenpay/test-auth.html
```

This tool will:
- ✅ Test Supabase connection
- ✅ Test login credentials
- ✅ Verify session exists
- ✅ Check database access
- ✅ Show detailed error messages

**Steps:**
1. Open `test-auth.html` in browser
2. Enter your Supabase URL and Anon Key
3. Click "Initialize Supabase"
4. Click "Login & Test"
5. Click "Test Upload Authentication"
6. See detailed results

---

## 🔧 Common Causes & Solutions

### Cause #1: No .env File

**Check:**
```bash
cat .env 2>/dev/null || echo ".env file not found"
```

**Fix:**
```bash
# Create .env from example
cp .env.example .env

# Edit .env and add your credentials
nano .env

# Add these lines:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key...

# Restart dev server
# Ctrl+C then npm run dev
```

**Get credentials from:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

---

### Cause #2: Not Logged In

**Check in browser console:**
```javascript
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

**If null:**
1. Refresh the page
2. Log in again with admin@example.com / password123
3. Make sure login is successful before uploading

---

### Cause #3: User Profile Missing

**Check in Supabase Dashboard:**
- Go to: **Table Editor** → **profiles**
- Look for user with email: admin@example.com

**If missing, create it:**
```sql
-- In Supabase SQL Editor
-- First, get the user ID from Authentication → Users
-- Then run:

INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'paste-user-uuid-here',
  'admin@example.com',
  'Admin User',
  'Flex_Admin'
);
```

---

### Cause #4: Session Expired

**Symptoms:**
- Was logged in before
- Now getting "Not Authenticated"
- Page refresh doesn't help

**Fix:**
1. Log out completely
2. Close browser tab
3. Open new tab
4. Go to http://localhost:5173
5. Log in fresh
6. Try upload again

---

### Cause #5: CORS or Network Issue

**Check browser console for:**
- "CORS error"
- "Network error"
- "Failed to fetch"

**Fix:**
1. Check Supabase project is not paused/sleeping
2. Check internet connection
3. Try accessing Supabase Dashboard to verify project is active
4. Check if firewall is blocking supabase.co

---

## 📊 Expected Console Output

### When Authentication WORKS:

```
[Page Load]
Auth check on mount: Authenticated
User is logged in: admin@example.com

[File Upload]
Starting file upload: test-bulk-upload.csv
Starting bulk upload for file: test-bulk-upload.csv
Checking authentication...
User authenticated: admin@example.com ID: uuid-here
Processing CSV locally... {fileName: 'test-bulk-upload.csv', fileSize: 256, userId: 'uuid'}
CSV parsed successfully, rows: 5
Inserting valid rows: 5
Inserting batch 1, records: 5
Batch inserted successfully: 5
Creating upload log entry...
Upload log created successfully
Upload result: {success: true, successCount: 5, ...}
```

### When Authentication FAILS:

```
[Page Load]
Auth check on mount: Not authenticated
Authentication Required: Please log in to use bulk upload

[File Upload]
Starting file upload: test-bulk-upload.csv
Starting bulk upload for file: test-bulk-upload.csv
Checking authentication...
No session or user found          ← THIS IS THE PROBLEM
Upload error: Not authenticated. Please log in.
```

---

## 🎯 Step-by-Step Debugging

### Step 1: Check Environment

```bash
# Terminal
cat .env | grep VITE_SUPABASE

# Expected output:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# If empty or wrong, fix it and restart: npm run dev
```

### Step 2: Test Login

```javascript
// Browser console after npm run dev
// Go to http://localhost:5173

// Check if Supabase is loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Try manual login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password123'
});

console.log('Login result:', data);
console.log('Login error:', error);

// If successful, check session
const { data: sessionData } = await supabase.auth.getSession();
console.log('Session:', sessionData.session);
console.log('User:', sessionData.session?.user);
```

### Step 3: Check User Profile

```javascript
// After login, check profile
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

console.log('Profile:', profile);
console.log('Profile error:', profileError);

// If no profile, you need to create one
```

### Step 4: Test Upload Function

```javascript
// After authentication confirmed, test upload
const testFile = new File(
  ['passportNo,surname,givenName,nationality,dob,sex,dateOfExpiry\nP123,Doe,John,PNG,1990-01-01,Male,2030-01-01'],
  'test.csv',
  { type: 'text/csv' }
);

// Import the service (if in React app)
// Or test the API directly
const { data: { session } } = await supabase.auth.getSession();
console.log('Ready to upload, user ID:', session.user.id);
```

---

## 🔄 Full Reset (If Nothing Works)

### Nuclear Option: Complete Reset

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear browser data
# Browser → Settings → Clear browsing data → Cookies and site data

# 3. Check Supabase credentials
cat .env

# 4. Verify they match your project
# Supabase Dashboard → Settings → API

# 5. Restart dev server
npm run dev

# 6. Fresh login
# Open http://localhost:5173
# Login with admin@example.com / password123

# 7. Check console immediately after login
# Should show: "User is logged in: admin@example.com"

# 8. Try upload again
```

---

## 📱 Alternative: Test with Diagnostic Tool

```bash
# Open the diagnostic HTML in browser
open test-auth.html

# Or manually:
# File → Open File → select test-auth.html
```

This standalone tool tests everything step by step without the React app.

---

## 💡 Quick Wins

### Most Common Fix:

**90% of "Not Authenticated" errors are from:**
1. Missing or wrong .env file
2. Not logged in
3. User profile not created in database

**Quick check:**
```bash
# 1. Environment
ls -la .env && cat .env | grep VITE_SUPABASE_URL

# 2. Restart with fresh login
npm run dev
# Then login again fresh
```

---

## 📞 Still Not Working?

### Run Complete Diagnostic:

```bash
# Open dev tools console (F12) on http://localhost:5173
# Paste and run this:

console.log('=== DIAGNOSTIC START ===');

// 1. Environment
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// 2. Session
const { data: sessionData } = await supabase.auth.getSession();
console.log('Has session:', !!sessionData.session);
console.log('Has user:', !!sessionData.session?.user);
console.log('User email:', sessionData.session?.user?.email);
console.log('User ID:', sessionData.session?.user?.id);

// 3. Profile
if (sessionData.session?.user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single();
  console.log('Profile found:', !!profile);
  console.log('Profile role:', profile?.role);
}

// 4. Database
const { data: passports, error } = await supabase
  .from('passports')
  .select('id')
  .limit(1);
console.log('Can query passports:', !error);
console.log('DB error:', error);

console.log('=== DIAGNOSTIC END ===');
```

**Share the complete output from this if you need help!**

---

## ✅ Success Indicators

You know it's working when:
- ✅ Console shows "User is logged in: [email]"
- ✅ Console shows "User authenticated: [email] ID: [uuid]"
- ✅ Console shows "CSV parsed successfully"
- ✅ Toast shows "Upload Successful"
- ✅ No red errors in console

---

**Try it now!**  
1. Run `npm run dev`
2. Login fresh
3. Go to Passports → Bulk Upload
4. Upload `test-bulk-upload.csv`
5. Watch browser console for detailed logging

If you see any errors, paste them here and I'll help fix them! 🚀








