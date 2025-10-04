# Fix RLS Policy Errors

## Problem

You're seeing this error:
```
infinite recursion detected in policy for relation "profiles"
```

This happens because the original RLS policies were checking the `profiles` table while querying the `profiles` table, creating a circular dependency.

## Solution

Run the fixed SQL to simplify the RLS policies.

### Step 1: Run the Fix SQL

1. Go to your Supabase project: https://app.supabase.com/project/gzaezpexrtwwpntclonu
2. Click **SQL Editor** in the left sidebar
3. Create a new query
4. Copy **ALL** contents from `supabase-rls-fix.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify the Fix

After running the SQL, test the connection:

```bash
node test-new-credentials.js
```

You should see:
```
✅ Supabase client initialized
✅ Payment modes table accessible
✅ Successfully connected to Supabase!
🎉 All tests passed!
```

### Step 3: Test in Browser

1. Open http://localhost:3002
2. Check browser console for connection test results
3. Try logging in (you'll need to create a user first)

## What Changed

### Before (Problematic)
```sql
-- This caused infinite recursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles  -- ❌ Querying profiles from within profiles policy!
      WHERE id = auth.uid() AND role IN ('Flex_Admin', 'IT_Support')
    )
  );
```

### After (Fixed)
```sql
-- Simple policy, no recursion
CREATE POLICY "Enable read for authenticated users" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Important Notes

### Current Setup (Simplified)
- ✅ All authenticated users can read all tables
- ✅ All authenticated users can write to tables
- ✅ No infinite recursion errors
- ⚠️  Role-based restrictions removed (for now)

### Production Recommendations

For production, you should add back role-based restrictions using a different approach:

1. **Option 1**: Use application-level role checking (in your React/service code)
2. **Option 2**: Add a role column check without querying profiles:
   ```sql
   -- Example for future use
   CREATE POLICY "Admins can manage users" ON profiles
     FOR UPDATE
     USING (
       -- Check the user's OWN role without joining to profiles
       (SELECT role FROM profiles WHERE id = auth.uid()) = 'Flex_Admin'
     );
   ```

3. **Option 3**: Use Supabase functions to check roles
   ```sql
   -- Create a helper function
   CREATE OR REPLACE FUNCTION auth.user_role()
   RETURNS TEXT AS $$
     SELECT role FROM profiles WHERE id = auth.uid()
   $$ LANGUAGE SQL STABLE;

   -- Use in policy
   CREATE POLICY "Admin access" ON some_table
     FOR ALL USING (auth.user_role() = 'Flex_Admin');
   ```

## Testing Checklist

After running the fix:

- [ ] Run `node test-new-credentials.js` - Should pass
- [ ] Open http://localhost:3002 - Should load
- [ ] Check browser console - Should show "All Supabase connection tests passed!"
- [ ] Create a test user in Supabase Auth
- [ ] Insert profile for test user
- [ ] Try logging in
- [ ] Create a test record in any table

## If Still Having Issues

1. **Check if SQL ran successfully:**
   - Look for errors in SQL Editor
   - Verify policies were created: Settings > Database > Policies

2. **Clear browser cache:**
   ```bash
   # Restart dev server
   # In browser: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
   ```

3. **Verify table exists:**
   ```sql
   SELECT * FROM payment_modes LIMIT 1;
   ```

4. **Check auth status:**
   ```sql
   SELECT auth.role();  -- Should return 'anon'
   SELECT auth.uid();   -- Should return null when not logged in
   ```

## Next Steps

1. Run `supabase-rls-fix.sql` in Supabase
2. Test the connection
3. Create your first admin user
4. Start using the application!

See `SUPABASE_SETUP.md` for user creation instructions.
