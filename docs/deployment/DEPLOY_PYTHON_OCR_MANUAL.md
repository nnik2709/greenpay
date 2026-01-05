# Manual Deployment Commands for Python OCR Service

## Overview

This document contains **exact commands** to run in your SSH terminal to deploy the Python OCR service.

**You will:**
1. Upload files via CloudPanel File Manager
2. Run these commands in your SSH terminal
3. Verify everything works

---

## Part 1: Upload Files via CloudPanel

**Using CloudPanel File Manager:**

1. Navigate to: `/var/www/greenpay/`
2. Create new folder: `python-ocr-service`
3. Upload the entire `python-ocr-service` folder from your local machine:
   ```
   /Users/nikolay/github/greenpay/python-ocr-service/
   ```

4. Verify upload by running this in SSH:
   ```bash
   ls -la /var/www/greenpay/python-ocr-service/
   ```

Expected output should show:
```
app/
requirements.txt
ecosystem.config.js
README.md
DEPLOYMENT.md
.env.example
.gitignore
```

---

## Part 2: Run These Commands in SSH Terminal

### Command Block 1: Check Prerequisites

```bash
# Check Python version (need ≥3.8)
python3 --version

# Check port 5000 is available
lsof -i :5000

# Check disk space
df -h /

# Check current directory
pwd
```

**Expected:**
- Python: 3.8 or higher
- Port 5000: Should return nothing (port available)
- Disk: Should show 375GB free
- PWD: Doesn't matter, we'll cd in next step

---

### Command Block 2: Create Virtual Environment

Copy and paste this entire block:

```bash
# Navigate to project directory
cd /var/www/greenpay/python-ocr-service

# Create virtual environment
python3 -m venv venv

# Verify venv created
ls -la venv/

# Should show: bin/ include/ lib/ pyvenv.cfg
```

---

### Command Block 3: Install Dependencies

Copy and paste this entire block:

```bash
# Activate virtual environment
source venv/bin/activate

# You should see (venv) prefix in your terminal prompt

# Upgrade pip
pip install --upgrade pip

# Install dependencies (this takes 5-10 minutes and downloads ~200MB)
pip install -r requirements.txt

# This will download PaddleOCR models - be patient!
# You'll see lots of output - that's normal
```

**Expected output (at the end):**
```
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 paddleocr-2.7.3 ...
```

**Verify installation:**
```bash
pip list | grep -E "fastapi|paddleocr|fastmrz|uvicorn"
```

Should show all 4 packages installed.

---

### Command Block 4: Test Service Manually (Before PM2)

```bash
# Still in virtual environment (you should see (venv) prefix)

# Start service manually
venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup
INFO:     Pre-loading PaddleOCR models...
INFO:     PaddleOCR models loaded successfully
INFO:     MRZ parser initialized successfully
INFO:     GreenPay MRZ OCR started successfully
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:5000
```

**✅ If you see this, the service works!**

**Leave this terminal running and open a NEW SSH session for the next test.**

---

### Command Block 5: Test Health Endpoint (In NEW SSH Session)

Open a second SSH terminal and run:

```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}
```

✅ **If you get this response, everything is working!**

**Now go back to the FIRST terminal and stop the test server:**
- Press `Ctrl+C` to stop uvicorn

---

### Command Block 6: Configure and Start with PM2

In your first terminal (where you stopped uvicorn):

```bash
# Deactivate virtual environment first
deactivate

# You should no longer see (venv) prefix

# Verify you're in the right directory
pwd
# Should show: /var/www/greenpay/python-ocr-service

# Update ecosystem.config.js path (in case it's different)
nano ecosystem.config.js

# Find this line:
#   cwd: '/var/www/greenpay/python-ocr-service',
# Make sure it matches your actual path
# Press Ctrl+X to exit (Y to save if you changed anything)

# Start with PM2
pm2 start ecosystem.config.js
```

**Expected output:**
```
[PM2] Process successfully started
┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
├─────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ 250.0mb  │
└─────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

---

### Command Block 7: Verify PM2 Service

```bash
# Check PM2 status
pm2 list
```

**Expected: Should show BOTH processes:**
```
┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
├─────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0   │ greenpay-api │ fork     │ 15   │ online    │ 0%       │ 106.0mb  │
│ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ 250.0mb  │
└─────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

```bash
# Check logs (should see startup messages)
pm2 logs greenpay-ocr --lines 20
```

**Expected log output:**
```
[2025-XX-XX XX:XX:XX] INFO - Starting GreenPay MRZ OCR v1.0.0
[2025-XX-XX XX:XX:XX] INFO - Listening on 127.0.0.1:5000
[2025-XX-XX XX:XX:XX] INFO - Pre-loading PaddleOCR models...
[2025-XX-XX XX:XX:XX] INFO - PaddleOCR models loaded successfully
[2025-XX-XX XX:XX:XX] INFO - MRZ parser initialized successfully
[2025-XX-XX XX:XX:XX] INFO - GreenPay MRZ OCR started successfully
```

---

### Command Block 8: Final Verification

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}

# Save PM2 configuration (survives reboots)
pm2 save

# Set up PM2 auto-start on server reboot
pm2 startup
```

**Important:** The `pm2 startup` command will output another command. **Copy and run that command** exactly as shown.

Example:
```bash
# PM2 will say something like:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Copy that entire line and run it
```

---

## Part 3: Monitoring (First 24 Hours)

### Watch Logs in Real-Time

```bash
# Watch both services
pm2 logs

# Or just OCR service
pm2 logs greenpay-ocr --lines 0
```

Press `Ctrl+C` to stop watching.

### Check for Errors

```bash
# Check error logs
pm2 logs greenpay-ocr --err --lines 50

# Check memory usage
pm2 monit
```

Press `Ctrl+C` to exit monit.

### Overall Server Health

```bash
# Memory
free -h

# Disk
df -h /

# CPU load
top
# Press 'q' to quit
```

---

## Troubleshooting Commands

### If Service Won't Start

```bash
# Check what's wrong
pm2 logs greenpay-ocr --err --lines 50

# Restart it
pm2 restart greenpay-ocr

# Check status
pm2 list
```

### If Port 5000 is Already in Use

```bash
# Find what's using it
lsof -i :5000

# Kill that process
kill -9 <PID>

# Or change port in ecosystem.config.js
nano ecosystem.config.js
# Change: --port 5001
pm2 restart greenpay-ocr
```

### If Dependencies Won't Install

```bash
cd /var/www/greenpay/python-ocr-service
source venv/bin/activate

# Try installing packages one by one
pip install fastapi==0.109.0
pip install uvicorn==0.27.0
pip install paddleocr==2.7.3
pip install paddlepaddle==2.6.0
pip install fastmrz==1.1.1
pip install opencv-python-headless==4.9.0.80
pip install Pillow==10.2.0
pip install python-multipart==0.0.6
pip install pydantic==2.5.3
pip install python-dotenv==1.0.0
```

---

## Quick Reference - Common Commands

```bash
# Start service
pm2 start greenpay-ocr

# Stop service
pm2 stop greenpay-ocr

# Restart service
pm2 restart greenpay-ocr

# View logs
pm2 logs greenpay-ocr

# View errors only
pm2 logs greenpay-ocr --err

# Check status
pm2 list

# Monitor resources
pm2 monit

# Remove from PM2 (if rolling back)
pm2 delete greenpay-ocr
pm2 save
```

---

## Rollback Commands (If Needed)

If something goes wrong and you need to remove Python service:

```bash
# Stop and remove from PM2
pm2 stop greenpay-ocr
pm2 delete greenpay-ocr
pm2 save

# Remove directory
cd /var/www/greenpay
rm -rf python-ocr-service

# Done - back to original state
# Node.js backend will use Tesseract.js fallback
```

---

## Success Checklist

After running all commands, verify:

- [ ] `pm2 list` shows `greenpay-ocr` with status `online`
- [ ] `curl http://localhost:5000/health` returns JSON response
- [ ] `pm2 logs greenpay-ocr --lines 20` shows no errors
- [ ] `free -h` shows memory usage is reasonable (~400MB for OCR service)
- [ ] `pm2 save` completed successfully
- [ ] `pm2 startup` command was run (for auto-start on reboot)

✅ **If all checked, deployment is complete!**

---

## What's Next?

After successful deployment:

1. **Phase 2:** Integrate with Node.js backend
   - Create `/api/ocr/scan-mrz` endpoint in Express
   - Proxy requests from Node.js to Python service

2. **Phase 3:** Update frontend
   - Modify SimpleCameraScanner to call new endpoint
   - Keep Tesseract.js as fallback

3. **Testing:**
   - Test with real PNG passport images
   - Measure accuracy vs old method
   - Monitor performance

---

## Support

**If you encounter issues during deployment:**

1. Check logs: `pm2 logs greenpay-ocr --err --lines 50`
2. Verify Python version: `python3 --version` (need ≥3.8)
3. Check disk space: `df -h /` (need ~1GB free)
4. Verify port available: `lsof -i :5000` (should be empty)

**Send me:**
- Output of failed command
- Relevant error logs
- `pm2 list` output

And I'll help troubleshoot!

---

**Ready to deploy? Start with Part 1 (uploading files via CloudPanel)!** 🚀
