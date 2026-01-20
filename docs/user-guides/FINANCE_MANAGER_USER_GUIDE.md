# Finance Manager User Guide
## PNG Green Fees System

---

## Overview

As a **Finance Manager**, you oversee the financial operations of the PNG Green Fees System. Your responsibilities include managing quotations and invoices, reviewing payments, monitoring corporate voucher batches, approving cash reconciliations, and generating comprehensive financial reports.

---

## Table of Contents

1. [Login](#1-login)
2. [Dashboard](#2-dashboard)
3. [Quotations & Invoices](#3-quotations--invoices)
   - 3.1 [View Quotations](#31-view-quotations)
   - 3.2 [Create New Quotation](#32-create-new-quotation)
   - 3.3 [Convert Quotation to Invoice](#33-convert-quotation-to-invoice)
   - 3.4 [Tax Invoices](#34-tax-invoices)
4. [Payments Management](#4-payments-management)
5. [Passports & Vouchers](#5-passports--vouchers)
   - 5.1 [View All Passports](#51-view-all-passports)
   - 5.2 [Corporate Exit Pass](#52-corporate-exit-pass)
   - 5.3 [Vouchers List](#53-vouchers-list)
6. [Reports & Analytics](#6-reports--analytics)
   - 6.1 [Passport Reports](#61-passport-reports)
   - 6.2 [Individual Purchase Reports](#62-individual-purchase-reports)
   - 6.3 [Corporate Voucher Reports](#63-corporate-voucher-reports)
   - 6.4 [Revenue Generated Reports](#64-revenue-generated-reports)
   - 6.5 [Quotations Reports](#65-quotations-reports)
   - 6.6 [Refunded Reports](#66-refunded-reports)
   - 6.7 [Cash Reconciliation Reports](#67-cash-reconciliation-reports)
7. [Customer Management](#7-customer-management)
8. [Common Workflows](#8-common-workflows)

---

## 1. Login

### Access the System
1. Open your web browser and navigate to: **https://greenpay.eywademo.cloud**
2. You will see the staff login page with the PNG logo

### Enter Credentials
1. **Email Address**: Enter your Finance Manager email
2. **Password**: Enter your password
3. Click **"Sign In"** button

### After Login
- You will be automatically redirected to the **Dashboard**
- The green header shows your navigation menu with access to all financial features

---

## 2. Dashboard

The Dashboard provides an overview of system-wide financial metrics.

### Key Metrics Displayed
- **Total Vouchers Issued**: All-time count of green fee vouchers
- **Revenue This Month**: Current month's total revenue
- **Active Customers**: Number of registered corporate customers
- **Pending Quotations**: Quotations awaiting customer response
- **Recent Transactions**: Last 10-20 transactions across all agents
- **Payment Method Breakdown**: Pie chart showing Cash vs Card vs Bank Transfer
- **Monthly Revenue Trend**: Line graph showing revenue over time

### Quick Actions
- Create New Quotation
- View Pending Payments
- Generate Reports
- Review Cash Reconciliations

---

## 3. Quotations & Invoices

---

### 3.1 View Quotations

**Navigation**: Click **"Quotations & Invoices"** → **"Quotations"** in the menu (route: `/app/quotations`)

This page displays all quotations created for corporate customers.

#### Features

**Search and Filter**
- Search by quotation number
- Search by customer name
- Filter by date range
- Filter by status:
  - **Draft**: Not yet sent to customer
  - **Sent**: Awaiting customer response
  - **Accepted**: Customer approved, ready for payment
  - **Rejected**: Customer declined
  - **Converted**: Turned into invoice/vouchers

**Quotation List Columns**
- Quotation Number (e.g., QUO-2026-001)
- Customer Name and Company
- Issue Date
- Valid Until (usually 30 days)
- Number of Passes
- Total Amount (PGK)
- Status
- Actions

**Actions per Quotation**
- **View**: Open full quotation details
- **Edit**: Modify draft quotations
- **Download PDF**: Generate printable quotation
- **Email**: Send to customer
- **Convert to Invoice**: Create invoice once accepted
- **Delete**: Remove draft quotations

---

### 3.2 Create New Quotation

**Navigation**: Click **"Quotations & Invoices"** → **"Quotations"** → **"Create Quotation"** button (route: `/app/quotations/create`)

Create formal price quotes for corporate customers requesting bulk green fees.

#### Step-by-Step Process

**STEP 1: Customer Information**
1. **Select Customer**: Choose from existing customer list or create new
   - Customer Name
   - Company Name
   - Email Address
   - Phone Number
   - Physical Address
2. **Attention To**: Contact person's name (e.g., "HR Manager")

**STEP 2: Quotation Details**
1. **Quotation Title**: Brief description (e.g., "Green Fees for 50 Employees")
2. **Valid Until**: Set expiry date (default: 30 days from today)
3. **Notes/Terms**: Special terms, conditions, or instructions

**STEP 3: Line Items**
Add services/products to quotation:
1. Click **"Add Line Item"** button
2. For each item:
   - **Description**: "Green Fee Exit Pass" (or custom description)
   - **Quantity**: Number of passes (e.g., 50)
   - **Unit Price**: PGK 50.00 per pass (standard rate)
   - **Discount %**: Optional discount for bulk orders
   - **GST**: Applicable tax (if any)
   - **Total**: Auto-calculated (Quantity × Unit Price × Discount × GST)
3. Add multiple line items if needed (different pass types, services, etc.)

**STEP 4: Review Totals**
System automatically calculates:
- **Subtotal**: Sum of all line items
- **Discount**: Total discount amount
- **GST**: Tax amount (if applicable)
- **Grand Total**: Final amount payable

**STEP 5: Save and Send**
Choose action:
- **Save as Draft**: Save for later editing
- **Save and Email**: Save and immediately send to customer
- **Save and Download**: Generate PDF for manual delivery

#### Quotation PDF Format
The generated quotation includes:
- CCDA Logo and letterhead
- Quotation number and date
- Customer details
- Itemized list of services
- Pricing breakdown
- Terms and conditions
- Validity period
- Payment instructions

---

### 3.3 Convert Quotation to Invoice

Once a customer accepts a quotation, convert it to an invoice.

**Navigation**: Quotations list → Click quotation → **"Convert to Invoice"** button

#### Conversion Process

**STEP 1: Confirm Quotation Acceptance**
1. Verify customer has verbally or in writing accepted the quotation
2. Check all pricing and quantities are still correct
3. Confirm payment terms

**STEP 2: Convert**
1. Click **"Convert to Invoice"** button
2. System prompts: "Convert quotation QUO-2026-001 to invoice?"
3. Click **"Confirm"**

**STEP 3: Invoice Generated**
System automatically:
- Creates Tax Invoice with unique number (e.g., INV-2026-001)
- Marks quotation as "Converted"
- Copies all line items and totals
- Sets invoice date to today
- Sets payment due date (usually 14-30 days)
- Sends invoice to customer email

**STEP 4: Next Steps**
- Monitor payment in Payments section
- Generate corporate vouchers after payment received
- Update customer records

---

### 3.4 Tax Invoices

**Navigation**: Click **"Quotations & Invoices"** → **"Tax Invoices"** in the menu (route: `/app/invoices`)

View and manage all tax invoices issued to corporate customers.

#### Features

**Search and Filter**
- Search by invoice number
- Search by customer name
- Filter by date range
- Filter by payment status:
  - **Unpaid**: Awaiting payment
  - **Partial**: Partially paid
  - **Paid**: Fully paid
  - **Overdue**: Past due date

**Invoice List Columns**
- Invoice Number (INV-2026-XXX)
- Customer Name
- Invoice Date
- Due Date
- Total Amount (PGK)
- Amount Paid (PGK)
- Balance Due (PGK)
- Status
- Actions

**Actions per Invoice**
- **View**: Open full invoice details
- **Download PDF**: Generate printable invoice
- **Email**: Send/resend to customer
- **Record Payment**: Mark as paid with payment details
- **Send Reminder**: Email payment reminder
- **View Related Quotation**: Link back to original quotation

#### Recording Payments
1. Click **"Record Payment"** on invoice
2. Enter:
   - **Payment Date**: When payment received
   - **Amount**: Payment amount (can be partial)
   - **Payment Method**: Cash, Bank Transfer, Cheque, etc.
   - **Reference Number**: Bank transaction ID or cheque number
   - **Notes**: Any additional payment details
3. Click **"Save Payment"**
4. System updates invoice status and balance

---

## 4. Payments Management

**Navigation**: Click **"Payments"** in the menu (route: `/app/payments`)

Monitor all payments received across the system.

### Features

**Transaction List**
- Date and Time
- Transaction ID
- Customer/Passport Holder Name
- Passport Number
- Voucher Code
- Payment Method (Cash, Card, EFTPOS, Bank Transfer)
- Amount (PGK)
- Processed By (Agent name)
- Status (Completed, Pending, Failed, Refunded)

**Search and Filter**
- Date range selector
- Payment method filter
- Agent filter
- Status filter
- Amount range (min/max)

**Summary Statistics**
- Total transactions today
- Total revenue today
- Cash vs Card breakdown
- Average transaction value

**Export Options**
- Download as CSV
- Download as Excel
- Generate PDF report
- Email report to stakeholders

---

## 5. Passports & Vouchers

---

### 5.1 View All Passports

**Navigation**: Click **"Passports"** → **"All Passports"** in the menu (route: `/app/passports`)

View all passport records entered into the system (read-only for Finance Manager).

#### Features
- Search by passport number
- Search by passenger name
- Filter by nationality
- Filter by date range
- Filter by voucher status (issued, pending, expired)

#### Information Displayed
- Passport Number
- Full Name
- Nationality
- Date of Birth
- Gender
- Voucher Code (if issued)
- Payment Status
- Issue Date
- Expiry Date

---

### 5.2 Corporate Exit Pass

**Navigation**: Click **"Passports"** → **"Corporate Exit Pass"** in the menu (route: `/app/payments/corporate-exit-pass`)

Generate bulk vouchers for corporate customers who have made advance payments.

#### Step-by-Step Process

**STEP 1: Select Customer**
1. Choose corporate customer from dropdown
   - Shows company name
   - Shows available credit balance (if prepaid)
   - Shows pending invoices

**STEP 2: Specify Quantity**
1. Enter number of vouchers to generate (e.g., 50)
2. System calculates total cost: 50 × PGK 50 = PGK 2,500
3. Verify customer has sufficient balance or payment

**STEP 3: Payment Verification**
1. If prepaid: System deducts from customer balance
2. If invoice-based: Link to invoice number
3. Enter payment reference number

**STEP 4: Generate Batch**
1. Click **"Generate Vouchers"** button
2. System creates unique 8-character codes for each voucher
3. Batch ID assigned (e.g., BATCH-2026-001)
4. All vouchers marked as corporate batch

**STEP 5: Delivery**
Choose delivery method:
- **Download Excel**: Excel file with all voucher codes
- **Download PDF**: PDF sheet with printable vouchers and barcodes
- **Email to Customer**: Send digital voucher list
- **Print Vouchers**: Print individual GREEN CARD vouchers

#### Batch Information
Each batch includes:
- Batch ID
- Customer Name
- Number of Vouchers
- Generation Date
- Expiry Date (12 months from generation)
- Total Amount Paid
- Payment Reference
- Generated By (your name)

---

### 5.3 Vouchers List

**Navigation**: Click **"Passports"** → **"Vouchers List"** in the menu (route: `/app/vouchers-list`)

Comprehensive view of all vouchers in the system.

#### Features

**Search and Filter**
- Search by voucher code
- Search by passport number
- Filter by type:
  - Individual (counter purchases)
  - Corporate (bulk batches)
  - Online (website purchases)
- Filter by status:
  - **Unregistered**: No passport linked
  - **Registered**: Passport linked, ready to use
  - **Used**: Already redeemed at exit
  - **Expired**: Over 12 months old
- Filter by date range
- Filter by batch ID (corporate only)

**Voucher List Columns**
- Voucher Code (8 characters)
- Type (Individual/Corporate/Online)
- Passport Number (if registered)
- Passenger Name (if registered)
- Batch ID (if corporate)
- Issue Date
- Expiry Date
- Status
- Used Date (if applicable)
- Actions

**Actions per Voucher**
- **View Details**: Full voucher information
- **Download PDF**: Generate printable voucher
- **Email**: Send to customer
- **Mark as Used**: Manually mark as redeemed
- **Extend Expiry**: Extend validity (admin approval required)
- **Cancel**: Invalidate voucher and issue refund

**Bulk Actions**
- Select multiple vouchers
- Download selected as Excel
- Email selected to customer
- Mark selected as used
- Export for accounting

---

## 6. Reports & Analytics

**Navigation**: Click **"Reports"** in the menu (route: `/app/reports`)

The Reports dashboard provides access to comprehensive financial and operational analytics.

---

### 6.1 Passport Reports

**Navigation**: Reports → **"Passport Reports"** (route: `/app/reports/passports`)

Detailed analytics on all passport processing.

#### Available Data
- Total passports processed
- Breakdown by nationality
- Breakdown by gender
- Age demographics
- Daily/Weekly/Monthly trends
- Processing agent statistics
- Average processing time

#### Filters
- Date range
- Nationality
- Agent
- Status (active, expired, used)

#### Export Options
- Download Excel
- Download PDF
- Email scheduled report

---

### 6.2 Individual Purchase Reports

**Navigation**: Reports → **"Individual Purchase"** (route: `/app/reports/individual-purchase`)

Analytics on individual counter sales.

#### Available Data
- Total individual sales
- Revenue from individual sales
- Payment method breakdown
- Busiest times of day
- Busiest days of week
- Agent performance (sales per agent)
- Average transaction value

#### Key Metrics
- **Today's Sales**: Count and revenue
- **This Week**: Trend graph
- **This Month**: Comparison to last month
- **This Year**: Year-to-date performance

#### Filters
- Date range
- Payment method
- Agent
- Amount range

---

### 6.3 Corporate Voucher Reports

**Navigation**: Reports → **"Corporate Vouchers"** (route: `/app/reports/corporate-vouchers`)

Analytics on corporate batch vouchers.

#### Available Data
- Total corporate vouchers issued
- Revenue from corporate sales
- Vouchers by customer
- Vouchers by batch
- Registration rate (linked to passports)
- Usage rate (redeemed vouchers)
- Expired voucher count
- Outstanding/unregistered vouchers

#### Key Metrics
- **Total Batches**: Number of corporate batches
- **Average Batch Size**: Mean vouchers per batch
- **Top Customers**: Companies by volume
- **Revenue**: Total and per-customer

#### Filters
- Date range
- Customer
- Batch ID
- Status (registered, used, expired)

---

### 6.4 Revenue Generated Reports

**Navigation**: Reports → **"Revenue Generated"** (route: `/app/reports/revenue-generated`)

Comprehensive financial reporting combining all revenue streams.

#### Available Data
- **Total Revenue**: All sources combined
- **Revenue by Type**:
  - Individual sales
  - Corporate sales
  - Online sales
- **Revenue by Payment Method**:
  - Cash
  - Credit/Debit Card
  - EFTPOS
  - Bank Transfer
- **Daily Revenue Trend**: Line graph
- **Monthly Revenue Trend**: Bar chart
- **Year-over-Year Comparison**: Growth analysis

#### Key Metrics
- **Today**: Revenue and transaction count
- **This Week**: Total and daily average
- **This Month**: Total and comparison to last month
- **This Year**: Year-to-date total
- **Average Transaction Value**: Mean revenue per sale

#### Filters
- Date range
- Revenue type
- Payment method
- Agent (for individual sales)

#### Export Options
- Excel with pivot tables
- PDF summary report
- CSV for accounting software
- Email scheduled monthly report

---

### 6.5 Quotations Reports

**Navigation**: Reports → **"Quotations"** (route: `/app/reports/quotations`)

Analytics on quotation performance and conversion rates.

#### Available Data
- Total quotations created
- Quotations by status:
  - Draft
  - Sent
  - Accepted
  - Rejected
  - Converted
- Conversion rate (sent → accepted)
- Average quotation value
- Total quoted amount vs actual revenue
- Time to conversion (days from sent to accepted)
- Win rate by customer
- Win rate by agent

#### Key Metrics
- **This Month**: Quotations sent and accepted
- **Conversion Rate**: Percentage accepted
- **Total Value**: Sum of all accepted quotations
- **Pending Value**: Sum of sent quotations awaiting response

#### Filters
- Date range
- Status
- Customer
- Created by (agent)
- Value range

---

### 6.6 Refunded Reports

**Navigation**: Reports → **"Refunded"** (route: `/app/reports/refunded`)

Track all refunds and cancellations.

#### Available Data
- Total refunds issued
- Total refund amount
- Refunds by type:
  - Individual voucher refund
  - Corporate voucher refund
  - Online purchase refund
- Refunds by reason:
  - Customer request
  - Duplicate payment
  - System error
  - Expired voucher
  - Other
- Refund processing time
- Refunds by agent

#### Key Metrics
- **Total Refunded**: Amount (PGK)
- **Refund Rate**: Percentage of total sales
- **Average Refund**: Mean refund amount
- **This Month**: Trend comparison

#### Filters
- Date range
- Refund reason
- Amount range
- Original payment method

---

### 6.7 Cash Reconciliation Reports

**Navigation**: Reports → **"Cash Reconciliation"** (route: `/app/reports/cash-reconciliation`)

Review and approve cash reconciliations submitted by counter agents.

#### Features

**Reconciliation List**
- Agent Name
- Reconciliation Date
- Expected Cash (Float + Sales)
- Actual Cash Counted
- Variance
- Status (Pending, Approved, Rejected)
- Submission Date/Time
- Notes from Agent

**Variance Analysis**
- Agents with consistent shortages
- Agents with consistent overages
- Variance trend over time
- Total variance by agent

**Actions**
1. **Review Pending Reconciliations**
   - Click on any pending reconciliation
   - Review denomination breakdown
   - Read agent notes
   - Check transaction list for that day
   - Verify calculations

2. **Approve Reconciliation**
   - Click **"Approve"** button
   - Optionally add manager notes
   - Status changes to "Approved"
   - Agent is notified

3. **Reject Reconciliation**
   - Click **"Reject"** button
   - **Must provide reason** in manager notes
   - Status changes to "Rejected"
   - Agent is notified and must resubmit

4. **Request Clarification**
   - Add comment requesting more information
   - Agent can edit and resubmit

#### Approval Guidelines
- ✅ Approve if variance is:
  - Zero (perfect balance)
  - ±5 PGK or less with valid explanation
- ⚠️ Review carefully if variance is:
  - ±6-20 PGK: Requires detailed notes
  - Pattern of consistent shortages/overages
- ❌ Reject if:
  - Variance over ±20 PGK without valid explanation
  - Missing notes or insufficient explanation
  - Denomination count doesn't match actual cash
  - Suspicious patterns

---

## 7. Customer Management

**Navigation**: Click **"Admin"** → **"Customers"** in the menu (route: `/app/admin/customers`)

Manage corporate customer database.

### Features

**Customer List**
- Company Name
- Contact Person
- Email Address
- Phone Number
- Physical Address
- Account Balance (if prepaid)
- Total Vouchers Purchased (all-time)
- Account Status (Active/Inactive)

**Add New Customer**
1. Click **"Add Customer"** button
2. Enter:
   - **Company Name**: Official business name
   - **Contact Person**: Primary contact name
   - **Email**: Company email
   - **Phone**: Contact phone number
   - **Address**: Physical location
   - **Tax ID**: Business tax number (if applicable)
   - **Payment Terms**: NET 14, NET 30, Prepaid, etc.
   - **Credit Limit**: Maximum outstanding amount (if applicable)
3. Click **"Save Customer"**

**Edit Customer**
1. Click on customer name
2. Modify any fields
3. Click **"Update"**

**View Customer History**
- All quotations
- All invoices
- All voucher batches
- Payment history
- Current balance

**Customer Statements**
1. Select customer
2. Choose date range
3. Click **"Generate Statement"**
4. Shows:
   - Opening balance
   - All invoices issued
   - All payments received
   - All vouchers generated
   - Closing balance
5. Download PDF or email to customer

---

## 8. Common Workflows

---

### Workflow A: Corporate Quotation to Vouchers

**Scenario**: Company requests 100 green fee passes for employees

**STEP 1: Create Quotation**
1. Navigate to Quotations → Create Quotation
2. Select customer or create new customer
3. Add line item: "Green Fee Exit Pass", Qty: 100, Unit Price: PGK 50
4. Apply bulk discount if applicable (e.g., 5% for orders over 50)
5. Total: 100 × 50 × 0.95 = PGK 4,750
6. Save and email quotation to customer

**STEP 2: Follow Up**
1. Customer receives quotation email
2. Wait for customer response (usually 7-14 days)
3. If needed, modify quotation based on feedback

**STEP 3: Customer Accepts**
1. Customer emails acceptance
2. Navigate to Quotations → View quotation
3. Click **"Convert to Invoice"**
4. Invoice INV-2026-XXX is generated
5. Invoice automatically emailed to customer

**STEP 4: Payment Received**
1. Customer makes bank transfer
2. Navigate to Invoices → View invoice
3. Click **"Record Payment"**
4. Enter:
   - Payment Date
   - Amount: PGK 4,750
   - Method: Bank Transfer
   - Reference: Bank transaction ID
5. Save payment
6. Invoice status changes to "Paid"

**STEP 5: Generate Vouchers**
1. Navigate to Passports → Corporate Exit Pass
2. Select customer
3. Enter quantity: 100
4. Link to invoice number
5. Click **"Generate Vouchers"**
6. System creates 100 unique voucher codes
7. Batch ID: BATCH-2026-015

**STEP 6: Deliver Vouchers**
1. Download Excel file with all voucher codes
2. Email to customer contact person
3. Or download PDF and print physical vouchers
4. Customer distributes to employees

**Time**: 1-2 weeks total (depending on customer response)

---

### Workflow B: Monthly Financial Reporting

**Scenario**: End of month, generate reports for management

**STEP 1: Revenue Report**
1. Navigate to Reports → Revenue Generated
2. Set date range: First to last day of last month
3. Review key metrics:
   - Total revenue
   - Revenue by type (individual, corporate, online)
   - Payment method breakdown
4. Export as Excel
5. Save with filename: "Revenue_Report_2026-01.xlsx"

**STEP 2: Corporate Voucher Report**
1. Navigate to Reports → Corporate Vouchers
2. Set date range: Last month
3. Review:
   - Total corporate vouchers issued
   - Top customers by volume
   - Registration rate
   - Usage rate
4. Export as PDF
5. Save as: "Corporate_Vouchers_2026-01.pdf"

**STEP 3: Individual Purchase Report**
1. Navigate to Reports → Individual Purchase
2. Set date range: Last month
3. Review:
   - Total individual sales
   - Agent performance
   - Busiest days/times
4. Export as Excel

**STEP 4: Cash Reconciliation Review**
1. Navigate to Reports → Cash Reconciliation
2. Review all approved reconciliations for last month
3. Note any agents with persistent variances
4. Export summary report

**STEP 5: Compile Management Report**
1. Create PowerPoint or Word document
2. Include key metrics from each report:
   - Total revenue: PGK X
   - Growth vs last month: +Y%
   - Individual sales: Z transactions
   - Corporate sales: N batches
   - Active customers: M companies
3. Add charts and graphs
4. Highlight any issues (refunds, variances, etc.)
5. Provide recommendations

**STEP 6: Distribution**
1. Email report to management
2. Present in monthly meeting
3. Archive for year-end reporting

**Time**: 2-3 hours

---

### Workflow C: Reviewing and Approving Cash Reconciliations

**Scenario**: Daily review of agent cash reconciliations

**STEP 1: Access Pending Reconciliations**
1. Navigate to Reports → Cash Reconciliation
2. Filter by Status: "Pending"
3. Sort by date (most recent first)

**STEP 2: Review Each Reconciliation**
For each pending reconciliation:
1. Click to open details
2. Check:
   - **Agent name**: Which agent submitted
   - **Date**: Reconciliation date
   - **Opening Float**: Starting cash amount
   - **Expected Cash**: Float + Cash Sales
   - **Actual Cash**: Agent's count
   - **Variance**: Difference
3. Review denomination breakdown:
   - Does it add up correctly?
   - Does mix of notes/coins seem reasonable?
4. Read agent notes:
   - Is explanation clear?
   - Does it justify variance?

**STEP 3: Verify Transactions**
1. Cross-reference with Payments list
2. Filter payments by:
   - Date = reconciliation date
   - Agent = reconciling agent
   - Payment Method = Cash
3. Verify total cash transactions match expected cash
4. Look for any missing or duplicate transactions

**STEP 4: Make Decision**

**If Variance = 0 or ±5 PGK with explanation:**
1. Click **"Approve"** button
2. Optionally add manager note: "Approved. Good work."
3. Agent receives approval notification

**If Variance = ±6-20 PGK:**
1. Check if explanation is sufficient
2. If yes: Approve with note: "Approved. Please recount more carefully."
3. If no: Reject with note: "Please provide more details about variance."

**If Variance > ±20 PGK:**
1. Usually reject
2. Add detailed note:
   - "Variance of PGK 25 is too large. Please recount cash and verify all transactions. Specifically check transactions between 2pm-4pm where discrepancy likely occurred."
3. Agent must resubmit with better explanation

**If Suspicious Pattern:**
1. Note in manager comments
2. Schedule meeting with agent
3. May require additional training or supervision

**STEP 5: Document Issues**
- Keep log of recurring problems
- Track agents with frequent variances
- Report patterns to senior management

**Time**: 10-15 minutes per reconciliation, 30-60 minutes daily for all agents

---

## Security and Best Practices

### Password Security
- Use strong, unique password
- Change password every 90 days
- Never share login credentials
- Log out when leaving desk

### Financial Data Protection
- Do not share customer payment information
- Keep printed reports in secure location
- Shred sensitive documents before disposal
- Lock computer when stepping away

### Approval Authority
- Only approve reconciliations within your authority limit
- Escalate large variances to senior management
- Document all approval decisions
- Maintain audit trail

### Report Accuracy
- Verify data before sharing reports
- Double-check calculations
- Compare to previous periods for reasonableness
- Note any anomalies or unusual trends

---

## Support Contacts

### Technical Issues
- **IT Support**: Via Support Tickets in system
- **Email**: support@greenpay.eywademo.cloud

### Process Questions
- **Senior Finance Manager**: For approval questions
- **Operations Manager**: For process clarification

### System Administration
- **Flex Admin**: For access or permission issues

---

## Quick Reference

### Key Routes
- **Dashboard**: `/app/dashboard`
- **Quotations**: `/app/quotations`
- **Invoices**: `/app/invoices`
- **Payments**: `/app/payments`
- **Corporate Exit Pass**: `/app/payments/corporate-exit-pass`
- **Reports**: `/app/reports`
- **Customers**: `/app/admin/customers`
- **Cash Reconciliation**: `/app/reports/cash-reconciliation`

### Standard Pricing
- **Individual Green Fee**: PGK 50.00 per pass
- **Corporate Bulk Discount**: 5-10% for orders over 50 (discretionary)

### Payment Terms
- **Individual**: Immediate payment at counter
- **Corporate**: NET 14 or NET 30 days (varies by customer)

### Voucher Validity
- **Duration**: 12 months from issue date

---

**Document Version**: 1.0
**Last Updated**: January 2026
**System URL**: https://greenpay.eywademo.cloud
