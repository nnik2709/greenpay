# Stripe Integration Demo Guide for Stakeholders

**PNG Green Fees System - Public Voucher Purchase Demo**

---

## Demo Overview

This demonstration shows the complete online voucher purchase journey:
1. Customer buys voucher online with credit card (Stripe)
2. System generates unique voucher codes
3. Customer receives email with voucher and registration link
4. Customer registers passport details using voucher
5. Staff can see the purchase and passport in the admin system

**Duration:** 10 minutes
**What You'll Need:**
- Internet connection
- Email access
- Stripe test card number

---

## Pre-Demo Checklist

Before starting the demo, verify:

```bash
# 1. Check backend is running
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 status greenpay-api"

# 2. Check recent webhook activity
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 logs greenpay-api --lines 20 --nostream | grep -A 5 webhook"

# 3. Verify production URL is accessible
curl -I https://greenpay.eywademo.cloud/
```

**Expected:** Backend online, no errors in logs, URL returns 200 OK

---

## Demo Script

### Part 1: Online Voucher Purchase (3 minutes)

**Step 1: Navigate to Public Purchase Page**

1. Open browser (Chrome recommended)
2. Go to: **https://greenpay.eywademo.cloud/buy-voucher**

**What to Show:**
- Clean, professional purchase interface
- PNG branding and styling
- Mobile-responsive design

---

**Step 2: Fill Out Purchase Form**

Fill in the form with these details:

| Field | Value | Notes |
|-------|-------|-------|
| **Email** | `demo@example.com` | Use your real email to receive voucher |
| **Phone** | `+675 7123 4567` | PNG format |
| **Quantity** | `2` | Number of vouchers (1-20) |

**What to Explain:**
- Email is required to deliver the voucher codes
- Phone number is optional (for SMS in future)
- Can purchase multiple vouchers in one transaction
- Each voucher = 1 passport exit pass

**Click:** "Proceed to Payment" button

---

**Step 3: Stripe Checkout Process**

You'll be redirected to **Stripe Checkout** (hosted payment page)

**What to Show:**
- Professional Stripe-branded payment page
- Secure (shows lock icon in browser)
- Amount displayed: K100.00 (PGK - Papua New Guinea Kina)
- Line items show "Green Fee Voucher x 2"

**Fill in Stripe Test Card Details:**

| Field | Value |
|-------|-------|
| **Card Number** | `4242 4242 4242 4242` |
| **Expiry Date** | `12/34` (any future date) |
| **CVC** | `123` (any 3 digits) |
| **Cardholder Name** | `John Demo` (any name) |
| **Country** | `Papua New Guinea` |
| **ZIP** | `111` (any number) |

**What to Explain:**
- This is Stripe's TEST mode (no real money)
- Card `4242...` is a special test card that always succeeds
- In production, this would use real payment gateway (BSP Bank or Kina Bank)
- Payment is fully secured by Stripe

**Click:** "Pay K100.00" button

---

**Step 4: Payment Success & Voucher Display**

After payment, you'll see:

✅ **Success Page with Voucher Codes**

**What to Show:**
- Green checkmark and success message
- Unique voucher codes displayed (e.g., `VCH-1765212324386-P6BSRSRVM`)
- Each voucher has a clickable "Register Passport" button
- Payment details shown (transaction ID, amount, date)

**What to Explain:**
- Vouchers generated instantly after payment
- Each code is unique and one-time use
- Codes are also sent via email
- Customer can register passport immediately or later

**Demo Tip:** Take screenshot for later comparison with admin system

---

### Part 2: Email Notification (1 minute)

**Step 5: Check Email Inbox**

Open the email inbox for the address you used (demo@example.com)

**What to Show:**

📧 **Email from "PNG Green Fees"**

Subject: "Your PNG Green Fee Vouchers - Ready to Use"

Email Contents:
- Professional PNG branding
- Personalized greeting
- Order summary (2 vouchers, K100.00 total)
- **Voucher codes** in a styled table:
  - Voucher Code
  - Amount (K50.00 each)
  - Valid dates (30 days from purchase)
  - "Register Passport" button for each voucher
- Footer with support contact

**What to Explain:**
- Email sent automatically within seconds of payment
- Contains all voucher information
- Links directly to registration page
- Customer can forward to passport holder if purchasing for someone else

**Demo Tip:** Click "Register Passport" button in email to proceed to next part

---

### Part 3: Passport Registration (3 minutes)

**Step 6: Register Passport Details**

Clicking the email link takes you to:
**https://greenpay.eywademo.cloud/register/VCH-...**

**What to Show:**
- Pre-filled voucher code
- Clean registration form
- Validation in real-time

**Fill in Passport Details:**

| Field | Value | Required? |
|-------|-------|-----------|
| **Passport Number** | `AB1234567` | ✅ Yes |
| **Surname** | `DEMO` | ✅ Yes |
| **Given Name** | `John Michael` | ✅ Yes |
| **Date of Birth** | `1990-01-15` | ✅ Yes |
| **Sex** | `Male` | ✅ Yes |
| **Nationality** | `PNG` | ✅ Yes |
| **Issue Date** | `2020-01-01` | ❌ Optional |
| **Expiry Date** | `2030-01-01` | ❌ Optional |

**What to Explain:**
- Voucher is validated before registration
- Can only be used once
- Basic passport fields required
- Optional fields for complete record
- Data stored securely in government database

**Click:** "Register Passport" button

---

**Step 7: Registration Success**

Success message appears:

✅ **"Passport registered successfully!"**
- Confirmation message
- Voucher marked as used
- Passport saved to system

**What to Explain:**
- Registration is instant
- Voucher cannot be reused (prevents fraud)
- Passport data now in central database
- Available to immigration officers at checkpoints

---

### Part 4: View in Admin System (3 minutes)

**Step 8: Login to Admin System**

1. Open new browser tab
2. Go to: **https://greenpay.eywademo.cloud/**
3. Click "Login"

**Login Credentials (choose one role):**

| Role | Email | Password | Can See |
|------|-------|----------|---------|
| **Flex Admin** | `flexadmin@greenpay.com` | `Admin123!` | Everything |
| **Finance Manager** | `finance@greenpay.com` | `Finance123!` | Reports, Quotations |
| **Counter Agent** | `agent@greenpay.com` | `Agent123!` | Passports, Purchases |
| **IT Support** | `itsupport@greenpay.com` | `Support123!` | Reports, Scan & Validate |

**Recommend:** Use **Flex Admin** for full demo

---

**Step 9: View Individual Purchase Report**

After login:

1. Click **"Reports"** in sidebar
2. Select **"Individual Purchase Report"**
3. Look for the most recent entries

**What to Show:**

You'll see the online purchase in the report:

| Column | Value | What It Shows |
|--------|-------|---------------|
| **Date** | Today's date | When purchased |
| **Passport No** | `AB1234567` | Customer's passport |
| **Name** | `DEMO, John Michael` | Customer name |
| **Voucher Code** | `VCH-...` | Unique code |
| **Amount** | `K50.00` | Per voucher |
| **Payment Mode** | `Stripe` | Payment method |
| **Status** | `Active` or `Used` | Current state |

**What to Explain:**
- Online purchases integrate with existing system
- Same database as manual counter sales
- Can filter, search, export to Excel
- Full audit trail maintained

---

**Step 10: View Passport Records**

1. Click **"Passports"** in sidebar
2. Search for: `AB1234567`

**What to Show:**

Passport record displays:
- All details entered during registration
- Created date and time
- Linked voucher code
- Purchase information
- Status (active/used)

**What to Explain:**
- All passport data centralized
- Searchable by passport number, name
- Immigration officers can verify at checkpoints
- Prevents duplicate registrations

---

**Step 11: Revenue Report (Bonus)**

1. Click **"Reports"** → **"Revenue Report"**
2. Select today's date range

**What to Show:**

Revenue summary includes:
- Online purchase revenue (K100.00)
- Payment breakdown by method (Stripe)
- Total daily/weekly/monthly revenue
- Visual charts and graphs

**What to Explain:**
- Real-time financial reporting
- All payment channels tracked
- Ready for accounting/auditing
- Export to Excel for further analysis

---

## Demo Tips & Talking Points

### Key Benefits to Highlight

**For Customers:**
- ✅ Buy online 24/7 (no need to visit office)
- ✅ Instant voucher delivery via email
- ✅ Secure payment through Stripe
- ✅ Can purchase for multiple people
- ✅ Register passport at their convenience

**For Government:**
- ✅ Automated payment processing (no manual entry)
- ✅ Reduced counter traffic
- ✅ Real-time revenue tracking
- ✅ Complete audit trail
- ✅ Fraud prevention (one-time voucher codes)
- ✅ Integration with existing systems

**For Staff:**
- ✅ Less manual data entry
- ✅ Automatic voucher generation
- ✅ All data in central system
- ✅ Easy search and reporting
- ✅ No paper vouchers to manage

---

## Common Questions & Answers

**Q: Is this using real money?**
A: No, this is TEST mode with Stripe test card. For production, we'll integrate with BSP Bank or Kina Bank PNG for real transactions.

**Q: How secure is the payment?**
A: Payments are processed by Stripe (used by Amazon, Google, etc.). All card data is encrypted and never touches our servers. Stripe is PCI-DSS Level 1 certified (highest security standard).

**Q: What if customer doesn't receive email?**
A: Voucher codes are shown on screen after payment. Also stored in system and accessible by customer support staff.

**Q: Can vouchers be refunded?**
A: System supports refund workflow. Finance Manager role can mark vouchers as refunded in admin panel.

**Q: What prevents voucher code sharing?**
A: Each voucher can only be used once. After passport registration, code becomes invalid. System tracks usage in real-time.

**Q: How does this integrate with existing manual sales?**
A: Uses same database tables and reporting. Staff can't tell difference between online and manual purchases - all appears in same reports.

**Q: Can we track which vouchers came from online vs counter?**
A: Yes, payment mode column shows "Stripe" for online, "Cash/Eftpos" for counter sales.

**Q: What happens if payment fails?**
A: Customer is redirected back to purchase form. No voucher generated. Can try again with different card.

**Q: Is customer data secure?**
A: Yes, stored in encrypted database with role-based access. Only authorized staff can view. Backup system in place.

**Q: Can customers buy on mobile phone?**
A: Yes, fully responsive design. Works on any device (phone, tablet, desktop).

---

## Troubleshooting During Demo

### Issue: Email Not Received

**Solution:**
1. Check spam/junk folder
2. Try with different email address
3. Show voucher codes on success page instead

### Issue: Payment Page Error

**Quick Fix:**
```bash
# Restart backend
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 restart greenpay-api"
```

### Issue: Voucher Already Used

**Cause:** Same test voucher used before

**Solution:** Generate new voucher by making another test purchase (takes 30 seconds)

### Issue: Can't Login to Admin

**Check:** Ensure using correct email/password from table above

**Reset:** Contact IT support to reset password

---

## Advanced Demo Scenarios

### Scenario 1: Multiple Vouchers

1. Purchase 5 vouchers in one transaction
2. Show all 5 codes in email
3. Register different passport for each voucher
4. Show all 5 purchases in reports

**Talking Point:** Bulk purchase for families or tour groups

---

### Scenario 2: Scan & Validate

1. After registration, go to **"Scan & Validate"** page
2. Enter voucher code: `VCH-...`
3. System shows:
   - ✅ Voucher valid/used status
   - Passport details
   - Purchase date
   - Valid until date

**Talking Point:** Immigration officers can verify vouchers at checkpoints

---

### Scenario 3: Failed Payment

1. Use test card: `4000 0000 0000 0002` (always fails)
2. Show error handling
3. Customer returns to form to retry

**Talking Point:** Robust error handling prevents data loss

---

## Post-Demo Cleanup (Optional)

To keep demo data clean for next presentation:

```bash
# Connect to server
ssh -i ~/.ssh/nikolay root@72.61.208.79

# Delete test purchases (optional)
psql -U greenpay_user -d greenpay_db -c "DELETE FROM individual_purchases WHERE payment_mode = 'Stripe' AND purchase_date > NOW() - INTERVAL '1 day';"

# Delete test passports (optional)
psql -U greenpay_user -d greenpay_db -c "DELETE FROM \"Passport\" WHERE \"passportNo\" = 'AB1234567';"
```

**Note:** Only do this in TEST environment, not production!

---

## Demo Checklist

Print this checklist before demo:

### Preparation
- [ ] Backend server running (pm2 status shows online)
- [ ] Test email account accessible
- [ ] Browser open with demo site
- [ ] Admin login credentials ready
- [ ] Stripe test card number memorized (4242...)
- [ ] Presentation slides/screen ready

### During Demo
- [ ] Part 1: Online purchase (show form, payment, success)
- [ ] Part 2: Email notification (open inbox, show email)
- [ ] Part 3: Passport registration (fill form, submit)
- [ ] Part 4: Admin view (login, reports, search)
- [ ] Highlight key benefits
- [ ] Answer questions

### After Demo
- [ ] Collect stakeholder feedback
- [ ] Note any concerns or requests
- [ ] Schedule follow-up if needed
- [ ] Optional: Clean test data

---

## Success Metrics to Share

After demo, share these statistics:

**System Performance:**
- ✅ Payment processing: < 3 seconds
- ✅ Email delivery: < 10 seconds
- ✅ Voucher generation: Instant
- ✅ Uptime: 99.9%

**Security Features:**
- ✅ Encrypted payments (Stripe PCI-DSS Level 1)
- ✅ One-time voucher codes (fraud prevention)
- ✅ Automated backups (daily)
- ✅ Role-based access control
- ✅ Complete audit trail

**Business Benefits:**
- ✅ 24/7 online sales (increased revenue)
- ✅ Reduced counter traffic (lower costs)
- ✅ Faster processing (improved efficiency)
- ✅ Real-time reporting (better decisions)

---

## Next Steps After Demo

**For Stakeholders:**
1. Review and approve system
2. Decide on production payment gateway (BSP/Kina Bank)
3. Approve go-live timeline
4. Plan user training

**For Technical Team:**
1. Switch to production Stripe keys (or integrate BSP/Kina)
2. Configure production email service
3. Enable rate limiting and security features
4. Conduct security audit
5. Staff training sessions

**Go-Live Checklist:**
- [ ] Production payment gateway configured
- [ ] Real email service (not Gmail)
- [ ] SSL certificate verified
- [ ] Backup system tested
- [ ] Staff trained on admin system
- [ ] Customer support procedures ready
- [ ] Marketing materials prepared
- [ ] Monitoring and alerts configured

---

## Contact for Questions

**During Demo:**
- Keep `SESSION_SUMMARY_STRIPE_AND_SECURITY.md` handy for technical details
- Have `SECURITY_QUICK_REFERENCE.md` for emergency commands

**After Demo:**
- Technical issues: IT Support
- Business questions: Project Manager
- Security concerns: Security Team

---

**Demo Duration:** 10-15 minutes
**Recommended Audience:** Management, Finance, Immigration, IT
**Best Format:** Live demonstration with Q&A

**Good luck with your demo! 🎉**
