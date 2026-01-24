# Quick Start Guide - New PC Setup

This guide helps you quickly resume the Claude Code session on a new computer.

## 1. Clone Repository (5 minutes)

```bash
# Clone the repository
git clone git@github.com:nnik2709/greenpay.git
cd greenpay

# Verify you're on main branch with latest code
git status
git log --oneline -5
```

Expected latest commit: `f9198d9` - Fix voucher download and remove PNG emblem

## 2. Install Dependencies (2-5 minutes)

```bash
npm install
```

## 3. Review Session Context (5 minutes)

Read these files in order:
1. `SESSION_CONTEXT_2026-01-10.md` - Full session details
2. `CLAUDE.md` - Project instructions for Claude Code
3. `README.md` - Project overview

## 4. Verify Code Changes

```bash
# View the latest changes
git show f9198d9

# Check modified files
git diff fa26907..f9198d9 --stat

# Key files to review:
# - src/pages/Invoices.jsx (voucher download fix)
# - backend/utils/pdfGenerator.js (PNG logo removal)
```

## 5. Start Development (Optional)

```bash
# Start dev server
npm run dev

# Or build for production
npm run build
```

---

## Current Status Summary

### ✅ Completed
- Fixed voucher download functionality (frontend)
- Removed PNG flag logo from voucher PDFs (backend)
- Centered CCDA logo in voucher templates
- All changes committed to GitHub

### ⚠️ Pending Deployment
Backend file needs manual upload to production:
- File: `backend/utils/pdfGenerator.js`
- Server: `165.22.52.100`
- Path: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js`

---

## Key Information

### Repository
- **GitHub:** https://github.com/nnik2709/greenpay
- **Branch:** main
- **Latest Commit:** f9198d9

### Production URLs
- **Frontend:** https://greenpay.eywademo.cloud
- **Test Page:** https://greenpay.eywademo.cloud/app/invoices

### Server Access
- **SSH:** root@165.22.52.100
- **CloudPanel:** File Manager for uploads
- **PM2 Apps:** greenpay-api (backend), png-green-fees (frontend)

---

## Next Actions (if deploying)

1. **Upload Backend File**
   - Use CloudPanel File Manager
   - Upload: `backend/utils/pdfGenerator.js`
   - To: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/`

2. **Restart Backend**
   ```bash
   ssh root@165.22.52.100
   pm2 restart greenpay-api
   pm2 logs greenpay-api --lines 20
   ```

3. **Test**
   - Go to https://greenpay.eywademo.cloud/app/invoices
   - Click "Download All Vouchers"
   - Verify PDF has centered CCDA logo only (no PNG flag)

---

## Troubleshooting

### If dependencies fail to install
```bash
rm -rf node_modules package-lock.json
npm install
```

### If git pull shows conflicts
```bash
git fetch origin
git reset --hard origin/main
```

### If you need to see session history
```bash
cat SESSION_CONTEXT_2026-01-10.md
```

---

## Contact

- **Session Date:** 2026-01-10
- **Last Activity:** Voucher download fix & PNG logo removal
- **Status:** Ready for deployment testing

See `SESSION_CONTEXT_2026-01-10.md` for complete details.
