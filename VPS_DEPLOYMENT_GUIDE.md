# VPS Deployment Guide - PNG Green Fees

## 🚀 **Quick Deployment Options**

### **Option 1: Automated Script (Recommended)**

#### **Step 1: Setup SSH Keys**
```bash
# Run the setup script
./setup-ssh-and-deploy.sh
```

This script will:
- ✅ Generate SSH key if needed
- ✅ Show you the public key to add to VPS
- ✅ Guide you through SSH setup
- ✅ Run the deployment automatically

#### **Step 2: Manual SSH Key Setup (if needed)**
```bash
# Copy your SSH key to VPS
ssh-copy-id root@195.200.14.62

# Or manually add the key:
ssh root@195.200.14.62
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### **Step 3: Run Deployment**
```bash
# If SSH is set up, run the deployment script
./copy-to-vps.sh
```

---

### **Option 2: Manual File Upload**

#### **Step 1: Upload Files**
```bash
# Upload the deployment package
scp png-green-fees-fixed-20251011-232103.tar.gz root@195.200.14.62:/tmp/
```

#### **Step 2: Deploy on VPS**
```bash
# SSH into VPS
ssh root@195.200.14.62

# Navigate to application directory
cd /var/www/png-green-fees

# Backup existing deployment
mv dist dist.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Extract new deployment
tar -xzf /tmp/png-green-fees-fixed-20251011-232103.tar.gz

# Set permissions
chown -R www-data:www-data /var/www/png-green-fees/
chmod -R 755 /var/www/png-green-fees/

# Restart Nginx
systemctl restart nginx
```

---

## 📋 **What the Scripts Do**

### **`copy-to-vps.sh` Script:**
- ✅ Checks if required files exist locally
- ✅ Tests SSH connection to VPS
- ✅ Creates backup of existing deployment
- ✅ Copies `dist/` folder to VPS
- ✅ Copies `.env.production` file
- ✅ Sets proper file permissions
- ✅ Restarts Nginx
- ✅ Tests deployment
- ✅ Provides troubleshooting commands

### **`setup-ssh-and-deploy.sh` Script:**
- ✅ Generates SSH key if needed
- ✅ Shows public key for manual setup
- ✅ Guides through SSH configuration
- ✅ Runs deployment automatically

---

## 🔧 **Prerequisites**

### **Local Requirements:**
- ✅ Built application (`npm run build`)
- ✅ Environment file (`.env.production`)
- ✅ SSH client installed
- ✅ Network access to VPS

### **VPS Requirements:**
- ✅ SSH server running
- ✅ Nginx installed and configured
- ✅ Application directory exists (`/var/www/png-green-fees`)
- ✅ `www-data` user exists

---

## 🧪 **Testing After Deployment**

### **1. Basic Functionality**
- **URL:** https://eywademo.cloud
- **Login:** admin@example.com / password123
- **Expected:** No blank screen, dashboard loads

### **2. Feature Testing**
- ✅ **Bulk Upload:** Test CSV upload
- ✅ **Corporate Batch:** Test email functionality
- ✅ **Quotations:** Test sending quotations
- ✅ **Reports:** Verify real data display

### **3. Error Checking**
- ✅ **Browser Console:** No authentication errors
- ✅ **Network Tab:** No failed requests
- ✅ **Application:** All features working

---

## 🚨 **Troubleshooting**

### **SSH Connection Issues:**
```bash
# Test SSH connection
ssh -v root@195.200.14.62

# Check SSH key
ssh-add -l

# Reset SSH connection
ssh-keygen -R 195.200.14.62
```

### **Deployment Issues:**
```bash
# Check Nginx status
ssh root@195.200.14.62 'systemctl status nginx'

# View Nginx logs
ssh root@195.200.14.62 'tail -f /var/log/nginx/error.log'

# Check deployed files
ssh root@195.200.14.62 'ls -la /var/www/png-green-fees/dist/'

# Verify environment variables
ssh root@195.200.14.62 'cat /var/www/png-green-fees/.env.production'
```

### **Application Issues:**
```bash
# Check if application is responding
curl -I https://eywademo.cloud

# Check SSL certificate
curl -I https://eywademo.cloud -k

# Test specific endpoint
curl https://eywademo.cloud/login
```

---

## 📊 **Deployment Files**

### **Generated Files:**
- ✅ `copy-to-vps.sh` - Main deployment script
- ✅ `setup-ssh-and-deploy.sh` - SSH setup helper
- ✅ `png-green-fees-fixed-20251011-232103.tar.gz` - Deployment package
- ✅ `.env.production` - Environment variables

### **VPS Directory Structure:**
```
/var/www/png-green-fees/
├── dist/                    # Built application
├── .env.production         # Environment variables
└── dist.backup.*/          # Backup of previous deployment
```

---

## 🎯 **Expected Results**

### **After Successful Deployment:**
- ✅ **Application loads:** https://eywademo.cloud
- ✅ **Login works:** admin@example.com / password123
- ✅ **No blank screen:** Dashboard displays correctly
- ✅ **All features work:** Bulk upload, emails, reports
- ✅ **No console errors:** Clean browser console

### **Performance:**
- ✅ **Fast loading:** Optimized build
- ✅ **SSL enabled:** HTTPS working
- ✅ **Proper caching:** Static assets cached
- ✅ **Security headers:** Configured

---

## 🚀 **Quick Start Commands**

```bash
# 1. Setup SSH and deploy (easiest)
./setup-ssh-and-deploy.sh

# 2. Or if SSH is already set up
./copy-to-vps.sh

# 3. Or manual deployment
scp png-green-fees-fixed-20251011-232103.tar.gz root@195.200.14.62:/tmp/
ssh root@195.200.14.62 'cd /var/www/png-green-fees && tar -xzf /tmp/png-green-fees-fixed-20251011-232103.tar.gz && chown -R www-data:www-data /var/www/png-green-fees/ && systemctl restart nginx'
```

---

**🎉 Your PNG Green Fees application is ready for production deployment!**

**Choose the deployment method that works best for your setup and follow the steps above.**
