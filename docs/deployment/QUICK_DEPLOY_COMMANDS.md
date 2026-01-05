# Quick Deploy Commands - Python OCR Service

## Correct Path for Your Server

**Upload Location:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service`

**Final Structure:**
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
├── backend/                    # Your existing Node.js backend
├── python-ocr-service/         # NEW: Python OCR microservice
└── (frontend files)
```

---

## Step 1: Upload via CloudPanel

1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
3. Create folder: `python-ocr-service`
4. Upload entire `python-ocr-service` folder from:
   `/Users/nikolay/github/greenpay/python-ocr-service/`

---

## Step 2: Run These Commands in SSH

### Verify Upload

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service
ls -la

# Should show:
# app/
# requirements.txt
# ecosystem.config.js
# README.md
# etc.
```

### Check Prerequisites

```bash
# Python version (need ≥3.8)
python3 --version

# Port 5000 available
lsof -i :5000

# Should return nothing (port is free)
```

### Create Virtual Environment

```bash
# Make sure you're in the right directory
pwd
# Should show: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service

# Create venv
python3 -m venv venv

# Verify
ls -la venv/
```

### Install Dependencies (5-10 minutes)

```bash
# Activate venv
source venv/bin/activate

# You should see (venv) in prompt

# Upgrade pip
pip install --upgrade pip

# Install dependencies (downloads ~200MB, be patient)
pip install -r requirements.txt

# Verify installation
pip list | grep -E "fastapi|paddleocr|fastmrz|uvicorn"
```

### Test Manually (Before PM2)

```bash
# Start service manually
venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000

# Wait for:
# INFO: GreenPay MRZ OCR started successfully
```

**In a NEW SSH session:**

```bash
curl http://localhost:5000/health

# Expected:
# {"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}
```

**Back in first terminal, stop test:**
- Press `Ctrl+C`

### Start with PM2

```bash
# Deactivate venv
deactivate

# Verify correct path in config
cat ecosystem.config.js | grep cwd
# Should show: cwd: '/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service'

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 list

# Should show both:
# greenpay-api (your existing backend)
# greenpay-ocr (new Python service)
```

### Verify Running

```bash
# Check logs
pm2 logs greenpay-ocr --lines 20

# Test health
curl http://localhost:5000/health

# Save PM2 config
pm2 save

# Enable auto-start on reboot
pm2 startup
# Copy and run the command it shows
```

---

## Step 3: Verify Success

```bash
# Both services running
pm2 list

# Expected:
# ┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id  │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├─────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0   │ greenpay-api │ fork     │ 15   │ online    │ 0%       │ 106.0mb  │
# │ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ 250.0mb  │
# └─────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

# Check overall resources
free -h
df -h /

# Monitor logs (Ctrl+C to stop)
pm2 logs greenpay-ocr --lines 0
```

---

## Troubleshooting

### Port 5000 in use

```bash
lsof -i :5000
kill -9 <PID>
pm2 restart greenpay-ocr
```

### Dependencies won't install

```bash
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install fastapi uvicorn paddleocr paddlepaddle fastmrz opencv-python-headless Pillow python-multipart pydantic python-dotenv
```

### Service won't start

```bash
pm2 logs greenpay-ocr --err --lines 50
# Check error and fix
pm2 restart greenpay-ocr
```

---

## Rollback (if needed)

```bash
pm2 stop greenpay-ocr
pm2 delete greenpay-ocr
pm2 save
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
rm -rf python-ocr-service
```

---

## Success Checklist

- [x] Files uploaded to correct path
- [x] `python3 --version` shows ≥3.8
- [x] Virtual environment created
- [x] Dependencies installed successfully
- [x] Manual test returned `{"status":"healthy"}`
- [x] PM2 shows `greenpay-ocr` with status `online`
- [x] `curl http://localhost:5000/health` works
- [x] No errors in logs
- [x] PM2 config saved
- [x] PM2 startup configured

**Deployment Complete!** 🎉

Next: Monitor for 24 hours, then proceed to Phase 2 (Node.js integration).
