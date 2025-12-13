# Deploy Login History Feature

## Overview
Login History feature tracks all login attempts (successful and failed) with IP address, device info, and timestamps.

## Files Changed

### Backend Files
1. **NEW**: `backend/routes/login-events.js` - Login events API endpoint
2. **NEW**: `backend/migrations/create-login-events-table.sql` - Database schema
3. **MODIFIED**: `backend/routes/auth.js` - Records login events
4. **MODIFIED**: `backend/server.js` - Registers login-events route

### Frontend Files
1. **MODIFIED**: `src/pages/admin/LoginHistory.jsx` - New PostgreSQL-based Login History page
2. **MODIFIED**: `src/pages/Users.jsx` - View Login History now navigates to the page
3. **MODIFIED**: `src/lib/api/client.js` - Added generic `get()` method
4. **MODIFIED**: `src/App.jsx` - Uses new LoginHistory component

## Deployment Steps

### Step 1: Create Database Table (Run on Production DB)

SSH to server and run:
```bash
ssh root@72.61.208.79
psql -U greenpay_user -d greenpay_db
```

Then run the SQL from `backend/migrations/create-login-events-table.sql`:
```sql
CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES "User" (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_login_time ON login_events(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_email ON login_events(email);
```

### Step 2: Deploy Backend Files

Upload these files to the server:
```bash
# In another terminal (you need to run these manually)
scp backend/routes/login-events.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/routes/auth.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

**IMPORTANT:** The login-events.js file uses the correct syntax for checkRole middleware:
- Correct: `checkRole('Flex_Admin', 'IT_Support')`
- Incorrect: `checkRole(['Flex_Admin', 'IT_Support'])`

### Step 3: Restart Backend

```bash
ssh root@72.61.208.79
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

### Step 4: Deploy Frontend (When Ready)

The frontend changes are already hot-reloading on localhost. When ready to deploy:
```bash
npm run build
# Then upload dist/ folder to server manually
```

## Features Implemented

### Backend API Endpoints

1. **GET /api/login-events** - Get all login events
   - Accessible by: Flex_Admin, IT_Support
   - Query params: `userId` (optional), `limit`, `offset`
   - Returns: Login events with user details

2. **GET /api/login-events/user/:userId** - Get events for specific user
   - Accessible by: Flex_Admin, IT_Support
   - Query params: `limit`, `offset`

3. **GET /api/login-events/stats** - Get login statistics
   - Accessible by: Flex_Admin, IT_Support
   - Returns: Total logins, unique users, success/failed counts

### Login Event Recording

Every login attempt (success or failure) is now recorded with:
- User ID and email
- Login timestamp
- IP address
- User agent (browser/device info)
- Status (success/failed)
- Failure reason (if failed)

### Frontend Features

1. **Login History Page** (`/admin/login-history`)
   - View all login events or filter by user
   - Search by email, name, or IP address
   - Filter by status (All/Success/Failed)
   - Show entries: 10, 25, 50, 100
   - Displays: Date/Time, User, Email, Role, Status, IP, Device

2. **View Login History from Users Page**
   - Click "View Login History" for any user
   - Redirects to filtered login history page
   - Shows only that user's login events

## Testing

### Test on Localhost (Frontend Only)

The frontend will work on localhost, but won't show any data until the backend is deployed.

### Test After Backend Deployment

1. **Create some login events**: Login/logout a few times with different users

2. **View all login history**: Navigate to `/admin/login-history` as Flex_Admin or IT_Support

3. **View user-specific history**: Go to `/users`, click "View Login History" for a user

4. **Test filters**:
   - Search for an email or IP address
   - Filter by Success/Failed status
   - Change entries per page

5. **Test failed logins**: Try logging in with wrong password - should see failed event

## Database Schema

```
login_events table:
- id (UUID, primary key)
- user_id (UUID, foreign key to User)
- email (VARCHAR)
- login_time (TIMESTAMP)
- ip_address (VARCHAR)
- user_agent (TEXT)
- status (VARCHAR: 'success' or 'failed')
- failure_reason (VARCHAR: 'User not found', 'Invalid password', 'Account inactive')
- created_at (TIMESTAMP)
```

## Security Notes

- Login events are only accessible to Flex_Admin and IT_Support roles
- IP addresses and user agents are logged for security auditing
- Failed login attempts help detect brute force attacks
- User IDs in failed login events may be NULL if user doesn't exist

## Troubleshooting

### Backend errors after deployment

Check PM2 logs:
```bash
pm2 logs greenpay-api --lines 50
```

### Table doesn't exist

Make sure you ran the CREATE TABLE SQL from Step 1

### No login events showing

- Check if the table exists: `\dt` in psql
- Check if backend is recording events: Try logging in and check the table:
  ```sql
  SELECT * FROM login_events ORDER BY login_time DESC LIMIT 10;
  ```

### Permission denied errors

Make sure the login-events route is registered in server.js and PM2 has been restarted.

## Next Steps

After deployment, you can:
- Monitor login patterns
- Detect suspicious login attempts
- Track user activity
- Generate security reports
