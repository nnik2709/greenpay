# Flex Admin User Guide
## PNG Green Fees System

---

## Overview

As a **Flex Admin**, you have complete administrative access to the PNG Green Fees System. Your role encompasses all system functions including user management, system configuration, financial oversight, reporting, and technical administration. You are responsible for maintaining system integrity, configuring settings, managing all users, and ensuring smooth operations.

---

## Table of Contents

1. [Login](#1-login)
2. [Dashboard](#2-dashboard)
3. [User Management](#3-user-management)
4. [Passport & Voucher Management](#4-passport--voucher-management)
5. [Financial Management](#5-financial-management)
6. [Quotations & Invoices](#6-quotations--invoices)
7. [Reports & Analytics](#7-reports--analytics)
8. [System Administration](#8-system-administration)
9. [Customer Management](#9-customer-management)
10. [Common Administrative Tasks](#10-common-administrative-tasks)

---

## 1. Login

### Access the System
1. Navigate to: **https://greenpay.eywademo.cloud**
2. Enter your Flex Admin credentials
3. Click **"Sign In"**

### After Login
- Redirected to **Dashboard** with full system overview
- Navigation menu shows all available modules
- You have access to all features across all roles

---

## 2. Dashboard

The Dashboard provides comprehensive system-wide metrics and quick access to all functions.

### Key Metrics Displayed
- **Total Users**: All system users by role
- **Total Vouchers**: All-time voucher count
- **Total Revenue**: Lifetime and monthly revenue
- **Active Corporate Customers**: Companies with accounts
- **Pending Quotations**: Awaiting customer response
- **Pending Cash Reconciliations**: Requiring approval
- **System Health**: Server status, database status, backup status
- **Recent Activity**: Last 20 system events
- **Revenue Trends**: Monthly and yearly graphs
- **Top Performing Agents**: By volume and revenue

### Quick Actions Dashboard
- Create User
- Generate Report
- View System Logs
- Configure Settings
- Approve Reconciliations
- Manage Payment Modes

---

## 3. User Management

**Navigation**: Click **"Users"** in menu (route: `/app/users`)

Create, edit, and manage all system users with role-based access control.

### View All Users

**User List Displays**:
- Email Address
- Full Name
- Role (Flex_Admin, Finance_Manager, Counter_Agent, IT_Support)
- Status (Active, Inactive, Suspended)
- Last Login Date
- Created Date
- Actions

### Add New User

**STEP 1: Click "Add User" Button**

**STEP 2: Enter User Details**
1. **Email Address**: Must be unique (used for login)
2. **Full Name**: User's complete name
3. **Phone Number**: Contact number (optional)
4. **Role**: Select from:
   - **Flex_Admin**: Full system access (use sparingly)
   - **Finance_Manager**: Financial oversight, reports, quotations
   - **Counter_Agent**: Front-line staff, individual purchases, cash handling
   - **IT_Support**: User management, technical reports, system logs
5. **Initial Password**: Set temporary password
   - Minimum 8 characters
   - User should change on first login
6. **Status**: Active (default)

**STEP 3: Set Permissions (Role-Specific)**
While roles have default permissions, you can customize:
- Access to specific reports
- Ability to approve reconciliations
- View-only vs Edit permissions
- Export capabilities

**STEP 4: Save User**
1. Click **"Create User"**
2. System sends welcome email with login instructions
3. User appears in user list

### Edit User

1. Click on user email in list
2. Modify any field except email (email is unique identifier)
3. Can change:
   - Full Name
   - Phone Number
   - Role (reassign to different role)
   - Status (Active/Inactive/Suspended)
   - Reset Password
4. Click **"Update User"**

### Reset User Password

1. Click user → **"Reset Password"** button
2. Enter new temporary password
3. Check **"Force password change on next login"**
4. Click **"Reset"**
5. Communicate new password to user securely
6. User must change password on next login

### Deactivate User

1. Click user → **"Deactivate"** button
2. Confirm action
3. User status changes to "Inactive"
4. User cannot log in
5. All user data preserved for audit trail
6. Can reactivate anytime

### View User Activity

1. Click user → **"View Activity"** tab
2. Shows:
   - Login history (dates, times, IP addresses)
   - Actions performed (created voucher, approved reconciliation, etc.)
   - Reports generated
   - Data exports
   - Failed login attempts
3. Export activity log for audit purposes

### Role Comparison Table

| Feature | Flex_Admin | Finance_Manager | Counter_Agent | IT_Support |
|---------|-----------|----------------|---------------|-----------|
| User Management | ✅ Full | ❌ No | ❌ No | ✅ Full |
| System Settings | ✅ Full | ❌ No | ❌ No | ✅ View Only |
| Individual Purchases | ✅ Yes | ✅ View Only | ✅ Yes | ❌ No |
| Corporate Vouchers | ✅ Yes | ✅ Yes | ✅ View Only | ❌ No |
| Quotations | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Invoices | ✅ Yes | ✅ Yes | ❌ No | ✅ View Only |
| Payments | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| All Reports | ✅ Yes | ✅ Yes (no Quotations) | ❌ Cash Only | ✅ Yes (no Quotations) |
| Cash Reconciliation | ✅ Approve | ✅ Approve | ✅ Submit | ❌ View Only |
| Email Templates | ✅ Full | ❌ No | ❌ No | ❌ No |
| Payment Modes | ✅ Full | ❌ No | ❌ No | ❌ No |
| Customers | ✅ Full | ✅ Full | ❌ No | ❌ No |

---

## 4. Passport & Voucher Management

### 4.1 All Passports

**Navigation**: Passports → All Passports (route: `/app/passports`)

Complete database of all passport records.

#### Features
- **Search**: By passport number, name, nationality
- **Filter**: By date, status, voucher status, agent
- **Sort**: By any column
- **Export**: Excel, CSV, PDF
- **Edit**: Click passport to modify details
- **Delete**: Remove erroneous entries (requires confirmation)
- **Bulk Actions**: Select multiple for batch operations

#### Passport Details View
- Personal Information (name, DOB, gender, nationality)
- Passport Details (number, issue date, expiry date)
- Voucher Information (code, status, issue date)
- Payment Details (amount, method, date, receipt)
- Transaction History
- Linked Vouchers (if multiple)

#### Edit Passport
1. Click passport
2. Modify editable fields (name, DOB, etc.)
3. Cannot change passport number (audit trail)
4. Click **"Update"**
5. System logs change with your username and timestamp

### 4.2 Individual Exit Pass

**Navigation**: Passports → Individual Exit Pass (route: `/app/passports/create`)

Same functionality as Counter Agent role - process individual customer vouchers.

**Full process documented in Counter Agent User Guide.**

### 4.3 Corporate Exit Pass

**Navigation**: Passports → Corporate Exit Pass (route: `/app/payments/corporate-exit-pass`)

Generate bulk corporate voucher batches for prepaid or invoiced customers.

**Full process documented in Finance Manager User Guide.**

### 4.4 Vouchers List

**Navigation**: Passports → Vouchers List (route: `/app/vouchers-list`)

Complete voucher database with full administrative control.

#### Admin-Specific Actions
Beyond viewing (covered in Finance Manager guide):
1. **Extend Expiry**:
   - Select voucher
   - Click "Extend Expiry"
   - Set new expiry date (up to 24 months total)
   - Add reason for extension
   - Confirm

2. **Cancel Voucher**:
   - Select voucher
   - Click "Cancel"
   - Select reason:
     - Duplicate
     - Customer Request
     - System Error
     - Fraud Prevention
   - Enter refund amount (if applicable)
   - Confirm
   - Voucher marked as "Cancelled"

3. **Manually Mark as Used**:
   - For vouchers used but not properly recorded
   - Select voucher
   - Click "Mark as Used"
   - Enter usage date
   - Add notes
   - Confirm

4. **Reassign Passport**:
   - If wrong passport linked
   - Select voucher
   - Click "Reassign Passport"
   - Enter correct passport number
   - Verify passport details
   - Confirm reassignment

5. **Bulk Operations**:
   - Select multiple vouchers
   - Actions:
     - Bulk export to Excel
     - Bulk email to customers
     - Bulk extend expiry
     - Bulk cancel (with confirmation)

---

## 5. Financial Management

### 5.1 Payments

**Navigation**: Payments (route: `/app/payments`)

Complete transaction monitoring and management.

**Core features documented in Finance Manager User Guide.**

#### Admin-Specific Actions

**Refund Transaction**:
1. Locate transaction in Payments list
2. Click transaction → **"Refund"** button
3. Enter:
   - Refund Amount (can be partial)
   - Refund Reason
   - Refund Method (Cash, Bank Transfer, etc.)
   - Reference Number
4. Click **"Process Refund"**
5. System:
   - Creates refund record
   - Updates transaction status
   - Generates refund receipt
   - Cancels associated voucher
6. Notify customer

**Void Transaction**:
1. For erroneous or fraudulent transactions
2. Click transaction → **"Void"** button
3. Enter:
   - Void Reason (required)
   - Manager approval (for amounts over PGK 100)
4. Confirm void
5. Transaction marked as "Voided" (cannot be un-voided)
6. All associated vouchers cancelled

**Adjust Transaction**:
1. For incorrect amounts or payment methods
2. Click transaction → **"Adjust"** button
3. Modify:
   - Amount (if wrong amount recorded)
   - Payment Method (if wrong method recorded)
   - Transaction Date (if wrong date)
4. Add adjustment reason (required)
5. Save adjustment
6. Original data preserved in audit log

### 5.2 Cash Reconciliation Review

**Navigation**: Reports → Cash Reconciliation (route: `/app/reports/cash-reconciliation`)

**Full approval process documented in Finance Manager User Guide.**

As Flex Admin, you have additional authority:
- Approve reconciliations of any amount (Finance Managers may have limits)
- Override rejections from Finance Managers
- View all reconciliations system-wide (all agents, all dates)
- Generate reconciliation trend reports
- Identify agents requiring additional training

---

## 6. Quotations & Invoices

**Navigation**: Quotations & Invoices menu

**Full quotation and invoice management documented in Finance Manager User Guide.**

As Flex Admin, you have full access to all quotation and invoice functions with no restrictions.

---

## 7. Reports & Analytics

**Navigation**: Reports menu (route: `/app/reports`)

You have access to ALL report types (Finance Managers don't have Quotations reports):

1. **Passport Reports** - All passport data
2. **Individual Purchase Reports** - Counter sales
3. **Corporate Voucher Reports** - Bulk corporate sales
4. **Revenue Generated Reports** - Comprehensive financial reporting
5. **Quotations Reports** - Quotation performance and conversion
6. **Refunded Reports** - All refunds and cancellations
7. **Cash Reconciliation Reports** - Agent cash handling

**All reports fully documented in Finance Manager User Guide.**

### Admin-Specific Reporting Features

**Custom Report Builder** (Admin Only):
1. Navigate to Reports → **"Custom Report Builder"**
2. Select data sources:
   - Passports
   - Vouchers
   - Transactions
   - Users
   - Customers
3. Choose fields to include
4. Apply filters (date ranges, status, etc.)
5. Select aggregations (sum, count, average, etc.)
6. Choose grouping (by date, agent, payment method, etc.)
7. Preview report
8. Save custom report template
9. Export or schedule recurring delivery

**Scheduled Reports**:
1. From any report, click **"Schedule"** button
2. Set frequency:
   - Daily (weekdays only or all days)
   - Weekly (choose day of week)
   - Monthly (choose day of month)
   - Quarterly
3. Enter email recipients (multiple addresses supported)
4. Choose format (Excel, PDF, CSV)
5. Set start date and end date (or run indefinitely)
6. Save schedule
7. Reports automatically generated and emailed

**Report Access Log**:
1. Navigate to Reports → **"Access Log"**
2. See who viewed/generated each report:
   - User name
   - Report type
   - Date/time
   - Filters applied
   - Export format
3. Useful for audit compliance

---

## 8. System Administration

**Navigation**: Admin menu

### 8.1 System Settings

**Navigation**: Admin → System Settings (route: `/app/admin/settings`)

Configure global system parameters.

#### General Settings
- **System Name**: "PNG Green Fees System" (displayed in header)
- **Green Fee Amount**: PGK 50.00 (can be changed system-wide)
- **Voucher Validity Period**: 12 months (can be adjusted)
- **Currency**: PGK (Papua New Guinea Kina)
- **Date Format**: DD/MM/YYYY or MM/DD/YYYY
- **Time Zone**: PNG Standard Time (UTC+10)

#### Email Settings
- **SMTP Server**: mail.eywademo.cloud
- **SMTP Port**: 587 (TLS) or 465 (SSL)
- **SMTP Username**: noreply@greenpay.eywademo.cloud
- **SMTP Password**: ••••••••
- **From Name**: PNG Green Fees System
- **From Email**: noreply@greenpay.eywademo.cloud
- **Test Email**: Send test email to verify settings

#### Security Settings
- **Session Timeout**: 30 minutes (inactivity)
- **Password Policy**:
  - Minimum length: 8 characters
  - Require uppercase: Yes/No
  - Require numbers: Yes/No
  - Require special characters: Yes/No
  - Password expiry: 90 days or Never
- **Failed Login Attempts**: Lock account after 5 failed attempts
- **Two-Factor Authentication**: Enable/Disable (optional)
- **IP Whitelist**: Restrict access to specific IP addresses

#### Backup Settings
- **Automatic Backups**: Daily at 2:00 AM
- **Backup Retention**: Keep last 30 backups
- **Backup Location**: Cloud storage + local
- **Manual Backup**: Click "Backup Now" button

#### API Settings (Advanced)
- **API Keys**: Generate keys for third-party integrations
- **Webhook URLs**: For external system notifications
- **Rate Limiting**: API requests per minute

### 8.2 Payment Modes

**Navigation**: Admin → Payment Modes (route: `/app/admin/payment-modes`)

Configure available payment methods for counter agents.

#### Default Payment Modes
1. **Cash**
   - Name: "Cash"
   - Enabled: Yes
   - Requires Reference: No
   - Icon: 💵
   - Display Order: 1

2. **Credit/Debit Card**
   - Name: "Card"
   - Enabled: Yes
   - Requires Reference: Optional (last 4 digits)
   - Icon: 💳
   - Display Order: 2

3. **EFTPOS**
   - Name: "EFTPOS"
   - Enabled: Yes
   - Requires Reference: Yes (terminal ID)
   - Icon: 🏧
   - Display Order: 3

4. **Bank Transfer**
   - Name: "Bank Transfer"
   - Enabled: Yes
   - Requires Reference: Yes (transaction ID)
   - Icon: 🏦
   - Display Order: 4

#### Add Custom Payment Mode
1. Click **"Add Payment Mode"** button
2. Enter:
   - **Name**: E.g., "Mobile Money"
   - **Description**: Brief description
   - **Enabled**: Yes/No
   - **Requires Reference**: Yes/No
   - **Icon**: Emoji or image
   - **Display Order**: Position in dropdown
   - **For Counter Use**: Available to agents
   - **For Online Use**: Available on public website
3. Click **"Save"**
4. New payment mode appears in agent interfaces

#### Edit Payment Mode
1. Click payment mode
2. Modify settings
3. Cannot delete payment modes with existing transactions
4. Can disable to hide from new transactions

### 8.3 Email Templates

**Navigation**: Admin → Email Templates (route: `/app/admin/email-templates`)

Customize automated email communications sent by the system.

#### Available Templates

1. **Voucher Email**
   - **Trigger**: When agent emails voucher to customer
   - **Variables**: {{voucher_code}}, {{passport_number}}, {{customer_name}}, {{issue_date}}, {{expiry_date}}
   - **Attachments**: Voucher PDF with barcode

2. **Quotation Email**
   - **Trigger**: When Finance Manager sends quotation
   - **Variables**: {{quotation_number}}, {{customer_name}}, {{company_name}}, {{total_amount}}, {{valid_until}}
   - **Attachments**: Quotation PDF

3. **Invoice Email**
   - **Trigger**: When invoice is generated or sent
   - **Variables**: {{invoice_number}}, {{customer_name}}, {{total_amount}}, {{due_date}}, {{payment_instructions}}
   - **Attachments**: Invoice PDF

4. **Payment Receipt Email**
   - **Trigger**: When payment is recorded
   - **Variables**: {{receipt_number}}, {{amount}}, {{payment_method}}, {{transaction_date}}
   - **Attachments**: Receipt PDF

5. **Welcome Email**
   - **Trigger**: When new user is created
   - **Variables**: {{user_name}}, {{email}}, {{role}}, {{temporary_password}}

6. **Password Reset Email**
   - **Trigger**: When user requests password reset
   - **Variables**: {{user_name}}, {{reset_link}}, {{expiry_time}}

7. **Reconciliation Approved**
   - **Trigger**: When Finance Manager approves agent's cash reconciliation
   - **Variables**: {{agent_name}}, {{date}}, {{variance}}, {{manager_notes}}

8. **Reconciliation Rejected**
   - **Trigger**: When Finance Manager rejects agent's cash reconciliation
   - **Variables**: {{agent_name}}, {{date}}, {{variance}}, {{rejection_reason}}

#### Edit Email Template
1. Click template name
2. Modify:
   - **Subject Line**: Use variables for dynamic content
   - **Email Body**: HTML editor for formatting
   - **Variables**: Click to insert {{variable}}
   - **Signature**: Company signature block
3. **Preview**: Test with sample data
4. **Send Test Email**: Send to your email to verify
5. Click **"Save Template"**

#### Best Practices
- Use professional, friendly tone
- Include all relevant information
- Provide clear next steps
- Include contact information for questions
- Test thoroughly before deploying
- Use variables to personalize emails

### 8.4 Payment Gateway Settings

**Navigation**: Admin → Payment Gateway (route: `/app/admin/payment-gateway`)

Configure online payment processor for public website voucher purchases.

#### BSP Payment Gateway (Current Provider)

**API Credentials**:
- **Merchant ID**: Your BSP merchant account ID
- **API Key**: Provided by BSP
- **API Secret**: Keep secure
- **Endpoint URL**: https://api.bsp.com.pg/v1/
- **Test Mode**: Enable for testing (uses sandbox)

**Supported Cards**:
- Visa
- Mastercard
- BSP Credit Cards
- BSP Debit Cards

**Settings**:
- **Currency**: PGK
- **Success URL**: https://greenpay.eywademo.cloud/payment/success
- **Failure URL**: https://greenpay.eywademo.cloud/payment/failure
- **Callback URL**: https://greenpay.eywademo.cloud/payment/callback
- **Webhook Secret**: For secure notifications

**Transaction Fees** (if applicable):
- Percentage: 2.5%
- Fixed Fee: PGK 0.50
- Minimum: PGK 1.00
- Who Pays: Customer or Absorb (system pays)

**Save Settings** and **Test Connection** button to verify.

### 8.5 Login History

**Navigation**: Admin → Login History (route: `/app/admin/login-history`)

Monitor all login activity across the system.

#### Login Log Displays
- **Date/Time**: When login occurred
- **User**: Email address
- **Role**: User's role
- **Status**: Success, Failed, Locked Out
- **IP Address**: Source IP
- **Device/Browser**: User agent string
- **Location**: Approximate location (if available)

#### Filter Options
- Date range
- User
- Status (success, failed)
- Role
- IP address

#### Security Monitoring
Look for:
- 🔴 **Multiple failed logins**: Potential brute force attack
- 🔴 **Unusual IP addresses**: Access from unexpected locations
- 🔴 **After-hours logins**: Logins outside business hours
- 🔴 **Concurrent logins**: Same user from multiple IPs simultaneously

#### Export Login History
- Download as CSV for security audit
- Required for compliance reporting

### 8.6 SMS Settings

**Navigation**: Admin → SMS Settings (route: `/app/admin/sms-settings`)

Configure SMS notifications (optional feature).

#### SMS Provider Setup
- **Provider**: Choose SMS gateway (Digicel, Bmobile, etc.)
- **API Key**: Provider API credentials
- **Sender ID**: "PNGGREENFEES" (6-11 characters)
- **Test Mode**: Enable for testing

#### SMS Notifications
Enable/disable SMS for:
- ✅ Voucher code sent to customer mobile
- ✅ Payment confirmation
- ✅ Voucher expiry reminder (30 days before)
- ✅ OTP for two-factor authentication
- ✅ Password reset verification

#### SMS Templates
Similar to email templates, customize SMS content with variables.

---

## 9. Customer Management

**Navigation**: Admin → Customers (route: `/app/admin/customers`)

**Full customer management documented in Finance Manager User Guide.**

As Flex Admin, you have full access to all customer functions.

---

## 10. Common Administrative Tasks

---

### Task 1: Onboarding New Counter Agent

**Scenario**: New employee hired as counter agent

**STEP 1: Create User Account**
1. Navigate to Users
2. Click **"Add User"**
3. Enter:
   - Email: newagent@example.com
   - Full Name: John Doe
   - Phone: +675 XXX XXXX
   - Role: Counter_Agent
   - Temporary Password: Welcome2026!
   - Check "Force password change on first login"
4. Click **"Create User"**

**STEP 2: Send Welcome Email**
- System automatically sends welcome email with login instructions
- Alternatively, copy login details and send via secure channel

**STEP 3: Training**
1. Provide Counter Agent User Guide
2. Walk through Individual Purchase workflow
3. Demonstrate MRZ scanner usage
4. Practice with test passport data
5. Explain cash reconciliation process

**STEP 4: Grant System Access**
1. Agent logs in with temporary password
2. System forces password change
3. Agent creates new secure password
4. Agent redirected to Counter Agent Home

**STEP 5: Monitor Initial Activity**
1. Check Login History to verify agent is logging in
2. Review agent's first few transactions for accuracy
3. Monitor cash reconciliations for proper process
4. Provide feedback and additional training if needed

**Time**: 30 minutes setup + 2-3 hours training

---

### Task 2: Monthly System Maintenance

**Scenario**: Routine end-of-month system maintenance

**STEP 1: Backup Database**
1. Navigate to Admin → System Settings
2. Click **"Backup Now"** button
3. Verify backup completes successfully
4. Download backup file to secure external location

**STEP 2: Review User Accounts**
1. Navigate to Users
2. Check for:
   - Inactive users (not logged in for 30+ days) → Deactivate
   - Users with expired passwords → Force password reset
   - Failed login attempts → Investigate security issues
3. Clean up test accounts or temporary accounts

**STEP 3: Review System Settings**
1. Check green fee amount - still correct? (PGK 50)
2. Verify email settings - test email working?
3. Review payment modes - any needed updates?

**STEP 4: Generate Monthly Reports**
1. Run Revenue Generated Report for last month
2. Run Corporate Voucher Report
3. Run Individual Purchase Report
4. Run Refunded Report
5. Compile into management summary

**STEP 5: Review Cash Reconciliations**
1. Ensure all pending reconciliations approved/rejected
2. Review agents with persistent variances
3. Schedule retraining if needed

**STEP 6: Check System Health**
1. Review Dashboard system health indicators
2. Check disk space, memory usage
3. Review error logs for any issues
4. Contact IT Support if problems detected

**STEP 7: Update Documentation**
1. Update any changed procedures
2. Distribute updated user guides if needed
3. Communicate changes to all users

**Time**: 2-3 hours

---

### Task 3: Investigating Suspicious Transaction

**Scenario**: Report of potentially fraudulent voucher

**STEP 1: Gather Information**
1. Get voucher code from reporter
2. Navigate to Vouchers List
3. Search for voucher code
4. Open voucher details

**STEP 2: Review Voucher History**
1. Check:
   - Issue date - when was it created?
   - Passport details - legitimate passport?
   - Payment method - cash, card, etc.
   - Amount paid - correct fee?
   - Agent who created - which staff member?
   - Status - registered, used, or expired?

**STEP 3: Check Related Transactions**
1. Click on linked transaction
2. Review payment details:
   - Transaction timestamp
   - IP address (if online purchase)
   - Receipt number
   - Payment reference

**STEP 4: Investigate Agent Activity**
1. Navigate to Users → Select agent
2. View Activity Log
3. Check:
   - Login times on that day
   - Other transactions around same time
   - Patterns of suspicious activity

**STEP 5: Check Passport**
1. Navigate to Passports → Search passport number
2. Verify:
   - Passport data looks legitimate
   - Name format correct
   - Dates logical (DOB, expiry)
   - Not linked to multiple vouchers (unless legitimate)

**STEP 6: Take Action**

**If Fraudulent**:
1. Click voucher → **"Cancel"** button
2. Select reason: "Fraud Prevention"
3. Add detailed notes about investigation
4. Process refund if customer payment involved
5. Suspend agent account if staff fraud suspected
6. Report to management and/or authorities

**If Legitimate**:
1. Add notes to voucher: "Investigated on [date], verified legitimate"
2. Inform reporter of outcome
3. No action needed

**STEP 7: Document**
1. Create incident report
2. Include:
   - Voucher details
   - Investigation steps
   - Findings
   - Action taken
   - Follow-up required
3. File report for audit trail

**Time**: 30 minutes to 2 hours depending on complexity

---

### Task 4: System Update/Upgrade

**Scenario**: New software version available

**STEP 1: Review Release Notes**
1. Read what's new in update
2. Check for breaking changes
3. Note new features
4. Review bug fixes

**STEP 2: Plan Downtime**
1. Schedule during low-traffic time (e.g., Sunday 2am)
2. Notify all users via email 48 hours in advance
3. Post notice on login page

**STEP 3: Pre-Update Backup**
1. Create full system backup
2. Backup database
3. Backup configuration files
4. Download backup to external location

**STEP 4: Perform Update**
1. Put system in maintenance mode (displays maintenance page to users)
2. Apply software update
3. Update database schema if required
4. Clear caches
5. Restart services

**STEP 5: Test System**
1. Log in as each role type
2. Test critical functions:
   - Create voucher
   - Process payment
   - Generate report
   - Send email
   - View data
3. Verify all features working
4. Check for errors in logs

**STEP 6: Take System Live**
1. Disable maintenance mode
2. Monitor for first 30 minutes
3. Check user logins
4. Watch for error reports

**STEP 7: Post-Update Communication**
1. Email all users: "System updated successfully"
2. Highlight new features
3. Provide link to updated documentation
4. Offer training on new features if needed

**Time**: 2-4 hours (mostly overnight)

---

### Task 5: Emergency Data Recovery

**Scenario**: Accidental deletion or data corruption

**STEP 1: Assess Damage**
1. Determine what was lost:
   - Single voucher?
   - User account?
   - Batch of transactions?
   - Entire database?
2. Identify when problem occurred
3. Check if backup exists for that time

**STEP 2: Stop Further Changes**
1. If significant data loss, put system in read-only mode
2. Prevent users from making additional changes
3. Preserve current state for recovery

**STEP 3: Locate Backup**
1. Navigate to backup location
2. Find most recent backup BEFORE the problem
3. Download backup file
4. Verify backup integrity

**STEP 4: Restore Data**

**For Single Record** (voucher, user, etc.):
1. Extract just that record from backup
2. Manually re-enter into system
3. Verify all related records intact

**For Multiple Records**:
1. Restore from backup to test environment first
2. Export affected records from backup
3. Import into live system
4. Reconcile any discrepancies

**For Full System**:
1. Take system offline
2. Restore full database from backup
3. Re-apply any changes made AFTER backup (if possible)
4. Bring system back online

**STEP 5: Verify Recovery**
1. Check all affected records present and correct
2. Verify data integrity
3. Run reports to confirm accuracy
4. Test related functionality

**STEP 6: Investigate Root Cause**
1. Determine how data was lost:
   - User error?
   - Software bug?
   - Hardware failure?
   - Security breach?
2. Implement safeguards to prevent recurrence

**STEP 7: Document Incident**
1. Create detailed incident report
2. Include:
   - What happened
   - When it was discovered
   - Impact (how much data lost)
   - Recovery steps taken
   - Downtime duration
   - Root cause
   - Prevention measures
3. Share with management
4. Update disaster recovery procedures if needed

**Time**: 1-8 hours depending on severity

---

## Security and Best Practices

### Admin Account Security
- **Never share admin credentials** - each admin should have their own account
- **Use strong passwords** - minimum 12 characters with mix of types
- **Enable two-factor authentication** - if available
- **Log out when leaving computer** - even for short periods
- **Review your own activity log** - watch for unauthorized access
- **Change password every 60 days** - more frequently than standard users

### Data Protection
- **Limit admin access** - only assign Flex_Admin role when truly needed
- **Regular backups** - verify backups are working weekly
- **Test restores** - practice recovering from backup quarterly
- **Encrypt sensitive data** - especially payment information
- **Secure backup storage** - offsite and encrypted

### Audit and Compliance
- **Review activity logs weekly** - look for anomalies
- **Monitor failed logins** - investigate patterns
- **Document all changes** - especially system settings changes
- **Maintain audit trail** - never delete historical data
- **Generate compliance reports** - for government audits

### User Management Best Practices
- **Principle of least privilege** - give users minimum access needed
- **Remove access promptly** - deactivate users on last day of employment
- **Review user list monthly** - remove unused accounts
- **Enforce password policies** - don't allow weak passwords
- **Train users on security** - phishing, password safety, etc.

### System Maintenance
- **Apply updates promptly** - security patches especially
- **Monitor system health** - disk space, memory, CPU
- **Clean up old data** - archive or delete if allowed by policy
- **Test disaster recovery** - quarterly drills
- **Keep documentation current** - update after any changes

---

## Support and Escalation

### Technical Issues
- **IT Support Role**: For user account issues, report generation problems
- **Software Vendor**: For system bugs, feature requests
- **Email**: support@greenpay.eywademo.cloud

### Financial Issues
- **Finance Manager**: For payment discrepancies, reconciliation questions
- **Accounting Department**: For financial reporting, audit requirements

### Security Incidents
- **Immediate**: Suspend affected accounts, lock down system
- **Document**: Take screenshots, logs, notes
- **Report**: To management and IT security team
- **Investigate**: Determine breach source and scope

### Disaster Recovery
- **System Down**: Follow disaster recovery procedures
- **Data Loss**: Restore from backup immediately
- **Security Breach**: Notify all affected users, reset passwords
- **Hardware Failure**: Contact hosting provider or IT department

---

## Quick Reference

### Admin-Only Routes
- `/app/users` - User Management
- `/app/admin/settings` - System Settings
- `/app/admin/payment-modes` - Payment Modes Configuration
- `/app/admin/email-templates` - Email Template Editor
- `/app/admin/payment-gateway` - Payment Gateway Settings
- `/app/admin/sms-settings` - SMS Configuration
- `/app/admin/login-history` - Login Activity Log

### Keyboard Shortcuts
- `Ctrl+K` - Quick search
- `Ctrl+U` - Jump to Users
- `Ctrl+R` - Jump to Reports
- `Ctrl+P` - Print current page
- `Ctrl+/` - Show all shortcuts

### Standard Settings
- **Green Fee**: PGK 50.00
- **Voucher Validity**: 12 months
- **Session Timeout**: 30 minutes
- **Backup Time**: Daily at 2:00 AM

---

## Appendices

### Appendix A: Role Permission Matrix

Full details in Role Comparison Table (Section 3).

### Appendix B: Database Schema

Available in technical documentation. Contact IT for access.

### Appendix C: API Documentation

For developers integrating with the system. Available at `/docs/api`

### Appendix D: Disaster Recovery Procedures

Detailed step-by-step procedures stored in secure admin documentation.

### Appendix E: Compliance Checklist

For government audits and regulatory compliance. Review quarterly.

---

**Document Version**: 1.0
**Last Updated**: January 2026
**System URL**: https://greenpay.eywademo.cloud
**Admin Support**: support@greenpay.eywademo.cloud
