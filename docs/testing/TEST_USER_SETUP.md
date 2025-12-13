# Test User Setup Guide

## Quick Setup Instructions

To run Playwright tests, you need to create test users in your Supabase database.

### Step 1: Create Users in Supabase Authentication

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication → Users**
4. Click **Add User** and create these 4 users:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Flex_Admin |
| `finance@example.com` | `finance123` | Finance_Manager |
| `agent@example.com` | `agent123` | Counter_Agent |
| `it@example.com` | `it123` | IT_Support |

### Step 2: Update Profiles Table

After creating the users in Authentication:

1. Go to **SQL Editor** in Supabase
2. Open the file `create-test-users.sql` from this repository
3. Copy the UUIDs from Authentication → Users for each created user
4. Replace the UUIDs in the SQL file
5. Run the SQL to create profiles for each user

### Step 3: Verify Test Credentials

The test suite uses these credentials from `tests/fixtures/test-data.ts`:

```typescript
testUsers = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  counterAgent: { email: 'agent@example.com', password: 'agent123' },
  financeManager: { email: 'finance@example.com', password: 'finance123' },
  itSupport: { email: 'it@example.com', password: 'it123' }
}
```

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Or run interactively
npm run test:ui
```

## Alternative: Use Your Existing Users

If you already have users in your database, you can update the test credentials instead:

1. Edit `tests/auth.setup.ts` (line 24-25)
2. Edit `tests/fixtures/test-data.ts` (lines 7-26)
3. Update with your actual user credentials

## Verification

Run a quick test to verify setup:

```bash
npx playwright test tests/auth.setup.ts --project=setup
```

If successful, you'll see: ✓ Authentication setup complete

---

**Need Help?** See `PLAYWRIGHT_TESTING_GUIDE.md` for detailed documentation.


