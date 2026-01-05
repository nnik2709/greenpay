import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

const defaultContent = `
PNG Airport Green Pass for Foreign Passport Holders

These terms govern the online purchase and use of PNG Airport Green Pass vouchers issued by the Climate Change & Development Authority (CCDA) of Papua New Guinea. By purchasing or using a green pass, you agree to these terms.

1. Purpose & Scope
The PNG Airport Green Pass is a mandatory environmental fee for foreign passport holders departing from Papua New Guinea airports. This initiative supports PNG's environmental conservation and climate change mitigation efforts. The green pass is required in addition to standard immigration and customs procedures.
Applicability:
- Required for all foreign passport holders (non-PNG citizens)
- Applies to departures from: Jackson's International Airport (Port Moresby), Tokua Airport (Rabaul), Mount Hagen Kagamuga Airport, and other designated PNG international airports
- Each pass allows a single airport departure from PNG

2. Eligibility & Requirements
Who Must Purchase:
- All travelers holding foreign (non-PNG) passports
- Transit passengers departing PNG after a stopover
Exemptions:
- PNG citizens with valid PNG passports
- Diplomatic and official passport holders on official business
- Children under 2 years of age
- Other exemptions as determined by PNG Government authorities
Passport Requirements:
- Valid passport with minimum 6 months validity from date of departure
- Passport details must match airline booking information exactly

3. Fees & Payment
Pricing:
- Fees are set by CCDA and displayed in Papua New Guinea Kina (PGK)
- USD and other currency equivalents shown for reference only
- Current fee structure available at time of purchase
- Prices may be adjusted by CCDA with advance notice
- All fees include applicable taxes
Payment Processing:
- All payments processed securely through Bank South Pacific (BSP) Internet Payment Gateway (IPG)
- Accepted payment methods: Visa, Mastercard, and BSP-approved payment options
- Payments secured with 3D Secure authentication where applicable
- You must provide accurate payment information and ensure sufficient funds/credit available
- Transaction confirmation issued immediately upon successful payment
Currency:
- Charges processed in PGK
- International cardholders: your bank's foreign exchange rate applies
- Currency conversion fees (if any) are determined by your card issuer

4. Green Pass Issuance & Delivery
Upon Successful Payment:
- Digital green pass voucher issued immediately via email to the address provided
- Voucher also available for immediate download from confirmation page
- Voucher includes: unique reference number, passport details, validity dates, QR code
Your Responsibilities:
- Verify all details on voucher are correct immediately upon receipt
- Keep voucher code and QR code secure and confidential
- Print voucher or save digital copy accessible on mobile device
- Report any errors in passport details within 24 hours to info@ccda.gov.pg
Lost or Compromised Vouchers:
- CCDA may reissue vouchers for verified purchases (verification fee may apply)
- Vouchers obtained fraudulently will be cancelled without refund

5. Voucher Validity & Usage
Validity Period:
- Valid for 90 days from date of purchase, unless otherwise stated on voucher
- Must be used for departure within validity period
- Single-use only - voucher invalid after one airport departure
At the Airport:
- Present printed or digital voucher at airport check-in counter
- Voucher must be shown alongside valid passport and boarding pass
- Airport personnel will verify and process voucher
- Expired or invalid vouchers will not be accepted
Important:
- Green pass does NOT replace visa requirements or guarantee entry/exit
- Subject to PNG Immigration and Customs regulations
- Airlines may require green pass verification before boarding

6. Cancellations, Changes & Refunds
Non-Refundable Circumstances:
- Change of travel plans or flight cancellations (by passenger or airline)
- Voluntary decision not to travel
- Entry denied by PNG Immigration (unrelated to green pass)
- Expired vouchers (unused after validity period)
- Used or partially used vouchers
Eligible for Refund:
- Duplicate payments due to technical error (within 7 days of purchase)
- Erroneous charges or system errors (within 7 days of purchase)
- Voucher not issued despite successful payment
- Significant overpayment of fees
Refund Conditions:
- Must be requested before voucher is used at airport
- Must be requested within 7 days of purchase date
- Original transaction reference and proof required
- See full Refund Policy for detailed process
Changes to Voucher Details:
- Passport name corrections: contact CCDA within 24 hours (administrative fee may apply)
- Date changes: not permitted - original voucher expires per stated validity
- Transfer to another person: not permitted

7. Refund Process & Timing
How to Request:
- Email: info@ccda.gov.pg with subject "Green Pass Refund Request"
- Include: transaction reference, passport number, email used for purchase, detailed reason
- CCDA will review within 3-5 business days
Processing:
- Approved refunds returned to original payment method via BSP IPG
- Credit/debit card refunds: 7-10 business days to appear on statement
- Processing time depends on BSP and issuing bank procedures
- International refunds may take up to 15 business days
Fees:
- Bank fees or international transfer charges (if any) are the payer's responsibility
- CCDA does not charge administrative fees for legitimate refund requests
- Refunds processed in PGK (original currency paid)

8. Payment Disputes & Chargebacks
Resolution Process:
- Contact CCDA first for all billing or payment concerns
- Provide transaction details and explanation
- CCDA will investigate and respond within 5 business days
Chargebacks:
- Initiating chargeback without first contacting CCDA may result in voucher cancellation or account restrictions, and reporting to PNG authorities if fraud is suspected
- Legitimate disputes will be resolved cooperatively

9. Data Protection, Privacy & Security
Payment Security:
- Card and bank details handled exclusively by BSP IPG
- CCDA does not store complete card numbers
- PCI-DSS compliant payment processing
- SSL encryption for all transactions
Personal Information:
- Passport and contact details collected for voucher issuance and government compliance
- Data may be shared with PNG Immigration, Customs, and airport authorities as required by law
- Data retention complies with PNG legal and audit requirements
- See Privacy Policy for complete data handling information
User Security:
- Keep voucher codes confidential
- Use secure internet connection for purchases
- Log out of any accounts after purchase
- Report suspected fraud immediately

10. Government Authority & Compliance
Legal Basis:
- Green pass requirement established under PNG environmental and airport regulations
- CCDA operates under authority of PNG Government
- Compliance mandatory for all eligible foreign passport holders
Enforcement:
- Airlines may deny boarding without valid green pass
- Airport authorities may require green pass verification
- Non-compliance may result in departure delays or additional fees at airport
Changes to Requirements:
- PNG Government reserves right to modify green pass requirements
- CCDA will provide advance notice of significant changes
- Current requirements always available on the website

11. Limitation of Liability
To the extent permitted by PNG law:
CCDA is not liable for delays or denial of boarding due to airline policies; denied entry or exit by PNG Immigration or Customs (unrelated to green pass validity); technical issues with third-party payment systems beyond CCDA control; force majeure events (natural disasters, volcanic eruptions, earthquakes, civil unrest); or indirect, consequential, or punitive losses.
Maximum Liability:
For any claim related to green pass purchase or use, CCDA's total liability is limited to the amount paid for the affected voucher.
No Warranty:
Green pass provided "as is". CCDA does not guarantee uninterrupted or error-free service. Technical issues may occasionally affect availability.

12. Fraud & Misuse
Prohibited Activities:
- Resale or transfer of vouchers
- Use of false or fraudulent passport information
- Sharing or distributing voucher codes
- Attempting to bypass green pass requirements
- System manipulation or hacking attempts
Consequences:
- Immediate voucher cancellation without refund
- Account suspension or permanent ban
- Reporting to PNG law enforcement authorities
- Potential legal action under PNG law

13. System Availability & Technical Issues
Service Availability:
- Purchase system available 24/7 subject to maintenance
- Planned maintenance announced in advance where possible
- Emergency maintenance may occur without notice
Technical Support:
- Support available PNG business hours: Monday-Friday, 8:00 AM - 4:30 PM (PNG Time, UTC+10)
- Emergency support: info@ccda.gov.pg
- Response within 24-48 hours for non-urgent inquiries

14. Governing Law & Jurisdiction
Applicable Law:
- These terms are governed by the laws of Papua New Guinea
Dispute Resolution:
- Disputes are subject to exclusive jurisdiction of PNG courts; venue: National Court of Papua New Guinea, Port Moresby
Language:
- These terms are prepared in English; English version prevails

15. General Provisions
Entire Agreement:
- These terms, together with Privacy Policy and Refund Policy, constitute the entire agreement
Amendments:
- CCDA may update these terms at any time; material changes posted with effective date
Severability:
- If any provision is invalid, remaining provisions continue in full effect
No Waiver:
- CCDA's failure to enforce any right does not waive that right
Assignment:
- These terms are personal to you and may not be assigned; CCDA may assign rights to PNG Government entities

16. Contact Information
Climate Change & Development Authority (CCDA)
Email: info@ccda.gov.pg
General Inquiries: +675 [to be confirmed]
Refund Inquiries: +675 [to be confirmed]
Postal Address: Climate Change & Development Authority, Port Moresby, NCD, Papua New Guinea
Office Hours: Monday - Friday: 8:00 AM - 4:30 PM (PNG Time, UTC+10); Closed: Public Holidays
Website: pnggreenfees.gov.pg
Emergency After-Hours Support: Contact airport CCDA representative or airline staff
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

const Terms = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.settings.getPublic();
        if (data?.termsContent) {
          setContent(data.termsContent);
        }
      } catch (err) {
        console.error('Failed to load terms content', err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6 text-slate-800 whitespace-pre-wrap">
      <h1 className="text-3xl font-bold text-emerald-700">Terms &amp; Conditions</h1>
      <div className="space-y-3">{renderFormatted(content)}</div>
    </div>
  );
};

export default Terms;

