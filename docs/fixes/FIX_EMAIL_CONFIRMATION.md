# Fix Email Confirmation Issue

## Problem

Tests are failing with error:
```
Login error: AuthApiError: Email not confirmed
```

This means the test users exist in Supabase Auth but their emails haven't been confirmed.

---

## Solution (Choose One)

### Option 1: Disable Email Confirmation (Recommended for Development)

This is the easiest solution for development/testing environments.

1. **Go to Supabase Dashboard**
2. **Navigate to**: Authentication → Email Auth
3. **Find setting**: "Enable email confirmations"
4. **Disable it** (toggle off)
5. **Save changes**

After this, users can log in immediately without email confirmation.

---

### Option 2: Manually Confirm Each User's Email

If you want to keep email confirmation enabled:

1. **Go to Supabase Dashboard**
2. **Navigate to**: Authentication → Users
3. **For each user**:
   - admin@example.com
   - finance@example.com
   - agent@example.com
   - support@example.com
4. **Click on the user**
5. **Find "Email Confirmed"** field
6. **Toggle it to confirmed** (check the box or set to true)
7. **Save**

---

### Option 3: Auto-confirm Users via SQL

Run this in Supabase SQL Editor to confirm all test users:

```sql
-- Confirm test user emails
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email IN (
  'admin@example.com',
  'finance@example.com',
  'agent@example.com',
  'support@example.com'
)
AND email_confirmed_at IS NULL;
```

---

## After Fixing

Run the tests again:

```bash
npm test
```

All 13 tests should now pass! ✅

---

## Verification

You can also test manually:

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Login with: `admin@example.com` / `admin123`
4. Should successfully redirect to dashboard

---

## For Production

For production deployments, keep email confirmation **enabled** and use a proper email service (SMTP) configured in Supabase Auth settings.
