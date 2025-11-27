# Deploy GreenPay Frontend Without SSH Command Line

If SSH from terminal is not working, you can deploy using these alternative methods:

## Option 1: Web-based File Manager (Easiest)

If your hosting provider has a control panel (cPanel, Plesk, DirectAdmin):

1. **Access file manager through web browser**
2. **Navigate to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
3. **Create backup:** Download or rename current `assets` folder and `index.html`
4. **Upload new files:**
   - Upload `greenpay-frontend-20251125-195934.tar.gz` to `/tmp/`
   - Extract it in the greenpay directory
   OR
   - Delete old `assets` folder and `index.html`
   - Upload all files from local `dist/` folder

## Option 2: SFTP Client (Recommended)

Use FileZilla, Cyberduck, Transmit, or similar:

### Using FileZilla:
1. **Download FileZilla:** https://filezilla-project.org/
2. **Create new site:**
   - Protocol: SFTP
   - Host: 72.61.208.79
   - Port: 22 (or try other ports if this doesn't work)
   - Logon Type: Key file
   - User: root
   - Key file: `/Users/nikolay/.ssh/nikolay`
3. **Connect**
4. **Navigate to:**
   - Remote: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
   - Local: `/Users/nikolay/github/greenpay/dist/`
5. **Backup current files:**
   - Right-click `assets` → Rename to `assets.backup`
   - Right-click `index.html` → Rename to `index.html.backup`
6. **Upload new files:**
   - Select all files in local `dist/` folder
   - Drag to remote directory
   - Wait for upload to complete (80 files, ~860KB)

### Using Cyberduck (Mac):
1. **Download Cyberduck:** https://cyberduck.io/
2. **Click "Open Connection"**
3. **Configure:**
   - Protocol: SFTP (SSH File Transfer Protocol)
   - Server: 72.61.208.79
   - Port: 22
   - Username: root
   - SSH Private Key: `/Users/nikolay/.ssh/nikolay`
4. **Connect and follow steps 4-6 from FileZilla above**

## Option 3: Use Existing Package with Alternative Transfer

### Step 1: Transfer the package using web upload

If you have access to a web-based upload tool:
1. Upload `greenpay-frontend-20251125-195934.tar.gz` to `/tmp/` on server
2. Contact server admin to run these commands:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
mkdir -p backups
tar -czf backups/backup-$(date +%Y%m%d).tar.gz assets index.html 2>/dev/null || true
rm -rf assets
rm -f index.html
tar -xzf /tmp/greenpay-frontend-20251125-195934.tar.gz
chown -R eywademo-greenpay:eywademo-greenpay assets index.html
chmod -R 755 assets
chmod 644 index.html
```

## Option 4: GitHub/Git-based Deployment

If the server has git installed and you're using version control:

### Step 1: Commit and push your build
```bash
cd /Users/nikolay/github/greenpay

# Add dist files (temporarily if in .gitignore)
git add -f dist/
git commit -m "Build for deployment $(date +%Y%m%d)"
git push origin main
```

### Step 2: Ask server admin to pull and copy files
```bash
# On server (via any method that works)
cd /tmp
git clone <your-repo-url> greenpay-temp
cd greenpay-temp

# Copy build files
cp -r dist/* /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

## Troubleshooting SSH

### Why SSH might not be working:

1. **Wrong port**: SSH might be on a different port
   - Try: `ssh -i ~/.ssh/nikolay -p 2222 root@72.61.208.79`
   - Try: `ssh -i ~/.ssh/nikolay -p 22022 root@72.61.208.79`

2. **Firewall rules**: Your IP might not be whitelisted
   - Contact server admin to check firewall rules

3. **SSH service down**: Service might need restart
   - Contact server admin

4. **Key permissions**: SSH key might have wrong permissions
   ```bash
   chmod 600 ~/.ssh/nikolay
   ```

5. **SSH config issue**: Try adding to `~/.ssh/config`:
   ```
   Host greenpay
       HostName 72.61.208.79
       User root
       IdentityFile ~/.ssh/nikolay
       Port 22
   ```
   Then connect with: `ssh greenpay`

### Debug SSH connection:
```bash
# Verbose mode to see what's happening
ssh -vvv -i ~/.ssh/nikolay root@72.61.208.79
```

## After Deployment

Regardless of method used, verify deployment:

1. **Check file structure on server:**
   ```
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
   ├── assets/           (80 files)
   ├── index.html
   └── backend/          (should remain untouched)
   ```

2. **Test in browser:**
   - Open: https://greenpay.eywademo.cloud
   - Should load without errors
   - Check console (F12) for errors

3. **Verify permissions:**
   ```bash
   # Files should be owned by: eywademo-greenpay:eywademo-greenpay
   # Assets folder: 755 (drwxr-xr-x)
   # index.html: 644 (-rw-r--r--)
   ```

## Need Help?

If none of these methods work:
1. Check with your hosting provider's support
2. Look for their file manager documentation
3. Ask server administrator to manually deploy the files

---

**Files ready for deployment:**
- Package: `greenpay-frontend-20251125-195934.tar.gz` (860KB)
- Source: `dist/` folder (80 files)
