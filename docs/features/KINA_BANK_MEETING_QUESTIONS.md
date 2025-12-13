# Kina Bank Payment Integration - Meeting Questions

## Overview

This document contains professional questions and information requests for the Kina Bank payment integration meeting. The goal is to integrate Kina Bank payment services (including POS terminals) with the PNG Green Fees system.

---

## 1. API & Technical Integration

### What payment gateway APIs do you offer? (REST, SOAP, SDK)
**Why this matters:** Our system is built on React with modern JavaScript. REST APIs with JSON are ideal for our stack. SOAP would require additional XML parsing libraries and increase complexity. Understanding available options helps us plan the integration architecture and estimate development time accurately.

### Do you provide a sandbox/test environment? What is the credentials process?
**Why this matters:** We cannot test payment integrations in production - it's too risky. A sandbox environment allows us to thoroughly test all scenarios (successful payments, failures, edge cases) without processing real money. This is critical for quality assurance and reduces go-live risks.

### What authentication method is required? (API keys, OAuth 2.0, certificates, HMAC signatures)
**Why this matters:** Different authentication methods have different security implications and implementation complexity. API keys are simple but less secure. OAuth 2.0 requires token management. Certificates require SSL configuration. HMAC signatures need careful implementation of cryptographic hashing. This affects our security architecture and development timeline.

### What are the API rate limits and timeout thresholds?
**Why this matters:** During peak hours or bulk corporate purchases, we might make multiple API calls quickly. If there are strict rate limits, we need to implement queuing or throttling. Timeout thresholds help us design proper error handling - if a payment takes longer than expected, we need to know when to retry vs. when to fail gracefully.

### Do you support webhooks/callbacks for payment status notifications?
**Why this matters:** Without webhooks, we'd need to constantly poll Kina Bank's servers to check payment status (inefficient and resource-intensive). Webhooks allow Kina Bank to notify us immediately when a payment succeeds or fails, enabling real-time updates to our users and database. Essential for good user experience.

### What data formats are supported? (JSON, XML)
**Why this matters:** JSON is native to JavaScript and our React/Node.js stack. XML would require additional parsing libraries (like xml2js) and increases code complexity. JSON support means faster development and easier debugging.

### Is there a client-side SDK for browser integration, or server-side only?
**Why this matters:** Client-side SDK could allow direct browser-to-bank communication (like Stripe.js), improving security by never having card data touch our servers. Server-side only means we must handle sensitive data, increasing our PCI DSS compliance burden. This fundamentally affects our security architecture.

---

## 2. POS Terminal Integration

### What POS terminal models will be provided?
**Why this matters:** Different POS models have different capabilities, connectivity options (WiFi, Ethernet, Bluetooth), and software requirements. Knowing the exact model helps us understand physical setup requirements, available integration methods, and any hardware limitations we need to work around.

### How does the POS integrate with our web application?
**Why this matters:** This is the core architectural question. Three main options exist:
- **Direct API call**: Our server sends payment request directly to POS - requires network configuration
- **Cloud-based gateway**: POS connects to Kina Bank cloud, we communicate via their API - more reliable but adds latency
- **Local network integration**: POS and our application on same network - fastest but requires careful network setup

Each has different reliability, speed, and complexity trade-offs that affect our implementation approach.

### What is the transaction flow? (initiate → confirm → receipt)
**Why this matters:** We need to understand the exact sequence of events to design our user interface and backend logic. For example:
1. User clicks "Pay" - what API call do we make?
2. POS displays amount - does it wait for card insertion?
3. Customer swipes/taps card - how are we notified?
4. Transaction approved - what confirmation do we receive?
5. Receipt printed - can we customize it?

Each step needs corresponding code in our application.

### How are transaction IDs correlated between our system and the POS?
**Why this matters:** We need to match every payment in our database with the corresponding Kina Bank transaction. If a customer disputes a charge, we must locate the exact transaction. If IDs don't correlate properly, reconciliation becomes a nightmare and we risk financial discrepancies.

### What happens if POS loses connectivity during transaction?
**Why this matters:** Network failures happen, especially in PNG where connectivity can be unstable. We need to handle scenarios like:
- Payment deducted from customer but our system doesn't receive confirmation
- Payment initiated but never completed
- Double-charging risks

Without clear protocols, we risk financial losses, customer complaints, and accounting nightmares.

### Can we receive real-time transaction status from the POS?
**Why this matters:** Counter agents need immediate feedback. If they click "Process Payment" and wait 30 seconds with no feedback, they might click again (causing duplicate charges) or assume it failed. Real-time status updates ("Card inserted", "Processing", "Approved") provide essential user feedback and prevent errors.

---

## 3. Transaction Types & Features

### Supported transaction types (Card payments, Mobile money, Bank transfers)
**Why this matters:** PNG has diverse payment preferences. Some customers prefer cards (Visa/Mastercard), others use mobile money services popular in PNG. Supporting multiple payment types increases accessibility and customer satisfaction. We need to build different UI flows for each payment type.

### Do you support pre-authorization/capture (for quotations)?
**Why this matters:** Our quotation workflow requires this. When a corporate client requests a quote, we want to pre-authorize the amount (verify funds are available) but not charge until the quote is approved. This prevents the embarrassment of approved quotes that fail at payment. Common in hospitality and enterprise scenarios.

### Partial payments - can customers pay in installments?
**Why this matters:** Some corporate clients may want to pay large batches in installments. Government contracts sometimes require milestone-based payments. If supported, we need to track partial payment status, remaining balances, and payment schedules in our database.

### Refund/void/reversal process - API or manual?
**Why this matters:** Mistakes happen - wrong amount charged, customer changes mind, duplicate payment processed. We need to know:
- Can we initiate refunds via API (automated) or must we call Kina Bank (manual)?
- What's the difference between void (same-day cancellation) and refund (next-day return)?
- How long do refunds take to process?

This affects our customer service capabilities and user interface design.

### Multi-currency support (PGK and foreign currencies)?
**Why this matters:** Foreign tourists visiting PNG may want to pay in USD, AUD, or other currencies. Currency conversion at POS is convenient for customers but introduces exchange rate considerations. We need to display correct amounts and handle potential currency conversion fees.

### Maximum/minimum transaction limits?
**Why this matters:** Corporate batch payments for hundreds of passports could be large sums. If there's a K50,000 limit per transaction, we'd need to split into multiple transactions. Minimum limits might prevent small payments. These constraints directly impact our business logic and user interface.

---

## 4. Security & Compliance

### PCI DSS compliance level - what are our obligations?
**Why this matters:** Payment Card Industry Data Security Standard (PCI DSS) has strict requirements for anyone handling card data. Non-compliance can result in:
- Fines up to $100,000/month
- Loss of ability to process cards
- Legal liability for breaches

Understanding our compliance level (SAQ A, SAQ A-EP, SAQ D) determines what security controls we must implement - from simple (hosted payment page) to complex (full cardholder data environment).

### Do we handle card data directly or is it tokenized by Kina Bank?
**Why this matters:** If card numbers pass through our servers, we have massive security responsibility and PCI DSS scope. Tokenization means Kina Bank converts card numbers to random tokens before we see them - dramatically reducing our security burden. This is the #1 factor determining our security architecture and compliance costs.

### What encryption standards are required (TLS version, etc.)?
**Why this matters:** Older TLS versions (1.0, 1.1) have known vulnerabilities. Modern security requires TLS 1.2 minimum, preferably TLS 1.3. Our server and Supabase configuration must meet these requirements. If we're using outdated encryption, we're vulnerable to man-in-the-middle attacks that could expose payment data.

### IP whitelisting requirements?
**Why this matters:** If Kina Bank requires API calls only from specific IP addresses, we must use static IPs on our VPS. Dynamic IPs won't work. This affects our hosting configuration and potentially costs (static IPs often cost extra). We need to provide our server IP addresses during onboarding.

### How are credentials rotated/managed?
**Why this matters:** Security best practice is rotating API keys/credentials periodically (every 90 days typically). We need to know:
- How to generate new credentials
- How much notice before old ones expire
- Can we have multiple active credentials for zero-downtime rotation?

Poor credential management is a common security vulnerability.

### Fraud detection mechanisms available?
**Why this matters:** Payment fraud is real, especially in government systems. Kina Bank may offer:
- Velocity checks (too many transactions too fast)
- Geographic restrictions
- Amount anomaly detection
- 3D Secure verification

Understanding available protections helps us decide what additional fraud prevention we need to build ourselves.

---

## 5. Settlement & Reconciliation

### Settlement timeframes - T+1, T+2?
**Why this matters:** T+1 means money arrives in our bank account one business day after transaction. T+2 means two days. This affects:
- Cash flow planning for government operations
- When we mark payments as "settled" vs "pending"
- Financial reporting accuracy

Longer settlement times mean more complex accounting and potential cash flow challenges.

### What reconciliation reports are provided? (daily, per transaction)
**Why this matters:** Every night, our Finance Manager needs to verify that all payments in our system match what Kina Bank processed. Reconciliation reports show:
- Every transaction processed
- Any discrepancies
- Fees deducted
- Net settlement amount

Without good reports, manual reconciliation is tedious and error-prone.

### API for fetching transaction history and settlement reports?
**Why this matters:** If we can fetch reports via API, we can automate reconciliation - huge time saver. Our system can automatically compare our database with Kina Bank records nightly. Without API access, someone must manually download and compare reports, increasing labor costs and error risk.

### How are disputed transactions handled?
**Why this matters:** Chargebacks (customer disputes) are complex:
- Customer claims they didn't make purchase
- We need to provide evidence (receipt, signature, etc.)
- We might lose the money if we can't prove legitimacy

Understanding the dispute process helps us maintain proper records and respond quickly to protect revenue.

### What fees apply? (per transaction, monthly, setup)
**Why this matters:** Fees directly impact project budget and ongoing operational costs. Typical fee structure:
- Setup fee: One-time cost (K500-5000?)
- Monthly fee: Fixed recurring cost
- Per-transaction fee: Percentage (1.5-3%) plus fixed amount (K0.50-2.00)

We need this for financial planning and potentially to factor into green fee pricing.

### Separate merchant accounts needed for different payment types?
**Why this matters:** If POS terminals and online payments need separate merchant accounts:
- Double the paperwork and approval process
- Separate reconciliation streams
- Potentially different fee structures
- More complex accounting

One unified merchant account simplifies everything significantly.

---

## 6. Error Handling & Support

### Complete list of error codes and their meanings
**Why this matters:** When a payment fails, we need to tell the user exactly why:
- "E001: Insufficient funds" → "Card declined - insufficient funds"
- "E002: Card expired" → "This card has expired"
- "E003: Invalid CVV" → "Security code incorrect"

Generic "Payment failed" messages frustrate users and increase support calls. Specific messages help users fix issues themselves.

### Retry policies for failed transactions
**Why this matters:** Some failures are temporary (network glitch), others permanent (stolen card blocked). We need to know:
- Which errors are retryable?
- How many retry attempts allowed?
- What delay between retries?
- Do retries count against rate limits?

Wrong retry logic could mean lost sales (not retrying when we should) or wasted resources (retrying hopeless cases).

### Timeout handling - what happens if no response?
**Why this matters:** If our API call to Kina Bank hangs with no response for 60 seconds:
- Did the payment go through or not?
- Is customer charged or not?
- Should we retry or wait?

This "unknown state" is the most dangerous scenario in payments - risk of double-charging or missed payments. We need explicit guidance on handling this.

### Technical support availability (24/7, business hours?)
**Why this matters:** If our payment system breaks at 8 PM on Saturday:
- Is support available?
- How do we reach them?
- What's the expected response time?

For government services that may operate extended hours, 24/7 support availability is important for business continuity.

### Escalation process for integration issues
**Why this matters:** During development, we'll likely hit technical blockers. Knowing the escalation path:
- First contact: Basic support
- Technical issues: Developer support
- Critical blockers: Engineering team

Speeds up issue resolution and prevents project delays.

### SLA guarantees for API uptime
**Why this matters:** Service Level Agreement defines guaranteed uptime (99.9% = 8.76 hours downtime/year, 99.99% = 52 minutes/year). This affects:
- Our system's reliability
- Our SLA to end users
- Compensation if Kina Bank fails to meet SLA

We can't promise better uptime than our payment provider offers.

---

## 7. Documentation & Onboarding

### Comprehensive API documentation (request/response samples)
**Why this matters:** Good documentation includes:
- Every API endpoint explained
- Required parameters and data types
- Example request JSON
- Example response JSON
- Error scenarios

Poor documentation means guessing, trial-and-error, and wasted development time. Complete docs could save weeks of work.

### Integration guide with code examples (preferably JavaScript/Node.js)
**Why this matters:** Code examples in our language (JavaScript) provide:
- Correct syntax for API calls
- Proper error handling patterns
- Security best practices
- Common pitfalls to avoid

PHP or Java examples would require translation, potentially introducing errors.

### Postman collection or similar for testing
**Why this matters:** Postman collection provides pre-built API requests we can execute immediately:
- Test each endpoint without writing code
- Verify responses match documentation
- Debug issues faster
- Share test scenarios with team

Accelerates development significantly.

### Sample merchant account for development
**Why this matters:** We need credentials to start development immediately. Waiting weeks for account approval delays the entire project. Sample/sandbox credentials let developers start integration work while formal paperwork processes.

### Certification/go-live checklist
**Why this matters:** Before going live, Kina Bank will verify our integration:
- Security checks passed
- All scenarios tested
- Proper error handling
- Compliance requirements met

Knowing these requirements upfront prevents surprises at launch time. We can ensure we meet all criteria during development, not after.

### Timeline for merchant account approval
**Why this matters:** Government merchant accounts often require:
- Business registration verification
- Bank account validation
- Compliance checks
- Management approval

If this takes 4-6 weeks, we need to start the process immediately while developing. Timeline affects our entire project schedule.

---

## 8. Government/Enterprise Requirements

### Experience with government payment systems in PNG?
**Why this matters:** If Kina Bank has integrated with other PNG government systems:
- They understand compliance requirements
- Familiar with government procurement processes
- Know common pitfalls
- Can provide relevant references

Previous government experience indicates smoother integration and fewer surprises.

### Bulk payment reconciliation capabilities
**Why this matters:** Corporate clients may upload 500 passports at once. We need to:
- Process as single transaction or multiple?
- Track individual passport fees within bulk payment
- Generate itemized receipts
- Handle partial failures in bulk

Bulk capabilities prevent us from building complex workarounds.

### Audit trail requirements - what logs are retained?
**Why this matters:** Government financial systems require complete audit trails:
- Who initiated each transaction
- When exactly it occurred
- What amount was processed
- Any modifications made

For audits and legal compliance, we need to know what Kina Bank logs vs. what we must log ourselves.

### Data residency - where is transaction data stored?
**Why this matters:** PNG government data sovereignty laws may require:
- Data stored within PNG borders
- Not transferred to foreign servers
- Specific retention periods

If Kina Bank stores data in Australia or Singapore, this could violate regulations. Critical for compliance.

### Compliance with PNG financial regulations
**Why this matters:** PNG has specific financial regulations:
- Bank of PNG requirements
- Anti-money laundering (AML) laws
- Know Your Customer (KYC) requirements
- Tax reporting obligations

We need to ensure our integration meets all local legal requirements.

### Receipt/invoice generation standards
**Why this matters:** Government receipts must include specific information:
- Tax identification numbers
- Official receipt numbers
- Legal business name
- Specific formatting

If Kina Bank generates receipts, we need to verify they meet PNG government standards. If not, we generate our own and must ensure compliance.

---

## Information to Request from Kina Bank

1. **API Documentation** (PDF or developer portal access)
   - *Needed to understand all available endpoints and begin technical planning*

2. **Sandbox credentials** and test card numbers
   - *Required to start development and testing without risk*

3. **Sample integration code** (Node.js/JavaScript preferred)
   - *Accelerates development by providing working examples*

4. **POS terminal specifications** and setup guide
   - *Needed to plan hardware setup and network configuration*

5. **Fee structure document** (setup, monthly, per-transaction)
   - *Required for budget planning and financial projections*

6. **Service Level Agreement** (SLA) template
   - *Defines uptime guarantees and support commitments*

7. **Merchant application forms**
   - *Start approval process immediately to avoid delays*

8. **Security compliance checklist**
   - *Ensures we meet all security requirements before go-live*

9. **Contact details** for technical integration team
   - *Direct line to developers for quick issue resolution*

10. **Timeline** for complete integration (sandbox → production)
    - *Realistic schedule for project planning*

---

## Our System Details to Share with Kina Bank

### Technical Stack
- **Frontend**: React 18 with Vite
  - *Modern JavaScript framework requiring JSON API*
- **Backend**: Supabase (PostgreSQL database)
  - *Cloud-hosted database with real-time capabilities*
- **Hosting**: VPS with PM2 and Nginx
  - *Linux server, we control IP addresses and SSL*
- **Authentication**: Supabase Auth with role-based access control
  - *Multiple user types will interact with payments*

### Payment Scenarios
1. **Individual Purchases** - Single passport green fee payments
   - *Simplest case: one customer, one payment, one receipt*

2. **Corporate Batch Payments** - Multiple passports in bulk
   - *Complex case: one payment covering hundreds of passports*

3. **Quotation Payments** - Pre-approved quotations converted to payments
   - *Requires pre-authorization/hold capabilities*

4. **POS Terminal Payments** - In-person payments at counter
   - *Physical card present, requires terminal integration*

### Requirements
- Real-time payment status updates *(webhooks essential)*
- Transaction audit trail and logging *(compliance requirement)*
- Reconciliation reporting *(daily financial verification)*
- Receipt generation *(government-compliant receipts)*
- Refund/void capabilities *(error correction)*
- Multi-user access with different roles *(not all staff can refund)*

### Expected Volumes
- Estimated daily transactions: [TO BE FILLED]
- Average transaction amount: [TO BE FILLED]
- Peak usage periods: [TO BE FILLED]

---

## Meeting Agenda Template

1. **Introduction** (10 min)
   - Overview of PNG Green Fees system
   - Payment integration goals

2. **Technical Discussion** (30 min)
   - API capabilities and integration options
   - POS terminal setup and configuration
   - Security and compliance requirements

3. **Commercial Terms** (15 min)
   - Fee structure
   - Settlement terms
   - Support SLA

4. **Implementation Timeline** (15 min)
   - Sandbox access
   - Development phase
   - Testing and certification
   - Go-live schedule

5. **Next Steps** (10 min)
   - Documentation handover
   - Technical contact assignment
   - Follow-up meeting schedule

---

## Notes Section

*Use this space to document answers during the meeting:*

### API Details
-

### POS Terminal
-

### Fees & Settlement
-

### Timeline
-

### Action Items
-

---

## Contact Information

**Kina Bank Technical Team:**
- Name:
- Email:
- Phone:

**Our Team:**
- Technical Lead:
- Project Manager:
- Developer:

---

*Document prepared for Kina Bank integration meeting*
*Last updated: November 2025*
