# Counter Agent User Guide
## PNG Green Fees System

---

## Overview

As a **Counter Agent**, you are the frontline staff member who processes individual green fee vouchers at the counter. Your primary responsibilities include scanning passports, accepting payments, generating vouchers, and reconciling cash at the end of each shift.

---

## Table of Contents

1. [Login](#1-login)
2. [Home Dashboard](#2-home-dashboard)
3. [Main Functions](#3-main-functions)
   - 3.1 [Scan Passport & Generate Voucher](#31-scan-passport--generate-voucher)
   - 3.2 [Validate Existing Voucher](#32-validate-existing-voucher)
   - 3.3 [Add Passport to Voucher](#33-add-passport-to-voucher)
4. [View All Passports](#4-view-all-passports)
5. [View Vouchers List](#5-view-vouchers-list)
6. [Cash Reconciliation](#6-cash-reconciliation)
7. [Common Workflows](#7-common-workflows)

---

## 1. Login

### Access the System
1. Open your web browser and navigate to: **https://greenpay.eywademo.cloud**
2. You will see the staff login page with the PNG logo

### Enter Credentials
1. **Email Address**: Enter your assigned counter agent email
2. **Password**: Enter your password
3. Click **"Sign In"** button

### After Login
- You will be automatically redirected to the **Counter Agent Home** page
- The green header at the top shows your navigation menu

---

## 2. Home Dashboard

After logging in, you see the Counter Agent landing page with three main action cards:

### Card 1: Scan Passport & Generate Voucher
- **Purpose**: Process individual walk-in customers
- **Method**: PrehKeyTec MRZ scanner (primary method)
- **Payment**: Accept cash/card/POS Terminal payment
- **Output**: Print 8-character GREEN CARD instantly

### Card 2: Validate Existing Voucher
- **Purpose**: Check corporate or online purchased vouchers
- **Method**: Scan 8-character barcode with USB scanner
- **Validation**: Check validity (12 months) and passport data

### Card 3: Add Passport to Voucher
- **Purpose**: Link passport to an unregistered voucher
- **Method**: Scan voucher barcode, then scan passport with MRZ scanner
- **Output**: Print or email complete GREEN CARD

### Navigation Menu
Located in the green header bar:
- **Home**: Return to this landing page
- **All Passports**: View all processed passports
- **Individual Green Pass**: Create individual voucher
- **Vouchers List**: View all vouchers
- **Cash Reconciliation**: End-of-shift cash count

---

## 3. Main Functions

---

### 3.1 Scan Passport & Generate Voucher

**Navigation**: Click **"Individual Green Pass"** in the menu or the first card on Home

This is your main workflow for walk-in customers purchasing green fees at the counter.

#### Step-by-Step Process

**STEP 1: Scan Passport**
1. Customer presents their passport
2. Place passport on **PrehKeyTec MRZ scanner**
3. Scanner automatically reads the Machine Readable Zone (MRZ)
4. System populates:
   - Passport number
   - Full name
   - Nationality
   - Date of birth
   - Gender
   - Passport expiry date
5. **Optional**: Enter customer email address for voucher delivery

**STEP 2: Process Payment**
1. System displays: **Amount: PGK 50.00** (standard green fee)
2. Select payment method:
   - **Cash**: Customer pays cash at counter
   - **Card**: Customer uses credit/debit card
   - **EFTPOS**: Customer uses EFTPOS terminal
   - **Bank Transfer**: For pre-paid transfers
3. Click **"Process Payment"** button
4. System generates unique 8-character voucher code (e.g., A1B2C3D4)

**STEP 3: Voucher Generation**
After payment, you see the voucher screen with three options:

**Option A: Print Voucher** (Most Common)
1. Click **"🖨️ Print Voucher"** button
2. Browser print dialog opens **immediately**
3. Select your POS barcode printer
4. Click "Print"
5. Hand printed GREEN CARD to customer

**Option B: Email Voucher**
1. Click **"📧 Email Voucher"** button
2. Email dialog opens
3. Enter or confirm customer email address (field auto-focuses)
4. Click **"Send Email"**
5. Customer receives voucher via email with barcode

**Option C: Download Voucher**
1. Click **"⬇️ Download PDF"** button
2. PDF voucher downloads to your computer
3. Can be printed later or forwarded to customer

#### What the Voucher Contains
- **CCDA Logo** at the top
- **"GREEN CARD"** title
- **"Foreign Passport Holder"** subtitle
- **Coupon Number**: 8-character code with barcode
- **Registered Passport**: Passport number (linked)
- **Generation Date and Time**
- **Valid for**: 12 months from issue date

#### After Completing Transaction
1. Click **"Process New Payment"** button
2. System resets for next customer
3. Ready to scan next passport

---

### 3.2 Validate Existing Voucher

**Navigation**: Click **"Scan & Validate"** in the menu or the second card on Home (route: `/app/scan`)

Use this function to validate corporate vouchers or online purchases before customer exits PNG.

#### Step-by-Step Process

**STEP 1: Scan Voucher Barcode**
1. Customer presents their GREEN CARD voucher
2. Use USB barcode scanner to scan the 8-character code
3. Scanner input appears in the "Voucher Code" field
4. Click **"Validate"** button

**STEP 2: Review Validation Results**
The system displays:
- ✅ **Valid**: Voucher is active and can be used
  - Shows voucher code
  - Shows linked passport number (if registered)
  - Shows issue date
  - Shows expiry date (12 months from issue)

- ❌ **Invalid**: Voucher cannot be used
  - Reason: Already used
  - Reason: Expired (over 12 months old)
  - Reason: Not found in system

**STEP 3: Verify Passport Match**
- If voucher has registered passport, **verify it matches** the customer's physical passport
- If no passport registered, proceed to "Add Passport to Voucher" workflow

---

### 3.3 Add Passport to Voucher

**Navigation**: Visit `/voucher-registration` (Public URL) or scan the QR code on unregistered voucher

This function links a passport to a corporate or online purchased voucher that doesn't have a passport yet.

#### Step-by-Step Process

**STEP 1: Scan Voucher Barcode**
1. Customer presents unregistered GREEN CARD
2. Use USB barcode scanner to scan 8-character voucher code
3. Click **"Find Voucher"** button
4. System verifies voucher is valid and unregistered

**STEP 2: Scan Passport**
1. Customer presents their passport
2. Place passport on **PrehKeyTec MRZ scanner**
3. Scanner reads passport MRZ data
4. System automatically populates:
   - Passport number
   - Full name
   - Nationality
   - Date of birth
   - Gender
5. System validates passport hasn't already been used for another voucher

**STEP 3: Link and Generate**
1. Click **"Register Passport"** button
2. System links passport to voucher
3. System generates updated GREEN CARD with passport details

**STEP 4: Deliver Updated Voucher**
Choose one:
- **Print**: Print complete voucher with passport linked
- **Email**: Send to customer email
- **Download**: Download PDF

---

## 4. View All Passports

**Navigation**: Click **"All Passports"** in the menu (route: `/app/passports`)

This page shows all passports you've processed.

### Features

**Search and Filter**
- Search by passport number
- Search by passenger name
- Filter by date range
- Filter by nationality

**Passport List Columns**
- Passport Number
- Full Name
- Nationality
- Date of Birth
- Gender
- Voucher Code (if issued)
- Issue Date
- Status (Active/Expired/Used)

**Actions**
- Click on any passport to view full details
- View linked voucher information
- See payment history

---

## 5. View Vouchers List

**Navigation**: Click **"Vouchers List"** in the menu (route: `/app/vouchers-list`)

This page displays all vouchers in the system with filtering options.

### Features

**Search and Filter**
- Search by voucher code
- Search by passport number
- Filter by date range
- Filter by status:
  - **Active**: Valid and unused
  - **Used**: Already redeemed
  - **Expired**: Over 12 months old

**Voucher List Columns**
- Voucher Code (8 characters)
- Passport Number (if registered)
- Passenger Name
- Issue Date
- Expiry Date
- Status
- Payment Method

**Actions**
- Click voucher to view full details
- Reprint voucher
- Email voucher to customer
- View payment receipt

---

## 6. Cash Reconciliation

**Navigation**: Click **"Cash Reconciliation"** in the menu (route: `/app/reports/cash-reconciliation`)

At the end of your shift, reconcile all cash payments collected during the day.

### Step-by-Step Process

**STEP 1: Select Date and Opening Float**
1. **Date**: Today's date is pre-selected (you can change for previous days)
2. **Opening Float**: Enter the cash you started with (e.g., PGK 100.00)
3. Click **"Load Transactions"** button

**STEP 2: Review Transaction Summary**
The system displays your day's totals:
- **Total Transactions**: Number of sales
- **Total Revenue**: All payment methods combined
- **Cash**: Cash payments only (this is what you need to reconcile)
- **Card**: Credit/debit card payments
- **Other**: Bank transfers and EFTPOS

**STEP 3: Count Cash Denominations**
Count physical cash in your drawer and enter quantities:

**Notes:**
- K 100 notes: ___ (enter quantity)
- K 50 notes: ___
- K 20 notes: ___
- K 10 notes: ___
- K 5 notes: ___
- K 2 notes: ___
- K 1 notes: ___

**Coins:**
- 50t coins: ___
- 20t coins: ___
- 10t coins: ___
- 5t coins: ___

System automatically calculates total for each denomination.

**STEP 4: Review Reconciliation**
The system shows:
- **Opening Float**: PGK 100.00 (example)
- **Expected Cash**: Float + Cash Sales = PGK 150.00 (example)
- **Actual Cash Counted**: PGK 148.00 (example, auto-calculated)
- **Variance**: -2.00 PGK (shortage)

**Variance Color Coding:**
- 🟢 **Green**: Perfect match (0 variance)
- 🟡 **Yellow**: Small variance (±5 PGK or less)
- 🔴 **Red**: Large variance (over ±5 PGK)

**STEP 5: Add Notes (If Variance Exists)**
If there's a shortage or overage:
1. Enter explanation in **"Notes"** field
   - Example: "Customer paid K 48 for K 50 fee, made up difference"
   - Example: "Incorrect change given to customer in morning"
2. Be specific about which transaction or time period

**STEP 6: Submit Reconciliation**
1. Click **"Submit Reconciliation"** button
2. Reconciliation is saved to database
3. Finance Manager will review and approve/reject
4. Form resets for next use

### View History
Click **"View History"** button to see past reconciliations:
- Date of each reconciliation
- Expected vs Actual amounts
- Variance
- Status: Pending / Approved / Rejected
- Your notes
- Manager feedback (if any)

---

## 7. Common Workflows

### Workflow A: Standard Walk-In Customer
**Scenario**: Customer walks to counter to purchase green fee

1. Click **"Individual Green Pass"** in menu
2. Scan customer's passport with MRZ scanner
3. Optionally enter customer email
4. Select payment method (Cash, Card, EFTPOS)
5. Click **"Process Payment"**
6. Click **"Print Voucher"**
7. Print dialog opens immediately
8. Print GREEN CARD and hand to customer
9. Click **"Process New Payment"** for next customer

**Time**: 2-3 minutes per customer

---

### Workflow B: Validating Corporate Voucher
**Scenario**: Customer has voucher from employer, needs validation

1. Click **"Scan & Validate"** or go to `/app/scan`
2. Scan voucher barcode with USB scanner
3. Click **"Validate"**
4. System shows:
   - ✅ Valid: Voucher active, shows expiry
   - ❌ Invalid: Already used or expired
5. Check if passport is registered:
   - **Yes**: Verify passport number matches physical passport
   - **No**: Proceed to "Add Passport to Voucher" workflow

**Time**: 1-2 minutes

---

### Workflow C: Linking Passport to Corporate Voucher
**Scenario**: Customer has corporate voucher without passport registered

1. Go to `/voucher-registration` (public URL or QR code on voucher)
2. Scan voucher barcode with USB scanner
3. Click **"Find Voucher"**
4. System confirms voucher is valid and unregistered
5. Scan customer's passport with MRZ scanner
6. System populates all passport fields
7. Click **"Register Passport"**
8. Choose: Print, Email, or Download updated voucher
9. Hand voucher to customer

**Time**: 3-4 minutes

---

### Workflow D: End of Shift Reconciliation
**Scenario**: Your shift has ended, time to balance cash

1. Click **"Cash Reconciliation"** in menu
2. Enter your opening float amount (e.g., PGK 100)
3. Click **"Load Transactions"**
4. Review cash sales total (e.g., PGK 250)
5. Count physical cash and coins in drawer
6. Enter denomination counts (notes and coins)
7. System calculates actual cash (e.g., PGK 348)
8. Review variance: 348 - (100 + 250) = -2 PGK shortage
9. If variance exists, enter explanation in Notes
10. Click **"Submit Reconciliation"**
11. Manager will review and approve

**Time**: 10-15 minutes

---

## Hardware Equipment

### PrehKeyTec MRZ Scanner
- **Purpose**: Scanning passport Machine Readable Zone
- **Type**: USB keyboard wedge
- **Usage**: Place passport face-down, scanner reads 88-character MRZ
- **Speed**: Instant (1-2 seconds)
- **Primary use**: Individual Purchase, Voucher Registration

### USB Barcode Scanner
- **Purpose**: Scanning 8-character voucher codes
- **Type**: USB keyboard wedge
- **Usage**: Point and scan CODE128 barcode
- **Speed**: Instant
- **Primary use**: Scan & Validate, Voucher Registration

### POS Barcode Printer
- **Purpose**: Printing GREEN CARD vouchers
- **Type**: Thermal or laser printer
- **Usage**: Browser print dialog, select printer
- **Output**: A5 or A4 paper with barcode
- **Primary use**: All voucher printing

---

## Troubleshooting

### MRZ Scanner Not Working
**Problem**: Passport scan doesn't populate fields
**Solutions**:
1. Ensure passport is face-down on scanner
2. Check USB connection
3. Try scanning again slowly
4. Manually type passport data if scanner fails

### Barcode Scanner Not Reading
**Problem**: Voucher barcode not scanning
**Solutions**:
1. Ensure barcode is not damaged or wrinkled
2. Clean scanner lens
3. Try different angle
4. Manually type 8-character voucher code

### Print Dialog Doesn't Open
**Problem**: Clicking "Print Voucher" does nothing
**Solutions**:
1. Check browser popup blocker
2. Allow popups for greenpay.eywademo.cloud
3. Try "Download PDF" then print manually

### Email Not Sending
**Problem**: Customer doesn't receive emailed voucher
**Solutions**:
1. Verify email address is correct
2. Check customer's spam folder
3. Use "Download PDF" and send manually

### Cash Reconciliation Variance
**Problem**: Large variance in cash count
**Solutions**:
1. Recount physical cash carefully
2. Check for transactions you might have missed
3. Review transaction list for cash-only sales
4. Document explanation in Notes field
5. Contact supervisor if variance exceeds PGK 20

---

## Security and Best Practices

### Password Security
- Never share your login credentials
- Use strong password
- Change password if compromised
- Log out when leaving workstation

### Customer Privacy
- Never share passport information
- Don't photograph customer documents
- Dispose of printed errors securely

### Cash Handling
- Keep cash drawer locked when not in use
- Don't leave cash unattended
- Count cash privately at shift end
- Report discrepancies immediately

### System Access
- Only access your assigned role features
- Don't attempt to access admin functions
- Report system errors to IT Support

---

## Support Contacts

### Technical Issues
- **IT Support**: Contact via Support Tickets in system
- **Email**: support@greenpay.eywademo.cloud

### Process Questions
- **Supervisor**: Your shift supervisor
- **Finance Manager**: For reconciliation questions

### Emergency
- **System Down**: Contact IT Support immediately
- **Payment Issues**: Contact Finance Manager

---

## Quick Reference

### Key Shortcuts
- **Home**: `/app/agent`
- **Individual Purchase**: `/app/passports/create`
- **Scan & Validate**: `/app/scan`
- **Vouchers List**: `/app/vouchers-list`
- **Cash Reconciliation**: `/app/reports/cash-reconciliation`

### Standard Fee
- **Individual Green Fee**: PGK 50.00

### Voucher Validity
- **Duration**: 12 months from issue date

### Payment Methods
- Cash
- Credit/Debit Card
- EFTPOS
- Bank Transfer (pre-paid)

---

**Document Version**: 1.0
**Last Updated**: January 2026
**System URL**: https://greenpay.eywademo.cloud
