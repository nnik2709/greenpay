import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

const defaultContent = `
PNG Airport Green Pass for Foreign Passport Holders

This policy governs refund requests for online purchases of PNG Airport Green Pass vouchers from the Climate Change & Development Authority (CCDA) of Papua New Guinea. Vouchers are generally non-refundable once issued, but refunds are available for technical errors, certain overcharges, and limited special circumstances.

1. Eligibility for Refunds
Eligible:
- Duplicate payment for the same voucher (system error or accidental double payment)
- Payment processed successfully but voucher not generated or received
- Significant overcharge or incorrect amount charged
- Payment debited but transaction shows as failed in CCDA system
- System errors producing invalid voucher
- Discretionary: medical emergency, death of passenger or immediate family member, natural disaster, PNG government-imposed travel restrictions, or immigration denial on first arrival (voucher unused)

Not Eligible:
- Change of travel plans or voluntary cancellation
- Airline cancellations or rescheduling
- Wrong date or incorrect travel details provided by user
- Expired vouchers; used vouchers; partial-use claims
- Entry denied for visa/document issues unrelated to green pass
- Fraudulent payments or misuse

2. Refund Request Timeframe
- Standard refund requests: within 7 days of purchase
- Technical error refunds: within 14 days of purchase
- Special circumstances: within 30 days of purchase
- All refund requests must be submitted before the voucher is used at the airport

3. Refund Request Process
Step 1: Gather transaction reference, BSP IPG transaction ID, passport number, email used, amount paid (PGK), and reason; include supporting documents (e.g., duplicate charge proof, medical certificate, death certificate, travel restriction notice).
Step 2: Email info@ccda.gov.pg, subject "Green Pass Refund Request - [Transaction Reference]". Include all required details and documentation.
Step 3: CCDA acknowledges within 2 business days, investigates, and issues a decision (standard: 3-5 business days; complex cases: up to 7-10 business days).

4. Refund Processing & Payment
- Refunds are returned to the original payment method via BSP IPG where possible.
- Card refunds typically appear in 7–10 business days (PNG banks); international cards may take 10–15 business days depending on issuing bank.
- Bank fees or international transfer fees (if any) are the payer's responsibility.
- Refunds processed in PGK; exchange rates determined by your bank.

5. Declined Refunds & Appeals
- If declined, CCDA will state the reason. Appeals accepted within 5 business days with new evidence; decision within 7 business days.
- External escalation: PNG Consumer & Competition Commission or PNG courts (PNG jurisdiction).

6. Preventing Refund Issues
- Double-check passport details and travel dates before purchase; report errors within 24 hours.
- Avoid multiple payment attempts; keep confirmation email and transaction reference.

7. Bank & Payment Provider Responsibilities
- BSP IPG processes refunds; your bank posts credits and determines final timing.
- International cards may incur FX fees; CCDA cannot control bank fees.

8. Contact
Email: info@ccda.gov.pg
Phone: +675 [to be confirmed]
Postal: Climate Change & Development Authority, Port Moresby, PNG
Office hours: Mon–Fri, 8:00 AM–4:30 PM PNG time (UTC+10), except public holidays.
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

const Refunds = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.settings.getPublic();
        if (data?.refundsContent) {
          setContent(data.refundsContent);
        }
      } catch (err) {
        console.error('Failed to load refunds content', err);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6 text-slate-800 whitespace-pre-wrap">
      <h1 className="text-3xl font-bold text-emerald-700">Refund / Return Policy</h1>
      <div className="space-y-3">{renderFormatted(content)}</div>
    </div>
  );
};

export default Refunds;

