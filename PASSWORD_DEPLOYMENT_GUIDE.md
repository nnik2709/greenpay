# Password-Based VPS Deployment Guide

## 🚀 **Simple Deployment with Password Authentication**

Since your VPS uses password authentication, I've created scripts that will prompt you for the password multiple times during deployment.

---

## 📋 **Quick Deployment (Recommended)**

### **Option 1: Simple Deploy Script**
```bash
# Run the simple deployment script
./deploy-with-password.sh
```

**This script will:**
- ✅ Check if files exist locally
- ✅ Prompt you for VPS password multiple times
- ✅ Copy all files to VPS
- ✅ Set proper permissions
- ✅ Restart Nginx
- ✅ Test the deployment

**You'll be prompted for the VPS password about 6-8 times during the process.**

---

### **Option 2: Detailed Deploy Script**
```bash
# Run the detailed deployment script
./copy-to-vps-password.sh
```

**This script provides:**
- ✅ More detailed output
- ✅ Progress indicators
- ✅ Better error handling
- ✅ Comprehensive testing

---

## 🔐 **What to Expect**

### **Password Prompts:**
You'll see prompts like this multiple times:
```
Password for root@195.200.14.62: [Type your VPS password]
```

### **Typical Deployment Flow:**
1. **SSH Connection Test** - Enter password
2. **Create Directory** - Enter password
3. **Backup Existing** - Enter password
4. **Copy Files** - Enter password (for rsync)
5. **Copy Environment** - Enter password (for scp)
6. **Set Permissions** - Enter password
7. **Restart Nginx** - Enter password
8. **Test Deployment** - Enter password

**Total:** About 6-8 password prompts

---

## 🧪 **After Deployment**

### **Test the Application:**
1. **Open:** https://eywademo.cloud (in new incognito window)
2. **Login:** admin@example.com / password123
3. **Expected:** No blank screen, dashboard loads properly

### **Verify Features:**
- ✅ **Dashboard loads** without blank screen
- ✅ **Bulk Upload** works with CSV files
- ✅ **Corporate Batch Email** functionality works
- ✅ **Quotations** can be sent without UUID errors
- ✅ **Reports** show real data from database

---

## 🔧 **Troubleshooting**

### **If Deployment Fails:**

#### **SSH Connection Issues:**
```bash
# Test SSH manually
ssh root@195.200.14.62

# Check if VPS is accessible
ping 195.200.14.62
```

#### **File Copy Issues:**
```bash
# Check if files exist locally
ls -la dist/
ls -la .env.production

# Test rsync manually
rsync -avz dist/ root@195.200.14.62:/var/www/png-green-fees/dist/
```

#### **Permission Issues:**
```bash
# SSH to VPS and check permissions
ssh root@195.200.14.62
ls -la /var/www/png-green-fees/
chown -R www-data:www-data /var/www/png-green-fees/
```

#### **Nginx Issues:**
```bash
# SSH to VPS and check Nginx
ssh root@195.200.14.62
systemctl status nginx
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

---

## 📊 **Manual Commands (If Scripts Fail)**

### **Step-by-Step Manual Deployment:**

```bash
# 1. Test SSH connection
ssh root@195.200.14.62

# 2. Create directory (if needed)
mkdir -p /var/www/png-green-fees

# 3. Copy files from local machine
rsync -avz dist/ root@195.200.14.62:/var/www/png-green-fees/dist/
scp .env.production root@195.200.14.62:/var/www/png-green-fees/.env.production

# 4. Set permissions on VPS
ssh root@195.200.14.62
chown -R www-data:www-data /var/www/png-green-fees/
chmod -R 755 /var/www/png-green-fees/
chmod 600 /var/www/png-green-fees/.env.production

# 5. Restart Nginx
systemctl restart nginx
systemctl status nginx
```

---

## 🎯 **Expected Results**

### **After Successful Deployment:**
- ✅ **Application loads:** https://eywademo.cloud
- ✅ **No blank screen:** Dashboard displays correctly
- ✅ **Login works:** admin@example.com / password123
- ✅ **All features work:** Bulk upload, emails, reports
- ✅ **No console errors:** Clean browser console

### **Console Errors Fixed:**
- ✅ **Authentication:** "Invalid Refresh Token" resolved
- ✅ **Manifest:** Logo icon errors resolved
- ✅ **IndexedDB:** Storage errors resolved
- ✅ **CORS:** All Edge Function calls work
- ✅ **UUID:** Quotation sending works

---

## 🚀 **Quick Start**

```bash
# 1. Make sure files are ready
npm run build

# 2. Run deployment script
./deploy-with-password.sh

# 3. Enter VPS password when prompted (6-8 times)

# 4. Test application
# Open https://eywademo.cloud in incognito window
```

---

## 📞 **Support**

### **If You Need Help:**

1. **Check the deployment output** for error messages
2. **Test SSH manually** to ensure VPS access
3. **Verify file permissions** on the VPS
4. **Check Nginx logs** for web server issues
5. **Test in incognito window** to avoid cache issues

### **Common Issues:**
- **Wrong password:** Make sure you're entering the correct VPS password
- **Network issues:** Ensure your internet connection is stable
- **VPS down:** Check if the VPS is accessible via ping
- **File permissions:** Ensure www-data user has proper access

---

**🎉 Your PNG Green Fees application should now work perfectly in production!**

**The blank screen issue will be resolved with the proper environment variables and all fixes included in this deployment.**
