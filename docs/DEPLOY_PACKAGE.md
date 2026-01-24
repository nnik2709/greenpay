# Complete Deployment Package - Fix CSS Issue

## Problem
CSS file is not loading on production despite multiple deployments. Site is completely unstyled.

## Root Cause
Old dist folder likely not fully replaced, or files uploaded to wrong location.

## Solution: Complete Clean Deployment

### Step 1: Verify Local Build is Fresh
```bash
# In your local terminal, from /Users/nikolay/github/greenpay
npm run build

# Verify CSS file exists
ls -lh dist/assets/*.css

# You should see something like:
# -rw-r--r--  1 nikolay  staff   74K Jan 24 14:30 index-BkXVrK0-.css
```

### Step 2: Clean Production Server (via SSH)
```bash
# SSH into server
ssh root@165.22.52.100

# COMPLETELY remove old dist folder
rm -rf /var/www/png-green-fees/dist

# Create fresh empty dist folder
mkdir -p /var/www/png-green-fees/dist

# Exit SSH
exit
```

### Step 3: Upload Complete dist Folder
```bash
# From your local machine in /Users/nikolay/github/greenpay
# Upload ENTIRE dist folder contents
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/

# This will upload:
# - index.html
# - assets/index-BkXVrK0-.css (CSS file)
# - assets/index-DVrxQ5bw.js (JS file)
# - All other assets (logos, icons, manifest.json, etc.)
```

### Step 4: Verify Files on Production
```bash
# SSH back into server
ssh root@165.22.52.100

# Check all files were uploaded
ls -lh /var/www/png-green-fees/dist/
ls -lh /var/www/png-green-fees/dist/assets/

# Verify CSS file exists and has correct size (~74KB)
ls -lh /var/www/png-green-fees/dist/assets/index-BkXVrK0-.css

# Verify index.html references this CSS file
grep "stylesheet" /var/www/png-green-fees/dist/index.html

# Should show: <link rel="stylesheet" crossorigin href="/assets/index-BkXVrK0-.css">
```

### Step 5: Restart Services
```bash
# Still in SSH terminal
pm2 restart png-green-fees
nginx -s reload

# Clear any nginx cache
rm -rf /var/cache/nginx/*
systemctl restart nginx
```

### Step 6: Test in Browser
1. Open https://greenpay.eywademo.cloud in **incognito/private** window
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Check DevTools Network tab - verify CSS file loads with 200 status

### Step 7: If Still Not Working - Check Nginx Config
```bash
# In SSH terminal
nginx -T 2>&1 | grep -A 20 "greenpay.eywademo.cloud"

# Look for the location block serving static files
# Should have something like:
# location / {
#     root /var/www/png-green-fees/dist;
#     try_files $uri $uri/ /index.html;
# }
```

## Expected Result
Site should be fully styled with green gradient buttons, proper layout, and all Tailwind CSS applied.

## If Problem Persists
Run this diagnostic and send me the output:
```bash
ssh root@165.22.52.100 << 'EOF'
echo "=== CSS File Check ==="
ls -lh /var/www/png-green-fees/dist/assets/*.css

echo -e "\n=== index.html CSS Reference ==="
grep stylesheet /var/www/png-green-fees/dist/index.html

echo -e "\n=== Nginx Config for greenpay.eywademo.cloud ==="
nginx -T 2>&1 | grep -A 15 "greenpay.eywademo.cloud"

echo -e "\n=== PM2 Status ==="
pm2 list | grep png-green-fees

echo -e "\n=== Test CSS Accessibility ==="
curl -I https://greenpay.eywademo.cloud/assets/index-BkXVrK0-.css
EOF
```
