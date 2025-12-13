# Manual Unzip Commands for CloudPanel Terminal

Run these commands in CloudPanel Terminal or SSH to unzip and configure the backend.

## Step-by-Step Commands

### 1. Navigate to the upload location
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
```

### 2. List files to confirm backend.zip is there
```bash
ls -la *.zip
```

### 3. Create backup of existing backend (if it exists)
```bash
mv backend backend-backup-$(date +%Y%m%d-%H%M%S)
```

### 4. Unzip the backend folder
```bash
unzip backend.zip
```

### 5. Set proper ownership (adjust user/group if needed)
```bash
chown -R eywademo-greenpay:eywademo-greenpay backend/
```

Or if that requires sudo:
```bash
sudo chown -R eywademo-greenpay:eywademo-greenpay backend/
```

### 6. Set directory permissions (755)
```bash
find backend/ -type d -exec chmod 755 {} \;
```

### 7. Set file permissions (644)
```bash
find backend/ -type f -exec chmod 644 {} \;
```

### 8. Secure .env file permissions (if exists)
```bash
chmod 600 backend/.env
```

### 9. Navigate to backend directory
```bash
cd backend
```

### 10. Install dependencies
```bash
npm install
```

### 11. Restart the backend API
```bash
pm2 restart greenpay-api
```

Or if it doesn't exist:
```bash
pm2 start server.js --name greenpay-api
```

### 12. Check PM2 status
```bash
pm2 status greenpay-api
```

### 13. View logs to verify it's working
```bash
pm2 logs greenpay-api --lines 30
```

## Quick One-Liner (All Commands)

Copy and paste this entire block:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && \
mv backend backend-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null ; \
unzip -q backend.zip && \
chown -R eywademo-greenpay:eywademo-greenpay backend/ && \
find backend/ -type d -exec chmod 755 {} \; && \
find backend/ -type f -exec chmod 644 {} \; && \
chmod 600 backend/.env 2>/dev/null ; \
cd backend && \
npm install && \
pm2 restart greenpay-api || pm2 start server.js --name greenpay-api && \
echo "" && \
echo "✅ Deployment complete!" && \
pm2 status greenpay-api && \
pm2 logs greenpay-api --lines 20 --nostream
```

## Alternative: If backend.zip contains a 'backend' folder inside

If after unzipping you see `backend/backend/`, run:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
mv backend backend-old
mv backend-old/backend .
rm -rf backend-old
```

## Verify Deployment

### Check if files are in the right place:
```bash
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

You should see:
- `server.js`
- `package.json`
- `.env`
- `routes/` folder
- `config/` folder
- `middleware/` folder
- `node_modules/` (after npm install)

### Test the API:
```bash
curl http://localhost:3001/api/health
```

Or from outside:
```bash
curl https://greenpay.eywademo.cloud/api/health
```

### Check specific routes:
```bash
# Should return 401 (unauthorized) but proves the route exists
curl https://greenpay.eywademo.cloud/api/auth/me
```

## Troubleshooting

### If PM2 restart fails:
```bash
pm2 delete greenpay-api
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 start server.js --name greenpay-api
pm2 save
```

### If permissions error:
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
sudo chown -R eywademo-greenpay:eywademo-greenpay backend/
sudo chmod -R 755 backend/
```

### If npm install fails:
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
rm -rf node_modules package-lock.json
npm install
```

### View detailed logs:
```bash
pm2 logs greenpay-api --lines 100
```

### Check if server is running:
```bash
pm2 status
netstat -tlnp | grep 3001
```

## Expected Output

After successful deployment, `pm2 logs` should show:

```
╔════════════════════════════════════════╗
║   🚀 GreenPay API Server Running      ║
╠════════════════════════════════════════╣
║   Port: 3001                       ║
║   Environment: production          ║
║   Database: greenpay_db            ║
╚════════════════════════════════════════╝
```

## Next Steps

1. Test the frontend locally: `npm run dev`
2. Login as Agent (Counter_Agent role)
3. Try creating a voucher
4. Should work without "Insufficient permissions" error!
