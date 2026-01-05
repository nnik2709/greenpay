import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

const defaultContent = `
PNG Airport Green Pass for Foreign Passport Holders

The Climate Change & Development Authority (CCDA) of Papua New Guinea is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you purchase and use PNG Airport Green Pass vouchers.

Who We Are
Data Controller: Climate Change & Development Authority (CCDA), Papua New Guinea Government Agency
Contact Information: Email: info@ccda.gov.pg | Phone: +675 [to be confirmed] | Postal: [Full Address], Port Moresby, NCD, Papua New Guinea
Authority: CCDA operates under the authority of the PNG Government and administers the Airport Green Pass program for environmental conservation and climate change mitigation.

Scope of This Policy
Applies to:
- Online purchase of PNG Airport Green Pass vouchers via greenpay.eywademo.cloud
- Personal information provided during purchase process
- Use of vouchers at PNG airports
- Customer service and support interactions
- Communications from CCDA regarding your purchase
Does NOT cover:
- Information collected by airlines, airports, or immigration authorities
- Third-party websites linked from our site
- BSP bank or payment card issuer privacy practices

Information We Collect
Information You Provide Directly:
- Passport information: full name, passport number, country of issue, expiry date, date of birth, nationality
- Contact information: email, phone (optional), mailing address (if provided)
- Travel information: intended departure date (optional), departure airport, flight details (if provided)
- Payment information: provided directly to BSP IPG; CCDA receives only transaction reference, approval code, last 4 digits, payment status; CCDA does not store full card numbers or CVV

Information Collected Automatically:
- Technical: IP address, device type, OS, browser, date/time, pages visited, referrer
- Transaction data: transaction ID, date/time, amount paid (PGK), payment method type, payment status
- Cookies: session/functional/analytics (no advertising/marketing cookies)

Information from Third Parties:
- BSP IPG: payment confirmation, fraud prevention signals
- PNG Immigration & Customs: entry/exit records when voucher used
- Airlines: flight confirmation/manifests (if provided)

How We Use Your Information
Primary Purposes:
- Voucher processing and issuance; verify eligibility; email/download voucher
- Payment processing via BSP IPG; prevent duplicate charges; process refunds; maintain financial records
- Government compliance: verify airport exit requirements; share with Immigration/Customs as required; audits
- Customer support: inquiries, refund requests, technical issues, replacements
Secondary Purposes:
- Fraud prevention and security; detect duplicate/fraudulent purchases; protect system integrity
- Statistical/reporting (anonymized)
- Legal obligations: tax, audits, anti-money laundering
- Service improvement: fix bugs, improve payments and support

Payment Processing & BSP IPG
- BSP IPG handles card processing. CCDA cannot access or store full card data.
- Security: PCI-DSS Level 1, SSL/TLS encryption, 3D Secure where applicable, tokenization, fraud monitoring.
- BSP has its own privacy policy; by using BSP IPG you agree to BSP terms.

Sharing Your Information
- Government agencies (PNG Immigration, Customs, Civil Aviation, IRC) as required by law
- BSP for payment/refund processing and fraud prevention
- IT service providers (hosting, email, database, security)
- Airport authorities for voucher verification
- Airlines (limited, with consent or as required)
- Law enforcement under valid orders
- Not shared for marketing; not sold to third parties; no social tracking

Data Security
- Technical safeguards: SSL/TLS, encrypted storage, hashed passwords, firewalls, IDS, regular patching, vulnerability scanning
- Access controls: role-based, MFA for staff, audit logs, periodic reviews
- Organizational: staff privacy training, confidentiality agreements, incident response, vendor due diligence
- Physical: secure data centers, access controls, backups and DR
- Your responsibilities: keep voucher codes confidential, use secure devices, report suspected fraud
- No system is 100% secure; use is at your own risk

Data Retention
- Financial records: minimum 7 years (PNG tax)
- Immigration/airport records: as required by PNG authorities
- Logs: access ~90 days, security ~1 year, error logs ~6 months
- Support/refund records: per operational/legal need
- When retention ends: securely deleted or anonymized

Your Privacy Rights
- Access, correction, deletion (subject to legal retention), objection, portability where applicable
- Some requests may be limited by PNG legal requirements
- To exercise rights: email info@ccda.gov.pg with details and proof of identity

Cookies & Tracking
- Essential cookies for sessions and security
- Functional cookies for preferences
- Optional analytics (no advertising cookies; you can decline)

International Data Transfers
- Primary storage PNG; some processing in Australia (hosting)
- Payment processing via international card networks
- Safeguards: encryption, access controls, contractual protections

Children's Privacy
- Green pass required for all travelers; parents/guardians provide information for minors; CCDA does not knowingly collect directly from children

Data Breach Notification
- CCDA will investigate, assess risk, notify affected users within 72 hours if high risk, and report to authorities as required

Third-Party Links
- CCDA is not responsible for third-party site practices; review their policies

Contact & Complaints
- Email: info@ccda.gov.pg
- Phone: +675 [to be confirmed]
- Postal: Climate Change & Development Authority, Port Moresby, PNG
- Complaints may be escalated to PNG regulators; disputes subject to PNG courts

Updates
- CCDA may update this policy; material changes posted with effective date; continued use = acceptance
`;

const renderFormatted = (text) => {
  const lines = text.split('\n');
  const blocks = [];
  let list = [];

  const flushList = (keyBase) => {
    if (list.length) {
      blocks.push(
        <ul key={`list-${keyBase}`} className="list-disc list-inside space-y-1 text-sm text-slate-700">
          {list.map((item, idx) => (
            <li key={`li-${keyBase}-${idx}`}>{item}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((line, idx) => {
    const t = line.trim();
    if (!t) {
      flushList(idx);
      return;
    }
    if (t.startsWith('- ')) {
      list.push(t.slice(2));
    } else {
      flushList(idx);
      const isNumbered = /^[0-9]+(\.|:)/.test(t);
      blocks.push(
        <p key={`p-${idx}`} className="text-sm text-slate-700 leading-6">
          {isNumbered ? <strong>{t}</strong> : t}
        </p>
      );
    }
  });
  flushList('end');
  return blocks;
};

const Privacy = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.settings.getPublic();
        if (data?.privacyContent) {
          setContent(data.privacyContent);
        }
      } catch (err) {
        console.error('Failed to load privacy content', err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6 text-slate-800 whitespace-pre-wrap">
      <h1 className="text-3xl font-bold text-emerald-700">Privacy Policy</h1>
      <div className="space-y-3">{renderFormatted(content)}</div>
    </div>
  );
};

export default Privacy;

