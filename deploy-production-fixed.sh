#!/bin/bash

# PNG Green Fees - Production Deployment Script (Fixed Version)
# This script deploys the application with correct environment variables

set -e  # Exit on any error

VPS_IP="195.200.14.62"
APP_DIR="/var/www/png-green-fees"
DEPLOYMENT_FILE="png-green-fees-fixed-20251011-232103.tar.gz"

echo "🚀 Deploying PNG Green Fees (Fixed Version) to Production..."
echo "=================================================="
echo ""

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ Deployment file not found: $DEPLOYMENT_FILE"
    echo "   Please run the build process first"
    exit 1
fi

echo "📦 Deployment file found: $DEPLOYMENT_FILE"
echo "📊 File size: $(du -h $DEPLOYMENT_FILE | cut -f1)"
echo ""

# Create deployment instructions
cat > DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# Production Deployment Instructions

## 🚀 **Quick Deployment Steps**

### **1. Upload the deployment package to your VPS:**
```bash
# Upload this file to your VPS: png-green-fees-fixed-20251011-232103.tar.gz
# You can use SFTP, SCP, or any file transfer method
```

### **2. SSH into your VPS:**
```bash
ssh root@195.200.14.62
```

### **3. Deploy the application:**
```bash
# Navigate to the application directory
cd /var/www/png-green-fees

# Backup current deployment (optional)
mv dist dist.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Extract the new deployment
tar -xzf png-green-fees-fixed-20251011-232103.tar.gz

# Set proper permissions
chown -R www-data:www-data /var/www/png-green-fees/
chmod -R 755 /var/www/png-green-fees/

# Restart Nginx
systemctl restart nginx

# Check Nginx status
systemctl status nginx
```

### **4. Verify the deployment:**
```bash
# Check if files are deployed correctly
ls -la /var/www/png-green-fees/dist/

# Check environment variables
cat /var/www/png-green-fees/.env.production

# Test the application
curl -I https://eywademo.cloud
```

### **5. Clear browser cache and test:**
- Open https://eywademo.cloud in a new incognito/private window
- Login with: admin@example.com / password123
- The blank screen issue should be resolved

## 🔧 **What's Fixed in This Deployment:**

✅ **Environment Variables:** Correct Supabase URL and API key
✅ **Authentication:** Proper refresh token handling
✅ **Logo Files:** Added missing manifest icons
✅ **CORS Issues:** All Edge Functions have proper headers
✅ **UUID Errors:** Quotation sending fixed
✅ **Toast Warnings:** React warnings eliminated
✅ **Email Functionality:** Corporate batch emails working

## 🧪 **Testing Checklist:**

1. **Login:** Should work without blank screen
2. **Dashboard:** Should load properly
3. **Bulk Upload:** Test CSV upload
4. **Corporate Batch:** Test email functionality
5. **Quotations:** Test sending quotations
6. **Reports:** Verify real data display

## 🚨 **If Issues Persist:**

1. **Check Nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for any remaining errors

3. **Verify environment variables:**
   ```bash
   cat /var/www/png-green-fees/.env.production
   ```

## 📞 **Support:**
If you continue to have issues, check:
- Browser console for errors
- Nginx error logs
- Supabase dashboard for authentication issues
EOF

echo "✅ Deployment package ready: $DEPLOYMENT_FILE"
echo "✅ Instructions created: DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "📋 **Next Steps:**"
echo "1. Upload $DEPLOYMENT_FILE to your VPS"
echo "2. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md"
echo "3. The blank screen issue should be resolved"
echo ""
echo "🌐 **After deployment, test at:**"
echo "   https://eywademo.cloud"
echo "   Login: admin@example.com / password123"
echo ""
echo "🎉 **What's Fixed:**"
echo "   ✅ Environment variables (Supabase URL/Key)"
echo "   ✅ Missing logo files"
echo "   ✅ Authentication refresh token issues"
echo "   ✅ All CORS and UUID errors"
echo ""
