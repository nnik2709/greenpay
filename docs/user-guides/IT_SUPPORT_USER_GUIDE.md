# IT Support User Guide
## PNG Green Fees System

---

## Overview

As an **IT Support** staff member, you provide technical assistance to system users, manage user accounts, troubleshoot issues, and monitor system performance. Your role focuses on user support, account management, and technical reporting while maintaining limited access to financial functions to protect data security.

---

## Table of Contents

1. [Login](#1-login)
2. [Dashboard](#2-dashboard)
3. [User Management](#3-user-management)
4. [Technical Support](#4-technical-support)
5. [Support Tickets](#5-support-tickets)
6. [System Monitoring](#6-system-monitoring)
7. [Reports Access](#7-reports-access)
8. [Passport & Voucher View](#8-passport--voucher-view)
9. [Invoice View](#9-invoice-view)
10. [Common Support Scenarios](#10-common-support-scenarios)

---

## 1. Login

### Access the System
1. Navigate to: **https://greenpay.eywademo.cloud**
2. Enter your IT Support credentials
3. Click **"Sign In"**

### After Login
- Redirected to **Dashboard**
- Navigation menu shows modules you have access to
- You have user management and view-only access to most features

---

## 2. Dashboard

The Dashboard provides system overview and support metrics.

### Metrics Displayed
- **Total Users**: User count by role
- **Active Users Today**: Users currently logged in
- **Total Vouchers**: System-wide voucher count
- **System Status**: Server health indicators
- **Recent Support Tickets**: Your assigned tickets
- **Failed Logins**: Potential lockout issues
- **Recent User Activity**: Last 10 system events

### Quick Actions
- Create User
- Reset Password
- View Support Tickets
- Check Login History
- Generate Reports
- View System Logs

---

## 3. User Management

**Navigation**: Click **"Users"** in menu (route: `/app/users`)

You have full user management capabilities (same as Flex Admin).

### View All Users

**User List Displays**:
- Email Address
- Full Name
- Role
- Status (Active, Inactive, Suspended)
- Last Login
- Created Date
- Actions

### Add New User

**STEP 1: Click "Add User"**

**STEP 2: Enter User Details**
1. **Email**: Unique email address (used for login)
2. **Full Name**: User's complete name
3. **Phone**: Contact number (optional)
4. **Role**: Select from dropdown:
   - Flex_Admin (requires approval from senior admin)
   - Finance_Manager
   - Counter_Agent
   - IT_Support
5. **Initial Password**: Temporary password (min 8 characters)
   - User must change on first login
6. **Status**: Active

**STEP 3: Save**
1. Click **"Create User"**
2. System sends welcome email to user
3. Provide login details to user securely

### Edit User

1. Click user email in list
2. Can modify:
   - Full Name
   - Phone Number
   - Role (may have restrictions based on your permissions)
   - Status
3. Click **"Update"**

### Reset User Password

**Common scenario: User forgot password**

**STEP 1: Locate User**
1. Search for user by email or name
2. Click on user

**STEP 2: Reset Password**
1. Click **"Reset Password"** button
2. Enter new temporary password
   - Or click **"Generate"** for random secure password
3. Check **"Force password change on next login"**
4. Click **"Reset"**

**STEP 3: Communicate to User**
1. Copy temporary password
2. Send to user via secure method:
   - In-person (best for sensitive cases)
   - Phone call
   - SMS (if configured)
   - Email (least secure, avoid for high-privilege accounts)
3. Instruct user to change password immediately

### Unlock User Account

**Scenario: User exceeded failed login attempts (5)**

**STEP 1: Verify User Identity**
1. User contacts you: "I'm locked out"
2. Verify it's legitimate user (ask security questions)
3. Confirm they are the account owner

**STEP 2: Check Login History**
1. Navigate to Admin → Login History (route: `/app/admin/login-history`)
2. Filter by user email
3. Review recent failed attempts:
   - Are they from user's normal IP?
   - Are there suspicious patterns?
   - Could be brute force attack?

**STEP 3: Unlock Account**
**If legitimate lockout**:
1. Go to Users → Select user
2. Click **"Unlock Account"** button
3. Account status changes to Active
4. User can log in again

**Optionally**: Reset password if you suspect compromise

**If suspicious activity**:
1. Keep account locked
2. Create support ticket for security review
3. Escalate to Flex Admin or security team
4. Contact user to verify recent login attempts

### Deactivate User

**Scenario: Employee leaving company**

**STEP 1: Receive Deactivation Request**
- Usually from HR or management
- Verify authorization to deactivate

**STEP 2: Deactivate**
1. Navigate to Users
2. Find user account
3. Click **"Deactivate"** button
4. Confirm action
5. User status → "Inactive"
6. User cannot log in
7. Data preserved for audit

**STEP 3: Document**
1. Note deactivation date
2. Record who requested
3. Create ticket or log entry

**STEP 4: Follow Up**
- Remove from email distribution lists
- Archive any user-specific documentation
- Transfer ticket ownership if needed

### View User Activity

**Useful for troubleshooting or audit**

**STEP 1: Access User Activity**
1. Navigate to Users
2. Click user email
3. Click **"Activity"** tab

**STEP 2: Review Activity Log**
Shows:
- **Login History**: Dates, times, IPs
- **Actions**: Vouchers created, reports generated, etc.
- **Failed Logins**: Unsuccessful login attempts
- **Password Changes**: When password was reset
- **Exports**: Data exports performed

**STEP 3: Export Activity**
- Click **"Export"** button
- Download CSV for analysis or audit
- Useful for security investigations

---

## 4. Technical Support

### Common User Issues and Solutions

#### Issue 1: Cannot Log In

**Symptoms**: "Invalid credentials" or "Account locked"

**Troubleshooting Steps**:
1. **Verify email address**: Check for typos
2. **Check caps lock**: Password is case-sensitive
3. **Check account status**: Is it active?
4. **Check failed attempts**: Is account locked?
5. **Try password reset**: If user unsure of password

**Solutions**:
- Unlock account if locked
- Reset password if forgotten
- Reactivate if deactivated
- Check if user exists (might need new account)

---

#### Issue 2: Email Not Sending

**Symptoms**: "Voucher email not received" or "Quotation email not sent"

**Troubleshooting Steps**:
1. **Check spam folder**: Often caught by filters
2. **Verify email address**: Correct format? Typos?
3. **Check system email logs**: Did system attempt to send?
4. **Test email settings**: Send test email from system
5. **Check recipient mail server**: Some block automated emails

**Solutions**:
- Whitelist system email address
- Use alternative email address
- Download PDF and send manually
- Contact Flex Admin if system email settings issue

---

#### Issue 3: MRZ Scanner Not Working

**Symptoms**: "Passport scan doesn't populate fields"

**Troubleshooting Steps**:
1. **Check USB connection**: Unplug and replug
2. **Check device manager**: Scanner recognized?
3. **Test scanner**: Open Notepad, scan passport - does text appear?
4. **Check scanner settings**: Keyboard wedge mode?
5. **Try different USB port**: Could be port issue

**Solutions**:
- Reconnect scanner
- Restart computer if needed
- Reinstall scanner driver (rarely needed for keyboard wedge)
- Use manual entry as workaround
- Replace scanner if hardware failure

---

#### Issue 4: Barcode Scanner Not Working

**Symptoms**: "Voucher code not scanning"

**Similar troubleshooting to MRZ scanner**:
1. Check USB connection
2. Test in Notepad (should type numbers)
3. Check barcode quality (not damaged?)
4. Clean scanner lens
5. Try different angle

**Solutions**:
- Clean barcode
- Reprint voucher if damaged
- Manually type 8-character code
- Replace scanner if faulty

---

#### Issue 5: Print Dialog Not Opening

**Symptoms**: "Click print button, nothing happens"

**Troubleshooting Steps**:
1. **Check popup blocker**: Browser blocking popups?
2. **Check browser permissions**: Allow popups for greenpay.eywademo.cloud
3. **Try different browser**: Chrome, Firefox, Edge
4. **Clear browser cache**: Old cached files causing issue
5. **Check printer connection**: Printer online?

**Solutions**:
- Allow popups in browser settings
- Use "Download PDF" then print from file
- Clear cache and cookies
- Update browser to latest version

---

#### Issue 6: Slow System Performance

**Symptoms**: "System is slow" or "Pages take long to load"

**Troubleshooting Steps**:
1. **Check internet connection**: Run speed test
2. **Check browser tabs**: Too many tabs open?
3. **Check computer resources**: Memory/CPU usage high?
4. **Check system status**: Server issues?
5. **Try different time**: Peak usage times slower?

**Solutions**:
- Close unused browser tabs
- Restart browser
- Restart computer
- Clear browser cache
- Contact Flex Admin if server-side issue

---

#### Issue 7: Data Not Saving

**Symptoms**: "Click save, but data not saved" or "Changes not persisting"

**Troubleshooting Steps**:
1. **Check for error messages**: Any red error notifications?
2. **Check required fields**: All required fields filled?
3. **Check network connection**: Network interruption?
4. **Check browser console**: JavaScript errors? (F12 → Console)
5. **Try in incognito mode**: Browser extension causing issue?

**Solutions**:
- Fill all required fields
- Disable browser extensions temporarily
- Try different browser
- Log out and log back in
- Contact Flex Admin if persistent

---

## 5. Support Tickets

**Navigation**: Click **"Support Tickets"** in menu (route: `/app/tickets`)

Manage user-submitted support requests.

### View All Tickets

**Ticket List Displays**:
- Ticket ID (e.g., TKT-2026-001)
- User (who submitted)
- Subject
- Category (Login, Scanner, Payment, Report, Other)
- Priority (Low, Medium, High, Critical)
- Status (New, Assigned, In Progress, Resolved, Closed)
- Created Date
- Assigned To (IT Support staff member)

### Ticket Categories
- **Login Issues**: Cannot log in, forgot password, locked account
- **Hardware**: Scanner problems, printer issues, computer problems
- **Software**: System bugs, feature requests, UI issues
- **Reports**: Cannot generate report, wrong data, export issues
- **Performance**: Slow system, timeout errors
- **Data**: Missing data, incorrect data, data entry errors
- **Other**: Miscellaneous requests

### Ticket Workflow

**STEP 1: New Ticket Arrives**
- User submits ticket via system
- You receive notification (email or dashboard alert)
- Ticket appears in your queue as "New"

**STEP 2: Assign Ticket**
- If ticket auto-assigned to you: automatically "Assigned"
- If unassigned: Click **"Assign to Me"** button
- Or assign to another IT Support team member

**STEP 3: Triage**
- Read ticket description
- Assess priority:
  - **Critical**: System down, cannot process payments
  - **High**: Major feature broken, multiple users affected
  - **Medium**: Single user issue, workaround available
  - **Low**: Enhancement request, minor inconvenience
- Update priority if needed

**STEP 4: Work on Ticket**
1. Change status to **"In Progress"**
2. Investigate issue (follow troubleshooting steps)
3. Add comments to ticket:
   - Troubleshooting steps taken
   - Findings
   - Solution attempted
4. Contact user if more information needed
5. Apply fix

**STEP 5: Resolve Ticket**
1. Verify issue is fixed
2. Add resolution notes to ticket:
   - What the problem was
   - What you did to fix it
   - Steps to prevent recurrence
3. Change status to **"Resolved"**
4. Notify user: "Issue has been resolved. Please confirm it's working."

**STEP 6: Close Ticket**
- After user confirms fix: Change status to **"Closed"**
- Or auto-close after 48 hours if no response
- Ticket archived for future reference

### Escalation

**When to Escalate to Flex Admin**:
- System-wide issues affecting all users
- Server or infrastructure problems
- Security incidents (suspected breach)
- Data corruption or loss
- Issues requiring system configuration changes
- Payment gateway problems

**How to Escalate**:
1. Click ticket → **"Escalate"** button
2. Select escalation reason
3. Add detailed notes about:
   - What you've tried
   - Why escalation needed
   - Urgency level
4. Click **"Escalate to Admin"**
5. Flex Admin receives notification
6. Continue assisting user until admin responds

### Create Ticket (On Behalf of User)

**Scenario**: User calls or emails instead of using ticket system

**STEP 1: Create Ticket**
1. Navigate to Support Tickets
2. Click **"Create Ticket"** button
3. Fill in:
   - **User**: Select user from dropdown (or enter email)
   - **Subject**: Brief description (e.g., "Cannot print vouchers")
   - **Category**: Choose appropriate category
   - **Priority**: Assess based on conversation
   - **Description**: Detailed problem description
   - **Assign To**: Yourself (if you're handling it)
4. Click **"Create"**

**STEP 2: Work on Ticket**
- Follow normal ticket workflow
- Keep ticket updated with progress
- Communicate with user via phone/email + ticket notes

---

## 6. System Monitoring

### Login History

**Navigation**: Admin → Login History (route: `/app/admin/login-history`)

Monitor user login activity for security and troubleshooting.

#### View Login History
- Date/Time
- User Email
- Role
- Status (Success, Failed, Locked)
- IP Address
- Device/Browser
- Location (approximate)

#### Filter Options
- Date range
- User
- Status
- Role
- IP address

#### Use Cases

**Security Monitoring**:
1. Check for unusual login patterns:
   - Multiple failed logins (brute force?)
   - Logins from unexpected locations
   - After-hours logins (authorized?)
2. Investigate suspicious activity
3. Report security concerns to Flex Admin

**Troubleshooting**:
1. User says "I can't log in":
   - Check their login attempts
   - See error details
   - Determine if locked out
2. User says "Someone accessed my account":
   - Review login history
   - Check IPs and locations
   - Verify if unauthorized access

**Compliance**:
1. Generate login reports for audits
2. Export activity logs
3. Prove user access patterns

---

## 7. Reports Access

**Navigation**: Reports menu (route: `/app/reports`)

You have view-only access to most reports (no Quotations reports).

### Available Reports

1. **Passport Reports** - View all passport data
2. **Individual Purchase Reports** - Counter sales analytics
3. **Corporate Voucher Reports** - Bulk voucher data
4. **Revenue Generated Reports** - Financial summaries
5. **Refunded Reports** - Refund tracking
6. **Cash Reconciliation Reports** - View-only (cannot approve)

**Quotations Reports**: ❌ Not accessible (Finance Manager and Flex Admin only)

### Report Usage for IT Support

**Primary Use Cases**:
1. **Data Verification**: User reports missing data, verify in reports
2. **Troubleshooting**: User says "My transaction didn't save", check reports
3. **User Training**: Show users how to generate reports
4. **System Testing**: After updates, verify reports still work

**Limitations**:
- **View-only**: Cannot edit data from reports
- **No approval**: Cannot approve reconciliations
- **No export** (in some cases): May have limited export permissions

---

## 8. Passport & Voucher View

### All Passports

**Navigation**: Passports → All Passports (route: `/app/passports`)

**❌ Limited Access**: IT Support does NOT have access to passport list

### Vouchers List

**Navigation**: Passports → Vouchers List (route: `/app/vouchers-list`)

**✅ View Access**: Can view all vouchers (read-only)

#### What You Can Do
- Search vouchers by code or passport
- View voucher details
- Check voucher status
- Verify voucher validity

#### What You Cannot Do
- ❌ Create vouchers
- ❌ Edit vouchers
- ❌ Cancel vouchers
- ❌ Extend expiry
- ❌ Process refunds

#### Support Use Case
**User calls**: "Is my voucher valid? Code ABC12345"

**Your response**:
1. Navigate to Vouchers List
2. Search for ABC12345
3. Check status:
   - ✅ Active: "Yes, your voucher is valid until [date]"
   - ❌ Expired: "Voucher expired on [date], contact Finance Manager"
   - ❌ Used: "Voucher was already used on [date]"
4. Provide assistance based on status

---

## 9. Invoice View

**Navigation**: Quotations & Invoices → Tax Invoices (route: `/app/invoices`)

**✅ View Access**: Can view invoices (read-only)

### What You Can Do
- Search invoices
- View invoice details
- Verify invoice status
- Check payment history

### What You Cannot Do
- ❌ Create invoices
- ❌ Edit invoices
- ❌ Record payments
- ❌ Send invoices

### Support Use Case
**Corporate customer calls**: "Did you receive our payment for invoice INV-2026-050?"

**Your response**:
1. Navigate to Invoices
2. Search for INV-2026-050
3. Check payment status:
   - Paid: "Yes, payment received on [date]"
   - Unpaid: "No payment recorded yet. Please contact Finance Manager."
   - Partial: "Partial payment of PGK X received. Balance: PGK Y"
4. Refer to Finance Manager for payment issues

---

## 10. Common Support Scenarios

---

### Scenario 1: New Employee Onboarding

**Situation**: New counter agent starting tomorrow, needs system access

**STEP 1: Receive Request**
- HR or manager emails: "Please create account for John Doe, starting Monday as Counter Agent"
- Verify authorization (email from authorized person)

**STEP 2: Create User Account**
1. Navigate to Users → Add User
2. Enter:
   - Email: john.doe@example.com
   - Full Name: John Doe
   - Phone: +675 XXX XXXX
   - Role: Counter_Agent
   - Password: Welcome2026! (temporary)
   - Force password change: Yes
3. Click Create

**STEP 3: Prepare Welcome Information**
1. Copy login credentials
2. Prepare welcome document:
   - System URL: https://greenpay.eywademo.cloud
   - Username: john.doe@example.com
   - Temporary Password: Welcome2026!
   - Counter Agent User Guide link
3. Email to employee (or print for in-person handoff)

**STEP 4: Coordinate Training**
1. Schedule training session if needed
2. Ensure trainer has Counter Agent User Guide
3. Follow up after first week: "Any issues with system access?"

**Time**: 15 minutes

---

### Scenario 2: Forgotten Password

**Situation**: User calls "I forgot my password, can't log in"

**STEP 1: Verify Identity**
1. Ask security questions:
   - Full name?
   - Email address used for login?
   - Role in system?
   - Last time successfully logged in?
2. Match answers with user record

**STEP 2: Reset Password**
1. Navigate to Users
2. Find user by email
3. Click "Reset Password"
4. Generate new temporary password
5. Check "Force password change on next login"
6. Click Reset

**STEP 3: Communicate New Password**
1. Read password over phone (if user verified)
2. Or email to user's registered email
3. Spell out carefully to avoid confusion:
   - Use phonetic alphabet for letters
   - Clearly state capital vs lowercase
   - Clarify numbers vs letters (0 vs O, 1 vs l)

**STEP 4: Guide User**
1. User navigates to login page
2. Enters email and temporary password
3. System prompts to change password
4. User creates new password meeting requirements
5. User logs in with new password

**STEP 5: Confirm Success**
- Ask user: "Were you able to log in?"
- If yes: Close ticket
- If no: Troubleshoot further

**Time**: 5-10 minutes

---

### Scenario 3: Account Locked Due to Failed Logins

**Situation**: User calls "I tried logging in multiple times, now it says account locked"

**STEP 1: Verify User**
- Confirm user identity (security questions)
- Ask: "How many times did you try?" (should be around 5)

**STEP 2: Check Login History**
1. Navigate to Admin → Login History
2. Filter by user email
3. Review recent attempts:
   - Check IPs: User's normal location?
   - Check times: Recent (last few minutes)?
   - Count failed attempts: Should be 5+

**STEP 3: Assess Security Risk**
**If legitimate lockout**:
- Failed attempts from user's normal IP
- Times match when user called
- User recognizes the attempts

**If suspicious**:
- Failed attempts from unknown IPs
- Multiple IPs trying same account
- Attempts when user wasn't trying to log in

**STEP 4: Unlock Account**
**If legitimate**:
1. Navigate to Users → Select user
2. Click "Unlock Account"
3. Tell user: "Account unlocked. Try logging in now."
4. Stay on line while user tries

**If suspicious**:
1. Keep account locked
2. Ask user: "Have you shared your password with anyone?"
3. Reset password immediately
4. Unlock account
5. Provide new temporary password
6. Create security incident ticket
7. Escalate to Flex Admin

**STEP 5: Educate User**
- Remind: "System locks after 5 failed attempts for security"
- Suggest: "If you forget password, use 'Reset Password' instead of guessing"

**Time**: 10-15 minutes

---

### Scenario 4: MRZ Scanner Hardware Issue

**Situation**: Counter agent calls "Passport scanner stopped working, I have customers waiting"

**HIGH PRIORITY** - Affects customer service

**STEP 1: Quick Assessment**
- Ask: "When did it stop working?" (today, just now, etc.)
- Ask: "Did anything change?" (Windows update, moved scanner, etc.)
- Ask: "Do you have another computer/scanner available?" (workaround)

**STEP 2: Remote Troubleshooting**
1. "Is the scanner plugged in? Check USB cable"
2. "Try unplugging and plugging back in"
3. "Open Notepad, scan a passport - does text appear?"
   - If yes: Problem is with website, escalate
   - If no: Hardware or driver issue

**STEP 3: Test Scanner**
1. If text appears in Notepad: Scanner works, browser/site issue
   - Clear browser cache
   - Try different browser
   - Restart browser
2. If no text in Notepad: Scanner not working
   - Try different USB port
   - Restart computer
   - Check Device Manager (scanner recognized?)

**STEP 4: Provide Workaround**
If scanner can't be fixed immediately:
- "Use manual entry for now - type passport details into form"
- Or: "Use backup scanner if available"
- Or: "Switch to another workstation"

**STEP 5: Escalate or Resolve**
**If fixed**: Close ticket
**If not fixed**:
1. Create urgent support ticket
2. Contact Flex Admin or procurement: "Need replacement scanner"
3. Arrange on-site support if needed
4. Provide estimated fix time to agent

**Time**: 15-30 minutes

---

### Scenario 5: Report Not Generating

**Situation**: Finance Manager calls "Revenue report won't generate, just spins"

**STEP 1: Reproduce Issue**
1. Ask: "Which report?" (Revenue Generated, Passport, etc.)
2. Ask: "What date range?" (might be too large)
3. Ask: "What filters?" (specific settings causing issue?)
4. Try generating same report yourself

**STEP 2: Troubleshooting**
**If report generates for you**:
- Problem might be user's browser or connection
- Ask user to try:
  - Different browser
  - Clear cache
  - Different date range (smaller)

**If report doesn't generate for you either**:
- System-wide issue
- Check other reports - are they working?
- Check system status - server overloaded?

**STEP 3: Workaround**
1. Try smaller date range: "Instead of full year, try one month at a time"
2. Try different export format: "Try CSV instead of Excel"
3. Try different time: "System may be busy, try in 30 minutes"

**STEP 4: Escalate if Needed**
If issue persists:
1. Create ticket with details:
   - Which report
   - Date range attempted
   - Error message (screenshot if possible)
   - Browser and version
2. Escalate to Flex Admin
3. Provide workaround to user

**Time**: 10-20 minutes

---

### Scenario 6: User Training Request

**Situation**: Counter agent emails "Can you show me how to generate cash reconciliation report?"

**STEP 1: Assess Need**
- Is this covered in user guide?
- Does user have access to Counter Agent User Guide?
- Is this one-on-one training or group need?

**STEP 2: Provide Documentation**
1. Reply with link to user guide
2. Point to specific section: "Cash Reconciliation section, page X"
3. Offer: "If you still need help after reading, let me know"

**STEP 3: Schedule Training (if needed)**
If user still needs help:
1. Schedule 15-minute training session
2. Screen share or in-person
3. Walk through process step-by-step
4. Have user practice while you watch
5. Answer questions

**STEP 4: Create Training Materials (if recurring request)**
If multiple users asking same question:
1. Create quick reference guide
2. Record screen capture video
3. Add to shared knowledge base
4. Announce to all users: "New training resource available"

**Time**: 5 minutes (documentation) to 30 minutes (training)

---

## Best Practices

### User Support
- **Be patient and friendly** - users may be frustrated
- **Use simple language** - avoid technical jargon
- **Document everything** - update tickets with details
- **Follow up** - verify issue is resolved after fix
- **Educate users** - teach them to prevent future issues

### Security
- **Verify identity** - always confirm user before resetting passwords
- **Monitor suspicious activity** - review login history regularly
- **Report incidents** - escalate security concerns immediately
- **Protect credentials** - never share passwords via unsecured email
- **Follow protocols** - don't circumvent security measures

### Ticket Management
- **Respond quickly** - acknowledge tickets within 1 hour
- **Keep users informed** - update on progress every few hours
- **Set expectations** - provide estimated resolution time
- **Close properly** - verify fix before closing
- **Learn from patterns** - if same issue recurring, document permanent fix

### Time Management
- **Prioritize by impact**: Critical (system down) > High (multiple users) > Medium (single user) > Low (enhancement)
- **Batch similar tasks**: Reset multiple passwords at once
- **Use templates**: Common responses for common issues
- **Schedule preventive maintenance**: Regular system checks

---

## Support Resources

### Documentation
- **Counter Agent User Guide**: For agent-related questions
- **Finance Manager User Guide**: For financial questions
- **Flex Admin User Guide**: For system administration questions
- **This Guide (IT Support)**: For your reference

### Internal Support
- **Flex Admin**: For system configuration, escalations, security issues
- **Finance Manager**: For payment, invoice, quotation questions
- **Senior IT Support**: For complex technical issues

### External Support
- **Software Vendor**: support@greenpay.eywademo.cloud
- **Hardware Vendor**: For scanner, printer, POS terminal issues
- **Internet Provider**: For network connectivity issues

### Knowledge Base
- **Support Tickets History**: Search resolved tickets for similar issues
- **System Documentation**: Technical docs (if available)
- **Training Materials**: User guides, video tutorials

---

## Tools and Access

### What You Have Access To
- ✅ User Management (Create, Edit, Reset Password, Deactivate)
- ✅ Support Tickets (View, Create, Assign, Resolve)
- ✅ Login History (View, Export)
- ✅ Reports (View-only, most types)
- ✅ Vouchers List (View-only)
- ✅ Invoices (View-only)
- ✅ Dashboard (System overview)

### What You Don't Have Access To
- ❌ System Settings Configuration
- ❌ Payment Mode Management
- ❌ Email Template Editing
- ❌ Payment Gateway Settings
- ❌ Financial Transactions (Process payments, refunds)
- ❌ Quotations Creation/Editing
- ❌ Cash Reconciliation Approval
- ❌ Passport Creation/Editing
- ❌ Corporate Voucher Generation

If a request requires access you don't have: **Escalate to Flex Admin**

---

## Quick Reference

### Key Routes
- **Dashboard**: `/app/dashboard`
- **Users**: `/app/users`
- **Support Tickets**: `/app/tickets`
- **Login History**: `/app/admin/login-history`
- **Reports**: `/app/reports`
- **Vouchers List**: `/app/vouchers-list`
- **Invoices**: `/app/invoices`

### Common Actions
- **Create User**: Users → Add User
- **Reset Password**: Users → Select User → Reset Password
- **Unlock Account**: Users → Select User → Unlock Account
- **View Login History**: Admin → Login History
- **Create Ticket**: Support Tickets → Create Ticket
- **View Reports**: Reports → Select Report Type

### Priority Levels
- 🔴 **Critical**: System down, cannot process customers (respond immediately)
- 🟠 **High**: Major feature broken, multiple users affected (respond within 30 min)
- 🟡 **Medium**: Single user issue, workaround available (respond within 2 hours)
- 🟢 **Low**: Enhancement request, minor inconvenience (respond within 1 day)

### Escalation Criteria
Escalate to Flex Admin if:
- System-wide outage
- Security breach suspected
- Data corruption or loss
- Issue beyond your access level
- No resolution after 2 hours of troubleshooting

---

**Document Version**: 1.0
**Last Updated**: January 2026
**System URL**: https://greenpay.eywademo.cloud
**IT Support Email**: support@greenpay.eywademo.cloud
