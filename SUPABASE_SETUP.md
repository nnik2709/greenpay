# Supabase Database Setup Guide

This guide walks you through setting up the Supabase database for the PNG Green Fees System.

## Prerequisites

- Supabase account and project created at https://app.supabase.com
- Your project URL and Anon/Public Key (available in project settings)

## Step 1: Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `supabase-schema.sql` and paste it into the SQL editor
5. Click **Run** to execute the SQL

This will create:
- All required tables (profiles, passports, individual_purchases, corporate_vouchers, quotations, etc.)
- Row Level Security (RLS) policies for data access control
- Indexes for performance
- Triggers for automatic timestamp updates
- Helper functions for generating codes
- Database views for reporting

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Get your credentials from Supabase:
   - Go to your project in Supabase dashboard
   - Navigate to **Settings** > **API**
   - Copy **Project URL** and **anon/public key**

**Important:**
- The `.env` file is in `.gitignore` and will not be committed to version control
- Never commit real credentials to the repository
- For production, use `env.production.example` as a template

## Step 3: Create Initial Admin User

After running the schema, you need to create your first admin user:

### Option 1: Via Supabase Dashboard (Recommended for first user)

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add user** > **Create new user**
3. Enter email and password
4. Click **Create user**
5. Note the user's UUID (you'll need it for the next step)

### Option 2: Via SQL Editor

Run this SQL to create a user profile after creating the auth user:

```sql
-- After creating user in Auth UI, insert their profile
-- Replace 'USER_UUID_HERE' with the actual UUID from the Auth Users table
INSERT INTO profiles (id, email, role, active)
VALUES (
  'USER_UUID_HERE',
  'admin@example.com',
  'Flex_Admin',
  true
);
```

### Creating Test Users

You can create test users for each role:

```sql
-- Get the UUID from the auth.users table after creating each user via Auth UI
-- Then insert profiles for each:

-- Flex Admin
INSERT INTO profiles (id, email, role, active)
VALUES ('uuid-from-auth', 'admin@example.com', 'Flex_Admin', true);

-- Finance Manager
INSERT INTO profiles (id, email, role, active)
VALUES ('uuid-from-auth', 'finance@example.com', 'Finance_Manager', true);

-- Counter Agent
INSERT INTO profiles (id, email, role, active)
VALUES ('uuid-from-auth', 'agent@example.com', 'Counter_Agent', true);

-- IT Support
INSERT INTO profiles (id, email, role, active)
VALUES ('uuid-from-auth', 'support@example.com', 'IT_Support', true);
```

## Step 4: Verify Setup

### Check Tables Created

Run this query to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- bulk_uploads
- corporate_vouchers
- email_templates
- individual_purchases
- passports
- payment_modes
- profiles
- quotations
- tickets
- transactions

### Check RLS Policies

Run this query to verify Row Level Security is enabled:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### Test Default Data

Check if default payment modes were inserted:

```sql
SELECT * FROM payment_modes;
```

You should see: CASH, CREDIT CARD, DEBIT CARD, BANK TRANSFER, EFTPOS

## Step 5: Test the Connection

Start the development server:

```bash
npm run dev
```

Try to log in with one of your created users. If successful, you should be redirected to the dashboard.

## Database Structure

### Core Tables

1. **profiles** - User accounts with role-based access
   - Roles: Flex_Admin, Counter_Agent, Finance_Manager, IT_Support

2. **passports** - Passport records
   - Stores traveler information

3. **individual_purchases** - Individual voucher purchases
   - Links to passports
   - Tracks voucher usage and validity

4. **corporate_vouchers** - Corporate vouchers
   - Bulk purchases for companies
   - Validity period tracking

5. **quotations** - Quotation management
   - For corporate clients
   - Status tracking (pending, approved, rejected, expired)

6. **bulk_uploads** - Batch upload tracking
   - Records bulk passport imports
   - Error logging

7. **payment_modes** - Available payment methods
   - Configurable by admins

8. **tickets** - Support ticket system
   - JSONB responses field

9. **email_templates** - Email notification templates
   - Variable substitution support

10. **transactions** - Transaction history
    - For reporting and analytics

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- Role-based policies restrict data access
- Users can only see data relevant to their role
- Admins have full access
- Automatic timestamp tracking

### Helper Functions

- `generate_voucher_code(prefix)` - Creates unique voucher codes
- `generate_quotation_number()` - Creates quotation numbers
- `update_updated_at_column()` - Auto-updates timestamps

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire `supabase-schema.sql` file
- Check the SQL Editor for any errors during execution

### "permission denied" error
- Verify RLS policies were created
- Check that user has a profile in the `profiles` table
- Ensure user role matches required permissions

### Connection errors
- Verify `.env` file has correct Supabase URL and anon key
- Check that environment variables are being loaded (restart dev server)

### Authentication fails
- Ensure user exists in both `auth.users` and `profiles` tables
- Check that profile role is valid
- Verify email confirmation (can be disabled in Supabase Auth settings)

## Migration from Mock Data

The application currently uses mock data in development. After Supabase is fully set up:

1. All data access is now through service files in `src/lib/`
2. Pages will need to be updated to use the new service functions
3. Mock data files (`authData.js`, `passportData.js`, etc.) can be removed or kept for reference

## Next Steps

1. Test user authentication
2. Test creating passports
3. Test creating vouchers
4. Test the reporting functions
5. Configure email settings in Supabase for notifications
6. Set up storage buckets if file uploads are needed
