# Phase 1 Deployment Checklist - Python OCR Service

## ✅ Pre-Deployment Verification

All files created and ready to upload:

### Python Application Files
- [x] `app/__init__.py` - Package initialization (128 bytes)
- [x] `app/config.py` - Configuration settings (1.3 KB)
- [x] `app/main.py` - FastAPI application (10.4 KB)
- [x] `app/ocr_engine.py` - PaddleOCR wrapper (6.7 KB)
- [x] `app/mrz_parser.py` - FastMRZ parser (9.0 KB)

### Configuration Files
- [x] `requirements.txt` - Python dependencies (486 bytes)
- [x] `ecosystem.config.js` - PM2 configuration (2.0 KB)
- [x] `.env.example` - Environment template (741 bytes)
- [x] `.gitignore` - Git ignore rules (530 bytes)

### Documentation Files
- [x] `README.md` - Service overview (4.5 KB)
- [x] `DEPLOYMENT.md` - Deployment guide (13.1 KB)

### Project Documentation
- [x] `DEPLOY_PYTHON_OCR_MANUAL.md` - Step-by-step commands
- [x] `PYTHON_SERVICE_IMPACT_ANALYSIS.md` - Impact assessment
- [x] `MRZ_OCR_SOLUTION_COMPARISON.md` - Solution comparison
- [x] `PYTHON_OCR_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- [x] This checklist

**Total Files:** 15 files ready for deployment

---

## 📋 Deployment Steps Checklist

### Part 1: Upload Files (CloudPanel)

- [ ] Open CloudPanel File Manager
- [ ] Navigate to `/var/www/greenpay/`
- [ ] Create new folder: `python-ocr-service`
- [ ] Upload entire `python-ocr-service` folder from:
      `/Users/nikolay/github/greenpay/python-ocr-service/`
- [ ] Verify upload via SSH: `ls -la /var/www/greenpay/python-ocr-service/`
- [ ] Confirm all 9 files/folders present

### Part 2: Server Preparation (SSH)

- [ ] Run: `python3 --version` (need ≥3.8)
- [ ] Run: `lsof -i :5000` (port should be free)
- [ ] Run: `df -h /` (confirm 375GB free space)
- [ ] Run: `free -h` (confirm 28GB available RAM)

### Part 3: Virtual Environment Setup

- [ ] Run: `cd /var/www/greenpay/python-ocr-service`
- [ ] Run: `python3 -m venv venv`
- [ ] Run: `ls -la venv/` (verify created)

### Part 4: Install Dependencies

- [ ] Run: `source venv/bin/activate`
- [ ] Verify: Terminal shows `(venv)` prefix
- [ ] Run: `pip install --upgrade pip`
- [ ] Run: `pip install -r requirements.txt`
- [ ] Wait: ~5-10 minutes (downloads 200MB)
- [ ] Verify: `pip list | grep -E "fastapi|paddleocr|fastmrz|uvicorn"`

### Part 5: Manual Test (Before PM2)

- [ ] Run: `venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000`
- [ ] Wait for: "GreenPay MRZ OCR started successfully"
- [ ] In NEW terminal: `curl http://localhost:5000/health`
- [ ] Verify: JSON response with `"status":"healthy"`
- [ ] Stop test: Press `Ctrl+C` in uvicorn terminal

### Part 6: PM2 Configuration

- [ ] Run: `deactivate` (exit venv)
- [ ] Verify: No `(venv)` prefix
- [ ] Run: `nano ecosystem.config.js`
- [ ] Confirm: `cwd: '/var/www/greenpay/python-ocr-service'`
- [ ] Exit: `Ctrl+X` (no changes needed if path correct)

### Part 7: Start with PM2

- [ ] Run: `pm2 start ecosystem.config.js`
- [ ] Verify: Output shows `greenpay-ocr` with status `online`
- [ ] Run: `pm2 list`
- [ ] Confirm: Both `greenpay-api` and `greenpay-ocr` showing `online`

### Part 8: Verify Service

- [ ] Run: `pm2 logs greenpay-ocr --lines 20`
- [ ] Verify: Logs show "GreenPay MRZ OCR started successfully"
- [ ] Run: `curl http://localhost:5000/health`
- [ ] Verify: Returns `{"status":"healthy",...}`

### Part 9: Save PM2 Configuration

- [ ] Run: `pm2 save`
- [ ] Run: `pm2 startup`
- [ ] Copy and run: The command PM2 outputs (for auto-start on reboot)

### Part 10: Monitor (24 Hours)

- [ ] Run: `pm2 logs greenpay-ocr --lines 0` (watch logs)
- [ ] Check: No errors appear
- [ ] Run: `pm2 monit` (check resources)
- [ ] Verify: Memory ~250-400MB (normal)
- [ ] Run: `free -h` (check overall server)

---

## ✅ Success Criteria

Deployment is successful if:

- [x] `pm2 list` shows `greenpay-ocr` status = `online`
- [x] `curl http://localhost:5000/health` returns JSON
- [x] `pm2 logs greenpay-ocr` shows no ERROR messages
- [x] Memory usage < 500MB
- [x] Service auto-starts after `pm2 startup` configured
- [x] No restarts in first 24 hours (↺ column stays 0)

---

## ⚠️ Troubleshooting Quick Reference

### Issue: Port 5000 already in use

```bash
lsof -i :5000
kill -9 <PID>
# Or change port in ecosystem.config.js
```

### Issue: Dependencies won't install

```bash
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt --verbose
```

### Issue: Service won't start

```bash
pm2 logs greenpay-ocr --err --lines 50
# Check error message and fix accordingly
```

### Issue: Service crashes repeatedly

```bash
pm2 restart greenpay-ocr
pm2 logs greenpay-ocr
# If still crashes, check Python version and dependencies
```

---

## 🔄 Rollback Procedure

If you need to remove Python service:

```bash
pm2 stop greenpay-ocr
pm2 delete greenpay-ocr
pm2 save
cd /var/www/greenpay
rm -rf python-ocr-service
```

**Time:** 30 seconds
**Impact:** Zero (Node.js backend unaffected)

---

## 📊 Expected Results

After successful deployment:

**PM2 Status:**
```
┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
├─────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0   │ greenpay-api │ fork     │ 15   │ online    │ 0%       │ 106.0mb  │
│ 1   │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ 250.0mb  │
└─────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Server Resources:**
```
RAM Usage:     ~400MB / 31GB  (1.3%)
Disk Usage:    ~600MB / 387GB (0.2%)
CPU Idle:      ~98% (both services very light)
```

**Health Check:**
```bash
$ curl http://localhost:5000/health
{"status":"healthy","service":"GreenPay MRZ OCR","version":"1.0.0"}
```

---

## 📅 Timeline

- **File Upload:** 5-10 minutes
- **Dependency Install:** 5-10 minutes (PaddleOCR model download)
- **Testing & Verification:** 10-15 minutes
- **Total:** ~30 minutes

---

## 🎯 Next Steps After Deployment

Once Phase 1 is complete:

1. **Monitor for 24-48 hours**
   - Check logs daily: `pm2 logs greenpay-ocr --err`
   - Monitor resources: `pm2 monit`
   - Verify no crashes: `pm2 list` (↺ should stay 0)

2. **Phase 2: Node.js Integration**
   - Create `backend/routes/ocr.js`
   - Add `/api/ocr/scan-mrz` endpoint
   - Proxy to Python service
   - Test integration

3. **Phase 3: Frontend Integration**
   - Update `SimpleCameraScanner.jsx`
   - Call new backend endpoint
   - Keep Tesseract.js fallback

4. **Phase 4: Testing**
   - Test with real PNG passports
   - Measure accuracy vs old method
   - Production deployment

---

## 📝 Deployment Notes

**Date Deployed:** _____________

**Deployed By:** _____________

**Server:** root@165.22.52.100

**Service Path:** `/var/www/greenpay/python-ocr-service`

**PM2 Name:** `greenpay-ocr`

**Port:** 5000 (localhost only)

**Workers:** 4

**Memory Limit:** 1GB

**Issues Encountered:**
_____________________________________________
_____________________________________________

**Resolution:**
_____________________________________________
_____________________________________________

**Final Status:** ☐ Success  ☐ Failed  ☐ Partial

---

## 🎉 Deployment Complete!

Once all checkboxes are ✅ and success criteria met:

**Phase 1 Status:** COMPLETE ✅

**Ready for Phase 2:** YES ✅

**Service Running:** YES ✅

**Documentation:** [Link to this checklist]

**Next Action:** Monitor for 24-48 hours, then proceed to Node.js integration.

---

**Questions? Check `DEPLOYMENT.md` or `DEPLOY_PYTHON_OCR_MANUAL.md` for detailed troubleshooting.**
