# Production Domain Migration Plan
## From greenpay.eywademo.cloud → pnggreenfees.gov.pg

**Date:** 2026-01-01  
**Current Domain:** greenpay.eywademo.cloud  
**Production Domain:** pnggreenfees.gov.pg  

---

## 1. Required Code Changes

### Backend Environment Variables (Critical)

**File:** Backend `.env` file on production server

**Current Configuration:**
```bash
# Current staging
FRONTEND_URL=https://greenpay.eywademo.cloud
BACKEND_URL=https://greenpay.eywademo.cloud/api
```

**Production Configuration:**
```bash
# Production domain
FRONTEND_URL=https://pnggreenfees.gov.pg
BACKEND_URL=https://pnggreenfees.gov.pg/api

# BSP DOKU Production Settings
BSP_DOKU_MALL_ID=<production_mall_id_from_bsp>
BSP_DOKU_SHARED_KEY=<production_shared_key_from_bsp>
BSP_DOKU_MODE=production

# Production SMTP (see SMTP section below)
SMTP_HOST=smtp.sendgrid.net  # or other provider
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid_api_key>
SMTP_FROM=noreply@pnggreenfees.gov.pg
```

**Location on Server:**
```bash
# Backend .env file
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

### Frontend Environment Variables

**File:** Frontend `.env` file (if exists)

**Current:**
```bash
VITE_API_URL=https://greenpay.eywademo.cloud/api
```

**Production:**
```bash
VITE_API_URL=https://pnggreenfees.gov.pg/api
```

**Note:** If using relative URLs (like `/api/...`), no frontend changes needed.

### CORS Configuration

**File:** `backend/server.js`

**Location:** Line ~20-30 (CORS configuration)

**Current Code:**
```javascript
const corsOptions = {
  origin: [
    'https://greenpay.eywademo.cloud',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
};
```

**Production Code:**
```javascript
const corsOptions = {
  origin: [
    'https://pnggreenfees.gov.pg',           // Production domain
    'https://www.pnggreenfees.gov.pg',       // With www
    'https://greenpay.eywademo.cloud',       // Keep staging for testing
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
  ].filter(Boolean),
  credentials: true
};
```

**Why Keep Staging:** Allows testing on staging domain before switching DNS

---

## 2. BSP DOKU Configuration Changes

### Webhook URLs - CRITICAL

**Current Webhook URLs (Staging):**
```
Notify: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
Redirect: https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect
```

**Production Webhook URLs:**
```
Notify: https://pnggreenfees.gov.pg/api/payment/webhook/doku/notify
Redirect: https://pnggreenfees.gov.pg/api/payment/webhook/doku/redirect
```

### BSP Portal Configuration Required

**IMPORTANT:** You must configure these in BSP DOKU merchant portal:

1. **Login to BSP DOKU Merchant Portal**
2. **Navigate to:** Settings → Webhook Configuration
3. **Update Webhook URLs:**
   - Payment Notify URL: `https://pnggreenfees.gov.pg/api/payment/webhook/doku/notify`
   - Payment Redirect URL: `https://pnggreenfees.gov.pg/api/payment/webhook/doku/redirect`
4. **Save Changes**

**CRITICAL:** BSP must whitelist new domain before testing

### Can You Test BSP Production on Staging Domain?

**Short Answer:** Yes, but with BSP coordination

**Requirements:**
1. **BSP configures webhook URLs for staging domain:**
   ```
   https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
   ```
2. **Use production credentials on staging:**
   ```bash
   BSP_DOKU_MALL_ID=<production_mall_id>
   BSP_DOKU_SHARED_KEY=<production_shared_key>
   BSP_DOKU_MODE=production
   ```
3. **Update webhook URLs in BSP portal to staging domain**
4. **Test production payments on staging**
5. **Once confirmed working, update to production domain**

**Recommended Approach:**
- Test with production credentials on staging first
- Verify everything works
- Then migrate to production domain
- Update BSP webhook URLs to production domain

---

## 3. SMTP Email Service Migration

### Current Setup (Gmail)

**Issues with Gmail:**
- ❌ Limited to 500 emails/day
- ❌ Less reliable for transactional emails
- ❌ May be marked as spam
- ❌ Requires "Less secure app access" or App Passwords
- ❌ Not suitable for production government system

### Recommended Free SMTP Services

#### Option 1: SendGrid (Recommended) ⭐

**Free Tier:**
- ✅ **100 emails/day FREE** (forever)
- ✅ Highly reliable (used by Uber, Airbnb)
- ✅ Professional transactional emails
- ✅ Email analytics and tracking
- ✅ Government-approved

**Setup Steps:**

1. **Sign up:** https://signup.sendgrid.com/
2. **Create API Key:**
   - Dashboard → Settings → API Keys
   - Create API Key
   - Copy key (only shown once)

3. **Backend Configuration:**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=<your_sendgrid_api_key>
   SMTP_FROM=noreply@pnggreenfees.gov.pg
   SMTP_SECURE=false
   ```

4. **Verify Domain (Optional but Recommended):**
   - Dashboard → Settings → Sender Authentication
   - Authenticate Domain: pnggreenfees.gov.pg
   - Add DNS records provided by SendGrid
   - Improves email deliverability

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month (50,000 emails/month)
- Pro: $89.95/month (100,000 emails/month)

**Email Volume Estimate for GreenPay:**
- ~10-50 passport purchases/day = 10-50 emails/day
- Well within free tier limits

#### Option 2: Mailgun

**Free Tier:**
- ✅ **100 emails/day FREE** (3 months trial)
- ✅ After trial: Pay-as-you-go ($0.80/1000 emails)
- ✅ Good reliability

**Setup:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=<mailgun_username>
SMTP_PASS=<mailgun_password>
SMTP_FROM=noreply@pnggreenfees.gov.pg
```

**Pricing:**
- Free trial: 100 emails/day (3 months)
- Foundation: $35/month (50,000 emails)

#### Option 3: Brevo (formerly Sendinblue)

**Free Tier:**
- ✅ **300 emails/day FREE** (forever)
- ✅ Highest free tier limit
- ✅ Good for high-volume government use

**Setup:**
```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<brevo_login_email>
SMTP_PASS=<brevo_smtp_key>
SMTP_FROM=noreply@pnggreenfees.gov.pg
```

**Pricing:**
- Free: 300 emails/day
- Starter: $25/month (20,000 emails/month)

### SMTP Configuration in Code

**File:** `backend/services/notificationService.js`

**Current Configuration (Gmail):**
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

**Production Configuration (SendGrid/Generic SMTP):**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

**No code changes required if using environment variables correctly!**

### Recommended SMTP Service for Government

**SendGrid** is recommended because:
- ✅ Used by government agencies worldwide
- ✅ SOC 2 Type II certified
- ✅ GDPR compliant
- ✅ 100 emails/day free tier sufficient
- ✅ Easy domain verification
- ✅ Professional email analytics

---

## 4. DNS Configuration for New Domain

### Required DNS Records

**For:** pnggreenfees.gov.pg

#### A Record (Required)
```
Type: A
Name: @
Value: 165.22.52.100  (your server IP)
TTL: 3600
```

#### WWW CNAME (Recommended)
```
Type: CNAME
Name: www
Value: pnggreenfees.gov.pg
TTL: 3600
```

#### MX Records (For Email - if using custom domain email)
```
Type: MX
Name: @
Priority: 10
Value: (provided by email service)
```

#### SPF Record (For Email Deliverability)
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

#### DKIM Record (For Email Authentication - SendGrid provides)
```
Type: TXT
Name: s1._domainkey
Value: (provided by SendGrid after domain verification)
```

---

## 5. SSL Certificate for New Domain

### Option A: Let's Encrypt (Free) - Recommended

**If using CloudPanel (your current setup):**

1. **Login to CloudPanel**
2. **Navigate to:** Sites → pnggreenfees.gov.pg
3. **SSL/TLS Tab**
4. **Click:** "Issue Let's Encrypt Certificate"
5. **Wait:** 1-2 minutes for automatic setup

**Manual Setup (if needed):**
```bash
# Install certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d pnggreenfees.gov.pg -d www.pnggreenfees.gov.pg

# Certificate auto-renews every 90 days
```

### Option B: Government SSL Certificate

If PNG government requires specific SSL provider:
- Obtain certificate from approved provider
- Install via CloudPanel or manually
- Configure nginx

---

## 6. Migration Checklist

### Phase 1: Pre-Migration (Before DNS Change)

#### DNS Setup
- [ ] Create A record: pnggreenfees.gov.pg → 165.22.52.100
- [ ] Create CNAME: www.pnggreenfees.gov.pg → pnggreenfees.gov.pg
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify DNS: `nslookup pnggreenfees.gov.pg`

#### SSL Certificate
- [ ] Install SSL certificate for pnggreenfees.gov.pg
- [ ] Verify HTTPS working: `curl -I https://pnggreenfees.gov.pg`
- [ ] Test certificate validity: https://www.ssllabs.com/ssltest/

#### SMTP Service
- [ ] Sign up for SendGrid (or chosen provider)
- [ ] Get API key / SMTP credentials
- [ ] Verify sender domain (optional but recommended)
- [ ] Test email sending from staging

#### BSP Coordination
- [ ] Request production credentials from BSP
- [ ] Inform BSP of production domain: pnggreenfees.gov.pg
- [ ] Request BSP to whitelist production domain
- [ ] Confirm production webhook URLs with BSP

### Phase 2: Configuration Update (On Production Server)

#### Backend Configuration
- [ ] Update `.env` file:
  ```bash
  FRONTEND_URL=https://pnggreenfees.gov.pg
  BACKEND_URL=https://pnggreenfees.gov.pg/api
  BSP_DOKU_MODE=production
  BSP_DOKU_MALL_ID=<production>
  BSP_DOKU_SHARED_KEY=<production>
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=<sendgrid_key>
  SMTP_FROM=noreply@pnggreenfees.gov.pg
  ```

#### Code Changes
- [ ] Update CORS origins in `backend/server.js`
- [ ] Update SMTP transporter in `backend/services/notificationService.js`
- [ ] Commit changes to git
- [ ] Deploy to production server

#### Server Configuration
- [ ] Restart backend: `pm2 restart greenpay-api`
- [ ] Verify backend running: `pm2 logs greenpay-api`
- [ ] Test API endpoint: `curl https://pnggreenfees.gov.pg/api/health`

### Phase 3: BSP Production Setup

#### BSP Portal Configuration
- [ ] Login to BSP DOKU merchant portal
- [ ] Update webhook URLs to production domain
- [ ] Verify production credentials installed
- [ ] Enable IP whitelisting for production
- [ ] Request production test cards from BSP

#### Testing
- [ ] Test payment with Visa (production credentials)
- [ ] Test payment with Mastercard
- [ ] Verify webhook notification received
- [ ] Verify voucher created in database
- [ ] Verify email sent via new SMTP service

### Phase 4: Final Verification

#### Application Testing
- [ ] Test complete payment flow end-to-end
- [ ] Verify email delivery to customer
- [ ] Check database backup still running
- [ ] Verify all API endpoints accessible
- [ ] Test on mobile devices
- [ ] Test on desktop browsers

#### Monitoring
- [ ] Check PM2 logs for errors
- [ ] Monitor email delivery in SendGrid dashboard
- [ ] Verify database backups continuing
- [ ] Check disk space and server resources

### Phase 5: DNS Cutover (Go-Live)

**Note:** If DNS already points to server, this is automatic

- [ ] Verify pnggreenfees.gov.pg resolves to correct IP
- [ ] Test HTTPS access: https://pnggreenfees.gov.pg
- [ ] Verify SSL certificate valid (green lock icon)
- [ ] Test complete user journey
- [ ] Monitor for 24 hours

---

## 7. Deployment Commands Reference

### On Production Server (via SSH)

```bash
# 1. Backup current configuration
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cp .env .env.backup-$(date +%Y%m%d)

# 2. Update environment variables
nano .env
# Update FRONTEND_URL, BACKEND_URL, BSP_DOKU_*, SMTP_* variables

# 3. Update CORS configuration
nano server.js
# Add pnggreenfees.gov.pg to allowed origins

# 4. Update SMTP configuration (if needed)
nano services/notificationService.js
# Ensure using environment variables, not hardcoded Gmail

# 5. Restart backend
pm2 restart greenpay-api

# 6. Verify backend running
pm2 logs greenpay-api --lines 50

# 7. Test API endpoint
curl https://pnggreenfees.gov.pg/api/health
```

### Testing Email After SMTP Migration

```bash
# Test email sending via new SMTP
# (Add test endpoint or use existing email function)

# Check SendGrid dashboard
# https://app.sendgrid.com/email_activity
```

---

## 8. Rollback Plan (If Issues Occur)

### If Production Domain Has Issues

**Option 1: Revert to Staging Domain**
```bash
# 1. Restore previous .env
cp .env.backup-20260101 .env

# 2. Restart backend
pm2 restart greenpay-api

# 3. Continue using greenpay.eywademo.cloud
```

**Option 2: Use Both Domains Temporarily**
```javascript
// CORS allows both domains
const corsOptions = {
  origin: [
    'https://pnggreenfees.gov.pg',
    'https://greenpay.eywademo.cloud'  // Keep working during migration
  ]
};
```

### If BSP Production Has Issues

**Fallback to Staging Credentials:**
```bash
# Temporarily revert to staging BSP
BSP_DOKU_MALL_ID=11170
BSP_DOKU_SHARED_KEY=<staging_key>
BSP_DOKU_MODE=staging

pm2 restart greenpay-api
```

### If Email Service Has Issues

**Fallback to Gmail Temporarily:**
```bash
# Revert SMTP to Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail_address>
SMTP_PASS=<gmail_app_password>

pm2 restart greenpay-api
```

---

## 9. Cost Analysis

### Domain Migration Costs

| Item | Current Cost | Production Cost | Notes |
|------|-------------|-----------------|-------|
| Domain | Free (eywademo.cloud) | Free (gov.pg) | Government domain |
| SSL Certificate | Free (Let's Encrypt) | Free (Let's Encrypt) | Auto-renewal |
| Server | $X/month | $X/month | No change |
| SMTP Service | Free (Gmail) | Free (SendGrid) | 100 emails/day |
| **Total** | **$X/month** | **$X/month** | **No additional cost** |

### Future Scaling Costs (If Needed)

**Email Volume Scaling:**
- 0-100 emails/day: **Free** (SendGrid)
- 100-1,666 emails/day: **$19.95/month** (50k/month)
- 1,666-3,333 emails/day: **$89.95/month** (100k/month)

**Current Usage Estimate:**
- ~20-50 passport purchases/day = 20-50 emails/day
- **Stays FREE indefinitely**

---

## 10. Timeline Estimate

### Optimistic Timeline (1 Week)

**Day 1-2:** DNS setup, SSL certificate
**Day 3:** Update configuration, code changes
**Day 4:** BSP coordination, production credentials
**Day 5:** Testing on new domain
**Day 6:** Email migration to SendGrid
**Day 7:** Go-live

### Realistic Timeline (2-3 Weeks)

**Week 1:** DNS, SSL, SMTP setup and testing
**Week 2:** BSP coordination, production credentials, testing
**Week 3:** Final verification, go-live

### Conservative Timeline (4-6 Weeks)

Accounts for:
- Government domain approval delays
- BSP coordination delays
- Extended testing period
- Phased rollout

---

## 11. Recommended Approach

### Option A: Gradual Migration (Recommended for Government)

**Step 1:** Test BSP production on staging domain first
```bash
# Use production BSP credentials on greenpay.eywademo.cloud
BSP_DOKU_MALL_ID=<production>
BSP_DOKU_MODE=production
# Keep staging domain
```

**Step 2:** Migrate SMTP to SendGrid on staging
```bash
# Test SendGrid on greenpay.eywademo.cloud first
SMTP_HOST=smtp.sendgrid.net
SMTP_FROM=noreply@pnggreenfees.gov.pg
```

**Step 3:** Setup production domain in parallel
- Configure DNS
- Install SSL
- Test accessibility
- Keep staging running

**Step 4:** Switch traffic to production domain
- Update backend configuration
- Update BSP webhook URLs
- Monitor for issues
- Keep staging as backup

**Benefits:**
- ✅ Lower risk
- ✅ Can test everything before full migration
- ✅ Easy rollback
- ✅ Minimal downtime

### Option B: Big Bang Migration

**All at once:**
- Update domain
- Update BSP
- Update SMTP
- Go-live

**Risks:**
- ❌ Higher risk if issues occur
- ❌ More complex rollback
- ❌ Potential downtime

---

## 12. Next Steps

### Immediate Actions (This Week)

1. **Apply for Production Domain** (if not done)
   - Request pnggreenfees.gov.pg from PNG government
   - Get DNS management access

2. **Sign up for SendGrid**
   - Create free account
   - Get API key
   - Test email sending on staging

3. **Contact BSP**
   - Request production credentials
   - Inform about production domain migration
   - Request production webhook URL configuration

### Short-Term (Next 2 Weeks)

4. **Setup DNS for pnggreenfees.gov.pg**
   - Create A record
   - Wait for propagation
   - Install SSL certificate

5. **Test on Staging First**
   - Use production BSP credentials on staging
   - Use SendGrid SMTP on staging
   - Verify everything works

6. **Update Production Configuration**
   - Deploy code changes
   - Update environment variables
   - Restart services

### Go-Live (Week 3-4)

7. **Switch to Production Domain**
   - Update all configurations
   - Test thoroughly
   - Monitor for 24-48 hours

8. **Inform Stakeholders**
   - Notify users of new domain
   - Update documentation
   - Update marketing materials

---

**Document Created:** 2026-01-01  
**Status:** READY FOR DOMAIN MIGRATION PLANNING  
**Next Review:** After government domain approval  
