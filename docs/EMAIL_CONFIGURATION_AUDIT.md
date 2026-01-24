# Email Configuration Audit - January 21, 2026

## Executive Summary

This document audits all email-related configurations in the GreenPay backend to ensure unified SMTP configuration and eliminate hardcoded email addresses. This is critical for user testing and production deployment.

---

## Audit Findings

### Files with Hardcoded Email Addresses

#### 1. backend/services/notificationService.js
**Issues Found:**
- Line 80, 439, 513, 637: Fallback email `noreply@greenpay.gov.pg`
- Lines 224, 248: Hardcoded support email `support@greenpay.gov.pg`
- Lines 397, 430: Hardcoded enquiries emails `enquiries@ccda.gov.pg` and `png.greenfees@ccda.gov.pg`

**Impact**: High - Main email service used throughout the application

#### 2. backend/utils/pdfGenerator.js
**Issues Found:**
- Lines 276, 732, 1047: Contact email `png.greenfees@ccda.gov.pg` in PDFs
- Lines 451, 853, 864: Enquiries email `enquiries.greenfees@ccda.gov.pg` in PDFs

**Impact**: High - Contact information embedded in all generated voucher PDFs

#### 3. backend/routes/vouchers.js
**Issues Found:**
- Line 812: `noreply@greenpay.eywademo.cloud` (test domain)
- Line 923: `noreply@greenpay.pg` (inconsistent domain)
- Line 1146: `noreply@greenpay.eywademo.cloud` (test domain)
- Lines 1232, 1383: `noreply@greenpay.gov.pg`

**Impact**: High - Voucher email notifications inconsistent

#### 4. backend/routes/buy-online.js
**Issues Found:**
- Line 834: Fallback email `noreply@greenpay.gov.pg`

**Impact**: Medium - Online purchase notifications

#### 5. backend/routes/invoices-gst.js
**Issues Found:**
- Lines 761, 1030: Fallback email `noreply@greenpay.gov.pg`

**Impact**: Medium - Invoice notifications

---

## Required Environment Variables

The following environment variables must be defined in the server's `.env` file:

```bash
# SMTP Configuration (Already exists)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PNG Green Fees" <noreply@greenpay.gov.pg>

# Contact Emails (NEW - Required)
SUPPORT_EMAIL=support@greenpay.gov.pg
ENQUIRIES_EMAIL=png.greenfees@ccda.gov.pg
CONTACT_EMAIL=png.greenfees@ccda.gov.pg
```

### Variable Descriptions

- **SMTP_FROM**: Sender email for all outgoing emails (noreply address)
- **SUPPORT_EMAIL**: Support contact email shown in emails and PDFs
- **ENQUIRIES_EMAIL**: Primary enquiries email for customer questions
- **CONTACT_EMAIL**: General contact email (may be same as enquiries)

---

## Fixes Applied

### 1. notificationService.js
**Changes:**
- Removed all fallback hardcoded emails from `from:` fields
- Replaced `support@greenpay.gov.pg` with `process.env.SUPPORT_EMAIL`
- Replaced `enquiries@ccda.gov.pg` with `process.env.ENQUIRIES_EMAIL`
- Replaced `png.greenfees@ccda.gov.pg` with `process.env.CONTACT_EMAIL`

### 2. pdfGenerator.js
**Changes:**
- Replaced all hardcoded emails with environment variables
- Used `process.env.CONTACT_EMAIL` for main contact
- Used `process.env.ENQUIRIES_EMAIL` for enquiries

### 3. vouchers.js
**Changes:**
- Removed all fallback emails (rely on SMTP_FROM only)
- Standardized all sender addresses to use `process.env.SMTP_FROM`

### 4. buy-online.js
**Changes:**
- Removed fallback email
- Uses only `process.env.SMTP_FROM`

### 5. invoices-gst.js
**Changes:**
- Replaced `process.env.SMTP_USER` with `process.env.SMTP_FROM`
- Removed fallback email

---

## Testing Checklist

After deployment, verify the following:

- [ ] All environment variables set in production `.env` file
- [ ] Individual purchase emails send successfully
- [ ] Corporate voucher emails send successfully
- [ ] Quotation emails send successfully
- [ ] Invoice emails send successfully
- [ ] PDF vouchers display correct contact emails
- [ ] Email templates use correct sender address
- [ ] Support contact email displays correctly in notifications
- [ ] No fallback emails are being used (check logs)

---

## Deployment Instructions

### Step 1: Update .env File on Server

SSH into the server and edit the `.env` file:

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
nano .env
```

Add these new lines (or update existing):
```bash
SUPPORT_EMAIL=support@greenpay.gov.pg
ENQUIRIES_EMAIL=png.greenfees@ccda.gov.pg
CONTACT_EMAIL=png.greenfees@ccda.gov.pg
```

Save and exit (Ctrl+X, Y, Enter).

### Step 2: Upload Modified Backend Files

Use CloudPanel File Manager to upload these files to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`:

- `services/notificationService.js`
- `utils/pdfGenerator.js`
- `routes/vouchers.js`
- `routes/buy-online.js`
- `routes/invoices-gst.js`

### Step 3: Restart Backend

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

### Step 4: Test Email Sending

Create a test transaction and verify:
1. Email sends successfully
2. Sender address is from SMTP_FROM
3. Contact emails in PDFs match environment variables
4. No errors in PM2 logs

---

## Production .env Template

Complete `.env` file for production:

```bash
# Database
DB_HOST=165.22.52.100
DB_PORT=5432
DB_NAME=greenpay
DB_USER=greenpay
DB_PASSWORD=GreenPay2025!Secure#PG

# JWT Authentication
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRY=24h

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PNG Green Fees" <noreply@greenpay.gov.pg>

# Contact Emails
SUPPORT_EMAIL=support@greenpay.gov.pg
ENQUIRIES_EMAIL=png.greenfees@ccda.gov.pg
CONTACT_EMAIL=png.greenfees@ccda.gov.pg

# BSP Payment Gateway
BSP_API_KEY=your-bsp-api-key
BSP_MERCHANT_ID=your-merchant-id
BSP_RETURN_URL=https://greenpay.eywademo.cloud/payment-success

# Application
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://greenpay.eywademo.cloud
```

---

## Risk Assessment

**Before Fix:**
- 🔴 **HIGH RISK**: Multiple inconsistent email addresses (3 different domains)
- 🔴 **HIGH RISK**: Test domain emails in production code
- 🟡 **MEDIUM RISK**: Cannot change emails without code deployment

**After Fix:**
- 🟢 **LOW RISK**: Single source of truth (.env file)
- 🟢 **LOW RISK**: Consistent email addresses across all features
- 🟢 **LOW RISK**: Can update emails without touching code

---

## Summary

**Total Files Modified**: 5
**Total Hardcoded Emails Removed**: 19 instances
**Environment Variables Added**: 3 (SUPPORT_EMAIL, ENQUIRIES_EMAIL, CONTACT_EMAIL)
**Testing Required**: All email sending features
**Deployment Time**: ~5 minutes

**Status**: ✅ Ready for deployment

---

**Prepared by**: Claude Code
**Date**: January 21, 2026
**Purpose**: User Testing Preparation - Email Configuration Standardization
