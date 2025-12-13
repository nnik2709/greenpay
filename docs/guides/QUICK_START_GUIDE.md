# GreenPay Quick Start Guide

This guide will help you complete the remaining setup tasks to get GreenPay fully operational.

## Prerequisites

- SSH access to server: `root@72.61.208.79`
- Local build already created in `dist/` folder

## Task 1: Create Admin User (5 minutes)

### Step 1: SSH into the server
```bash
ssh root@72.61.208.79
```

### Step 2: Navigate to backend directory
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
```

### Step 3: Generate password hash
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10, (err, hash) => { if (err) console.error(err); else console.log(hash); });"
```

**Copy the output hash** (it looks like: `$2a$10$...`)

### Step 4: Connect to database
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db
```

### Step 5: Create the admin user
Paste this SQL (replace `YOUR_HASH_HERE` with the hash from Step 3):

```sql
INSERT INTO "User" (name, email, "passwordHash", "roleId", "isActive")
VALUES ('Admin User', 'admin@greenpay.com', 'YOUR_HASH_HERE', 1, true);
```

### Step 6: Verify user creation
```sql
SELECT id, name, email, "roleId", "isActive" FROM "User" WHERE email = 'admin@greenpay.com';
```

You should see:
```
 id |    name     |        email         | roleId | isActive
----+-------------+----------------------+--------+----------
  X | Admin User  | admin@greenpay.com   |      1 | t
```

### Step 7: Exit database
```sql
\q
```

### ✅ Task 1 Complete!
You can now log in with:
- Email: `admin@greenpay.com`
- Password: `Admin123!`

---

## Task 2: Deploy Frontend (5 minutes)

### Option A: Using the deployment script (Recommended)

From your local Mac:

```bash
cd /Users/nikolay/github/greenpay

# Make sure the build exists
ls -la dist/

# Run the deployment script
./deploy-to-greenpay-server.sh
```

The script will:
1. Create a backup of current deployment
2. Remove old frontend files
3. Upload new build files
4. Set proper permissions
5. Verify deployment

### Option B: Manual deployment

If the script doesn't work (SSH issues), do this manually:

#### Step 1: From your local Mac
```bash
cd /Users/nikolay/github/greenpay

# Create a tarball of the build
tar -czf greenpay-frontend.tar.gz -C dist .
```

#### Step 2: Transfer to server using SCP or other method
```bash
scp greenpay-frontend.tar.gz root@72.61.208.79:/tmp/
```

#### Step 3: SSH into server
```bash
ssh root@72.61.208.79
```

#### Step 4: On the server, deploy the files
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Backup current deployment
mkdir -p backups
tar -czf backups/frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || true

# Remove old frontend files
rm -rf assets
rm -f index.html

# Extract new build
tar -xzf /tmp/greenpay-frontend.tar.gz

# Set permissions
chown -R eywademo-greenpay:eywademo-greenpay assets index.html
chmod -R 755 assets
chmod 644 index.html

# Verify
ls -la
```

### Option C: Alternative - Use SFTP client

If you have a GUI SFTP client (like Cyberduck, FileZilla, etc.):

1. Connect to `72.61.208.79` as `root`
2. Navigate to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
3. Create backup folder: `backups/`
4. Upload contents of local `dist/` folder to server directory
5. Use SSH to set permissions (see Option B, Step 4)

### ✅ Task 2 Complete!
Visit https://greenpay.eywademo.cloud to see the deployed application.

---

## Task 3: Testing (10 minutes)

### Backend Health Check
```bash
curl https://greenpay.eywademo.cloud/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Frontend Testing

1. **Open application:**
   - Navigate to: https://greenpay.eywademo.cloud

2. **Test login:**
   - Email: `admin@greenpay.com`
   - Password: `Admin123!`
   - Should successfully log in

3. **Test pages (check for console errors):**
   - Dashboard - Should load with transaction data
   - Users page - Should load without errors
   - Passports page - Should load
   - Purchases page - Should load
   - Profile Settings - Should load

4. **Check browser console:**
   - Open DevTools (F12)
   - Console should be clean (no red errors)
   - 404 errors for transactions are expected and filtered

5. **Test logout:**
   - Click logout
   - Should return to login page

### Backend Logs
```bash
ssh root@72.61.208.79
pm2 logs greenpay-api --lines 50
```

### Database Check
```bash
ssh root@72.61.208.79
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT COUNT(*) FROM \"User\";"
```

---

## Troubleshooting

### Issue: "Permission denied" when SSH
**Solution:** You may need to set up SSH keys or use password authentication. Contact your server administrator.

### Issue: Login returns 401 error
**Solution:**
1. Verify user was created: `SELECT * FROM "User" WHERE email = 'admin@greenpay.com';`
2. Check backend logs: `pm2 logs greenpay-api`
3. Verify backend is running: `pm2 status`

### Issue: Frontend shows blank page
**Solution:**
1. Check if files were deployed: `ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
2. Check permissions: Files should be owned by `eywademo-greenpay`
3. Check nginx logs: `tail -f /var/log/nginx/error.log`

### Issue: Backend not responding
**Solution:**
```bash
ssh root@72.61.208.79
pm2 restart greenpay-api
pm2 logs greenpay-api
```

### Issue: Database connection error
**Solution:**
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Test connection: `PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT 1;"`
3. Check backend .env file has correct credentials

---

## Quick Reference

### Server Details
- **Host:** 72.61.208.79
- **User:** root
- **Frontend URL:** https://greenpay.eywademo.cloud
- **Backend API:** https://greenpay.eywademo.cloud/api

### Admin Credentials
- **Email:** admin@greenpay.com
- **Password:** Admin123!

### File Locations
- **Backend:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
- **Frontend:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
- **Backups:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backups/`

### Useful Commands
```bash
# PM2 Management
pm2 status
pm2 logs greenpay-api
pm2 restart greenpay-api
pm2 info greenpay-api

# Database Access
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db

# View Backend Logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 100"

# Check Backend Status
curl https://greenpay.eywademo.cloud/api/health

# Restore from backup (if needed)
ssh root@72.61.208.79
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backups
ls -lt
# Extract desired backup: tar -xzf frontend-backup-YYYYMMDD-HHMMSS.tar.gz -C ../
```

---

## Next Steps (Optional)

### Configure SMTP for Password Reset Emails

See `PRODUCTION_SMTP_SETUP.md` for detailed instructions.

**Quick Gmail Setup:**
1. Enable 2-Step Verification on Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update backend `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM="GreenPay Support <your-email@gmail.com>"
   FRONTEND_URL=https://greenpay.eywademo.cloud
   ```
4. Restart backend: `pm2 restart greenpay-api`

---

## Success Checklist

- [ ] Admin user created successfully
- [ ] Can log in at https://greenpay.eywademo.cloud
- [ ] Dashboard loads without errors
- [ ] Users page loads without errors
- [ ] Passports page loads
- [ ] Purchases page loads
- [ ] Backend API responding: https://greenpay.eywademo.cloud/api/health
- [ ] Browser console is clean (no critical errors)
- [ ] PM2 shows backend as "online"

---

**Good luck! 🚀**

If you encounter any issues, check the troubleshooting section or review the logs.
