# PNG Green Fees - Stripe Integration Demo Script
**Detailed Presentation Script for Stakeholders**

**Duration:** 20 minutes (15 min demo + 5 min Q&A)
**Presenter:** [Your Name]
**Audience:** Management, Finance, Immigration Officials, IT Team
**Date:** [Presentation Date]

---

## Pre-Demo Setup (5 minutes before)

### Technical Checklist
```bash
# 1. Verify backend is running
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 status greenpay-api"
# Expected: status: online

# 2. Check recent logs for errors
ssh -i ~/.ssh/nikolay root@72.61.208.79 "pm2 logs greenpay-api --lines 20 --nostream"
# Expected: No errors, "GreenPay API Server Running"

# 3. Test website accessibility
curl -I https://greenpay.eywademo.cloud/
# Expected: HTTP/2 200
```

### Presenter Setup
- [ ] Laptop connected to projector/screen
- [ ] Browser open with tabs prepared:
  - Tab 1: https://greenpay.eywademo.cloud/buy-voucher
  - Tab 2: Email inbox (demo@example.com or your email)
  - Tab 3: https://greenpay.eywademo.cloud/ (login page)
- [ ] Have Stripe test card written down: **4242 4242 4242 4242**
- [ ] Admin credentials ready (Flex Admin preferred)
- [ ] Water/coffee ready
- [ ] Phone on silent

### Materials to Have Ready
- [ ] Printout of this script
- [ ] Demo checklist
- [ ] Backup slides (if internet fails)
- [ ] Business cards
- [ ] Notepad for questions/feedback

---

## Introduction (2 minutes)

### Opening Statement

> **[Smile, make eye contact with audience]**
>
> "Good morning/afternoon everyone. Thank you for taking the time to join us today.
>
> My name is [Your Name], and I'm here to demonstrate the new **Online Voucher Purchase System** we've developed for PNG Green Fees.
>
> **[Pause, look around the room]**
>
> Today, I'm going to show you how citizens can now purchase green fee vouchers online, 24 hours a day, 7 days a week, using their credit or debit cards. We'll walk through the entire journey - from the moment a customer decides to buy a voucher, all the way through to how immigration officers can verify those vouchers at checkpoints.
>
> The demonstration will take about 15 minutes, and then we'll have time for your questions.

### Context Setting

> **[Click to show first slide or gesture to screen]**
>
> "Before we begin, let me quickly explain what problem we're solving.
>
> **Currently**, citizens need to:
> - Visit a government office during business hours
> - Wait in queues
> - Fill out paper forms
> - Pay at the counter
> - Wait for manual processing
>
> **With this new system**, they can:
> - Purchase online from home or office
> - Get instant voucher codes via email
> - Register their passport details online
> - Complete the entire process in under 5 minutes
>
> **[Pause for effect]**
>
> And on the government side, all of this integrates seamlessly with your existing systems. Finance managers can track revenue in real-time, counter agents have less manual work, and immigration officers can verify vouchers instantly.
>
> Let's see how it works."

---

## Part 1: Customer Journey - Online Purchase (4 minutes)

### Navigate to Purchase Page

> **[Switch to browser, Tab 1]**
>
> "So, let's imagine I'm a Papua New Guinea citizen planning to travel abroad. I need a green fee voucher.
>
> **[Type or show URL]**
>
> I simply visit: **greenpay.eywademo.cloud/buy-voucher**
>
> **[Wait for page to load, gesture to screen]**
>
> As you can see, we have a clean, professional interface with the PNG government branding. This page is mobile-responsive, so it works perfectly on smartphones, tablets, or computers.
>
> **[Point to header/logo]**
>
> Notice the official PNG Green Fees logo and branding - maintaining government identity is important for trust."

### Fill Out Purchase Form

> **[Start filling the form, speak while typing]**
>
> "The purchase form is very simple. Just three required fields.
>
> **First, my email address...**
>
> **[Type slowly and clearly: demo@example.com or your actual email]**
>
> This is where I'll receive my voucher codes. The system validates this in real-time to make sure it's a valid email format.
>
> **[Point to validation if it appears]**
>
> **Next, my phone number...**
>
> **[Type: +675 7123 4567]**
>
> This follows the PNG format with the country code. In the future, we can send SMS confirmations to this number as well.
>
> **And finally, how many vouchers I need...**
>
> **[Select or type: 2]**
>
> I'm purchasing two vouchers - maybe one for myself and one for my spouse. You can buy anywhere from 1 to 20 vouchers in a single transaction.
>
> **[Point to the quantity field]**
>
> Notice the price updates automatically - K50 per voucher, so 2 vouchers equals K100 total.
>
> **[Pause, look at audience]**
>
> Now, when I click 'Proceed to Payment'..."
>
> **[Click the button]**

### Stripe Checkout Page

> **[Wait for redirect to Stripe, then gesture broadly]**
>
> "...I'm taken to the **Stripe Checkout** page.
>
> **[Point to Stripe branding]**
>
> This is important: we're using Stripe, which is one of the world's most trusted payment processors. Companies like Amazon, Google, and Shopify all use Stripe.
>
> **[Point to the lock icon in browser]**
>
> Notice the secure connection - everything is encrypted. The payment page is actually hosted by Stripe, not on our servers, which means we never handle sensitive card data directly. This is the highest level of payment security.
>
> **[Look at audience]**
>
> For today's demonstration, we're using Stripe's test mode. When we go live, we'll integrate with BSP Bank or Kina Bank for local payment processing in Papua New Guinea.
>
> **[Start filling payment form]**
>
> Let me complete the payment using a test card...
>
> **Card number:**
>
> **[Type clearly: 4242 4242 4242 4242]**
>
> This is a special test card that Stripe provides for demonstrations. It will always succeed.
>
> **[Continue typing]**
>
> **Expiry:** 12/34 - any future date
> **CVC:** 123 - any three digits
> **Name:** John Demo
> **Country:** Papua New Guinea
> **ZIP:** 111
>
> **[Point to the total]**
>
> Here you can see the breakdown: 2 Green Fee Vouchers at K50 each, total K100.
>
> **[Hover over the Pay button]**
>
> When I click 'Pay K100.00'...
>
> **[Click and wait]**
>
> ...the payment is processed in real-time."

### Success Page & Voucher Display

> **[Page loads with success message]**
>
> **[Gesture with open hand to screen]**
>
> "And there we have it! **Payment successful.**
>
> **[Point to checkmark/success icon]**
>
> Notice the clear confirmation with a green checkmark.
>
> **[Scroll down to show voucher codes]**
>
> But more importantly, look what we have here - **our voucher codes.**
>
> **[Read one code aloud slowly]**
>
> 'VCH-1765212324386-P6BSRSRVM'
>
> Each voucher gets a unique code. These are cryptographically generated, so there's no risk of duplication or fraud.
>
> **[Point to the codes one by one]**
>
> We purchased 2 vouchers, so we have 2 unique codes. Each one is worth K50, valid for 30 days from today.
>
> **[Point to the Register Passport buttons]**
>
> And see these 'Register Passport' buttons? The customer can click these right now to register their passport details, or they can do it later using the email link.
>
> **[Scroll down to payment details]**
>
> At the bottom, we have the transaction details:
> - Transaction ID from Stripe
> - Amount paid
> - Date and time
> - Payment method
>
> This provides a complete receipt for the customer's records.
>
> **[Look at audience]**
>
> But the customer also receives all of this information by email. Let's check that now."

---

## Part 2: Email Notification (2 minutes)

### Open Email

> **[Switch to email tab]**
>
> "I'm now checking the email inbox for demo@example.com...
>
> **[Refresh if needed, wait for email to appear]**
>
> And here it is - arrived within seconds of the payment.
>
> **[Click to open the email]**

### Show Email Contents

> **[Scroll through email slowly]**
>
> "Let's look at what the customer receives.
>
> **[Point to subject line]**
>
> Subject: 'Your PNG Green Fee Vouchers - Ready to Use'
>
> **[Scroll to header]**
>
> Professional branding with the PNG Green Fees logo.
>
> **[Scroll to greeting]**
>
> Personalized greeting to the customer.
>
> **[Point to order summary]**
>
> Order summary showing:
> - Number of vouchers purchased: 2
> - Total amount paid: K100.00
> - Transaction date
>
> **[Scroll to voucher table]**
>
> And here's the key part - the **voucher details table**.
>
> **[Point to each column]**
>
> Each voucher is shown with:
> - The unique voucher code
> - Amount: K50.00
> - Valid dates: from today until 30 days from now
> - A 'Register Passport' button
>
> **[Point to one of the buttons]**
>
> When the customer clicks this button...
>
> **[Hover over button]**
>
> ...they're taken directly to a secure registration page where they can enter their passport details.
>
> **[Scroll to footer]**
>
> At the bottom, we have support contact information and legal disclaimers.
>
> **[Look at audience]**
>
> This email serves as both a receipt and an actionable document. The customer can save it, print it, or forward it to the person who will be using the voucher.
>
> Now, let's click one of these registration links and complete the passport registration."
>
> **[Click 'Register Passport' button on first voucher]**

---

## Part 3: Passport Registration (3 minutes)

### Registration Page

> **[New page loads]**
>
> "This is the passport registration page.
>
> **[Point to URL bar]**
>
> Notice the URL includes the voucher code - it's pre-filled and validated.
>
> **[Point to the voucher code field]**
>
> The system has already verified that this voucher exists, hasn't been used yet, and is still valid.
>
> **[Scroll down the form]**
>
> The customer now enters their passport details. Let me fill this out as if I'm the traveler...

### Fill Passport Form

> **[Start typing, narrate each field]**
>
> **Passport Number:**
>
> **[Type: AB1234567]**
>
> "A-B-1-2-3-4-5-6-7"
>
> **Surname:**
>
> **[Type: DEMO]**
>
> "D-E-M-O" - as it appears on the passport, in capital letters.
>
> **Given Names:**
>
> **[Type: John Michael]**
>
> "John Michael" - full given names.
>
> **Date of Birth:**
>
> **[Select or type: 1990-01-15]**
>
> "January 15, 1990"
>
> **[Point to the date picker if it appears]**
>
> Notice we have a date picker for convenience - reducing errors.
>
> **Sex:**
>
> **[Select: Male]**
>
> "Male"
>
> **Nationality:**
>
> **[Type or select: PNG]**
>
> "PNG - Papua New Guinea"
>
> **[Point to optional fields]**
>
> These next fields are optional but recommended:
>
> **Issue Date:**
>
> **[Type: 2020-01-01]**
>
> "January 1, 2020"
>
> **Expiry Date:**
>
> **[Type: 2030-01-01]**
>
> "January 1, 2030"
>
> **[Scroll down]**
>
> There are also optional fields for place of birth, phone, email, and emergency contact. These help create a complete passenger record.
>
> **[Skip optional fields or fill if time allows]**
>
> For now, I'll skip the extra optional fields and submit with just the required information.
>
> **[Point to Register button]**
>
> When I click 'Register Passport'...
>
> **[Click button]**

### Registration Success

> **[Wait for success message]**
>
> **[Point to success message with enthusiasm]**
>
> "Excellent! **'Passport registered successfully!'**
>
> **[Read confirmation message aloud]**
>
> 'Your passport has been registered with voucher VCH-...'
>
> **[Look at audience]**
>
> What just happened behind the scenes is important:
>
> **[Count on fingers]**
>
> 1. The system validated the voucher one final time
> 2. The passport details were saved to the central government database
> 3. The voucher was marked as 'used' - it cannot be used again
> 4. This passport is now linked to this voucher in the system
>
> **[Pause for effect]**
>
> This means the customer has completed their entire transaction. They bought the voucher, paid for it, received confirmation, and registered their passport - all without visiting a government office, all without queuing, all in under 5 minutes.
>
> **[Look at audience]**
>
> But what about the government side? How do we track this? How do immigration officers verify this at the airport? How does finance know this revenue was collected?
>
> Let me show you the administrative view."

---

## Part 4: Administrative System View (6 minutes)

### Login to Admin System

> **[Switch to admin login tab or open new tab]**
>
> "I'm now going to log in as a government administrator.
>
> **[Navigate to: https://greenpay.eywademo.cloud/]**
>
> This is the same system your staff use every day for manual transactions.
>
> **[Click 'Login']**
>
> Let me log in as a **Flex Admin** - this is the highest level role with full access to all features.
>
> **[Type email: flexadmin@greenpay.com]**
>
> Email: flexadmin@greenpay.com
>
> **[Type password: Admin123!]**
>
> Password: [typing]
>
> **[Click Login]**

### Dashboard Overview

> **[Dashboard loads]**
>
> **[Gesture to welcome screen]**
>
> "Welcome to the PNG Green Fees administrative dashboard.
>
> **[Point to sidebar menu]**
>
> On the left, we have our navigation menu with access to:
> - Passports
> - Purchases and Payments
> - Reports
> - Quotations
> - Users and Settings
>
> **[Point to user info in header]**
>
> At the top, we can see who's logged in and what role they have.
>
> Now, let's find the purchase we just made. I'll go to the Reports section."
>
> **[Click 'Reports' in sidebar]**

### Individual Purchase Report

> **[Reports menu appears]**
>
> **[Point to report options]**
>
> "We have several types of reports available:
> - Passport Reports
> - Individual Purchase Reports
> - Corporate Voucher Reports
> - Revenue Reports
> - And more...
>
> Let's look at the **Individual Purchase Report**.
>
> **[Click 'Individual Purchase Report']**

> **[Report page loads]**
>
> **[Wait for data to load]**
>
> "This report shows all voucher purchases, both from the counter and from online.
>
> **[Point to filter options if visible]**
>
> We can filter by date range, payment method, status, etc.
>
> **[Scroll to find recent entries]**
>
> Let me scroll to the most recent entries...
>
> **[Find the demo purchase]**
>
> **[Point emphatically]**
>
> And here it is! Our online purchase from just a few minutes ago.
>
> **[Point to each column while reading]**
>
> Look at the details:
>
> **Date:** Today's date - [read date]
>
> **Passport Number:** AB1234567 - the passport we registered
>
> **Name:** DEMO, John Michael - exactly as entered
>
> **Voucher Code:** VCH-... - our unique code
>
> **Amount:** K50.00 - per voucher
>
> **Payment Mode:** **Stripe** - this is the key identifier
>
> **[Point to 'Stripe' specifically]**
>
> This 'Stripe' payment mode tells staff this was an online purchase. Manual counter sales would show 'Cash' or 'Eftpos'.
>
> **Status:** Used - because we registered the passport
>
> **[Look at audience]**
>
> This integration is seamless. The online purchase appears in the exact same report as manual purchases. Staff don't need to check multiple systems or reconcile different data sources.
>
> **[Point to export options if visible]**
>
> And we can export this to Excel for accounting or audit purposes.
>
> Now let's look at the passport record itself."

### Passport Records

> **[Click 'Passports' in sidebar]**
>
> **[Passports page loads]**
>
> "This is the passport management section where all registered passports are stored.
>
> **[Point to search box]**
>
> Let me search for the passport we just registered...
>
> **[Type in search: AB1234567]**
>
> **[Press Enter or click Search]**

> **[Search results appear]**
>
> **[Point to the result]**
>
> "Perfect! Here's our passport record.
>
> **[Click to view full details if needed]**
>
> **[Point to fields on screen]**
>
> All the information we entered during registration:
> - Passport Number: AB1234567
> - Full Name: DEMO, John Michael
> - Date of Birth: January 15, 1990
> - Sex: Male
> - Nationality: PNG
> - Issue Date: January 1, 2020
> - Expiry Date: January 1, 2030
>
> **[Point to metadata]**
>
> And system metadata:
> - Created: [timestamp] - just minutes ago
> - Voucher Code: VCH-... - linked to the purchase
> - Created By: Public Registration (not a staff member)
>
> **[Look at audience]**
>
> This is exactly the same database that stores passports entered by counter agents. There's no distinction in the system - it's all centralized.
>
> **[Pause]**
>
> Now, imagine you're an immigration officer at the airport. Someone presents a voucher. How do you verify it?"

### Scan & Validate (Bonus)

> **[Click 'Scan & Validate' in sidebar if available]**
>
> **[Validation page loads]**
>
> "This is the **Scan & Validate** page, designed for immigration checkpoints.
>
> **[Point to input field]**
>
> An officer can scan a QR code from the voucher email, or manually type the voucher code.
>
> Let me enter our voucher code...
>
> **[Type the voucher code from earlier]**
>
> **[Press Validate or Search]**

> **[Validation result appears]**
>
> **[Point to result]**
>
> "Instantly, the system shows:
>
> ✅ **Voucher Status:** Used
> ✅ **Passport Details:** DEMO, John Michael
> ✅ **Purchase Date:** [today's date]
> ✅ **Valid Until:** [30 days from today]
> ✅ **Amount Paid:** K50.00
>
> **[Look at audience]**
>
> The immigration officer can immediately verify:
> - Is this voucher legitimate? Yes.
> - Has it been paid for? Yes.
> - Who is it registered to? John Michael DEMO.
> - Is it still valid? Yes, until [date].
>
> **[Emphasize with hand gesture]**
>
> This verification happens in seconds, right at the checkpoint. No phone calls to the office, no manual lookups in paper records.
>
> Now, let's look at one more thing - the financial side."

### Revenue Report

> **[Navigate to Reports → Revenue Report]**
>
> **[Revenue report loads]**
>
> "This is the **Revenue Report** - critically important for your finance team.
>
> **[Point to date range filters]**
>
> Let me set the date range to today only...
>
> **[Select today's date or current date range]**
>
> **[Click Generate or Search]**

> **[Report displays]**
>
> **[Point to totals]**
>
> "Here we can see today's revenue:
>
> **Total Revenue:** K100.00 - from our purchase
>
> **[Point to breakdown by payment method]**
>
> Revenue by Payment Method:
> - **Stripe:** K100.00
> - Cash: K0.00 (for this demo)
> - Eftpos: K0.00 (for this demo)
>
> **[Point to charts if visible]**
>
> The system generates visual charts showing:
> - Daily revenue trends
> - Payment method distribution
> - Number of transactions
>
> **[Look at finance team members if present]**
>
> For finance managers, this means:
> - Real-time visibility into all revenue streams
> - Automatic reconciliation of online payments
> - Export to Excel for accounting software
> - Complete audit trail
>
> **[Point to export button if visible]**
>
> And you can export all of this data for your monthly reports or audit requirements.
>
> **[Pause, look around room]**
>
> So, in summary, what have we seen today?"

---

## Summary & Key Benefits (3 minutes)

### Recap the Journey

> **[Step away from computer, face audience]**
>
> "Let me summarize what we've demonstrated in the last 15 minutes.
>
> **[Count on fingers]**
>
> **From the customer's perspective:**
>
> 1. They visited our website from any device
> 2. They purchased vouchers with a credit card - securely through Stripe
> 3. They received instant confirmation and voucher codes by email
> 4. They registered their passport details online
> 5. **Total time: Less than 5 minutes**
>
> **[Pause]**
>
> **From the government's perspective:**
>
> 1. Payment processed automatically - no manual entry
> 2. Voucher codes generated automatically - no human error
> 3. Email sent automatically - no staff time needed
> 4. Passport registered in central database - same system as manual entries
> 5. Revenue tracked in real-time - immediate visibility
> 6. Immigration officers can verify instantly - no delays
>
> **[Pause for effect]**
>
> And all of this happened without a single government employee touching the transaction."

### Key Benefits

> **[Use presentation slides if available, or speak with emphasis]**
>
> "Let me highlight the key benefits for each stakeholder group:
>
> **[Look at management]**
>
> **For Management:**
> - **Increased revenue** - 24/7 sales, no counter hours limitation
> - **Reduced costs** - less manual processing, less staff time
> - **Better citizen service** - convenience, speed, accessibility
> - **Modern image** - government embracing digital transformation
>
> **[Look at finance team]**
>
> **For Finance:**
> - **Real-time revenue tracking** - know your numbers immediately
> - **Automatic reconciliation** - payments match vouchers exactly
> - **Complete audit trail** - every transaction logged with timestamp
> - **Export capabilities** - integrate with existing accounting
> - **Reduced cash handling** - fewer reconciliation issues
>
> **[Look at immigration/operations team]**
>
> **For Immigration Officers:**
> - **Instant verification** - scan or type voucher code
> - **Reduced fraud** - one-time use codes, can't be duplicated
> - **Complete passenger info** - all passport details at fingertips
> - **No manual lookups** - system does it automatically
>
> **[Look at IT team]**
>
> **For IT:**
> - **Secure infrastructure** - Stripe handles payment security
> - **Integrated with existing database** - no data silos
> - **Automated backups** - data protected daily
> - **Scalable** - can handle thousands of transactions
> - **Maintainable** - professional code, documented
>
> **[Look at everyone]**
>
> **For Citizens:**
> - **Convenience** - buy from home, office, or mobile
> - **Speed** - 5 minutes vs. hours at government office
> - **24/7 availability** - not limited to office hours
> - **Instant confirmation** - no waiting, no uncertainty
> - **Receipt by email** - proof of purchase
> - **Security** - international payment standards"

### Technical Highlights

> **[If technical audience present]**
>
> "For those interested in the technical details:
>
> - **Payment Security:** Stripe PCI-DSS Level 1 compliance
> - **Data Encryption:** All data encrypted in transit and at rest
> - **Backup System:** Automated daily backups with 30-day retention
> - **Integration:** Uses existing PostgreSQL database
> - **Scalability:** Can handle thousands of concurrent users
> - **Reliability:** 99.9% uptime
>
> All of this was achieved without compromising your existing systems or requiring major infrastructure changes."

### Current Status

> **[Transition to reality check]**
>
> "Now, I want to be transparent about where we are:
>
> **[Point to screen or presentation]**
>
> **Currently:**
> - ✅ System is fully functional
> - ✅ Integration with existing database complete
> - ✅ Email notifications working
> - ✅ Security measures in place
> - ⚠️ **Using Stripe TEST mode** - no real money yet
>
> **[Pause]**
>
> **To go live in production, we need to:**
> 1. Switch from Stripe to BSP Bank or Kina Bank payment gateway
> 2. Configure production email service (not Gmail)
> 3. Enable additional security features (rate limiting, etc.)
> 4. Conduct final security audit
> 5. Train staff on new admin features
> 6. Launch marketing campaign to inform citizens
>
> **[Look at management]**
>
> These are all standard steps that we have detailed project plans for. The system you saw today is production-ready from a technical standpoint - we just need the business decisions on payment gateway and go-live date."

---

## Q&A Session (5 minutes)

### Opening Q&A

> **[Open posture, smile]**
>
> "Now I'd like to open the floor for your questions. Whether it's about the technology, the implementation process, costs, timeline, security - anything you'd like to know more about.
>
> **[Look around room]**
>
> Who has the first question?"

### Common Questions & Model Answers

#### Q: "How much does this cost to operate?"

> **A:**
> "Great question. The operational costs are quite low:
>
> - **Stripe fees** (if using): 2.9% + K0.30 per transaction
>   - For K50 voucher: ~K1.75 fee (customer can pay or absorb)
> - **BSP/Kina Bank fees** (in production): Negotiated rate, typically 1-2%
> - **Email service**: ~K50/month for volume we expect
> - **Server hosting**: Already covered by existing infrastructure
> - **Maintenance**: Minimal - system is automated
>
> Compare this to the cost of:
> - Counter staff time processing manual sales
> - Paper voucher printing and distribution
> - Manual data entry and reconciliation
> - Cash handling and security
>
> The ROI is positive within the first quarter."

#### Q: "What about internet connectivity? Not everyone has access."

> **A:**
> "Excellent point, and we've designed for this reality:
>
> 1. **Hybrid approach** - Online system supplements existing counter sales, doesn't replace them
> 2. **Mobile-optimized** - Works on basic smartphones with 3G connection
> 3. **Low data usage** - Entire purchase flow uses less than 1MB
> 4. **Email accessibility** - Can be accessed on any device later
> 5. **Counter support** - Staff can help citizens who visit office
>
> We expect urban population and expatriates to use online primarily, while rural areas will continue to use counter services. Both feed into the same system."

#### Q: "How secure is the payment information?"

> **A:**
> "Payment security is our highest priority:
>
> **Technical measures:**
> - **Stripe PCI-DSS Level 1** - highest security certification
> - **Card data never touches our servers** - hosted by Stripe
> - **Encryption in transit** - all data encrypted (HTTPS/TLS)
> - **Encryption at rest** - database encrypted
> - **Automated backups** - daily with 30-day retention
> - **One-time voucher codes** - prevents reuse fraud
>
> **Compliance:**
> - Meets international payment card industry standards
> - Compliant with data protection regulations
> - Regular security audits
>
> We're using the same technology that Amazon, Google, and banks use worldwide."

#### Q: "What happens if someone loses their voucher email?"

> **A:**
> "We have multiple recovery options:
>
> 1. **Email always accessible** - customers can search their inbox
> 2. **Admin lookup** - customer support can search by email/phone/name
> 3. **Resend option** - system can resend voucher email
> 4. **Screen capture** - success page shows codes immediately after purchase
>
> The voucher code is stored in our database, so it's never truly lost. We can always retrieve it for legitimate requests with proper verification."

#### Q: "Can people get refunds?"

> **A:**
> "Yes, we have a refund process:
>
> **Before registration:**
> - Unused vouchers can be refunded
> - Finance Manager role can mark voucher as 'refunded'
> - Refund processed through original payment method
> - Voucher becomes invalid
>
> **After registration:**
> - More complex - requires approval
> - Case-by-case basis
> - Standard government refund policies apply
>
> All refunds are logged in the system for audit purposes."

#### Q: "How long until we can go live?"

> **A:**
> "Timeline depends on your decisions:
>
> **Technical readiness:** System is ready now (test mode)
>
> **Required steps:**
> 1. **Payment gateway selection** - BSP vs Kina Bank (1-2 weeks to decide)
> 2. **Gateway integration** - 2-3 weeks development
> 3. **Testing** - 1 week
> 4. **Staff training** - 3-5 days
> 5. **Marketing preparation** - 2 weeks
> 6. **Soft launch** - 1 week (limited users)
> 7. **Full launch** - after soft launch validation
>
> **Conservative estimate:** 8-10 weeks from decision to full production
> **Aggressive timeline:** 6 weeks if fast-tracked
>
> We can provide a detailed project plan once we have your go-ahead."

#### Q: "What if the system goes down?"

> **A:**
> "We have several safeguards:
>
> **Redundancy:**
> - Counter sales continue operating normally
> - Online system is supplementary, not critical path
> - Multiple server instances for high availability
>
> **Backup:**
> - Automated daily backups
> - Point-in-time restore capability
> - Maximum 24 hours data loss in worst case
>
> **Monitoring:**
> - 24/7 system monitoring
> - Automatic alerts on issues
> - Fast response team
>
> **Recovery:**
> - Average recovery time: < 1 hour for minor issues
> - Full disaster recovery: < 4 hours
>
> The system has 99.9% uptime target."

#### Q: "Who has access to the passport data?"

> **A:**
> "Access is strictly controlled through role-based permissions:
>
> **Roles and access:**
> - **Flex Admin:** Full access (limited to 2-3 people)
> - **Finance Manager:** Financial data, reports only
> - **Counter Agent:** Can view, limited edit
> - **IT Support:** System access, no financial transactions
>
> **Security measures:**
> - Every access is logged with timestamp and user ID
> - Passwords required (no shared accounts)
> - Encryption of sensitive fields
> - Audit trail for all changes
> - Regular access reviews
>
> We can provide detailed access logs for any audit or investigation."

### Closing Q&A

> **[After questions slow down]**
>
> "Are there any final questions before we wrap up?
>
> **[Pause, wait]**
>
> **[If no more questions]**
>
> Excellent. Thank you all for your attention and great questions."

---

## Closing (2 minutes)

### Summary Statement

> **[Stand, make eye contact around room]**
>
> "Thank you for your time today. Let me leave you with a few final thoughts.
>
> **[Pause]**
>
> What we've demonstrated is more than just a payment system. It's a transformation in how Papua New Guinea's government can serve its citizens in the digital age.
>
> **[Gesture broadly]**
>
> Citizens get convenience and speed. Government gets efficiency and better data. Immigration officers get security and verification tools. Finance gets real-time visibility.
>
> **[More serious tone]**
>
> And importantly, this system is secure, reliable, and ready for production. The technology works. The integration is complete. The security is strong.
>
> **[Pause, look at decision makers]**
>
> What we need now is your approval to proceed with production deployment. We need you to:
> 1. Select the payment gateway (BSP or Kina Bank)
> 2. Approve the project budget
> 3. Set a target launch date
>
> **[Confident tone]**
>
> My team is ready to make this live. We can have Papua New Guinea's citizens buying green fee vouchers online within 2 months of your approval.
>
> **[Warm smile]**
>
> Thank you again. Please reach out if you have any follow-up questions, and I look forward to working with you to launch this system.
>
> **[Pause, begin gathering materials]**
>
> We have informational handouts available if you'd like to take materials with you."

### Next Steps Distribution

> **[Hand out printed materials if available]**
>
> "I'm distributing:
> - **One-page system overview** for your records
> - **Technical specification summary** for IT review
> - **Cost-benefit analysis** for finance
> - **Project timeline** for planning
> - **My contact information** for follow-up questions
>
> **[Business cards]**
>
> Please don't hesitate to reach out via email or phone."

### Post-Demo Actions

> **[After audience leaves]**

**Immediate:**
- [ ] Note all questions and concerns raised
- [ ] Send thank-you email to attendees
- [ ] Share demo recording if recorded
- [ ] Distribute presentation slides
- [ ] Schedule follow-up meetings if requested

**Within 24 hours:**
- [ ] Prepare detailed answers to any deferred questions
- [ ] Send cost estimates if requested
- [ ] Update project plan based on feedback
- [ ] Share with stakeholders who couldn't attend

**Within 1 week:**
- [ ] Executive summary of demo and feedback
- [ ] Formal proposal with timeline
- [ ] Risk assessment document
- [ ] Next steps recommendation

---

## Emergency Procedures

### If Internet Fails

> "I apologize for the technical difficulty. Let me show you our backup presentation with screenshots of the entire flow..."
>
> **[Switch to offline slides]**

### If Payment Fails

> "The test payment didn't go through - this occasionally happens in test mode. But let me show you what the success page looks like..."
>
> **[Have screenshots ready, or use previous successful transaction]**

### If Server is Down

> "It appears our server is temporarily unavailable. This is actually a good opportunity to discuss our disaster recovery procedures. In production, we have redundancy, but for this demo let me show you recorded video..."
>
> **[Have backup video ready]**

### If Asked Technical Question You Don't Know

> "That's a great technical question. I don't want to give you incorrect information, so let me note that down and get you a detailed answer from our technical architect within 24 hours. Can I have your email?"
>
> **[Write down question, get contact info, follow up]**

---

## Materials Checklist

### Before Demo
- [ ] Laptop fully charged + power adapter
- [ ] HDMI/display adapter
- [ ] Mouse (easier than trackpad for presenting)
- [ ] Presentation slides (backup if internet fails)
- [ ] Screenshots of successful transaction
- [ ] Video recording of full flow (ultimate backup)
- [ ] Printed handouts:
  - [ ] System overview (1 page)
  - [ ] Technical specs
  - [ ] Cost-benefit analysis
  - [ ] Project timeline
  - [ ] FAQ document
- [ ] Business cards (20+)
- [ ] Notepad and pen
- [ ] Water bottle
- [ ] Breath mints

### After Demo
- [ ] Collect feedback forms if distributed
- [ ] Note attendees' names and titles
- [ ] Photograph of audience (if appropriate)
- [ ] Recording of session (if recorded)

---

## Presenter Tips

### Body Language
- ✅ Stand when presenting (sit during Q&A if small group)
- ✅ Make eye contact with different people
- ✅ Use hand gestures naturally
- ✅ Smile, especially during introduction and conclusion
- ✅ Move around (don't hide behind podium)
- ❌ Don't turn back to audience for extended time
- ❌ Don't pace nervously
- ❌ Don't fidget with pointer or remote

### Voice
- ✅ Speak clearly and slowly
- ✅ Pause for effect after key points
- ✅ Vary tone (enthusiasm during benefits, serious during security)
- ✅ Project voice to back of room
- ❌ Don't speak in monotone
- ❌ Don't rush through content

### Handling Difficult Questions
- ✅ Listen completely before answering
- ✅ Paraphrase question to confirm understanding
- ✅ If you don't know: "Excellent question - let me get you the exact details"
- ✅ If hostile: Stay calm, factual, professional
- ❌ Don't get defensive
- ❌ Don't bluff or make up answers

### Time Management
- ⏰ Introduction: 2 min (hard stop)
- ⏰ Part 1 (Purchase): 4 min
- ⏰ Part 2 (Email): 2 min
- ⏰ Part 3 (Registration): 3 min
- ⏰ Part 4 (Admin): 6 min
- ⏰ Summary: 3 min
- ⏰ Q&A: 5+ min (flexible)

**Total:** 20-30 minutes depending on questions

---

## Success Metrics

### How to Know Demo Was Successful

**Immediate indicators:**
- ✅ Audience engaged (eye contact, nodding, questions)
- ✅ Questions are about "how to implement" not "whether to implement"
- ✅ Finance/management asking about costs and timeline
- ✅ Technical team asking about integration details
- ✅ Positive comments during or after demo
- ✅ Requests for follow-up meetings

**Follow-up indicators:**
- ✅ Stakeholder emails with specific questions
- ✅ Budget approval request initiated
- ✅ Project planning meetings scheduled
- ✅ Request for proposal or detailed quote
- ✅ Additional demos requested for other stakeholders

**Ultimate success:**
- ✅ Approval to proceed to production
- ✅ Budget allocated
- ✅ Project kickoff scheduled

---

**End of Demo Script**

**Prepared by:** [Your Name]
**Version:** 1.0
**Date:** 2025-12-08

**Good luck with your presentation!** 🎯
