# Create Test Users in Supabase

This guide will help you recreate the 4 test users from the old app in Supabase.

## The 4 Test Users

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@example.com | admin123 | Flex_Admin | Full system access |
| finance@example.com | finance123 | Finance_Manager | Quotations & Reports |
| agent@example.com | agent123 | Counter_Agent | Passports & Payments |
| support@example.com | support123 | IT_Support | Users & Reports |

## Step-by-Step Instructions

### Step 1: Create Users in Supabase Authentication

For EACH user, do the following:

1. Go to your Supabase project: https://app.supabase.com/project/gzaezpexrtwwpntclonu
2. Click **Authentication** in the left sidebar
3. Click **Users**
4. Click **Add user** button (top right)
5. Select **Create new user**
6. Fill in:
   - Email: (from table above)
   - Password: (from table above)
   - **Important**: Uncheck "Auto Confirm User" if you want to test email confirmation
   - Or check it to allow immediate login
7. Click **Create user**
8. **COPY THE USER'S UUID** - You'll need this in Step 2!

Repeat for all 4 users.

### Step 2: Create Profile Records

#### Option A: Using the Automated SQL (Recommended)

1. Open `create-test-users.sql` in your editor
2. For each user, replace the placeholder UUID with the actual UUID:
   - Find the line with `'UUID_FROM_AUTH_USER_1'`
   - Replace with the actual UUID you copied (e.g., `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'`)
   - Repeat for all 4 users
3. Go to **SQL Editor** in Supabase
4. Paste the ENTIRE modified SQL
5. Click **Run**
6. Check the results - should show all 4 users

#### Option B: Manual SQL (One at a time)

For each user, run this SQL in Supabase SQL Editor:

```sql
-- Replace PASTE_UUID_HERE and email/role for each user
INSERT INTO profiles (id, email, role, active)
VALUES (
  'PASTE_UUID_HERE',
  'admin@example.com',  -- Change email
  'Flex_Admin',          -- Change role
  true
);
```

### Step 3: Verify Users Were Created

Run this in SQL Editor to see all users:

```sql
SELECT
  id,
  email,
  role,
  active,
  created_at
FROM profiles
ORDER BY email;
```

You should see all 4 users listed.

### Step 4: Test Login

1. Go to your app: http://localhost:3002
2. Try logging in with each user:
   - **Admin**: admin@example.com / admin123
   - **Finance**: finance@example.com / finance123
   - **Agent**: agent@example.com / agent123
   - **Support**: support@example.com / support123

3. Verify each user sees the correct features based on their role

## Troubleshooting

### "User not found" when logging in

**Problem**: Profile not created for the user
**Solution**: Run the profile INSERT SQL for that user

### "Invalid login credentials"

**Problem**: Wrong password or user not confirmed
**Solution**:
- Check password is correct
- In Supabase Auth > Users, verify user is confirmed
- Click the user, check "Email Confirmed" is checked

### "Infinite recursion" error

**Problem**: RLS policies not fixed yet
**Solution**: Run `supabase-rls-fix.sql` first (see RLS_FIX_INSTRUCTIONS.md)

### Can't see certain features

**Problem**: Role not set correctly in profile
**Solution**: Check the user's role in profiles table:
```sql
SELECT email, role FROM profiles WHERE email = 'user@example.com';
```

Update if needed:
```sql
UPDATE profiles SET role = 'Flex_Admin' WHERE email = 'user@example.com';
```

## Role Permissions Quick Reference

### Flex_Admin (admin@example.com)
✅ All features unlocked:
- Dashboard
- User Management
- Passports (create, view, manage)
- Purchases (individual & corporate)
- Quotations
- Payments
- Reports (all)
- Admin Settings (payment modes, email templates)
- Scan & Validate

### Finance_Manager (finance@example.com)
✅ Can access:
- Dashboard
- Passports (view only)
- Corporate vouchers
- Quotations (create, manage)
- Reports (all)
- Scan & Validate

❌ Cannot access:
- User Management
- Admin Settings
- Individual passport purchases

### Counter_Agent (agent@example.com)
✅ Can access:
- Dashboard
- Passports (create, manage)
- Individual purchases
- Bulk uploads
- Payments
- Scan & Validate

❌ Cannot access:
- User Management
- Quotations
- Reports
- Admin Settings

### IT_Support (support@example.com)
✅ Can access:
- Dashboard
- User Management
- Reports (all)
- Scan & Validate

❌ Cannot access:
- Passports
- Purchases
- Quotations
- Payments
- Admin Settings

## Quick Commands

### List all users
```sql
SELECT email, role, active FROM profiles;
```

### Deactivate a user
```sql
UPDATE profiles SET active = false WHERE email = 'user@example.com';
```

### Change user role
```sql
UPDATE profiles SET role = 'Flex_Admin' WHERE email = 'user@example.com';
```

### Delete a user's profile (they can still login, but won't have access)
```sql
DELETE FROM profiles WHERE email = 'user@example.com';
```

### Delete from Auth (complete removal - be careful!)
This must be done in the Supabase UI:
1. Auth > Users
2. Find user
3. Click three dots > Delete user

## Next Steps

After creating all users:

1. ✅ Test login with each user
2. ✅ Verify role-based access works
3. ✅ Create some test data (passports, vouchers, etc.)
4. ✅ Test the reporting features
5. ✅ Ready for production!

## Production Notes

For production:

- **Change all passwords** to strong, unique passwords
- Use real email addresses
- Enable email confirmation
- Set up proper backup procedures
- Consider using SSO/OAuth instead of password auth
- Regularly audit user access
- Implement password rotation policy
