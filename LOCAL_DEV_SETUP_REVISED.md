# Local Development Setup Guide (Revised)

## Architecture

The PostgreSQL database on the production server is only accessible locally (correct security practice). Therefore, the recommended setup is:

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Frontend (Localhost)   │         │  Backend (Production)    │
│  Port: 3000/5173       │────────▶│  greenpay.eywademo.cloud │
│  Vite Dev Server       │         │  Port: 3001              │
└─────────────────────────┘         └──────────────────────────┘
                                              │
                                              │ (localhost)
                                              ▼
                                    ┌──────────────────────────┐
                                    │  PostgreSQL Database     │
                                    │  localhost:5432          │
                                    │  greenpay_db            │
                                    └──────────────────────────┘
```

**Benefits:**
- ✅ Direct database access (no SSH tunneling needed)
- ✅ Production-like environment
- ✅ Faster development (HMR for frontend only)
- ✅ Secure (database not exposed externally)

## Setup Steps

### 1. Deploy Backend to Production Server

The backend has been fully created with all routes and middleware. Deploy it to the production server:

```bash
./deploy-backend.sh
```

This will:
1. Create a backup of existing backend
2. Upload all backend files to the server
3. Install dependencies
4. Restart backend with PM2
5. Verify deployment

**Important:** Make sure the production server has a `.env` file in the backend directory with:

```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=GreenPay2025!Secure#PG
JWT_SECRET=a26baa9a385b39e5fb8f99f54734391075784715b7c6cbded9651da6ce696a38
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://greenpay.eywademo.cloud
```

### 2. Configure Frontend for Development

The frontend `.env` has been configured to use the production backend API:

```bash
# .env
VITE_API_URL=https://greenpay.eywademo.cloud/api
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on **http://localhost:5173** (or http://localhost:3000)

## Testing

1. Open browser to http://localhost:5173
2. Login with Agent credentials (Counter_Agent role)
3. Try creating a voucher - should work without "Insufficient permissions" error

## Backend Routes Created

All backend routes have been created with proper role-based access control:

### Authentication (`/api/auth`)
- ✅ `POST /login` - User login
- ✅ `POST /register` - User registration
- ✅ `POST /change-password` - Change password
- ✅ `POST /reset-password/:userId` - Admin reset password
- ✅ `GET /verify` - Verify JWT token
- ✅ `GET /me` - Get current user (for frontend)

### Users (`/api/users`)
- ✅ `GET /` - Get all users (Flex_Admin, IT_Support)
- ✅ `GET /:id` - Get single user
- ✅ `POST /` - Create user
- ✅ `PUT /:id` - Update user
- ✅ `DELETE /:id` - Delete user
- ✅ `GET /roles/list` - Get all roles

### Passports (`/api/passports`)
- ✅ `GET /` - Get all passports
- ✅ `GET /:id` - Get single passport
- ✅ `POST /` - Create passport (**Flex_Admin, Counter_Agent allowed**)
- ✅ `PUT /:id` - Update passport
- ✅ `DELETE /:id` - Delete passport

### Individual Purchases (`/api/individual-purchases`)
- ✅ `GET /` - Get all vouchers
- ✅ `GET /:id` - Get single voucher
- ✅ `POST /` - Create voucher (**Flex_Admin, Counter_Agent allowed**)
- ✅ `PUT /:id` - Update voucher
- ✅ `DELETE /:id` - Delete voucher

### Invoices (`/api/invoices`)
- ✅ All CRUD operations

### Quotations (`/api/quotations`)
- ✅ All CRUD operations
- ✅ Convert to invoice

### Tickets (`/api/tickets`)
- ✅ All CRUD operations
- ✅ Add comments

## Permissions Fixed

The following permissions have been fixed for Agent (Counter_Agent) role:

1. **Passport Creation**: `checkRole('Admin', 'Manager', 'Agent', 'Flex_Admin', 'Counter_Agent')`
2. **Voucher Creation**: `checkRole('Flex_Admin', 'Counter_Agent')`

Only passport number is required; all other fields are optional.

## Deployment Workflow

### For Backend Changes:
```bash
./deploy-backend.sh
```

### For Frontend Changes:
Frontend runs locally, so changes are instantly reflected (HMR).

When ready to deploy frontend to production:
```bash
npm run build
# Then upload dist/ to production
```

## Troubleshooting

### Backend Issues

Check backend logs on server:
```bash
ssh root@72.61.208.79 "pm2 logs greenpay-backend"
```

Restart backend:
```bash
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && pm2 restart greenpay-backend"
```

### Frontend Issues

If frontend can't connect to backend:
- Verify `.env` contains `VITE_API_URL=https://greenpay.eywademo.cloud/api`
- Check CORS settings in backend `.env` (ALLOWED_ORIGINS)
- Check browser console for specific errors

### Permission Issues

If still getting "Insufficient permissions":
- Check user's role in database
- Verify route middleware includes correct roles
- Check backend logs for authentication errors

## Alternative: Fully Local Development

If you need the backend running locally (for offline development), you would need to:

1. Set up local PostgreSQL database
2. Import production database schema
3. Create test data
4. Update `backend/.env` to use local database:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   ```

This is more complex and not recommended unless necessary.

## Notes

- Frontend uses HMR (Hot Module Replacement) for instant updates
- Backend changes require redeployment to production server
- All database operations affect production data (be careful!)
- Test thoroughly before making destructive changes
