# Brevo DNS Setup for Hostinger

**Date**: 2026-01-15
**Domain**: eywademo.cloud
**DNS Provider**: Hostinger
**Time Required**: 15 minutes setup + 1-4 hours DNS propagation

---

## Step-by-Step: Hostinger DNS Configuration

### Part 1: Get DNS Records from Brevo (5 minutes)

#### Step 1: Login to Brevo

1. Go to: https://app.brevo.com
2. Login with your Brevo account

#### Step 2: Navigate to Domain Authentication

1. Click **Settings** (gear icon, top right)
2. Click **Senders, Domains & Dedicated IPs**
3. Click the **"Domains"** tab
4. Click **"Authenticate a domain"** button

#### Step 3: Enter Your Domain

1. Enter: `eywademo.cloud`
2. Click **"Authenticate"** or **"Continue"**

#### Step 4: Copy DNS Records

Brevo will display 3 DNS records. **Copy these EXACT values** (don't close this tab):

**Example of what you'll see** (your actual values will be different):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DKIM Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: mail._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA... (long string)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SPF Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: @ (or blank)
Value: v=spf1 include:spf.brevo.com ~all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DMARC Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud
```

**CRITICAL**: Keep this Brevo tab open - you'll copy/paste these values into Hostinger

---

### Part 2: Add DNS Records in Hostinger (10 minutes)

#### Step 1: Login to Hostinger

1. Go to: https://hpanel.hostinger.com
2. Login with your Hostinger account
3. You'll see your Hostinger control panel (hPanel)

#### Step 2: Navigate to DNS Zone Editor

**Option A: From Dashboard**
1. Click **"Domains"** in left sidebar
2. Find **eywademo.cloud** in your domain list
3. Click **"Manage"** button next to it
4. Scroll down and click **"DNS / Name Servers"** or **"DNS Zone Editor"**

**Option B: Direct Access**
1. In hPanel, look for **"Advanced"** section
2. Click **"DNS Zone Editor"**
3. Select domain: **eywademo.cloud** from dropdown

You should now see your existing DNS records (A, CNAME, MX, etc.)

---

#### Step 3: Add DKIM Record

1. Look for **"Add New Record"** or **"Add Record"** button (usually at bottom)
2. Click it to open the new record form
3. Fill in the form:

   **Type**: Select **TXT** from dropdown

   **Name**: Enter exactly what Brevo shows (usually `mail._domainkey`)
   - Do NOT include `.eywademo.cloud` at the end
   - Hostinger adds the domain automatically
   - Just enter: `mail._domainkey`

   **TTL**: Leave default (usually 3600 or 14400) or select **1 hour**

   **Value** / **Points to**: Paste the DKIM value from Brevo
   - Should start with: `v=DKIM1; k=rsa; p=`
   - Very long string (200+ characters)
   - Copy the ENTIRE value
   - Remove any quotes if Hostinger adds them automatically

4. Click **"Add Record"** or **"Save"**

**Visual Example**:
```
Type:     TXT
Name:     mail._domainkey
TTL:      3600
Value:    v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (paste full value)
```

---

#### Step 4: Add/Update SPF Record

**IMPORTANT**: You may already have an SPF record. Check first!

**Step 4a: Check for Existing SPF Record**

1. In your DNS Zone Editor, look through existing TXT records
2. Look for a record with:
   - **Name**: `@` or blank or `eywademo.cloud`
   - **Value** starting with: `v=spf1`

**Step 4b: If You Have an Existing SPF Record**

**Option A: Edit Existing Record (Recommended)**
1. Find the existing SPF TXT record
2. Click **"Edit"** or **"Modify"** button
3. In the Value field, you'll see something like:
   ```
   v=spf1 include:_spf.google.com ~all
   ```
4. Update it by adding ` include:spf.brevo.com` before `~all`:
   ```
   v=spf1 include:_spf.google.com include:spf.brevo.com ~all
   ```
5. Click **"Save"** or **"Update"**

**Option B: Delete and Recreate (If Edit Not Available)**
1. Delete the old SPF record
2. Add new record with merged value (see below)

**Step 4c: If You DON'T Have an SPF Record**

1. Click **"Add New Record"**
2. Fill in:

   **Type**: TXT

   **Name**: `@` (or leave blank if Hostinger doesn't allow `@`)

   **TTL**: 3600 (1 hour)

   **Value**: `v=spf1 include:spf.brevo.com ~all`

3. Click **"Add Record"** or **"Save"**

**Visual Example**:
```
Type:     TXT
Name:     @
TTL:      3600
Value:    v=spf1 include:spf.brevo.com ~all
```

**Important**: You can only have ONE SPF record per domain. If you have multiple services (Google Workspace, etc.), merge them all into one record.

---

#### Step 5: Add DMARC Record

1. Click **"Add New Record"** or **"Add Record"**
2. Fill in:

   **Type**: TXT

   **Name**: `_dmarc`
   - Just `_dmarc` (without the domain)
   - Hostinger adds `.eywademo.cloud` automatically

   **TTL**: 3600 (1 hour)

   **Value**: Paste the DMARC value from Brevo
   - Usually: `v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud`

3. Click **"Add Record"** or **"Save"**

**Visual Example**:
```
Type:     TXT
Name:     _dmarc
TTL:      3600
Value:    v=DMARC1; p=none; rua=mailto:postmaster@eywademo.cloud
```

---

#### Step 6: Verify Your DNS Records in Hostinger

After adding all 3 records, your DNS Zone should show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type    Name                    TTL     Value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TXT     mail._domainkey         3600    v=DKIM1; k=rsa; p=MIGfMA0GCSq... (long)
TXT     @                       3600    v=spf1 include:spf.brevo.com ~all
TXT     _dmarc                  3600    v=DMARC1; p=none; rua=mailto:...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Double-check**:
- ✅ All 3 records added
- ✅ Type is TXT for all
- ✅ Names are correct (mail._domainkey, @, _dmarc)
- ✅ Values match what Brevo provided

---

### Part 3: Wait for DNS Propagation (1-4 hours)

#### What is DNS Propagation?

When you add DNS records, they need to spread across the internet's DNS servers globally. This takes time.

**Timeline**:
- **5-10 minutes**: Hostinger DNS updated
- **1-2 hours**: Most DNS servers worldwide updated (typical)
- **4-24 hours**: All DNS servers updated (maximum)

**What to do while waiting**:
- Continue with SMTP deployment (if not done yet)
- Get coffee ☕
- Come back in 1-2 hours to check

---

### Part 4: Verify DNS Propagation (5 minutes)

#### Step 1: Wait at Least 30 Minutes

Don't check immediately - DNS takes time to propagate.

#### Step 2: Check DNS Records Online

**Option A: MXToolbox (Recommended)**

1. Go to: https://mxtoolbox.com/SuperTool.aspx

2. **Check DKIM**:
   - In the search box, enter: `mail._domainkey.eywademo.cloud`
   - From dropdown, select: **TXT Lookup**
   - Click **"Search"**
   - Should show your DKIM record starting with `v=DKIM1;`

3. **Check SPF**:
   - Enter: `eywademo.cloud`
   - Select: **SPF Record Lookup**
   - Click **"Search"**
   - Should show: `v=spf1 include:spf.brevo.com ~all`

4. **Check DMARC**:
   - Enter: `_dmarc.eywademo.cloud`
   - Select: **DMARC Lookup**
   - Click **"Search"**
   - Should show: `v=DMARC1; p=none; ...`

**Option B: Google Admin Toolbox**

1. Go to: https://toolbox.googleapps.com/apps/dig/
2. Enter: `mail._domainkey.eywademo.cloud`
3. Select: **TXT**
4. Click **"Run"**
5. Should show your DKIM record
6. Repeat for `eywademo.cloud` (SPF) and `_dmarc.eywademo.cloud` (DMARC)

**Option C: Command Line (if you have terminal access)**

```bash
# Check DKIM
dig TXT mail._domainkey.eywademo.cloud +short

# Check SPF
dig TXT eywademo.cloud +short | grep spf

# Check DMARC
dig TXT _dmarc.eywademo.cloud +short
```

---

### Part 5: Verify in Brevo Dashboard (2 minutes)

#### Step 1: Return to Brevo

1. Go back to your Brevo tab (or https://app.brevo.com)
2. Navigate to: **Settings** → **Domains**
3. Find `eywademo.cloud` in the list

#### Step 2: Check Verification Status

You should see:
- ✅ **DKIM**: Authenticated (green checkmark)
- ✅ **SPF**: Valid
- ✅ **DMARC**: Valid

**If not verified yet**:
1. Click **"Check again"** or **"Verify"** button
2. Wait 5 minutes and try again
3. If still not working after 2 hours, check troubleshooting below

---

### Part 6: Verify Sender Email (5 minutes)

After domain is verified, verify your sender email:

#### Step 1: Add Sender in Brevo

1. In Brevo, go to: **Settings** → **Senders**
2. Click **"Add a Sender"** button
3. Enter email: `png.greenfees@eywademo.cloud`
4. Enter from name: `PNG Green Fees System`
5. Click **"Add"** or **"Save"**

#### Step 2: Verify Email Address

1. Brevo sends verification email to `png.greenfees@eywademo.cloud`
2. Check that email inbox (you need access to this email)
3. Open the verification email from Brevo
4. Click the verification link
5. Return to Brevo dashboard
6. Should show ✅ **Verified** next to `png.greenfees@eywademo.cloud`

**Note**: You must have access to `png.greenfees@eywademo.cloud` email inbox. If you don't, you'll need to set up email forwarding in Hostinger first.

---

### Part 7: Test Email Authentication (10 minutes)

#### Test 1: Send Test Email from Your System

1. Go to: https://greenpay.eywademo.cloud/buy-online
2. Purchase a K 50 voucher
3. Use your personal email address
4. Complete payment
5. Check your email inbox (and spam folder)

**Expected**:
- ✅ Email arrives in inbox (not spam)
- ✅ From: "PNG Green Fees System <png.greenfees@eywademo.cloud>"
- ✅ Email looks professional

#### Test 2: Check Email Headers (Advanced)

1. Open the voucher confirmation email
2. In Gmail: Click **⋮** (three dots) → **Show original**
3. In Outlook: **View** → **View message source**
4. Look for these lines:

```
Authentication-Results: ...
    dkim=pass header.d=eywademo.cloud
    spf=pass smtp.mailfrom=eywademo.cloud
    dmarc=pass

DKIM-Signature: v=1; a=rsa-sha256; d=eywademo.cloud; ...
```

**All should show**: `pass` ✅

#### Test 3: Mail-Tester Score

1. Go to: https://www.mail-tester.com
2. Copy the test email address shown (e.g., `test-xxxxx@srv1.mail-tester.com`)
3. Send a voucher confirmation to that test email
4. Go back to mail-tester.com
5. Click **"Then check your score"**

**Expected Score**: 9/10 or 10/10

**Should show**:
- ✅ SPF: Pass
- ✅ DKIM: Pass
- ✅ DMARC: Pass
- ✅ Not blacklisted
- ✅ HTML formatted properly

---

## Troubleshooting

### Issue 1: "Record already exists" in Hostinger

**Cause**: Duplicate DNS record

**Solution**:
1. Check existing records in DNS Zone Editor
2. Delete duplicate record
3. Add new record with correct value

### Issue 2: DNS Records Not Showing Up (After 2+ Hours)

**Cause**: Incorrect record format or propagation delay

**Solution**:
1. Go back to Hostinger DNS Zone Editor
2. Verify records are there and values are EXACT (no extra spaces, quotes, etc.)
3. Check record names:
   - DKIM: `mail._domainkey` (NOT `mail._domainkey.eywademo.cloud`)
   - SPF: `@` or blank
   - DMARC: `_dmarc` (NOT `_dmarc.eywademo.cloud`)
4. Wait another 2 hours
5. Use https://dnschecker.org to check propagation globally

### Issue 3: Brevo Shows "Not Authenticated"

**Cause**: DNS values don't match what Brevo expects

**Solution**:
1. In Brevo dashboard, find the domain verification page
2. Click **"View DNS records"** or similar
3. Compare Brevo's expected values with what you added in Hostinger
4. Ensure EXACT match (copy/paste to avoid typos)
5. If different, edit DNS records in Hostinger
6. Wait 1-2 hours and check again

### Issue 4: SPF Record Conflict

**Cause**: Multiple SPF records (only ONE allowed)

**Solution**:
1. In Hostinger DNS Zone Editor, search for TXT records with `v=spf1`
2. Delete all SPF records
3. Create ONE new SPF record with merged value:
   ```
   v=spf1 include:_spf.google.com include:spf.brevo.com ~all
   ```
   (Include all your email services in one record)

### Issue 5: Can't Access Email Inbox for Verification

**Cause**: Don't have email account for `png.greenfees@eywademo.cloud`

**Solution A: Create Email Account in Hostinger**
1. In hPanel, go to **Emails** → **Email Accounts**
2. Create email: `png.greenfees@eywademo.cloud`
3. Set password
4. Access webmail: https://webmail.hostinger.com
5. Check for Brevo verification email

**Solution B: Use Email Forwarding**
1. In hPanel, go to **Emails** → **Forwarders**
2. Create forwarder: `png.greenfees@eywademo.cloud` → your personal email
3. Brevo verification will forward to your email

### Issue 6: Emails Still Going to Spam (After 24 Hours)

**Cause**: Sender reputation building OR content issues

**Solution**:
1. Verify all 3 DNS records show "PASS" in email headers
2. Check mail-tester.com score (should be 9/10+)
3. Build reputation slowly:
   - Send 10-20 emails first day
   - Increase volume gradually over 1-2 weeks
4. Avoid spam trigger words in subject/content
5. Ensure professional HTML formatting

---

## Hostinger-Specific Notes

### DNS Record Format in Hostinger

Hostinger's DNS Zone Editor has these quirks:

1. **Name field**: Enter ONLY the subdomain, NOT the full domain
   - ✅ Correct: `mail._domainkey`
   - ❌ Wrong: `mail._domainkey.eywademo.cloud`

2. **TTL**: Usually defaults to 14400 (4 hours) or 3600 (1 hour)
   - Either is fine for TXT records

3. **Value field**: Some Hostinger interfaces add quotes automatically
   - If you see quotes, leave them (Hostinger handles it)
   - Don't add your own quotes

4. **Record limits**: Hostinger allows long TXT values (up to 4096 characters)
   - DKIM records are fine even though they're long

### Where to Find DNS Zone Editor

Different Hostinger panel versions:

**hPanel (Current)**:
- Domains → Manage → DNS / Name Servers → DNS Zone Editor

**Old cPanel**:
- Advanced DNS Zone Editor

**Can't find it?**
- Contact Hostinger support chat
- Ask: "Where do I add TXT records for email authentication?"

---

## Success Checklist

After completing all steps, verify:

- [ ] 3 DNS records added in Hostinger (DKIM, SPF, DMARC)
- [ ] Wait 1-2 hours for DNS propagation
- [ ] MXToolbox shows all 3 records
- [ ] Brevo dashboard shows domain authenticated (green checkmarks)
- [ ] Sender email `png.greenfees@eywademo.cloud` verified
- [ ] Test email sent from system
- [ ] Test email delivered to inbox (not spam)
- [ ] Mail-tester.com score: 9/10 or 10/10
- [ ] Email headers show DKIM=pass, SPF=pass, DMARC=pass

---

## Quick Commands for Verification

```bash
# Check if DNS records are live (from your terminal)
dig TXT mail._domainkey.eywademo.cloud +short
dig TXT eywademo.cloud +short | grep spf
dig TXT _dmarc.eywademo.cloud +short

# All in one command
echo "DKIM:" && dig TXT mail._domainkey.eywademo.cloud +short && \
echo "SPF:" && dig TXT eywademo.cloud +short | grep spf && \
echo "DMARC:" && dig TXT _dmarc.eywademo.cloud +short
```

---

## Timeline Summary

| Step | Time | What Happens |
|------|------|--------------|
| Get DNS records from Brevo | 5 min | Copy 3 records |
| Add records in Hostinger | 10 min | Manual entry |
| **Wait for propagation** | **1-4 hours** | **DNS spreads globally** |
| Verify in Brevo | 2 min | Auto verification |
| Verify sender email | 5 min | Email confirmation |
| Test email | 10 min | Send and check |
| **Total** | **1-5 hours** | |

---

**Next Steps**:
1. ✅ Get DNS records from Brevo (Part 1)
2. ✅ Add 3 records in Hostinger (Part 2)
3. ⏳ Wait 1-2 hours for DNS propagation (Part 3)
4. ✅ Verify records (Parts 4-5)
5. ✅ Test email delivery (Part 7)

Once DNS is verified in Brevo, your email authentication is complete and you're ready for production!
