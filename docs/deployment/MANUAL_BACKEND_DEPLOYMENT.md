# Manual Backend Deployment Instructions

The SSH connection to the server appears to be temporarily unavailable. Here are the manual steps to deploy the backend.

## Files Ready for Deployment

All backend files have been created locally in `/Users/nikolay/github/greenpay/backend/`:

```
backend/
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── validator.js
├── routes/
│   ├── auth.js              ✅ NEW - includes /api/auth/me endpoint
│   ├── users.js             ✅ NEW
│   ├── passports.js         ✅ UPDATED - Counter_Agent allowed
│   ├── individual-purchases.js  ✅ UPDATED - Counter_Agent allowed
│   ├── invoices.js          ✅ NEW
│   ├── quotations.js        ✅ NEW
│   └── tickets.js           ✅ NEW
├── .env
├── package.json
└── server.js
```

## Deployment Steps

### Option 1: Using SCP (when SSH is available)

```bash
# Upload all backend files
scp -r backend/* root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# SSH into server and install dependencies
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install
pm2 restart greenpay-api
pm2 logs greenpay-api
```

### Option 2: Manual File Upload via SFTP/FTP

1. Connect to server using SFTP client (FileZilla, Cyberduck, etc.)
2. Navigate to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
3. Upload the following files:
   - `routes/auth.js` (includes new `/me` endpoint)
   - `routes/users.js` (new)
   - `routes/passports.js` (updated permissions)
   - `routes/individual-purchases.js` (updated permissions)
   - `routes/invoices.js` (new)
   - `routes/quotations.js` (new)
   - `routes/tickets.js` (new)
   - `server.js` (if needed)
   - `package.json` (if needed)

4. SSH into server and run:
   ```bash
   cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
   npm install
   pm2 restart greenpay-api
   ```

### Option 3: Upload Individual Files

Since you have SSH access with key+password, you can upload the most critical files one by one:

```bash
# Upload auth.js (includes /api/auth/me endpoint)
scp backend/routes/auth.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated passports.js
scp backend/routes/passports.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload updated individual-purchases.js
scp backend/routes/individual-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Then restart
ssh root@72.61.208.79 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && pm2 restart greenpay-api"
```

## Critical Files to Deploy

At minimum, deploy these 3 files to fix the immediate issues:

1. **routes/auth.js** - Adds missing `/api/auth/me` endpoint
2. **routes/passports.js** - Allows Counter_Agent to create passports
3. **routes/individual-purchases.js** - Allows Counter_Agent to create vouchers

## Backend .env Configuration

Ensure the backend `.env` file exists on the server at:
`/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env`

With these contents:

```bash
NODE_ENV=production
PORT=3001

# Database Configuration (local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=GreenPay2025!Secure#PG

# JWT Configuration
JWT_SECRET=a26baa9a385b39e5fb8f99f54734391075784715b7c6cbded9651da6ce696a38
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,https://greenpay.eywademo.cloud
```

## Verify Deployment

After deploying, test the API:

```bash
# Test health endpoint
curl https://greenpay.eywademo.cloud/api/health

# Test /me endpoint
curl https://greenpay.eywademo.cloud/api/auth/me

# Check PM2 status
ssh root@72.61.208.79 "pm2 status greenpay-api"

# View logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 50"
```

## Troubleshooting

### PM2 App Name

The backend PM2 process is called `greenpay-api` (not `greenpay-backend`).

Commands:
```bash
pm2 status greenpay-api
pm2 restart greenpay-api
pm2 logs greenpay-api
pm2 stop greenpay-api
pm2 start server.js --name greenpay-api
```

### If SSH Connection Refused

- Check if server is running: `ping 72.61.208.79`
- Try different SSH port if configured
- Contact server administrator
- Use web-based control panel if available

### If Backend Won't Start

1. Check logs: `pm2 logs greenpay-api`
2. Verify .env file exists
3. Check database connectivity from server
4. Ensure all dependencies installed: `npm install`

## After Deployment

Once backend is deployed:

1. Start frontend locally:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 (or 3000)

3. Login as Agent (Counter_Agent role)

4. Test voucher creation - should work without "Insufficient permissions" error

## Files Location Summary

**Local:** `/Users/nikolay/github/greenpay/backend/`
**Remote:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
**PM2 App:** `greenpay-api`
**API URL:** `https://greenpay.eywademo.cloud/api`
