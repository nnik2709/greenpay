# GreenPay Manual Testing Guide

## Test Environment
- **URL**: https://greenpay.eywademo.cloud
- **Version**: Production (Latest)
- **Test Window**: [Fill in test date/time]
- **Tester Name**: _______________

## Test User Accounts

| Role            | Email                  | Password   | Access Level                           |
|-----------------|------------------------|------------|----------------------------------------|
| Flex_Admin      | flexadmin@greenpay.com | test123    | Full system access (all features)      |
| Finance_Manager | finance@greenpay.com   | test123    | Quotations, invoices, reports          |
| Counter_Agent   | agent@greenpay.com     | test123    | Passport purchases, bulk uploads       |
| IT_Support      | support@greenpay.com   | support123 | User management, reports, scan/validate|

## Pre-Test Setup Checklist

Before starting tests, verify:
- [ ] You can access https://greenpay.eywademo.cloud
- [ ] You have email access to check voucher notifications
- [ ] You have a test passport number ready (format: N1234567)
- [ ] Browser console is open (F12) to catch errors
- [ ] Screenshot tool is ready for evidence capture

---

# Test Scenarios by Role

## 1. FLEX ADMIN (Full System Access)

**Login**: flexadmin@greenpay.com / test123

### 1.1 User Management
**Steps:**
1. Login as Flex_Admin
2. Navigate to **Users** from sidebar
3. Click **Add User** button
4. Fill in user details:
   - Full Name: "Test User 1"
   - Email: "testuser1@example.com"
   - Role: Select "Counter_Agent"
   - Password: "password123"
5. Click **Create User**
6. Verify user appears in the list
7. Click **Edit** on the new user
8. Change role to "IT_Support"
9. Click **Update**
10. Verify role changed in user list

**Expected Results:**
- User created successfully
- User appears in list with correct details
- Edit updates the user record
- No console errors

**Evidence**: Screenshot of user list with new user

---

### 1.2 Payment Gateway Settings
**Steps:**
1. Navigate to **Settings > Payment Gateway**
2. Review current gateway configuration
3. Check toggle states for:
   - Enable/Disable BSP DOKU
   - Enable/Disable Stripe
4. Verify webhook URLs are displayed
5. Check "Test Mode" toggle

**Expected Results:**
- Settings page loads without errors
- All payment gateway options visible
- Webhook URLs displayed correctly
- Test mode can be toggled

**Evidence**: Screenshot of payment gateway settings

---

### 1.3 Email Templates Management
**Steps:**
1. Navigate to **Settings > Email Templates**
2. Click on "Voucher Notification" template
3. Edit template content (change greeting)
4. Click **Save**
5. Verify success message
6. Reload page and verify changes persist

**Expected Results:**
- Template editor loads
- Can edit and save templates
- Changes persist after reload
- No console errors

**Evidence**: Screenshot of email template editor

---

### 1.4 System Settings (RPC Settings)
**Steps:**
1. Navigate to **Settings > System Settings**
2. Review all system configuration options
3. Toggle GST (Goods & Services Tax) ON/OFF
4. Note current GST percentage
5. Update company information if needed

**Expected Results:**
- Settings page loads
- GST toggle works
- All settings visible and editable

**Evidence**: Screenshot of system settings page

---

### 1.5 Login History
**Steps:**
1. Navigate to **Settings > Login History**
2. Review recent login events
3. Check filters:
   - Filter by user role
   - Filter by date range
4. Verify your current login is shown

**Expected Results:**
- Login history table displays
- Filters work correctly
- Recent logins visible with timestamps
- Includes IP addresses and user agents

**Evidence**: Screenshot of login history

---

### 1.6 All Reports Access
**Steps:**
1. Navigate to **Reports** menu
2. Access each report type:
   - Passport Reports
   - Individual Purchase Reports
   - Corporate Voucher Reports
   - Revenue Generated Reports
   - Bulk Upload Reports
   - Quotations Reports
   - Refunded Reports
3. For each report:
   - Select date range (last 30 days)
   - Click **Generate Report**
   - Verify data displays
   - Click **Export to CSV** (if available)

**Expected Results:**
- All 7 report types accessible
- Reports generate without errors
- Data displays in tables
- Export functions work
- No console errors

**Evidence**: Screenshot of each report type

---

## 2. COUNTER AGENT (Passport & Purchase Operations)

**Login**: agent@greenpay.com / test123

### 2.1 Agent Landing Page
**Steps:**
1. Login as Counter_Agent
2. Verify redirect to **Agent Landing** page
3. Review quick action buttons:
   - Individual Purchase
   - Bulk Upload
   - Scan & Validate
   - Vouchers List
4. Click each button to verify navigation

**Expected Results:**
- Redirects to agent dashboard
- All quick actions visible
- Buttons navigate to correct pages

**Evidence**: Screenshot of agent landing page

---

### 2.2 Individual Passport Purchase (Single Voucher)
**Steps:**
1. Click **Individual Purchase** or navigate to **Passports > Create Individual Purchase**
2. Fill in passport details:
   - Passport Number: N1234567
   - Surname: SMITH
   - Given Name: JOHN
   - Nationality: US
   - Date of Birth: 1990-01-15
   - Sex: Male
   - Date of Expiry: 2030-12-31
3. Fill in contact information:
   - Email: your-test-email@example.com
   - Phone: +675 12345678
   - Address: "Port Moresby, NCD"
4. Select payment method: **Cash**
5. Click **Create Purchase**
6. Verify success message
7. Check that voucher code is displayed
8. Click **Download PDF** button
9. Open PDF and verify:
   - Voucher code
   - Barcode/QR code visible
   - Passport details correct
   - PNG logo visible
10. Check your email inbox for voucher notification

**Expected Results:**
- Purchase created successfully
- Voucher code generated (format: XXXXXXXX)
- PDF downloads correctly
- PDF contains all information and barcode
- Email received with PDF attachment
- No console errors

**Evidence**:
- Screenshot of success page with voucher code
- Screenshot/save of PDF voucher
- Screenshot of email received

---

### 2.3 Individual Purchase with BSP DOKU Payment
**Steps:**
1. Navigate to **Passports > Create Individual Purchase**
2. Fill in passport details (use different passport number: N7654321)
3. Fill in contact information (use your email)
4. Select payment method: **BSP DOKU**
5. Click **Create Purchase**
6. You will be redirected to BSP payment gateway
7. Fill in card details (TEST MODE):
   - Card Number: 4000000000000002
   - Expiry: 12/25
   - CVV: 123
   - Name: TEST USER
8. Click **Pay Now**
9. Wait for redirect back to GreenPay
10. Verify success page displays
11. Download and verify PDF voucher
12. Check email for notification

**Expected Results:**
- Redirects to BSP payment gateway
- Payment processes successfully
- Redirects back to success page
- Voucher created with payment confirmation
- PDF voucher downloads
- Email notification received

**Evidence**:
- Screenshot of BSP payment page
- Screenshot of payment success
- Screenshot of voucher PDF

**Note**: If BSP payment fails in staging, use Cash payment method instead and document the issue.

---

### 2.4 Bulk Passport Upload (CSV)
**Steps:**
1. Navigate to **Passports > Bulk Upload**
2. Download the CSV template by clicking **Download Template**
3. Open template in Excel/Google Sheets
4. Add 3 test passport records:
   ```
   Row 1: N1111111,DOE,JANE,US,1985-05-20,F,2028-06-30
   Row 2: N2222222,BROWN,JAMES,AU,1992-08-15,M,2029-03-25
   Row 3: N3333333,WILSON,MARY,NZ,1988-11-10,F,2027-12-20
   ```
5. Save as CSV file
6. Return to Bulk Upload page
7. Click **Choose File** and select your CSV
8. Enter batch information:
   - Company Name: "Test Company Ltd"
   - Contact Email: your-email@example.com
   - Payment Method: **Cash**
9. Click **Upload & Process**
10. Wait for processing (may take 10-30 seconds)
11. Verify success message shows "3 passports uploaded"
12. Click **View Batch History**
13. Verify your batch appears in history
14. Click **Download Batch PDF** for your batch
15. Open PDF and verify all 3 vouchers are included

**Expected Results:**
- CSV template downloads correctly
- File uploads without errors
- All 3 passports processed successfully
- Batch appears in history
- Batch PDF contains all 3 vouchers with barcodes
- No duplicate passport numbers allowed (system should reject)

**Evidence**:
- Screenshot of upload success
- Screenshot of batch history
- Screenshot/save of batch PDF (first page showing 3 vouchers)

---

### 2.5 Scan & Validate Voucher
**Steps:**
1. Navigate to **Scan & Validate** from sidebar
2. **Option A - Manual Entry**:
   - Expand "Manual Entry" section
   - Enter a voucher code from previous test (e.g., voucher created in 2.2)
   - Click **Validate Code**
3. **Option B - Mobile Camera** (if on mobile/tablet):
   - Click **Scan Voucher Barcode** button
   - Allow camera access
   - Point camera at voucher barcode from PDF
   - Wait for automatic detection
4. Review validation result:
   - Should show green flash + success beep if valid
   - Should display voucher details:
     - Voucher Type (Individual/Corporate)
     - Passport Number
     - Validity dates
   - Or red flash + alert if invalid/expired/used

**Expected Results:**
- Manual entry validates voucher correctly
- Camera scanner works (if testing on mobile)
- Valid voucher shows success with green flash/beep
- Invalid voucher shows error with red flash
- Voucher details display correctly
- No console errors

**Evidence**:
- Screenshot of valid voucher result
- Screenshot of invalid voucher result (test with fake code "INVALID123")

---

### 2.6 Vouchers List & Management
**Steps:**
1. Navigate to **Vouchers** from sidebar
2. Review vouchers list table
3. Use filters:
   - Filter by voucher type (Individual/Corporate)
   - Filter by status (Valid/Used/Expired)
   - Search by passport number
4. Click on a voucher row to view details
5. Verify all voucher information displays
6. Click **Download PDF** for a voucher
7. Verify PDF downloads correctly

**Expected Results:**
- Vouchers list loads with all created vouchers
- Filters work correctly
- Search finds vouchers by passport number
- Voucher details modal displays correctly
- PDF download works

**Evidence**: Screenshot of vouchers list with filters applied

---

### 2.7 Cash Reconciliation
**Steps:**
1. Navigate to **Cash Reconciliation** from sidebar
2. Review today's cash transactions
3. Enter reconciliation details:
   - Expected Cash: (auto-calculated from sales)
   - Actual Cash Collected: (enter same amount)
   - Notes: "End of day reconciliation - Test"
4. Click **Submit Reconciliation**
5. Verify success message
6. View reconciliation history
7. Verify your reconciliation appears in history

**Expected Results:**
- Cash reconciliation form loads
- Expected amount auto-calculated correctly
- Can submit reconciliation
- History shows all reconciliations
- PDF report can be generated

**Evidence**: Screenshot of cash reconciliation submitted

---

## 3. FINANCE MANAGER (Quotations, Invoices & Reports)

**Login**: finance@greenpay.com / test123

### 3.1 Create Quotation
**Steps:**
1. Login as Finance_Manager
2. Navigate to **Quotations**
3. Click **Create Quotation**
4. Fill in quotation details:
   - Customer Name: "ABC Corporation"
   - Customer Email: your-email@example.com
   - Customer Phone: +675 98765432
   - Number of Passengers: 10
   - Fee per Passenger: 50.00
   - Notes: "Corporate group travel - Test quotation"
5. Click **Create Quotation**
6. Verify quotation number is generated (format: Q-XXXXXX)
7. Click **Download Quotation PDF**
8. Open PDF and verify:
   - Quotation number
   - Customer details
   - Line items with quantities and prices
   - Total amount
   - PNG logo and company details
9. Click **Email Quotation** button
10. Verify email sent message
11. Check email inbox for quotation

**Expected Results:**
- Quotation created successfully
- Quotation number generated
- PDF downloads with all details
- PDF has professional formatting with logo
- Email sent with PDF attachment
- No console errors

**Evidence**:
- Screenshot of quotation creation success
- Screenshot/save of quotation PDF
- Screenshot of email received

---

### 3.2 Convert Quotation to Invoice (Corporate Vouchers)
**Steps:**
1. Navigate to **Quotations**
2. Find the quotation created in 3.1
3. Click **Convert to Invoice** button
4. Review invoice preview:
   - Invoice number generated (format: INV-XXXXXX)
   - GST added if enabled (check with Flex_Admin setting)
   - Total amount including GST
5. Click **Confirm & Create Invoice**
6. Select payment method: **Cash**
7. Click **Process Payment**
8. Verify payment success
9. Click **Generate Vouchers** button
10. Wait for voucher generation (10 vouchers for 10 passengers)
11. Click **Download Vouchers PDF**
12. Open PDF and verify:
    - Contains 10 vouchers (one per passenger)
    - Each voucher has unique code
    - Each voucher has barcode/QR code
    - Company name shown (ABC Corporation)
13. Click **Email Vouchers to Customer**
14. Check email inbox for bulk voucher email

**Expected Results:**
- Quotation converts to invoice
- Invoice number generated
- GST calculated correctly (if enabled)
- Payment processes successfully
- 10 vouchers generated (one per passenger)
- Bulk PDF contains all 10 vouchers
- Email sent with all vouchers
- Invoice status changes to "Paid"
- Voucher status shows "Generated"

**Evidence**:
- Screenshot of invoice created
- Screenshot of payment success
- Screenshot/save of bulk vouchers PDF (first 2 pages)
- Screenshot of email with vouchers

---

### 3.3 Manage Customers
**Steps:**
1. Navigate to **Customers** (under Settings or Admin menu)
2. Click **Add Customer**
3. Fill in customer details:
   - Company Name: "XYZ Limited"
   - Contact Person: "Michael Johnson"
   - Email: customer@example.com
   - Phone: +675 11223344
   - Address: "Gordon, NCD, Papua New Guinea"
   - TIN (Tax ID): 123456789
4. Click **Save Customer**
5. Verify customer appears in list
6. Click **Edit** on customer
7. Update phone number
8. Click **Update**
9. Verify changes saved

**Expected Results:**
- Customer created successfully
- Customer appears in list
- Can edit customer details
- Changes persist

**Evidence**: Screenshot of customer list with new customer

---

### 3.4 Create Invoice (Without Quotation)
**Steps:**
1. Navigate to **Invoices**
2. Click **Create Invoice**
3. Select customer from dropdown (select XYZ Limited from 3.3)
4. Add line items:
   - Description: "Green Fee Vouchers - 5 passengers"
   - Quantity: 5
   - Unit Price: 50.00
5. Review calculated totals (GST added if enabled)
6. Click **Create Invoice**
7. Verify invoice number generated
8. Select payment method: **Cash**
9. Click **Mark as Paid**
10. Verify invoice status = "Paid"
11. Download invoice PDF
12. Verify PDF contains:
    - Invoice number
    - Customer details (XYZ Limited)
    - Line items
    - GST breakdown (if enabled)
    - Total amount
    - Payment status

**Expected Results:**
- Invoice created without quotation
- Customer details pre-filled from customer record
- GST calculated correctly
- Invoice can be marked as paid
- PDF downloads with correct information
- Invoice appears in invoices list

**Evidence**: Screenshot of invoice PDF

---

### 3.5 Revenue Generated Reports
**Steps:**
1. Navigate to **Reports > Revenue Generated**
2. Select date range: Last 30 days
3. Click **Generate Report**
4. Review report data:
   - Total revenue
   - Breakdown by payment method (Cash, BSP DOKU, Stripe)
   - Breakdown by voucher type (Individual, Corporate)
   - GST collected (if enabled)
   - Daily/weekly revenue charts
5. Click **Export to CSV**
6. Open CSV file and verify data matches report

**Expected Results:**
- Report generates successfully
- Revenue totals calculated correctly
- Charts/graphs display (if implemented)
- CSV export works
- Data matches transactions from earlier tests

**Evidence**: Screenshot of revenue report

---

### 3.6 All Reports Access (Finance Manager View)
**Steps:**
1. Navigate to **Reports** menu
2. Verify access to:
   - ✅ Passport Reports (view only)
   - ✅ Individual Purchase Reports
   - ✅ Corporate Voucher Reports
   - ✅ Revenue Generated Reports
   - ✅ Quotations Reports
   - ✅ Refunded Reports
3. Verify NO access to:
   - ❌ Bulk Upload Reports (Counter Agent only)
4. Generate each accessible report with last 30 days date range

**Expected Results:**
- Can access 6 out of 7 report types
- Cannot access Bulk Upload Reports
- All reports generate without errors
- Data displays correctly

**Evidence**: Screenshot showing accessible reports menu

---

## 4. IT SUPPORT (User Management & System Monitoring)

**Login**: support@greenpay.com / support123

### 4.1 User Management
**Steps:**
1. Login as IT_Support
2. Navigate to **Users**
3. Review all user accounts
4. Click **Add User**
5. Create test user:
   - Full Name: "Test Support User"
   - Email: support-test@example.com
   - Role: Counter_Agent
   - Password: password123
6. Click **Create User**
7. Click **Edit** on new user
8. Disable user account (toggle "Active" to OFF)
9. Click **Update**
10. Try to login as the disabled user (open incognito window)
11. Verify login is denied

**Expected Results:**
- Can create users
- Can edit users
- Can disable users
- Disabled users cannot login
- Changes take effect immediately

**Evidence**:
- Screenshot of user created
- Screenshot of disabled user
- Screenshot of login denied for disabled user

---

### 4.2 Login History Monitoring
**Steps:**
1. Navigate to **Settings > Login History**
2. Review recent login events for all users
3. Filter by user: Select "Counter_Agent"
4. Review login times and IP addresses
5. Filter by date: Last 7 days
6. Sort by timestamp (newest first)
7. Look for failed login attempts
8. Export login history to CSV

**Expected Results:**
- Can see login history for all users
- Filters work correctly
- Failed login attempts are logged
- IP addresses captured
- CSV export works

**Evidence**: Screenshot of login history with filters applied

---

### 4.3 Scan & Validate (IT Support Access)
**Steps:**
1. Navigate to **Scan & Validate**
2. Test voucher validation with USB barcode scanner (if available):
   - Plug in USB scanner
   - Scan a voucher barcode from a PDF
   - Verify system detects scan automatically
   - Green flash + beep for valid voucher
   - Voucher details display
3. Test with invalid voucher code:
   - Enter "INVALIDCODE123" manually
   - Click Validate
   - Verify red flash + error alert
   - Error message displays

**Expected Results:**
- IT Support can access scan & validate
- USB scanner works automatically (if available)
- Valid vouchers show success
- Invalid vouchers show error
- Visual and audio feedback works

**Evidence**: Screenshot of voucher validation result

---

### 4.4 Reports Access (IT Support View)
**Steps:**
1. Navigate to **Reports** menu
2. Verify access to ALL report types:
   - ✅ Passport Reports
   - ✅ Individual Purchase Reports
   - ✅ Corporate Voucher Reports
   - ✅ Revenue Generated Reports
   - ✅ Bulk Upload Reports
   - ✅ Quotations Reports
   - ✅ Refunded Reports
3. Generate Revenue Report
4. Generate Bulk Upload Report
5. Verify data displays correctly

**Expected Results:**
- IT Support has access to all 7 report types
- All reports generate without errors
- Can export to CSV

**Evidence**: Screenshot of reports menu showing all options

---

### 4.5 System Settings (View Only)
**Steps:**
1. Navigate to **Settings**
2. Attempt to access:
   - Payment Gateway Settings (should be view-only or restricted)
   - Email Templates (should be view-only or restricted)
   - System Settings (should be view-only or restricted)
3. Verify IT Support cannot modify critical settings

**Expected Results:**
- IT Support can view settings
- Cannot modify payment gateway settings (Flex_Admin only)
- Cannot modify system-wide settings

**Evidence**: Screenshot showing restricted access message (if any)

---

### 4.6 Scanner Test Page
**Steps:**
1. Navigate to **Scanner Test** page (from profile menu or `/app/scanner-test`)
2. Review scanner configuration options
3. If USB scanner available:
   - Plug in scanner
   - Select scanner profile (Generic, Professional, Budget)
   - Scan a barcode/QR code
   - Verify detection speed and accuracy shown
   - Review scan history table
4. If no USB scanner:
   - Test with manual barcode entry
   - Verify MRZ passport simulation works

**Expected Results:**
- Scanner test page loads
- Can adjust scanner configuration
- USB scanner detected and working
- Scan performance metrics displayed
- Scan history logged

**Evidence**: Screenshot of scanner test page with scan results

---

## 5. PUBLIC FEATURES (No Login Required)

### 5.1 Public Voucher Purchase (Buy Online)
**Steps:**
1. Logout (or open incognito window)
2. Navigate to: https://greenpay.eywademo.cloud/buy-online
3. Fill in passport details:
   - Passport Number: N9999999
   - Surname: MILLER
   - Given Name: SARAH
   - Nationality: GB
   - Date of Birth: 1995-03-20
   - Sex: Female
   - Date of Expiry: 2029-08-15
4. Fill in contact details:
   - Email: your-email@example.com
   - Phone: +675 55544433
5. Solve math verification question (e.g., "What is 5 + 7?")
6. Click **Continue to Payment**
7. Select payment method: BSP DOKU (Staging)
8. Click **Proceed to Payment**
9. Fill in card details on BSP gateway:
   - Card: 4000000000000002
   - Expiry: 12/25
   - CVV: 123
   - Name: SARAH MILLER
10. Complete payment
11. Verify redirect to success page
12. Download voucher PDF
13. Check email for voucher

**Expected Results:**
- Public can purchase vouchers without login
- Math verification prevents bots
- BSP payment processes
- Voucher created successfully
- PDF downloads with barcode
- Email sent with voucher PDF
- No console errors

**Evidence**:
- Screenshot of public purchase form
- Screenshot of payment success
- Screenshot/save of voucher PDF
- Screenshot of email received

**Note**: If BSP staging is not working, this test may fail. Document any payment gateway errors.

---

### 5.2 Voucher Registration (Corporate Voucher Flow)
**Steps:**
1. Use a voucher code from a corporate batch (created in 3.2)
2. Navigate to: https://greenpay.eywademo.cloud/register/[VOUCHER-CODE]
3. Fill in passport details:
   - Passport Number: N8888888
   - Surname: ANDERSON
   - Given Name: ROBERT
   - Nationality: CA
   - Date of Birth: 1987-07-14
   - Sex: Male
   - Date of Expiry: 2028-11-30
4. Click **Register Passport**
5. Verify success message
6. Check that voucher is now linked to passport N8888888
7. Login as Finance Manager or Counter Agent
8. Navigate to **Vouchers**
9. Find the voucher code
10. Verify passport number N8888888 is shown

**Expected Results:**
- Public can access registration page with voucher code
- Can register passport details
- Voucher becomes linked to passport
- System prevents re-registration of same voucher
- Success page displays

**Evidence**:
- Screenshot of registration form
- Screenshot of success page
- Screenshot showing linked passport in vouchers list

---

### 5.3 Public Policy Pages
**Steps:**
1. Navigate to public pages:
   - https://greenpay.eywademo.cloud/terms
   - https://greenpay.eywademo.cloud/privacy
   - https://greenpay.eywademo.cloud/refunds
2. For each page:
   - Verify page loads
   - Read through content
   - Click any internal links
   - Verify no broken links
   - Check footer links work

**Expected Results:**
- All policy pages load
- Content displays correctly
- Links work
- Professional formatting
- No console errors

**Evidence**: Screenshot of each policy page

---

## 6. NEGATIVE & ERROR TESTING (All Roles)

### 6.1 Invalid Login
**Steps:**
1. Logout
2. Try to login with:
   - Wrong password: flexadmin@greenpay.com / wrongpassword
3. Verify error message: "Invalid email or password"
4. Try non-existent user: fake@example.com / password
5. Verify error message

**Expected Results:**
- Login fails with clear error message
- No stack traces exposed
- No console errors
- Account not locked after failed attempts (or proper lockout message)

**Evidence**: Screenshot of error message

---

### 6.2 Duplicate Passport Number
**Steps:**
1. Login as Counter_Agent
2. Create individual purchase with passport: N1234567 (already used in 2.2)
3. Try to submit
4. Verify error message: "Passport number already exists"

**Expected Results:**
- System prevents duplicate passport numbers
- Clear error message shown
- Previous voucher not affected

**Evidence**: Screenshot of error message

---

### 6.3 Invalid Voucher Validation
**Steps:**
1. Login as Counter_Agent or IT_Support
2. Navigate to **Scan & Validate**
3. Enter voucher code: "FAKEXXXXXX"
4. Click **Validate**
5. Verify red flash + error alert
6. Verify error message: "Voucher not found" or "Invalid voucher code"

**Expected Results:**
- System shows clear error for invalid voucher
- Red flash + alert sound
- No crash or exception
- Error message user-friendly

**Evidence**: Screenshot of error validation result

---

### 6.4 Expired Voucher (Manual Test)
**Steps:**
1. (This requires creating a voucher with past expiry date - skip if not possible)
2. If you have an expired voucher code:
   - Navigate to **Scan & Validate**
   - Enter expired voucher code
   - Click **Validate**
   - Verify error: "Voucher has expired"

**Expected Results:**
- System detects expired vouchers
- Shows clear error message
- Red flash + alert

**Evidence**: Screenshot of expired voucher error

---

### 6.5 Used Voucher (Double-Use Prevention)
**Steps:**
1. Login as Counter_Agent
2. Navigate to **Vouchers**
3. Find a valid unused voucher
4. Manually mark it as "Used" (if feature available) OR:
5. Have Finance Manager register the voucher with a passport (via /register page)
6. Try to validate the same voucher in **Scan & Validate**
7. Verify error: "Voucher already used"

**Expected Results:**
- System prevents double-use of vouchers
- Used vouchers show error on validation
- Clear error message

**Evidence**: Screenshot of used voucher error

---

### 6.6 Unauthorized Access
**Steps:**
1. Login as Counter_Agent
2. Try to access Flex_Admin only pages by URL:
   - https://greenpay.eywademo.cloud/app/users (User Management)
   - https://greenpay.eywademo.cloud/app/settings (System Settings)
3. Verify redirect to Agent Landing or error page
4. Verify message: "Access denied" or "Not authorized"

**Expected Results:**
- Counter_Agent cannot access admin pages
- System redirects or shows error
- No data leaked
- No console errors

**Evidence**: Screenshot of access denied message

---

### 6.7 Large File Upload (Bulk Upload Stress Test)
**Steps:**
1. Login as Counter_Agent
2. Navigate to **Bulk Upload**
3. Create a CSV with 100 passport records (copy/paste rows)
4. Upload the file
5. Verify processing time
6. Check if all 100 passports are processed
7. Download batch PDF
8. Verify PDF contains all 100 vouchers

**Expected Results:**
- System handles 100 records (may take 1-2 minutes)
- All records processed successfully
- PDF generation completes
- No timeout errors
- System remains responsive

**Evidence**: Screenshot of bulk upload success with 100 records

**Note**: If system times out or fails, note the error and maximum records processed.

---

## 7. INTEGRATION TESTING

### 7.1 End-to-End Corporate Flow
**Steps:**
1. Login as Finance_Manager
2. Create quotation for 5 passengers (see 3.1)
3. Convert quotation to invoice (see 3.2)
4. Mark invoice as paid (Cash)
5. Generate 5 vouchers
6. Download bulk voucher PDF
7. Logout
8. Navigate to public registration page with first voucher code
9. Register passport details
10. Verify success
11. Login as Counter_Agent
12. Navigate to **Scan & Validate**
13. Validate the registered voucher
14. Verify voucher shows as "Valid" with passport details

**Expected Results:**
- Complete flow works from quotation → invoice → payment → vouchers → registration → validation
- All data persists correctly
- PDFs generate at each step
- Emails sent at each step
- No data loss or corruption

**Evidence**:
- Screenshots of each major step
- Final validation screenshot showing registered passport

---

### 7.2 Email Notification Flow
**Steps:**
1. Complete one of each type of transaction:
   - Individual voucher purchase (Counter_Agent)
   - Corporate voucher batch (Finance_Manager)
   - Quotation (Finance_Manager)
   - Invoice (Finance_Manager)
2. Check your email inbox
3. Verify you received:
   - Individual voucher email with PDF attachment
   - Corporate batch voucher email with PDF
   - Quotation email with PDF
   - Invoice email with PDF
4. Open each PDF from email
5. Verify PDFs are not corrupted
6. Verify barcodes are visible in voucher PDFs

**Expected Results:**
- All 4 email types received
- Emails arrive within 1-2 minutes
- PDFs attached correctly
- PDFs open without errors
- Email formatting is professional
- From address is correct
- Subject lines are clear

**Evidence**: Screenshots of all 4 emails in inbox

---

### 7.3 PDF Generation Quality
**Steps:**
1. Download one of each PDF type:
   - Individual voucher
   - Corporate batch voucher
   - Quotation
   - Invoice
2. For each PDF, verify:
   - PNG GreenPay logo visible
   - Text is clear and readable
   - Barcodes/QR codes are sharp (not blurry)
   - All data fields populated
   - No overlapping text
   - Professional formatting
   - Footer with contact information
   - Page numbers (for multi-page PDFs)

**Expected Results:**
- All PDFs professionally formatted
- Logos render correctly
- Barcodes scannable
- No missing data
- Consistent branding across all PDFs

**Evidence**: Save all 4 PDF types as test evidence

---

## 8. BROWSER & DEVICE COMPATIBILITY

### 8.1 Desktop Browsers
**Test on:**
- Chrome (latest)
- Firefox (latest)
- Safari (Mac only)
- Edge (latest)

**Steps** (for each browser):
1. Login as Counter_Agent
2. Create individual purchase
3. Download PDF
4. Navigate through main pages
5. Check for console errors (F12)

**Expected Results:**
- Application works in all major browsers
- PDFs download correctly
- No console errors
- UI renders correctly

**Evidence**: Note browser versions tested and any issues

---

### 8.2 Mobile Testing
**Test on:**
- Mobile Safari (iOS)
- Chrome (Android)

**Steps**:
1. Open https://greenpay.eywademo.cloud/buy-online on mobile
2. Complete public voucher purchase
3. Test camera scanner:
   - Navigate to /app/scan (after login as Counter_Agent)
   - Click **Scan Voucher Barcode**
   - Allow camera access
   - Scan a voucher QR code
4. Verify responsive design:
   - Navigation menu collapses to hamburger
   - Forms fit screen width
   - Buttons are touch-friendly

**Expected Results:**
- Mobile layout responsive
- Camera scanner works
- Touch interactions work
- PDFs download on mobile
- No horizontal scrolling

**Evidence**: Screenshots from mobile device

---

### 8.3 USB Barcode Scanner (Hardware Test)
**Equipment Needed**: USB barcode scanner (model S-20W or similar)

**Steps**:
1. Plug USB scanner into computer
2. Login as Counter_Agent or IT_Support
3. Navigate to **Scan & Validate**
4. Print a voucher PDF or display on second monitor
5. Scan the voucher barcode with USB scanner
6. Verify:
   - System detects scan automatically
   - No manual input needed
   - Green flash + beep
   - Voucher validates instantly
   - Details display correctly
7. Try scanning 5 vouchers in rapid succession
8. Verify all 5 are processed correctly

**Expected Results:**
- USB scanner works plug-and-play (no drivers)
- System detects rapid input (keyboard wedge mode)
- All scans process instantly
- No missed scans
- Visual and audio feedback works
- Can process multiple scans quickly

**Evidence**:
- Photo of USB scanner
- Video/screenshot of scanning in action
- Screenshot of scan results

---

## 9. PERFORMANCE & LOAD TESTING

### 9.1 Page Load Times
**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to each main page:
   - Agent Landing
   - Vouchers List
   - Reports > Revenue Generated
4. Note page load time (shown in Network tab)

**Expected Results:**
- Pages load in under 3 seconds
- API calls complete in under 2 seconds
- No timeout errors

**Evidence**: Screenshots of Network tab showing load times

---

### 9.2 Large Data Set (Vouchers List)
**Steps**:
1. After creating multiple vouchers (50+ from previous tests)
2. Navigate to **Vouchers** list
3. Verify page loads without lag
4. Test pagination (if implemented)
5. Test search/filter performance

**Expected Results:**
- Page handles 50+ vouchers without lag
- Pagination works smoothly
- Search is fast (under 1 second)

**Evidence**: Screenshot of vouchers list with many records

---

## 10. SECURITY TESTING

### 10.1 Session Timeout
**Steps**:
1. Login as Counter_Agent
2. Leave browser idle for 30 minutes
3. Try to navigate to a page
4. Verify session expired
5. Verify redirect to login page

**Expected Results:**
- Session expires after timeout period
- Redirect to login
- Must re-login to continue

**Evidence**: Screenshot of session timeout message

---

### 10.2 SQL Injection Attempt (Negative Test)
**Steps**:
1. Login as Counter_Agent
2. Navigate to **Scan & Validate**
3. Enter SQL injection attempt: `' OR '1'='1`
4. Click **Validate**
5. Verify:
   - Input is sanitized
   - No SQL error exposed
   - Returns "Invalid voucher" message

**Expected Results:**
- SQL injection blocked
- No database error exposed
- Friendly error message

**Evidence**: Screenshot of sanitized error

---

### 10.3 XSS Attempt (Cross-Site Scripting)
**Steps**:
1. Login as Counter_Agent
2. Try to create voucher with passport name: `<script>alert('XSS')</script>`
3. Submit form
4. Verify:
   - Script not executed
   - Input sanitized/escaped
   - Displays as plain text

**Expected Results:**
- XSS attempt blocked
- No script execution
- Data stored safely

**Evidence**: Screenshot showing sanitized input

---

## 11. REPORTING YOUR RESULTS

### Test Result Format

For each test scenario, record:

| Field | Description |
|-------|-------------|
| **Scenario ID** | e.g., 2.2, 3.1, etc. |
| **Tester** | Your name |
| **Date/Time** | When test was performed |
| **Status** | ✅ PASS / ❌ FAIL / ⚠️ BLOCKED |
| **Evidence** | Screenshot filename or link |
| **Notes** | Any observations, bugs, or issues |
| **Severity** | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |

### Bug Report Format

If you find a bug:

```
BUG ID: BUG-001
Scenario: 2.2 Individual Purchase
Severity: P1 (High)
Summary: PDF download fails on Safari browser

Steps to Reproduce:
1. Login as Counter_Agent
2. Create individual purchase
3. Click "Download PDF" button
4. Observe error

Expected Result: PDF downloads successfully
Actual Result: Browser shows "Failed to download" error

Environment:
- Browser: Safari 17.2
- OS: macOS Sonoma
- URL: https://greenpay.eywademo.cloud/app/passports/create

Evidence: Screenshot attached (bug-001-safari-pdf-error.png)

Notes: Works fine in Chrome and Firefox. Safari-specific issue.
```

---

## 12. TEST COMPLETION CHECKLIST

After completing all tests, verify:

- [ ] All 4 user roles tested
- [ ] All critical flows completed (purchase, quotation, invoice, voucher)
- [ ] PDF generation tested for all document types
- [ ] Email notifications received and verified
- [ ] Barcode/QR code validation tested
- [ ] Reports generated for all types
- [ ] Bulk upload tested (at least 10 records)
- [ ] Mobile responsive design tested
- [ ] USB barcode scanner tested (if available)
- [ ] Public pages tested (buy online, registration, policies)
- [ ] Negative tests completed (invalid data, duplicate entries)
- [ ] Security tests completed (SQL injection, XSS)
- [ ] Browser compatibility checked (at least 2 browsers)
- [ ] All bugs documented with severity
- [ ] All evidence captured (screenshots, PDFs, emails)

---

## 13. KNOWN LIMITATIONS & NOTES

- **BSP DOKU Payment**: Staging environment may have connectivity issues. If payment gateway times out, use Cash payment method and document the issue.
- **Email Delivery**: Check spam folder if voucher emails not received within 5 minutes.
- **PDF Generation**: Large batch PDFs (100+ vouchers) may take 1-2 minutes to generate.
- **USB Scanner**: Works as keyboard wedge - no drivers needed. If scanner not detecting, check USB connection.
- **Mobile Camera**: Requires HTTPS or localhost. Camera access must be allowed in browser settings.
- **Session Timeout**: Default 30 minutes. You'll need to re-login if idle too long.

---

## 14. CONTACT & SUPPORT

If you encounter issues during testing:

- **Technical Issues**: Contact IT Support (support@greenpay.com)
- **Questions**: Contact Flex Admin (flexadmin@greenpay.com)
- **Report Bugs**: Create issue in bug tracker or email development team

---

## 15. TEST DATA SUMMARY

### Sample Passport Numbers (Use for Testing)
- N1234567, N7654321, N1111111, N2222222, N3333333, N8888888, N9999999

### Sample Company Names
- ABC Corporation, Test Company Ltd, XYZ Limited

### Test Email
- Use your own email for receiving vouchers/notifications

### Test Payment Cards (BSP DOKU Staging)
- **Success**: 4000000000000002
- **Expiry**: 12/25
- **CVV**: 123
- **Name**: TEST USER

---

**END OF TESTING GUIDE**

---

**Testing Team**: Please complete all sections and submit results with evidence (screenshots, PDFs, bug reports) to the QA Manager.

**Estimated Testing Time**: 6-8 hours for complete testing (all roles, all scenarios)

**Priority Scenarios** (if time limited):
1. Individual Passport Purchase (2.2)
2. Scan & Validate (2.5)
3. Corporate Quotation to Invoice Flow (3.1 + 3.2)
4. Public Voucher Purchase (5.1)
5. Bulk Upload (2.4)
