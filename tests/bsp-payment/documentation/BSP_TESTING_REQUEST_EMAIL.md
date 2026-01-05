# Email to BSP Bank PNG - Testing Request & Assistance

**To:** servicebsp@bsp.com.pg
**CC:** BSP Digital Testing Team
**Subject:** GreenPay DOKU Integration - Ready for Testing & Assistance Required

---

## Email Template

```
Dear BSP Digital Testing Team,

RE: GreenPay Payment Gateway Integration - Testing Readiness & Support Request

We are pleased to inform you that the Climate Change Development Authority's GreenPay
payment system integration with BSP DOKU payment gateway has been completed and is
ready for your testing and evaluation.

────────────────────────────────────────────────────────────
INTEGRATION READINESS STATUS
────────────────────────────────────────────────────────────

We have successfully implemented and security-hardened the DOKU Hosted Payment Pages
API (v1.29) integration. Our technical readiness assessment is as follows:

✓ Technical Implementation Complete
  • DOKU Hosted Payment Pages API v1.29 fully implemented
  • WORDS signature generation and verification operational
  • Payment session creation functioning correctly
  • Webhook endpoints configured and secured
  • IP whitelisting implemented for DOKU servers

✓ Security Compliance Achieved
  • PCI-DSS compliant (SAQ A eligible - no card data storage)
  • OWASP Top 10 security standards implemented
  • Server infrastructure hardened to banking industry standards
  • TLS 1.2+ encryption with strong cipher suites
  • Rate limiting and intrusion detection active
  • Comprehensive security audit completed (report available upon request)

✓ Integration Endpoints Configured
  • Test Website: https://greenpay.eywademo.cloud/buy-online
  • Notify Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify
  • Redirect Webhook: https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect

────────────────────────────────────────────────────────────
TESTING ENVIRONMENT DETAILS
────────────────────────────────────────────────────────────

Current Configuration:
• Environment: DOKU Staging
• Mall ID: 11170 (test credentials provided)
• Shared Key: [configured as provided]
• Server IP Whitelisting: DOKU staging IPs configured (103.10.130.75, 147.139.130.145)
• SSL Certificate: Valid (Let's Encrypt, expires February 2026)

────────────────────────────────────────────────────────────
TESTING RESULTS & CHALLENGES ENCOUNTERED
────────────────────────────────────────────────────────────

We have conducted comprehensive testing and wish to report the following:

SUCCESSFUL COMPONENTS:
✓ Payment session creation working correctly
✓ DOKU hosted payment page loads successfully
✓ All required form parameters generated correctly
✓ WORDS signature calculation verified
✓ Webhook endpoints responding appropriately
✓ Security controls functioning as designed

CHALLENGES REQUIRING ASSISTANCE:

1. Payment Transaction Processing
   Status: Payment page loads successfully, but test transactions are being declined
   Error Message: "We are sorry that we could not process your request"

   Testing Conducted:
   • Tested with standard test card: 4111 1111 1111 1111
   • Tested with multiple card variations
   • All technical parameters verified correct
   • WORDS signature confirmed accurate

   Possible Causes Identified:
   a) Test merchant account (Mall ID 11170) may require activation for transaction
      processing in staging environment
   b) Our production currency (PGK - code 598) may not be enabled in test environment

   We successfully tested with IDR currency (code 360) and the payment page loads
   without errors, suggesting the integration is technically sound but may require
   merchant account or currency configuration on your side.

────────────────────────────────────────────────────────────
ASSISTANCE REQUESTED
────────────────────────────────────────────────────────────

To proceed with testing and validation, we kindly request your assistance with
the following:

1. MERCHANT ACCOUNT ACTIVATION
   Could you please confirm if test merchant account (Mall ID 11170) is fully
   activated for processing test transactions in the DOKU staging environment?

   If activation is required, please advise on the timeline for completion.

2. CURRENCY SUPPORT CLARIFICATION
   Our production requirement is to process payments in Papua New Guinea Kina
   (PGK, ISO code 598).

   Questions:
   a) Is PGK currency (code 598) supported in the DOKU staging environment?
   b) If not, should we proceed directly to production environment testing for
      PGK currency validation?
   c) Are there specific test card numbers we should use with Mall ID 11170 that
      differ from standard test cards?

3. TESTING REQUIREMENTS CONFIRMATION
   Please confirm or provide the following for your testing process:

   a) Testing Timeline
      • Estimated duration for your testing phase (you mentioned 10 days previously)
      • Start date for formal testing
      • Any specific testing windows or schedules we should be aware of

   b) Testing Credentials
      • Should we use different test credentials than Mall ID 11170?
      • Do you require any additional API credentials or access?

   c) Testing Scope
      • Specific test scenarios you will execute
      • Expected transaction volumes during testing
      • Any specific card types or payment methods to support

   d) Success Criteria
      • What constitutes successful completion of testing?
      • Are there specific security or compliance checks we should prepare for?
      • Any documentation or reports required from our side?

   e) Production Migration
      • What is the process for obtaining production credentials after successful
        testing?
      • Timeline for production environment activation
      • Any additional requirements for production deployment

4. TECHNICAL SUPPORT CONTACT
   Could you please provide:
   • Direct technical contact for integration issues during testing
   • Escalation path for urgent issues
   • Preferred communication channel (email, phone, ticketing system)

────────────────────────────────────────────────────────────
DOCUMENTATION PROVIDED
────────────────────────────────────────────────────────────

We have prepared comprehensive documentation for your review:

1. Integration Implementation Summary
   • Complete technical specification of our DOKU implementation
   • API integration details and flow diagrams
   • Error handling and logging procedures

2. Security Audit Report
   • PCI-DSS compliance assessment
   • OWASP Top 10 security verification
   • Infrastructure security hardening documentation
   • Ready for submission upon request

3. Server Security Configuration
   • Firewall rules and IP whitelisting
   • SSL/TLS configuration details
   • Webhook security implementation

All documentation is available in digital format and can be provided immediately
upon request via email or secure file transfer.

────────────────────────────────────────────────────────────
NEXT STEPS
────────────────────────────────────────────────────────────

We are ready to begin testing immediately upon resolution of the merchant account
activation and currency configuration questions.

Proposed Timeline:
1. Receive your guidance on the challenges outlined above
2. Complete any required configuration changes
3. Conduct initial validation with your team
4. Proceed with your formal 10-day testing process
5. Address any issues identified during testing
6. Obtain approval for production deployment

We are committed to ensuring a successful integration and are available to work
closely with your team throughout the testing process.

────────────────────────────────────────────────────────────
CONTACT INFORMATION
────────────────────────────────────────────────────────────

For technical matters or urgent issues during testing:
• Technical Team: [Your Email]
• Phone: [Your Phone Number]
• Available: [Your Business Hours]

We appreciate your support and partnership in bringing secure online payment
capabilities to Papua New Guinea's environmental conservation initiatives.

Thank you for your attention to this matter. We look forward to your guidance
and to commencing the testing phase.


Kind regards,

[Your Name]
[Your Title]
Climate Change Development Authority
GreenPay Payment System
```

---

## Email Sending Checklist

Before sending, please:

- [ ] Replace `[Your Email]` with actual contact email
- [ ] Replace `[Your Phone Number]` with actual phone
- [ ] Replace `[Your Business Hours]` with availability
- [ ] Replace `[Your Name]` and `[Your Title]` with actual details
- [ ] Review and adjust tone if needed for your relationship with BSP
- [ ] Keep copy of sent email for records
- [ ] Have documentation ready to send if BSP requests it (BSP_COMPLIANCE_AUDIT_REPORT.md, etc.)

---

## Follow-up Strategy

**If no response in 3 business days:**
```
Subject: RE: GreenPay DOKU Integration - Testing Readiness (Follow-up)

Dear BSP Digital Testing Team,

I hope this message finds you well.

I am following up on my email sent on [date] regarding the GreenPay DOKU
payment gateway integration testing.

We remain ready to begin testing and would appreciate your guidance on the
merchant account activation and currency configuration questions outlined
in our previous correspondence.

Please let us know if you require any additional information or if there
is a better contact person for this matter.

Thank you for your attention.

Kind regards,
[Your Name]
```

**If no response in 7 business days:**
- Call BSP main line: +675 3201212
- Request to speak with Digital Banking or Payment Gateway Integration team
- Reference Mall ID 11170 and DOKU integration project

---

## Alternative: Shorter Version (If Preferred)

```
Dear BSP Digital Testing Team,

RE: GreenPay DOKU Integration - Testing Ready, Assistance Required

The Climate Change Development Authority's GreenPay payment system has completed
integration with BSP DOKU payment gateway and is ready for testing.

INTEGRATION STATUS:
✓ DOKU API v1.29 fully implemented
✓ PCI-DSS compliant, security-hardened
✓ Payment page loading successfully
✓ Webhooks configured

TEST CREDENTIALS:
• Mall ID: 11170
• Environment: DOKU Staging
• URLs: https://greenpay.eywademo.cloud/buy-online

ASSISTANCE NEEDED:
We are experiencing transaction declines during testing. Payment page loads
correctly, but transactions fail with "We are sorry that we could not process
your request."

Testing conducted:
• Standard test cards (4111 1111 1111 1111) - declined
• IDR currency (360) - payment page loads successfully
• PGK currency (598) - payment page loads, transactions decline

QUESTIONS:
1. Is Mall ID 11170 activated for processing test transactions?
2. Is PGK currency (598) supported in staging, or should we test in production?
3. Are there specific test card numbers for Mall ID 11170?
4. What are your testing requirements and timeline?

We are ready to begin formal testing immediately upon your guidance.

Integration documentation and PCI-DSS compliance report available upon request.

Thank you for your assistance.

Kind regards,
[Your Name]
Climate Change Development Authority
Email: [Your Email] | Phone: [Your Phone]
```

---

## Key Points Covered

✅ Professional tone suitable for banking institution
✅ Clear statement of readiness
✅ Detailed technical accomplishments
✅ Specific challenges with evidence
✅ Concrete questions requiring answers
✅ Demonstrates due diligence and preparation
✅ Respectful request for assistance
✅ Clear next steps proposed
✅ Contact information provided
✅ No sensitive credentials exposed

---

**Recommendation:** Use the full version for initial contact. It demonstrates
thoroughness and professionalism while covering all bases. Use the shorter
version for follow-ups if needed.
