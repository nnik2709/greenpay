# Brevo DNS Authentication Setup Guide

**Date**: 2026-01-15
**Domain**: eywademo.cloud
**Purpose**: Configure DKIM, SPF, and DMARC for Brevo email authentication
**Critical**: Required for Gmail, Yahoo, Outlook delivery

---

## Why DNS Authentication Is Required

Google, Yahoo, and Microsoft now **REJECT emails without proper authentication** (as of 2024).

Without DKIM/SPF/DMARC:
❌ Emails rejected by Gmail, Yahoo, Outlook
❌ High spam rate (80%+ of emails go to spam)
❌ Domain reputation damage
❌ Cannot send production emails

With DKIM/SPF/DMARC:
✅ Emails deliver to inbox
✅ Professional sender reputation
✅ Compliance with 2024 email standards
✅ Better deliverability (95%+ inbox rate)

---

## Part 1: Get DNS Records from Brevo

### Step 1: Access Brevo Dashboard

1. Go to: https://app.brevo.com
2. Login with your account
3. Navigate to: **Settings** (gear icon, top right)

### Step 2: Navigate to Domain Authentication

1. Click: **Senders, Domains & Dedicated IPs**
2. Click the **"Domains"** tab
3. Click **"Authenticate a domain"** button

### Step 3: Enter Your Domain

1. In the popup, enter: `eywademo.cloud`
2. Click **"Authenticate"** or **"Next"**

### Step 4: Copy DNS Records

Brevo will show you **3 DNS records** to add. They will look similar to this:

**Example Records** (your actual values will be different):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DKIM Record (Domain Keys Identified Mail)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: mail._domainkey
Host: mail._domainkey.eywademo.cloud
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
       (long string of characters)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SPF Record (Sender Policy Framework)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: @ (or leave blank, or eywademo.cloud)
Host: eywademo.cloud
Value: v=spf1 include:spf.brevo.com ~all

IMPORTANT: If you already have an SPF record, you need to MERGE it, not replace it!
Existing: v=spf1 include:_spf.google.com ~all
Updated:  v=spf1 include:_spf.google.com include:spf.brevo.com ~all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DMARC Record (Domain-based Message Authentication)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: _dmarc
Host: _dmarc.eywademo.cloud
Value: v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud
```

**CRITICAL**: Copy these EXACT values from Brevo dashboard - do NOT use the examples above!

---

## Part 2: Add DNS Records to Your Domain

### Step 1: Determine Your DNS Provider

Your domain `eywademo.cloud` is hosted somewhere. Common providers:
- **Cloudflare** (most likely for a demo domain)
- **DigitalOcean** (if VPS is there)
- **GoDaddy**
- **Namecheap**
- **AWS Route 53**
- **Google Domains**

**To find out**, check:
1. Your domain registrar account
2. Where you manage other DNS records (A, CNAME, etc.)
3. DigitalOcean account (Networking → Domains)

### Step 2: Access DNS Management

I'll provide instructions for the most common providers:

---

## Option A: Cloudflare DNS Setup

### Step 1: Login to Cloudflare

1. Go to: https://dash.cloudflare.com
2. Login with your account
3. Click on domain: **eywademo.cloud**

### Step 2: Navigate to DNS

1. Click **"DNS"** tab in left sidebar
2. You'll see existing DNS records

### Step 3: Add DKIM Record

1. Click **"Add record"** button
2. Fill in:
   - **Type**: TXT
   - **Name**: `mail._domainkey` (or whatever Brevo shows)
   - **Content**: Paste the DKIM value from Brevo (long string starting with `v=DKIM1;`)
   - **TTL**: Auto (or 3600)
   - **Proxy status**: DNS only (gray cloud, NOT orange)
3. Click **"Save"**

### Step 4: Add SPF Record

**IMPORTANT**: Check if you already have an SPF record first!

1. Look for existing TXT record with name `@` or `eywademo.cloud` and value starting with `v=spf1`
2. **If existing SPF found**:
   - Click **"Edit"** on that record
   - Update value by adding ` include:spf.brevo.com` before the `~all`
   - Example: `v=spf1 include:_spf.google.com include:spf.brevo.com ~all`
3. **If NO existing SPF**:
   - Click **"Add record"**
   - **Type**: TXT
   - **Name**: `@`
   - **Content**: `v=spf1 include:spf.brevo.com ~all`
   - **TTL**: Auto
   - **Proxy status**: DNS only (gray cloud)
4. Click **"Save"**

### Step 5: Add DMARC Record

1. Click **"Add record"** button
2. Fill in:
   - **Type**: TXT
   - **Name**: `_dmarc`
   - **Content**: `v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud`
   - **TTL**: Auto
   - **Proxy status**: DNS only (gray cloud)
3. Click **"Save"**

---

## Option B: DigitalOcean DNS Setup

### Step 1: Login to DigitalOcean

1. Go to: https://cloud.digitalocean.com
2. Login with your account
3. Navigate to: **Networking** → **Domains**

### Step 2: Select Your Domain

1. Click on: **eywademo.cloud**
2. You'll see existing DNS records

### Step 3: Add DKIM Record

1. In "Create new record" section:
   - **Type**: TXT
   - **Hostname**: `mail._domainkey` (or whatever Brevo shows)
   - **Value**: Paste DKIM value from Brevo
   - **TTL**: 3600 (1 hour)
2. Click **"Create Record"**

### Step 4: Add SPF Record

**IMPORTANT**: Check existing records first!

1. Look for existing TXT record with hostname `@` and value `v=spf1...`
2. **If existing SPF found**:
   - Delete old record
   - Create new record with merged value
3. **If NO existing SPF**:
   - **Type**: TXT
   - **Hostname**: `@`
   - **Value**: `v=spf1 include:spf.brevo.com ~all`
   - **TTL**: 3600
4. Click **"Create Record"**

### Step 5: Add DMARC Record

1. In "Create new record" section:
   - **Type**: TXT
   - **Hostname**: `_dmarc`
   - **Value**: `v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud`
   - **TTL**: 3600
2. Click **"Create Record"**

---

## Option C: GoDaddy DNS Setup

### Step 1: Login to GoDaddy

1. Go to: https://www.godaddy.com
2. Login → **My Products**
3. Find **eywademo.cloud** → Click **"DNS"**

### Step 2: Add DKIM Record

1. Click **"Add"** button
2. Select **Type**: TXT
3. **Name**: `mail._domainkey`
4. **Value**: Paste DKIM value from Brevo
5. **TTL**: 1 Hour
6. Click **"Save"**

### Step 3: Add/Update SPF Record

1. Check for existing TXT record with `v=spf1`
2. If exists: Edit and merge. If not: Add new
3. **Type**: TXT
4. **Name**: `@`
5. **Value**: `v=spf1 include:spf.brevo.com ~all` (or merged version)
6. Click **"Save"**

### Step 4: Add DMARC Record

1. Click **"Add"**
2. **Type**: TXT
3. **Name**: `_dmarc`
4. **Value**: `v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud`
5. Click **"Save"**

---

## Part 3: Verify DNS Propagation

### Step 1: Wait for Propagation

- **Minimum**: 5-10 minutes
- **Typical**: 1-2 hours
- **Maximum**: 24-48 hours

### Step 2: Check DNS Records Online

Use online DNS checker tools:

**Option A: MXToolbox**
1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Check DKIM:
   - Enter: `mail._domainkey.eywademo.cloud`
   - Select: TXT Lookup
   - Should show your DKIM record
3. Check SPF:
   - Enter: `eywademo.cloud`
   - Select: SPF Record Lookup
   - Should show: `v=spf1 include:spf.brevo.com ~all`
4. Check DMARC:
   - Enter: `_dmarc.eywademo.cloud`
   - Select: DMARC Lookup
   - Should show your DMARC policy

**Option B: Google Admin Toolbox**
1. Go to: https://toolbox.googleapps.com/apps/dig/
2. Enter domain: `mail._domainkey.eywademo.cloud`
3. Select: TXT
4. Click **"Run"**

### Step 3: Verify in Brevo Dashboard

1. Go to Brevo: https://app.brevo.com
2. Navigate to: **Settings** → **Domains**
3. Find `eywademo.cloud`
4. Status should show:
   - ✅ **DKIM**: Authenticated (green checkmark)
   - ✅ **SPF**: Valid
   - ✅ **DMARC**: Valid

**If not verified yet**: Wait longer and click "Check again" button

---

## Part 4: Verify Sender Email

After DNS is verified, verify your sender email:

1. Go to Brevo: **Settings** → **Senders**
2. If `png.greenfees@eywademo.cloud` is not listed:
   - Click **"Add a Sender"**
   - Email: `png.greenfees@eywademo.cloud`
   - Click **"Add"**
3. Brevo sends verification email to `png.greenfees@eywademo.cloud`
4. Check that email inbox
5. Click verification link
6. Return to Brevo - should show ✅ Verified

---

## Part 5: Test Email Authentication

### Test 1: Send Test Email via Brevo

1. In Brevo dashboard, go to: **Campaigns** → **Transactional**
2. Click **"Send a test email"**
3. Enter your personal email
4. Send test

### Test 2: Check Authentication Headers

1. Receive test email in your inbox
2. Open email → Click **"Show original"** (Gmail) or **"View message source"**
3. Look for these headers:
   ```
   DKIM-Signature: v=1; a=rsa-sha256; d=eywademo.cloud; ...
   SPF: PASS
   DMARC: PASS
   ```

### Test 3: Use Mail-Tester

1. Go to: https://www.mail-tester.com
2. Copy the test email address shown
3. Send voucher confirmation from your system to that address
4. Click **"Then check your score"**
5. Should show:
   - ✅ **SPF**: Pass
   - ✅ **DKIM**: Pass
   - ✅ **DMARC**: Pass
   - **Score**: 9/10 or 10/10

---

## Common DNS Record Formats

Your DNS records should look like this after setup:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECORD 1: DKIM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: mail._domainkey
Full hostname: mail._domainkey.eywademo.cloud
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSq... (long key from Brevo)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECORD 2: SPF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: @ (or blank, or eywademo.cloud)
Full hostname: eywademo.cloud
Value: v=spf1 include:spf.brevo.com ~all

If you have Google Workspace or other services:
Value: v=spf1 include:_spf.google.com include:spf.brevo.com ~all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECORD 3: DMARC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: _dmarc
Full hostname: _dmarc.eywademo.cloud
Value: v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud
```

---

## Troubleshooting

### Issue 1: DNS Records Not Showing Up

**Cause**: DNS not propagated yet

**Solution**:
1. Wait 1-2 hours
2. Check propagation: https://dnschecker.org
3. Enter: `mail._domainkey.eywademo.cloud`
4. Select: TXT
5. Should show green checkmarks globally

### Issue 2: Brevo Shows "Not Authenticated"

**Cause**: DNS records incorrect or not propagated

**Solution**:
1. Double-check DNS values match Brevo EXACTLY
2. Verify TXT record type (not CNAME, not A)
3. Ensure no extra spaces or quotes in values
4. Wait for full propagation (up to 48 hours)
5. Click "Verify again" in Brevo dashboard

### Issue 3: SPF Record Conflict

**Cause**: Multiple SPF records (only ONE allowed per domain)

**Solution**:
1. Merge all SPF includes into ONE record
2. Example:
   ```
   Wrong: v=spf1 include:_spf.google.com ~all
          v=spf1 include:spf.brevo.com ~all

   Correct: v=spf1 include:_spf.google.com include:spf.brevo.com ~all
   ```

### Issue 4: DKIM Selector Wrong

**Cause**: Wrong subdomain name

**Solution**:
1. Use EXACT name from Brevo dashboard
2. Common formats:
   - `mail._domainkey`
   - `brevo._domainkey`
   - `sendinblue._domainkey` (legacy)
3. Do NOT add domain to name (e.g., NOT `mail._domainkey.eywademo.cloud`)
4. DNS provider adds domain automatically

### Issue 5: Emails Still Going to Spam

**Cause**: DNS not fully propagated OR email content flagged

**Solution**:
1. Wait 24 hours after DNS verification
2. Check mail-tester.com score
3. Verify DKIM/SPF/DMARC all show "PASS"
4. Check email content for spam triggers
5. Build sender reputation (send low volume first)

---

## DNS Verification Checklist

Before marking as complete, verify:

- [ ] DKIM record added with correct selector name
- [ ] SPF record added/updated (merged if existing)
- [ ] DMARC record added
- [ ] DNS propagation checked (MXToolbox or dnschecker.org)
- [ ] Brevo dashboard shows all 3 authenticated (green checkmarks)
- [ ] Sender email `png.greenfees@eywademo.cloud` verified
- [ ] Test email sent from system
- [ ] Test email passed mail-tester.com (9/10 or better)
- [ ] Email headers show DKIM=pass, SPF=pass, DMARC=pass

---

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Add DNS records | 10-15 min | ✅ You do this |
| DNS propagation | 1-24 hours | ⏳ Wait |
| Brevo verification | 5 min | ✅ Auto |
| Sender email verification | 5 min | ✅ You do this |
| First test email | 2 min | ✅ You do this |
| **Total** | **1-24 hours** | |

**Fastest case**: 30 minutes (if DNS propagates quickly)
**Typical case**: 2-4 hours
**Worst case**: 48 hours (rare)

---

## Quick Reference Commands

### Check DNS from Command Line

```bash
# Check DKIM
dig TXT mail._domainkey.eywademo.cloud +short

# Check SPF
dig TXT eywademo.cloud +short | grep spf

# Check DMARC
dig TXT _dmarc.eywademo.cloud +short

# All at once
echo "DKIM:" && dig TXT mail._domainkey.eywademo.cloud +short && \
echo "SPF:" && dig TXT eywademo.cloud +short | grep spf && \
echo "DMARC:" && dig TXT _dmarc.eywademo.cloud +short
```

---

## What Happens After DNS Setup?

1. **Immediate** (0-5 min):
   - DNS records added to your provider
   - Records start propagating globally

2. **Within 1 hour**:
   - Most DNS servers worldwide have updated records
   - Brevo auto-verifies records

3. **Within 24 hours**:
   - All global DNS servers updated
   - Full email authentication active
   - Emails deliver to inbox (not spam)

4. **Ongoing**:
   - Sender reputation builds over time
   - Deliverability improves (first week: 85%, after month: 95%+)

---

**Status**: ⏳ AWAITING DNS SETUP
**Next Step**: Get DNS records from Brevo, add to your DNS provider
**Time Required**: 10-15 minutes setup + 1-24 hours propagation
**Business Impact**: CRITICAL - Required for production email delivery

---

## Need Help?

If you get stuck or need DNS provider-specific help:
1. Let me know which DNS provider you're using
2. Share screenshots of Brevo DNS records
3. I can provide more specific instructions
4. Common providers: Cloudflare, DigitalOcean, GoDaddy, Namecheap

---

**Remember**: You MUST complete DNS authentication before production use. Emails will work without it, but 80%+ will go to spam or be rejected by Gmail/Yahoo/Outlook.
