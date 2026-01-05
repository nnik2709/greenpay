# User Testing Run Sheet Template

## Session Info
- Test window: ____
- Build/version: ____
- Environment URL: ____
- Tester: ____   Date: ____

## Scenarios (table)
Columns:
- Scenario ID
- Role
- Pre-req data (accounts, vouchers, invoices, passport numbers)
- Steps (numbered)
- Expected result
- Actual result
- Status (Pass/Fail/Blocked)
- Evidence (screenshot/PDF/email/log link)
- Notes/bugs (issue ID if filed)

### Example rows
1. Agent – Individual purchase with PDF  
   - Role: Counter_Agent  
   - Pre-req: Valid payment methods; sample passport number; email inbox available  
   - Steps: 1) Login 2) Create individual purchase 3) Download voucher PDF 4) Verify barcode/URL 5) Check email attachment  
   - Expected: Purchase succeeds; PDF correct; email with attachment; no console errors

2. Finance Manager – Invoice-first corporate vouchers (GST on/off)  
   - Role: Finance_Manager  
   - Pre-req: Customer record; GST toggle state; email inbox  
   - Steps: 1) Create corporate invoice 2) Pay (full amount) 3) Generate vouchers 4) Bulk email PDF 5) Verify no duplicate generation  
   - Expected: Invoice paid → status paid; vouchers generated; bulk PDF emailed; totals match GST setting

3. Public policies  
   - Role: Public  
   - Steps: 1) Open /terms 2) /privacy 3) /refunds 4) Click links from an email  
   - Expected: Pages load with sanitized content; links work; no console errors

4. Error handling  
   - Role: Any  
   - Steps: 1) Use invalid voucher code 2) (Optional) simulate network drop  
   - Expected: Friendly error shown; no uncaught exceptions

## Bug Log (table)
Columns:
- ID
- Scenario ID
- Severity (P0/P1/P2)
- Summary
- Steps to reproduce
- Expected vs actual
- Evidence link
- Owner
- Status (New/Triaged/Fix In-Progress/Retest/Closed)

## Data Pack Checklist
- Accounts: usernames/passwords per role
- Payment methods: allowed options
- Sample data: voucher codes (valid/invalid/expired), passport numbers, customer records
- Email inbox details (where PDFs arrive)
- GST setting state noted (on/off) for relevant scenarios



