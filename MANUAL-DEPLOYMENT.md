# Manual Deployment Instructions

Since SSH is having permission issues, here are the manual steps to deploy the fixed application:

## Option 1: Using Hostinger File Manager (Recommended)

1. **Access Hostinger File Manager:**
   - Log into your Hostinger control panel
   - Go to File Manager
   - Navigate to `/var/www/png-green-fees/`

2. **Upload the dist folder:**
   - Delete the existing `dist` folder
   - Upload the new `dist` folder from your local machine
   - Extract it to `/var/www/png-green-fees/dist/`

3. **Set permissions:**
   - Right-click on the `dist` folder
   - Set permissions to 755
   - Set owner to `www-data`

## Option 2: Using SCP with password

```bash
# Upload the dist folder
scp -r dist/* root@195.200.14.62:/var/www/png-green-fees/dist/

# Set permissions on VPS
ssh root@195.200.14.62 "chown -R www-data:www-data /var/www/png-green-fees && chmod -R 755 /var/www/png-green-fees"
```

## Option 3: Using Git on VPS

1. **SSH into VPS:**
   ```bash
   ssh root@195.200.14.62
   ```

2. **Navigate to app directory:**
   ```bash
   cd /var/www/png-green-fees
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Build on VPS:**
   ```bash
   npm install
   npm run build
   ```

5. **Set permissions:**
   ```bash
   chown -R www-data:www-data /var/www/png-green-fees
   chmod -R 755 /var/www/png-green-fees
   ```

## After Deployment

1. **Restart Nginx:**
   ```bash
   systemctl restart nginx
   ```

2. **Test the application:**
   - Visit https://eywademo.cloud
   - Test admin login (admin@example.com / admin123)
   - Verify dashboard loads correctly
   - Test counter agent login (agent@example.com / agent123)
   - Verify agent landing page loads correctly

## What's Fixed

✅ **Admin Login White Screen Issue** - Now shows dashboard properly
✅ **Role-Based Routing** - Counter agents see agent landing page, others see dashboard
✅ **Authentication Flow** - All user roles work correctly
✅ **No More Redirect Loops** - Smooth login experience

## Test Credentials

- **Admin:** admin@example.com / admin123
- **Finance Manager:** finance@example.com / finance123  
- **Counter Agent:** agent@example.com / agent123
- **IT Support:** support@example.com / support123
