# GreenPay MRZ OCR Service - Deployment Guide

## Server Requirements

**✅ Your Server Status (from resource check):**
- RAM: 31GB (need ~400MB) ✅
- Disk: 375GB free (need ~600MB) ✅
- CPU: 8 cores (need 1-2 cores) ✅
- Current PM2: greenpay-api using 106MB ✅

**Conclusion: ZERO concerns - server is more than ready!**

---

## Pre-Deployment Checklist

Run these commands on the server first:

```bash
# 1. Check Python version (need ≥3.8)
python3 --version

# If < 3.8, install Python 3.10
sudo apt update
sudo apt install -y python3.10 python3.10-venv python3-pip

# 2. Check port 5000 is available
sudo lsof -i :5000

# If port in use, modify ecosystem.config.js to use different port (5001, 5002, etc.)

# 3. Verify internet connectivity (needed for model download)
ping -c 3 google.com
```

---

## Deployment Steps

### Step 1: Upload Python Service Files

**Manual Upload via CloudPanel File Manager:**

1. Navigate to: `/var/www/greenpay/`

2. Create directory: `python-ocr-service`

3. Upload these files from local machine:
   ```
   /Users/nikolay/github/greenpay/python-ocr-service/
   ├── app/
   │   ├── __init__.py
   │   ├── config.py
   │   ├── main.py
   │   ├── ocr_engine.py
   │   └── mrz_parser.py
   ├── requirements.txt
   ├── ecosystem.config.js
   ├── .env.example
   ├── .gitignore
   └── README.md
   ```

4. Verify upload:
   ```bash
   ssh root@165.22.52.100
   ls -la /var/www/greenpay/python-ocr-service/
   ```

---

### Step 2: Create Python Virtual Environment

**On server (via SSH terminal):**

```bash
# Navigate to project directory
cd /var/www/greenpay/python-ocr-service

# Create virtual environment
python3 -m venv venv

# Verify venv created
ls -la venv/
```

---

### Step 3: Install Python Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies (this will take 5-10 minutes)
pip install -r requirements.txt

# IMPORTANT: First install will download ~200MB of PaddleOCR models
# This is normal and only happens once
```

**Expected output:**
```
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 paddleocr-2.7.3 ...
Downloading PaddleOCR models... (this may take a few minutes)
```

**Verify installation:**
```bash
pip list | grep -E "fastapi|paddleocr|fastmrz|uvicorn"
```

Should show:
```
fastapi               0.109.0
fastmrz               1.1.1
paddleocr             2.7.3
paddlepaddle          2.6.0
uvicorn               0.27.0
```

---

### Step 4: Configure Environment (Optional)

```bash
# Copy example env file
cp .env.example .env

# Edit if needed (defaults are good for your server)
nano .env
```

**Default configuration is optimized for your 8-core, 31GB server:**
- 4 workers (can handle 4 simultaneous scans)
- 127.0.0.1 binding (localhost only, secure)
- 1GB memory limit (plenty of headroom)

---

### Step 5: Test Service Locally (Before PM2)

```bash
# Still in virtual environment
# Start service manually to test
venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000

# Should see:
# INFO:     Started server process
# INFO:     Waiting for application startup
# INFO:     Pre-loading PaddleOCR models...
# INFO:     PaddleOCR models loaded successfully
# INFO:     Application startup complete
```

**In another SSH session, test health endpoint:**
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}
```

✅ **If health check works, proceed to PM2 setup.**

🔴 **If health check fails:**
- Check logs for errors
- Verify port 5000 not in use
- Ensure all dependencies installed

**Stop test server:**
```bash
# Press Ctrl+C in the uvicorn terminal
```

---

### Step 6: Configure PM2

**Update ecosystem.config.js path (if different):**

```bash
nano ecosystem.config.js
```

Verify `cwd` matches your actual path:
```javascript
cwd: '/var/www/greenpay/python-ocr-service',  // Update if different
```

**Start service with PM2:**

```bash
# Deactivate venv first
deactivate

# Start with PM2
pm2 start ecosystem.config.js

# Should see:
# [PM2] Process successfully started
# ┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┐
# │ id  │ name         │ mode     │ ↺    │ status    │ cpu      │
# ├─────┼──────────────┼──────────┼──────┼───────────┼──────────┤
# │ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │
# └─────┴──────────────┴──────────┴──────┴───────────┴──────────┘
```

**Save PM2 configuration:**
```bash
pm2 save
```

**Enable PM2 startup (auto-start on reboot):**
```bash
pm2 startup
# Follow the command it provides (usually adds to systemd)
```

---

### Step 7: Verify Service is Running

```bash
# Check PM2 status
pm2 list

# Should show both processes:
# ┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id  │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├─────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0   │ greenpay-api │ fork     │ 15   │ online    │ 0%       │ 106.0mb  │
# │ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ 250.0mb  │
# └─────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

# Check logs (should see startup messages)
pm2 logs greenpay-ocr --lines 20

# Should show:
# [2025-01-XX XX:XX:XX] INFO - Starting GreenPay MRZ OCR v1.0.0
# [2025-01-XX XX:XX:XX] INFO - Pre-loading PaddleOCR models...
# [2025-01-XX XX:XX:XX] INFO - PaddleOCR models loaded successfully
# [2025-01-XX XX:XX:XX] INFO - GreenPay MRZ OCR started successfully
```

**Test health endpoint:**
```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}
```

✅ **Service is running!**

---

### Step 8: Test with Sample Passport Image (Optional)

If you have a test passport image on the server:

```bash
curl -X POST http://localhost:5000/scan-mrz \
  -F "file=@/path/to/test-passport.jpg"
```

**Expected response:**
```json
{
  "success": true,
  "passportNumber": "N1234567",
  "surname": "SMITH",
  "givenName": "JOHN ROBERT",
  "nationality": "USA",
  "dateOfBirth": "1985-03-15",
  "sex": "M",
  "dateOfExpiry": "2030-12-31",
  "issuingCountry": "USA",
  "confidence": 0.98,
  "validCheckDigits": true,
  "processingTime": 0.52
}
```

---

## Post-Deployment Monitoring

### Monitor Logs (First 24 Hours)

```bash
# Watch logs in real-time
pm2 logs greenpay-ocr --lines 0

# Check for errors
pm2 logs greenpay-ocr --err --lines 100

# Monitor resource usage
pm2 monit
```

### Check Memory Usage

```bash
# Overall server memory
free -h

# PM2 process memory
pm2 list

# If greenpay-ocr exceeds 800MB consistently, something's wrong
# (Normal: 200-400MB depending on load)
```

### Check Disk Space

```bash
# Overall disk
df -h /

# OCR service logs
du -sh /var/log/greenpay-ocr-*

# If logs exceed 100MB, set up log rotation:
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting

### Problem: Service won't start

**Check logs:**
```bash
pm2 logs greenpay-ocr --err --lines 50
```

**Common issues:**

1. **Port 5000 in use:**
   ```bash
   sudo lsof -i :5000
   # Kill process or change port in ecosystem.config.js
   ```

2. **Python version too old:**
   ```bash
   python3 --version
   # Install Python 3.10+ if < 3.8
   ```

3. **Missing dependencies:**
   ```bash
   cd /var/www/greenpay/python-ocr-service
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### Problem: Service crashes frequently

**Check PM2 restart count:**
```bash
pm2 list
# Look at ↺ column - if > 10, there's a problem
```

**View crash logs:**
```bash
pm2 logs greenpay-ocr --err --lines 100
```

**Common causes:**
- Memory leak (restart threshold too high)
- Bad images causing crashes
- Dependency version mismatch

**Quick fix:**
```bash
pm2 restart greenpay-ocr
pm2 logs greenpay-ocr --lines 50
```

### Problem: High memory usage (>1GB)

**Restart service:**
```bash
pm2 restart greenpay-ocr
```

**Lower worker count:**
```bash
nano ecosystem.config.js
# Change: args: '... --workers 2'  (from 4 to 2)
pm2 restart greenpay-ocr
```

### Problem: Slow response times (>2 seconds)

**Check worker count:**
```bash
# Increase workers if CPU usage low
nano ecosystem.config.js
# Change: args: '... --workers 6'  (from 4 to 6)
pm2 restart greenpay-ocr
```

**Check if GPU can help:**
```bash
# If server has GPU:
pip install paddlepaddle-gpu
nano .env
# Set: OCR_USE_GPU=true
pm2 restart greenpay-ocr
```

---

## Updating the Service

### Code Changes (Future Updates)

```bash
# 1. Upload new files via CloudPanel
# 2. SSH to server
cd /var/www/greenpay/python-ocr-service

# 3. Update dependencies (if requirements.txt changed)
source venv/bin/activate
pip install -r requirements.txt
deactivate

# 4. Restart service
pm2 restart greenpay-ocr

# 5. Verify
pm2 logs greenpay-ocr --lines 20
curl http://localhost:5000/health
```

### Dependency Updates (Security Patches)

```bash
cd /var/www/greenpay/python-ocr-service
source venv/bin/activate

# Check for outdated packages
pip list --outdated

# Update specific package
pip install --upgrade paddleocr

# Or update all
pip install --upgrade -r requirements.txt

deactivate
pm2 restart greenpay-ocr
```

---

## Rollback Plan

### If Python Service Causes Problems

**Immediate rollback (stop Python service):**
```bash
pm2 stop greenpay-ocr
```

Frontend will automatically use Tesseract.js fallback (if implemented).

**Complete removal:**
```bash
pm2 delete greenpay-ocr
pm2 save
rm -rf /var/www/greenpay/python-ocr-service
```

**No data loss** - OCR service is stateless, all data in PostgreSQL remains intact.

---

## Performance Benchmarks (Your Server)

**Expected Performance:**
- Cold start (first request): 2-3 seconds (model loading)
- Warm requests: 100-300ms per scan
- Concurrent capacity: 4 simultaneous scans (4 workers)
- Throughput: ~40-80 scans/second (theoretical max)

**Memory Usage:**
- Baseline (idle): ~250MB
- Per scan peak: +50-100MB (temporary)
- 4 workers under load: ~400-500MB total

**CPU Usage:**
- Idle: 0-1%
- Per scan: 50-100% of 1 core for 0.2-0.5 seconds
- Your 8 cores can easily handle this

---

## Security Notes

**Service Security:**
- ✅ Binds to 127.0.0.1 only (not accessible from internet)
- ✅ Rate limiting enabled (60 req/min per IP)
- ✅ File size validation (10MB max)
- ✅ No persistent storage (images processed in-memory only)
- ✅ No database access (stateless service)

**Network Security:**
- Only accessible from Node.js backend (localhost)
- Not exposed to internet (Nginx doesn't proxy to port 5000)
- All external traffic goes through Node.js API

**If you want public access (NOT recommended):**
1. Add Nginx proxy configuration
2. Enable CORS in .env
3. Add authentication (API keys)

---

## Next Steps After Deployment

1. **Phase 2:** Integrate with Node.js backend
   - Create `/api/ocr/scan-mrz` route in Express
   - Proxy requests to Python service

2. **Phase 3:** Update frontend
   - Modify SimpleCameraScanner to call new endpoint
   - Keep Tesseract.js as fallback

3. **Phase 4:** Testing
   - Test with real PNG passports
   - Measure accuracy improvement
   - Monitor performance

See main project README for integration guide.

---

## Support

**Logs location:**
- Stdout: `/var/log/greenpay-ocr-out.log`
- Stderr: `/var/log/greenpay-ocr-error.log`
- PM2 logs: `pm2 logs greenpay-ocr`

**Common PM2 commands:**
```bash
pm2 list                      # Show all processes
pm2 logs greenpay-ocr         # View logs
pm2 monit                     # Resource monitor
pm2 restart greenpay-ocr      # Restart service
pm2 stop greenpay-ocr         # Stop service
pm2 start greenpay-ocr        # Start service
pm2 delete greenpay-ocr       # Remove from PM2
pm2 describe greenpay-ocr     # Detailed info
```

---

**Deployment Complete!** 🎉

Python OCR service is now running alongside your Node.js backend. Both services are managed by PM2 and will auto-restart on server reboot.
