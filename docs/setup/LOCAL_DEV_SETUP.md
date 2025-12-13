# Local Development Setup Guide

This guide helps you set up the GreenPay application for local development while connecting to the remote PostgreSQL database on the production server.

## Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Frontend (Localhost)   │         │  Backend (Localhost)     │
│  Port: 5173            │────────▶│  Port: 3001              │
│  Vite Dev Server       │         │  Express.js + Node.js    │
└─────────────────────────┘         └──────────────────────────┘
                                              │
                                              │
                                              ▼
                                    ┌──────────────────────────┐
                                    │  PostgreSQL Database     │
                                    │  72.61.208.79:5432      │
                                    │  greenpay_db            │
                                    └──────────────────────────┘
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Network access to production database server (72.61.208.79)

## Setup Steps

### 1. Backend Setup

All backend files have been created in the `backend/` directory:

```bash
backend/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── middleware/
│   ├── auth.js              # JWT authentication & role checking
│   └── validator.js         # Express validator wrapper
├── routes/
│   ├── auth.js              # Login, register, password reset
│   ├── users.js             # User management
│   ├── passports.js         # Passport CRUD
│   ├── individual-purchases.js  # Voucher creation
│   ├── invoices.js          # Invoice management
│   ├── quotations.js        # Quotation management
│   └── tickets.js           # Support tickets
├── .env                     # Environment configuration
├── package.json             # Dependencies
└── server.js                # Express server
```

#### Install Backend Dependencies

```bash
cd backend
npm install
```

#### Start Backend Server

```bash
npm run dev
```

The backend will start on **http://localhost:3001**

Expected output:
```
╔════════════════════════════════════════╗
║   🚀 GreenPay API Server Running      ║
╠════════════════════════════════════════╣
║   Port: 3001                       ║
║   Environment: development          ║
║   Database: greenpay_db            ║
╚════════════════════════════════════════╝
```

### 2. Frontend Setup

The frontend .env has been configured to point to the local backend:

```bash
# .env
VITE_API_URL=http://localhost:3001/api
```

#### Start Frontend Development Server

In a new terminal (keep backend running):

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## Database Configuration

The backend connects to the remote PostgreSQL database with these credentials (configured in `backend/.env`):

```
DB_HOST=72.61.208.79
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=GreenPay2025!Secure#PG
```

All database tables are already created on the production server.

## Testing the Setup

Run the test script to verify everything is working:

```bash
./test-local-setup.sh
```

This will check:
- ✅ Backend server is running
- ✅ Database connection is working
- ✅ Frontend .env is configured correctly

## Testing Voucher Creation as Agent

1. Open browser to **http://localhost:5173**
2. Login with Agent credentials (Counter_Agent role)
3. Navigate to Individual Purchase page
4. Try to generate a voucher

This should now work without "Insufficient permissions" error.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password/:userId` - Admin reset password
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users (Admin, IT_Support)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (Admin, IT_Support)
- `PUT /api/users/:id` - Update user (Admin, IT_Support)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/roles/list` - Get all roles

### Passports
- `GET /api/passports` - Get all passports
- `GET /api/passports/:id` - Get single passport
- `POST /api/passports` - Create passport (Admin, Manager, Agent, Flex_Admin, Counter_Agent)
- `PUT /api/passports/:id` - Update passport
- `DELETE /api/passports/:id` - Delete passport

### Individual Purchases (Vouchers)
- `GET /api/individual-purchases` - Get all vouchers
- `GET /api/individual-purchases/:id` - Get single voucher
- `POST /api/individual-purchases` - Create voucher (Flex_Admin, Counter_Agent)
- `PUT /api/individual-purchases/:id` - Update voucher
- `DELETE /api/individual-purchases/:id` - Delete voucher

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Quotations
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get single quotation
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `POST /api/quotations/:id/convert-to-invoice` - Convert to invoice

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/comments` - Add comment

## Role-Based Access Control

The system has 4 roles with different permissions:

- **Flex_Admin**: Full system access
- **Counter_Agent**: Passport purchases, bulk uploads, payments
- **Finance_Manager**: Quotations, reports, passports (view only)
- **IT_Support**: User management, reports, scan/validate

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use: `lsof -i :3001`
- Verify .env file exists in `backend/` directory
- Check database connectivity: `ping 72.61.208.79`

### Frontend can't connect to backend
- Verify `.env` contains `VITE_API_URL=http://localhost:3001/api`
- Check backend is running on port 3001
- Check browser console for CORS errors

### Database connection errors
- Verify you have network access to 72.61.208.79
- Check database credentials in `backend/.env`
- Review backend logs for specific PostgreSQL errors

### "Insufficient permissions" errors
- Verify the user's role in the database
- Check the route middleware in `backend/routes/` files
- Ensure `checkRole()` includes the correct role names

## Switching Back to Production

To switch back to production mode:

1. Update frontend `.env`:
   ```bash
   VITE_API_URL=https://greenpay.eywademo.cloud/api
   ```

2. Rebuild frontend:
   ```bash
   npm run build
   ```

3. Deploy to server using deployment scripts

## Development Workflow

1. Make changes to frontend or backend code
2. Changes auto-reload (Vite HMR for frontend, nodemon for backend)
3. Test locally before deploying to production
4. When ready, deploy using `./deploy-to-greenpay-server.sh`

## Environment Variables

### Backend (.env in backend/)
```
NODE_ENV=development
PORT=3001
DB_HOST=72.61.208.79
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=GreenPay2025!Secure#PG
JWT_SECRET=a26baa9a385b39e5fb8f99f54734391075784715b7c6cbded9651da6ce696a38
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

### Frontend (.env in root/)
```
VITE_API_URL=http://localhost:3001/api
```

## Notes

- The backend connects to the **production database** on the remote server
- All changes made locally will affect production data
- Be careful when testing destructive operations (delete, update)
- Use transactions for critical operations
- Always test with non-production data if possible
